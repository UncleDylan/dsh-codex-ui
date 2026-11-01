import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { observeHostTablerIcons, HOST_TABLER_ICONS_STYLE } from '../src/client/host-tabler-icons.ts'
import { CONVERSATION_HEADER_STYLE } from '../src/client/conversation-header.ts'

const source = readFileSync(new URL('../src/client/host-tabler-icons.ts', import.meta.url), 'utf8')
const client = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')

// ── 唯一 owner：图标替换补丁不得再散落在别的模块 ──
assert.match(client, /observeHostTablerIcons/, '宿主图标族观察必须接入客户端')
for (const other of ['activity-card', 'conversation-header', 'sidebar-width', 'model-menu-card']) {
  const text = readFileSync(new URL(`../src/client/${other}.ts`, import.meta.url), 'utf8')
  assert.doesNotMatch(text, /dcu-tabler-dots|dcu-tabler-panel|dcu-tabler-icon/, `${other}.ts 不得再私挂图标替换（归口 host-tabler-icons）`)
}

// ── 目标身份（app.asar 解包确认）──
assert.match(source, /data-dockkit-split-button/, '分栏按钮必须按 dockkit 数据标记识别')
assert.match(source, /data-sidebar-right-mode/, '全屏按钮必须按右侧面板数据标记识别')
assert.match(source, /data-sidebar-right-expand/, '展开钮必须按右侧面板数据标记识别')
assert.match(source, /data-sidebar-right-toggle/, '收起钮必须按右侧面板数据标记识别')
assert.match(source, /data-conversation-header-corner/, '对话顶栏角槽按钮必须按角槽识别')
assert.match(source, /dcu-activity-toggle/, '「···」识别必须排除活动卡开关，防止活动卡停用后错认目标')
assert.match(source, /svg\[class\*="titleIcon"\]/, '指南针必须按页签标题图标类名识别')
assert.match(source, /M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0/, '···必须使用 Tabler dots 路径')
assert.match(source, /M8 16l2 -6l6 -2l-2 6l-6 2/, '指南针必须使用 Tabler brand-safari 路径')
assert.match(source, /M12 3v18/, '分栏必须使用 Tabler columns-2 路径')
assert.match(source, /M4 8v-2a2 2 0 0 1 2 -2h2/, '全屏必须使用 Tabler maximize 路径')
assert.match(source, /M15 19v-2a2 2 0 0 1 2 -2h2/, '退出全屏必须使用 Tabler minimize 路径')
assert.match(source, /M15 4l0 16/, '侧栏开关必须使用 Tabler layout-sidebar-right 路径')

// ── 三颗侧栏开关（角槽 / expand / toggle）共用同一 marker + 同一枚图标 ──
const panelRules = [...source.matchAll(/marker: 'data-dcu-tabler-panel'/g)]
assert.equal(panelRules.length, 3, '角槽 / expand / toggle 三条规则必须共用 panel marker（同名去重）')
assert.match(source, /data-sidebar-right-mode'\) === 'push' \? MINIMIZE_ICON : MAXIMIZE_ICON/, '全屏钮必须按模式状态区分 maximize/minimize')
assert.match(source, /state: element => element\.getAttribute\('data-sidebar-right-mode'\) === 'push' \? 'min' : 'max'/, '全屏钮必须用状态键重估，防止状态翻转后残留旧图')
assert.match(source, /attributeFilter: \['data-sidebar-right-mode'\]/, '模式翻转（只改属性不重建节点）必须被观察到')
// 宿主 React 管理的节点只准隐藏原 svg + 插入自己的，替换 outerHTML 会重渲染脱钩白屏。
assert.doesNotMatch(source, /outerHTML/, '不得替换宿主节点 outerHTML')
assert.match(source, /pruneOrphans/, '必须清理宿主重建后失配的残留图标')
assert.match(HOST_TABLER_ICONS_STYLE, /\[data-dcu-tabler-dots\] \.dcu-tabler-icon,\[data-dcu-tabler-panel\] \.dcu-tabler-icon,\[data-dcu-tabler-split\] \.dcu-tabler-icon,\[data-dcu-tabler-maximize\] \.dcu-tabler-icon\{width:18px;height:18px;flex:none\}/, '顶栏钮图标必须统一 18px，且 flex:none 抵消宿主按钮 16px 内容盒的 flex 收缩（右侧栏条 28px+6px padding）')
assert.match(HOST_TABLER_ICONS_STYLE, /svg\[data-dcu-tabler-compass\]\{display:none\}/, '原罗盘 svg 必须用 CSS 隐藏')
assert.match(HOST_TABLER_ICONS_STYLE, /svg\[data-dcu-tabler-compass\]\+\.dcu-tabler-icon\{width:18px;height:18px;flex:none\}/, '罗盘必须同为 18px')
assert.doesNotMatch(HOST_TABLER_ICONS_STYLE, /width:(?!18px)/, '全族只准 18px：分栏 / 全屏不得再做逐枚尺寸校正（用户定稿，此前 split 16px / maximize 20px 已撤）')

const { window } = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true })
const doc = window.document
// 模块在宿主里用全局 document/window/MutationObserver；node 下把 jsdom 全局接上
;(globalThis as Record<string, unknown>).window = window
;(globalThis as Record<string, unknown>).document = doc
;(globalThis as Record<string, unknown>).MutationObserver = window.MutationObserver

