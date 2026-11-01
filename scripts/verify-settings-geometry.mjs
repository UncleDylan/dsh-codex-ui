/** 真实浏览器回归：桌面标题栏安全区与模型 Pro 设置页宽度。 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const source = readFileSync(new URL('../src/client/settings-page-styles.ts', import.meta.url), 'utf8')
const styles = source.slice(source.indexOf('`') + 1, source.lastIndexOf('`'))
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' })
  const navItems = Array.from({ length: 22 }, (_, index) => `<button class="dcu-settings-link"><span>设置项 ${index + 1}</span></button>`).join('')
  await page.setContent(`<html data-platform="darwin"><head><style>html[data-platform=darwin]{--dsh-frame-top-clearance:48px}
    html[data-windows-titlebar]{--dsh-windows-titlebar-height:40px;--dsh-frame-top-clearance:var(--dsh-windows-titlebar-height)}
    ${styles}</style></head><body>
    <div class="dcu-settings-page"><nav class="dcu-settings-nav"><button class="dcu-settings-back">返回应用</button>
    <label class="dcu-settings-search"><input type="search" placeholder="搜索设置"></label>
    <div class="dcu-settings-scroll"><div class="dcu-settings-groups">${navItems}</div></div></nav>
    <main class="dcu-settings-main"><div class="dcu-settings-inner" data-settings-section="general"></div></main></div>
  </body></html>`)

  const top = () => page.locator('.dcu-settings-back').evaluate(element => element.getBoundingClientRect().top)
  // 返回按钮 = 标题栏带（48px）+ 导航列自身 18px 顶距；带由 grid 第一行铺出，内容整体下移。
  assert.equal(await top(), 66, 'macOS 普通窗口的返回按钮必须低于原生标题栏')
  const band = await page.locator('.dcu-settings-page').evaluate(element => {
    const style = getComputedStyle(element, '::before')
    return { height: parseFloat(style.height), background: style.backgroundColor, drag: style.webkitAppRegion }
  })
  assert.equal(band.height, 48, '标题栏带必须是 grid 第一行并占满安全区高度')
  assert.equal(band.background, 'rgb(243, 243, 243)', '标题栏带必须与窄轨同色，顶栏+窄轨构成一整块 frame')
  assert.equal(band.drag, 'drag', '标题栏带必须保持窗口拖动区')
  // 左右上角圆角落在 frame 内部：导航列左上 16px、主面板右上 16px；主面板左上与导航列直角拼接。
  const corners = await page.evaluate(() => {
    const nav = getComputedStyle(document.querySelector('.dcu-settings-nav'))
    const main = getComputedStyle(document.querySelector('.dcu-settings-main'))
    return { navTL: nav.borderTopLeftRadius, mainTR: main.borderTopRightRadius, mainTL: main.borderTopLeftRadius, shadow: main.boxShadow }
  })
  assert.equal(corners.navTL, '16px', '导航列左上角必须是 16px 圆角（首帧起就可见，不再被标题栏盖掉）')
  assert.equal(corners.mainTR, '16px', '主面板右上角必须是 16px 圆角')
  assert.equal(corners.mainTL, '0px', '主面板左上角必须与导航列直角拼接，不得 carve 出缝')
  assert.equal(corners.shadow, 'rgb(243, 243, 243) 1px 0px 0px 0px inset', '导航列与主面板的交界必须是 1px frame 色直线，不得用模糊投影（会叠出 #D8D8D8 竖缝）')
  await page.locator('html').evaluate(element => { element.setAttribute('data-fullscreen', '') })
  assert.equal(await top(), 18, 'macOS 全屏时不得额外留标题栏空白')
  await page.locator('html').evaluate(element => { element.removeAttribute('data-fullscreen'); element.setAttribute('data-platform', 'win32'); element.setAttribute('data-windows-titlebar', '') })
  assert.equal(await top(), 58, 'Windows 标题栏下返回按钮必须让出原生窗口按钮')
  await page.locator('html').evaluate(element => { element.removeAttribute('data-windows-titlebar') })
  assert.equal(await top(), 18, '没有标题栏的桌面宿主不得受安全区影响')
  await page.locator('html').evaluate(element => { element.removeAttribute('data-platform') })
  assert.equal(await top(), 18, '普通浏览器不得受安全区影响')

  // 导航列折叠（data-narrow）：列宽收到 0，主面板左上角从直角过渡到 16px（与主页折叠态收尾一致）。
  const narrow = await page.locator('.dcu-settings-page').evaluate(element => {
    element.setAttribute('data-narrow', '')
    const main = getComputedStyle(document.querySelector('.dcu-settings-main'))
    const navWidth = getComputedStyle(element).gridTemplateColumns.split(' ')[1]
    return { mainTL: main.borderTopLeftRadius, navTrack: navWidth }
  })
  assert.equal(narrow.navTrack, '0px', '折叠后导航列轨道必须收到 0')
  assert.equal(narrow.mainTL, '16px', '折叠后主面板左上角必须恢复 16px 圆角（减少动态效果时立即到位）')
  await page.locator('.dcu-settings-page').evaluate(element => element.removeAttribute('data-narrow'))

  const inner = page.locator('.dcu-settings-inner')
  const main = page.locator('.dcu-settings-main')
  assert.equal(await inner.evaluate(element => element.getBoundingClientRect().width), 864, '常规设置页继续保持易读宽度')
  await inner.evaluate(element => { element.dataset.settingsSection = 'dsh-model-pro' })
  assert.equal(await inner.evaluate(element => element.getBoundingClientRect().width), await main.evaluate(element => element.getBoundingClientRect().width), '模型 Pro 设置页需随主栏伸展')
  await page.setViewportSize({ width: 800, height: 900 })
  const innerRect = await inner.evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right }))
  const mainRect = await main.evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right }))
  assert.ok(innerRect.left >= mainRect.left && innerRect.right <= mainRect.right, '窄窗口时模型 Pro 内容不得越过主栏')
  await page.locator('html').evaluate(element => { element.setAttribute('data-platform', 'darwin') })
  await page.setViewportSize({ width: 520, height: 700 })
  const navBottom = await page.locator('.dcu-settings-nav').evaluate(element => element.getBoundingClientRect().bottom)
  const backBottom = await page.locator('.dcu-settings-back').evaluate(element => element.getBoundingClientRect().bottom)
  const searchBottom = await page.locator('.dcu-settings-search').evaluate(element => element.getBoundingClientRect().bottom)
  assert.ok(await top() >= 48 && backBottom <= navBottom && searchBottom <= navBottom, '宿主最小宽度下返回与搜索都必须留在导航区内')
  await page.locator('.dcu-settings-back').click()
  assert.equal(await page.evaluate(() => document.activeElement?.className), 'dcu-settings-back', '宿主最小宽度下返回按钮必须可点击')
  await page.locator('.dcu-settings-search input').click()
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'INPUT', '宿主最小宽度下搜索框必须可点击')

  // 左栏分区列表较长时必须只滚列表：返回与搜索常驻在导航顶部。
  await page.setViewportSize({ width: 900, height: 420 })
  const nav = page.locator('.dcu-settings-nav')
  const scroll = page.locator('.dcu-settings-scroll')
  const before = await page.evaluate(() => ({
    back: document.querySelector('.dcu-settings-back')?.getBoundingClientRect().top,
    search: document.querySelector('.dcu-settings-search')?.getBoundingClientRect().bottom,
    navScroll: document.querySelector('.dcu-settings-nav')?.scrollTop,
  }))
  const scrolled = await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; return element.scrollTop })
  assert.ok(scrolled > 0, '分区列表超长时滚动容器必须可滚动')
  const after = await page.evaluate(() => ({
    back: document.querySelector('.dcu-settings-back')?.getBoundingClientRect().top,
    search: document.querySelector('.dcu-settings-search')?.getBoundingClientRect().bottom,
    navScroll: document.querySelector('.dcu-settings-nav')?.scrollTop,
    navScrollable: (document.querySelector('.dcu-settings-nav')?.scrollHeight ?? 0) - (document.querySelector('.dcu-settings-nav')?.clientHeight ?? 0),
    firstLinkTop: document.querySelector('.dcu-settings-link')?.getBoundingClientRect().top,
    searchBottom: document.querySelector('.dcu-settings-search')?.getBoundingClientRect().bottom,
  }))
  assert.ok(Math.abs(after.back - before.back) < 0.5, '滚动分区列表时返回按钮必须固定不动')
  assert.ok(Math.abs(after.search - before.search) < 0.5, '滚动分区列表时搜索框必须固定不动')
  assert.equal(after.navScroll, 0, '导航列本身不得成为滚动容器')
  assert.ok(after.navScrollable <= 0, '导航列不得有可滚动的溢出内容')
  assert.ok((after.firstLinkTop ?? 0) < (after.searchBottom ?? 0), '分区列表必须真的滚动到搜索框下方')
  const navBox = await nav.evaluate(element => ({ top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom }))
  assert.ok((after.back ?? 0) >= navBox.top && (after.search ?? 0) <= navBox.bottom, '滚动后返回与搜索仍必须留在左栏内')

  await page.setViewportSize({ width: 900, height: 140 })
  const tinyNav = page.locator('.dcu-settings-nav')
  const tinyScroll = page.locator('.dcu-settings-scroll')
  const tinyScrollTop = await tinyNav.evaluate(element => { element.scrollTop = element.scrollHeight; return element.scrollTop })
  assert.ok(tinyScrollTop > 0, '极矮窗口下导航列必须可滚动，保证设置分区仍可访问')
  const tinyLastLinkBottom = await tinyScroll.locator('.dcu-settings-link').last().evaluate(element => element.getBoundingClientRect().bottom)
  const tinyNavBottom = await tinyNav.evaluate(element => element.getBoundingClientRect().bottom)
  assert.ok(tinyLastLinkBottom <= tinyNavBottom + 0.5, '极矮窗口滚动到底后最后一个设置项必须完整进入导航视口')

  console.log('设置页 frame 行结构、左右上角圆角、1px frame 色分界线、折叠圆角过渡与标题栏避让、模型 Pro 响应式宽度与左栏固定头通过')
} finally {
  await browser.close()
}
