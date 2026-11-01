import { createRequire } from 'node:module'
import { afterEach, expect, test, vi } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import {
  addStudioHistory, buildGenerateRequest, expandGenerateResponse, HISTORY_LIMIT, inspirationImageUrl,
  readStudioHistory, type StudioConfig, type StudioHistoryItem,
} from '../src/client/image-studio.ts'
import { ImageStudioPanel } from '../src/client/ImageStudioPanel.tsx'
import { zh } from '../src/client/locales.ts'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

const attachment = (id: string): ImageAttachmentRef => ({ attachmentId: id as ImageAttachmentRef['attachmentId'], mediaType: 'image/png', bytes: 1, width: 8, height: 8 })

const config: StudioConfig = {
  providers: [
    { provider: 'seedream', label: 'Seedream', model: 'doubao-seedream', configured: true, supportsEditing: true, defaultRatio: '1:1', defaultQuality: '2k' },
    { provider: 'google', channel: 'a', label: 'Google', model: 'gemini-image', configured: true, supportsEditing: false, defaultRatio: '3:4', defaultQuality: 'high' },
  ],
  activeProvider: 'seedream',
}

const historyItem = (id: string, createdAt = 1): StudioHistoryItem => ({
  attachment: attachment(id), output: 'url', provider: 'seedream', model: 'doubao-seedream', prompt: `p-${id}`, createdAt,
})

afterEach(() => {
  globalThis.localStorage?.clear()
})

test('buildGenerateRequest 装配 active provider 的 profile 与字段', () => {
  const request = buildGenerateRequest(config, ' 一只猫 ')
  expect(request).toEqual({ mode: 'generate', provider: 'seedream', model: 'doubao-seedream', prompt: '一只猫', ratio: '1:1', quality: '2k' })
})

test('activeChannel 参与匹配，不匹配时回退同 provider 的唯一 profile', () => {
  const withChannel: StudioConfig = { providers: config.providers, activeProvider: 'google', activeChannel: 'b' }
  const request = buildGenerateRequest(withChannel, 'x')
  expect(request.provider).toBe('google')
  // 回退到该 provider 仅有的 channel 'a'，而不是跳到别的 provider。
  expect(request.channel).toBe('a')
  const none: StudioConfig = { providers: [{ ...config.providers[0], configured: false }], activeProvider: 'seedream' }
  expect(() => buildGenerateRequest(none, 'x')).toThrow('no-configured-provider')
})

test('edit 模式携带 reference attachment', () => {
  const reference = attachment('ref-1')
  const request = buildGenerateRequest(config, '改成夜景', 'edit', reference)
  expect(request.mode).toBe('edit')
  expect(request.references).toEqual([{ attachment: reference }])
})

test('expandGenerateResponse 单图归一、批量展开 items', () => {
  const single = { attachment: attachment('a'), output: 'o', provider: 'seedream', model: 'm', prompt: 'p', createdAt: 7 }
  expect(expandGenerateResponse(single)).toEqual([{ attachment: single.attachment, output: 'o', provider: 'seedream', model: 'm', prompt: 'p', createdAt: 7, ratio: undefined }])
  const batch = { ...single, items: [{ attachment: attachment('b'), output: 'o1' }, { attachment: attachment('c'), output: 'o2' }] }
  expect(expandGenerateResponse(batch).map(item => item.attachment.attachmentId)).toEqual(['b', 'c'])
})

test('历史记录新条目在前、超限裁剪最旧', () => {
  let items: StudioHistoryItem[] = []
  for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) items = addStudioHistory(items, historyItem(`id-${index}`, index))
  expect(items).toHaveLength(HISTORY_LIMIT)
  expect(items[0]?.prompt).toBe(`p-id-${HISTORY_LIMIT + 4}`)
  expect(items.at(-1)?.prompt).toBe(`p-id-5`)
  expect(readStudioHistory(globalThis.localStorage).at(-1)?.prompt).toBe('p-id-5')
})

