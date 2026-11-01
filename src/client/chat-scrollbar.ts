/**
 * 把会话滚动条的「长条」钉到窗口最右缘。
 *
 * 会话区的滚动容器（`[data-conversation-scroll]`）右缘会被右侧停靠面板挤进窗口
 * 中部，原生 5px 滚动条跟着骑在那个边上，看起来悬在半空。原生滚动条离不开自己
 * 的容器，所以这里把原生条藏掉，渲染一条自己的轨：fixed 定位钉在视口右缘，滑块
 * 几何每帧从滚动容器实测，拖动、点按轨道、滚轮都写回容器的 scrollTop——容器照
 * 常滚动，只是长条换了位置。
 *
 * 容器可能随会话切换销毁重建，观察器按 official-turn-navigator 的模式做全量扫描
 * + 过滤；滑块几何走 scroll 事件和 ResizeObserver，不跑常驻动画循环。
 */

const SCROLL_ROOT = '[data-conversation-scroll]'
const RAIL_MARK = 'data-dcu-chat-rail'

export const CHAT_SCROLLBAR_STYLE = `
${SCROLL_ROOT}{scrollbar-width:none}
${SCROLL_ROOT}::-webkit-scrollbar{width:0;height:0}
[data-dcu-chat-scrollbar]{scrollbar-width:none}
[data-dcu-chat-scrollbar]::-webkit-scrollbar{width:0;height:0}
[data-conversation-region="chat"][data-dcu-center-comp]{padding-left:var(--dcu-center-comp-width,14px)!important;transition:padding-left var(--ds-transition-duration-slow,200ms) var(--ds-ease-in-out,ease)}
[${RAIL_MARK}]{position:fixed;z-index:30;right:0;width:14px;box-sizing:border-box;padding:2px 0;pointer-events:auto;touch-action:none}
[${RAIL_MARK}][data-overflow=false]{display:none}
[${RAIL_MARK}]::-webkit-scrollbar{display:none}
[${RAIL_MARK}] .dcu-chat-rail-thumb{position:absolute;right:3px;width:5px;border-radius:3px;background:var(--dsh-scrollbar-thumb,var(--dsw-alias-scrollbar-bg-l1));min-height:40px}
[${RAIL_MARK}]:hover .dcu-chat-rail-thumb,[${RAIL_MARK}] .dcu-chat-rail-thumb[data-dragging=true]{background:var(--dsh-scrollbar-thumb-hover,var(--dsw-alias-scrollbar-hover-l1))}
`

type Rail = {
  scroller: HTMLElement
  rail: HTMLElement
  thumb: HTMLElement
  /** 拖动中的起始值；不拖时为 null。 */
  drag: { pointerId: number; pointerY: number; scrollTop: number; span: number } | null
}

function verticallyScrollable(el: HTMLElement): boolean {
  const overflow = getComputedStyle(el).overflowY
  return (overflow === 'auto' || overflow === 'scroll') && el.scrollHeight - el.clientHeight > 1
}

/**
 * 真正承载会话滚动的元素：通常是容器本身，但宿主可能把滚动交给更内层（ChatView 的
 * 滚动层）——那条内层原生条才是用户拖着走的长条。从消息锚点向上找最近的可滚祖先。
 */
function transcriptScroller(root: HTMLElement): HTMLElement {
  const anchor = root.querySelector('[data-chat-anchor-key]')
  let element = anchor instanceof Element ? anchor.parentElement : null
  while (element !== null && element !== undefined && element !== root && root.contains(element)) {
    if (element instanceof HTMLElement && verticallyScrollable(element)) return element
    element = element.parentElement
  }
  return root
}

