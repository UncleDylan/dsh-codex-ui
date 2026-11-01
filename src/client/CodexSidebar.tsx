import { type GlobalPanelSource } from './global-panels.tsx'
import { RailBlocksIcon, RailClockIcon, RailHomeIcon, RailLinkIcon, RailMessageIcon, RailPhotoIcon, RailSparklesIcon, RailUsersIcon, SidebarRail, SidebarRailContext, type RailItem, type SidebarRailApi } from './SidebarRail.tsx'
import { PanelLeft } from 'lucide-react'
import { Fragment, forwardRef, useCallback, useDeferredValue, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import {
  BrandWordmark, Input,
} from '@deepseek-ai/dsh-client-ui-primitives'
import {
  IconLinkOutlineMedium, IconNewChatOutlineMedium, IconSearchOutlineMedium,
} from './host-icons.ts'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace/types'
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'
import { openSettingsRoot, openSettingsSection, routeOptionalSettingsSection } from './settings-navigation.ts'
import { filterSidebarSearchItems, type SidebarSearchItem } from './sidebar-search.ts'
import { EMPTY_COMPANION_TABS, type CompanionTabAvailability } from './companion-slots.ts'
import { ScheduleBrowser } from './ScheduleBrowser.tsx'
import { isSidebarDragHandle, sidebarWidthDuringDrag, shouldCollapseOnSidebarDrag } from './sidebar-drag.ts'
import { applySidebarWidth, findSidebarFrame, parseSidebarGrid, SLIM_SIDEBAR_PX } from './sidebar-width.ts'
import { isTaskSession } from './workspace-browser.ts'
import { clearAutomationTaskSettingsRequest, requestAutomationTaskSettings } from './automation-task-settings.ts'
import type { UseSessionPendingInteraction, UseSessionStatus } from './session-pending.ts'
import { NEW_CONVERSATION_STYLE } from './new-conversation-style.ts'
import { COMPOSER_TOOL_MENU_STYLE } from './composer-tool-menus.ts'
import { FULL_ACCESS_ACCENT_STYLE } from './full-access-accent.ts'
import { DesktopNavigationControls } from './DesktopNavigationControls.tsx'
import type { NavigationHistory } from './navigation-history.ts'
import { beginSidebarSession } from './sidebar-session.ts'
import { WorkspaceShortcutBridge } from './WorkspaceShortcutBridge.tsx'
import type { WorkspaceShortcutSource } from './workspace-shortcuts.ts'
import { HeroWorkspaceQuestion } from './HeroWorkspaceQuestion.tsx'
import type { FooterAction, FooterActionSource } from './footer-actions.ts'
import { browserStorage } from './tree-expansion.ts'

type CompanionTabSource = {
  getSnapshot: () => CompanionTabAvailability
  subscribe: (onStoreChange: () => void) => () => void
}

const subscribeEmptyCompanionTabs = (): (() => void) => () => {}
const getEmptyCompanionTabs = (): CompanionTabAvailability => EMPTY_COMPANION_TABS
const emptyFooterActions: readonly FooterAction[] = []
const getEmptyFooterActions = (): readonly FooterAction[] => emptyFooterActions
/** 淡出与边界移动同为 300ms；只多留 40ms 兜底，避免动画没跑完就被切成窄轨造成突变。 */
const SIDEBAR_COLLAPSE_SETTLE_MS = 340

/** ··· 子项「固定到侧边栏」的持久化键：存的是可固定条目的 id 列表。 */
const RAIL_PINNED_KEY = 'dcu.rail.pinned'

type CodexSidebarInjected = {
  navigationHistory?: NavigationHistory
  workspaceShortcuts?: WorkspaceShortcutSource
  openSession: (sessionId: SessionId) => boolean | void
  startSession: (workspaceId?: WorkspaceId) => unknown
  toggleSidebar: () => void
  archiveSession: (sessionId: SessionId) => Promise<void>
  canDeleteSession?: () => boolean
  deleteSession: (sessionId: SessionId) => Promise<void>
  forkSession: (sessionId: SessionId) => Promise<void>
  moveSession: (sessionId: SessionId, targetWorkspaceId: WorkspaceId) => Promise<void>
  renameSession: (sessionId: SessionId, title: string) => Promise<void>
  openPath: (path: string) => Promise<void> | void
  useSessionPendingInteraction?: UseSessionPendingInteraction
  useSessionStatus?: UseSessionStatus
  globalPanels?: GlobalPanelSource
  footerActions?: FooterActionSource
  selectPanel?: (id: string | null) => void
  usePanelInfo?: <T>(selector: (info: { activePanelId: string | null }) => T) => T
  companionSlots?: CompanionTabSource
}

export type CodexSidebarProps =
  Omit<PropsRuntime<'sidebar'>, 'usePanelInfo'>
  & PropsRenderSlots<'sidebar.panellist' | 'sidebar.workspaces' | 'sidebar.codex.directoryFlow' | 'sidebar.settings' | 'sidebar.footer.action' | 'sidebar.channels' | 'sidebar.schedule'>
  & PropsLocale<typeof NS>
  & CodexSidebarInjected

const emptyPanels: readonly import('./global-panels.tsx').GlobalPanel[] = []
const getEmptyPanels = () => emptyPanels
const useLegacyPanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => selector({ activePanelId: null })

const stylesheet = `

/* 宿主窗口 chrome 底色统一到 Codex 轨道色：Windows 标题栏带（frame 背景与顶部拖动条）和原生窗口按钮区
   都从 --dsw-specific-sidebar-fill 取色；宿主 preload 的 syncWindowsAppearance 会观察样式表变化，
   重新测量该 token 并经 windows-appearance IPC 同步给主进程 titleBarOverlay，无需插件直连主进程。
   宿主把 token 定义在 body 上，必须同样覆盖 body——html/:root 上的定义会被 body 自身定义遮蔽。 */
body{--dsw-specific-sidebar-fill:#f3f3f3;--dcu-sidebar-edge:#f3f3f3;--dcu-sidebar-lift:rgba(0,0,0,.04)}
body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:#0c0c0c;--dcu-sidebar-edge:rgba(255,255,255,.10);--dcu-sidebar-lift:rgba(0,0,0,.32)}
/* 用户消息气泡换色（浅色主题）：宿主把气泡填充 alias 在 --dsw-specific-bubble（=deepseek-50 #edf3fe）、
   文字在 --dsw-alias-label-primary（#0f1115）。作用域钉在用户轮次容器 [data-chat-flow-kind=user] 上：
   只换这两处色值，不碰全局 label-primary，暗色主题（中性深气泡）保持宿主原样。 */
body:not([data-ds-dark-theme]) [data-chat-flow-kind=user]{--dsw-specific-bubble:#e8f3fe;--dsw-alias-label-primary:#0c274a}
/* 链接色（浅色主题）：宿主 alias --dsw-alias-link（=deepseek-500 #4176e6）→ #2858a4。
   只覆盖浅色主题；暗色主题的链接是宿主特意调浅的 deepseek-400，压成深蓝会在暗底上不可读。 */
body:not([data-ds-dark-theme]){--dsw-alias-link:#2858a4}
.dcu-root{--dcu-sidebar-background:#f9f9f9;--dcu-sidebar-rail:#f3f3f3;--dcu-sidebar-primary:#3d3f41;--dcu-sidebar-secondary:#5d5d5d;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#3d3f41;--dcu-sidebar-icon:#5d5d5d;--dcu-sidebar-hover:rgba(13,13,13,.08);--dcu-sidebar-border:rgba(13,13,13,.08);--dcu-tip-bg:#ffffff;--dcu-tip-shadow:0 0 0 .5px rgba(13,13,13,.08),0 3px 7.5px rgba(0,0,0,.03),0 0 16px rgba(0,0,0,.02);width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:row;overflow:hidden;background:var(--dcu-sidebar-rail);color:var(--dcu-sidebar-primary);font:13px/20px var(--dsw-font-family)}
/* 面板右边缘不加圆角：Codex 展开态面板与工作区之间就是一条直角分界线（实测 1px，#f3f3f3）。
   在裁切容器上补圆角会在交界处凭空多出一个缺口，看起来像侧栏和外框"融成一体"。 */body[data-ds-dark-theme] .dcu-root{--dcu-sidebar-background:#101010;--dcu-sidebar-rail:#0c0c0c;--dcu-sidebar-primary:#ededed;--dcu-sidebar-secondary:#afafaf;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#cdcdcd;--dcu-sidebar-icon:#afafaf;--dcu-sidebar-hover:rgba(255,255,255,.10);--dcu-sidebar-border:rgba(255,255,255,.08);--dcu-tip-bg:#1c1c1c;--dcu-tip-shadow:0 0 0 .5px rgba(255,255,255,.08),0 3px 7.5px rgba(0,0,0,.12),0 0 16px rgba(0,0,0,.10)}
/* 滤镜只作用于背景，避免为设置和搜索等 fixed 后代创建侧栏包含块。 */
body[data-we-sidebar-glass] .dcu-root{position:relative;background:transparent}body[data-we-sidebar-glass] .dcu-root::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background-color:color-mix(in srgb,var(--we-sidebar-color,#fff) calc(var(--we-sidebar-alpha,.15)*.66*100%),transparent);background-image:linear-gradient(180deg,rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.14)),rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.04)) 38%,rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.01)));-webkit-backdrop-filter:blur(var(--we-sidebar-blur,16px)) saturate(var(--we-sidebar-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-sidebar-blur,16px)) saturate(var(--we-sidebar-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);box-shadow:inset 0 1px 0 rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.32)),inset 0 -1px 0 rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.08)),inset 0 0 0 .5px rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.06))}body[data-ds-dark-theme][data-we-sidebar-glass] .dcu-root::before{background-color:color-mix(in srgb,var(--we-sidebar-color,#fff) calc(var(--we-sidebar-alpha,.15)*.33*100%),transparent)}body[data-we-appwindow][data-we-sidebar-glass] .dcu-root::before{-webkit-backdrop-filter:none;backdrop-filter:none}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){body[data-we-sidebar-glass] .dcu-root{background:#f9f9f9}body[data-ds-dark-theme][data-we-sidebar-glass] .dcu-root{background:#101010}body[data-we-sidebar-glass] .dcu-root::before{display:none}}
body[data-we-sidebar-glass] .dcu-expanded-shell,body[data-we-sidebar-glass] .dcu-rail,body[data-we-sidebar-glass] .dcu-foot{position:relative}
body[data-we-sidebar-glass] .dcu-rail{background:transparent}
.dcu-expanded-shell{display:flex;width:100%;min-height:0;flex:1 1 0;overflow:hidden;flex-direction:column;transform-origin:left center}
/* 面板本体（底色 + 左上角 16px 圆角）开合全程保持不透明，只被右边界的 overflow 随列宽裁掉——
   圆角因此始终钉在原地（x = 窄轨右沿），边界线平滑推移。淡入淡出只给面板内容，
   否则整块面板透明化会让圆角线跟着消失，观感就是"侧栏融进外框"。 */
.dcu-expanded-shell>*{transition:opacity var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1));animation:dcu-sidebar-expanded-in var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}.dcu-root.dcu-collapsing .dcu-expanded-shell>*{opacity:0}.dcu-root.dcu-compact .dcu-expanded-shell{display:none}/* 进场动画会锁定子元素 opacity 并压过 transition，收起时必须让位给渐变淡出，否则整帧跳成 0。 */.dcu-root.dcu-collapsing .dcu-expanded-shell>*,.dcu-root.dcu-compact .dcu-expanded-shell>*{animation:none}@keyframes dcu-sidebar-expanded-in{from{opacity:0}to{opacity:1}}
/* 面板左上角在折叠图标与品牌 logo 之间做圆角过渡：面板自绘底色，缺口透出轨道色；玻璃壁纸模式保持透明交给 ::before。
   同时按 Codex 的做法：面板与工作区（#ffffff）之间压一条 --dcu-sidebar-edge 分界线，
   并向图标轨一侧投出低强度 drop shadow（Codex 实测轨道底色从 #f3f3f3 渐暗到 #ebebeb，约 15px 衰减）。 */
/* 顶栏条（宿主 frame::before）与常驻窄轨同为 --dsw-specific-sidebar-fill = #f3f3f3，是一整块背景，
   因此不在顶栏上叠加任何投影——投影只会让顶栏偏离 #f3f3f3，破坏与窄轨的整体感。 */
body:not([data-we-sidebar-glass]) .dcu-expanded-shell{background:var(--dcu-sidebar-background);border-top-left-radius:16px;box-shadow:-6px 0 12px -5px var(--dcu-sidebar-lift),inset -1px 0 0 var(--dcu-sidebar-edge)}
/* Windows 原生标题栏下宿主用 --dsh-windows-content-radius 给工作区（中列）加 16px 圆角：右上角是窗口外角，
   恢复 Codex 同款 16px 圆角；左侧与侧栏的交界必须是直角——用 border-top-left-radius 显式清零
   （圆角声明在中列本身，特异性与顺序都压过宿主从 frame 继承的规则）。 */
[data-windows-titlebar] :is([class$="_centerCol"],[class$="_detailsCol"]){--dsh-windows-content-radius:16px;border-top-left-radius:0;border-top-right-radius:16px}
/* 折叠后侧栏只剩窄轨，不再有需要直角拼接的面板边界，工作区左上角恢复 Codex 折叠态的完整圆角（缺口透出窄轨底色）。 */
[data-windows-titlebar] [data-sidebar-collapsed] :is([class$="_centerCol"],[class$="_detailsCol"]){border-top-left-radius:var(--dsh-windows-content-radius,16px)}
/* 右栏（工作区文件/终端/浏览器等分页）内部自绘白底，宿主又给了 overflow:visible，
   在列上写 border-radius 裁不出圆角；因此由 sidebar-width.ts 给「最右侧可见列」打上
   data-dcu-outer-corner，这里用 16px 角落遮罩把窗口外角画出来——位置钉死在窗口右上角，
   右栏展开/收起时不会跟着对话区一起平移。 */
[data-dcu-outer-corner]{position:relative}
[data-dcu-outer-corner]::after{content:'';position:absolute;top:0;right:0;width:16px;height:16px;z-index:2147483647;pointer-events:none;background:radial-gradient(circle at 0 16px,transparent 16px,var(--dsw-specific-sidebar-fill,#f3f3f3) 16px)}
/* 右侧工作区分页（dock pane，浏览器/终端/开始页等）之间的缝隙有两处来源，必须分别覆盖：
   ① 单个分页容器自己的边框：border-left:.5px solid var(--dsw-alias-border-l4)；
   ② 分屏（两个分页并排）时它们之间的分隔条：宿主不画边框，而是用 0 宽分隔条的
      ::before 铺一条 .5px 背景线，颜色同样是 l4。
   l4 = #00000029，叠在白底上呈 #d6d6d6、叠在 #f3f3f3 缝隙上呈 #cccccc，都比侧栏深一档。
   这里只改这两条线自身（不能整体覆盖 --dsw-alias-border-l4，否则重命名输入框、
   展开搜索框等所有 l4 边框都会跟着变浅）。第 ① 条用 _tabHost_ 类名匹配而非
   data-dockkit-pane——实测分屏第二格不带该属性，按属性选会漏染。两条线都提到 1px，
   与侧栏面板和工作区之间的 1px 分界线同粗；深色主题维持宿主默认。
   宽度只对横向分屏（_splitRow_）生效：纵向分屏的 ::before 是靠 left/right 撑满的，
   改 width 会把那条横线截成 1px。 */
body:not([data-ds-dark-theme]) [data-dockkit-divider]::before{background:var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
body:not([data-ds-dark-theme]) [class*="_splitRow_"]>[data-dockkit-divider]::before{left:-.5px;width:1px;background:var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
body:not([data-ds-dark-theme]) [class*="_tabHost_"]:not([class*="_float_"]){border-left:1px solid var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
/* 注意：绝不能用 [class$="_frame"] 给 frame 涂底色——聊天视图里也有 *_frame 类（EvIC1a_frame 等），
   会把整个会话区涂成 #f3f3f3；宿主在 [data-windows-titlebar] 下本来就会给应用外框涂 --dsw-specific-sidebar-fill。 */
/* ChatGPT 同款常驻图标竖栏：48px，独立深一号底色（Codex 轨道 #f3f3f3），点图标切换面板视图。 */
/* 折叠键在 Windows 标题栏（←/→ 与 应用 菜单之间，Codex/VS Code 同款）；非 Windows 平台保留在轨上。 */
html[data-windows-titlebar] .dcu-rail .dcu-rail-collapse{display:none}
/* Tabler plug 画在 24 网格上、四周留白比宿主 16 网格图标大，放大一号才与其他轨图标等墨量。 */
.dcu-rail{display:flex;flex:none;width:48px;flex-direction:column;align-items:center;gap:8px;padding:9px 0 8px;background:var(--dcu-sidebar-rail)}.dcu-rail .dcu-icon:hover{color:var(--dcu-sidebar-primary)}.dcu-rail .dcu-icon[aria-current=page]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}/* 只在实际发生动作（如正在新建会话）时点亮，不做常亮装饰。 */.dcu-rail .dcu-icon[data-busy]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}.dcu-rail-divider{flex:none;width:24px;height:1px;margin:4px 0;background:var(--dcu-sidebar-border)}.dcu-rail-spacer{flex:1}
/* Codex 轨道按钮为 36px 圆形点击区（窄轨 48px 居中留白），图标本体 18px svg；非主按钮墨色 #929393，新聊天 #1a1c1f。扩展槽图标统一去色。 */
.dcu-rail .dcu-icon{width:36px;height:36px;margin:0;padding:0;border-radius:50%;line-height:0;color:var(--dcu-sidebar-tertiary)}.dcu-rail .dcu-icon svg{width:18px;height:18px}.dcu-rail .dcu-rail-primary{background:color-mix(in srgb,var(--dcu-sidebar-primary) 8%,var(--dcu-sidebar-rail));color:var(--dcu-sidebar-primary)}.dcu-rail>.dcu-icon :is(svg,img){filter:grayscale(1)}
.dcu-root *{box-sizing:border-box}.dcu-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:8px;flex:none;height:var(--dcu-header-height,46px);padding:calc((var(--dcu-header-height,46px) - 28px)/2) 8px calc((var(--dcu-header-height,46px) - 28px)/2) 12px}.dcu-brand{border:0;background:transparent;color:inherit;padding:0;display:flex;align-items:center;min-width:0;overflow:hidden}.dcu-brand svg{display:block;width:auto;max-width:100%;height:24px;min-width:0}.dcu-head-actions{display:grid;grid-auto-flow:column;grid-auto-columns:28px;align-items:center;column-gap:8px;height:28px}
.dcu-icon,.dcu-menu button,.dcu-footer-link{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.dcu-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;color:var(--dcu-sidebar-icon)}.dcu-head .dcu-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;margin:0;padding:0;border-radius:50%;line-height:0}.dcu-head .dcu-icon svg{display:block;width:14px;height:14px}
.dcu-icon:hover,.dcu-menu button:hover:not(:disabled),.dcu-footer-link:hover{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}
.dcu-menu{padding:0 8px 8px;display:grid;gap:2px}.dcu-menu button,.dcu-footer-link{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:8px;align-items:center;width:100%;min-height:36px;padding:0 8px;border-radius:8px;color:var(--dcu-sidebar-navigation);font-size:14px;line-height:20px;text-align:left;font-weight:400}.dcu-menu button[aria-current=page]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary);font-weight:500}
.dcu-menu-icon{display:grid;place-items:center start;width:20px;height:20px}.dcu-menu-icon svg,.dcu-footer-link svg{display:block;width:16px;height:16px;color:var(--dcu-sidebar-icon)}.dcu-menu button:disabled{color:var(--dcu-sidebar-secondary);cursor:default;opacity:1}.dcu-menu button:disabled svg{color:var(--dcu-sidebar-secondary)}
.dcu-workspaces{display:flex;min-height:0;flex:1;flex-direction:column;margin-top:2px;padding-top:8px}/* 分割线已删：新建任务与置顶之间靠间距分层。 */.dcu-workspaces.dcu-workspaces-tabs{padding-top:0;border-top:0}.dcu-native-workspaces{display:flex;min-height:0;flex:1}.dcu-native-workspaces>*{min-width:0;flex:1}.dcu-native-workspaces .ima-tabs,.dcu-native-workspaces [role=tablist]:not(.dcu-schedule-segmented-tabs){display:none!important}.dcu-schedule-browser{display:flex;min-height:0;flex:1;flex-direction:column}.dcu-native-workspaces .dcu-schedule-views{display:flex!important;flex:none;margin:2px 8px 8px;padding:0}.dcu-native-workspaces .dcu-schedule-views [role=tablist],.dcu-schedule-views .dcu-schedule-segmented-tabs{display:grid!important;width:100%;margin:0!important;padding:2px!important;background:color-mix(in srgb,var(--dcu-sidebar-primary) 3%,transparent)!important;border-radius:8px!important;border:0.5px solid var(--dcu-sidebar-border)!important;box-sizing:border-box}.dcu-schedule-views .dcu-schedule-segmented-tabs>span{inset:2px auto 2px 2px!important;border-radius:6px!important;border:0.5px solid color-mix(in srgb,var(--dcu-sidebar-primary) 12%,transparent)!important;background:color-mix(in srgb,var(--dcu-sidebar-primary) 8%,transparent)!important;box-shadow:none!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:100%!important;height:26px!important;padding:0 6px!important;font-size:13px!important;line-height:18px!important;border-radius:6px!important;color:var(--dcu-sidebar-secondary);font-weight:500;text-align:center!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]>*{display:inline-flex!important;align-items:center!important;justify-content:center!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]:hover{color:var(--dcu-sidebar-primary)}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab][aria-selected=true]{color:var(--dcu-sidebar-primary)!important;font-weight:600}.dcu-schedule-pane{display:flex;min-height:0;flex:1}.dcu-schedule-pane>*{min-width:0;flex:1}.dcu-schedule-pane>[data-slot="sidebar.schedule"]{display:flex!important;width:100%;min-width:0;flex:1}.dcu-schedule-pane .dsh-st-rail{width:100%;min-width:0;padding:0;scrollbar-gutter:auto}.dcu-schedule-pane .dsh-st-overview{padding:2px 8px 14px;scrollbar-gutter:auto}.dcu-foot{display:grid;width:100%;gap:4px;padding:8px 8px 12px;border-top:1px solid var(--dcu-sidebar-border);transition:opacity var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),transform var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}.dcu-root.dcu-collapsing .dcu-foot{opacity:0;transform:translateX(-4px);pointer-events:none}.dcu-footer-actions:empty,.dcu-settings-seat:empty{display:none}.dcu-settings-seat>[data-dcu-settings-trigger]{width:100%;min-height:36px;padding-left:4px!important;color:var(--dcu-sidebar-navigation);font:13px/20px var(--dsw-font-family);font-weight:400}.dcu-compact{width:100%;overflow:hidden}.dcu-rail .dcu-settings-seat{width:36px;overflow:hidden}.dcu-rail .dcu-settings-seat>[data-dcu-settings-trigger]{display:grid;place-items:center;width:36px;min-height:36px;padding:0!important;font-size:0!important;line-height:0;border-radius:50%}.dcu-rail .dcu-settings-seat>[data-dcu-settings-trigger] svg{width:16px;height:16px}
.dcu-settings-seat [data-slot="settings.trigger"]{color:var(--dcu-sidebar-navigation)}
.dcu-settings-seat [data-slot="settings.trigger"]>svg{color:var(--dcu-sidebar-icon)}
/* 宿主列负责缩放，宽态内容锁为「列宽 − 48px 图标轨」，避免宿主动画把文字挤成竖排。 */
.dcu-expanded-shell{width:calc(var(--dcu-sidebar-expanded-width,340px) - 48px);flex:none}
/* 侧栏开合节奏：300ms 两端缓冲的标准曲线。
   此前用 500ms cubic-bezier(.16,1,.3,1)（指数衰减），实测前 100ms 就走完 93% 的位移、
   剩下 400ms 只在最后 27px 磨蹭，观感是「瞬跳 + 拖尾」而非边界线平移；
   cubic-bezier(.4,0,.2,1) 让 50% 的时间走约 60% 的距离，视觉上是匀速推进的分界线，并与宿主 .3s 面板节奏一致。 */
body{--dcu-sidebar-motion-duration:300ms;--dcu-sidebar-motion-ease:cubic-bezier(.4,0,.2,1)}
/* 顶栏按窄轨宽度补偿窗口安全区；注册成 <length> 后可与列宽同步插值，避免标题在第 1 帧瞬移。 */
@property --dcu-sidebar-rail-width{syntax:"<length>";inherits:true;initial-value:0px}
.dcu-root{position:relative}
/* 原生交通灯覆盖网页顶部；宽态、窄轨和动画层共用宿主安全区，保持页脚在窗口内。 */
.dcu-root{--dcu-sidebar-top-clearance:0px}
html[data-platform=darwin]:not([data-fullscreen]) .dcu-root{position:relative;--dcu-sidebar-top-clearance:var(--dsh-frame-top-clearance,48px);padding-top:var(--dcu-sidebar-top-clearance)}
/* 只开放顶部空白安全区，不让项目列表、窄轨按钮成为窗口拖动区域。 */
html[data-platform=darwin]:not([data-fullscreen]) .dcu-root::after{content:"";position:absolute;inset:0 0 auto;height:var(--dcu-sidebar-top-clearance);pointer-events:none;-webkit-app-region:drag}
[data-dcu-codex-sidebar-initialized]{transition:grid-template-columns var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),--dcu-sidebar-rail-width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
/* Windows 标题栏条由 --dsh-windows-sidebar-width 决定宽度，必须与列宽同步平移，否则顶栏先到位、侧栏再慢慢追。 */
[data-dcu-codex-sidebar-initialized]::before{transition:width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
/* dsh-better-sidebar 的 #root 布局规则会覆盖 transition 简写；合并两侧过渡而非只争抢左栏。 */
#root [data-dcu-codex-sidebar-initialized]:not([data-dragging]){transition:grid-template-columns var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),--dcu-sidebar-rail-width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),padding-right var(--ds-transition-duration-slow,.3s) var(--ds-ease-in-out,cubic-bezier(.4,0,.2,1))}
#root [data-dcu-codex-sidebar-initialized][data-dragging]{transition:none}
[data-dcu-codex-sidebar-initialized] [data-side="sidebar"]{transition:left var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
[data-dcu-codex-sidebar-initialized][data-dragging],[data-dcu-codex-sidebar-initialized][data-dragging] [data-side="sidebar"],[data-dcu-codex-sidebar-initialized][data-dragging]::before{transition:none}
@media (prefers-reduced-motion:reduce){[data-dcu-codex-sidebar-initialized],[data-dcu-codex-sidebar-initialized] [data-side="sidebar"],[data-dcu-codex-sidebar-initialized]::before,#root [data-dcu-codex-sidebar-initialized]:not([data-dragging]){transition:none}}
.dcu-native-workspaces{flex-direction:column}.dcu-native-workspaces>[data-mcp-connector-top-mount=true]{flex:none}.dcu-root .mcpConnectorLauncher,.dcu-root [data-mcp-connector-top-mount=true]{display:none!important}
.dcu-dependency-notice{margin:0 10px 8px;border:1px solid var(--dcu-sidebar-border);border-radius:8px;padding:8px;color:var(--dcu-sidebar-secondary);font-size:12px;line-height:18px}
.dcu-search-scrim{position:fixed;z-index:10020;inset:0;display:flex;justify-content:center;align-items:flex-start;padding:72px 20px;background:color-mix(in srgb,#000 60%,transparent);animation:dcu-search-scrim-in 140ms ease-out}.dcu-search-dialog{width:min(560px,100%);max-height:min(640px,calc(100vh - 120px));overflow:auto;border:1px solid var(--dcu-sidebar-border);border-radius:16px;padding:10px;background:#ffffff;box-shadow:0 16px 40px rgba(0,0,0,.24);animation:dcu-search-dialog-in 180ms cubic-bezier(.16,1,.3,1)}body[data-ds-dark-theme] .dcu-search-dialog{background:#232323;border-color:rgba(255,255,255,.08);box-shadow:0 16px 40px rgba(0,0,0,.45)}@keyframes dcu-search-scrim-in{from{opacity:0}to{opacity:1}}@keyframes dcu-search-dialog-in{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1}}.dcu-search-input{margin-bottom:8px}.dcu-search-section{padding:6px 0}.dcu-search-title{padding:0 8px 4px;color:var(--dcu-sidebar-tertiary);font-size:12px;font-weight:600}.dcu-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;min-height:34px;border:0;border-radius:8px;padding:6px 8px;background:transparent;color:var(--dcu-sidebar-primary);font:inherit;text-align:left;cursor:pointer}.dcu-search-row:hover,.dcu-search-row[data-active=true]{background:var(--dcu-sidebar-hover)}.dcu-search-main{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-search-detail{max-width:160px;overflow:hidden;color:var(--dcu-sidebar-tertiary);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.dcu-search-empty{padding:18px 8px;color:var(--dcu-sidebar-tertiary);font-size:13px}@media (prefers-reduced-motion:reduce){.dcu-expanded-shell,.dcu-foot,.dcu-search-scrim,.dcu-search-dialog,{animation:none;transition:none}}
[data-conversation-scroll]{--dsh-composer-card-max-width:calc(var(--dsh-chat-content-width) + 32px);--dsh-composer-side-clearance:24px;--dcu-composer-bg:var(--dsw-specific-input-major,#fff);--dcu-composer-shadow:0 0 0 1px #0000000a,0 2px 8px #0000000a,0 4px 40px 8px #00000006}
body[data-ds-dark-theme] [data-conversation-scroll]{--dcu-composer-bg:var(--dsw-alias-bg-layer-2,#242424);--dcu-composer-shadow:inset 0 0 1px #fff3}
[data-conversation-scroll] [data-composer-card]{padding-top:8px;gap:4px;border:0;border-radius:22px;background:var(--dcu-composer-bg);box-shadow:var(--dcu-composer-shadow)}
/* 官方附件轨道用 -6px 抵消 12px 行间距；本皮肤为 4px，改为 +2px 保留附件到正文的 6px。 */
[data-conversation-scroll] [data-composer-card]>[data-slot="conversation.input.attachments"]>:is([class$="_rail"],[class*="_rail_"]){margin-bottom:2px}
[data-conversation-scroll] [data-input-mirror]{min-height:44px}
[data-conversation-scroll] [data-composer-card] [data-input-scroll]{margin-right:0}
[data-conversation-scroll] [data-input-scroll] [data-lexical-editor=true]{min-height:44px;padding:0 12px}
[data-conversation-scroll] [data-composer-placeholder]{inset:0 12px auto}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div{padding:0 8px 8px;gap:5px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div>div{gap:4px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div>div>div{gap:4px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div :is(button,select):not([role]){min-height:28px;height:28px}
/* Codex 蓝色发送键；使用独立颜色，避免壁纸的透明表面令牌影响 currentColor 箭头。 */
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]{width:28px;transform:none;background:#3a83f7;color:#fff}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]:hover:not(:disabled){background:#2f74e0}
body[data-ds-dark-theme] [data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]{background:#3a83f7;color:#fff}
body[data-ds-dark-theme] [data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]:hover:not(:disabled){background:#2f74e0}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div :is(button,select):focus-visible{outline:2px solid var(--dsw-alias-label-secondary);outline-offset:2px}
@supports(corner-shape:superellipse(1.1)){[data-conversation-scroll] [data-composer-card]{border-radius:22px;corner-shape:superellipse(1.1)}}
@media(max-width:639px){[data-conversation-scroll]{--dcu-composer-shadow:0 0 0 1px #0000000a,0 2px 8px #0000000a,0 4px 40px 8px #00000006}}
@media(forced-colors:active){[data-conversation-scroll] [data-composer-card]{outline:1px solid CanvasText}}
html[data-dcu-official-turn-navigator-supported=true] .dcu-turn-navigator,html:has([data-dcu-official-turn-navigator]) .dcu-turn-navigator{display:none}
/* 输入区把 clearance 设成 24px 后，旧镜像公式会变成 -28px，整条导航滑进侧栏。至少留 12px，贴在会话列内侧。 */
[data-dcu-official-turn-navigator]{right:auto!important;left:max(12px,calc(12px - (var(--dsh-composer-side-clearance) + 16px)))!important}
/* 左移后的预览朝聊天内容区展开，外观和动画继续使用宿主规则。 */
[data-dcu-official-turn-navigator] [role=tooltip]{right:auto!important;left:calc(100% + 10px)!important}
/* 右停靠面板的居中补偿改由 chat-scrollbar.ts 实测打标（data-dcu-center-comp）：
   面板以 float 形式打开时没有 data-sidebar-right-open，:has 门控匹配不到。 */
`

function MenuIcon({ children }: { children: ReactNode }) { return <span className="dcu-menu-icon">{children}</span> }
function ScheduleIcon() {
  return <RailClockIcon />
}
function ImAssistantIcon() {
  return <svg viewBox="0 0 16 16" width={16} height={16} fill="none" aria-hidden="true"><path fill="currentColor" d="M2.15 2.9h11.7v8.2H6.42L2.15 13.85V2.9Zm1.4 1.4v6.62l1.78-1.12h7.12V4.3H3.55Z" /></svg>
}

type SearchEntry = SidebarSearchItem & {
  readonly group: 'sessions' | 'settings' | 'actions'
  readonly detail?: string
  readonly run: () => void
}

type SidebarSearchHandle = { open: () => void }

type SidebarSearchProps = Pick<CodexSidebarProps, 'openSession' | 'startSession' | 't' | 'useSessions' | 'useWorkspaces'> & {
  imSettingsAvailable: boolean
  openPlugins: () => void
  settingsSeat: RefObject<HTMLDivElement>
}

type SidebarSearchModalProps = SidebarSearchProps & {
  onClose: () => void
}

function SidebarSearchModal({
  imSettingsAvailable, openPlugins, openSession, startSession, t, useSessions, useWorkspaces, settingsSeat, onClose,
}: SidebarSearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const deferredQuery = useDeferredValue(query)
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state)

  const selectSection = useCallback((label: string): void => {
    openSettingsSection(settingsSeat.current, label)
  }, [settingsSeat])
  const selectExternalSection = useCallback((label: string | readonly string[]): void => {
    openSettingsSection(settingsSeat.current, label, () => { selectSection(t('about.nav')) })
  }, [selectSection, settingsSeat, t])
  const openImSettings = useCallback((): void => {
    routeOptionalSettingsSection(
      imSettingsAvailable,
      () => { selectExternalSection([t('sidebar.imSettings'), 'IM助理']) },
      () => { selectSection(t('about.nav')) },
    )
  }, [imSettingsAvailable, selectExternalSection, selectSection, t])
  const openSettings = useCallback((): void => {
    openSettingsRoot(settingsSeat.current)
  }, [settingsSeat])

  const entries = useMemo<SearchEntry[]>(() => {
    const archived = new Set(workspaces.archivedSessionIds)
    const workspaceTitles = new Map(workspaces.items.flatMap(workspace => workspace.sessionIds.map(sessionId => [String(sessionId), workspace.title])))
    const sessionEntries = sessions.ids
      .map(id => sessions.byId[id])
      .filter((session): session is NonNullable<typeof session> => session !== undefined && !archived.has(session.id) && isTaskSession(session))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(session => ({ id: `session:${session.id}`, group: 'sessions' as const, label: session.displayTitle, keywords: `${session.cwd ?? ''} ${session.id}`, detail: workspaceTitles.get(String(session.id)) ?? session.cwd, run: () => { onClose(); openSession(session.id) } }))
    const settingEntries: SearchEntry[] = [
      { id: 'settings:root', group: 'settings', label: t('search.settings'), keywords: t('search.settings'), run: () => { onClose(); openSettings() } },
      { id: 'settings:experts', group: 'settings', label: t('sidebar.experts'), keywords: t('search.settings'), run: () => { onClose(); selectExternalSection(t('sidebar.experts')) } },
      { id: 'settings:skills', group: 'settings', label: t('sidebar.skills'), keywords: t('search.settings'), run: () => { onClose(); selectExternalSection(t('sidebar.skills')) } },
      { id: 'settings:plugins', group: 'settings', label: t('sidebar.plugins'), keywords: t('search.settings'), run: () => { onClose(); openPlugins() } },
      { id: 'settings:plugin-config', group: 'settings', label: t('settings.pluginConfig'), keywords: t('search.settings'), run: () => { onClose(); openSettingsSection(settingsSeat.current, t('settings.pluginConfig')) } },
      { id: 'settings:connectors', group: 'settings', label: t('sidebar.connectors'), keywords: t('search.settings'), run: () => { onClose(); selectSection(t('sidebar.connectors')) } },
      { id: 'settings:schedule', group: 'settings', label: t('sidebar.schedule'), keywords: t('search.settings'), run: () => { onClose(); selectExternalSection(t('sidebar.schedule')) } },
      { id: 'settings:assistant', group: 'settings', label: t('sidebar.assistant'), keywords: t('search.settings'), run: () => { onClose(); openImSettings() } },
      { id: 'settings:about', group: 'settings', label: t('about.nav'), keywords: t('search.settings'), run: () => { onClose(); selectSection(t('about.nav')) } },
    ]
    return [...sessionEntries, ...settingEntries, { id: 'action:new', group: 'actions', label: t('sidebar.newTask'), keywords: t('search.actions'), run: () => { onClose(); startSession() } }]
  }, [imSettingsAvailable, onClose, openImSettings, openPlugins, openSession, openSettings, selectExternalSection, selectSection, sessions.byId, sessions.ids, startSession, t, workspaces.archivedSessionIds, workspaces.items])
  const results = useMemo(() => filterSidebarSearchItems(entries, deferredQuery).slice(0, 12), [deferredQuery, entries])

  useEffect(() => { setActiveIndex(0) }, [query])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, Math.max(0, results.length - 1))); return }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); return }
      if (event.key === 'Enter') { const entry = results[activeIndex]; if (entry !== undefined) { event.preventDefault(); entry.run() } }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [activeIndex, onClose, results])

  return <div className="dcu-search-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dcu-search-dialog" role="dialog" aria-modal="true" aria-label={t('sidebar.search')}><div className="dcu-search-input"><Input autoFocus icon={<IconSearchOutlineMedium size={16} />} value={query} placeholder={t('search.placeholder')} onChange={event => { setQuery(event.target.value) }} /></div>{results.length === 0 ? <div className="dcu-search-empty">{t('search.empty')}</div> : (['sessions', 'settings', 'actions'] as const).map(group => { const grouped = results.filter(entry => entry.group === group); if (grouped.length === 0) return null; return <section className="dcu-search-section" key={group}><div className="dcu-search-title">{t(`search.${group}`)}</div>{grouped.map(entry => { const index = results.indexOf(entry); return <button type="button" className="dcu-search-row" data-active={index === activeIndex} key={entry.id} onMouseEnter={() => { setActiveIndex(index) }} onClick={entry.run}><span className="dcu-search-main">{entry.label}</span>{entry.detail !== undefined && <span className="dcu-search-detail">{entry.detail}</span>}</button> })}</section> })}</section></div>
}