test('readStudioHistory 对坏数据与缺失存储返回空数组', () => {
  expect(readStudioHistory(undefined)).toEqual([])
  globalThis.localStorage?.setItem('dcu.imageStudio.history', '{broken')
  expect(readStudioHistory(globalThis.localStorage)).toEqual([])
  globalThis.localStorage?.setItem('dcu.imageStudio.history', JSON.stringify([{ prompt: 'p', createdAt: 1 }]))
  expect(readStudioHistory(globalThis.localStorage)).toEqual([])
})

test('inspirationImageUrl 对 id 做 URI 编码', () => {
  expect(inspirationImageUrl('src/1', 'case 2')).toBe('/plugins/dsh-image-gen/inspiration/image/src%2F1/case%202')
})

// —— 面板集成（jsdom + stub fetch） ——

const { createRoot } = createRequire(import.meta.url)('react-dom/client') as { createRoot: (el: HTMLElement) => { render: (node: ReactNode) => void, unmount: () => void } }
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const t = (key: string, params?: Record<string, unknown>): string => {
  let text: string = zh[key as keyof typeof zh]
  for (const [name, value] of Object.entries(params ?? {})) text = text.replace(`{${name}}`, String(value))
  return text
}

const STUB_ATTACHMENT = { attachmentId: 'att-1', mediaType: 'image/png', bytes: 4, width: 16, height: 16 }
const STUB_CONFIG = {
  providers: [{ provider: 'seedream', label: 'Seedream', model: 'doubao-seedream', configured: true, supportsEditing: true, defaultRatio: '1:1', defaultQuality: '2k' }],
  activeProvider: 'seedream',
}
const STUB_CATALOG = {
  sources: [{ id: 'awesome-gpt-image-2', label: '案例库', categories: ['品牌 Logo'], cases: [
    { id: 'case-1', title: '城市海报', prompt: 'P1', category: '建筑空间', featured: false },
    { id: 'case-2', title: ' Nike 鞋', prompt: 'P2', category: '品牌 Logo', featured: false },
  ] }],
}

/** fetch 桩：按 URL 分流，记录调用。 */
function stubFetch(overrides: Record<string, unknown> = {}): ReturnType<typeof vi.fn> {
  const calls: { url: string, init?: RequestInit }[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, init })
    const respond = (payload: unknown, ok = true) => ({ ok, status: ok ? 200 : 404, json: async () => payload })
    if (url.includes('settings-health')) return respond(overrides.health ?? { settings: 'live', liveSchema: true }, overrides.healthOk !== false)
    if (url.endsWith('/studio') && (init?.method ?? 'GET') === 'GET') return respond(overrides.config ?? STUB_CONFIG, overrides.configOk !== false)
    if (url.endsWith('/studio')) return respond(overrides.generate ?? { ...STUB_CONFIG, ...STUB_ATTACHMENT, output: 'o', prompt: 'x', createdAt: 1, elapsedMs: 1 }, overrides.generateOk !== false)
    if (url.includes('/inspiration/catalog')) return respond(overrides.catalog ?? STUB_CATALOG, overrides.catalogOk !== false)
    if (url.includes('/inspiration/image/')) return { ok: true, status: 200, blob: async () => new Blob() }
    if (url.endsWith('/image')) return { ok: true, status: 200, blob: async () => new Blob() }
    return respond({}, false)
  })
  ;(fetch as unknown as { calls: unknown[] }).calls = calls
  return fetch
}

/** 挂载面板；返回 flush 与收尾函数（unmount + 还原 fetch）。 */
async function mountPanel(fetchStub: ReturnType<typeof vi.fn>, props: Record<string, unknown> = {}): Promise<{ flush: () => Promise<void>, cleanup: () => Promise<void> }> {
  const previousFetch = globalThis.fetch
  globalThis.fetch = fetchStub as unknown as typeof fetch
  document.body.innerHTML = '<div id="mount"></div>'
  const root = createRoot(document.querySelector('#mount')!)
  const flush = async (): Promise<void> => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) }) }
  await act(async () => root.render(createElement(ImageStudioPanel, { t, ...props })))
  await flush()
  return {
    flush,
    cleanup: async () => {
      await act(async () => root.unmount())
      globalThis.fetch = previousFetch
      document.body.innerHTML = ''
    },
  }
}

