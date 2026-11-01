/** OpenAI Codex desktop sidebar geometry, measured from the installed client bundle. */
export const CODEX_SIDEBAR_MIN_PX = 240
/** ChatGPT/Codex 侧栏首选列宽 = 48px 常驻图标轨 + 292px 面板。 */
export const CODEX_SIDEBAR_DEFAULT_PX = 340
export const CODEX_SIDEBAR_RAIL_PX = 48

/** Backward-compatible name for the width used while a collapsed rail expands. */
export const SLIM_SIDEBAR_PX = CODEX_SIDEBAR_DEFAULT_PX

/**
 * 侧栏开合节奏：300ms 两端缓冲曲线。
 * 宿主或伴随插件的布局规则可能整条覆盖 frame 的 CSS transition（实测会让边界线瞬跳），
 * 所以过渡参数必须单点定义，并由 Web Animations API 兜底驱动位移——不依赖任何 CSS 优先级。
 */
export const SIDEBAR_MOTION_MS = 300
export const SIDEBAR_MOTION_EASING = 'cubic-bezier(.4,0,.2,1)'

export type SidebarGridTracks = {
  sidebar: number
  middle: string
  /** 第三列原文。0.1.5 是 `0px`，0.1.7 是 `minmax(0px, Npx)`，写回时不能改格式。 */
  details: string
}

const visibleSidebarWidths = new WeakMap<HTMLElement, number>()

/**
 * 已经跑过一次自动调宽的容器。首帧必须无动画，之后每一次开合都要走 CSS 过渡。
 * 不能拿 data-dcu-codex-sidebar-initialized 当判据：收起分支从不写这个标记，
 * 于是「启动即折叠」或「先折叠过」的窗口在展开时会被误判成首次绘制，动画被永久关掉。
 */
const primedSidebarFrames = new WeakSet<HTMLElement>()

type HostSidebarSnapshot = {
  grid: string
  handleLeft: string
  windowsWidth: string
}

const hostSidebarSnapshots = new WeakMap<HTMLElement, HostSidebarSnapshot>()

/** 会话顶栏用它把宿主发布的窗口 chrome 安全区换算回窄轨之外的左内边距。 */
const SIDEBAR_RAIL_WIDTH_VAR = '--dcu-sidebar-rail-width'

/** 值不变时不再重写 style，避免与宿主重绘叠加时反复触发 style 监听。 */
function writeSidebarRailWidth(frame: HTMLElement, width: number): void {
  const value = `${width}px`
  if (frame.style.getPropertyValue(SIDEBAR_RAIL_WIDTH_VAR) !== value) {
    frame.style.setProperty(SIDEBAR_RAIL_WIDTH_VAR, value)
  }
}

/**
 * 窄轨补偿变量必须与列轨动画同源：折叠态列宽就是窄轨宽度，展开态列宽是整块面板、补偿为 0。
 * 从列轨字符串推导而不是记录历史值，否则拖拽期间的临时写入会让两者在动画首帧失步、标题瞬跳。
 */
function railWidthOfTracks(tracks: string): number {
  const width = parseSidebarGrid(tracks)?.sidebar ?? 0
  return width <= CODEX_SIDEBAR_RAIL_PX ? width : 0
}

/** 我们最近一次写进 frame 的稳定列轨字符串，作为开合动画的插值起点。 */
const appliedSidebarTracks = new WeakMap<HTMLElement, string>()
const gridMotions = new WeakMap<HTMLElement, Animation>()
const handleMotions = new WeakMap<HTMLElement, Animation>()
const cornerMotions = new WeakMap<HTMLElement, Animation>()

/** 工作区（白卡）左上角圆角：展开态是直角（与面板拼接），折叠态是 16px。 */
const CONTENT_CORNER_PX = 16

/** 打给「最右侧可见列」的标记：样式表据此画窗口外角（右栏内容自绘白底，border-radius 裁不出来）。 */
const OUTER_CORNER_ATTRIBUTE = 'data-dcu-outer-corner'

