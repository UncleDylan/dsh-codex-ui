import { deepLinkAction, openConversation, openConversationWithDraft, selectGlobalPanel } from './session-navigation.ts'
import { useSyncExternalStore } from 'react'
import { createNavigationHistory } from './navigation-history.ts'
import { createWorkspaceShortcutSource } from './workspace-shortcuts.ts'
import { registerWorkspaceDirectoryFlow, WORKSPACE_DIRECTORY_FLOW } from './workspace-directory-flow.ts'
import { registerAfterOfficialWave } from './official-slot-shadow.ts'
import {
  archiveHostSession,
  currentSessionId,
  forkHostSession,
  isSessionArchived,
  probeService,
  renameHostSession,
  UnknownSessionError,
} from './session-host.ts'
import { createGlobalPanelSource } from './global-panels.tsx'
import { initializeComposerWidth, observeHeroWidthHandles } from './composer-width.ts'
import { browserStorage } from './tree-expansion.ts'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace/types'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { CodexSidebar } from './CodexSidebar.tsx'
import { AboutSection } from './AboutSection.tsx'
import { CodexWorkspaceBrowser } from './CodexWorkspaceBrowser.tsx'
import { ConnectorsSection } from './ConnectorsSection.tsx'
import { en, NS, zh } from './locales.ts'
import { createCompanionTabSource } from './companion-slots.ts'
import { createFooterActionSource, type FooterAction, type FooterActionSource } from './footer-actions.ts'
import { mirrorSlot, withSlotAliases } from './slot-mirror.tsx'
import { openPathInHost, type HostOpenPathConnection } from './host-open-path.ts'
import { observeSettingsNavIcons } from './settings-nav-icons.ts'
import { registerPluginConfigSection } from './plugin-config.ts'
import { registerSettingsPage } from './settings-page-registration.ts'
import { observeSlimSidebar } from './sidebar-width.ts'
import { observeConversationHeader } from './conversation-header.ts'
import { observeHostTablerIcons } from './host-tabler-icons.ts'
import { observeActivityCard } from './activity-card.ts'
import { observeOfficialTurnNavigators } from './official-turn-navigator.ts'
import { TurnNavigator } from './TurnNavigator.tsx'
import { RailPhotoIcon } from './SidebarRail.tsx'
import { ImageStudioPanel } from './ImageStudioPanel.tsx'
import { IMAGE_STUDIO_PANEL_ID, STUDIO_SIDEBAR_TAB_ID, isImageStudioAvailable } from './image-studio.ts'
import { registerInputHistory } from './InputHistoryDock.tsx'
import { observeComposerToolMenus } from './composer-tool-menus.ts'
import { observeModelMenuCard } from './model-menu-card.ts'
import { createModelEffortBridge } from './model-effort-bridge.ts'
import { observeFullAccessAccent } from './full-access-accent.ts'
import { observeRunningOrb } from './running-orb.ts'
import { observeChatScrollbar } from './chat-scrollbar.ts'
import { hasConnectWorkspace, hasOpenWorkspace, hasStartSession, recentWorkspaceId, workspaceBaselinesReady } from './workspace-compat.ts'
import { HostActionError, type HostAction, UserFacingError } from './user-error.ts'
import { finishSessionMove, requestSessionMove, sessionMoveErrorKey, SessionMoveRequestError } from './session-move.ts'
import { hasArchiveSessionDelete } from './archive-session-delete.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'sidebar.codex.panellist': SlotMap['sidebar.panellist']
    'sidebar.codex.workspaces': SlotMap['sidebar.workspaces']
    'sidebar.codex.schedule': SlotMap['sidebar.schedule']
    'sidebar.codex.settings': SlotMap['sidebar.settings']
    'sidebar.codex.footer.action': SlotMap['sidebar.footer.action']
    'sidebar.schedule': {
      kind: 'single'
      scope: 'root'
      owner: {
        wide: boolean
        expandSidebar: () => void
        openSession: (sessionId: SessionId) => boolean | void
        renameSession: (sessionId: SessionId, title: string) => Promise<void>
        archiveSession: (sessionId: SessionId) => Promise<void>
        deleteSession: (sessionId: SessionId) => Promise<void>
        forkSession: (sessionId: SessionId) => Promise<void>
        moveSession: (sessionId: SessionId, targetWorkspaceId: WorkspaceId) => Promise<void>
        openPath: (path: string) => Promise<void> | void
        skin?: 'codex' | 'native'
        view?: 'runs' | 'overview'
        showViewSwitch?: boolean
        useSessions: unknown
        useWorkspaces: unknown
      }
    }
    'sidebar.channels': {
      kind: 'single'
      scope: 'root'
      owner: {
        wide: boolean
        expandSidebar: () => void
        openSession: (sessionId: SessionId) => boolean | void
        renameSession: (sessionId: SessionId, title: string) => Promise<void>
        archiveSession: (sessionId: SessionId) => Promise<void>
        deleteSession: (sessionId: SessionId) => Promise<void>
        forkSession: (sessionId: SessionId) => Promise<void>
        moveSession: (sessionId: SessionId, targetWorkspaceId: WorkspaceId) => Promise<void>
        openPath: (path: string) => Promise<void> | void
        skin?: 'codex' | 'native'
        useSessions: unknown
        useWorkspaces: unknown
      }
    }
  }
}

