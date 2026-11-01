import { restoreOfficialUserBubbles } from './conversation-bubbles.ts'

export const CONVERSATION_HEADER_STYLE_ID = 'dcu-conversation-header-style'
export const HEADER_PROJECT_TIP_EVENT = 'dcu-header-project-tip'
export const HEADER_SESSION_MENU_EVENT = 'dcu-header-session-menu'

// 宿主 header 的结构是 header > titleRow > titleCluster > [crumbs, headerActions] + headerUtilities，
// 页签（role=tablist）是 header 的直接子节点。这里只用 display:contents 把标题行摊平、
// 再用 order 重排为 [面包屑][操作区][页签][扩展区]，绝不物理搬移 React 管理的节点，
// 否则宿主重渲染时会因节点父级脱钩抛 NotFoundError 导致整个界面白屏。
// crumbs 不能 flex:1：标题会吃掉中间空间，把官方 header.actions（标准模式 / Agent Team）
// 一起顶到最右侧。操作区必须紧贴标题；页签用 margin-left:auto 靠右，扩展区跟在页签后面。
// 顶栏也不能 wrap：换行按 flex-basis 的内容宽度判定，收缩发生在换行之后，右栏入口会掉到第二行。
// 窄窗时标题和页签都允许收缩；标题截断依赖宿主 .crumbs{overflow:hidden} 和
// .crumb{text-overflow:ellipsis}，插件不重复写 overflow。控件带恒为 34px 单行。
export const CONVERSATION_HEADER_STYLE = `
/* 页签控件高 30px，是顶栏最高子项：上下各留 8px，顶栏正好 46px（Codex --height-toolbar）。 */
header:has([data-dcu-inline-tabs]){box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:10px;min-height:var(--dcu-header-height,46px);padding-top:calc((var(--dcu-header-height,46px) - 30px)/2);padding-bottom:calc((var(--dcu-header-height,46px) - 30px)/2);border-bottom:0}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]){box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:10px;min-height:var(--dcu-header-height,46px);padding-top:calc((var(--dcu-header-height,46px) - 28px)/2);padding-bottom:calc((var(--dcu-header-height,46px) - 28px)/2);border-bottom:0}
/* titleRow 被摊平后不再生成盒子，宿主写在上面的窗口安全区内边距会整体丢失：
   macOS 折叠时顶栏内容会滑到红绿灯和 shell.leading 的打开/新建按钮下面。
   这里把等价留白补到 header 上，并用运行时窄轨宽度换算回同一绝对位置。 */
header:has([data-dcu-inline-tabs]),
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]){padding-left:max(20px,calc(var(--dsh-frame-leading-clearance,0px) - var(--dcu-sidebar-rail-width,0px)))}
header:has([data-dcu-inline-tabs]):after{display:none;content:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]):after{display:none;content:none}
header:has([data-dcu-inline-tabs]) [class*="titleRow"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="titleRow"],header:has([data-dcu-inline-tabs]) [class*="titleCluster"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="titleCluster"]{display:contents}
header:has([data-dcu-inline-tabs]) [class*="crumbs"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="crumbs"]{order:1;flex:0 999 auto;min-width:24px}
header:has([data-dcu-inline-tabs]) [class*="crumbSeg"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="crumbSeg"]{flex:none}
/* Codex 顶栏只保留当前会话标题：项目前缀段与分隔符隐藏，段结构保留以便宿主交互逻辑不变。 */
header [class*="crumbs"]>[class*="crumbSeg"]:not(:has([class*="crumbCurrent"])){display:none}
header [class*="crumbs"] [class*="crumbSep"]{display:none}
header:has([data-dcu-inline-tabs]) [class*="headerActions"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerActions"]{order:2;flex:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerActions"]{margin-right:auto}
header [data-dcu-inline-tabs]{box-sizing:border-box;order:3;flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:0;margin:0 0 0 auto;padding:2px;height:30px;position:relative;z-index:1;overflow:hidden;border:0;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#0d0d0d) 5%,transparent)}
header:has([data-dcu-inline-tabs]) [class*="headerUtilities"]{order:4;flex:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerUtilities"]{order:4;flex:none}
/* 新版角落插槽被 display:contents 摊平后，需要独立排序并撤销嵌套布局的边距补偿。 */
header:has([data-dcu-inline-tabs]) [data-conversation-header-corner],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [data-conversation-header-corner]{order:5;flex:none;margin-left:0;margin-right:0}
header [data-dcu-tab-slider]{position:absolute;left:0;top:2px;height:26px;border-radius:7px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.08);pointer-events:none;z-index:0;opacity:0;transform:translateX(0);width:0;transition:transform 240ms cubic-bezier(.16,1,.3,1),width 240ms cubic-bezier(.16,1,.3,1),opacity 160ms ease}
body[data-ds-dark-theme] header [data-dcu-tab-slider]{background:#383838;box-shadow:0 0 0 .5px rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.3)}
/* 顶栏统一使用 34px 控件带：与宿主扩展常用的 top:3px + 28px 图标按钮同心。
   better-sidebar 0.18.0 收起时会把开关组改到 14px（按官方 padding-top:12px 算），
   这里只在紧凑顶栏存在时扣回 3px，不搬 DOM、不跟展开/收起跳动。 */
body[data-dsh-sidebar-collapsed]:has([data-dcu-inline-tabs]) [data-dsh-toggle-cluster]{top:calc(3px + env(safe-area-inset-top))}
body[data-dsh-sidebar-collapsed][data-dsh-title-bar-compat]:has([data-dcu-inline-tabs]) [data-dsh-toggle-cluster]{top:calc(var(--dsh-title-bar-strip, 40px) + 3px)}
body[data-dsh-sidebar-collapsed]:has([class*="crumbCurrent"]) [data-dsh-toggle-cluster]{top:calc(3px + env(safe-area-inset-top))}
body[data-dsh-sidebar-collapsed][data-dsh-title-bar-compat]:has([class*="crumbCurrent"]) [data-dsh-toggle-cluster]{top:calc(var(--dsh-title-bar-strip, 40px) + 3px)}
header [data-dcu-inline-tabs] [role=tab]{box-sizing:border-box;position:relative;z-index:1;height:26px;padding:3px 10px;margin:0;line-height:20px;color:var(--dsw-alias-label-tertiary);border:0;box-shadow:none;background:transparent;font-size:13px;white-space:nowrap}
header [data-dcu-inline-tabs] [role=tab][aria-selected=true],header [data-dcu-inline-tabs] [role=tab][data-state=active]{color:var(--dsw-alias-label-primary,currentColor);font-weight:500}
header [data-dcu-inline-tabs] [role=tab]:after,header [data-dcu-inline-tabs] [role=tab]:before{display:none!important;content:none!important;background:transparent!important;height:0!important}
header [data-dcu-inline-tabs] [role=tab]:focus-visible{outline:2px solid var(--dsw-alias-button-info-fill,#4c8dff);outline-offset:-2px}
/* 标题段强制居中排版：文件夹/···按钮与右侧顶栏图标共用同一垂直中线，不吃行内基线偏移。 */
header [class*="crumbSeg"]:has([class*="crumbCurrent"]){display:inline-flex;align-items:center}
header [data-dcu-title-folder],header [data-dcu-title-more]{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-tertiary,currentColor);display:inline-grid;place-items:center;padding:0;cursor:pointer;border-radius:4px}
/* 文件夹与 ··· 同为 20px 命中区、18px Tabler 图标：与右侧顶栏图标族同规格、同一中线。 */
header [data-dcu-title-folder]{width:20px;height:20px}
header [data-dcu-title-more]{width:20px;height:20px}
header [data-dcu-title-folder]:hover,header [data-dcu-title-more]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,currentColor)}
header [data-dcu-title-folder] svg,header [data-dcu-title-more] svg{display:block}
`