const setInput = (value: string): void => {
  const input = document.querySelector<HTMLTextAreaElement>('[data-dcu-studio-input]')!
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

test('插件缺席时面板显示不可用提示，不渲染模板', async () => {
  const panel = await mountPanel(stubFetch({ healthOk: false }))
  try {
    expect(document.querySelector('[data-dcu-image-studio]')?.textContent).toContain(t('studio.pluginUnavailable'))
    expect(document.querySelector('[data-dcu-studio-input]')).toBeNull()
  } finally { await panel.cleanup() }
})

test('模板渲染、分类筛选、点卡片填 prompt', async () => {
  const panel = await mountPanel(stubFetch())
  try {
    expect(document.querySelectorAll('.dcu-image-studio-card').length).toBe(2)
    const chips = [...document.querySelectorAll<HTMLButtonElement>('.dcu-image-studio-chip')]
    expect(chips.map(chip => chip.textContent)).toEqual([t('studio.allCategories'), '建筑空间', '品牌 Logo'])
    await act(async () => chips.find(chip => chip.textContent === '品牌 Logo')!.click())
    expect(document.querySelectorAll('.dcu-image-studio-card').length).toBe(1)
    await act(async () => document.querySelector<HTMLElement>('.dcu-image-studio-card')!.click())
    expect(document.querySelector<HTMLTextAreaElement>('[data-dcu-studio-input]')!.value).toBe('P2')
  } finally { await panel.cleanup() }
})

test('生成流程：装配请求体、写入历史、GridReveal 揭示位接管', async () => {
  vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} })
  const fetchStub = stubFetch({ generate: { attachment: STUB_ATTACHMENT, output: 'o', provider: 'seedream', model: 'doubao-seedream', prompt: '一只猫', createdAt: 42, elapsedMs: 5 } })
  const panel = await mountPanel(fetchStub)
  try {
    const calls = (fetchStub as unknown as { calls: { url: string, init?: RequestInit }[] }).calls
    const studioPosts = () => calls.filter(call => call.url.endsWith('/studio') && call.init?.method === 'POST')
    await act(async () => setInput('一只猫'))
    await act(async () => document.querySelector<HTMLButtonElement>('[data-dcu-studio-composer] .dcu-image-studio-send')!.click())
    expect(studioPosts()).toHaveLength(1)
    expect(JSON.parse(String(studioPosts()[0]?.init?.body))).toMatchObject({ mode: 'generate', provider: 'seedream', model: 'doubao-seedream', prompt: '一只猫', ratio: '1:1', quality: '2k' })
    // 提交瞬间就在记录页：网格动画当着用户跑。
    expect(document.querySelector('[role="tab"][data-active]')?.textContent).toBe(t('studio.tabHistory'))
    expect(document.querySelector('[data-dcu-studio-reveal] [data-slot="grid-reveal"]')).not.toBeNull()
    await panel.flush()
    // 生成成功：揭示位继续在场（src 翻到真实 url 触发揭示），旧记录卡不重复出现。
    expect(document.querySelector('[data-dcu-studio-reveal] [data-slot="grid-reveal"]')).not.toBeNull()
    expect(document.querySelectorAll('.dcu-image-studio-card').length).toBe(0)
    // 输入框清空、历史已持久化。
    expect(document.querySelector<HTMLTextAreaElement>('[data-dcu-studio-input]')!.value).toBe('')
    expect(readStudioHistory(globalThis.localStorage).map(item => item.createdAt)).toEqual([42])
    // 再次切回模板页确认页签往返。
    await act(async () => document.querySelector<HTMLButtonElement>('[role="tab"]')!.click())
    expect(document.querySelectorAll('.dcu-image-studio-card').length).toBe(2)
  } finally {
    await panel.cleanup()
    vi.unstubAllGlobals()
  }
})

