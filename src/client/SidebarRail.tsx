import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode, type Ref } from 'react'

/** 窄栏上一个可点条目：图标、动作、状态都来自主侧栏，设置页复用时只换成「先关设置再执行」。 */
export type RailItem = { id?: string, run: () => void, active?: boolean, busy?: boolean, label: string, icon: ReactNode }

/** 窄栏 ··· 的右侧浮窗（Codex 同款）：宽侧栏的扩展管理分组移到这里。 */
export type RailMoreApi = {
  label: string
  /** 管理入口（专家/技能/连接器）：都是设置页导航，设置页里原样执行即可切分区。 */
  items: readonly RailItem[]
  /** 插件贡献的全局面板：设置页里要先退出设置再切换。 */
  panels?: readonly RailItem[]
  /** 可固定条目的已固定 id 集合与切换回调；缺省时行内不画图钉。 */
  pinnedIds?: readonly string[]
  togglePin?: (id: string) => void
  pinLabel?: string
  unpinLabel?: string
}

export type SidebarRailApi = {
  home: RailItem
  /** 折叠键：Windows 标题栏有同款按钮，窄轨上的这枚只在非 Windows 平台显示。 */
  collapse?: RailItem
  schedule?: RailItem
  plugins: RailItem
  more?: RailMoreApi
  /** 扩展面板：由宿主或其他插件贡献的插槽内容。 */
  panels: readonly (Omit<RailItem, 'icon'> & { id: string, node: ReactNode })[]
  /** 用户从 ··· 固定到分割线下方的快捷方式（设置页里动作换成「先关设置再执行」）。 */
  pinned?: readonly RailItem[]
  /** 窄栏底部的设置席位（触发器或账号入口）。 */
  settings: ReactNode
  settingsRef?: Ref<HTMLDivElement>
  /** home 按钮的引用：设置页用它做初始焦点与焦点守卫的落点。 */
  homeRef?: Ref<HTMLButtonElement>
  /** 额外的容器类名：设置页用它挂自己的那套配色。 */
  className?: string
}

/**
 * 主侧栏与设置页共用同一份窄栏数据：图标、顺序、状态全来自侧栏，
 * 设置页不再自己拼一份，避免「一进设置就少了几个键」。
 */
export const SidebarRailContext = createContext<SidebarRailApi | undefined>(undefined)

export function useSidebarRail(): SidebarRailApi | undefined {
  return useContext(SidebarRailContext)
}

/** Tabler blocks：窄栏插件入口，主侧栏与设置页共用同一字形。 */
export function RailBlocksIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M14 4a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1l0 -5" />
    <path d="M3 14h12a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h3a2 2 0 0 1 2 2v12" />
  </svg>
}

/** Tabler clock：定时/自动化任务的统一时钟字形，窄栏、浮窗、宽侧栏菜单与设置页共用。 */
export function RailClockIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="dcu-clock-icon">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
    <path d="M12 7v5l3 3" />
  </svg>
}

/** Tabler folder：窄栏任务入口。 */
export function RailFolderIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
  </svg>
}

/** Tabler message-circle：窄栏频道入口。 */
export function RailChatIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
  </svg>
}

/** Tabler message：第三方面板（如 webchat）的窄栏字形，插件自带图标风格不符时按 id 在侧栏侧接管。 */
export function RailMessageIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M8 9h8" />
    <path d="M8 13h6" />
    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12" />
  </svg>
}

/** Tabler photo：生图模式（image-studio 面板）的窄栏字形。 */
export function RailPhotoIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 8h.01" />
    <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
    <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
    <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
  </svg>
}

/** Tabler users：··· 浮窗「专家」入口。 */
export function RailUsersIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
  </svg>
}

