import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'

function heroWorkspaceChip(): HTMLElement | null {
  return document.querySelector('[data-phase=hero] [class*="_heroWorkspaceRow"] [class$="_workspace"]')
}

/** 宿主工作区选择器是否处于展开状态。 */
function isHeroWorkspacePickerOpen(): boolean {
  return heroWorkspaceChip()?.getAttribute('aria-expanded') === 'true'
}

/** 读取宿主新建页工作区 chip 的展示名；占位状态（未选工作区）返回空串。 */
export function readHeroWorkspaceName(): string {
  const chip = heroWorkspaceChip()
  if (chip === null) return ''
  const label = chip.querySelector('[class$="_workspaceLabel"]')?.textContent?.trim() ?? ''
  // 未选工作区时宿主把“选择工作区”占位文案写进同一 label，内容与 chip 的 aria-label 相同。
  return label === '' || label === chip.getAttribute('aria-label')?.trim() ? '' : label
}

/** 点击提问中的工作区名时转发到宿主工作区 chip 弹出同一个选择器，并把弹层锚点临时抬到文字上方（对齐 Codex 的弹出位置）。 */
export function openHeroWorkspacePicker(source: HTMLElement): void {
  const chip = heroWorkspaceChip()
  if (chip === null) return
  const original = chip.getBoundingClientRect
  // 宿主弹层固定 side=bottom（top = anchor.bottom + 4）且每帧重读锚点；
  // 把锚点 bottom 上移到文字上方一个弹层高度，弹层即贴到提问上方。
  chip.getBoundingClientRect = () => {
    const rect = source.getBoundingClientRect()
    const menuHeight = document.querySelector('[role="menu"]')?.getBoundingClientRect().height ?? 0
    const bottom = rect.top - menuHeight - 8
    return new DOMRect(rect.left, bottom - rect.height, rect.width, rect.height)
  }
  // 代理打开期间压住 chip 的 aria-expanded/hover 背景，避免底部 chip 出现“被点击”效果。
  chip.toggleAttribute('data-dcu-proxy', true)
  const restore = () => { chip.getBoundingClientRect = original; chip.toggleAttribute('data-dcu-proxy', false) }
  chip.click()
  // 弹层关闭（chip 的 aria-expanded 复位）或 chip 卸载时恢复原始测量。
  const observer = new MutationObserver(() => {
    if (!chip.isConnected || chip.getAttribute('aria-expanded') !== 'true') { restore(); observer.disconnect() }
  })
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded'] })
  setTimeout(() => { restore(); observer.disconnect() }, 60_000)
}

const NAME_SENTINEL = '‍'

/** 展示用的一句话标题；布局验证脚本用它做静态渲染。工作区名是可点按钮，行为同下方 chip。 */
export function HeroQuestionLine({ t, workspace, onPickWorkspace = openHeroWorkspacePicker }: PropsLocale<typeof NS> & { workspace: string; onPickWorkspace?: (source: HTMLElement) => void }) {
  // 弹层开着时点击文字：外部 pointerdown 已先关闭弹层，click 不能再打开，实现“再点关闭”。
  const wasOpenOnPointerDown = useRef(false)
  if (workspace === '') return <p className="dcu-hero-question">{t('home.heroQuestionEmpty')}</p>
  // 用哨兵词插值后再拆分，兼容不同语序的语言。
  const [before, after = ''] = t('home.heroQuestion', { name: NAME_SENTINEL }).split(NAME_SENTINEL)
  return <p className="dcu-hero-question">{before}<button type="button" className="dcu-hero-workspace"
    onPointerDown={() => { wasOpenOnPointerDown.current = isHeroWorkspacePickerOpen() }}
    onClick={event => {
      if (wasOpenOnPointerDown.current) { wasOpenOnPointerDown.current = false; return }
      // 键盘触发等没有 pointerdown 的场景：已展开则关闭。
      if (isHeroWorkspacePickerOpen()) { heroWorkspaceChip()?.click(); return }
      onPickWorkspace(event.currentTarget)
    }}>{workspace}</button>{after}</p>
}

/** 把“我们应该在{工作区}中做些什么？”portal 进宿主标题，跟随工作区切换实时更新。 */
export function HeroWorkspaceQuestion({ t }: PropsLocale<typeof NS>) {
  const [headline, setHeadline] = useState<HTMLElement | null>(null)
  const [workspace, setWorkspace] = useState(readHeroWorkspaceName)
  useEffect(() => {
    const sync = () => {
      setHeadline(document.querySelector('[data-phase=hero] [class*="_composerHero"] [class$="_headline"]'))
      setWorkspace(readHeroWorkspaceName())
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-phase', 'aria-label'] })
    return () => observer.disconnect()
  }, [])
  return headline === null ? null : createPortal(<HeroQuestionLine t={t} workspace={workspace} />, headline)
}