test('大图浮层提供下载/复制/以此图编辑，编辑模式出 edit 请求', async () => {
  vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} })
  // 预置一条已落地的历史记录（jsdom 无 canvas/图片解码，GridReveal 的揭示不会触发，
  // 面板交互链路用预置记录测，动画时序由真机验证）。
  globalThis.localStorage?.setItem('dcu.imageStudio.history', JSON.stringify([{
    attachment: { attachmentId: 'seed-1', mediaType: 'image/png', bytes: 4, width: 16, height: 16 },
    output: '', provider: 'seedream', model: 'doubao-seedream', prompt: '一只猫', createdAt: 1,
  }]))
  const fetchStub = stubFetch({ generate: { attachment: STUB_ATTACHMENT, output: 'o', provider: 'seedream', model: 'doubao-seedream', prompt: '一只猫', createdAt: 42, elapsedMs: 5 } })
  const panel = await mountPanel(fetchStub)
  try {
    const calls = (fetchStub as unknown as { calls: { url: string, init?: RequestInit }[] }).calls
    // 初始在模板页，先切到记录页再点预置记录的卡片。
    await act(async () => document.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]!.click())
    expect(document.querySelectorAll('.dcu-image-studio-card').length).toBe(1)
    await act(async () => document.querySelector<HTMLElement>('.dcu-image-studio-card')!.click())
    const lightbox = document.querySelector('.dcu-image-studio-lightbox')!
    expect(lightbox).not.toBeNull()
    const actions = [...lightbox.querySelectorAll<HTMLButtonElement>('.dcu-image-studio-action')].map(button => button.textContent)
    expect(actions).toEqual([t('studio.download'), t('studio.copyPrompt'), t('studio.editFrom')])
    await act(async () => lightbox.querySelectorAll<HTMLButtonElement>('.dcu-image-studio-action')[2]!.click())
    expect(document.querySelector('.dcu-image-studio-lightbox')).toBeNull()
    expect(document.querySelector('.dcu-image-studio-reference')).not.toBeNull()
    // 编辑模式提交 → mode: edit + references；同时出现 GridReveal 揭示位。
    await act(async () => setInput('改成夜景'))
    await act(async () => document.querySelector<HTMLButtonElement>('.dcu-image-studio-send')!.click())
    const posts = calls.filter(call => call.url.endsWith('/studio') && call.init?.method === 'POST')
    expect(JSON.parse(String(posts.at(-1)?.init?.body))).toMatchObject({ mode: 'edit', references: [{ attachment: { attachmentId: 'seed-1' } }] })
    expect(document.querySelector('[data-dcu-studio-reveal] [data-slot="grid-reveal"]')).not.toBeNull()
  } finally {
    await panel.cleanup()
    vi.unstubAllGlobals()
  }
})

test('生成失败显示错误与重试', async () => {
  const fetchStub = stubFetch({ generateOk: false })
  const panel = await mountPanel(fetchStub)
  try {
    await act(async () => setInput('一只猫'))
    await act(async () => document.querySelector<HTMLButtonElement>('.dcu-image-studio-send')!.click())
    await panel.flush()
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(t('studio.generateFailed'))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(t('studio.retry'))
  } finally { await panel.cleanup() }
})

test('原版工作台入口：页签在场才显示，点击调起 sidebarRight.openTab', async () => {
  const openStudioWorkbench = vi.fn(() => true)
  const panel = await mountPanel(stubFetch(), { openStudioWorkbench, workbenchAvailable: () => true })
  try {
    const button = document.querySelector<HTMLButtonElement>('[data-dcu-studio-workbench]')
    expect(button?.textContent).toBe(t('studio.workbench'))
    await act(async () => button!.click())
    expect(openStudioWorkbench).toHaveBeenCalledTimes(1)
    // 调起失败（宿主侧缺席）时入口退场，不留死按钮。
    await act(async () => button!.click())
    expect(openStudioWorkbench).toHaveBeenCalledTimes(2)
  } finally { await panel.cleanup() }
  const fallback = await mountPanel(stubFetch(), { openStudioWorkbench, workbenchAvailable: () => false })
  try {
    expect(document.querySelector('[data-dcu-studio-workbench]')).toBeNull()
  } finally { await fallback.cleanup() }
})
