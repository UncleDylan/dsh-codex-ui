/**
 * 会话右上角的活动摘要卡：变更（整个会话累计 +/−）、输出内容、来源三段一眼可读，
 * 点击滚动到会话里对应的块并短暂高亮。数据全部来自宿主已经渲染出来的 DOM
 * （见 activity-summary.ts）：宿主没渲染的段落就不显示，绝不自己猜。
 *
 * 造型对齐 Codex 的摘要卡：300px 宽、统一 30px 行节奏、节标题深色行 + 内容行、
 * 16px 灰图标、无分隔线。开关按钮嵌在会话顶栏工具条（「···」右侧），卡片可见时
 * 给会话区右侧留出卡位，消息列在剩余空间里重新居中。
 *
 * 卡片是 body 下的固定定位浮层（不碰 React 管理的节点），锚定会话滚动容器右缘；
 * 窄视口、新建页、空数据、用户关闭（按会话记忆）时隐藏。
 */

import { conversationScrollRoot } from './conversation-dom.ts'
import { browserStorage } from './tree-expansion.ts'
import { collectActivity, type ActivityFile, type ActivitySummary } from './activity-summary.ts'

export type ActivityCardLabels = {
  /** 卡片与顶栏开关的可访问名称。 */
  region: string
  changes: string
  outputs: string
  sources: string
  viewChanges: string
  viewAll: string
  collapse: string
  /** 顶栏开关在卡片展开时的提示（收起动作）。 */
  close: string
  countFiles: (count: number) => string
  countSources: (count: number) => string
}

export type ActivityCardOptions = {
  labels: ActivityCardLabels
  /** 当前会话 id：关闭状态按会话记忆，切换会话重新出现。 */
  session: () => string | undefined
}

/** 窄于这个宽度时正文没有余量浮卡，让位给内容。 */
const MIN_VIEWPORT = 1100
/** 摘要卡宽度；定位与内容区让位宽度都由它推导。 */
const CARD_WIDTH = 300
/** 每段默认展示的行数，超出走「+」展开。 */
const MAX_ROWS = 3
/** 来源折叠态保留的条数。 */
const COLLAPSED_SOURCES = 3
const DISMISS_KEY = 'dsh.codexUi.activityDismissed'
/** 让位目标：内容列右缘到卡片左缘要留出的宽度（卡宽 + 内容侧缝隙）。 */
const RESERVE_TARGET = CARD_WIDTH + 24

/* Tabler note（用户指定）：顶栏开关的图标，渲染尺寸与宿主折叠图标一致。 */
const SUMMARY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 20l7 -7"/><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7"/></svg>'
const LINK_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6.8 9.2 9.2 6.8"/><path d="M7.2 4.6 8.7 3.1a2.47 2.47 0 0 1 3.5 3.5L10.7 8.1"/><path d="M8.8 11.4 7.3 12.9a2.47 2.47 0 0 1-3.5-3.5L5.3 7.9"/></svg>'
const PLUS_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 3.5v9M3.5 8h9"/></svg>'


