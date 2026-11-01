import { createRequire } from 'node:module'
import { act, createElement, type ReactNode } from 'react'
import { expect, test } from 'vitest'
import { HeroWorkspaceQuestion, openHeroWorkspacePicker, readHeroWorkspaceName } from '../src/client/HeroWorkspaceQuestion.tsx'
import { useHeroPhase } from '../src/client/CodexSidebar.tsx'
import { zh } from '../src/client/locales.ts'

const { createRoot } = createRequire(import.meta.url)('react-dom/client') as { createRoot: (el: HTMLElement) => { render: (node: ReactNode) => void; unmount: () => void } }
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const t = (key: string, params?: Record<string, unknown>): string => {
  let text: string = zh[key as keyof typeof zh]
  for (const [name, value] of Object.entries(params ?? {})) text = text.replace(`{${name}}`, String(value))
  return text
}

test('新建页中部显示当前工作区提问，跟随切换实时更新', async () => {
  document.body.innerHTML = '<div id="mount"></div><main data-phase="hero"><div class="host_composerHero"><div><div class="host_stack"><div class="host_headline"><span class="host_fishHitbox"></span><span class="host_titleGroup">探索未至之境</span></div></div></div><div class="host_heroWorkspaceRow"><button class="host_workspace" aria-label="选择工作区"><span class="host_workspaceLabel">默认工作区</span></button></div></div></main>'
  const main = document.querySelector('main')!
  const root = createRoot(document.querySelector('#mount')!)
  try {
    await act(async () => root.render(createElement(HeroWorkspaceQuestion, { t })))
    expect(document.querySelector('.dcu-hero-question')?.textContent).toBe('我们应该在默认工作区中做些什么？')
    // 工作区名是可点按钮，点击转发到宿主工作区 chip。
    let chipClicks = 0
    document.querySelector('.host_workspace')!.addEventListener('click', () => { chipClicks += 1 })
    await act(async () => document.querySelector<HTMLButtonElement>('.dcu-hero-workspace')!.click())
    expect(chipClicks).toBe(1)
    // 弹窗已展开时再次点击：pointerdown 时记录已展开（外部点击随即关闭弹窗），click 不再重复打开。
    await act(async () => { document.querySelector('.host_workspace')!.setAttribute('aria-expanded', 'true') })
    await act(async () => document.querySelector<HTMLButtonElement>('.dcu-hero-workspace')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
    await act(async () => document.querySelector<HTMLButtonElement>('.dcu-hero-workspace')!.click())
    expect(chipClicks).toBe(1)
    await act(async () => { document.querySelector('.host_workspace')!.setAttribute('aria-expanded', 'false') })
    // 占位状态下提问退化为纯文本，不再渲染按钮。
    await act(async () => { document.querySelector('.host_workspaceLabel')!.textContent = '选择工作区' })
    expect(document.querySelector('.dcu-hero-workspace')).toBeNull()
    expect(document.querySelector('.dcu-hero-question')?.textContent).toBe('我们应该做些什么？')
    await act(async () => { document.querySelector('.host_workspaceLabel')!.textContent = '默认工作区' })
    // 工作区 chip 改名（切换工作区）后标题跟随更新。
    await act(async () => { document.querySelector('.host_workspaceLabel')!.textContent = 'auto_mode' })
    expect(document.querySelector('.dcu-hero-question')?.textContent).toBe('我们应该在auto_mode中做些什么？')
    // 占位状态（未选工作区）回落到无工作区名的提问。
    await act(async () => { document.querySelector('.host_workspaceLabel')!.textContent = '选择工作区' })
    expect(document.querySelector('.dcu-hero-question')?.textContent).toBe('我们应该做些什么？')
    // 离开新建页时 portal 消失，宿主标题保持完整。
    await act(async () => { main.dataset.phase = 'active' })
    expect(document.querySelector('.dcu-hero-question')).toBeNull()
    expect(document.querySelector('.host_headline')?.textContent).toBe('探索未至之境')
    // 回到新建页后恢复。
    await act(async () => { main.dataset.phase = 'hero' })
    expect(document.querySelector('.dcu-hero-question')?.textContent).toBe('我们应该做些什么？')
  } finally {
    await act(async () => root.unmount())
    expect(document.querySelector('.dcu-hero-question')).toBeNull()
    document.body.innerHTML = ''
  }
})

test('打开选择器时弹层锚点抬到文字上方，关闭后恢复原始测量', async () => {
  document.body.innerHTML = '<main data-phase="hero"><div class="host_heroWorkspaceRow"><button class="host_workspace" aria-label="选择工作区" aria-expanded="true"><span class="host_workspaceLabel">默认工作区</span></button></div><button id="source">默认工作区</button></main>'
  const chip = document.querySelector<HTMLElement>('.host_workspace')!
  const source = document.querySelector<HTMLElement>('#source')!
  let clicks = 0
  chip.addEventListener('click', () => { clicks += 1 })
  const before = chip.getBoundingClientRect()
  openHeroWorkspacePicker(source)
  expect(clicks).toBe(1)
  // jsdom 布局全零：锚点 bottom 被抬到文字上方（0 - 0 - 8），弹层 side=bottom 因此落在文字上方。
  expect(chip.getBoundingClientRect().bottom).toBe(before.bottom - 8)
  // 代理打开期间 chip 带压背景标记。
  expect(chip.hasAttribute('data-dcu-proxy')).toBe(true)
  // aria-expanded 保持 true 期间不恢复；复位后恢复原始测量并去掉标记。
  chip.setAttribute('aria-expanded', 'false')
  await new Promise(resolve => setTimeout(resolve))
  expect(chip.getBoundingClientRect().bottom).toBe(before.bottom)
  expect(chip.hasAttribute('data-dcu-proxy')).toBe(false)
  document.body.innerHTML = ''
})

test('home 键高亮跟随宿主会话 phase', async () => {
  document.body.innerHTML = '<div id="mount"></div><main data-phase="hero"></main>'
  const main = document.querySelector('main')!
  const root = createRoot(document.querySelector('#mount')!)
  const Probe = () => createElement('span', { 'data-home': String(useHeroPhase()) })
  try {
    await act(async () => root.render(createElement(Probe)))
    expect(document.querySelector('[data-home]')?.getAttribute('data-home')).toBe('true')
    await act(async () => { main.dataset.phase = 'active' })
    expect(document.querySelector('[data-home]')?.getAttribute('data-home')).toBe('false')
    await act(async () => { main.dataset.phase = 'hero' })
    expect(document.querySelector('[data-home]')?.getAttribute('data-home')).toBe('true')
  } finally {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
  }
})

test('readHeroWorkspaceName 区分已选工作区与占位文案', () => {
  document.body.innerHTML = ''
  expect(readHeroWorkspaceName()).toBe('')
  document.body.innerHTML = '<div data-phase="hero"><div class="host_heroWorkspaceRow"><button class="host_workspace" aria-label="选择工作区"><span class="host_workspaceLabel">  我的项目  </span></button></div></div>'
  expect(readHeroWorkspaceName()).toBe('我的项目')
  document.querySelector('.host_workspaceLabel')!.textContent = '选择工作区'
  expect(readHeroWorkspaceName()).toBe('')
  document.body.innerHTML = ''
})