export function observeChatScrollbar(doc: Document = document, label = '会话滚动条'): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {}
  const style = doc.createElement('style')
  style.setAttribute('data-dcu-chat-scrollbar-style', '')
  style.textContent = CHAT_SCROLLBAR_STYLE
  doc.head.append(style)

  const rails = new Map<HTMLElement, Rail>()
  /** 每个会话区已写入的居中补偿量：值没变不重复写样式。 */
  const appliedComp = new WeakMap<HTMLElement, number>()
  let scanFrame: number | undefined
  let paintFrame: number | undefined

  const geometry = (rail: Rail): { overflow: boolean; thumbTop: number; thumbHeight: number; top: number; height: number } | undefined => {
    const scroller = rail.scroller
    if (!scroller.isConnected) return undefined
    const box = scroller.getBoundingClientRect()
    if (box.height <= 0) return undefined
    const span = scroller.scrollHeight - scroller.clientHeight
    const overflow = span > 1
    const track = box.height - 4 // 上下各留 2px，与轨的 padding 对齐
    const thumbHeight = overflow ? Math.max(40, Math.round(scroller.clientHeight / scroller.scrollHeight * track)) : 0
    const progress = span > 0 ? scroller.scrollTop / span : 0
    return {
      overflow,
      thumbTop: Math.round(progress * (track - thumbHeight)),
      thumbHeight,
      top: Math.round(box.top),
      height: Math.round(box.height),
    }
  }

  const paint = (): void => {
    paintFrame = undefined
    for (const rail of rails.values()) {
      const state = geometry(rail)
      if (state === undefined) continue
      rail.rail.dataset.overflow = String(state.overflow)
      rail.rail.style.top = `${state.top}px`
      rail.rail.style.height = `${state.height}px`
      rail.thumb.style.height = `${state.thumbHeight}px`
      rail.thumb.style.transform = `translateY(${state.thumbTop}px)`
      const span = rail.scroller.scrollHeight - rail.scroller.clientHeight
      rail.rail.setAttribute('aria-valuenow', String(span > 0 ? Math.round(rail.scroller.scrollTop / span * 100) : 0))
    }
    syncCenterComp()
  }

  const schedulePaint = (): void => {
    if (paintFrame !== undefined) return
    paintFrame = window.requestAnimationFrame(paint)
  }

  const scrollToFraction = (rail: Rail, clientY: number): void => {
    const box = rail.rail.getBoundingClientRect()
    const track = box.height - 4
    const span = rail.scroller.scrollHeight - rail.scroller.clientHeight
    if (span <= 0 || track <= 0) return
    const thumbHeight = Math.max(40, rail.scroller.clientHeight / rail.scroller.scrollHeight * track)
    const y = Math.min(Math.max(clientY - box.top - 2 - thumbHeight / 2, 0), track - thumbHeight)
    rail.scroller.scrollTop = y / (track - thumbHeight) * span
  }

  const bindRail = (rail: Rail): void => {
    rail.thumb.addEventListener('pointerdown', event => {
      const span = rail.scroller.scrollHeight - rail.scroller.clientHeight
      rail.drag = { pointerId: event.pointerId, pointerY: event.clientY, scrollTop: rail.scroller.scrollTop, span }
      rail.thumb.dataset.dragging = 'true'
      try { rail.thumb.setPointerCapture(event.pointerId) } catch {}
      event.preventDefault()
    })
    rail.thumb.addEventListener('pointermove', event => {
      if (rail.drag === null || event.pointerId !== rail.drag.pointerId) return
      const box = rail.rail.getBoundingClientRect()
      const track = box.height - 4
      const thumbHeight = Math.max(40, rail.scroller.clientHeight / rail.scroller.scrollHeight * track)
      const grip = track - thumbHeight
      if (grip <= 0 || rail.drag.span <= 0) return
      rail.scroller.scrollTop = rail.drag.scrollTop + (event.clientY - rail.drag.pointerY) / grip * rail.drag.span
    })
    const release = (event: PointerEvent): void => {
      if (rail.drag === null || event.pointerId !== rail.drag.pointerId) return
      rail.drag = null
      delete rail.thumb.dataset.dragging
      try { rail.thumb.releasePointerCapture(event.pointerId) } catch {}
    }
    rail.thumb.addEventListener('pointerup', release)
    rail.thumb.addEventListener('pointercancel', release)
    rail.rail.addEventListener('pointerdown', event => {
      if (event.target !== rail.rail) return
      scrollToFraction(rail, event.clientY)
    })
    rail.rail.addEventListener('wheel', event => {
      event.preventDefault()
      rail.scroller.scrollBy({ top: event.deltaY })
    }, { passive: false })
    rail.scroller.addEventListener('scroll', schedulePaint, { passive: true })
  }

  const scan = (): void => {
    scanFrame = undefined
    for (const root of doc.querySelectorAll<HTMLElement>(SCROLL_ROOT)) {
      const scroller = transcriptScroller(root)
      if (rails.has(scroller)) continue
      const rail = doc.createElement('div')
      rail.className = 'dcu-chat-rail'
      rail.setAttribute(RAIL_MARK, '')
      rail.setAttribute('role', 'scrollbar')
      rail.setAttribute('aria-orientation', 'vertical')
      rail.setAttribute('aria-label', label)
      if (scroller.id !== '') rail.setAttribute('aria-controls', scroller.id)
      const thumb = doc.createElement('div')
      thumb.className = 'dcu-chat-rail-thumb'
      rail.append(thumb)
      doc.body.append(rail)
      const entry: Rail = { scroller, rail, thumb, drag: null }
      rails.set(scroller, entry)
      bindRail(entry)
      const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedulePaint)
      observer?.observe(scroller)
      for (const child of scroller.children) observer?.observe(child)
      scroller.setAttribute('data-dcu-chat-scrollbar', '')
    }
    prune()
    syncCenterComp()
    schedulePaint()
  }

  /**
   * 居中补偿：右侧停靠面板推开会话区后，容器右缘到面板之间隔着滚动条槽与面板边距，
   * 对话列中心偏左。补偿量不写死——用消息锚点的包盒实测对话列的真实左右缘，量出
   * 「右缝 − 左缝」作为 padding-left（列中心恰好右移差值的一半，两缝相等）。
   *
   * 测量只在「未补偿」状态下做一次：补偿一半进左缝、一半进右缝，带着过渡边测量边
   * 施加会自激振荡（200ms 过渡就是控制延迟）。baseDiff 是布局结构常量（滚动条槽 +
   * 面板边距），不随列宽、滚动、流式输出变化，量一次就够；面板收起时撤掉，重开重测。
   */
  function syncCenterComp(): void {
    for (const scroller of rails.keys()) {
      const region = scroller.closest<HTMLElement>('[data-conversation-region="chat"]')
      if (region === null) continue
      const regionBox = region.getBoundingClientRect()
      const docked = regionBox.right < window.innerWidth - 40
      if (!docked) {
        if (appliedComp.get(region) !== 0) {
          appliedComp.set(region, 0)
          region.removeAttribute('data-dcu-center-comp')
          region.style.removeProperty('--dcu-center-comp-width')
        }
        continue
      }
      // 已在补偿态：保持现值。重测会用「含补偿」的几何喂回自己，永远追不稳。
      if (region.hasAttribute('data-dcu-center-comp')) continue
      let left = Number.POSITIVE_INFINITY
      let right = Number.NEGATIVE_INFINITY
      for (const anchor of region.querySelectorAll('[data-chat-anchor-key]')) {
        const box = anchor.getBoundingClientRect()
        if (box.width <= 0) continue
        left = Math.min(left, box.left)
        right = Math.max(right, box.right)
      }
      if (!Number.isFinite(left) || right <= left) continue
      const panel = doc.querySelector('[data-sidebar-right-panel]')
      const panelBox = panel instanceof HTMLElement ? panel.getBoundingClientRect() : null
      // 面板与容器齐边（left ≈ region.right），且收起时被 transform 滑出窗口：
      // 只认「停在会话区右侧、还在窗口内」的面板位置作为右边界。
      const boundary = panelBox !== null && panelBox.left > regionBox.left + 40 && panelBox.left < window.innerWidth - 40
        ? panelBox.left
        : window.innerWidth
      const diff = Math.round((boundary - right) - (left - regionBox.left))
      // 用户偏好：宁可左缝略大也不右缝略大——补偿多加 2px，列中心右移 1px。
      const compensation = diff > 4 ? Math.min(diff + 2, 62) : 0
      appliedComp.set(region, compensation)
      if (compensation > 0) {
        region.setAttribute('data-dcu-center-comp', '')
        region.style.setProperty('--dcu-center-comp-width', `${compensation}px`)
      }
    }
  }

  function prune(): void {
    for (const [scroller, rail] of [...rails]) {
      if (scroller.isConnected) continue
      rail.rail.remove()
      rails.delete(scroller)
    }
  }

  const scheduleScan = (): void => {
    if (scanFrame !== undefined) return
    scanFrame = window.setTimeout(scan, 0)
  }

  /** 只有会话滚动容器附近的变化才值得重扫；流式输出的消息节点在容器内，不会触发重建。 */
  function touchesScroller(records: readonly MutationRecord[]): boolean {
    for (const record of records) {
      const element = record.target instanceof Element ? record.target : record.target.parentElement
      if (element === null) continue
      if (element.closest(SCROLL_ROOT) !== null) continue
      if (record.addedNodes.length === 0) continue
      for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches(SCROLL_ROOT) || node.querySelector(SCROLL_ROOT) !== null)) return true
      }
    }
    return false
  }

  const observer = new MutationObserver(records => { if (touchesScroller(records)) scheduleScan() })
  observer.observe(doc.body, { childList: true, subtree: true })
  window.addEventListener('resize', schedulePaint)
  scan()

  return () => {
    observer.disconnect()
    if (scanFrame !== undefined) window.clearTimeout(scanFrame)
    if (paintFrame !== undefined) window.cancelAnimationFrame(paintFrame)
    scanFrame = paintFrame = undefined
    window.removeEventListener('resize', schedulePaint)
    style.remove()
    for (const [scroller, rail] of rails) {
      rail.rail.remove()
      scroller.removeAttribute('data-dcu-chat-scrollbar')
    }
    for (const region of doc.querySelectorAll('[data-dcu-center-comp]')) region.removeAttribute('data-dcu-center-comp')
    rails.clear()
  }
}