// Tabler folder：与顶栏图标族同规格（24 网格、stroke 2，按 18px 渲染后描边≈1.5px）。
const FOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/></svg>'
const MORE_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="4" cy="8" r="1.15" fill="currentColor"/><circle cx="8" cy="8" r="1.15" fill="currentColor"/><circle cx="12" cy="8" r="1.15" fill="currentColor"/></svg>'

export function findConversationTablist(root: ParentNode): HTMLElement | undefined {
  if ('matches' in root && typeof root.matches === 'function' && root.matches('[role=tablist]')) {
    return root as HTMLElement
  }
  return root.querySelector<HTMLElement>('header [role=tablist]') ?? undefined
}

/** 只给宿主页签打内联标记，视觉重排交给样式表；DOM 结构保持宿主原样。 */
export function placeConversationTabs(root: ParentNode): boolean {
  const tabs = findConversationTablist(root)
  if (tabs === undefined || tabs.dataset.dcuInlineTabs === '') return false
  tabs.dataset.dcuInlineTabs = ''
  return true
}

export type HeaderAnchorDetail = {
  left: number
  top: number
  getRect: () => DOMRect
  toggle?: boolean
}

function emit(name: string, target: HTMLElement, extra: Partial<HeaderAnchorDetail> = {}): void {
  const box = target.getBoundingClientRect()
  target.dispatchEvent(new CustomEvent<HeaderAnchorDetail>(name, {
    bubbles: true,
    detail: {
      left: box.right + 8,
      top: box.top,
      getRect: () => target.getBoundingClientRect(),
      ...extra,
    },
  }))
}

