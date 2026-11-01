/**
 * 生图模式数据层：直连 dsh-image-gen 的同源 HTTP 路由（不经过会话模型）。
 * 路由契约来自 dsh-image-gen 的 shared.d.ts（studio/image/inspiration/settings-health），
 * 这里只定义用到的结构子集，不引入对 dsh-image-gen 包的依赖。
 */
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import { browserStorage } from './tree-expansion.ts'

/** image-studio 全局面板 id：panellist 与 main 的 key 共用。 */
export const IMAGE_STUDIO_PANEL_ID = 'image-studio'
/**
 * dsh-image-gen 注册的右侧栏工作台页签 id（client.js SIDEBAR_STUDIO_TAB_ID）。
 * 通过宿主 sidebarRight.openTab 调起的就是这套原版工作台（无限画布 + 生成面板）。
 */
export const STUDIO_SIDEBAR_TAB_ID = 'dsh-image-gen/studio'
export const STUDIO_HEALTH_ROUTE = '/plugins/dsh-image-gen/settings-health'
export const STUDIO_ROUTE = '/plugins/dsh-image-gen/studio'
export const STUDIO_IMAGE_ROUTE = '/plugins/dsh-image-gen/image'
export const STUDIO_INSPIRATION_CATALOG_ROUTE = '/plugins/dsh-image-gen/inspiration/catalog'
export const HISTORY_STORAGE_KEY = 'dcu.imageStudio.history'
export const HISTORY_LIMIT = 100
/** blob objectURL 缓存上限：超出后从最旧开始 revoke，防长会话内存泄漏。 */
export const BLOB_URL_CACHE_LIMIT = 60

/** StudioProviderProfile 的结构子集（见 dsh-image-gen shared.d.ts）。 */
export interface StudioProviderProfile {
  provider: string
  channel?: string
  label: string
  model: string
  configured: boolean
  supportsEditing: boolean
  defaultRatio: string
  defaultQuality: string
}

/** StudioConfigResponse 的结构子集。 */
export interface StudioConfig {
  providers: StudioProviderProfile[]
  activeProvider: string
  activeChannel?: string
}

/** StudioGenerateRequest 的结构子集。 */
export interface StudioGenerateRequest {
  mode: 'generate' | 'edit'
  provider: string
  channel?: string
  model: string
  prompt: string
  ratio: string
  quality: string
  references?: readonly { attachment: ImageAttachmentRef }[]
}

/** StudioGenerateResponse 的结构子集；批量时 items 逐张展开。 */
export interface StudioGenerateResult {
  attachment: ImageAttachmentRef
  output: string
  provider: string
  channel?: string
  model: string
  prompt: string
  createdAt: number
}

export interface StudioGenerateResponse extends StudioGenerateResult {
  items?: readonly { attachment: ImageAttachmentRef, output: string, savedTo?: string }[]
  errors?: readonly { index: number, message: string }[]
}

/** 一条生成记录：attachment ref 可持久化（宿主附件存储是持久的）。 */
export interface StudioHistoryItem extends StudioGenerateResult {
  ratio?: string
}

/** 灵感库一条案例的结构子集（见 dsh-image-gen inspiration.d.ts）。 */
export interface InspirationCase {
  sourceId: string
  id: string
  title: string
  prompt: string
  category: string
}

/** 灵感图由宿主路由代理缓存，浏览器侧不用拼镜像 URL。 */
export function inspirationImageUrl(sourceId: string, caseId: string): string {
  return `/plugins/dsh-image-gen/inspiration/image/${encodeURIComponent(sourceId)}/${encodeURIComponent(caseId)}`
}

/** dsh-image-gen 是否已安装（路由 404 = 未装；settings 存在即插件在位）。 */
export async function isImageStudioAvailable(): Promise<boolean> {
  try {
    const response = await fetch(STUDIO_HEALTH_ROUTE, { credentials: 'same-origin' })
    return response.ok
  } catch {
    return false
  }
}

/** 读工作台配置；插件未装或未配置时返回 null。 */
export async function fetchStudioConfig(): Promise<StudioConfig | null> {
  const response = await fetch(STUDIO_ROUTE, { credentials: 'same-origin' })
  if (!response.ok) return null
  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null) return null
  const { providers, activeProvider } = payload as Record<string, unknown>
  if (!Array.isArray(providers) || providers.length === 0 || typeof activeProvider !== 'string') return null
  const profiles = providers.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return []
    const profile = entry as Record<string, unknown>
    if (typeof profile.provider !== 'string' || typeof profile.label !== 'string' || typeof profile.model !== 'string') return []
    return [{
      provider: profile.provider,
      ...(typeof profile.channel === 'string' ? { channel: profile.channel } : {}),
      label: profile.label,
      model: profile.model,
      configured: profile.configured === true,
      supportsEditing: profile.supportsEditing === true,
      defaultRatio: typeof profile.defaultRatio === 'string' ? profile.defaultRatio : '1:1',
      defaultQuality: typeof profile.defaultQuality === 'string' ? profile.defaultQuality : 'auto',
    } satisfies StudioProviderProfile]
  })
  return { providers: profiles, activeProvider, ...(typeof (payload as Record<string, unknown>).activeChannel === 'string' ? { activeChannel: (payload as Record<string, unknown>).activeChannel as string } : {}) }
}

