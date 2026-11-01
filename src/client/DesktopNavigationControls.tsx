import { useSyncExternalStore } from 'react'
import { PanelLeft } from 'lucide-react'
import type { NavigationHistory } from './navigation-history.ts'

export const DESKTOP_NAVIGATION_CONTROLS_STYLE = `
.dcu-desktop-navigation{display:none}
html[data-windows-titlebar] .dcu-desktop-navigation{display:flex;position:fixed;left:12px;top:calc((var(--dsh-windows-titlebar-height,40px) - 28px)/2);gap:8px;z-index:30;-webkit-app-region:no-drag}
.dcu-desktop-navigation button{appearance:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;-webkit-app-region:no-drag}
.dcu-desktop-navigation button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dcu-desktop-navigation button:disabled{opacity:.35;cursor:default}
.dcu-desktop-navigation button:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
html[data-windows-titlebar]:not([data-fullscreen]):not(:has(.dcu-settings-page)):has(.dcu-desktop-navigation){--dsh-windows-menu-start:84px}
/* 折叠键入列标题栏（←/→ 与 应用 菜单之间，Codex/VS Code 同款）时菜单再让出一格 */
html[data-windows-titlebar]:not([data-fullscreen]):not(:has(.dcu-settings-page)):has(.dcu-desktop-navigation[data-collapse]){--dsh-windows-menu-start:120px}
html[data-windows-titlebar][data-fullscreen] .dcu-desktop-navigation{display:none}
`

export function DesktopNavigationControls({ history, t, collapse }: {
  history: NavigationHistory
  t: (key: 'navigation.back' | 'navigation.forward') => string
  /** 折叠键：主界面收放侧栏，设置页收放导航列；不提供时不占标题栏席位。 */
  collapse?: { label: string; run: () => void }
}) {
  const state = useSyncExternalStore(history.subscribe, history.getSnapshot, history.getSnapshot)
  return <div className="dcu-desktop-navigation" data-collapse={collapse !== undefined ? '' : undefined}>
    <style>{DESKTOP_NAVIGATION_CONTROLS_STYLE}</style>
    {(['back', 'forward'] as const).map(direction => <button key={direction} type="button"
      aria-label={t(`navigation.${direction}`)} title={t(`navigation.${direction}`)}
      disabled={direction === 'back' ? !state.canBack : !state.canForward} onClick={history[direction]}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={direction === 'back' ? 'M13 8H3m0 0 4-4M3 8l4 4' : 'M3 8h10m0 0-4-4m4 4-4 4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>)}
    {collapse && <button type="button" aria-label={collapse.label} title={collapse.label} onClick={collapse.run}>
      <PanelLeft size={16} strokeWidth={1.6} aria-hidden="true" />
    </button>}
  </div>
}