function buildTitleButton(doc: Document, marker: 'folder' | 'more', svg: string, event: string, extra?: Partial<HeaderAnchorDetail>): HTMLButtonElement {
  const button = doc.createElement('button')
  button.type = 'button'
  if (marker === 'folder') button.dataset.dcuTitleFolder = ''
  else button.dataset.dcuTitleMore = ''
  button.innerHTML = svg
  button.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); emit(event, button, extra) })
  return button
}

/** 在标题前后插入文件夹/三点按钮：只插入插件自己的节点，不搬移宿主标题。 */
export function decorateConversationTitle(root: ParentNode): boolean {
  const title = root.querySelector<HTMLElement>('header [class*="crumbCurrent"]')
  if (title === null) return false
  const scope = title.closest('header') ?? title.ownerDocument
  // 宿主可能整体重建标题节点：清掉不再紧邻当前标题的旧按钮，避免残留出重复图标
  for (const stale of scope.querySelectorAll('[data-dcu-title-folder], [data-dcu-title-more]')) {
    if (stale.previousElementSibling !== title && stale.nextElementSibling !== title) stale.remove()
  }
  const folder = title.previousElementSibling
  const more = title.nextElementSibling
  if (folder?.matches('[data-dcu-title-folder]') === true && more?.matches('[data-dcu-title-more]') === true) return false
  // 装饰不完整（只剩一侧按钮）时先撤掉旧按钮，保证成对插入
  folder?.matches('[data-dcu-title-folder]') === true && folder.remove()
  more?.matches('[data-dcu-title-more]') === true && more.remove()
  const doc = title.ownerDocument
  title.before(buildTitleButton(doc, 'folder', FOLDER_SVG, HEADER_PROJECT_TIP_EVENT, { toggle: true }))
  title.after(buildTitleButton(doc, 'more', MORE_SVG, HEADER_SESSION_MENU_EVENT))
  return true
}


export function selectedConversationTab(tabs: HTMLElement): HTMLElement | undefined {
  return tabs.querySelector<HTMLElement>('[role=tab][aria-selected=true], [role=tab][data-state=active]') ?? undefined
}

export function syncTabSlider(root: ParentNode): void {
  const tabs = findConversationTablist(root)
  if (tabs === undefined) return
  const doc = tabs.ownerDocument
  let slider = tabs.querySelector<HTMLElement>('[data-dcu-tab-slider]')
  if (slider === null) {
    slider = doc.createElement('span')
    slider.dataset.dcuTabSlider = ''
    tabs.prepend(slider)
  }
  const selected = selectedConversationTab(tabs)
  if (selected === undefined) {
    slider.style.opacity = '0'
    return
  }
  const listBox = tabs.getBoundingClientRect()
  const tabBox = selected.getBoundingClientRect()
  slider.style.opacity = '1'
  slider.style.width = `${Math.max(0, tabBox.width)}px`
  slider.style.transform = `translateX(${Math.max(0, tabBox.left - listBox.left)}px)`
}