export const inject = ['slots', 'sessions', 'workspaces', 'layout', 'locale', 'connection', 'inputTriggers', 'conversation']

type ArchiveRegistry = {
  deleteSession: (sessionId: SessionId) => Promise<
    { ok: true; value?: unknown }
    | { ok: false; error?: { message: string; code?: string; details?: unknown; isDSHRemoteError?: true } }
  >
}

function hasDeleteSession(value: unknown): value is ArchiveRegistry {
  return hasArchiveSessionDelete(value)
}

async function runHostAction<T>(action: HostAction, execute: () => Promise<T>): Promise<T> {
  try {
    return await execute()
  } catch (reason) {
    if (reason instanceof UserFacingError || reason instanceof HostActionError) throw reason
    throw new HostActionError(action, reason)
  }
}

/** Archive Manager replaces the official ui-workspace row with this optional service. */
export async function startWorkspaceSession(ctx: ClientContext, workspaceId?: WorkspaceId): Promise<boolean> {
  const uiWorkspace = probeService(ctx, 'uiWorkspace')
  try {
    if (hasStartSession(uiWorkspace)) {
      await Promise.resolve(uiWorkspace.startSession(workspaceId))
      return true
    }
    if (hasStartSession(ctx.workspaces)) {
      await Promise.resolve(ctx.workspaces.startSession(workspaceId))
      return true
    }
    console.warn('DSH 工作空间服务尚未就绪，无法新建会话。')
    return false
  } catch (error) {
    console.warn('新建会话失败：', error)
    return false
  }
}

