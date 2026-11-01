/** Codex 会把"完全权限"工具标签染成品牌橙 #E25507；宿主文案由权限预设包渲染，
 *  容器和标签层级随版本变化，因此按可见文本精确识别后打标，样式用 !important 压过宿主文字色。 */
const FULL_ACCESS_LABELS = new Set(['完全权限', 'Full access'])
/** 权限控件可能是 button、[role=button] 或带 aria-haspopup 的容器，全部纳入候选。 */
const CANDIDATE = ':is([aria-haspopup],[aria-expanded],[role=button]),button'
const COMPOSER_AREA = '[class*="_heroWorkspaceRow"],[data-composer-card]'

export const FULL_ACCESS_ACCENT_STYLE = `
[data-dcu-full-access]{color:#E25507!important}
[data-dcu-full-access] *{color:#E25507!important}
`

function isFullAccess(element: Element): boolean {
  return FULL_ACCESS_LABELS.has((element.textContent ?? '').replace(/\s+/g, ''))
}

export function observeFullAccessAccent(): () => void {
  let frame: number | undefined
  const scan = () => {
    frame = undefined
    for (const element of document.querySelectorAll<HTMLElement>(CANDIDATE)) {
      element.toggleAttribute('data-dcu-full-access', isFullAccess(element))
    }
  }
  const schedule = () => {
    if (frame === undefined) frame = window.requestAnimationFrame(scan)
  }
  /** 只扫描输入区工具条附近的变化；流式输出的消息节点被过滤掉，不额外占用主线程。 */
  function touchesComposer(records: MutationRecord[]): boolean {
    for (const record of records) {
      const element = record.target instanceof Element ? record.target : record.target.parentElement
      if (element === null) continue
      if (element.closest(COMPOSER_AREA) !== null) return true
      if (record.addedNodes.length === 0) continue
      if (element.querySelector(':is([aria-haspopup],[aria-expanded])') !== null) return true
    }
    return false
  }
  const observer = new MutationObserver(records => { if (touchesComposer(records)) schedule() })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  document.addEventListener('pointerdown', schedule, true)
  document.addEventListener('keydown', schedule, true)
  scan()
  return () => {
    observer.disconnect()
    document.removeEventListener('pointerdown', schedule, true)
    document.removeEventListener('keydown', schedule, true)
    if (frame !== undefined) { window.cancelAnimationFrame(frame); frame = undefined }
    document.querySelectorAll('[data-dcu-full-access]').forEach(el => el.removeAttribute('data-dcu-full-access'))
  }
}