/** Tabler sparkles-2：··· 浮窗「技能」入口。 */
export function RailSparklesIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M14 6a9.3 9.3 0 0 0 1.516 -.546c.911 -.438 1.494 -1.015 1.937 -1.932c.207 -.428 .382 -.928 .547 -1.522c.165 .595 .34 1.095 .547 1.521c.443 .918 1.026 1.495 1.937 1.933c.426 .205 .925 .38 1.516 .546a9.3 9.3 0 0 0 -1.516 .547c-.911 .438 -1.494 1.015 -1.937 1.932a9 9 0 0 0 -.547 1.521c-.165 -.594 -.34 -1.095 -.547 -1.521c-.443 -.918 -1.026 -1.494 -1.937 -1.932a9 9 0 0 0 -1.516 -.547" />
    <path d="M3 14a21 21 0 0 0 1.652 -.532c2.542 -.953 3.853 -2.238 4.816 -4.806a20 20 0 0 0 .532 -1.662a20 20 0 0 0 .532 1.662c.963 2.567 2.275 3.853 4.816 4.806q .75 .28 1.652 .532a21 21 0 0 0 -1.652 .532c-2.542 .953 -3.854 2.238 -4.816 4.806a20 20 0 0 0 -.532 1.662a20 20 0 0 0 -.532 -1.662c-.963 -2.568 -2.275 -3.853 -4.816 -4.806a21 21 0 0 0 -1.652 -.532" />
  </svg>
}

/** Tabler link：··· 浮窗「连接器」入口。 */
export function RailLinkIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 15l6 -6" />
    <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
    <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
  </svg>
}

/** Tabler pin：··· 子项行尾的「固定到侧边栏」，比行图标小一号（同网格下描边自然细一号）。 */
export function RailPinIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
    <path d="M9 15l-4.5 4.5" />
    <path d="M14.5 4l5.5 5.5" />
  </svg>
}

/** Tabler dots：窄栏 ··· 浮窗入口。 */
export function RailDotsIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </svg>
}

/**
 * 窄栏图标统一参数：大小与描边各一个变量，全轨（含第三方面板 svg）一次调齐。
 * vector-effect 让「描边 2」按屏幕像素计——不同 viewBox 网格的 svg 也严格等重。
 */
const RAIL_ICON_STYLE = `
.dcu-rail{--dcu-rail-icon-size:20px;--dcu-rail-icon-stroke:1.5}
.dcu-rail .dcu-icon svg{width:var(--dcu-rail-icon-size);height:var(--dcu-rail-icon-size)}
.dcu-rail .dcu-icon svg :is(path,circle,rect,line,polyline,polygon,ellipse){vector-effect:non-scaling-stroke;stroke-width:calc(var(--dcu-rail-icon-stroke)*1px)}
`