const ACTIVITY_CARD_STYLE = `
/* 卡片可见即让位（宽度由脚本写入 --dcu-activity-reserve，Codex 同款）：只作用于会话
   消息区（region="chat"），消息列、输入框与轮次导航一起左移重新居中；输入框座位
   （region="composer"）不许再叠一层，否则输入框会比消息列多挪一截。 */
body[data-dcu-activity-open] [data-conversation-region="chat"]{padding-right:var(--dcu-activity-reserve,0px)}
[data-conversation-region="chat"]{transition:padding-right 160ms ease}
.dcu-activity,.dcu-activity *,.dcu-activity *::before,.dcu-activity *::after{box-sizing:border-box}
.dcu-activity{position:fixed;z-index:30;width:${CARD_WIDTH}px;padding:8px 24px 10px;border-radius:20px;background:#fff;box-shadow:0 8px 24px #00000012,0 0 0 1px #0000000a;color:var(--dsw-alias-label-primary);/* 可变字体优先：宿主栈里的 Segoe UI / 微软雅黑都是静态字重，
   520/550 这类中间字重会被吸附到 400/600/700；Win11 的 Segoe UI Variable 字重轴连续。 */
font-family:"Segoe UI Variable Text","Segoe UI Variable","Segoe UI","PingFang SC","Microsoft YaHei",var(--dsw-font-family);font-size:13px;line-height:20px;animation:dcu-activity-in 180ms cubic-bezier(.16,1,.3,1) both}
body[data-ds-dark-theme] .dcu-activity{background:#202020;box-shadow:0 8px 24px #00000045,0 0 0 1px #ffffff10}
body[data-ds-dark-theme] .dcu-activity-title{color:#9d9d9e}
@keyframes dcu-activity-in{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
.dcu-activity-section{min-width:0}
.dcu-activity-section+.dcu-activity-section{margin-top:6px;padding-top:6px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
/* 统一 30px 行节奏：节标题与内容行同高，靠字色与字重区分层级（Codex 同款）。 */
.dcu-activity-head,.dcu-activity-row{display:flex;gap:8px;align-items:center;height:30px;min-width:0}
/* Codex 的节标题是中灰、半粗，不是纯黑加粗。 */
/* 550 用「500 + 0.2px 同色描边」模拟：宿主字体栈是静态字面，中间字重会被吸附，
   描边对中文同样生效且不受 font-matching 影响。 */
.dcu-activity-title{flex:1;min-width:0;overflow:hidden;color:#6a6b6d;font-weight:500;-webkit-text-stroke:0.2px currentcolor;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-meta{flex:none;overflow:hidden;color:var(--dsw-alias-label-caption);font-size:12px;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-expand{appearance:none;flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-caption);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-activity-expand:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dcu-activity-expand svg{width:16px;height:16px}
.dcu-activity-rows{margin:0;padding:0;list-style:none}
/* 具体内容行用 Codex 同款 #A3A4A5（深浅两主题都可读，悬停点亮主题蓝）。 */
.dcu-activity-row{width:100%;padding:0;border:0;background:none;color:#a3a4a5;font:inherit;line-height:20px;-webkit-text-stroke:0.15px currentcolor;text-align:left;cursor:pointer}
.dcu-activity-row:hover .dcu-activity-name{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px;border-radius:6px}
.dcu-activity-row[disabled]{cursor:default}
.dcu-activity-row[disabled] .dcu-activity-name{color:var(--dsw-alias-label-secondary)}
/* Codex：真实数据行深色，动作行（查看全部/查看变更）灰字带链接图标。 */
.dcu-activity-row-action{color:var(--dsw-alias-label-secondary)}
.dcu-activity-row-action .dcu-activity-name{color:var(--dsw-alias-label-secondary)}
.dcu-activity-row-action:hover .dcu-activity-name{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-icon{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-caption)}
.dcu-activity-delta{flex:none;color:var(--dsw-alias-label-caption);font-size:12px;white-space:nowrap}
.dcu-activity-delta:empty{display:none}
.dcu-activity-added,.dcu-activity-deleted{font-weight:400}
.dcu-activity-added{color:#1a7f37}
.dcu-activity-deleted{color:#cf222e}
body[data-ds-dark-theme] .dcu-activity-added{color:#3fb950}
body[data-ds-dark-theme] .dcu-activity-deleted{color:#f85149}
/* 顶栏开关：嵌在宿主工具条里的普通图标钮，压住宿主按钮的手感。 */
.dcu-activity-toggle{appearance:none;flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm,6px);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-activity-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent));color:var(--dsw-alias-label-primary)}
.dcu-activity-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dcu-activity-toggle[aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-toggle svg{width:18px;height:18px}
/* 顶栏图标族统一已整体迁往 host-tabler-icons.ts（··· / 角槽折叠钮的识别与样式都在那里）。 */
/* 轮次导航条钉在会话区最右：官方导航（.xpvNua_frame 一类）绝对定位锚在滚动容器右缘，
   让位后容器右缘左移，导航条跟着漂走。用负 margin 把让位量补回去——不与宿主的 right
   规则竞争优先级，对任何右锚定的导航都成立；结构选择器兜底，标记缺失时也生效。 */
body[data-dcu-activity-open] [data-conversation-scroll] nav,
body[data-dcu-activity-open] [data-dcu-official-turn-navigator]{
  margin-right:calc(-1 * var(--dcu-activity-reserve, 0px))
}
/* 补偿量与让位 padding 同节奏过渡：否则导航条瞬跳到终点、会话区还在滑，左移看着发顿。 */
[data-conversation-scroll] nav,[data-dcu-official-turn-navigator]{transition:margin-right 160ms ease}
/* 顶栏开关的悬停提示：复刻宿主 Tooltip（Tooltip.module.css）的深色气泡——
   3px 7px 内边距、--dsw-radius-sm 圆角、--dsw-alias-tooltip-bg 底、13px/20px、
   150ms 淡入，固定定位在开关下方 8px。 */
.dcu-activity-tip{position:fixed;z-index:100;width:max-content;max-width:50vw;padding:3px 7px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-tooltip-bg);color:var(--dsw-static-neutral-bluish-00);font-size:13px;line-height:20px;font-family:var(--dsw-font-family);white-space:pre-line;pointer-events:none;animation:dcu-activity-tip-in 150ms var(--ds-ease-in-out,ease)}
@keyframes dcu-activity-tip-in{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.dcu-activity-tip{animation:none}}
/* 滚动定位后的高亮脉冲：临时属性，1.3s 后由脚本移除。 */
[data-dcu-activity-flash]{animation:dcu-activity-flash 1.2s ease both}
@keyframes dcu-activity-flash{from{box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-business-primary) 60%,transparent)}to{box-shadow:0 0 0 2px transparent}}
`

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (content !== undefined) node.textContent = content
  return node
}

