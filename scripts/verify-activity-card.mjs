/** 验证右上角活动摘要卡：变更（会话累计）/输出/来源、Codex 规格排版、顶栏开关（「···」右侧）、内容区让位、滚动定位、按会话关闭记忆、暗色与窄口隐藏、卸载恢复。 */
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { chromium } from 'playwright'
import ts from 'typescript'

// 卡片模块依赖三个本地文件；按依赖序转译拼接成一段浏览器脚本（全部是相对导入，无外部包）。
const FILES = ['src/client/conversation-dom.ts', 'src/client/tree-expansion.ts', 'src/client/activity-summary.ts', 'src/client/activity-card.ts']
const source = FILES
  .map(path => readFileSync(path, 'utf8')
    .replace(/^import\b.*$/gm, '')
    .replaceAll('export ', ''))
  .join('\n')
  + `\nwindow.observeActivityCard = observeActivityCard;`
const script = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText

const CSS = `<style>
body{margin:0;--dsw-font-family:system-ui;--dsw-alias-label-primary:#222;--dsw-alias-label-secondary:#8a8a8a;--dsw-alias-label-caption:#98999a;--dsw-alias-state-business-primary:#3a83f7;--dsw-radius-sm:6px}
body[data-ds-dark-theme]{--dsw-alias-label-primary:#ececec;--dsw-alias-label-secondary:#9b9b9b;--dsw-alias-label-caption:#9d9d9e;background:#111}
*{box-sizing:border-box}
header{height:46px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid #eee}
.host_headerUtilities{display:flex;gap:4px;margin-left:auto}
.host_headerUtilities button{width:28px;height:28px}
#scroll{height:600px;overflow-y:auto;padding:16px 40px 16px 16px;position:relative}nav[data-dcu-official-turn-navigator]{position:absolute;right:12px;top:40px;width:16px}
.turn{height:220px}
</style>`

/** 宿主会话区最小复刻：header（含工具条簇与「···」）+ 滚动容器；会话内容由各场景注入 #content。 */
const SHELL = `<div id="frame" data-conversation-region="chat"><header><div class="host_headerActions"><button id="more" title="更多"><svg viewBox="0 0 24 24" width="16" height="16"><circle cx="5" cy="12" r="1"/></svg></button></div><div class="host_headerUtilities"></div><div data-conversation-header-corner><button id="collapse" title="折叠"><svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="3" width="18" height="18"/></svg></button></div></header><div id="scroll" data-conversation-scroll><div id="content"></div><nav data-dcu-official-turn-navigator="true"></nav></div></div>`

