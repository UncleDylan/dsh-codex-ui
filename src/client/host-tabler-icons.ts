/** 宿主图标族统一（唯一 owner）：宿主各处图标按钮换同族 Tabler，全走这里。
 *
 *  身份全部来自 app.asar 解包确认（dsh-client-ui-conversation / -sidebar-right /
 *  dsh-web-frontend dockkit）：
 *  - 对话顶栏「···」：工具条簇（headerUtilities，兜底 headerActions）里最后一颗
 *    带图标的宿主按钮——不在角槽、也不是活动卡开关（无稳定 data 标记，按结构识别）
 *  - 对话顶栏角槽按钮：[data-conversation-header-corner] 里的右侧栏开关
 *  - 右侧栏展开钮：[data-sidebar-right-expand]（新建会话页 / 侧栏收起态，与角槽同位）
 *  - 右侧栏收起钮：[data-sidebar-right-toggle]（面板条上）
 *    ↑ 三颗钮是同一功能的三个化身，共用一枚 panel 图标（marker 同名自然去重）
 *  - 分栏钮：[data-dockkit-split-button]
 *  - 全屏钮：[data-sidebar-right-mode]——宿主写的是「下一个模式」，push 态显示
 *    maximize，fullscreen 态显示 minimize
 *  - guide 页签标题罗盘：[data-sidebar-right-panel] 里 svg[class*="titleIcon"]
 *
 *  铁律：这些节点都由 React 管理，只准「原 svg 用 CSS 隐藏 + 末尾/兄弟插入自己的」，
 *  整颗重写宿主节点 / 搬移节点会重渲染脱钩白屏。数据标记做幂等；宿主重渲染重建节点后
 *  标记消失，下一轮扫描自动补挂；dispose 全量还原。 */

export const HOST_TABLER_ICONS_STYLE_ID = 'dcu-host-tabler-icons-style'

export const HOST_TABLER_ICONS_STYLE = `
/* 宿主原 svg 隐藏不删；插入的 Tabler 统一 18px（与对话顶栏图标族一致，罗盘同尺）。
   flex:none 必须带：右侧栏条上的宿主按钮是 28px 盒 + 6px padding（内容区仅 16px），
   svg 作为 flex 子项默认可收缩，18px 会被压回 16px——这正是「条上图标比顶栏小」的原因。 */
[data-dcu-tabler-dots] svg:not(.dcu-tabler-icon),[data-dcu-tabler-panel] svg:not(.dcu-tabler-icon),[data-dcu-tabler-split] svg:not(.dcu-tabler-icon),[data-dcu-tabler-maximize] svg:not(.dcu-tabler-icon){display:none}
[data-dcu-tabler-dots] .dcu-tabler-icon,[data-dcu-tabler-panel] .dcu-tabler-icon,[data-dcu-tabler-split] .dcu-tabler-icon,[data-dcu-tabler-maximize] .dcu-tabler-icon{width:18px;height:18px;flex:none}
/* 分栏 / 全屏不做逐枚尺寸校正（用户定稿 2026-11-01）：右上三颗与「···」/panel
   全族统一 18px、stroke 2，同 viewBox 同字重；此前 split 16px / maximize 20px
   的墨迹校准已撤，不得回加。 */
svg[data-dcu-tabler-compass]{display:none}
svg[data-dcu-tabler-compass]+.dcu-tabler-icon{width:18px;height:18px;flex:none}
`

const DOTS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>'
const PANEL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"/><path d="M15 4l0 16"/></svg>'
const COLUMNS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-16"/><path d="M12 3v18"/></svg>'
const MAXIMIZE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M4 8v-2a2 2 0 0 1 2 -2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2 -2v-2"/></svg>'
const MINIMIZE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M15 19v-2a2 2 0 0 1 2 -2h2"/><path d="M15 5v2a2 2 0 0 0 2 2h2"/><path d="M5 15h2a2 2 0 0 1 2 2v2"/><path d="M5 9h2a2 2 0 0 0 2 -2v-2"/></svg>'
const COMPASS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dcu-tabler-icon"><path d="M8 16l2 -6l6 -2l-2 6l-6 2"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>'