/** 从配置装配一次生成请求：active provider+channel 的 profile，退而求首个 configured。未配置时抛错。 */
export function buildGenerateRequest(config: StudioConfig, prompt: string, mode: 'generate' | 'edit' = 'generate', reference?: ImageAttachmentRef): StudioGenerateRequest {
  const matches = (profile: StudioProviderProfile): boolean => profile.provider === config.activeProvider
    && (config.activeChannel === undefined || profile.channel === config.activeChannel)
  const profile = config.providers.find(matches) ?? config.providers.find(entry => entry.provider === config.activeProvider) ?? config.providers.find(entry => entry.configured)
  if (profile === undefined || !profile.configured) throw new Error('no-configured-provider')
  return {
    mode,
    provider: profile.provider,
    ...(profile.channel === undefined ? {} : { channel: profile.channel }),
    model: profile.model,
    prompt: prompt.trim(),
    ratio: profile.defaultRatio,
    quality: profile.defaultQuality,
    ...(mode === 'edit' && reference !== undefined ? { references: [{ attachment: reference }] } : {}),
  }
}

/** 展开 StudioGenerateResponse：单图归一为一张，批量展开 items（失败的次张记录进 errors 由调用方呈现）。 */
export function expandGenerateResponse(response: StudioGenerateResponse): StudioHistoryItem[] {
  const base = { provider: response.provider, ...(response.channel === undefined ? {} : { channel: response.channel }), model: response.model, prompt: response.prompt, createdAt: response.createdAt }
  const items = Array.isArray(response.items) && response.items.length > 0
    ? response.items.map(item => ({ attachment: item.attachment, output: item.output, ...base }))
    : [{ attachment: response.attachment, output: response.output, ...base }]
  return items.map(item => ({ ...item, ratio: undefined }))
}

/** 发起一次生成；非 2xx 或错误体时抛出可展示的消息。 */
export async function generateImage(request: StudioGenerateRequest, signal?: AbortSignal): Promise<StudioGenerateResponse> {
  const response = await fetch(STUDIO_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok || typeof payload !== 'object' || payload === null || !('attachment' in payload)) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof (payload as Record<string, unknown>).error === 'string'
      ? (payload as Record<string, unknown>).error as string
      : `HTTP ${response.status}`
    throw new Error(message)
  }
  return payload as StudioGenerateResponse
}

const blobUrlCache = new Map<string, string>()

/** 取生成图的 blob objectURL（同 ref 命中缓存）；缓存超限从最旧开始 revoke。 */
export async function fetchImageBlobUrl(attachment: ImageAttachmentRef): Promise<string> {
  const key = JSON.stringify(attachment)
  const cached = blobUrlCache.get(key)
  if (cached !== undefined) return cached
  const response = await fetch(STUDIO_IMAGE_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ attachment }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const url = URL.createObjectURL(await response.blob())
  blobUrlCache.set(key, url)
  if (blobUrlCache.size > BLOB_URL_CACHE_LIMIT) {
    const oldest = blobUrlCache.keys().next().value
    if (oldest !== undefined) {
      URL.revokeObjectURL(blobUrlCache.get(oldest) ?? '')
      blobUrlCache.delete(oldest)
    }
  }
  return url
}

/** 读取灵感库（宿主端已解析好的目录）；失败返回 null。 */
export async function fetchInspirationCatalog(): Promise<InspirationCase[]> {
  const response = await fetch(STUDIO_INSPIRATION_CATALOG_ROUTE, { credentials: 'same-origin' })
  if (!response.ok) return []
  const payload: unknown = await response.json()
  const sources = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>).sources : undefined
  if (!Array.isArray(sources)) return []
  return sources.flatMap((source: unknown) => {
    if (typeof source !== 'object' || source === null) return []
    const { id: sourceId, cases } = source as Record<string, unknown>
    if (typeof sourceId !== 'string' || !Array.isArray(cases)) return []
    return cases.flatMap((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return []
      const item = entry as Record<string, unknown>
      if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.prompt !== 'string') return []
      return [{
        sourceId,
        id: item.id,
        title: item.title,
        prompt: item.prompt,
        category: typeof item.category === 'string' ? item.category : '',
      } satisfies InspirationCase]
    })
  })
}

/** 读本地生成记录；坏数据一律当空处理（记录只是加速器，丢了不影响功能）。 */
export function readStudioHistory(storage: Storage | undefined = browserStorage()): StudioHistoryItem[] {
  if (storage === undefined) return []
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    const parsed: unknown = raw === null ? [] : JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return []
      const item = entry as Record<string, unknown>
      const attachment = item.attachment as ImageAttachmentRef | undefined
      if (typeof attachment !== 'object' || attachment === null || typeof attachment.attachmentId !== 'string') return []
      if (typeof item.prompt !== 'string' || typeof item.createdAt !== 'number') return []
      return [{
        attachment,
        output: typeof item.output === 'string' ? item.output : '',
        provider: typeof item.provider === 'string' ? item.provider : '',
        model: typeof item.model === 'string' ? item.model : '',
        prompt: item.prompt,
        createdAt: item.createdAt,
        ...(typeof item.ratio === 'string' ? { ratio: item.ratio } : {}),
      } satisfies StudioHistoryItem]
    })
  } catch { return [] }
}

/** 追加一条生成记录（新记录在前），超限从最旧裁剪后持久化。 */
export function addStudioHistory(existing: StudioHistoryItem[], item: StudioHistoryItem, storage: Storage | undefined = browserStorage()): StudioHistoryItem[] {
  const next = [item, ...existing].slice(0, HISTORY_LIMIT)
  try { storage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next)) } catch { /* 存储不可用时记录只在内存。 */ }
  return next
}
