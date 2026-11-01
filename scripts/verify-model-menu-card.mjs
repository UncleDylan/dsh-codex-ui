/** 验证模型菜单换肤：根面板变 Codex 卡片、滑轨沿用宿主档位、选择仍走宿主回调且不关菜单、卸载可恢复。 */
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import ts from 'typescript'

// 去掉 type-only import 与 export：转译成浏览器脚本时不能留下模块语法。
const source = readFileSync('src/client/model-menu-card.ts', 'utf8')
  .replaceAll('export ', '')
  .replace(/^import type .*$/gm, '')
const script = ts.transpileModule(`${source}\nwindow.cardStyle = MODEL_MENU_CARD_STYLE; window.observeCard = observeModelMenuCard; window.readCard = readModelMenuCard;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText

const CSS = `<style>
body{margin:0;--dsw-font-family:system-ui;--dsw-alias-label-primary:#222;--dsw-alias-label-secondary:#8a8a8a;--dsw-alias-label-caption:#98999a;--dsw-alias-state-business-primary:#3a83f7}
body[data-ds-dark-theme]{--dsw-alias-label-primary:#ececec;--dsw-alias-label-secondary:#9b9b9b;--dsw-alias-label-caption:#9d9d9e;background:#111}
*{box-sizing:border-box}
</style>`

/**
 * 宿主模型菜单的最小复刻：触发按钮 + 门户根（data-menu-material / id=model-menu）。
 * 根面板是两个格子；点「推理等级」后宿主渲染档位行，选中后先交给 Host 结算再关菜单——
 * 这条「选完就关」正是卡片要对抗的行为。
 */
const HOST = () => {
  const trigger = document.getElementById('trigger')
  const root = document.getElementById('root')
  let surface = null
  let pane = 'root'
  const call = name => { window.calls.push(name) }
  const syncTitle = () => { trigger.title = `${window.modelName} · ${window.effortName}` }
  const cell = (label, value) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'menuitem')
    button.className = 'host_cell'
    button.innerHTML = `<span class="host_cellLabel">${label}</span><span class="host_cellValue">${value}</span>`
    return button
  }
  const clear = () => { if (surface !== null) surface.querySelectorAll('.host_cell,.host_option,.host_group').forEach(node => node.remove()) }
  const close = () => {
    if (surface === null) return
    if (surface.isConnected) surface.remove()
    surface = null
    trigger.setAttribute('aria-expanded', 'false')
    trigger.removeAttribute('aria-controls')
  }
  const renderRoot = () => {
    if (surface === null) return
    pane = 'root'
    clear()
    syncTitle()
    const modelCell = cell('模型', window.modelName)
    modelCell.onclick = () => {
      call('model')
      pane = 'model'
      clear()
      const list = document.createElement('div')
      list.setAttribute('role', 'menu')
      list.className = 'host_group'
      list.innerHTML = '<button role="menuitemradio" class="host_option"><span class="host_modelName">其他模型</span></button>'
      // 选中另一个模型：宿主把新模型写回触发按钮，然后关掉菜单。
      list.firstElementChild.onclick = () => {
        call('model:其他模型')
        window.modelName = 'DeepSeek-R2'
        syncTitle()
        window.setTimeout(close, window.closeDelay)
      }
      surface.append(list)
    }
    const effortCell = cell('推理等级', window.effortName)
    effortCell.onclick = () => {
      call('effort')
      pane = 'effort'
      clear()
      const paintLevels = () => {
        if (surface === null) return
        window.levels.forEach((label, at) => {
          const row = document.createElement('button')
          row.type = 'button'
          row.setAttribute('role', 'menuitemradio')
          row.setAttribute('aria-checked', String(at === window.currentLevel))
          row.className = 'host_option'
          row.innerHTML = `<span class="host_modelName">${label}</span>`
          row.onclick = () => {
            call(`select:${label}`)
            window.currentLevel = at
            window.effortName = label
            window.setTimeout(close, window.closeDelay)
          }
          row.addEventListener('keydown', event => {
            if (event.key === 'Tab' && event.shiftKey) { event.preventDefault(); renderRoot() }
            if (event.key === 'Escape') { event.preventDefault(); close() }
          })
          surface.append(row)
        })
      }
      if (window.levelDelay) window.setTimeout(paintLevels, window.levelDelay)
      else paintLevels()
    }
    // 适配器没有推理元数据时只渲染「模型」一行。
    if (window.cells === 1) surface.append(modelCell)
    else surface.append(modelCell, effortCell)
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && surface !== null && pane === 'model') close()
  })
  const open = () => {
    if (surface !== null) return
    surface = document.createElement('div')
    surface.id = 'model-menu'
    surface.setAttribute('data-menu-material', 'translucent')
    surface.style.cssText = 'position:fixed;left:40px;bottom:120px;min-width:240px;padding:6px;background:#333'
    surface.innerHTML = '<div aria-hidden="true"></div>'
    document.body.append(surface)
    trigger.setAttribute('aria-expanded', 'true')
    trigger.setAttribute('aria-controls', 'model-menu')
    syncTitle()
    // 宿主打开菜单时会把焦点放到触发按钮上，随后的失焦判定全靠它。
    trigger.focus()
    renderRoot()
  }
  // 宿主的失焦关闭：焦点从触发按钮或菜单里走掉、又没落回这块区域，就关菜单。
  // 宿主是 React 门户，blur 会顺着组件树冒到 composer 根上；这里用文档级监听复刻同一判定。
  document.addEventListener('focusout', event => {
    if (surface === null) return
    if (!(root.contains(event.target) || surface.contains(event.target))) return
    const next = event.relatedTarget
    if (next instanceof Node && (root.contains(next) || surface.contains(next))) return
    close()
  })
  trigger.onclick = () => { if (surface !== null) close(); else open() }
  // 宿主目录结算成功后会把新档位写回根面板（React 重渲染）。
  const setEffort = label => {
    window.effortName = label
    if (surface !== null) renderRoot()
  }
  return { open, close, isOpen: () => surface !== null, surface: () => surface, renderRoot, setEffort }
}

const browser = await chromium.launch({ headless: true })
/** 把 `rgb()` / `color(srgb …)` 统一成 0–255 的三通道。 */
const channels = value => {
  const numbers = value.match(/[\d.]+/g)?.map(Number) ?? []
  return value.startsWith('color(') ? numbers.slice(0, 3).map(part => Math.round(part * 255)) : numbers.slice(0, 3)
}
/** 通道和：值越小颜色越深。 */
const darkness = value => channels(value).reduce((sum, part) => sum + part, 0)
let realm = 0
try {
  const page = await browser.newPage()
  page.on('pageerror', error => { console.error('页面异常：', error.message) })
  /**
   * 每个场景换一个真新文档：`setContent` 会复用同一个 window，
   * 上一次场景缓存的档位（模块级 Map）会污染下一次「首次打开」。
   */
  const freshContent = async html => {
    await page.goto(`about:blank?realm=${++realm}`)
    await page.setContent(html)
  }
  const scenario = async (config = {}) => {
    const { dark = false, model = 'DeepSeek-V3', effort = '中', levels = ['低', '中', '高'], level = 1, levelDelay = 0, cells = 2, closeDelay = 30 } = config
    await page.setViewportSize({ width: 1280, height: 800 })
    await freshContent(`${CSS}<div id="root"><button id="trigger" aria-haspopup="menu" aria-expanded="false">模型</button></div>`)
    await page.addScriptTag({ content: script })
    await page.addStyleTag({ content: await page.evaluate(() => window.cardStyle) })
    await page.evaluate(options => {
      document.body.toggleAttribute('data-ds-dark-theme', options.dark)
      window.levels = options.levels
      window.modelName = options.model
      window.effortName = options.effort
      window.currentLevel = options.level
      window.levelDelay = options.levelDelay
      window.cells = options.cells
      window.closeDelay = options.closeDelay
      window.calls = []
      if (options.bridge) {
        // 假的宿主目录服务：档位表、当前下标、提交以后的回调。
        window.efforts = { levels: options.levels.map(label => ({ label })), index: options.level, busy: false, calls: [], reject: false }
        window.disposeCard = window.observeCard({
          close: '关闭',
          efforts: {
            read: () => ({ levels: window.efforts.levels, index: window.efforts.index, busy: window.efforts.busy }),
            select: async index => {
              window.efforts.calls.push(index)
              if (window.efforts.reject) return false
              window.efforts.index = index
              window.host.setEffort(window.efforts.levels[index].label)
              return true
            },
          },
        })
        return
      }
      window.disposeCard = window.observeCard({ close: '关闭' })
    }, { dark, model, effort, levels, level, levelDelay, cells, closeDelay, bridge: config.bridge === true })
    await page.evaluate(source => { window.host = (0, eval)(`(${source})`)() }, HOST.toString())
  }
  const geometry = () => page.evaluate(() => {
    const surface = document.querySelector('[data-menu-material]')
    const card = surface?.querySelector('.dcu-model-card')
    if (card === undefined || card === null) return null
    const box = node => node.getBoundingClientRect()
    const cardBox = box(card)
    const track = card.querySelector('.dcu-model-card-track')
    const rest = card.querySelector('.dcu-model-card-rest')
    const thumb = card.querySelector('.dcu-model-card-thumb')
    const dots = [...card.querySelectorAll('.dcu-model-card-dot')]
    const activeDot = dots.findIndex(node => node.hasAttribute('data-active'))
    const effort = card.querySelector('.dcu-model-card-effort')
    const model = card.querySelector('.dcu-model-card-model')
    const center = node => { const rect = box(node); return (rect.left + rect.right) / 2 }
    return {
      surfaceRadius: getComputedStyle(surface).borderRadius,
      surfaceBackground: getComputedStyle(surface).backgroundColor,
      nativeHidden: [...surface.children].filter(node => node !== card).every(node => getComputedStyle(node).display === 'none'),
      name: card.querySelector('.dcu-model-card-name').textContent,
      effort: effort.textContent,
      effortColor: getComputedStyle(effort).color,
      animation: getComputedStyle(card).animationName,
      quiet: card.hasAttribute('data-quiet'),
      aria: card.getAttribute('aria-label'),
      ticks: dots.map(node => node.title),
      past: dots.map(node => node.hasAttribute('data-past')),
      max: card.querySelector('.dcu-model-card-range')?.max,
      value: card.querySelector('.dcu-model-card-range')?.value,
      valuetext: card.querySelector('.dcu-model-card-range')?.getAttribute('aria-valuetext'),
      trackHeight: Math.round(box(track).height),
      trackRadius: getComputedStyle(track).borderRadius,
      gradient: getComputedStyle(track).backgroundImage,
      restLeft: Math.round(box(rest).left),
      trackWidth: Math.round(box(track).width),
      thumbCenter: Math.round(center(thumb)),
      dotCenter: activeDot < 0 ? null : Math.round(center(dots[activeDot])),
      cardHeight: Math.round(cardBox.height),
      centered: {
        effort: Math.round(center(effort) - (cardBox.left + cardBox.right) / 2),
        model: Math.round(center(model) - (cardBox.left + cardBox.right) / 2),
      },
      rows: card.querySelector('.dcu-model-card-ticks') === null,
      surfaceId: surface.id,
    }
  })

  // 深浅两套主题：卡片外观、居中排版、滑轨几何与宿主数据全部对齐。
  for (const dark of [false, true]) {
    await scenario({ dark })
    await page.evaluate(() => window.host.open())
    await page.waitForSelector('.dcu-model-card-range')
    const g = await geometry()
    if (!g.nativeHidden) throw new Error('原生的模型／推理等级两行没有被卡片取代')
    if (g.surfaceRadius !== '20px') throw new Error(`卡片圆角为 ${g.surfaceRadius}`)
    if (g.surfaceBackground !== (dark ? 'rgb(32, 32, 32)' : 'rgb(255, 255, 255)')) throw new Error(`卡片底色为 ${g.surfaceBackground}`)
    if (g.name !== 'DeepSeek-V3' || g.effort !== '中') throw new Error(`标题显示的模型／强度为 ${g.name} / ${g.effort}`)
    // 颜色是 color-mix 出来的色带值，不固定成某一个 rgb，只要求是蓝色且落在浅蓝↔深蓝之间。
    const [red, green, blue] = channels(g.effortColor)
    if (!(blue > green && green > red)) throw new Error(`强度文字不是蓝色：${g.effortColor}`)
    if (red < 0x1f || red > 0x75) throw new Error(`强度文字超出了色带范围：${g.effortColor}`)
    if (g.aria !== 'DeepSeek-V3 · 中') throw new Error(`卡片无障碍名称为 ${g.aria}`)
    // 档位文字行已经取消，档位只体现在强调色标题与轨道圆点上。
    if (!g.rows) throw new Error('卡片下面仍然排着一行档位文字')
    if (g.ticks.join('/') !== '低/中/高') throw new Error(`滑轨档位不是宿主公布的集合：${g.ticks.join('/')}`)
    if (g.past.join() !== 'true,true,false') throw new Error(`圆点明暗没有跟随当前档位：${g.past.join()}`)
    if (g.max !== '2' || g.value !== '1' || g.valuetext !== '中') throw new Error('滑轨没有停在宿主当前档位')
    if (g.trackHeight !== 30 || g.trackRadius !== '999px') throw new Error(`轨道为 ${g.trackHeight}px / ${g.trackRadius}`)
    // 轨道本身就是由浅到深的色带，灰带从滑块中心盖到右端：蓝条与滑块之间不能有缝。
    if (!g.gradient.includes('linear-gradient')) throw new Error(`轨道没有由浅入深的色带：${g.gradient}`)
    if (Math.abs(g.thumbCenter - g.dotCenter) > 1) throw new Error(`圆点没有对齐滑块：${g.dotCenter} / ${g.thumbCenter}`)
    if (Math.abs(g.restLeft - g.thumbCenter) > 1) throw new Error(`灰带没有对齐滑块中心：${g.restLeft} / ${g.thumbCenter}`)
    if (Math.abs(g.centered.effort) > 1 || Math.abs(g.centered.model) > 1) throw new Error(`卡片标题没有居中：${JSON.stringify(g.centered)}`)
    // 首次打开是卡片第一次出现，要播入场动画；补滑轨只往同一张卡片里填内容（见后面的同元素断言）。
    if (g.animation !== 'dcu-model-card-in' || g.quiet) throw new Error(`首次打开没有入场动画：${g.animation} quiet=${g.quiet}`)
    // 拖动：先预览（只改文字与轨道），松手才提交，提交仍走宿主的推理等级行。
    const range = page.locator('.dcu-model-card-range')
    // 真拖动：按下后指针划到最右。拖动的视觉由 pointermove 的连续位置驱动（分数比例），
    // 而不是浏览器按 step 离散跳的 value——否则滑块会在档位之间瞬移。
    const trackRect = await page.locator('.dcu-model-card-track').boundingBox()
    await range.evaluate((node, { press, target, y }) => {
      node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: press, clientY: y }))
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: target, clientY: y }))
    }, { press: trackRect.x + 20, target: trackRect.x + trackRect.width - 2, y: trackRect.y + trackRect.height / 2 })
    if (await page.locator('.dcu-model-card-effort').textContent() !== '高') throw new Error('拖动预览没有更新强度文字')
    const dragPos = Number(await page.evaluate(() => document.querySelector('.dcu-model-card').style.getPropertyValue('--dcu-pos')))
    if (dragPos < 0.9) throw new Error(`拖动时滑块没有连续跟到指针处：${dragPos}`)
    if (await page.evaluate(() => window.calls.some(call => call.startsWith('select:')))) throw new Error('拖动途中就提交了选择')
    // 打个记号，等下要确认弹层里的卡片确实被宿主关掉后重新建了出来。
    await page.evaluate(() => { document.querySelector('.dcu-model-card').dataset.mark = 'old' })
    await range.evaluate(node => { node.value = '2'; node.dispatchEvent(new Event('change', { bubbles: true })) })
    await page.waitForFunction(() => window.calls.includes('select:高'))
    // 宿主选完会关菜单；卡片要留在原地，所以菜单必须被重新点开且档位已更新。
    await page.waitForFunction(() => {
      const card = document.querySelector('.dcu-model-card')
      return window.host.isOpen() && card !== null && card.dataset.mark !== 'old' && card.querySelector('.dcu-model-card-effort')?.textContent === '高'
    })
    const after = await geometry()
    if (after.value !== '2' || after.past.join() !== 'true,true,true') throw new Error('重新打开后滑轨没有停在新档位')
    if (!after.quiet) {
      const debug = await page.evaluate(() => ({
        cards: document.querySelectorAll('.dcu-model-card').length,
        surfaces: document.querySelectorAll('[data-menu-material]').length,
        animation: getComputedStyle(document.querySelector('.dcu-model-card')).animationName,
        calls: window.calls.join(),
      }))
      throw new Error(`选完档位重新打开时又播了一次入场动画：${JSON.stringify(debug)}`)
    }
    if (process.argv.includes('--screenshot')) await page.screenshot({ path: join(tmpdir(), dark ? 'dcu-model-card-check-dark.png' : 'dcu-model-card-check.png') })
    await page.evaluate(() => window.disposeCard())
  }
  // 点轨道：停在当前档位不该惊动宿主；点其它位置走宿主回调，且只提交一次。
  // 档位直接来自宿主目录服务：第一次打开就是完整卡片（不探面板），切档位不关菜单、卡片不重建。
  await scenario({ bridge: true, effort: '中' })
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.waitForTimeout(250)
  const direct = await page.evaluate(() => ({
    probes: window.calls.filter(call => call === 'effort').length,
    levels: [...document.querySelectorAll('.dcu-model-card-dot')].map(node => node.title).join('/'),
    position: document.querySelector('.dcu-model-card').style.getPropertyValue('--dcu-pos'),
    color: getComputedStyle(document.querySelector('.dcu-model-card-effort')).color,
    thumb: getComputedStyle(document.querySelector('.dcu-model-card-thumb')).left,
  }))
  if (direct.probes !== 0) throw new Error('档位来自服务时仍然去探测宿主面板了')
  if (direct.levels !== '低/中/高') throw new Error(`服务给的档位没有铺到滑轨上：${direct.levels}`)
  if (direct.position !== '0.5') throw new Error(`滑轨没有停在服务给的档位：${direct.position}`)
  await page.evaluate(() => { document.querySelector('.dcu-model-card').dataset.mark = 'same' })
  // 系统开了「减少动态效果」也要照样滑：这正是真机上「什么都没生效」的常见原因。
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const trackBox = await page.locator('.dcu-model-card-range').boundingBox()
  const clickAt = ratio => page.locator('.dcu-model-card-range').click({ position: { x: Math.min(trackBox.width - 1, Math.max(1, Math.round(trackBox.width * ratio))), y: Math.round(trackBox.height / 2) } })
  // 真机噪声：宿主随时都在重渲染。按下期间一旦有变动，旧实现会把 input 发布的预览档位趁
  // data-dragging（无补间）瞬时画上，change 就没有滑动过程——回归在此盯住这条跳档路径。
  await page.evaluate(() => {
    const node = document.createElement('span')
    document.body.append(node)
    window.noiseTimer = window.setInterval(() => { node.textContent = String(performance.now()) }, 15)
  })
  await clickAt(1)
  await page.waitForFunction(() => window.efforts.calls.length === 1)
  // 滑块要有「滑过去再吸住」的过程：中途位置既不是起点也不是终点。
  await page.waitForTimeout(70)
  const slideState = await page.locator('.dcu-model-card-thumb').evaluate(node => ({
    left: getComputedStyle(node).left,
    animations: node.getAnimations().length,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    dragging: node.closest('.dcu-model-card')?.hasAttribute('data-dragging'),
  }))
  const midThumb = slideState.left
  if (midThumb === direct.thumb) throw new Error(`滑块没有滑动过程：${JSON.stringify(slideState)} 起点 ${direct.thumb}`)
  await page.waitForTimeout(250)
  const settledThumb = await page.locator('.dcu-model-card-thumb').evaluate(node => getComputedStyle(node).left)
  if (settledThumb === midThumb) throw new Error(`滑块停在中途，没有落到目标档位：${JSON.stringify({ ...slideState, midThumb, settledThumb })}`)
  if (settledThumb === direct.thumb) throw new Error('滑块没有离开起始档位')
  await page.evaluate(() => window.clearInterval(window.noiseTimer))
  const switched = await page.evaluate(() => ({
    open: window.host.isOpen(),
    cards: document.querySelectorAll('.dcu-model-card').length,
    same: document.querySelector('.dcu-model-card')?.dataset.mark,
    effort: document.querySelector('.dcu-model-card-effort').textContent,
    position: document.querySelector('.dcu-model-card').style.getPropertyValue('--dcu-pos'),
    rows: window.calls.filter(call => call.startsWith('select:')).length,
    color: getComputedStyle(document.querySelector('.dcu-model-card-effort')).color,
  }))
  if (!switched.open) throw new Error('走服务提交后菜单被关掉了')
  if (switched.rows !== 0) throw new Error('走服务提交时仍点了宿主菜单行')
  if (switched.same !== 'same' || switched.cards !== 1) throw new Error('切档位时卡片被重建了（补间会断）')
  if (switched.effort !== '高' || switched.position !== '1') throw new Error(`切档位后滑轨没有到新档位：${switched.effort} / ${switched.position}`)
  // 最高档：流光层点亮、白点退场（Codex 同款）。
  const max = await page.evaluate(() => ({
    maxed: document.querySelector('.dcu-model-card').hasAttribute('data-max'),
    shine: getComputedStyle(document.querySelector('.dcu-model-card-shine')).opacity,
    shineAnimated: getComputedStyle(document.querySelector('.dcu-model-card-shine'), '::after').animationName,
    dot: getComputedStyle(document.querySelector('.dcu-model-card-dot'), '::before').opacity,
  }))
  if (!max.maxed) throw new Error('最高档没有点亮 data-max')
  if (max.shine !== '1' || max.shineAnimated === 'none') throw new Error(`最高档没有显示流光层：${JSON.stringify(max)}`)
  if (max.dot !== '0') throw new Error(`最高档没有隐藏档位白点：${max.dot}`)
  // 档位越高，强度文字越深。
  if (!(darkness(switched.color) < darkness(direct.color))) throw new Error(`强度文字没有随档位加深：${direct.color} → ${switched.color}`)
  await page.emulateMedia({ reducedMotion: null })
  // 提交失败：滑轨退回宿主给的档位，菜单也不关。
  await page.evaluate(() => { window.efforts.reject = true })
  await clickAt(0)
  await page.waitForFunction(() => window.efforts.calls.length === 2)
  await page.waitForFunction(() => document.querySelector('.dcu-model-card-effort')?.textContent === '高')
  if (!await page.evaluate(() => window.host.isOpen())) throw new Error('提交失败后菜单被关掉了')
  await page.evaluate(() => window.disposeCard())
  // 点卡片空白处（非按钮）不能关菜单：焦点要落在菜单里，否则宿主按失焦关菜单。
  // 宿主重渲染的中间帧没有格子时，卡片不能被拆掉重建（拆了补间和状态都没了）。
  await scenario({ bridge: true })
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.evaluate(() => {
    document.querySelector('.dcu-model-card').dataset.mark = 'same'
    document.querySelectorAll('[data-menu-material] .host_cell').forEach(node => node.remove())
  })
  await page.waitForTimeout(60)
  await page.evaluate(() => window.host.renderRoot())
  await page.waitForTimeout(80)
  const survived = await page.evaluate(() => ({
    cards: document.querySelectorAll('.dcu-model-card').length,
    same: document.querySelector('.dcu-model-card')?.dataset.mark,
  }))
  if (survived.cards !== 1 || survived.same !== 'same') throw new Error(`宿主重渲染的中间帧把卡片拆了：${JSON.stringify(survived)}`)
  await page.evaluate(() => window.disposeCard())
  await scenario({})
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.locator('.dcu-model-card').click({ position: { x: 100, y: 7 } })
  await page.waitForTimeout(150)
  if (!await page.evaluate(() => window.host.isOpen())) throw new Error('点卡片空白处把菜单关掉了')
  if (await page.locator('.dcu-model-card').count() !== 1) throw new Error('点卡片空白处后卡片消失了')
  // 点菜单外面仍然要关。
  await page.mouse.click(900, 700)
  await page.waitForFunction(() => !window.host.isOpen())
  if (await page.locator('.dcu-model-card').count()) throw new Error('点菜单外面后卡片还留着')
  await scenario({})
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.evaluate(() => { window.calls = [] })
  const track = await page.locator('.dcu-model-card-range').boundingBox()
  const onTrack = ratio => ({ x: Math.max(1, Math.round(track.width * ratio)), y: Math.round(track.height / 2) })
  await page.locator('.dcu-model-card-range').click({ position: onTrack(0.5) })
  await page.waitForTimeout(200)
  if (await page.evaluate(() => window.calls.length !== 0)) throw new Error('点当前档位仍调用了宿主')
  if (!await page.evaluate(() => window.host.isOpen())) throw new Error('点当前档位把菜单关掉了')
  await page.locator('.dcu-model-card-range').click({ position: onTrack(0) })
  await page.waitForFunction(() => window.calls.includes('select:低'))
  await page.waitForTimeout(400)
  if (await page.evaluate(() => window.calls.filter(call => call.startsWith('select:')).length) !== 1) throw new Error('点轨道重复提交了选择')
  if (!await page.evaluate(() => window.host.isOpen())) throw new Error('点轨道后菜单没有保持打开')
  // 停在最小档：整条填充收掉（蓝色一点都不能露），滑块左边缘贴着轨道左边缘。
  const low = await page.evaluate(() => {
    const card = document.querySelector('.dcu-model-card')
    const track = card.querySelector('.dcu-model-card-track')
    const box = node => node.getBoundingClientRect()
    return {
      off: card.hasAttribute('data-off') && getComputedStyle(track).backgroundImage === 'none',
      trackLeft: Math.round(box(track).left),
      thumbLeft: Math.round(box(card.querySelector('.dcu-model-card-thumb')).left),
      past: [...card.querySelectorAll('.dcu-model-card-dot')].map(node => node.hasAttribute('data-past')).join(),
      value: card.querySelector('.dcu-model-card-range').value,
    }
  })
  if (low.value !== '0' || !low.off) throw new Error(`最小档仍露着蓝色：${JSON.stringify(low)}`)
  // 退回非最高档：流光层淡出、白点回来。
  const lowShine = await page.evaluate(() => ({
    maxed: document.querySelector('.dcu-model-card').hasAttribute('data-max'),
    shine: getComputedStyle(document.querySelector('.dcu-model-card-shine')).opacity,
    dot: getComputedStyle(document.querySelector('.dcu-model-card-dot'), '::before').opacity,
  }))
  if (lowShine.maxed || lowShine.shine !== '0' || lowShine.dot !== '1') throw new Error(`非最高档流光层没有退场：${JSON.stringify(lowShine)}`)
  if (Math.abs(low.thumbLeft - low.trackLeft) > 1) throw new Error(`最小档滑块没有贴住轨道左缘：${JSON.stringify(low)}`)
  if (low.past !== 'true,false,false') throw new Error(`最小档圆点状态异常：${low.past}`)
  if (process.argv.includes('--screenshot')) await page.screenshot({ path: join(tmpdir(), 'dcu-model-card-off.png') })
  // 关闭按钮：走宿主的「再点一次触发按钮」。
  await page.getByRole('button', { name: '关闭' }).click()
  await page.waitForFunction(() => !window.host.isOpen())
  if (await page.locator('.dcu-model-card').count()) throw new Error('关闭菜单后卡片还留着')
  // 模型名是下钻入口：交还宿主并打开原生模型列表；选完模型菜单要留着。
  await scenario({})
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.evaluate(() => { window.calls = [] })
  await page.locator('.dcu-model-card-model').click()
  await page.waitForSelector('[role=menu] [role=menuitemradio]')
  if (await page.evaluate(() => window.calls.join()) !== 'model') throw new Error('模型下钻没有走宿主回调')
  if (await page.locator('.dcu-model-card').count()) throw new Error('下钻后卡片仍覆盖模型列表')
  // 选中另一个模型：宿主会关掉菜单，卡片要重新出现并换上新模型名。
  await page.locator('[role=menu] [role=menuitemradio]').first().click()
  await page.waitForFunction(() => {
    const name = document.querySelector('.dcu-model-card-name')
    return window.host.isOpen() && name !== null && name.textContent === 'DeepSeek-R2'
  })
  // 下钻后手动关掉（Escape）不能被自动点开。
  await page.locator('.dcu-model-card-model').click()
  await page.waitForSelector('[role=menu] [role=menuitemradio]')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.host.isOpen())
  await page.waitForTimeout(300)
  if (await page.evaluate(() => window.host.isOpen())) throw new Error('手动关闭后菜单又被自动点开了')
  await page.evaluate(() => window.disposeCard())
  // 适配器没有推理元数据（只有一个格子）时保留宿主原生菜单，不硬造滑轨。
  await scenario({ cells: 1, effort: '' })
  await page.evaluate(() => window.host.open())
  await page.waitForTimeout(200)
  if (await page.locator('.dcu-model-card').count()) throw new Error('没有推理元数据时仍改造成了卡片')
  if (await page.locator('[data-dcu-model-card]').count()) throw new Error('没有推理元数据时残留了卡片标记')
  if (!await page.evaluate(() => window.host.isOpen())) throw new Error('没有推理元数据时菜单被误关')
  await page.evaluate(() => window.disposeCard())
  // 首次打开：档位读回来之前先立卡片头部（入场动画），读到后原地补滑轨且高度不变。
  await scenario({ levelDelay: 200 })
  await page.evaluate(() => {
    window.phases = []
    window.head = null
    window.headHeight = 0
    window.sliderHeight = 0
    new MutationObserver(() => {
      const card = document.querySelector('.dcu-model-card')
      const phase = card === null ? 'none' : card.querySelector('.dcu-model-card-range') === null ? 'head' : 'slider'
      if (window.phases.at(-1) === phase) return
      window.phases.push(phase)
      const height = card === null ? 0 : card.offsetHeight
      if (phase === 'head') {
        window.headHeight = height
        // 打个记号：补滑轨时这张卡片必须还是同一个元素，不能整块重画。
        card.dataset.probe = 'keeper'
        window.head = {
          name: card.querySelector('.dcu-model-card-name')?.textContent,
          effort: card.querySelector('.dcu-model-card-effort')?.textContent,
          animation: getComputedStyle(card).animationName,
          idle: card.querySelector('.dcu-model-card-slider')?.hasAttribute('data-idle'),
          marks: document.querySelectorAll('[data-dcu-model-card]').length,
        }
      }
      if (phase === 'slider') window.sliderHeight = height
    }).observe(document.body, { childList: true, subtree: true })
  })
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card .dcu-model-card-name')
  await page.waitForSelector('.dcu-model-card-range')
  await page.waitForTimeout(150)
  const phases = await page.evaluate(() => ({
    phases: window.phases.join('>'),
    head: window.head,
    headHeight: window.headHeight,
    sliderHeight: window.sliderHeight,
    quiet: document.querySelector('.dcu-model-card').hasAttribute('data-quiet'),
    keeper: document.querySelector('.dcu-model-card')?.dataset.probe,
  }))
  if (phases.head === null) throw new Error(`档位读回来之前没有先画卡片头部：${phases.phases}`)
  if (phases.head.name !== 'DeepSeek-V3' || phases.head.effort !== '中') throw new Error(`档位未读到时头部显示 ${phases.head.name} / ${phases.head.effort}`)
  if (!phases.head.idle) throw new Error('档位没读到时滑轨没有留成占位形态')
  if (phases.head.marks !== 1) throw new Error('档位未读到时卡片没有占住面板')
  if (phases.head.animation !== 'dcu-model-card-in') throw new Error(`卡片首次出现没有入场动画：${phases.head.animation}`)
  if (phases.phases.replace(/^none>/, '') !== 'head>slider') throw new Error(`卡片形态应当只有「头部→滑轨」两段：${phases.phases}`)
  if (phases.headHeight !== phases.sliderHeight) throw new Error(`补滑轨时卡片高度变了：${phases.headHeight} → ${phases.sliderHeight}`)
  if (phases.keeper !== 'keeper') throw new Error('补滑轨时整块重画了卡片')
  await page.evaluate(() => window.disposeCard())
  // 卸载后恢复宿主原样。
  await scenario({})
  await page.evaluate(() => window.host.open())
  await page.waitForSelector('.dcu-model-card-range')
  await page.evaluate(() => window.disposeCard())
  const restored = await page.evaluate(() => ({
    card: document.querySelectorAll('.dcu-model-card').length,
    marks: document.querySelectorAll('[data-dcu-model-card]').length,
    visible: [...document.querySelectorAll('[data-menu-material] > *')].every(node => getComputedStyle(node).display !== 'none'),
    style: document.querySelectorAll('style[data-dcu-model-card-style]').length,
  }))
  if (restored.card !== 0 || restored.marks !== 0 || !restored.visible || restored.style !== 0) throw new Error(`卸载未恢复宿主菜单：${JSON.stringify(restored)}`)
  console.log('模型卡片：Codex 造型与居中排版、滑轨沿用宿主档位、选择走宿主回调且不关菜单、无推理元数据回退原生、卸载恢复，全部通过。')
} finally {
  await browser.close()
}