const MARKERS = '[data-dcu-tabler-dots],[data-dcu-tabler-panel],[data-dcu-tabler-split],[data-dcu-tabler-maximize]'

type IconRule = {
  marker: string
  /** 按宿主当前状态选图（全屏钮依属性翻转；其余恒定）。 */
  pick: (element: Element) => string
  /** 状态键：随宿主状态变化的规则用它判断已挂图标是否过期（存进 marker 值）。 */
  state?: (element: Element) => string
  find: (doc: Document) => Iterable<Element>
}

/** 会话顶栏：结构兜底（含工具条簇的 header）。 */
function conversationHeader(doc: Document): HTMLElement | null {
  return [...doc.querySelectorAll('header')].find(node => node.querySelector('[class*="headerUtilities"], [class*="headerActions"]')) ?? null
}

const RULES: readonly IconRule[] = [
  {
    marker: 'data-dcu-tabler-dots',
    pick: () => DOTS_ICON,
    find: (doc) => {
      const header = conversationHeader(doc)
      const cluster = header?.querySelector<HTMLElement>('[class*="headerUtilities"]') ?? header?.querySelector<HTMLElement>('[class*="headerActions"]') ?? header
      if (cluster === null || cluster === undefined) return []
      const candidates = [...cluster.querySelectorAll('button')]
        .filter(button => button.querySelector('svg') !== null
          && button.closest('[data-conversation-header-corner]') === null
          && !button.classList.contains('dcu-activity-toggle'))
      const more = candidates.at(-1)
      return more === undefined ? [] : [more]
    },
  },
  {
    marker: 'data-dcu-tabler-panel',
    pick: () => PANEL_ICON,
    find: (doc) => {
      const corner = conversationHeader(doc)?.querySelector('[data-conversation-header-corner] button')
      return corner !== null && corner !== undefined && corner.querySelector('svg') !== null ? [corner] : []
    },
  },
  { marker: 'data-dcu-tabler-panel', pick: () => PANEL_ICON, find: doc => doc.querySelectorAll('[data-sidebar-right-expand]') },
  { marker: 'data-dcu-tabler-panel', pick: () => PANEL_ICON, find: doc => doc.querySelectorAll('[data-sidebar-right-toggle]') },
  { marker: 'data-dcu-tabler-split', pick: () => COLUMNS_ICON, find: doc => doc.querySelectorAll('[data-dockkit-split-button]') },
  {
    marker: 'data-dcu-tabler-maximize',
    // 宿主 data-sidebar-right-mode 写的是「下一个模式」：fullscreen = 当前 push → maximize，
    // push = 当前全屏 → minimize；状态键存 marker 值，属性翻转即可重估
    pick: element => element.getAttribute('data-sidebar-right-mode') === 'push' ? MINIMIZE_ICON : MAXIMIZE_ICON,
    state: element => element.getAttribute('data-sidebar-right-mode') === 'push' ? 'min' : 'max',
    find: doc => doc.querySelectorAll('[data-sidebar-right-mode]'),
  },
]

function restyleButton(button: Element, rule: IconRule): void {
  if (button.querySelector('svg') === null) return
  const state = rule.state?.(button) ?? ''
  if (button.getAttribute(rule.marker) === state && button.querySelector('.dcu-tabler-icon') !== null) return
  // 宿主重建过按钮时可能残留上一轮插入的图标（或状态已过期）：先清再挂
  button.querySelectorAll('.dcu-tabler-icon').forEach(node => node.remove())
  button.setAttribute(rule.marker, state)
  button.insertAdjacentHTML('beforeend', rule.pick(button))
}

