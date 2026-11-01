import { currentSessionId, type SessionListLike } from './session-host.ts'

/**
 * 浏览器式历史中的一个位置。会话之外，设置页这样的「页面」也是栈上的条目：
 * 打开设置 = 前进到新位置，关闭 = 后退一格，←/→ 由此在两者之间往返。
 */
export type NavigationLocation =
  | { kind: 'session'; id: string }
  | { kind: 'settings'; section?: string }

export type SettingsLocation = Extract<NavigationLocation, { kind: 'settings' }>

/** 设置页注册的开/关原语；历史导航借它在主页与设置页之间移动。 */
export type NavigationViewHandlers = {
  open: (location: SettingsLocation) => void
  close: () => void
}

export type NavigationHistory = {
  getSnapshot: () => Readonly<{ canBack: boolean; canForward: boolean }>
  subscribe: (listener: () => void) => () => void
  back: () => void
  forward: () => void
  dispose: () => void
  /** 设置页注册自己的打开/关闭原语；未注册时历史里的设置条目视为不可达。 */
  registerView: (handlers: NavigationViewHandlers) => () => void
  /** 设置页打开（或页内切换分区）时回报：入栈，或原地更新当前条目的分区（等同改 URL）。 */
  enterView: (location: SettingsLocation) => void
  /** 设置页关闭时回报：索引退回上一格；设置条目保留为前进目标，直到下一次新导航截断它。 */
  leaveView: () => void
}

/** Follow host session selections without navigating the Electron document history. */
export function createNavigationHistory(store: {
  getSnapshot: () => SessionListLike
  subscribe: (listener: () => void) => () => void
}, open: (id: string) => boolean): NavigationHistory {
  let entries: NavigationLocation[] = []
  let index = -1
  let pending: number | undefined
  // 历史驱动的开合会让设置页回报 enter/leave、让会话 store 抖动；置位期间这些回报一律忽略。
  let navigating = false
  let snapshot = { canBack: false, canForward: false }
  const listeners = new Set<() => void>()
  let viewHandlers: NavigationViewHandlers | undefined

  const isSession = (location: NavigationLocation | undefined): location is Extract<NavigationLocation, { kind: 'session' }> => location?.kind === 'session'

  const target = (direction: number): number | undefined => {
    for (let next = index + direction; next >= 0 && next < entries.length; next += direction) {
      const entry = entries[next]!
      const reachable = entry.kind === 'settings' ? viewHandlers !== undefined : store.getSnapshot().byId?.[entry.id] !== undefined
      if (reachable) return next
    }
    return undefined
  }
  const syncSnapshot = (): void => {
    const next = { canBack: target(-1) !== undefined, canForward: target(1) !== undefined }
    if (next.canBack === snapshot.canBack && next.canForward === snapshot.canForward) return
    snapshot = next
    for (const listener of listeners) listener()
  }
  const update = (): void => {
    const current = currentSessionId(store.getSnapshot())
    const pendingIndex = pending
    const pendingEntry = pendingIndex === undefined ? undefined : entries[pendingIndex]
    if (current !== undefined && pendingIndex !== undefined && pendingEntry !== undefined && isSession(pendingEntry) && pendingEntry.id === current) {
      index = pendingIndex
      pending = undefined
    } else if (!navigating && current !== undefined) {
      const entry = entries[index]
      // 设置页打开期间当前会话没有变（页面是 inert 的），只有真正切到别的会话才新开一条历史。
      if (entry === undefined || (entry.kind === 'session' && entry.id !== current)) {
        entries = entries.slice(0, index + 1)
        entries.push({ kind: 'session', id: current })
        index = entries.length - 1
        pending = undefined
      }
    }
    syncSnapshot()
  }
  // React 的被动效果可能晚于微任务；用宏任务兜底，确保页面回报 enter/leave 时守卫仍然生效。
  const settle = (): void => {
    window.setTimeout(() => { navigating = false }, 0)
  }
  const navigate = (direction: number): void => {
    const next = target(direction)
    if (next === undefined) return
    const targetEntry = entries[next]!
    if (targetEntry.kind === 'session') {
      // 会话目标沿用 pending 校验：等 store 确认真的切过去了才移动游标，打开失败则原地不动。
      if (isSession(entries[index])) pending = undefined
      // 从设置页退回会话：先关掉设置页。它的 leaveView 回报会把游标先退一格，
      // 待 store 确认后 pending 校验会落到正确位置；关闭本身不依赖这次回报。
      if (entries[index]?.kind === 'settings') viewHandlers?.close()
      pending = next
      try {
        if (!open(targetEntry.id)) pending = undefined
      } catch (error) {
        pending = undefined
        throw error
      }
      update()
      return
    }
    // 设置页目标没有 store 反馈，直接移动游标；navigating 抑制页面回报的 enter/leave
    // （open/close 原语引发的 React 效果最多晚到下一个宏任务）。
    navigating = true
    settle()
    if (entries[index]?.kind === 'settings') viewHandlers?.close()
    index = next
    viewHandlers?.open(targetEntry)
    syncSnapshot()
  }
  update()
  const unsubscribe = store.subscribe(update)
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    back: () => { navigate(-1) },
    forward: () => { navigate(1) },
    registerView: handlers => {
      viewHandlers = handlers
      syncSnapshot()
      return () => { if (viewHandlers === handlers) viewHandlers = undefined; syncSnapshot() }
    },
    enterView: location => {
      if (navigating) return
      const entry = entries[index]
      if (entry?.kind === 'settings') {
        // 设置页内切分区 = 一次导航：分区变了就压栈（前进分支作废），原地重复回报只更新分区。
        if (entry.section === location.section) return
        entries = entries.slice(0, index + 1)
        entries.push({ kind: 'settings', section: location.section })
        index = entries.length - 1
        syncSnapshot()
        return
      }
      entries = entries.slice(0, index + 1)
      entries.push({ kind: 'settings', section: location.section })
      index = entries.length - 1
      syncSnapshot()
    },
    leaveView: () => {
      if (navigating || entries[index]?.kind !== 'settings') return
      // 关闭设置 = 离开整段设置浏览：把连续的设置条目折叠成离开时的最后一个位置，
      // 游标退回其前的会话；前进目标就是离开时的分区，→ 一步重返。
      let start = index
      while (start > 0 && entries[start - 1]!.kind === 'settings') start -= 1
      if (start !== index) entries = [...entries.slice(0, start), entries[index]!]
      index = start - 1
      pending = undefined
      syncSnapshot()
    },
    dispose: () => { unsubscribe(); viewHandlers = undefined; listeners.clear() },
  }
}