/** Tabler home：主界面与设置页窄栏共用的 home 字形。 */
export function RailHomeIcon({ size = 16 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="dcu-home-icon">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
}

/** 浮窗样式随组件走：主侧栏与设置页两份样式表都不必复制这份规则。几何参数对齐 Codex 同款浮窗（2560 截图实测）。 */
const RAIL_MORE_STYLE = `
.dcu-rail-more-panel{position:fixed;left:56px;z-index:10030;min-width:274px;padding:8px;border-radius:16px;background:var(--dcu-tip-bg,#fff);box-shadow:var(--dcu-tip-shadow,0 0 0 .5px rgba(13,13,13,.08),0 3px 7.5px rgba(0,0,0,.03),0 0 16px rgba(0,0,0,.02));animation:dcu-rail-more-in 140ms cubic-bezier(.16,1,.3,1)}
@keyframes dcu-rail-more-in{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
.dcu-rail-more-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;border-radius:10px}
.dcu-rail-more-row:hover{background:var(--dcu-sidebar-hover)}
.dcu-rail-more-item{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;min-height:34px;padding:0 8px;border:0;border-radius:10px;background:transparent;color:var(--dcu-sidebar-primary);font:14px/20px var(--dsw-font-family);text-align:left;cursor:pointer}
.dcu-rail-more-icon{display:grid;place-items:center;width:20px;height:20px}
.dcu-rail-more-icon svg{display:block;width:18px;height:18px;color:var(--dcu-sidebar-icon)}
.dcu-rail-more-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dcu-rail-more-pin{visibility:hidden;display:grid;place-items:center;width:26px;height:26px;margin-right:4px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dcu-sidebar-icon);cursor:pointer}
.dcu-rail-more-row:hover .dcu-rail-more-pin,.dcu-rail-more-pin[data-pinned]{visibility:visible}
.dcu-rail-more-pin:hover{color:var(--dcu-sidebar-primary)}
.dcu-rail-more-pin[data-pinned]{color:var(--dcu-sidebar-primary)}
@media(prefers-reduced-motion:reduce){.dcu-rail-more-panel{animation:none}}
`

/** 窄栏 ···：点击向右弹出浮窗，外部点击或 Escape 关闭；面板锚定按钮所在行。 */
function RailMore({ api }: { api: RailMoreApi }) {
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(0)
  const trigger = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (root.current !== null && event.target instanceof Node && !root.current.contains(event.target)) setOpen(false)
    }
    // 捕获阶段先吃掉 Escape：浮层自己关，不再让同一次按键穿透到设置页/其他浮层。
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); setOpen(false) }
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])
  const toggle = (): void => {
    if (!open && trigger.current !== null) {
      const rect = trigger.current.getBoundingClientRect()
      const view = trigger.current.ownerDocument.defaultView
      const rows = api.items.length + (api.panels?.length ?? 0)
      // 顶到按钮所在行上缘再提 6px（Codex 浮窗同款锚位），整块浮窗不越出视口底缘。
      setTop(Math.max(8, Math.min(rect.top - 6, (view?.innerHeight ?? 800) - rows * 38 - 24)))
    }
    setOpen(value => !value)
  }
  const item = (entry: RailItem) => {
    const pinnable = api.togglePin !== undefined && entry.id !== undefined
    const pinned = entry.id !== undefined && (api.pinnedIds ?? []).includes(entry.id)
    return <div key={entry.label} className="dcu-rail-more-row">
      <button type="button" role="menuitem" className="dcu-rail-more-item" onClick={() => { setOpen(false); entry.run() }}>
        <span className="dcu-rail-more-icon">{entry.icon}</span>
        <span className="dcu-rail-more-label">{entry.label}</span>
      </button>
      {pinnable && <button type="button" className="dcu-rail-more-pin" data-pinned={pinned ? '' : undefined} aria-label={pinned ? api.unpinLabel : api.pinLabel} title={pinned ? api.unpinLabel : api.pinLabel} aria-pressed={pinned} onClick={event => { event.stopPropagation(); api.togglePin?.(entry.id as string) }}>
        <RailPinIcon size={16} />
      </button>}
    </div>
  }
  return <div ref={root}>
    <style>{RAIL_MORE_STYLE}</style>
    <button ref={trigger} type="button" className="dcu-icon" aria-label={api.label} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
      <RailDotsIcon />
    </button>
    {open && <div className="dcu-rail-more-panel" role="menu" aria-label={api.label} style={{ top }}>
      {api.items.map(item)}
      {api.panels?.map(item)}
    </div>}
  </div>
}

/** 主界面的窄栏本体；设置页通过 `useSidebarRail()` 拿同一份数据渲染这一块。 */
export function SidebarRail({ api }: { api: SidebarRailApi }) {
  const button = (item: RailItem, content: ReactNode, className = 'dcu-icon', ref?: Ref<HTMLButtonElement>) => <button ref={ref} type="button" className={className} aria-label={item.label} aria-current={item.active === true ? 'page' : undefined} data-busy={item.busy === true ? '' : undefined} disabled={item.busy === true} onClick={item.run}>{content}</button>
  return <div className={api.className === undefined ? 'dcu-rail' : `dcu-rail ${api.className}`}>
    <style>{RAIL_ICON_STYLE}</style>
    {button(api.home, api.home.icon, 'dcu-icon dcu-settings-home', api.homeRef)}
    {api.collapse !== undefined && button(api.collapse, api.collapse.icon, 'dcu-icon dcu-rail-collapse')}
    {api.schedule !== undefined && button(api.schedule, api.schedule.icon)}
    {/* 插件面板席位在 plug 上方：它们是高频视图入口，不再隔在分隔线下方 */}
    {api.panels.map(panel => <button key={panel.id} type="button" className="dcu-icon dcu-rail-panel-icon" aria-label={panel.label} title={panel.label} aria-current={panel.active === true ? 'page' : undefined} onClick={panel.run}>{panel.node}</button>)}
    {button(api.plugins, api.plugins.icon)}
    {api.more !== undefined && <RailMore api={api.more} />}
    <div className="dcu-rail-divider" role="separator" />
    {/* 分割线下方是用户固定的快捷方式；默认为空， spacer 贴着分割线。 */}
    {api.pinned?.map(item => <Fragment key={item.label}>{button(item, item.icon)}</Fragment>)}
    <div className="dcu-rail-spacer" />
    <div ref={api.settingsRef} className="dcu-settings-seat">{api.settings}</div>
  </div>
}
