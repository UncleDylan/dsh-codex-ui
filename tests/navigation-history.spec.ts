import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'
import { createNavigationHistory } from '../src/client/navigation-history.ts'
import { DesktopNavigationControls } from '../src/client/DesktopNavigationControls.tsx'

function fixture() {
  let current = 'a'
  let byId: Record<string, object> = { a: {}, b: {}, c: {} }
  const listeners = new Set<() => void>()
  const select = (id: string) => { current = id; for (const listener of listeners) listener() }
  const open = vi.fn((id: string) => { select(id); return true })
  const history = createNavigationHistory({
    getSnapshot: () => ({ current, byId }),
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
  }, open)
  return { history, select, open, listeners, remove: (id: string) => { byId = { ...byId }; delete byId[id]; for (const listener of listeners) listener() } }
}

test('back/forward follows visits and a new visit replaces the forward branch', () => {
  const f = fixture()
  expect(f.history.getSnapshot()).toEqual({ canBack: false, canForward: false })
  f.select('b'); f.select('c')
  f.history.back(); f.history.back(); f.history.forward()
  expect(f.open.mock.calls.map(([id]) => id)).toEqual(['b', 'a', 'b'])
  f.select('a')
  expect(f.history.getSnapshot().canForward).toBe(false)
  f.history.back()
  expect(f.open).toHaveBeenLastCalledWith('b')
  f.history.dispose()
  expect(f.listeners.size).toBe(0)
})

test('deleted visits are skipped and a failed open keeps the current position', () => {
  const f = fixture()
  f.select('b'); f.select('c'); f.remove('b')
  f.open.mockImplementationOnce(() => false)
  f.history.back()
  expect(f.history.getSnapshot()).toEqual({ canBack: true, canForward: false })
  f.history.back()
  expect(f.open).toHaveBeenLastCalledWith('a')
  expect(f.history.getSnapshot()).toEqual({ canBack: false, canForward: true })
  f.history.dispose()
})

test('returning to the same session across a deleted visit still moves the cursor', () => {
  const f = fixture()
  f.select('b'); f.select('a'); f.remove('b')
  f.history.back()
  expect(f.history.getSnapshot()).toEqual({ canBack: false, canForward: true })
  f.history.forward()
  expect(f.history.getSnapshot()).toEqual({ canBack: true, canForward: false })
  f.history.dispose()
})

test('settings page participates in browser-style history', () => {
  const f = fixture()
  const opened: (string | undefined)[] = []
  let settingsOpen = false
  const unregister = f.history.registerView({
    open: location => { opened.push(location.section); settingsOpen = true },
    close: () => { settingsOpen = false },
  })
  f.select('b')
  // 用户打开设置（页面回报）→ 入栈
  f.history.enterView({ kind: 'settings', section: 'general' })
  expect(settingsOpen).toBe(false)
  expect(f.history.getSnapshot()).toEqual({ canBack: true, canForward: false })
  // 页内切换分区 = 一次导航：分区条目压栈
  f.history.enterView({ kind: 'settings', section: 'models' })
  // 关闭设置（页面回报）→ 游标退回会话，设置条目保留为前进目标
  f.history.leaveView()
  expect(f.history.getSnapshot()).toEqual({ canBack: true, canForward: true })
  // → 重返设置页，并恢复离开时的分区
  f.history.forward()
  expect(settingsOpen).toBe(true)
  expect(opened.at(-1)).toBe('models')
  // ← 回到上一个会话：设置页关闭原语被调用
  f.history.back()
  expect(settingsOpen).toBe(false)
  expect(f.open).toHaveBeenLastCalledWith('b')
  unregister()
  f.history.dispose()
})

test('view echoes during history navigation do not duplicate entries', () => {
  const f = fixture()
  let settingsOpen = false
  // 与真实设置页一致：open/close 原语里会顺手 enter/leave 回报
  f.history.registerView({
    open: location => { settingsOpen = true; f.history.enterView(location) },
    close: () => { settingsOpen = false; f.history.leaveView() },
  })
  f.select('b')
  f.history.enterView({ kind: 'settings', section: 'general' })
  f.history.back()
  expect(f.open).toHaveBeenLastCalledWith('b')
  // → 重返设置页：open 原语里的 enterView 被守卫忽略，不得再压栈
  f.history.forward()
  expect(settingsOpen).toBe(true)
  expect(f.history.getSnapshot()).toEqual({ canBack: true, canForward: false })
  f.history.back()
  expect(f.open).toHaveBeenLastCalledWith('b')
  f.history.dispose()
})

test('section switches push history so back moves between sections', () => {
  const f = fixture()
  const opened: (string | undefined)[] = []
  f.history.registerView({
    open: location => { opened.push(location.section) },
    close: () => {},
  })
  f.select('b')
  f.history.enterView({ kind: 'settings', section: 'general' })
  f.history.enterView({ kind: 'settings', section: 'models' })
  // 设置页内 ←：退到上一个分区，不经过会话打开
  f.history.back()
  expect(opened.at(-1)).toBe('general')
  expect(f.open).not.toHaveBeenCalled()
  // 再 ←：离开设置页回到会话
  f.history.back()
  expect(f.open).toHaveBeenLastCalledWith('b')
  f.history.dispose()
})

test('caption arrows update enabled state and navigate without sidebar actions', async () => {
  const f = fixture()
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => { root.render(createElement(DesktopNavigationControls, { history: f.history, t: key => key })) })
    const back = container.querySelector<HTMLButtonElement>('[aria-label="navigation.back"]')!
    const forward = container.querySelector<HTMLButtonElement>('[aria-label="navigation.forward"]')!
    expect(back.disabled).toBe(true)
    expect(forward.disabled).toBe(true)
    await act(async () => { f.select('b') })
    expect(back.disabled).toBe(false)
    await act(async () => { back.click() })
    expect(f.open).toHaveBeenLastCalledWith('a')
    expect(back.disabled).toBe(true)
    expect(forward.disabled).toBe(false)
    await act(async () => { forward.click() })
    expect(f.open).toHaveBeenLastCalledWith('b')
    expect(container.querySelectorAll('button')).toHaveLength(2)
  } finally {
    await act(async () => { root.unmount() })
    f.history.dispose(); container.remove()
  }
})