/**
 * 工作区左上圆角必须和列宽同步插值，否则观感是「边界先平移过去，直角边上再补一个圆角」。
 * 起止值按方向取定（而不是读当时的 computed）：宿主可能立刻写 data-sidebar-collapsed，
 * 那样 computed 一上来就是终值，动画会被自己压平。结束时写 inline 终值，保证
 * 标记晚到（宿主延迟加 data-sidebar-collapsed）也不会在动画末尾闪一下。
 */
function playCornerMotion(frame: HTMLElement, collapsed: boolean): void {
  const corner = frame.querySelector<HTMLElement>('[class$="_centerCol"]')
  if (corner === null) return
  const to = collapsed ? CONTENT_CORNER_PX : 0
  cornerMotions.get(corner)?.cancel()
  if (typeof corner.animate !== 'function' || prefersReducedMotion(frame)) {
    corner.style.borderTopLeftRadius = `${to}px`
    return
  }
  try {
    const motion = corner.animate([
      { borderTopLeftRadius: `${collapsed ? 0 : CONTENT_CORNER_PX}px` },
      { borderTopLeftRadius: `${to}px` },
    ], { duration: SIDEBAR_MOTION_MS, easing: SIDEBAR_MOTION_EASING })
    motion.onfinish = () => {
      corner.style.borderTopLeftRadius = `${to}px`
      motion.cancel()
    }
    cornerMotions.set(corner, motion)
  } catch {
    corner.style.borderTopLeftRadius = `${to}px`
  }
}