/** 罗盘是页签标题里的裸 svg（不在按钮内）：标记 svg 本体、兄弟插入替换图。 */
function restyleCompass(svg: Element): void {
  if (svg.hasAttribute('data-dcu-tabler-compass')) return
  const sibling = svg.nextElementSibling
  if (sibling !== null && sibling.classList.contains('dcu-tabler-icon')) sibling.remove()
  svg.setAttribute('data-dcu-tabler-compass', '')
  svg.insertAdjacentHTML('afterend', COMPASS_ICON)
}

/** 摘掉失去宿主锚点（React 重建后未配对）的残留 Tabler 图标。 */
function pruneOrphans(scope: ParentNode): void {
  for (const icon of scope.querySelectorAll('.dcu-tabler-icon')) {
    const host = icon.parentElement
    if (host === null) continue
    if (host.matches(MARKERS)) continue
    const previous = icon.previousElementSibling
    if (previous !== null && previous.hasAttribute('data-dcu-tabler-compass')) continue
    icon.remove()
  }
}

function scan(doc: Document): void {
  for (const rule of RULES) {
    for (const element of rule.find(doc)) restyleButton(element, rule)
  }
  for (const svg of doc.querySelectorAll('[data-sidebar-right-panel] svg[class*="titleIcon"]')) {
    restyleCompass(svg)
  }
  pruneOrphans(doc.body)
}

export function observeHostTablerIcons(doc: Document = document): () => void {
  if (doc.head === null || doc.body === null) return () => {}
  if (doc.getElementById(HOST_TABLER_ICONS_STYLE_ID) === null) {
    const style = doc.createElement('style')
    style.id = HOST_TABLER_ICONS_STYLE_ID
    style.textContent = HOST_TABLER_ICONS_STYLE
    doc.head.append(style)
  }
  let frame: number | undefined
  const run = (): void => { frame = undefined; scan(doc) }
  const schedule = (): void => { if (frame === undefined) frame = window.requestAnimationFrame(run) }
  /** 只对右侧栏与会话顶栏相关子树的变更扫描；消息流正文不经过这里，不占主线程。
   *  attributes 只订阅全屏钮的模式标记：进/出全屏时 React 可能只翻转该属性不重建子节点。 */
  const RELEVANT = '[data-sidebar-right-panel],[data-sidebar-right-session],[data-sidebar-right-expand],[data-sidebar-right-toggle],[data-dockkit-host],header'
  function touchesTargets(records: readonly MutationRecord[]): boolean {
    for (const record of records) {
      const element = record.target instanceof Element ? record.target : record.target.parentElement
      if (element === null) continue
      if (element.matches('[data-sidebar-right-mode]') || element.closest(RELEVANT) !== null || element.querySelector(RELEVANT) !== null) return true
      for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches(RELEVANT) || node.querySelector(RELEVANT) !== null)) return true
      }
    }
    return false
  }
  const observer = new MutationObserver(records => { if (touchesTargets(records)) schedule() })
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sidebar-right-mode'] })
  scan(doc)
  return () => {
    observer.disconnect()
    if (frame !== undefined) { window.cancelAnimationFrame(frame); frame = undefined }
    // 按宿主目标清理：连宿主重建后失配的残留图标一起摘掉
    for (const button of doc.querySelectorAll(MARKERS)) {
      button.removeAttribute('data-dcu-tabler-dots')
      button.removeAttribute('data-dcu-tabler-panel')
      button.removeAttribute('data-dcu-tabler-split')
      button.removeAttribute('data-dcu-tabler-maximize')
      button.querySelectorAll('.dcu-tabler-icon').forEach(node => node.remove())
    }
    for (const svg of doc.querySelectorAll('[data-dcu-tabler-compass]')) {
      svg.removeAttribute('data-dcu-tabler-compass')
      svg.nextElementSibling?.classList.contains('dcu-tabler-icon') && svg.nextElementSibling.remove()
    }
    // 罗盘的宿主 svg 若被重建，残留的兄弟图标兜底清理：dcu-tabler-icon 是本插件私有类
    for (const icon of doc.querySelectorAll('[data-sidebar-right-panel] .dcu-tabler-icon')) icon.remove()
  }
}