const browser = await chromium.launch({ headless: true })
let realm = 0
// 真实 origin（about:blank 是不透明源，localStorage 会抛错），每个场景换路径但同源——
// 关闭记忆按会话 id 区分，不按路径。服务器挂到 try 外，finally 里才能关掉让进程退出。
const server = createServer((_req, res) => { res.setHeader('content-type', 'text/html'); res.end(CSS + SHELL) })
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', error => { console.error('页面异常：', error.message) })

  /** 每个场景一个新文档（清掉内存态）；localStorage 留给同源跨场景，关闭记忆按会话区分。 */
  const fresh = async () => {
    await page.goto(`${origin}/realm-${++realm}`)
    await page.addScriptTag({ content: script })
    await page.evaluate(() => {
      window.sessionId = 'session-1'
      window.disposeCard = window.observeActivityCard({
        labels: {
          region: '会话活动', changes: '变更', outputs: '输出内容', sources: '来源',
          viewChanges: '查看变更', viewAll: '查看全部', collapse: '收起', close: '收起卡片',
          countFiles: count => `${count} 个文件`, countSources: count => `${count} 个来源`,
        },
        session: () => window.sessionId,
      })
      window.setSession = id => {
        window.sessionId = id
        document.getElementById('content').innerHTML = '' // 换会话：宿主整体替换会话内容
      }
    })
  }
  /** 注入带变更卡（多轮）、呈现/工具行与外部链接的会话内容（用户回显里的链接不算来源）。 */
  const fillConversation = () => page.evaluate(() => {
    const content = document.getElementById('content')
    const card = (files, header) => {
      const el = document.createElement('div')
      el.setAttribute('data-changed-files', '')
      const stat = document.createElement('div')
      stat.className = 'kuvljq_stat'
      stat.innerHTML = `<span class="kuvljq_added">+${header.added}</span><span class="kuvljq_deleted">−${header.deleted}</span>`
      const list = document.createElement('div')
      list.className = 'kuvljq_list'
      for (const f of files) {
        const row = document.createElement('button')
        row.innerHTML = `<span class="kuvljq_path">${f.path}</span><span><span class="kuvljq_added">+${f.added}</span><span class="kuvljq_deleted">−${f.deleted}</span></span>`
        list.append(row)
      }
      el.append(stat, list)
      return el
    }
    const turn = inner => {
      const el = document.createElement('div')
      el.className = 'turn'
      el.innerHTML = inner
      content.append(el)
    }
    // 占位轮在前，带数据的轮在后：滚动定位的断言要求目标块居中时真的产生滚动量。
    for (let i = 0; i < 5; i++) turn('<p> filler </p>')
    turn('<div data-submission-echo="1"><a href="https://user.example.com/pasted">用户贴的</a></div>'
      + card([{ path: 'a.md', added: 10, deleted: 1 }], { added: 10, deleted: 1 }).outerHTML)
    turn('<a href="https://docs.example.net/guide/intro#sec">指南</a>'
      + '<a href="http://localhost:3000/x">本机</a>'
      + '<a href="http://192.168.100.129:3000/">内网</a>'
      + '<a href="https://arxiv.org/abs/2401.0000">论文一</a>'
      + '<a href="https://arxiv.org/abs/2402.0000">论文二</a>'
      + '<a href="https://www.rfc-editor.org/rfc/rfc9110">规范</a>'
      + card([{ path: 'a.md', added: 5, deleted: 2 }, { path: 'b.py', added: 3, deleted: 0 }], { added: 8, deleted: 2 }).outerHTML)
    turn('<div data-variant="write" data-tool="write"><a class="pFy1Ka_fileLink" href="#">手册.html</a></div>'
      + '<div data-presented-file="true"><button class="kuvljq_cardPreview" title="C:\\ws\\手册.html"></button><span class="kuvljq_fileName">手册.html</span>可离线打开的复习手册</div>')
  })

  await fresh()
  // 1. 空会话：卡片与顶栏开关都不出现
  await page.evaluate(() => window.setSession('session-empty'))
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 0) throw new Error('空会话仍然显示了活动卡片')
  if (await page.locator('.dcu-activity-toggle').count() !== 0) throw new Error('空会话仍然显示了顶栏开关')
  if (await page.evaluate(() => document.body.hasAttribute('data-dcu-activity-open'))) throw new Error('空会话仍然带着让位标记')

  // 回到正式会话再注入内容（关闭记忆按会话 id 记账，后面的断言依赖它是 session-1）。
  await page.evaluate(() => { window.sessionId = 'session-1' })
  await fillConversation()
  await page.waitForTimeout(150)
  // 2. 卡片出现，三段数据正确；顶栏开关嵌在「···」右侧
  const data = await page.evaluate(() => {
    const card = document.querySelector('.dcu-activity')
    const textOf = selector => [...card.querySelectorAll(selector)].map(node => node.textContent)
    return {
      width: Math.round(card.getBoundingClientRect().width),
      statCount: card.querySelector('[data-kind=changes] .dcu-activity-meta')?.textContent,
      rows: textOf('[data-kind=changes] .dcu-activity-name'),
      action: textOf('[data-kind=changes] .dcu-activity-row-action .dcu-activity-name'),
      outputs: textOf('[data-kind=outputs] .dcu-activity-name'),
      sources: textOf('[data-kind=sources] .dcu-activity-name'),
      sourceIcons: card.querySelectorAll('[data-kind=sources] .dcu-activity-icon').length,
      openMark: document.body.hasAttribute('data-dcu-activity-open'),
      pressed: document.querySelector('.dcu-activity-toggle')?.getAttribute('aria-pressed'),
      afterMore: document.querySelector('.host_headerUtilities')?.lastElementChild?.className,
    }
  })
  if (data.width !== 300) throw new Error(`卡片宽度应为 300：${data.width}`)
  if (data.statCount !== '2 个文件 +18 −3') throw new Error(`变更合计错误：${data.statCount}`)
  if (data.rows.join('|') !== 'a.md|b.py|查看变更') throw new Error(`变更行错误：${data.rows.join('|')}`)
  if (data.outputs.join('|') !== '手册.html') throw new Error(`输出段错误（布尔标记应退化到行内容）：${data.outputs.join('|')}`)
  if (data.sources.join('|') !== 'docs.example.net|arxiv.org|arxiv.org|查看全部') throw new Error(`来源没有去重/排除回显、本机与内网：${data.sources.join('|')}`)
  if (data.sourceIcons < 4) throw new Error(`来源行缺链接图标：${data.sourceIcons}`)
  if (!data.openMark || data.pressed !== 'true') throw new Error(`卡片可见时让位标记/开关状态不对：${data.openMark} ${data.pressed}`)
  if (!data.afterMore.includes('dcu-activity-toggle')) throw new Error(`顶栏开关没有嵌在「···」右侧：${data.afterMore}`)
  // 轮次导航条钉在会话区最右：负 margin 补回让位量
  // 让位 padding 是 160ms 过渡，used value 要等收敛再读，否则会抓到中间帧（如 -318）
  const readNavMargin = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-dcu-official-turn-navigator]')).marginRight))
  let navShift = await readNavMargin()
  for (let i = 0; i < 20 && Math.abs(navShift + 324) > 2; i++) {
    await page.waitForTimeout(50)
    navShift = await readNavMargin()
  }
  // used value 稳定后仍有小数抖动，容差比较
  if (Math.abs(navShift + 324) > 2) throw new Error(`导航条没有钉在最右：${navShift}`)
  // 顶栏 Tabler 图标（···/折叠钮）由 host-tabler-icons 观察器负责，不在本 fixture 加载范围内，
  // 断言见 tests/host-tabler-icons.assert.ts，此处不重复。

  // 3. 查看变更：滚动 + 高亮脉冲，1.3s 后属性移除
  await page.locator('[data-kind=changes] .dcu-activity-row-action').click()
  await page.waitForTimeout(400)
  const flashed = await page.evaluate(() => ({
    scrolled: document.getElementById('scroll').scrollTop > 0,
    flash: document.querySelectorAll('[data-dcu-activity-flash]').length,
  }))
  if (!flashed.scrolled || flashed.flash !== 1) throw new Error(`查看变更没有滚动定位/高亮：${JSON.stringify(flashed)}`)
  await page.waitForTimeout(1400)
  if (await page.evaluate(() => document.querySelectorAll('[data-dcu-activity-flash]').length) !== 0) throw new Error('高亮没有按时移除')

  // 4. 查看全部：来源列表展开，按钮换文案
  await page.locator('[data-kind=sources] .dcu-activity-row-action').click()
  await page.waitForTimeout(80)
  const expanded = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('[data-kind=sources] .dcu-activity-name')].map(n => n.textContent).length,
    label: document.querySelector('[data-kind=sources] .dcu-activity-row-action .dcu-activity-name')?.textContent,
  }))
  if (expanded.rows !== 5) throw new Error(`查看全部没有展开来源列表：${expanded.rows}`)
  if (expanded.label !== '收起') throw new Error(`展开后按钮没有换成收起：${expanded.label}`)

  // 5. 顶栏开关关闭：按会话记忆，同会话不再出现，再点重新展开
  await page.locator('.dcu-activity-toggle').click()
  await page.waitForTimeout(80)
  const closed = await page.evaluate(() => ({
    card: document.querySelectorAll('.dcu-activity').length,
    open: document.body.hasAttribute('data-dcu-activity-open'),
    stored: localStorage.getItem('dsh.codexUi.activityDismissed'),
    pressed: document.querySelector('.dcu-activity-toggle')?.getAttribute('aria-pressed'),
  }))
  if (closed.card !== 0 || closed.open || closed.pressed !== 'false') throw new Error(`开关收起失败：${JSON.stringify(closed)}`)
  await page.waitForTimeout(220) // 等让位 padding 的 160ms 过渡走完，绝对定位元素的 used margin 才稳定
  const navShiftClosed = parseFloat(await page.evaluate(() => getComputedStyle(document.querySelector('[data-dcu-official-turn-navigator]')).marginRight))
  if (Math.abs(navShiftClosed) > 2) throw new Error(`关闭卡片后导航条没有回位：${navShiftClosed}`)
  if (closed.stored !== 'session-1') throw new Error(`关闭没有按会话写入 localStorage：${JSON.stringify(closed.stored)}`)
  await page.evaluate(() => { document.getElementById('content').innerHTML += '<p>more</p>' })
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 0) throw new Error('同一会话新增内容后卡片又出现了')
  await page.locator('.dcu-activity-toggle').click()
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 1) throw new Error('开关没有重新展开卡片')
  if (await page.evaluate(() => localStorage.getItem('dsh.codexUi.activityDismissed')) !== null) throw new Error('重新展开没有清掉关闭记忆')

  // 6. 换会话：关闭记忆按会话失效，新会话有内容就出现
  await page.evaluate(() => window.setSession('session-2'))
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 0) throw new Error('空内容的新会话不应出现卡片')
  await fillConversation()
  await page.waitForTimeout(150)
  if (await page.locator('.dcu-activity').count() !== 1) throw new Error('换会话后卡片没有重新出现')

  // 7. 暗色主题换肤
  const darkBefore = await page.evaluate(() => getComputedStyle(document.querySelector('.dcu-activity')).backgroundColor)
  await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
  await page.waitForTimeout(60)
  const darkAfter = await page.evaluate(() => getComputedStyle(document.querySelector('.dcu-activity')).backgroundColor)
  if (darkBefore === darkAfter) throw new Error(`暗色主题没有换肤：${darkBefore} → ${darkAfter}`)
  await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))

  // 8. 窄视口隐藏（卡片与开关都撤），恢复后回来
  await page.setViewportSize({ width: 1000, height: 800 })
  await page.waitForTimeout(120)
  const narrow = await page.evaluate(() => ({
    card: document.querySelectorAll('.dcu-activity').length,
    toggle: document.querySelectorAll('.dcu-activity-toggle').length,
    open: document.body.hasAttribute('data-dcu-activity-open'),
  }))
  if (narrow.card !== 0 || narrow.toggle !== 0 || narrow.open) throw new Error(`窄视口没有完全让位：${JSON.stringify(narrow)}`)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 1) throw new Error('恢复视口后卡片没有回来')

  // 9. 卸载恢复：卡片、开关、样式与让位标记全部移除，突变不再重建
  await page.evaluate(() => window.disposeCard())
  await page.waitForTimeout(60)
  const restored = await page.evaluate(() => ({
    card: document.querySelectorAll('.dcu-activity').length,
    toggle: document.querySelectorAll('.dcu-activity-toggle').length,
    style: document.querySelectorAll('style[data-dcu-activity-card-style]').length,
    flash: document.querySelectorAll('[data-dcu-activity-flash]').length,
    open: document.body.hasAttribute('data-dcu-activity-open'),
  }))
  if (restored.card !== 0 || restored.toggle !== 0 || restored.style !== 0 || restored.flash !== 0 || restored.open) throw new Error(`卸载未恢复：${JSON.stringify(restored)}`)
  await page.evaluate(() => { document.getElementById('content').innerHTML += '<p>after dispose</p>' })
  await page.waitForTimeout(120)
  if (await page.locator('.dcu-activity').count() !== 0) throw new Error('卸载后突变仍重建了卡片')

  console.log('活动卡片：Codex 规格（300px/30px 行节奏/深浅两级行）、变更会话累计、输出与来源去重、顶栏开关（···右侧）、内容区让位、滚动定位与高亮、按会话关闭记忆、暗色与窄口隐藏、卸载恢复，全部通过。')
} finally {
  await browser.close()
  await new Promise(resolve => server.close(resolve))
}