function prefersReducedMotion(frame: HTMLElement): boolean {
  const view = frame.ownerDocument.defaultView
  return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/** 工作区各列（中列 + 可展开的右栏：工作区文件/终端/浏览器等分页）。 */
const WORKSPACE_COLUMNS = '[class$="_centerCol"],[class$="_rightbarCol"],[class$="_detailsCol"]'

/**
 * 窗口外角的圆角必须挂在「最右侧可见列」上，列与列之间的交界一律直角。
 * 之前把 16px 直接钉在中列右上角，于是右栏（浏览器/终端等分页）一展开、
 * 中列右边界左移，圆角就跟着对话区一起跑，而窗口外角反而是直角。
 * 判定用 details 轨道而不是几何：列宽有 300ms 过渡，刚展开时右栏实测宽度还是 0，
 * 按宽度过滤会把右栏跳过、圆角继续留在对话区上。
 */
function syncColumnCorners(frame: HTMLElement): void {
  const center = frame.querySelector<HTMLElement>('[class$="_centerCol"]')
  const side = frame.querySelector<HTMLElement>('[class$="_rightbarCol"],[class$="_detailsCol"]')
  if (center === null && side === null) return
  const details = parseSidebarGrid(frame.style.gridTemplateColumns)?.details
  const parsed = details === undefined ? Number.NaN : Number.parseFloat(details)
  const sideVisible = side !== null
    && (Number.isFinite(parsed) ? parsed > 0.5 : side.getBoundingClientRect().width > 1)
  if (center !== null) {
    // 中列只在右栏收起时才是窗口外角；右栏展开后交界必须是直角。
    const radius = sideVisible ? '0px' : `${CONTENT_CORNER_PX}px`
    if (center.style.borderTopRightRadius !== radius) center.style.borderTopRightRadius = radius
    center.removeAttribute(OUTER_CORNER_ATTRIBUTE)
  }
  if (side !== null) {
    // 右栏内部自绘白底且宿主是 overflow:visible，border-radius 裁不出圆角，
    // 改由样式表里的 16px 角落遮罩画外角：位置钉在窗口角上，不随列宽平移。
    if (sideVisible) side.setAttribute(OUTER_CORNER_ATTRIBUTE, '')
    else side.removeAttribute(OUTER_CORNER_ATTRIBUTE)
    side.style.removeProperty('border-top-right-radius')
    side.style.removeProperty('border-top-left-radius')
  }
}

/** 列宽过渡结束后再校准一次，防止宿主用自己的节奏把 details 轨道写晚。 */
const cornerSyncTimers = new WeakMap<HTMLElement, number>()

function scheduleColumnCornerSync(frame: HTMLElement): void {
  syncColumnCorners(frame)
  const view = frame.ownerDocument.defaultView
  if (view === null) return
  const previous = cornerSyncTimers.get(frame)
  if (previous !== undefined) view.clearTimeout(previous)
  cornerSyncTimers.set(frame, view.setTimeout(() => {
    cornerSyncTimers.delete(frame)
    if (frame.isConnected) syncColumnCorners(frame)
  }, SIDEBAR_MOTION_MS + 60))
}

/**
 * 用 Web Animations API 显式补出「边界线左右平移」：列宽、窄轨补偿变量与拖拽柄一起插值。
 * 即使宿主 CSS 覆盖了 transition（transition-property 里根本没有列宽），这段动画也照常播放；
 * 动画结束后回落到 inline style 的终值，与 CSS transition 同曲线时两者完全一致，不会叠加抖动。
 */
function playColumnMotion(frame: HTMLElement, from: string, to: string, railFrom: number, railTo: number): void {
  if (from === to || typeof frame.animate !== 'function' || prefersReducedMotion(frame)) return
  gridMotions.get(frame)?.cancel()
  const options = { duration: SIDEBAR_MOTION_MS, easing: SIDEBAR_MOTION_EASING }
  try {
    gridMotions.set(frame, frame.animate([
      { gridTemplateColumns: from, [SIDEBAR_RAIL_WIDTH_VAR]: `${railFrom}px` },
      { gridTemplateColumns: to, [SIDEBAR_RAIL_WIDTH_VAR]: `${railTo}px` },
    ], options))
  } catch {
    // 个别内核不支持在 keyframes 里混写自定义属性，退化为纯列宽插值。
    gridMotions.set(frame, frame.animate([{ gridTemplateColumns: from }, { gridTemplateColumns: to }], options))
  }
  const handle = frame.querySelector<HTMLElement>('[data-side="sidebar"]')
  if (handle !== null && typeof handle.animate === 'function') {
    handleMotions.get(handle)?.cancel()
    const fromWidth = `${parseSidebarGrid(from)?.sidebar ?? 0}px`
    const toWidth = `${parseSidebarGrid(to)?.sidebar ?? 0}px`
    try {
      handleMotions.set(handle, handle.animate([{ left: fromWidth }, { left: toWidth }], options))
    } catch { /* 拖拽柄位置交给 CSS 过渡兜底 */ }
  }
}

/** 记下插件改写前的宿主列宽。已经带初始化标记的列宽是本插件留下的，不能当成宿主原值。 */
export function rememberHostSidebar(frame: HTMLElement): void {
  if (hostSidebarSnapshots.has(frame) || frame.hasAttribute('data-dcu-codex-sidebar-initialized')) return
  const handle = frame.querySelector<HTMLElement>('[data-side="sidebar"]')
  hostSidebarSnapshots.set(frame, {
    grid: frame.style.gridTemplateColumns,
    handleLeft: handle?.style.left ?? '',
    windowsWidth: frame.style.getPropertyValue('--dsh-windows-sidebar-width'),
  })
}

/** 停用或卸载时撤回列宽、拖拽柄和初始化标记，让官方侧栏按宿主宽度重排。 */
export function restoreHostSidebar(frame: HTMLElement): void {
  gridMotions.get(frame)?.cancel()
  const handle = frame.querySelector<HTMLElement>('[data-side="sidebar"]')
  if (handle !== null) handleMotions.get(handle)?.cancel()
  const corner = frame.querySelector<HTMLElement>('[class$="_centerCol"]')
  if (corner !== null) {
    cornerMotions.get(corner)?.cancel()
    corner.style.removeProperty('border-top-left-radius')
  }
  // 卸载时把圆角样式全部还给宿主，避免残留 inline 值把外角钉死。
  for (const column of frame.querySelectorAll<HTMLElement>(WORKSPACE_COLUMNS)) {
    column.style.removeProperty('border-top-left-radius')
    column.style.removeProperty('border-top-right-radius')
    column.removeAttribute(OUTER_CORNER_ATTRIBUTE)
  }
  frame.removeAttribute('data-dcu-codex-sidebar-initialized')
  frame.style.removeProperty('--dcu-sidebar-expanded-width')
  frame.style.removeProperty(SIDEBAR_RAIL_WIDTH_VAR)
  const html = frame.ownerDocument.documentElement
  const tracks = parseSidebarGrid(frame.style.gridTemplateColumns)
  if (frame.hasAttribute('data-sidebar-collapsed')) {
    const collapsedDesktop = html.hasAttribute('data-windows-titlebar') || html.dataset.platform === 'darwin'
    if (collapsedDesktop && tracks?.sidebar === CODEX_SIDEBAR_RAIL_PX) {
      frame.style.gridTemplateColumns = `0px ${tracks.middle} ${tracks.details}`
      if (html.hasAttribute('data-windows-titlebar')) frame.style.setProperty('--dsh-windows-sidebar-width', '0px')
    }
    return
  }
  const snapshot = hostSidebarSnapshots.get(frame)
  if (snapshot !== undefined) {
    frame.style.gridTemplateColumns = snapshot.grid
    if (handle !== null) {
      if (snapshot.handleLeft === '') handle.style.removeProperty('left')
      else handle.style.left = snapshot.handleLeft
    }
    if (snapshot.windowsWidth === '') frame.style.removeProperty('--dsh-windows-sidebar-width')
    else frame.style.setProperty('--dsh-windows-sidebar-width', snapshot.windowsWidth)
    return
  }
  // 本会话已经把宿主列宽覆盖成默认宽度，且没有快照时退回官方默认 280。
  if (tracks?.sidebar === CODEX_SIDEBAR_DEFAULT_PX) {
    frame.style.gridTemplateColumns = `280px ${tracks.middle} ${tracks.details}`
    if (handle !== null) handle.style.left = '280px'
  }
}

/** 解析宿主 AppFrame 的 grid-template-columns。 */
export function parseSidebarGrid(value: string): SidebarGridTracks | undefined {
  const match = /^(\d+(?:\.\d+)?)px\s+(minmax\(\d+(?:px)?,\s*1fr\))\s+(minmax\(0(?:px)?,\s*\d+(?:\.\d+)?px\)|\d+(?:\.\d+)?px)$/.exec(value.trim())
  if (match === null) return undefined
  return { sidebar: Number(match[1]), middle: match[2], details: match[3] }
}

export function findSidebarFrame(root: ParentNode): HTMLElement | undefined {
  const marked = root.querySelector<HTMLElement>('[data-sidebar-collapsed]')
  if (marked !== null) return marked
  for (const node of root.querySelectorAll<HTMLElement>('div')) {
    if (parseSidebarGrid(node.style.gridTemplateColumns) !== undefined) return node
  }
  return undefined
}

/** Settings is portaled to body, so explicitly carry over the expanded width. */
export function settingsSidebarWidth(root: ParentNode): number {
  const frame = findSidebarFrame(root)
  const expanded = Number.parseFloat(frame?.style.getPropertyValue('--dcu-sidebar-expanded-width') ?? '')
  if (Number.isFinite(expanded) && expanded >= CODEX_SIDEBAR_MIN_PX) return expanded
  const width = frame === undefined ? undefined : parseSidebarGrid(frame.style.gridTemplateColumns)?.sidebar
  return width !== undefined && width >= CODEX_SIDEBAR_MIN_PX ? width : CODEX_SIDEBAR_DEFAULT_PX
}

/** 同步侧栏网格和拖拽柄，保证两者始终使用同一个可见宽度。 */
export function applySidebarWidth(frame: HTMLElement, width: number): boolean {
  const tracks = parseSidebarGrid(frame.style.gridTemplateColumns)
  if (tracks === undefined || frame.hasAttribute('data-sidebar-collapsed')) return false
  visibleSidebarWidths.set(frame, width)
  // 展开态没有窄轨，顶栏只保留宿主原生的 20px 左内边距。
  writeSidebarRailWidth(frame, 0)
  const next = `${width}px ${tracks.middle} ${tracks.details}`
  const changed = frame.style.gridTemplateColumns !== next
  if (changed) frame.style.gridTemplateColumns = next
  appliedSidebarTracks.set(frame, next)
  // 保存展开宽度，让内容在宿主网格动画中只被裁切，不逐帧重排。
  const contentWidth = `${width}px`
  if (frame.style.getPropertyValue('--dcu-sidebar-expanded-width') !== contentWidth) {
    frame.style.setProperty('--dcu-sidebar-expanded-width', contentWidth)
  }
  // Windows 标题栏下全屏右栏用 --dsh-windows-sidebar-width 避让侧栏（宿主只在自己的
  // React 渲染里写它）。我们的列宽是直接写 grid 的，不在这里同步的话，全屏面板会按
  // 宿主记的旧宽度避让，盖住侧栏被拖宽/加宽出来的那一段。
  if (frame.ownerDocument.documentElement.hasAttribute('data-windows-titlebar')
    && frame.style.getPropertyValue('--dsh-windows-sidebar-width') !== contentWidth) {
    frame.style.setProperty('--dsh-windows-sidebar-width', contentWidth)
  }
  const handle = frame.querySelector<HTMLElement>('[data-side="sidebar"]')
  if (handle !== null && handle.style.left !== contentWidth) handle.style.left = contentWidth
  return changed
}

/** 自动宽度调整与初始化过渡共用前置条件；手动拖拽不受此限制。 */
function canApplySlimSidebar(frame: HTMLElement): boolean {
  return !frame.hasAttribute('data-dragging')
    && parseSidebarGrid(frame.style.gridTemplateColumns) !== undefined
}

export function applySlimSidebar(frame: HTMLElement): boolean {
  if (!canApplySlimSidebar(frame)) return false
  if (frame.hasAttribute('data-sidebar-collapsed')) {
    const tracks = parseSidebarGrid(frame.style.gridTemplateColumns)!
    const next = `${CODEX_SIDEBAR_RAIL_PX}px ${tracks.middle} ${tracks.details}`
    const changed = frame.style.gridTemplateColumns !== next
    if (changed) frame.style.gridTemplateColumns = next
    appliedSidebarTracks.set(frame, next)
    // 顶栏据此把宿主按“侧栏列隐藏”发布的窗口安全区扣掉窄轨宽度。
    writeSidebarRailWidth(frame, CODEX_SIDEBAR_RAIL_PX)
    // Windows caption material follows the visible column; keep the saved expanded width intact.
    if (frame.ownerDocument.documentElement.hasAttribute('data-windows-titlebar')
      && frame.style.getPropertyValue('--dsh-windows-sidebar-width') !== `${CODEX_SIDEBAR_RAIL_PX}px`) {
      frame.style.setProperty('--dsh-windows-sidebar-width', `${CODEX_SIDEBAR_RAIL_PX}px`)
    }
    return changed
  }
  const initialized = frame.hasAttribute('data-dcu-codex-sidebar-initialized')
  // 首次接管时使用 48px 图标轨 + 292px 面板的首选宽度；用户拖拽后的宽度从 WeakMap 恢复。
  const width = initialized ? visibleSidebarWidths.get(frame) ?? CODEX_SIDEBAR_DEFAULT_PX : CODEX_SIDEBAR_DEFAULT_PX
  const changed = applySidebarWidth(frame, width)
  // 相同值的 setAttribute 也会触发 MutationObserver，必须保持写入幂等。
  if (!initialized) frame.setAttribute('data-dcu-codex-sidebar-initialized', '')
  return changed
}

/** 仅在首帧覆盖宿主默认宽度时关闭过渡，避免刷新出现收缩动画。 */
function pauseInitialSidebarTransition(frame: HTMLElement): () => void {
  const handle = frame.querySelector<HTMLElement>('[data-side="sidebar"]')
  const frameTransition = frame.style.transition
  const handleTransition = handle?.style.transition
  frame.style.transition = 'none'
  if (handle !== null) handle.style.transition = 'none'
  return () => {
    frame.style.transition = frameTransition
    if (handle !== null && handleTransition !== undefined) handle.style.transition = handleTransition
  }
}

export function observeSlimSidebar(): () => void {
  if (typeof document === 'undefined' || document.body === null) return () => {}
  let applying = false
  let frame: HTMLElement | undefined
  let pending: number | undefined
  let frameObserver: MutationObserver | undefined
  const watchFrame = (next: HTMLElement | undefined): void => {
    if (frame === next) return
    frameObserver?.disconnect()
    frame = next
    if (frame === undefined) return
    // 在下一次绘制前修正宿主宽度，避免先向宿主默认值展开一帧再重启动画。
    frameObserver = new MutationObserver(apply)
    frameObserver.observe(frame, { attributes: true, attributeFilter: ['style', 'data-sidebar-collapsed', 'data-dragging', 'data-dcu-codex-sidebar-initialized'] })
  }
  const apply = (): void => {
    if (applying) return
    applying = true
    try {
      if (frame === undefined || !frame.isConnected) watchFrame(findSidebarFrame(document))
      if (frame === undefined) return
      rememberHostSidebar(frame)
      // 只有真正的首帧才静默改宽，避免刷新时出现收缩动画；此后每次开合都要有连续位移。
      const firstTouch = !primedSidebarFrames.has(frame)
      const restoreTransition = firstTouch ? pauseInitialSidebarTransition(frame) : undefined
      const tracksBefore = appliedSidebarTracks.get(frame)
      let changed = false
      // 暂停自动调宽时仍按实际列宽同步避让：右栏按下后窄轨仍可能是 56px，移动后宿主才改为 0。
      // 网格不可解析时归零，避免残留窄轨宽度使顶栏压到窗口按钮下面。
      if (!canApplySlimSidebar(frame)) {
        const rail = frame.hasAttribute('data-sidebar-collapsed') ? parseSidebarGrid(frame.style.gridTemplateColumns)?.sidebar ?? 0 : 0
        writeSidebarRailWidth(frame, rail)
      }
      else if (frame.hasAttribute('data-sidebar-collapsed')) changed = applySlimSidebar(frame)
      else changed = applySlimSidebar(frame)
      primedSidebarFrames.add(frame)
      // 右栏（浏览器/终端分页）展开时列宽会变，外角圆角必须重新挂到最右列上。
      scheduleColumnCornerSync(frame)
      if (changed && !firstTouch) {
        const tracksAfter = appliedSidebarTracks.get(frame)
        if (tracksBefore !== undefined && tracksAfter !== undefined) {
          playColumnMotion(frame, tracksBefore, tracksAfter, railWidthOfTracks(tracksBefore), railWidthOfTracks(tracksAfter))
          // 圆角动画只跟左侧栏开合走：右栏（details 轨）展开/收起也会改列轨字符串，
          // 但左上角的直角/圆角与右栏无关——这里若照样播 0↔16 插值，
          // 观感就是「右栏一开合，工作区左上角先变圆角再弹回直角」。
          const sidebarBefore = parseSidebarGrid(tracksBefore)?.sidebar
          const sidebarAfter = parseSidebarGrid(tracksAfter)?.sidebar
          if (sidebarBefore !== sidebarAfter) {
            playCornerMotion(frame, frame.hasAttribute('data-sidebar-collapsed'))
          }
        }
      }
      if (restoreTransition !== undefined) {
        if (!changed) restoreTransition()
        else window.requestAnimationFrame(() => window.requestAnimationFrame(restoreTransition))
      }
    } finally {
      applying = false
    }
  }
  const schedule = (): void => {
    if (pending !== undefined) return
    pending = window.requestAnimationFrame(() => { pending = undefined; apply() })
  }
  apply()
  const observer = new MutationObserver(() => {
    if (frame === undefined || !frame.isConnected) schedule()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    frameObserver?.disconnect()
    if (pending !== undefined) window.cancelAnimationFrame(pending)
    if (frame !== undefined) restoreHostSidebar(frame)
  }
}
