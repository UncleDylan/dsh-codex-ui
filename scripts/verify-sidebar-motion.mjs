/** 使用真实 Chromium 采样侧栏折叠/展开的逐帧轨迹：边界线必须平滑移动，面板保留渐变淡出。 */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { chromium } from 'playwright'

const source = readFileSync('src/client/CodexSidebar.tsx', 'utf8')
const stylesheet = source.match(/const stylesheet = `([\s\S]*?)`/)?.[1]
assert.ok(stylesheet, '必须能取到侧栏样式表')
const headerStyle = readFileSync('src/client/conversation-header.ts', 'utf8').match(/export const CONVERSATION_HEADER_STYLE = `([\s\S]*?)`/)[1]
const implementation = ts.transpileModule(readFileSync('src/client/sidebar-width.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText.replace(/^export /gm, '')

const FIXTURE = `<style>*{box-sizing:border-box}body{margin:0}
/* 模拟真实宿主/伴随插件的高优先级布局规则：transition 简写被整体抢占，列宽的 CSS 过渡完全失效，
   此时边界线必须仍由插件的 Web Animations 兜底平滑移动。 */
#frame{transition:padding-right .3s!important}
#frame{display:grid;height:100vh}
#frame>*{min-width:0;overflow:hidden}
main{background:#ffffff}
/* 右栏：宿主给的是 overflow:visible、内部自绘白底，列本身的 border-radius 裁不出圆角。 */
.ui_rightbarCol{min-width:0;position:relative;overflow:visible}
.ui_rightbarPanel{height:100%;background:#ffffff}
/* 宿主在 Windows 标题栏下自己会给应用外框涂窄轨底色（[data-windows-titlebar] .xxx_frame{background:var(--dsw-specific-sidebar-fill)}），
   这里等价模拟；插件不得用 [class$="_frame"] 代劳——聊天视图里也有 *_frame 类，会把整个会话区涂灰。 */
[data-windows-titlebar] .ui_frame{background:#f3f3f3}
main>header{display:flex;align-items:center;height:46px}${headerStyle}</style>
<script>document.documentElement.setAttribute('data-windows-titlebar','')</script>
<div id="frame" class="ui_frame" style="grid-template-columns:340px minmax(0px, 1fr) 0px;--dsh-frame-leading-clearance:104px">
  <div style="min-width:0;overflow:hidden">
    <aside class="dcu-root">
      <div class="dcu-rail"><button class="dcu-icon">R</button></div>
      <div class="dcu-expanded-shell"><header class="dcu-head"><span>面板</span></header><nav class="dcu-menu"><button>新建任务</button></nav><footer class="dcu-foot">设置</footer></div>
    </aside>
  </div>
  <main class="ui_centerCol"><header><span class="crumbCurrent">会话标题</span></header></main>
  <div class="ui_rightbarCol"><div class="ui_rightbarPanel">右栏</div></div>
  <div data-side="sidebar"></div>
</div>`

/** 采样一次交互期间的完整轨迹。 */
const TRACE = `async (direction) => {
  const frame = document.getElementById('frame')
  const root = frame.querySelector('.dcu-root')
  const shell = root.querySelector('.dcu-expanded-shell')
  const crumb = frame.querySelector('.crumbCurrent')
  const main = frame.querySelector('main')
  const nextFrame = () => new Promise(requestAnimationFrame)
  const computed = () => getComputedStyle(frame)
  const snap = () => ({
    col: parseFloat(computed().gridTemplateColumns),
    rail: parseFloat(computed().getPropertyValue('--dcu-sidebar-rail-width')) || 0,
    pad: parseFloat(getComputedStyle(crumb.closest('header')).paddingLeft),
    mainLeft: +main.getBoundingClientRect().left.toFixed(2),
    handleLeft: +frame.querySelector('[data-side="sidebar"]').getBoundingClientRect().left.toFixed(2),
    opacity: +getComputedStyle(shell).opacity,
    contentOpacity: +getComputedStyle(root.querySelector('.dcu-menu')).opacity,
    radius: parseFloat(getComputedStyle(main).borderTopLeftRadius),
  })
  const tracing = { frames: [] }
  const dispose = observeSlimSidebar()
  // 必须等进场 animation 结束，否则量到的是入场淡入而不是开合过渡。
  for (let i = 0; i < 34; i++) await nextFrame()
  tracing.before = snap()
  // 折叠：宿主加标记并把列宽置 0，插件监听改回 48px；React 同步加 dcu-collapsing。
  // 展开：宿主移除标记，插件按保存宽度恢复 340px；React 同步移除 dcu-compact / dcu-collapsing。
  if (direction === 'collapse') {
    frame.setAttribute('data-sidebar-collapsed', '')
    frame.style.gridTemplateColumns = '0px minmax(0px, 1fr) 0px'
    root.classList.add('dcu-collapsing')
  } else {
    frame.removeAttribute('data-sidebar-collapsed')
    root.classList.remove('dcu-compact', 'dcu-collapsing')
  }
  const t0 = performance.now()
  while (performance.now() - t0 < 420) {
    await nextFrame()
    tracing.frames.push({ dt: Math.round(performance.now() - t0), ...snap() })
  }
  if (direction === 'collapse') root.classList.add('dcu-compact')
  await nextFrame()
  tracing.after = snap()
  // Windows 原生标题栏下的工作区圆角：展开态左上是与面板拼接的直角，折叠态必须恢复完整圆角。
  tracing.centerRadius = getComputedStyle(main).borderTopLeftRadius
  dispose()
  return tracing
}`

function analyse(trace, from, to) {
  const total = Math.abs(to - from)
  const moving = 'col'
  let worst = 0
  let worstOpacity = 0
  let worstPad = 0
  let worstRadius = 0
  const shellOpacities = trace.frames.map(frame => frame.opacity)
  const radiusSteps = trace.frames.map(frame => frame.radius)
  for (let i = 1; i < trace.frames.length; i++) {
    worst = Math.max(worst, Math.abs(trace.frames[i][moving] - trace.frames[i - 1][moving]))
    worstOpacity = Math.max(worstOpacity, Math.abs(trace.frames[i].contentOpacity - trace.frames[i - 1].contentOpacity))
    worstPad = Math.max(worstPad, Math.abs(trace.frames[i].pad - trace.frames[i - 1].pad))
    worstRadius = Math.max(worstRadius, Math.abs(trace.frames[i].radius - trace.frames[i - 1].radius))
  }
  // 折叠时圆角必须与边界同步出现：边界还在动的帧里就要有中间值圆角，不能全程直角、结尾才补。
  const radiusIntermediate = radiusSteps.filter(radius => radius > 0.5 && radius < CONTENT_CORNER_PX - 0.5).length
  const mid = trace.frames.find(frame => frame.dt >= 150) ?? trace.frames.at(-1)
  const progressAt150ms = Math.abs(mid[moving] - from) / total
  const settled = trace.frames.find(frame => Math.abs(frame[moving] - to) < 0.6)
  const railIntermediate = trace.frames.filter(frame => frame.rail > 1 && frame.rail < 47).length
  const monotonic = trace.frames.every((frame, i) => i === 0
    || (to < from ? frame[moving] <= trace.frames[i - 1][moving] + 0.6 : frame[moving] >= trace.frames[i - 1][moving] - 0.6))
  return { total, worst, worstOpacity, worstPad, worstRadius, radiusIntermediate, shellOpacities, progressAt150ms, settleMs: settled?.dt ?? Infinity, railIntermediate, monotonic, frames: trace.frames.length }
}

/** 工作区折叠态圆角，与 sidebar-width.ts 的 CONTENT_CORNER_PX 一致。 */
const CONTENT_CORNER_PX = 16

const browser = await chromium.launch({ headless: true })
try {
  const results = {}
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
  await page.setContent(FIXTURE)
  await page.addStyleTag({ content: stylesheet })
  await page.addScriptTag({ content: implementation })
  const evaluateTrace = direction => page.evaluate(`(${TRACE})(${JSON.stringify(direction)})`)
  // 首次渲染后进入稳定的展开态，再测折叠。
  const collapseTrace = await evaluateTrace('collapse')
  results['收起'] = analyse(collapseTrace, 340, 48)
  await page.waitForTimeout(120)
  // 折叠态上再测展开。
  const expandTrace = await evaluateTrace('expand')
  results['展开'] = analyse(expandTrace, 48, 340)
  assert.equal(collapseTrace.centerRadius, '16px', '折叠后工作区左上角必须恢复 16px 圆角')
  assert.equal(expandTrace.centerRadius, '0px', '展开时工作区左上角必须与面板直角拼接')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => { document.getElementById('frame').removeAttribute('data-sidebar-collapsed'); document.getElementById('frame').style.gridTemplateColumns = '340px minmax(0px, 1fr) 0px' })
  await page.waitForTimeout(80)
  const reducedFirst = await page.evaluate(async () => {
    const frame = document.getElementById('frame')
    const dispose = observeSlimSidebar()
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame)
    frame.setAttribute('data-sidebar-collapsed', '')
    frame.style.gridTemplateColumns = '0px minmax(0px, 1fr) 0px'
    await new Promise(requestAnimationFrame)
    const first = parseFloat(getComputedStyle(frame).gridTemplateColumns)
    dispose()
    return first
  })

  for (const [name, stat] of Object.entries(results)) {
    assert.ok(stat.frames >= 12, `${name} 必须采样到足够多的中间帧，实际 ${stat.frames}`)
    assert.ok(stat.monotonic, `${name} 的边界线必须单向移动，不能来回抖动`)
    assert.ok(stat.worst / stat.total < 0.25, `${name} 相邻帧跳变必须小于总位移的 25%，实际 ${(stat.worst / stat.total * 100).toFixed(1)}%`)
    assert.ok(stat.progressAt150ms > 0.45 && stat.progressAt150ms < 0.92, `${name} 半程（150ms）应完成 45%~92% 位移，实际 ${(stat.progressAt150ms * 100).toFixed(1)}%`)
    assert.ok(stat.settleMs <= 380, `${name} 必须在 380ms 内收敛到位，实际 ${stat.settleMs}ms`)
    assert.ok(stat.settleMs >= 160, `${name} 不能瞬间到位（应至少有 160ms 动画），实际 ${stat.settleMs}ms`)
    assert.ok(stat.railIntermediate >= 3, `${name} 期间顶栏安全区补偿必须连续插值，实测 ${stat.railIntermediate} 个中间帧`)
    assert.ok(stat.worstPad < 20, `${name} 时会话标题不得整帧瞬跳，最大跳变 ${stat.worstPad}px`)
    assert.ok(stat.worstOpacity < 0.35, `${name} 时面板内容必须渐变淡出而非整帧消失，最大跳变 ${stat.worstOpacity}`)
    assert.ok(stat.shellOpacities.every(opacity => opacity > 0.99), `${name} 时面板本体必须保持不透明，圆角线才不会消失`)
    assert.ok(stat.radiusIntermediate >= 3, `${name} 时工作区圆角必须与边界同步插值（实测 ${stat.radiusIntermediate} 个中间值帧），不能等边界走完再补`)
    assert.ok(stat.worstRadius < 6, `${name} 时工作区圆角不得整帧跳变，最大跳变 ${stat.worstRadius}px`)
  }
  // 右栏（浏览器/终端等分页）展开时：外角必须留在窗口右上角，中列右上必须变直角，
  // 不能把 16px 圆角跟着对话区一起往左带。
  const rightPanel = await page.evaluate(async () => {
    const frame = document.getElementById('frame')
    const column = frame.querySelector('.ui_rightbarCol')
    const main = frame.querySelector('main')
    const settle = () => new Promise(resolve => setTimeout(resolve, 420))
    // 前面的用例已经把观察器 dispose 掉，这里必须重新接管。
    const dispose = observeSlimSidebar()
    frame.removeAttribute('data-sidebar-collapsed')
    frame.style.gridTemplateColumns = '340px minmax(0px, 1fr) 240px'
    // 右栏开合时左上角不得被圆角动画波及（曾经「先变圆角再弹回直角」）。
    const topLeftSamples = []
    for (let i = 0; i < 6; i++) {
      await new Promise(requestAnimationFrame)
      topLeftSamples.push(parseFloat(getComputedStyle(main).borderTopLeftRadius))
    }
    await settle()
    const opened = {
      mainRadius: parseFloat(getComputedStyle(main).borderTopRightRadius),
      topLeftMax: Math.max(...topLeftSamples),
      marker: column.hasAttribute('data-dcu-outer-corner'),
      overlayWidth: parseFloat(getComputedStyle(column, '::after').width),
      overlayRight: getComputedStyle(column, '::after').right,
    }
    frame.style.gridTemplateColumns = '340px minmax(0px, 1fr) 0px'
    for (let i = 0; i < 6; i++) {
      await new Promise(requestAnimationFrame)
      topLeftSamples.push(parseFloat(getComputedStyle(main).borderTopLeftRadius))
    }
    await settle()
    const closed = {
      mainRadius: parseFloat(getComputedStyle(main).borderTopRightRadius),
      topLeftMax: Math.max(...topLeftSamples),
      marker: column.hasAttribute('data-dcu-outer-corner'),
    }
    dispose()
    return { opened, closed }
  })
  assert.equal(rightPanel.opened.mainRadius, 0, '右栏展开时中列右上必须是直角：圆角属于最右列，不能跟着对话区平移')
  assert.ok(rightPanel.opened.marker, '右栏展开时最右可见列必须挂上外角标记')
  assert.equal(rightPanel.opened.overlayWidth, 16, '窗口外角遮罩必须是 16px')
  assert.equal(rightPanel.opened.overlayRight, '0px', '外角遮罩必须钉在窗口右边缘，不随列宽移动')
  assert.equal(rightPanel.closed.mainRadius, 16, '右栏收起后中列右上恢复 16px 外角圆角')
  assert.ok(!rightPanel.closed.marker, '右栏收起后不得残留外角遮罩标记')
  assert.ok(rightPanel.opened.topLeftMax < 2 && rightPanel.closed.topLeftMax < 2, `右栏开合全程左上角必须保持直角不闪变，实测最大 ${Math.max(rightPanel.opened.topLeftMax, rightPanel.closed.topLeftMax)}px`)

  // 工作区分页缝隙：宿主用 l4(#00000029) 画两条线——① 分页容器自身的 border-left；
  // ② 并且分屏时用 0 宽分隔条的 ::before 背景线。两条都必须被插件染成轨道色并加粗到 1px。
  const dockSeams = await page.evaluate(() => {
    const style = document.createElement('style')
    // 复刻宿主 dock 样式（类名带哈希后缀，插件按子串匹配）。
    style.textContent = `
      :root{--dsw-alias-border-l4:#00000029}
      .host_tabHost_x1{border-left:.5px solid var(--dsw-alias-border-l4)}
      .host_splitRow_x2{display:flex}
      .host_divider_x3{position:relative;flex:none;width:0}
      .host_divider_x3::before{content:"";position:absolute;top:0;bottom:0;left:-.25px;width:.5px;background:var(--dsw-alias-border-l4)}
      .host_splitColumn_x4{display:flex;flex-direction:column}
      .host_divider_x3::before{left:0;right:0;top:-.25px;height:.5px}`
    document.head.append(style)
    const host = document.createElement('div')
    host.innerHTML = `<div class="host_splitRow_x2" data-dockkit-split="s1">
      <div class="_tabHost_x1"></div><div class="host_divider_x3" data-dockkit-divider="s1:0"></div><div class="_tabHost_x1"></div>
    </div>`
    document.body.append(host)
    // 纵向分屏的分隔条：::before 靠 left/right 撑满，不得被加粗规则截成 1px。
    const column = document.createElement('div')
    column.className = 'host_splitColumn_x4'
    column.innerHTML = '<div class="host_divider_x3" data-dockkit-divider="s2:0"></div>'
    document.body.append(column)
    const pane = host.querySelector('._tabHost_x1')
    const divider = host.querySelector('[data-dockkit-divider]')
    const columnDivider = column.querySelector('[data-dockkit-divider]')
    const paneStyle = getComputedStyle(pane)
    const beforeStyle = getComputedStyle(divider, '::before')
    const columnBefore = getComputedStyle(columnDivider, '::before')
    return {
      paneWidth: parseFloat(paneStyle.borderLeftWidth),
      paneColor: paneStyle.borderLeftColor,
      seamBackground: beforeStyle.backgroundColor,
      seamWidth: parseFloat(beforeStyle.width),
      seamLeft: beforeStyle.left,
      columnWidth: parseFloat(columnBefore.width),
      columnHeight: parseFloat(columnBefore.height),
    }
  })
  assert.equal(dockSeams.paneWidth, 1, '分页容器的缝隙线必须加粗到 1px')
  assert.equal(dockSeams.paneColor, 'rgb(243, 243, 243)', '分页容器的缝隙线必须染成侧栏轨道色 #f3f3f3')
  assert.equal(dockSeams.seamBackground, 'rgb(243, 243, 243)', '分屏分隔条的 ::before 背景线必须同样染成 #f3f3f3，它不参与 border 规则')
  assert.equal(dockSeams.seamWidth, 1, '分屏分隔条必须加粗到 1px')
  assert.equal(dockSeams.seamLeft, '-0.5px', '加粗后必须仍然居中压在分界线上')
  assert.equal(dockSeams.columnWidth, 0.5, '纵向分屏的横线不得被 width:1px 加粗规则命中（只能对 _splitRow_ 生效）')
  assert.equal(dockSeams.columnHeight, 0.5, '纵向分屏的横线保持宿主原样')

  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('frame')).backgroundColor), 'rgb(243, 243, 243)', '宿主外框底色必须是窄轨同色（由宿主自带规则提供）；插件不得用 [class$="_frame"] 代劳，否则会误伤聊天视图的 *_frame 容器')
  assert.equal(reducedFirst, 48, '减少动态效果时必须立即到位')
  const summary = Object.entries(results).map(([name, stat]) => `${name}: ${stat.settleMs}ms 到位、半程 ${(stat.progressAt150ms * 100).toFixed(0)}%、最大帧跳变 ${(stat.worst / stat.total * 100).toFixed(0)}%`).join('；')
  console.log(`侧栏开合：${summary}；标题位移连续、内容渐变淡出、面板圆角全程钉在原地、工作区圆角随边界同步出现；右栏展开时窗口外角固定在原地。`)
} finally {
  await browser.close()
}