/** 行元素在宿主重渲染后可能已不在文档里：失效就当没有，不定位。 */
function connected(target: Element | null | undefined): target is Element {
  return target !== null && target !== undefined && target.isConnected
}

/**
 * 两份摘要是否在展示意义上相同。让位过渡期间 ResizeObserver 每帧都会触发 sync，
 * 摘要没变就绝不开重建——160ms 里反复 replaceChildren 正是左移动画卡顿的元凶。
 * 元素引用也算不同：宿主重渲染后旧行失效，行动作的定位目标必须跟着换。
 */
function sameSummary(a: ActivitySummary, b: ActivitySummary): boolean {
  const fileKey = (file: { path: string, added: number, deleted: number, tooltip?: string }): string =>
    `${file.path}|${file.added}|${file.deleted}|${file.tooltip ?? ''}`
  if (a.changes.added !== b.changes.added || a.changes.deleted !== b.changes.deleted) return false
  if (a.changes.files.length !== b.changes.files.length) return false
  for (let at = 0; at < a.changes.files.length; at++) {
    if (fileKey(a.changes.files[at]) !== fileKey(b.changes.files[at])) return false
    if (a.changes.files[at].target !== b.changes.files[at].target) return false
  }
  if (a.outputs.length !== b.outputs.length) return false
  for (let at = 0; at < a.outputs.length; at++) {
    if (fileKey(a.outputs[at]) !== fileKey(b.outputs[at])) return false
    if (a.outputs[at].target !== b.outputs[at].target) return false
  }
  if (a.sources.length !== b.sources.length) return false
  for (let at = 0; at < a.sources.length; at++) {
    if (a.sources[at].url !== b.sources[at].url) return false
    if (a.sources[at].target !== b.sources[at].target) return false
  }
  return a.changes.latestCard === b.changes.latestCard
}