/** 替换 DSH 的官方 sidebar 插槽，不修改 DSH 源码或会话数据。 */
export function apply(ctx: ClientContext): void {
  Object.assign(globalThis, { __dcuCurrentSessionId: currentSessionId })
  // 运行版本标记：宿主会把 client.js 快照进内存，改了 lib 不重启/重激活就不生效——
  // 「改了没生效」时先在这里核对运行中的 bundle 是哪次构建（构建时间戳见 package.json version）。
  document.documentElement.dataset.dcuVersion = '1.2.0'
  const widthStorage = browserStorage()
  if (widthStorage) initializeComposerWidth(widthStorage)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'uncledylan-codex-ui: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => observeHeroWidthHandles(t('home.resizeInput')), 'uncledylan-codex-ui: hero width handles')
  registerInputHistory(ctx)
  // 宿主 layout store 的面板选中态（全局面板/会话主列谁在中间列）：侧栏据此让位高亮，
  // 面板激活时 home 熄灭、对应面板键点亮。subscribe/getSnapshot 都是宿主侧稳定引用。
  const usePanelInfo = <T,>(selector: (info: { activePanelId: string | null }) => T): T => {
    const panelInfo = ctx.layout.panelInfo
    return useSyncExternalStore(panelInfo.subscribe, () => selector(panelInfo.getSnapshot()))
  }
  // 导航历史要同时交给侧栏与设置页（←/→ 是跨两者的一条浏览器式历史），先于两处注册创建。
  const navigationHistory = createNavigationHistory(ctx.sessions.list, id => openConversation(ctx, ctx.layout, id))
  ctx.effect(() => () => { navigationHistory.dispose() }, 'uncledylan-codex-ui: navigation history')
  registerSettingsPage(ctx, navigationHistory)
  registerPluginConfigSection(ctx)
  // Host 与客户端共用 Cordis 的服务名；此处读取的是客户端 RPC 外观，而非 HostConnectionService。
  const connectionService: unknown = ctx.get('connection')
  const connection = connectionService as HostOpenPathConnection
  const openPath = (path: string): Promise<void> => openPathInHost(connection, path)
  ctx.effect(() => observeSlimSidebar(), 'uncledylan-codex-ui: slim sidebar')
  ctx.effect(() => observeSettingsNavIcons(), 'uncledylan-codex-ui: settings nav icons')
  ctx.effect(() => observeComposerToolMenus({ search: t('home.projectSearch'), empty: t('home.projectEmpty') }), 'uncledylan-codex-ui: composer tool menus')
  // 宿主的模型目录服务可能在插件之后才注册，所以每次读都现取，不缓存服务实例。
  const readService = (name: string): unknown => probeService(ctx, name)
  const modelEfforts = createModelEffortBridge(readService, () => currentSessionId(ctx.sessions.list.getSnapshot()))
  ctx.effect(() => observeModelMenuCard({ close: t('sessions.close'), efforts: modelEfforts }), 'uncledylan-codex-ui: model menu card')
  ctx.effect(() => observeFullAccessAccent(), 'uncledylan-codex-ui: full access accent')
  ctx.effect(() => observeRunningOrb(), 'uncledylan-codex-ui: running orb')
  ctx.effect(() => observeChatScrollbar(document, t('scrollbar.label')), 'uncledylan-codex-ui: chat scrollbar')
  ctx.effect(() => observeConversationHeader(), 'uncledylan-codex-ui: conversation header')
  ctx.effect(() => observeHostTablerIcons(), 'uncledylan-codex-ui: host tabler icons')
  ctx.effect(() => observeOfficialTurnNavigators(), 'uncledylan-codex-ui: official turn navigator')
  // 右上角活动摘要卡：变更/输出/来源都读宿主已渲染的 DOM；× 关闭按会话记忆。
  ctx.effect(() => observeActivityCard({
    labels: {
      region: t('activity.region'),
      changes: t('activity.changes'),
      outputs: t('activity.outputs'),
      sources: t('activity.sources'),
      viewChanges: t('activity.viewChanges'),
      viewAll: t('activity.viewAll'),
      collapse: t('activity.collapse'),
      close: t('activity.close'),
      countFiles: count => t('activity.countFiles', { count }),
      countSources: count => t('activity.countSources', { count }),
    },
    session: () => currentSessionId(ctx.sessions.list.getSnapshot()),
  }), 'uncledylan-codex-ui: activity card')
  const companionSlots = createCompanionTabSource(ctx.slots)
  const globalPanels = createGlobalPanelSource(ctx.slots, ctx.locale)
  const footerActions = createFooterActionSource(ctx.slots)
  const workspaceShortcuts = createWorkspaceShortcutSource(ctx.slots)
  ctx.effect(() => () => { workspaceShortcuts.dispose() }, 'uncledylan-codex-ui: workspace shortcuts')
  registerWorkspaceDirectoryFlow(ctx)
  const ownSidebarChildren = {
    [WORKSPACE_DIRECTORY_FLOW]: { kind: 'single' as const, scope: 'root' as const },
    'sidebar.channels': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.schedule': { kind: 'single' as const, scope: 'root' as const },
  }
  const sharedSidebarChildren = {
    'sidebar.panellist': { kind: 'list' as const, scope: 'root' as const },
    'sidebar.workspaces': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.settings': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.footer.action': { kind: 'list' as const, scope: 'root' as const },
  }
  const sidebarSlotAliases = {
    'sidebar.panellist': 'sidebar.codex.panellist',
    'sidebar.workspaces': 'sidebar.codex.workspaces',
    'sidebar.schedule': 'sidebar.codex.schedule',
    'sidebar.settings': 'sidebar.codex.settings',
    'sidebar.footer.action': 'sidebar.codex.footer.action',
  }
  const sidebarAliasChildren = {
    'sidebar.codex.panellist': { kind: 'list' as const, scope: 'root' as const },
    'sidebar.codex.workspaces': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.codex.schedule': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.codex.settings': { kind: 'single' as const, scope: 'root' as const },
    'sidebar.codex.footer.action': { kind: 'list' as const, scope: 'root' as const },
  }
  const aliasedSidebar = withSlotAliases(CodexSidebar, sidebarSlotAliases)
  const officialSidebarReady = (): boolean => ctx.slots.spec?.('sidebar.workspaces') !== undefined
  ctx.slots.inject('sidebar', () => registerAfterOfficialWave(ctx.slots, 'sidebar', officialSidebarReady, (timedOut = false) => {
    const declared = (name: string): boolean => {
      const spec = ctx.slots.spec as ((this: unknown, key: string) => unknown) | undefined
      return typeof spec === 'function' && spec.call(ctx.slots, name) !== undefined
    }
    // 0.2 官方侧栏已经声明 panellist。重复声明会让本插件激活失败。
    const allSidebarChildren = { ...sharedSidebarChildren, ...ownSidebarChildren, ...sidebarAliasChildren }
    const children: Partial<typeof allSidebarChildren> = {}
    const candidates = timedOut ? { ...ownSidebarChildren, ...sidebarAliasChildren } : allSidebarChildren
    for (const [name, spec] of Object.entries(candidates)) {
      if (!declared(name)) Object.assign(children, { [name]: spec })
    }
    const register = (next: Partial<typeof allSidebarChildren>): () => void => {
      try {
        const unregister = ctx.slots.register({
          name: 'sidebar', priority: -1, registrant: 'uncledylan-codex-ui', locale: NS,
          children: next,
          inject: () => ({
            navigationHistory,
            workspaceShortcuts,
            openSession: (sessionId: SessionId) => openConversation(ctx, ctx.layout, sessionId),
            startSession: (workspaceId?: WorkspaceId) => { startWorkspaceSession(ctx, workspaceId) },
            toggleSidebar: () => { ctx.layout.toggleSidebar() },
            archiveSession,
            canDeleteSession: () => hasArchiveSessionDelete(ctx.get('remote.workspaceRegistry')),
            deleteSession,
            forkSession,
            moveSession,
            renameSession,
            openPath,
            companionSlots,
            globalPanels,
            footerActions,
            selectPanel: (id: string | null) => { selectGlobalPanel(ctx.layout, id) },
            usePanelInfo,
          }),
        }, aliasedSidebar as typeof CodexSidebar)
        const mirrors: (() => void)[] = []
        try {
          for (const [source, target] of Object.entries(sidebarSlotAliases)) {
            // 官方声明可晚于超时兜底；随声明挂载镜像，避免晚到的贡献永久缺席。
            if (typeof ctx.slots.spec === 'function') mirrors.push(ctx.slots.inject(source as keyof typeof sidebarSlotAliases, () => mirrorSlot({ slots: ctx.slots }, source, target)))
          }
        } catch (error) {
          for (const dispose of mirrors.reverse()) dispose()
          unregister()
          throw error
        }
        return () => { for (const dispose of mirrors.reverse()) dispose(); unregister() }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const conflict = /slot "([^"]+)" is already declared/.exec(message)
        const conflictKey = conflict === null ? undefined : Object.keys(next).find(key => key === conflict[1]) as keyof typeof allSidebarChildren | undefined
        if (conflictKey === undefined || next[conflictKey] === undefined) throw error
        const rest = { ...next }
        delete rest[conflictKey]
        return register(rest)
      }
    }
    return register(children)
  }, true))

  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities', id: 'turn-navigator', order: 100, locale: NS,
  }, TurnNavigator))

  // 生图模式：dsh-image-gen 在位时注册 panellist（order 0，落在 webchat -1 与 schedules 10 之间）
  // 与 main 的 keyed 内容；插件未装则整体缺席（rail 不出现生图入口）。
  // 原版工作台是插件注册的右侧栏页签（dsh-image-gen/studio），宿主 sidebarRight.openTab 可直接调起；
  // 页签与服务都在场才亮入口（探测方式与宿主 chat 包调 browser 页签一致）。
  const openStudioWorkbench = (): boolean => {
    const tabs = readService('sidebarRightTabs') as { get?: (id: string) => unknown } | undefined
    if (tabs?.get?.(STUDIO_SIDEBAR_TAB_ID) === undefined) return false
    const sidebarRight = readService('sidebarRight') as { openTab?: (id: string, options?: { params?: Record<string, unknown> }) => void } | undefined
    if (typeof sidebarRight?.openTab !== 'function') return false
    try {
      sidebarRight.openTab(STUDIO_SIDEBAR_TAB_ID)
      return true
    } catch (error) {
      console.warn('打开图像工作台失败：', error)
      return false
    }
  }
  const workbenchAvailable = (): boolean => {
    const tabs = readService('sidebarRightTabs') as { get?: (id: string) => unknown } | undefined
    return tabs?.get?.(STUDIO_SIDEBAR_TAB_ID) !== undefined
  }
  void isImageStudioAvailable().then(available => {
    if (!available) return
    try {
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist', id: IMAGE_STUDIO_PANEL_ID, order: 0, locale: NS,
        label: () => t('sidebar.imageStudio'),
      }, RailPhotoIcon))
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main', key: IMAGE_STUDIO_PANEL_ID, locale: NS,
        inject: () => ({ openStudioWorkbench, workbenchAvailable }),
      }, ImageStudioPanel))
    } catch (error) {
      console.warn('生图模式注册失败：', error)
    }
  })

  const forkSession = async (sessionId: SessionId): Promise<void> => {
    await runHostAction('fork', () => forkHostSession(ctx, sessionId))
  }
  const renameSession = async (sessionId: SessionId, title: string): Promise<void> => {
    await runHostAction('rename', async () => {
      try {
        await renameHostSession(ctx, sessionId, title)
      } catch (reason) {
        if (reason instanceof UnknownSessionError) throw new UserFacingError(t('sessions.unknown'))
        throw reason
      }
    })
  }
  const deleteSession = async (sessionId: SessionId): Promise<void> => {
    const registry = ctx.get('remote.workspaceRegistry')
    if (!hasDeleteSession(registry)) throw new UserFacingError(t('sessions.deleteUnavailable'))
    await runHostAction('delete', async () => {
      const result = await registry.deleteSession(sessionId)
      if (!result.ok) throw result.error === undefined
        ? new UserFacingError(t('sessions.deleteUnavailable'))
        : result.error
    })
  }
  const archiveSession = (sessionId: SessionId): Promise<void> => runHostAction('archive', () => archiveHostSession(ctx, sessionId))
  const moveSession = async (sessionId: SessionId, targetWorkspaceId: WorkspaceId): Promise<void> => {
    try {
      await requestSessionMove(sessionId, targetWorkspaceId)
    } catch (error) {
      if (!(error instanceof SessionMoveRequestError)) throw error
      throw new UserFacingError(t(sessionMoveErrorKey(error.code)))
    }
    finishSessionMove({
      sessionId,
      currentUrl: window.location.href,
      navigate: url => { window.location.replace(url) },
    })
  }
  const startConnectorPromptSession = async (promptText: string): Promise<void> => {
    const prompt = promptText.trim()
    if (prompt === '') throw new UserFacingError(t('connectors.promptRequired'))
    const workspaces = ctx.workspaces.list.getSnapshot()
    const sessionSnapshot = ctx.sessions.list.getSnapshot()
    const selectedSessionId = currentSessionId(sessionSnapshot)
    const currentWorkspaceId = selectedSessionId === undefined
      ? undefined
      : workspaces.items.find(workspace => workspace.sessionIds.includes(selectedSessionId as SessionId))?.workspaceId
    const baselinesReady = workspaceBaselinesReady(workspaces, sessionSnapshot)
    const targetWorkspaceId = currentWorkspaceId ?? (baselinesReady ? recentWorkspaceId(workspaces.items, sessionSnapshot.byId) : undefined)
    if (targetWorkspaceId === undefined && !baselinesReady) throw new UserFacingError(t('connectors.workspacesLoading'))
    if (targetWorkspaceId === undefined) throw new UserFacingError(t('connectors.workspaceRequired'))
    const uiWorkspace = probeService(ctx, 'uiWorkspace')
    const conversation = ctx.get('conversation')
    if (conversation === undefined) throw new UserFacingError(t('connectors.conversationUnavailable'))
    try {
      if (hasOpenWorkspace(uiWorkspace)) {
        await Promise.resolve(uiWorkspace.openWorkspace(targetWorkspaceId, id => {
          const binding = ctx.sessions.binding(id)
          if (binding?.ctx === undefined) throw new UnknownSessionError()
          conversation.input.for(binding.ctx as ClientContext).setDraft(prompt)
        }))
        selectGlobalPanel(ctx.layout, null)
        return
      }
      const workspaceNavigation = hasConnectWorkspace(uiWorkspace) ? uiWorkspace : hasConnectWorkspace(ctx.workspaces) ? ctx.workspaces : undefined
      if (workspaceNavigation === undefined) throw new UserFacingError(t('connectors.workspaceUnavailable'))
      const sessionId = await workspaceNavigation.connectWorkspace(targetWorkspaceId)
      await openConversationWithDraft(ctx, ctx.layout, ctx.sessions, sessionId, binding => {
        if (binding.ctx === undefined) throw new UnknownSessionError()
        conversation.input.for(binding.ctx as ClientContext).setDraft(prompt)
      })
    } catch (reason) {
      if (reason instanceof UnknownSessionError) throw new UserFacingError(t('connectors.sessionPending'))
      throw reason
    }
  }
  ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({
    name: 'sidebar.workspaces', priority: -1, locale: NS,
    inject: () => ({
      archiveSession,
      canDeleteSession: () => hasArchiveSessionDelete(ctx.get('remote.workspaceRegistry')),
      deleteSession,
      deleteWorkspace: (workspaceId: WorkspaceId) => ctx.workspaces.delete(workspaceId),
      forkSession,
      moveSession,
      openPath,
      openSession: (sessionId: SessionId) => openConversation(ctx, ctx.layout, sessionId),
      renameSession,
      renameWorkspace: (workspaceId: WorkspaceId, title: string) => ctx.workspaces.rename(workspaceId, title),
      insertWorkspaceBefore: (workspaceId: WorkspaceId, beforeWorkspaceId?: WorkspaceId) => ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId),
      insertSessionBefore: (workspaceId: WorkspaceId, sessionId: SessionId, beforeSessionId?: SessionId) => ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId),
      startSession: (workspaceId?: WorkspaceId) => { startWorkspaceSession(ctx, workspaceId) },
      workspaceShortcuts,
    }),
  }, CodexWorkspaceBrowser))

  ctx.effect(() => {
    if (typeof window === 'undefined') return () => {}
    const sessionId = new URL(window.location.href).searchParams.get('session') as SessionId | null
    if (sessionId === null || sessionId === '') return () => {}
    const cleanSessionDeepLink = (): void => {
      try {
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.delete('session')
        window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search + currentUrl.hash)
      } catch {}
    }
    let opened = false
    const openDeepLink = (): void => {
      if (opened) return
      const decision = deepLinkAction(ctx.sessions.list.getSnapshot().byId, isSessionArchived(ctx, sessionId), sessionId)
      if (decision === 'wait') return
      opened = true
      // 归档判断必须早于 byId：已释放的归档会话不在 byId 里，
      // 提前 return 会让深链永远清不掉，桌面壳会反复重载同一地址。
      if (decision === 'clean') {
        cleanSessionDeepLink()
        return
      }
      if (!openConversation(ctx, ctx.layout, sessionId)) cleanSessionDeepLink()
    }
    openDeepLink()
    return ctx.sessions.list.subscribe(openDeepLink)
  }, 'uncledylan-codex-ui: session deep link')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'connectors', order: 30, label: () => t('sidebar.connectors'),
    ...({ icon: 'connector' } as Record<string, unknown>),
    inject: () => ({ sessionStore: ctx.sessions.list, startPromptSession: startConnectorPromptSession, t }),
  }, ConnectorsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'about', order: Number.MAX_SAFE_INTEGER, label: () => t('about.nav'), locale: NS,
  }, AboutSection))
}
