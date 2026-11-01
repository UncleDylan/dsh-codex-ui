/** 生图模式面板：灵感模板卡墙 + 底部输入框，生成直连 dsh-image-gen 的 studio 路由。 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import { NS } from './locales.ts'
import { IMAGE_STUDIO_STYLE } from './image-studio-style.ts'
import { GridReveal } from './GridReveal.tsx'
import {
  addStudioHistory, buildGenerateRequest, expandGenerateResponse, fetchImageBlobUrl, fetchInspirationCatalog,
  fetchStudioConfig, generateImage, inspirationImageUrl, isImageStudioAvailable, readStudioHistory,
  type InspirationCase, type StudioConfig, type StudioHistoryItem,
} from './image-studio.ts'

type Tab = 'templates' | 'history'
type InspirationState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready', cases: InspirationCase[] }

/** 记录卡片：懒取 blob objectURL（命中 image-studio.ts 的全局 LRU，不逐组件 revoke）。 */
function HistoryCard({ item, t, onOpen }: { item: StudioHistoryItem, t: PropsLocale<typeof NS>['t'], onOpen: (item: StudioHistoryItem) => void }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    fetchImageBlobUrl(item.attachment).then(url => { if (alive) setSrc(url) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [item.attachment])
  if (failed) return <figure className="dcu-image-studio-card" onClick={() => { /* 加载失败的卡片不可打开 */ }} data-dcu-studio-failed><img alt="" aria-hidden="true" src="" /><figcaption>{t('studio.generateFailed')}</figcaption></figure>
  return <figure className="dcu-image-studio-card" onClick={() => onOpen(item)}>
    {src === '' ? <img alt="" aria-hidden="true" src="" /> : <img alt={item.prompt.slice(0, 80)} loading="lazy" src={src} />}
    <figcaption>{item.prompt}</figcaption>
  </figure>
}

/** 大图浮层：下载 / 复制 Prompt / 以此图编辑。 */
function Lightbox({ item, src, t, onClose, onEditFrom }: {
  item: StudioHistoryItem, src: string, t: PropsLocale<typeof NS>['t'], onClose: () => void, onEditFrom: (item: StudioHistoryItem) => void
}) {
  const [copied, setCopied] = useState(false)
  const download = (): void => {
    const extension = item.attachment.mediaType.includes('jpeg') ? 'jpg' : item.attachment.mediaType.includes('webp') ? 'webp' : 'png'
    const anchor = document.createElement('a')
    anchor.href = src
    anchor.download = item.attachment.name ?? `image-${item.createdAt}.${extension}`
    anchor.click()
  }
  const copyPrompt = (): void => {
    void navigator.clipboard?.writeText(item.prompt).then(() => {
      setCopied(true)
      window.setTimeout(() => { setCopied(false) }, 1500)
    }).catch(() => { /* 剪贴板不可用时静默。 */ })
  }
  return <div className="dcu-image-studio-lightbox" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="dcu-image-studio-lightbox-close" aria-label={t('studio.removeReference')} onClick={onClose}>×</button>
    <img alt={item.prompt.slice(0, 80)} src={src} />
    <p className="dcu-image-studio-lightbox-prompt">{item.prompt}</p>
    <p className="dcu-image-studio-lightbox-meta">{[item.provider, item.model].filter(Boolean).join(' · ')}</p>
    <div className="dcu-image-studio-lightbox-actions">
      <button type="button" className="dcu-image-studio-action" onClick={download}>{t('studio.download')}</button>
      <button type="button" className="dcu-image-studio-action" onClick={copyPrompt}>{copied ? t('studio.copied') : t('studio.copyPrompt')}</button>
      <button type="button" className="dcu-image-studio-action" onClick={() => onEditFrom(item)}>{t('studio.editFrom')}</button>
    </div>
  </div>
}

/** 中列生图面板；由 index.ts 注册进 main 插槽（key = image-studio）。 */
export function ImageStudioPanel({ t, openStudioWorkbench, workbenchAvailable }: PropsLocale<typeof NS> & {
  /** 调起 dsh-image-gen 的原版工作台（右侧栏无限画布）；返回 false 表示宿主侧不可用。 */
  openStudioWorkbench?: () => boolean
  /** 原版工作台页签是否在场（dsh-image-gen 未装/宿主过旧时缺席）。 */
  workbenchAvailable?: () => boolean
}) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [config, setConfig] = useState<StudioConfig | null>(null)
  const [tab, setTab] = useState<Tab>('templates')
  const [inspiration, setInspiration] = useState<InspirationState>({ kind: 'loading' })
  const [category, setCategory] = useState<string | null>(null)
  const [history, setHistory] = useState<StudioHistoryItem[]>([])
  const [prompt, setPrompt] = useState('')
  const [reference, setReference] = useState<{ attachment: ImageAttachmentRef, src: string } | null>(null)
  const [busy, setBusy] = useState(false)
  // 刚生成的首张：GridReveal 网格动画继续跑完（src 从 null 翻到真实 url 触发揭示），
  // 揭示完成（或失败）后交还给普通记录卡片。
  const [incoming, setIncoming] = useState<{ item: StudioHistoryItem, url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState('')
  const [openItem, setOpenItem] = useState<StudioHistoryItem | null>(null)
  const [openSrc, setOpenSrc] = useState('')
  const [workbench, setWorkbench] = useState<'checking' | 'available' | 'missing'>('checking')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setWorkbench(workbenchAvailable?.() === true ? 'available' : 'missing')
  }, [workbenchAvailable])

  // 输入框随内容抬高（封顶 200px ≈ 9 行后内部滚动）；prompt 被模板填充或提交清空时同样跟随。
  useEffect(() => {
    const input = inputRef.current
    if (input === null) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`
  }, [prompt])

  useEffect(() => {
    let alive = true
    isImageStudioAvailable().then(ok => { if (alive) setAvailable(ok) })
    fetchStudioConfig().then(value => { if (alive) setConfig(value) }).catch(() => { /* 保持 null，提交时再报错。 */ })
    fetchInspirationCatalog().then(cases => {
      if (!alive) return
      setInspiration(cases.length > 0 ? { kind: 'ready', cases } : { kind: 'error' })
    }).catch(() => { if (alive) setInspiration({ kind: 'error' }) })
    setHistory(readStudioHistory())
    return () => {
      alive = false
      abortRef.current?.abort()
    }
  }, [])

  const categories = useMemo(() => {
    if (inspiration.kind !== 'ready') return []
    return [...new Set(inspiration.cases.map(item => item.category).filter(item => item !== ''))]
  }, [inspiration])
  const visibleCases = useMemo(() => {
    if (inspiration.kind !== 'ready') return []
    return category === null ? inspiration.cases : inspiration.cases.filter(item => item.category === category)
  }, [inspiration, category])

  const submit = useCallback((text: string): void => {
    const trimmed = text.trim()
    if (trimmed === '' || busy || config === null) return
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError(null)
    setIncoming(null)
    setLastPrompt(trimmed)
    // 提交即切到记录页：GridReveal 的网格动画要当着用户的面跑。
    setTab('history')
    const mode = reference === null ? 'generate' : 'edit'
    void (async () => {
      try {
        const request = buildGenerateRequest(config, trimmed, mode, reference?.attachment)
        const response = await generateImage(request, controller.signal)
        const items = expandGenerateResponse(response)
        setHistory(current => items.reduce((accumulator, item) => addStudioHistory(accumulator, item), current))
        setPrompt('')
        setReference(null)
        const url = await fetchImageBlobUrl(items[0]!.attachment).catch(() => '')
        if (controller.signal.aborted) return
        setIncoming(url === '' ? null : { item: items[0]!, url })
      } catch (reason) {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : String(reason))
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setBusy(false)
      }
    })()
  }, [busy, config, reference])

  const openBig = useCallback((item: StudioHistoryItem): void => {
    setOpenItem(item)
    fetchImageBlobUrl(item.attachment).then(setOpenSrc).catch(() => setOpenSrc(''))
  }, [])
  const editFrom = useCallback((item: StudioHistoryItem): void => {
    fetchImageBlobUrl(item.attachment).then(src => {
      setReference({ attachment: item.attachment, src })
      setOpenItem(null)
      setTab('history')
      inputRef.current?.focus()
    }).catch(() => { /* 取图失败时保持现状。 */ })
  }, [])

  if (available === false) {
    return <section className="dcu-image-studio" data-dcu-image-studio="">
      <style>{IMAGE_STUDIO_STYLE}</style>
      <p className="dcu-image-studio-empty">{t('studio.pluginUnavailable')}</p>
    </section>
  }
  return <section className="dcu-image-studio" data-dcu-image-studio="">
    <style>{IMAGE_STUDIO_STYLE}</style>
    <header className="dcu-image-studio-head">
      <h1 className="dcu-image-studio-title">{t('studio.title')}</h1>
      <div className="dcu-image-studio-tabs" role="tablist">
        <button type="button" role="tab" className="dcu-image-studio-tab" aria-selected={tab === 'templates'} data-active={tab === 'templates' || undefined} onClick={() => { setTab('templates') }}>{t('studio.tabTemplates')}</button>
        <button type="button" role="tab" className="dcu-image-studio-tab" aria-selected={tab === 'history'} data-active={tab === 'history' || undefined} onClick={() => { setTab('history') }}>{t('studio.tabHistory')}</button>
        {workbench === 'available' && <button type="button" className="dcu-image-studio-tab" data-dcu-studio-workbench=""
          title={t('studio.workbenchHint')}
          onClick={() => { if (openStudioWorkbench?.() !== true) setWorkbench('missing') }}>{t('studio.workbench')}</button>}
      </div>
    </header>
    <div className="dcu-image-studio-body">
      {tab === 'templates' ? <div className="dcu-image-studio-section">
        {categories.length > 0 && <div className="dcu-image-studio-chips">
          <button type="button" className="dcu-image-studio-chip" data-active={category === null || undefined} onClick={() => { setCategory(null) }}>{t('studio.allCategories')}</button>
          {categories.map(item => <button key={item} type="button" className="dcu-image-studio-chip" data-active={category === item || undefined} onClick={() => { setCategory(item) }}>{item}</button>)}
        </div>}
        {inspiration.kind === 'loading' && <p className="dcu-image-studio-state"><span className="dcu-image-studio-spinner" aria-hidden="true" />{t('studio.templatesLoading')}</p>}
        {inspiration.kind === 'error' && <p className="dcu-image-studio-error">{t('studio.templatesLoadError')}</p>}
        {inspiration.kind === 'ready' && <div className="dcu-image-studio-grid">
          {visibleCases.map(item => <figure key={`${item.sourceId}/${item.id}`} className="dcu-image-studio-card"
            onClick={() => { setPrompt(item.prompt); inputRef.current?.focus() }}>
            <img alt={item.title} loading="lazy" src={inspirationImageUrl(item.sourceId, item.id)} />
            <figcaption>{item.title}</figcaption>
          </figure>)}
        </div>}
      </div>
        : <div className="dcu-image-studio-section">
          {history.length === 0 && !busy && incoming === null
            ? <p className="dcu-image-studio-empty">{t('studio.historyEmpty')}</p>
            : <div className="dcu-image-studio-grid">
              {(busy || incoming !== null) && <div data-dcu-studio-reveal="">
                <GridReveal src={incoming?.url ?? null} aspect={1}
                  caption={busy ? t('studio.generating') : undefined}
                  onRevealComplete={() => { setIncoming(null) }} onError={() => { setIncoming(null) }} />
              </div>}
              {history.map((item, index) => (incoming !== null && item === incoming.item
                ? null
                : <HistoryCard key={`${item.attachment.attachmentId}:${item.createdAt}:${index}`} item={item} t={t} onOpen={openBig} />))}
            </div>}
        </div>}
    </div>
    <div className="dcu-image-studio-composer-wrap">
      {error !== null && <p className="dcu-image-studio-error" role="alert">{t('studio.generateFailed')}：{error}
        <button type="button" className="dcu-image-studio-action" onClick={() => { submit(lastPrompt) }}>{t('studio.retry')}</button>
      </p>}
      <div className="dcu-image-studio-composer" data-dcu-studio-composer="">
        {reference !== null && <div className="dcu-image-studio-reference">
          <img alt="" src={reference.src} />
          <span>{t('studio.editMode')}</span>
          <button type="button" className="dcu-image-studio-reference-x" aria-label={t('studio.removeReference')} onClick={() => { setReference(null) }}>×</button>
        </div>}
        <div className="dcu-image-studio-inputrow">
          <textarea ref={inputRef} className="dcu-image-studio-input" rows={1} placeholder={t('studio.describePlaceholder')}
            value={prompt} data-dcu-studio-input=""
            onChange={event => { setPrompt(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                submit(prompt)
              }
            }} />
          <button type="button" className="dcu-image-studio-send" data-busy={busy || undefined} disabled={!busy && prompt.trim() === ''}
            aria-label={busy ? t('studio.cancel') : t('studio.generate')}
            onClick={() => {
              if (busy) { abortRef.current?.abort(); return }
              submit(prompt)
            }}>
            {busy
              ? <span className="dcu-image-studio-spinner" style={{ margin: 0, width: 14, height: 14, borderWidth: 2 }} aria-hidden="true" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>}
          </button>
        </div>
      </div>
    </div>
    {openItem !== null && <Lightbox item={openItem} src={openSrc} t={t} onClose={() => { setOpenItem(null) }} onEditFrom={editFrom} />}
  </section>
}

ImageStudioPanel.displayName = 'dcu-image-studio'