/** 复刻宿主 DOM：会话顶栏（含工具条簇/角槽/活动卡开关）+ 右侧面板 + 主页展开钮。 */
function hostHtml({ withActivityToggle = true, panelMode = 'fullscreen' }: { withActivityToggle?: boolean, panelMode?: string } = {}): string {
  return `
<header>
  <div class="v1kfCW_titleRow">
    <nav class="v1kfCW_crumbs"><span class="v1kfCW_crumbSeg"><button class="v1kfCW_crumb v1kfCW_crumbCurrent">会话标题</button></span></nav>
    <div class="v1kfCW_headerActions"><button type="button">标准模式</button></div>
    <div class="v1kfCW_headerUtilities">
      <button type="button" class="hostDots"><svg width="16"><circle/></svg></button>
      ${withActivityToggle ? '<button type="button" class="dcu-activity-toggle"><svg class="dcu-tabler-icon"><path/></svg></button>' : ''}
    </div>
    <div class="v1kfCW_headerCorner" data-conversation-header-corner><button type="button"><svg class="hostPanel" width="15"><path/></svg></button></div>
  </div>
</header>
<div data-sidebar-right-session="s1">
  <div class="OUqwTW_panel" data-sidebar-right-panel="push" data-sidebar-right-open>
    <div class="OUqwTW_panelBody">
      <div data-dockkit-host="dock" data-dockkit-column="0" data-dockkit-pane="pane1">
        <div class="strip">
          <span class="chip"><svg class="unKlVG_titleIcon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14C11.3 14 14 11.3 14 8Z"/></svg><span>开始</span></span>
          <button type="button" class="ke_iconButton" aria-label="分栏" data-dockkit-split-button="pane1"><svg width="15" height="15"><path/></svg></button>
          <button type="button" class="OUqwTW_iconButton" aria-label="全屏" data-sidebar-right-mode="${panelMode}"><svg width="16" height="16"><path/></svg></button>
          <button type="button" class="OUqwTW_iconButton" aria-label="折叠" data-sidebar-right-toggle="true"><svg class="OUqwTW_collapseGlyph" width="15" height="15"><path/></svg></button>
        </div>
      </div>
    </div>
  </div>
  <button type="button" class="dzXS4q_button" aria-label="展开" data-sidebar-right-expand="true"><svg class="dzXS4q_icon" width="15" height="15"><path/></svg></button>
</div>`
}

function setup(html: string): () => void {
  doc.body.innerHTML = html
  return observeHostTablerIcons(doc)
}

let stop = setup(hostHtml())
const marked = (root: ParentNode): string[] =>
  [...root.querySelectorAll('[data-dcu-tabler-dots],[data-dcu-tabler-panel],[data-dcu-tabler-split],[data-dcu-tabler-maximize],[data-dcu-tabler-compass]')]
    .map(node => node.getAttribute('data-dcu-tabler-dots') !== null ? 'dots'
      : node.getAttribute('data-dcu-tabler-panel') !== null ? 'panel'
      : node.getAttribute('data-dcu-tabler-split') !== null ? 'split'
      : node.getAttribute('data-dcu-tabler-maximize') !== null ? 'maximize' : 'compass')
    .sort()

// 六处目标全部命中；活动卡开关自身不得被当作「···」或再打标
assert.deepEqual(marked(doc), ['compass', 'dots', 'maximize', 'panel', 'panel', 'panel', 'split'], '六处图标（···/角槽/展开/收起/分栏/全屏）加罗盘必须全部打标')
const dots = doc.querySelector('.hostDots')!
assert.ok(dots.hasAttribute('data-dcu-tabler-dots'), '「···」必须是工具条簇里最后一颗宿主按钮')
assert.equal(doc.querySelector('.dcu-activity-toggle')?.hasAttribute('data-dcu-tabler-dots'), false, '活动卡开关不得被换图标')
// 侧栏三颗开关同一图标：图2（对话页角槽）那份 layout-sidebar-right
for (const button of doc.querySelectorAll('[data-conversation-header-corner] button,[data-sidebar-right-expand],[data-sidebar-right-toggle]')) {
  assert.match(button.querySelector('.dcu-tabler-icon')?.outerHTML ?? '', /M15 4l0 16/, '三颗侧栏开关必须共用同一枚 layout-sidebar-right')
  assert.equal(button.querySelectorAll('.dcu-tabler-icon').length, 1, '每颗按钮只允许一枚插入图标')
}
assert.equal(doc.querySelectorAll('[data-sidebar-right-toggle] .dcu-tabler-icon,[data-sidebar-right-expand] .dcu-tabler-icon').length, 2, '展开/收起钮各一枚，不得双图标')