/** 搜索状态与大侧栏隔离：未打开时不订阅 store 快照，避免后台流式高频引发无谓的搜索索引重构。 */
const SidebarSearch = forwardRef<SidebarSearchHandle, SidebarSearchProps>(function SidebarSearch(props, ref) {
  const [open, setOpen] = useState(false)
  const close = useCallback((): void => { setOpen(false) }, [])
  useImperativeHandle(ref, () => ({ open: () => { setOpen(true) } }), [])

  if (!open) return null
  return <SidebarSearchModal {...props} onClose={close} />
})

/** 跟随宿主会话 phase：新建主页（hero）时 home 键高亮为当前页。 */
export function useHeroPhase(): boolean {
  const [onHome, setOnHome] = useState(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'hero')
  useEffect(() => {
    const sync = () => setOnHome(document.querySelector('[data-phase]')?.getAttribute('data-phase') === 'hero')
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] })
    return () => observer.disconnect()
  }, [])
  return onHome
}

/** Codex 风格的 DSH 侧栏，只替换导航外观，项目浏览和设置仍由 DSH 官方组件提供。 */
export function CodexSidebar({ workspaceShortcuts, navigationHistory, globalPanels, footerActions, selectPanel, usePanelInfo = useLegacyPanelInfo, collapsed, width, openSession, startSession, toggleSidebar, archiveSession, canDeleteSession, deleteSession, forkSession, moveSession, renameSession, openPath, companionSlots, renderSlot, t, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces }: CodexSidebarProps) {
  const panels = useSyncExternalStore(globalPanels?.subscribe ?? subscribeEmptyCompanionTabs, globalPanels?.getSnapshot ?? getEmptyPanels, globalPanels?.getSnapshot ?? getEmptyPanels)
  const extensionPanels = [...panels].sort((left, right) => left.order - right.order)
  const visibleFooterActions = useSyncExternalStore(footerActions?.subscribe ?? subscribeEmptyCompanionTabs, footerActions?.getSnapshot ?? getEmptyFooterActions, footerActions?.getSnapshot ?? getEmptyFooterActions)
  const activePanelId = usePanelInfo(info => info.activePanelId)
  const panelActive = activePanelId !== null && activePanelId !== ''
  const compact = collapsed || width < 80
  const [visualCompact, setVisualCompact] = useState(compact)
  const [collapsing, setCollapsing] = useState(false)
  const settingsSeat = useRef<HTMLDivElement>(null)
  const search = useRef<SidebarSearchHandle>(null)
  const openSearch = (): void => {
    workspaceShortcuts?.getSnapshot().bindings?.closeAddWorkspace()
    search.current?.open()
  }
  const toggleSidebarRef = useRef(toggleSidebar)
  toggleSidebarRef.current = toggleSidebar
  const expandSidebar = useCallback((): void => { toggleSidebarRef.current() }, [])
  const onHome = useHeroPhase()
  const [imTab, setImTab] = useState<'tasks' | 'schedule'>('tasks')
  const [startingSession, setStartingSession] = useState(false)
  // ··· 子项的「固定到侧边栏」：id 列表落 localStorage，窄栏分割线下方长出对应快捷键。
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const raw = browserStorage()?.getItem(RAIL_PINNED_KEY)
      const parsed: unknown = raw === null || raw === undefined ? [] : JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    } catch { return [] }
  })
  const togglePin = useCallback((id: string): void => {
    setPinnedIds(ids => {
      const next = ids.includes(id) ? ids.filter(pinned => pinned !== id) : [...ids, id]
      try { browserStorage()?.setItem(RAIL_PINNED_KEY, JSON.stringify(next)) } catch { /* storage may be unavailable */ }
      return next
    })
  }, [])
  const beginSession = useCallback(async (workspaceId?: WorkspaceId): Promise<void> => {
    if (startingSession) return
    setStartingSession(true)
    try {
      // 新建任务必然回到会话主列：先退出全局面板，避免新会话被面板盖住。
      selectPanel?.(null)
      await Promise.resolve(beginSidebarSession(setImTab, startSession, workspaceId))
    } catch (error) {
      console.warn('新建任务失败：', error)
    } finally {
      setStartingSession(false)
    }
  }, [selectPanel, startSession, startingSession])
  const companionTabs = useSyncExternalStore(
    companionSlots?.subscribe ?? subscribeEmptyCompanionTabs,
    companionSlots?.getSnapshot ?? getEmptyCompanionTabs,
    companionSlots?.getSnapshot ?? getEmptyCompanionTabs,
  )
  const showChannels = companionTabs.channels
  const showSchedule = companionTabs.schedule
  const showCompanionTabs = showChannels || showSchedule
  const selectSection = (label: string): void => { openSettingsSection(settingsSeat.current, label) }
  const openPlugins = (): void => {
    selectExternalSection([t('settings.pluginConfig'), t('sidebar.marketplace'), t('sidebar.builtinPlugins')])
  }
  const selectExternalSection = (label: string | readonly string[]): void => {
    openSettingsSection(settingsSeat.current, label, () => { selectSection(t('about.nav')) })
  }
  const openImSettings = (): void => {
    routeOptionalSettingsSection(
      showChannels,
      () => { selectExternalSection([t('sidebar.imSettings'), 'IM助理']) },
      () => { selectSection(t('about.nav')) },
    )
  }
  useEffect(() => {
    if (imTab === 'schedule' && !showSchedule) setImTab('tasks')
  }, [imTab, showChannels, showSchedule])
  useEffect(() => {
    let startX = 0
    let startWidth = SLIM_SIDEBAR_PX
    let dragging = false
    let pointerId: number | undefined
    let frame: HTMLElement | undefined
    let handle: HTMLElement | undefined
    const stopHostDrag = (event: PointerEvent): void => {
      event.preventDefault()
      event.stopPropagation()
    }
    const finishDrag = (): void => {
      frame?.removeAttribute('data-dragging')
      handle?.removeAttribute('data-dragging')
      if (handle !== undefined && pointerId !== undefined && handle.hasPointerCapture?.(pointerId)) {
        handle.releasePointerCapture(pointerId)
      }
      dragging = false
      pointerId = undefined
      frame = undefined
      handle = undefined
    }
    const onDown = (event: PointerEvent): void => {
      if (dragging || !isSidebarDragHandle(event.target)) return
      const nextFrame = findSidebarFrame(document)
      const tracks = nextFrame === undefined ? undefined : parseSidebarGrid(nextFrame.style.gridTemplateColumns)
      const nextHandle = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-side="sidebar"]') ?? undefined
        : undefined
      if (nextFrame === undefined || tracks === undefined || nextHandle === undefined) return
      stopHostDrag(event)
      dragging = true
      pointerId = event.pointerId
      startX = event.clientX
      startWidth = tracks.sidebar
      frame = nextFrame
      handle = nextHandle
      frame.setAttribute('data-dragging', '')
      handle.setAttribute('data-dragging', 'true')
      try { handle.setPointerCapture(event.pointerId) } catch { /* 窗口级监听仍可完成当前拖拽。 */ }
    }
    const onMove = (event: PointerEvent): void => {
      if (!dragging || event.pointerId !== pointerId || frame === undefined) return
      stopHostDrag(event)
      applySidebarWidth(frame, sidebarWidthDuringDrag(startWidth, startX, event.clientX))
    }
    const onUp = (event: PointerEvent): void => {
      if (!dragging || event.pointerId !== pointerId) return
      stopHostDrag(event)
      if (frame !== undefined) applySidebarWidth(frame, sidebarWidthDuringDrag(startWidth, startX, event.clientX))
      const collapse = shouldCollapseOnSidebarDrag(startWidth, startX, event.clientX)
      finishDrag()
      if (collapse) window.requestAnimationFrame(() => { window.requestAnimationFrame(() => { toggleSidebarRef.current() }) })
    }
    const onCancel = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return
      stopHostDrag(event)
      finishDrag()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onCancel, true)
    return () => {
      finishDrag()
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onCancel, true)
    }
  }, [])
  useLayoutEffect(() => {
    if (!compact) {
      setCollapsing(false)
      setVisualCompact(false)
      return
    }
    if (visualCompact) {
      setCollapsing(false)
      return
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true) {
      setCollapsing(false)
      setVisualCompact(true)
      return
    }
    setCollapsing(true)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setVisualCompact(true)
      setCollapsing(false)
    }
    const timer = window.setTimeout(finish, SIDEBAR_COLLAPSE_SETTLE_MS)
    return () => {
      done = true
      window.clearTimeout(timer)
    }
  }, [compact, visualCompact])
  const workspaceSlot = useMemo(() => {
    const owner = { wide: true, expandSidebar, panelActive }
    return renderSlot('sidebar.workspaces', owner)
  }, [expandSidebar, panelActive, renderSlot])
  const scheduleOverviewSlot = useMemo(
    () => renderSlot('sidebar.schedule', {
      wide: true,
      expandSidebar,
      openSession,
      archiveSession,
      deleteSession,
      forkSession,
      moveSession,
      renameSession,
      openPath,
      useSessions,
      useWorkspaces,
      view: 'overview',
      showViewSwitch: false,
    }),
    [archiveSession, companionTabs.schedule, deleteSession, expandSidebar, forkSession, moveSession, openPath, openSession, renameSession, renderSlot, useSessions, useWorkspaces],
  )

  // 窄栏的数据源：主侧栏与设置页共用同一份，图标、顺序、状态、动作都不再各写一遍。
  const railApi = useMemo<SidebarRailApi>(() => {
    // 可固定的 ··· 子项：固定快捷方式与浮窗共用这一份定义，顺序也跟随这里。
    const moreItems: RailItem[] = [
      { id: 'experts', label: t('sidebar.experts'), icon: <RailUsersIcon />, run: () => { selectExternalSection(t('sidebar.experts')) } },
      { id: 'skills', label: t('sidebar.skills'), icon: <RailSparklesIcon />, run: () => { selectExternalSection(t('sidebar.skills')) } },
      { id: 'connectors', label: t('sidebar.connectors'), icon: <RailLinkIcon />, run: () => { selectSection(t('sidebar.connectors')) } },
    ]
    return {
    // home 只在「主界面任务区」亮：插件面板或日程页激活时让位给对应入口，避免两个常亮点。
    home: { label: t('sidebar.home'), icon: <RailHomeIcon />, run: () => { if (!onHome) beginSession() }, active: !panelActive && imTab !== 'schedule', busy: startingSession },
    collapse: { label: visualCompact ? t('sidebar.expand') : t('sidebar.collapse'), icon: <PanelLeft size={16} />, run: () => { toggleSidebar() } },
    ...(showSchedule ? { schedule: { label: t('sidebar.scheduleTab'), icon: <ScheduleIcon />, run: () => { setImTab('schedule') }, active: imTab === 'schedule' } } : {}),
    plugins: { label: t('sidebar.plugins'), icon: <RailBlocksIcon />, run: () => { openPlugins() } },
    // ··· 浮窗只留没有窄轨席位的管理入口：定时任务、插件面板、插件管理在轨上都有自己的键，不再重复列出。
    more: {
      label: t('sidebar.extensions'),
      items: moreItems,
      pinnedIds,
      togglePin,
      pinLabel: t('sidebar.pin'),
      unpinLabel: t('sidebar.unpin'),
    },
    // 分割线下方的固定快捷方式：跟随浮窗顺序，菜单里已不存在的 id（存量存储）直接忽略。
    pinned: moreItems.filter(item => item.id !== undefined && pinnedIds.includes(item.id)),
    panels: extensionPanels.map(panel => ({
      id: panel.id,
      label: panel.label,
      active: activePanelId === panel.id,
      run: () => { selectPanel?.(panel.id) },
      node: panel.id === 'schedules' ? <RailClockIcon /> : panel.id === 'webchat' ? <RailMessageIcon /> : panel.id === 'image-studio' ? <RailPhotoIcon /> : renderSlot('sidebar.panellist', { size: 16, active: activePanelId === panel.id }, { only: panel.id }),
    })),
    settings: renderSlot('sidebar.settings', { wide: false }),
    settingsRef: settingsSeat,
    }
  }, [activePanelId, beginSession, extensionPanels, imTab, onHome, openPlugins, panelActive, pinnedIds, renderSlot, selectPanel, setImTab, settingsSeat, showChannels, showSchedule, startingSession, t, togglePin, toggleSidebar, toggleSidebarRef, visualCompact])

  return <SidebarRailContext.Provider value={railApi}>
    <aside className={`dcu-root${visualCompact ? ' dcu-compact' : ''}${collapsing ? ' dcu-collapsing' : ''}`} aria-label={t('sidebar.label')}>
    <style>{stylesheet}</style>
    {navigationHistory && <DesktopNavigationControls history={navigationHistory} t={t} collapse={{ label: visualCompact ? t('sidebar.expand') : t('sidebar.collapse'), run: () => { toggleSidebar() } }} />}
    <style>{NEW_CONVERSATION_STYLE}</style>
    <style>{COMPOSER_TOOL_MENU_STYLE}</style>
    <style>{FULL_ACCESS_ACCENT_STYLE}</style>
    <HeroWorkspaceQuestion t={t} />
    <SidebarRail api={railApi} />
    <div className="dcu-expanded-shell" onTransitionEnd={event => { if (event.target === event.currentTarget && (event.propertyName === 'opacity' || event.propertyName === 'transform')) { setVisualCompact(true); setCollapsing(false) } }}>
    <header className="dcu-head" data-window-drag><button type="button" className="dcu-brand" aria-label={t('sidebar.newTask')} onClick={() => { beginSession() }}><BrandWordmark size={24} /></button><div className="dcu-head-actions"><button type="button" className="dcu-icon" aria-label={t('sidebar.search')} onClick={openSearch}><IconSearchOutlineMedium size={16} /></button></div></header>
    <nav className="dcu-menu" aria-label={t('sidebar.mainMenu')}>
      <button type="button" onClick={() => { beginSession() }}><MenuIcon><IconNewChatOutlineMedium size={16} /></MenuIcon>{t('sidebar.newTask')}</button>
    </nav>
    <div className={showCompanionTabs ? "dcu-workspaces dcu-workspaces-tabs" : "dcu-workspaces"}>
      {imTab === 'schedule' && showSchedule
          ? <div className="dcu-native-workspaces"><ScheduleBrowser openSession={openSession} archiveSession={archiveSession} deleteSession={deleteSession} canDeleteSession={canDeleteSession} forkSession={forkSession} moveSession={moveSession} renameSession={renameSession} useSessions={useSessions} useSessionPendingInteraction={useSessionPendingInteraction} useSessionStatus={useSessionStatus} useWorkspaces={useWorkspaces} panelActive={panelActive} t={t} overviewContent={scheduleOverviewSlot} openTaskSettings={(request) => {
              openSettingsSection(settingsSeat.current, t('sidebar.schedule'), () => { clearAutomationTaskSettingsRequest(); selectSection(t('about.nav')) }, () => { requestAutomationTaskSettings(request) })
            }} /></div>
          : <div className="dcu-native-workspaces">{workspaceSlot}</div>}
    </div>
    <footer className="dcu-foot"><div className="dcu-footer-actions">{footerActions === undefined ? renderSlot('sidebar.footer.action', { wide: !visualCompact }) : visibleFooterActions.map(action => <Fragment key={action.id}>{renderSlot('sidebar.footer.action', { wide: !visualCompact }, { only: action.id })}</Fragment>)}</div></footer>
    </div>
    {/* 逐条 only:id 各生成一个 data-slot 锚点；插件可能给锚点写 width:100%，footer-actions 必须保持竖排。 */}
    <SidebarSearch ref={search} imSettingsAvailable={showChannels} openPlugins={openPlugins} settingsSeat={settingsSeat} openSession={openSession} startSession={beginSession} t={t} useSessions={useSessions} useWorkspaces={useWorkspaces} />
    {workspaceShortcuts && <WorkspaceShortcutBridge source={workspaceShortcuts} openSearch={openSearch} startSession={id => { beginSession(id as WorkspaceId) }} renderDirectoryFlow={owner => renderSlot('sidebar.codex.directoryFlow', owner)} t={t} />}
    </aside>
  </SidebarRailContext.Provider>
}








CodexSidebar.displayName = 'uncledylan-codex-ui'