/** 滚动到目标块并打上 1.3s 的高亮脉冲。 */
function reveal(target: Element): void {
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target.setAttribute('data-dcu-activity-flash', '')
  window.setTimeout(() => { target.removeAttribute('data-dcu-activity-flash') }, 1300)
}

export function observeActivityCard(options: ActivityCardOptions): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {}
  const labels = options.labels
  const style = document.createElement('style')
  style.setAttribute('data-dcu-activity-card-style', '')
  style.textContent = ACTIVITY_CARD_STYLE
  document.head.append(style)
  const storage = browserStorage()

  let disposed = false
  let frame: number | undefined
  let activeRoot: HTMLElement | null | undefined
  let currentSession: string | undefined
  let sourcesExpanded = false
  let changesExpanded = false
  let outputsExpanded = false
  let appliedReserve = -1
  let rootObserver: ResizeObserver | undefined
  // 展示缓存：摘要没变就不重建卡片；首帧只挂空壳，行内容下一帧再填。
  let lastSummary: ActivitySummary | null = null
  let lastViewKey = ''
  let pendingRender = false
  // × / 顶栏开关的关闭按会话记忆；没有会话 id 时退化为内存里的临时关闭。
  let dismissed: string | undefined
  try {
    dismissed = storage?.getItem(DISMISS_KEY) ?? undefined
  } catch {}

  const card = element('div', 'dcu-activity')
  const toggle = element('button', 'dcu-activity-toggle')
  toggle.type = 'button'
  toggle.innerHTML = SUMMARY_ICON
  toggle.setAttribute('aria-label', labels.region)

  const onReveal = (target: Element): void => reveal(target)

  function hasData(summary: ActivitySummary): boolean {
    return summary.changes.files.length > 0 || summary.outputs.length > 0 || summary.sources.length > 0
  }

  function isDismissed(): boolean {
    const id = options.session()
    return id !== undefined ? dismissed === id : dismissed === ''
  }

  /** 变更/输出共用的一行：主行（呈现文件时是自述，title 带全路径），点击滚动定位。 */
  function fileRow(file: ActivityFile): HTMLElement {
    const row = element('li', '')
    const button = element('button', 'dcu-activity-row')
    button.type = 'button'
    const name = element('span', 'dcu-activity-name')
    name.textContent = file.path
    button.title = file.tooltip ?? file.path
    button.append(name)
    if (connected(file.target)) {
      button.addEventListener('click', () => { if (connected(file.target)) onReveal(file.target) })
    } else {
      button.disabled = true
    }
    row.append(button)
    return row
  }

  /** 来源行：链接图标 + 域名（Codex 的来源行同款）。 */
  function sourceRow(url: string, label: string): HTMLElement {
    const row = element('li', '')
    const link = element('a', 'dcu-activity-row')
    link.href = url
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.title = url
    link.innerHTML = LINK_ICON
    link.querySelector('svg')?.setAttribute('class', 'dcu-activity-icon')
    link.className = 'dcu-activity-row dcu-activity-link'
    link.append(element('span', 'dcu-activity-name', label))
    row.append(link)
    return row
  }

  /** 动作行（查看变更 / 查看全部 / 收起）：灰字 + 链接图标，Codex 同款。 */
  function actionRow(label: string, run: () => void): HTMLElement {
    const row = element('li', '')
    const button = element('button', 'dcu-activity-row dcu-activity-row-action')
    button.type = 'button'
    button.innerHTML = LINK_ICON
    button.querySelector('svg')?.setAttribute('class', 'dcu-activity-icon')
    button.append(element('span', 'dcu-activity-name', label))
    button.addEventListener('click', run)
    row.append(button)
    return row
  }

  function expandButton(run: () => void): HTMLElement {
    const button = element('button', 'dcu-activity-expand')
    button.type = 'button'
    button.innerHTML = PLUS_ICON
    button.addEventListener('click', run)
    return button
  }

  function sectionOf(kind: 'changes' | 'outputs' | 'sources', title: string): HTMLElement {
    const section = element('section', 'dcu-activity-section')
    section.setAttribute('data-kind', kind)
    const head = element('div', 'dcu-activity-head')
    head.append(element('span', 'dcu-activity-title', title))
    section.append(head)
    return section
  }

  function render(summary: ActivitySummary): void {
    card.replaceChildren()
    card.setAttribute('role', 'region')
    card.setAttribute('aria-label', labels.region)

    if (summary.changes.files.length > 0) {
      const section = sectionOf('changes', labels.changes)
      const meta = element('span', 'dcu-activity-meta')
      const deltas = `+${summary.changes.added} −${summary.changes.deleted}`
      meta.textContent = `${labels.countFiles(summary.changes.files.length)} ${deltas}`
      meta.title = deltas
      section.querySelector('.dcu-activity-head')!.append(meta)
      if (summary.changes.files.length > MAX_ROWS) {
        section.querySelector('.dcu-activity-head')!.append(expandButton(() => { changesExpanded = !changesExpanded; sync() }))
      }
      const rows = element('ul', 'dcu-activity-rows')
      for (const file of summary.changes.files.slice(0, changesExpanded ? undefined : MAX_ROWS)) rows.append(fileRow(file))
      if (connected(summary.changes.latestCard)) {
        rows.append(actionRow(labels.viewChanges, () => { if (connected(summary.changes.latestCard)) onReveal(summary.changes.latestCard) }))
      }
      section.append(rows)
      card.append(section)
    }

    if (summary.outputs.length > 0) {
      const section = sectionOf('outputs', labels.outputs)
      if (summary.outputs.length > MAX_ROWS) {
        section.querySelector('.dcu-activity-head')!.append(expandButton(() => { outputsExpanded = !outputsExpanded; sync() }))
      }
      const rows = element('ul', 'dcu-activity-rows')
      for (const file of summary.outputs.slice(0, outputsExpanded ? undefined : MAX_ROWS)) rows.append(fileRow(file))
      section.append(rows)
      card.append(section)
    }

    if (summary.sources.length > 0) {
      const section = sectionOf('sources', labels.sources)
      const meta = element('span', 'dcu-activity-meta')
      meta.textContent = labels.countSources(summary.sources.length)
      section.querySelector('.dcu-activity-head')!.append(meta)
      const rows = element('ul', 'dcu-activity-rows')
      const shown = sourcesExpanded ? summary.sources : summary.sources.slice(0, COLLAPSED_SOURCES)
      for (const source of shown) rows.append(sourceRow(source.url, source.label))
      if (summary.sources.length > COLLAPSED_SOURCES) {
        rows.append(actionRow(sourcesExpanded ? labels.collapse : labels.viewAll, () => { sourcesExpanded = !sourcesExpanded; sync() }))
      }
      section.append(rows)
      card.append(section)
    }
  }

  function dismiss(): void {
    const id = options.session()
    dismissed = id ?? ''
    if (id !== undefined) {
      try { storage?.setItem(DISMISS_KEY, id) } catch {}
    }
    sync()
  }

  function place(): void {
    if (!card.isConnected) return
    const root = activeRoot
    if (root === null || root === undefined) return
    // 锚到会话消息区（region="chat"）的右缘，并夹在视口内：region 若延伸到窗口边缘之外
    // （右侧停靠栏是浮层时就会），不夹取卡片会被窗口边裁掉。
    const region = root.closest('[data-conversation-region]:not([data-conversation-region="composer"])') ?? root
    const rect = region.getBoundingClientRect()
    const rightEdge = Math.min(rect.right, document.documentElement.clientWidth) - 16
    card.style.left = `${Math.round(Math.max(8, rightEdge - CARD_WIDTH))}px`
    card.style.top = `${Math.round(Math.max(8, rect.top + 12))}px`
  }

  /** 会话顶栏（含工具条簇与角槽）；找不到返回 null。 */
  function sessionHeader(): HTMLElement | null {
    const root = activeRoot
    if (root === null || root === undefined) return null
    const region = root.closest('[data-conversation-region]') ?? root.parentElement
    return region?.querySelector<HTMLElement>('header')
      ?? [...document.querySelectorAll('header')].find(node => node.querySelector('[class*="headerUtilities"], [class*="headerActions"]'))
      ?? null
  }

  /** 顶栏开关：嵌进会话顶栏工具条（「···」所在簇的末尾，宿主面板按钮之前）。 */
  function mountToggle(): void {
    const header = sessionHeader()
    const cluster = header?.querySelector<HTMLElement>('[class*="headerUtilities"]') ?? header?.querySelector<HTMLElement>('[class*="headerActions"]') ?? header
    if (cluster === null) { toggle.remove(); return }
    if (toggle.parentElement !== cluster) cluster.append(toggle)
  }

  /** 让位宽度：卡片展开即按目标让位（Codex 同款）——消息列、输入框与导航条一起在
   *  「左缘到卡片」的空间里重新居中。极窄会话区保底：至少给正文留 620px，不为卡片压瘪正文。 */
  function reserveFor(region: HTMLElement): number {
    const width = region.getBoundingClientRect().width
    return Math.ceil(Math.min(RESERVE_TARGET, Math.max(0, width - 620)))
  }

  function watchRoot(root: HTMLElement | null): void {
    rootObserver?.disconnect()
    rootObserver = undefined
    if (root === null) return
    if (typeof ResizeObserver === 'undefined') return
    rootObserver = new ResizeObserver(schedule)
    rootObserver.observe(root)
  }

  function sync(): void {
    frame = undefined
    if (disposed) return
    const root = conversationScrollRoot()
    const sessionId = options.session()
    if (sessionId !== currentSession) {
      // 换会话：展开态全部收起；关闭记忆按会话自然失效。
      currentSession = sessionId
      sourcesExpanded = false
      changesExpanded = false
      outputsExpanded = false
    }
    if (root !== activeRoot) {
      activeRoot = root
      watchRoot(root)
    }
    const narrow = window.innerWidth < MIN_VIEWPORT
    const summary = root === null ? null : collectActivity(root)
    const show = summary !== null && !narrow && hasData(summary) && !isDismissed()
    if (show) {
      // 让位与开关属性先写：160ms 的 padding 过渡立刻开始，重活（扫描 + 重建）绝不
      // 和过渡的第一帧挤在一起，否则动画起步就是一记长帧——「左移卡一下」的根源。
      if (!card.isConnected) document.body.append(card)
      // 值没变就不写样式：padding 有 160ms 过渡，过渡期 ResizeObserver 每帧都会回来，
      // 反复改值会让会话区来回抖。
      const region = root!.closest<HTMLElement>('[data-conversation-region]:not([data-conversation-region="composer"])')
      const reserve = region === null ? 0 : reserveFor(region)
      if (reserve !== appliedReserve) {
        appliedReserve = reserve
        if (reserve > 0) document.documentElement.style.setProperty('--dcu-activity-reserve', `${reserve}px`)
        else document.documentElement.style.removeProperty('--dcu-activity-reserve')
      }
      document.body.setAttribute('data-dcu-activity-open', '')
      // 行内容：摘要、展开态都没变就跳过重建（过渡期每帧 sync 的主要开销）；
      // 首次展开只挂空壳，填行推迟到下一帧，起步帧保持轻。
      const viewKey = `${sourcesExpanded}|${changesExpanded}|${outputsExpanded}|${currentSession}`
      const unchanged = lastSummary !== null && sameSummary(lastSummary, summary!) && viewKey === lastViewKey
      if (pendingRender) {
        pendingRender = false
        render(summary!)
        lastSummary = summary
        lastViewKey = viewKey
      } else if (!card.hasChildNodes()) {
        // 首次展开：这一帧只挂空壳，填行推迟到下一帧，过渡起步帧保持轻。
        pendingRender = true
        schedule()
      } else if (!unchanged) {
        render(summary!)
        lastSummary = summary
        lastViewKey = viewKey
      }
      place()
    } else {
      card.remove()
      lastSummary = null
      lastViewKey = ''
      pendingRender = false
      if (appliedReserve !== 0) {
        appliedReserve = 0
        document.documentElement.style.removeProperty('--dcu-activity-reserve')
      }
      document.body.removeAttribute('data-dcu-activity-open')
    }
    // 顶栏开关只在有内容可看时出现；卡片开着时它是「收起」，关着时是「展开」。
    if (summary !== null && !narrow && hasData(summary)) {
      toggle.setAttribute('aria-pressed', String(show))
      toggle.setAttribute('aria-label', show ? labels.close : labels.region)
      // 悬停提示不再用浏览器原生 title（白底方框），换宿主 Tooltip 同款深色气泡，
      // 文案跟随展开态；bubble 在 hover 时才挂进 DOM，文字那时取当前 aria-label。
      mountToggle()
    } else {
      toggle.remove()
    }
  }

  function schedule(): void {
    if (disposed || frame !== undefined) return
    frame = window.requestAnimationFrame(sync)
  }

  toggle.addEventListener('click', () => {
    if (card.isConnected) { dismiss(); return }
    dismissed = undefined
    const id = options.session()
    if (id !== undefined) {
      try { storage?.removeItem(DISMISS_KEY) } catch {}
    }
    schedule()
    // 展开态翻转后提示文案跟着换（收起 ↔ 展开），气泡正显示就当场更新。
    if (tipBubble.isConnected) showTipBubble()
  })

  /** 宿主 Tooltip 同款深色气泡：fixed 定位、开关下方 8px、水平居中并夹在窗口内。 */
  const tipBubble = element('div', 'dcu-activity-tip')
  tipBubble.setAttribute('role', 'tooltip')

  function showTipBubble(): void {
    tipBubble.textContent = toggle.getAttribute('aria-label') ?? ''
    if (!tipBubble.isConnected) document.body.append(tipBubble)
    tipBubble.style.visibility = 'hidden'
    const box = toggle.getBoundingClientRect()
    const width = tipBubble.offsetWidth
    const left = Math.max(12, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - 12 - width))
    tipBubble.style.left = `${left}px`
    tipBubble.style.top = `${box.bottom + 8}px`
    tipBubble.style.visibility = 'visible'
  }

  function hideTipBubble(): void {
    tipBubble.remove()
  }

  toggle.addEventListener('mouseenter', showTipBubble)
  toggle.addEventListener('mouseleave', hideTipBubble)
  toggle.addEventListener('focus', showTipBubble)
  toggle.addEventListener('blur', hideTipBubble)

  /** 只在动到会话滚动根（含其被整体替换）时重扫；其余突变忽略，长会话才扫得动。 */
  function relevant(record: MutationRecord): boolean {
    const touches = (node: Node | null): boolean => {
      if (!(node instanceof Element)) return false
      if (node.matches('[data-conversation-scroll]') || node.querySelector('[data-conversation-scroll]') !== null) return true
      return activeRoot !== null && activeRoot !== undefined && activeRoot.contains(node)
    }
    if (touches(record.target)) return true
    for (const node of record.addedNodes) if (touches(node)) return true
    for (const node of record.removedNodes) if (touches(node)) return true
    return false
  }

  const observer = new MutationObserver(records => {
    if (activeRoot === undefined) { schedule(); return }
    for (const record of records) {
      if (relevant(record)) { schedule(); return }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  window.addEventListener('resize', schedule)
  schedule()

  return () => {
    disposed = true
    style.remove()
    observer.disconnect()
    watchRoot(null)
    window.removeEventListener('resize', schedule)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    card.remove()
    toggle.remove()
    tipBubble.remove()
    appliedReserve = 0
    document.documentElement.style.removeProperty('--dcu-activity-reserve')
    document.body.removeAttribute('data-dcu-activity-open')
  }
}