function watchTabSelection(tabs: HTMLElement): () => void {
  tabs.dataset.dcuTabWatch = ''
  const sync = (): void => { syncTabSlider(tabs) }
  const onClick = (): void => { window.requestAnimationFrame(sync) }
  const observer = new MutationObserver(sync)
  observer.observe(tabs, { attributes: true, subtree: true, attributeFilter: ['aria-selected', 'data-state'] })
  tabs.addEventListener('click', onClick)
  return () => {
    observer.disconnect()
    tabs.removeEventListener('click', onClick)
    delete tabs.dataset.dcuTabWatch
  }
}
function ensureStyle(doc: Document): void {
  if (doc.getElementById(CONVERSATION_HEADER_STYLE_ID) !== null) return
  const style = doc.createElement('style')
  style.id = CONVERSATION_HEADER_STYLE_ID
  style.textContent = CONVERSATION_HEADER_STYLE
  doc.head.append(style)
}

const CONVERSATION_BUBBLE_SELECTOR = '[data-time-hover-root],[data-dcu-user-card],[data-dcu-user-source]'

type ConversationMutationImpact = {
  headerChanged: boolean
  bubbleRoots: Set<Element>
}

function inspectConversationNode(node: Node, impact: ConversationMutationImpact, includeDescendants: boolean): void {
  if (!(node instanceof Element)) return
  if (node.matches('header') || node.closest('header') !== null || (includeDescendants && node.querySelector('header') !== null)) {
    impact.headerChanged = true
  }
  const row = node.closest('[data-time-hover-root]')
  if (row !== null) {
    impact.bubbleRoots.add(row)
    return
  }
  if (node.matches(CONVERSATION_BUBBLE_SELECTOR) || (includeDescendants && node.querySelector(CONVERSATION_BUBBLE_SELECTOR) !== null)) {
    impact.bubbleRoots.add(node)
  }
}

function conversationMutationImpact(records: readonly MutationRecord[]): ConversationMutationImpact {
  const impact: ConversationMutationImpact = { headerChanged: false, bubbleRoots: new Set() }
  for (const record of records) {
    inspectConversationNode(record.target, impact, false)
    for (const node of record.addedNodes) inspectConversationNode(node, impact, true)
    for (const node of record.removedNodes) {
      if (node instanceof Element && (node.matches('header') || node.querySelector('header') !== null)) impact.headerChanged = true
    }
  }
  return impact
}

/** 观察会话顶栏与用户气泡；只对相关子树变更按帧合并，流式回答不会触发全文档扫描。 */
export function observeConversationHeader(doc: Document = document): () => void {
  if (doc.head === null || doc.body === null) return () => {}
  ensureStyle(doc)
  restoreOfficialUserBubbles(doc)
  let applying = false
  let frame: number | undefined
  let headerPending = true
  const bubbleRoots = new Set<Element>()
  let watchedTabs: HTMLElement | undefined
  let stopWatchingTabs: (() => void) | undefined
  const run = (): void => {
    frame = undefined
    if (applying) return
    applying = true
    try {
      const roots = [...bubbleRoots]
      bubbleRoots.clear()
      for (const root of roots) restoreOfficialUserBubbles(root)
      if (headerPending) {
        headerPending = false
        placeConversationTabs(doc)
        const tabs = findConversationTablist(doc)
        if (tabs !== watchedTabs) {
          stopWatchingTabs?.()
          watchedTabs = tabs
          stopWatchingTabs = tabs === undefined ? undefined : watchTabSelection(tabs)
        }
        syncTabSlider(doc)
        decorateConversationTitle(doc)
      }
    } finally {
      applying = false
    }
  }
  const sync = (): void => {
    if (frame !== undefined) return
    frame = window.requestAnimationFrame(run)
  }
  sync()
  const observer = new MutationObserver(records => {
    const impact = conversationMutationImpact(records)
    if (!impact.headerChanged && impact.bubbleRoots.size === 0) return
    headerPending ||= impact.headerChanged
    for (const root of impact.bubbleRoots) bubbleRoots.add(root)
    sync()
  })
  observer.observe(doc.body, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    stopWatchingTabs?.()
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    doc.getElementById(CONVERSATION_HEADER_STYLE_ID)?.remove()
    doc.querySelectorAll('[data-dcu-title-folder], [data-dcu-title-more], [data-dcu-tab-slider]').forEach(node => node.remove())
  }
}