// 分栏与罗盘
assert.match(doc.querySelector('[data-dockkit-split-button] .dcu-tabler-icon')?.outerHTML ?? '', /M12 3v18/, '分栏按钮必须插入 columns-2 图标')
assert.match(doc.querySelector('[data-dcu-tabler-compass]')?.nextElementSibling?.outerHTML ?? '', /M8 16l2 -6l6 -2l-2 6l-6 2/, '指南针后必须插入 brand-safari 图标')

// 活动卡开关不存在的页面（如未装卡片时）：···识别照样成立
stop()
stop = setup(hostHtml({ withActivityToggle: false }))
assert.ok(doc.querySelector('.hostDots')?.hasAttribute('data-dcu-tabler-dots'), '没有活动卡开关时「···」识别必须照常成立')
stop()

// 全屏钮按状态分图标：属性值 fullscreen = 当前 push → maximize；值 push = 当前全屏 → minimize
function modeIcon(mode: string): string {
  doc.body.innerHTML = hostHtml({ panelMode: mode })
  const modeButton = doc.querySelector('[data-sidebar-right-mode]')!
  const stopLocal = observeHostTablerIcons(doc)
  const icon = modeButton.querySelector('.dcu-tabler-icon')?.outerHTML ?? ''
  stopLocal()
  return icon
}
assert.match(modeIcon('fullscreen'), /M4 8v-2a2 2 0 0 1 2 -2h2/, 'push 态全屏钮必须显示 maximize')
assert.match(modeIcon('push'), /M15 19v-2a2 2 0 0 1 2 -2h2/, '全屏态全屏钮必须显示 minimize')

// 状态翻转（只换属性、不重建节点）后重扫要换成另一枚，不残留旧图标
doc.body.innerHTML = hostHtml()
const modeButton = doc.querySelector('[data-sidebar-right-mode]')!
const stopFlip = observeHostTablerIcons(doc)
assert.match(modeButton.querySelector('.dcu-tabler-icon')?.outerHTML ?? '', /M4 8v-2/, '初始为 push 态 → maximize')
modeButton.setAttribute('data-sidebar-right-mode', 'push')
// 模拟 dynamic 重估：宿主只翻属性，图标节点留在原地
stopFlip()
const stopFlip2 = observeHostTablerIcons(doc)
assert.match(modeButton.querySelector('.dcu-tabler-icon')?.outerHTML ?? '', /M15 19v-2/, '翻转后必须换成 minimize 且不残留 maximize')
assert.equal(modeButton.querySelectorAll('.dcu-tabler-icon').length, 1, '翻转后仍只有一枚图标')
stopFlip2()

// 宿主重建按钮（丢标记、换内容）后，新一轮扫描要先清残留再补挂，不得重复
doc.body.innerHTML = hostHtml()
stop = observeHostTablerIcons(doc)
const split = doc.querySelector('[data-dockkit-split-button]')!
split.removeAttribute('data-dcu-tabler-split')
split.innerHTML = '<svg width="15" height="15"><path/></svg><svg class="dcu-tabler-icon"><path/></svg>'
stop()
assert.equal(doc.querySelectorAll('.dcu-tabler-icon').length, 0, 'dispose 必须撤掉全部插入图标')
assert.equal(doc.querySelectorAll('[data-dcu-tabler-dots],[data-dcu-tabler-panel],[data-dcu-tabler-split],[data-dcu-tabler-maximize],[data-dcu-tabler-compass]').length, 0, 'dispose 必须清掉全部数据标记')

stop = observeHostTablerIcons(doc)
assert.equal(doc.querySelectorAll('[data-dockkit-split-button] .dcu-tabler-icon').length, 1, '重建后的按钮必须补挂且不重复')
assert.equal(doc.querySelectorAll('[data-dockkit-split-button] svg:not(.dcu-tabler-icon)').length, 1, '宿主原 svg 必须保留在场（仅 CSS 隐藏）')
stop()

// 会话顶栏自身的样式不与图标族冲突：crumbSeg 居中规则仍在（文件夹/··· 与右侧同中线）
assert.match(CONVERSATION_HEADER_STYLE, /crumbSeg"\]:has\(\[class\*="crumbCurrent"\]\)\{display:inline-flex;align-items:center\}/, '标题段居中排版规则必须保留')

console.log('✓ host-tabler-icons.assert.ts passed')
