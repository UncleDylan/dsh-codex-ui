/** #46/#56 回归：核对桌面平台拖动区域声明；浏览器不能替代 Electron 原生窗口移动验收。 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const sidebar = readFileSync('src/client/CodexSidebar.tsx', 'utf8')
const settings = readFileSync('src/client/settings-page-styles.ts', 'utf8')
const navigation = readFileSync('src/client/DesktopNavigationControls.tsx', 'utf8')
const sidebarStyles = sidebar.match(/const stylesheet = `([\s\S]*?)`/)[1]
const settingsStyles = settings.slice(settings.indexOf('`') + 1, settings.lastIndexOf('`'))
const navigationStyles = navigation.match(/DESKTOP_NAVIGATION_CONTROLS_STYLE = `([\s\S]*?)`/)[1]
// 来自 dsh-web-frontend@0.2.1-rc.2：macOS 靠 data-window-drag 行声明拖动，Windows 靠 frame 顶部
// 伪元素画标题栏拖动条；两者都用 --dsh-frame-top-clearance 公布原生标题栏安全区高度。
const hostStyles = `html[data-platform=darwin]{--dsh-frame-top-clearance:48px}
html[data-windows-titlebar]{--dsh-windows-titlebar-height:40px;--dsh-frame-top-clearance:var(--dsh-windows-titlebar-height)}
:root{--dsw-specific-sidebar-fill:#e6e9ef}
html[data-platform=darwin] [data-window-drag]{-webkit-app-region:drag}
html[data-platform=darwin] body>:not(#root){-webkit-app-region:no-drag}
html[data-platform=darwin] :is(button,input){-webkit-app-region:no-drag}`
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent(`<style>${hostStyles}${sidebarStyles}${settingsStyles}${navigationStyles}
    [data-windows-menu]{position:fixed;top:0;left:var(--dsh-windows-menu-start,48px);height:40px;width:120px}
    </style>
    <div id="root"><aside class="dcu-root" style="width:240px;height:700px"><header class="dcu-head"><button>侧栏按钮</button></header></aside></div>
    <div data-windows-menu><button>应用</button></div>
    <div class="dcu-desktop-navigation"><button aria-label="后退">‹</button><button aria-label="前进">›</button></div>
    <div class="dcu-settings-page"><div class="dcu-desktop-navigation" data-collapse=""><button>‹</button><button>›</button><button>◧</button></div><nav class="dcu-settings-nav"><button class="dcu-settings-back">返回</button><input aria-label="搜索"></nav></div>`)
  const setPlatform = (platform, { fullscreen = false, titlebar = false } = {}) => page.evaluate(({ platform, fullscreen, titlebar }) => {
    const html = document.documentElement
    if (platform === null) delete html.dataset.platform
    else html.dataset.platform = platform
    html.toggleAttribute('data-windows-titlebar', titlebar)
    html.toggleAttribute('data-fullscreen', fullscreen)
  }, { platform, fullscreen, titlebar })
  const read = (selector, pseudo) => page.locator(selector).evaluate((element, pseudo) => ({
    region: getComputedStyle(element).getPropertyValue('app-region'),
    strip: getComputedStyle(element, pseudo).getPropertyValue('app-region'),
    stripBg: getComputedStyle(element, pseudo).backgroundColor,
    stripWidth: getComputedStyle(element, pseudo).width,
    height: getComputedStyle(element, pseudo).height,
    button: getComputedStyle(element.querySelector('button')).getPropertyValue('app-region'),
  }), pseudo)
  const backTop = () => page.locator('.dcu-settings-back').evaluate(element => element.getBoundingClientRect().top)

  // macOS：侧栏标题行与设置页 frame 带都必须可拖，按钮保持可交互。
  // 设置页的拖动带是 grid 第一行（::before），与窄轨同色构成整块 frame；侧栏仍用宿主 ::after 规则。
  for (const fullscreen of [false, true]) {
    await setPlatform('darwin', { fullscreen })
    const sidebarState = await read('.dcu-root', '::after')
    assert.notEqual(sidebarState.region, 'no-drag', '.dcu-root 不得形成整层不可拖动区域')
    if (!fullscreen) {
      assert.equal(sidebarState.strip, 'drag', '.dcu-root 顶部安全区必须允许窗口拖动')
      assert.equal(sidebarState.height, '48px')
    } else assert.notEqual(sidebarState.strip, 'drag', '全屏不得留下额外拖动条')
    assert.equal(sidebarState.button, 'no-drag', '按钮必须继续可交互')
    const state = await read('.dcu-settings-page', '::before')
    assert.notEqual(state.region, 'no-drag', '.dcu-settings-page 不得形成整层不可拖动区域')
    if (!fullscreen) {
      assert.equal(state.strip, 'drag', '设置页 frame 带必须允许窗口拖动')
      assert.equal(state.height, '48px', 'frame 带必须占满标题栏安全区高度')
      assert.equal(state.stripBg, 'rgb(243, 243, 243)', 'frame 带必须与窄轨同色，顶栏+窄轨一整块背景')
    } else {
      assert.notEqual(state.strip, 'drag', '全屏不得留下额外拖动条')
      assert.equal(state.height, '0px', '全屏 frame 带必须收起')
    }
    assert.equal(state.button, 'no-drag', '按钮必须继续可交互')
  }

  // Windows：宿主把标题栏拖动条画在 frame 顶部，全屏设置页会整层盖住它，插件必须自己预留并声明。
  for (const fullscreen of [false, true]) {
    await setPlatform('win32', { fullscreen, titlebar: true })
    const state = await read('.dcu-settings-page', '::before')
    if (!fullscreen) {
      assert.equal(state.strip, 'drag', 'Windows 标题栏安全区必须允许窗口拖动')
      assert.equal(state.height, '40px', 'Windows 拖动条高度必须对齐宿主标题栏')
      assert.equal(state.stripBg, 'rgb(243, 243, 243)', 'Windows 标题栏带必须跟随插件覆盖后的 --dsw-specific-sidebar-fill（Codex 轨道 #f3f3f3）贯通铺色')
      assert.equal(state.stripWidth, await page.evaluate(() => `${innerWidth}px`), '标题栏带必须贯通整个窗口宽度')
      assert.equal(await backTop(), 58, 'Windows 下返回按钮必须让出原生窗口按钮所在的标题栏')
      // 设置页不展示会话历史前进/后退箭头，Desktop 菜单前移到 12px 对齐，且不压住返回按钮。
      const menu = await page.locator('[data-windows-menu]').evaluate(el => ({
        display: getComputedStyle(el).display,
        bottom: el.getBoundingClientRect().bottom,
        start: getComputedStyle(document.documentElement).getPropertyValue('--dsh-windows-menu-start'),
      }))
      assert.equal(menu.display, 'block', '窗口态下 Desktop 菜单必须保持可见')
      assert.equal(menu.start, '120px', '设置页下 Desktop 菜单必须在 ←/→/折叠三键之后起排')
      assert.ok(menu.bottom <= await backTop(), 'Desktop 菜单底部不得压住返回应用按钮')
    } else {
      assert.notEqual(state.strip, 'drag', 'Windows 全屏不得留下额外拖动条')
      assert.equal(await backTop(), 18, 'Windows 全屏不得额外留标题栏空白')
      assert.equal(await page.locator('[data-windows-menu]').evaluate(el => getComputedStyle(el).display), 'none', 'Windows 全屏下 Desktop 菜单必须隐藏，避免遮挡内容')
    }
  }

  // 没有标题栏的 Web 宿主与普通浏览器不得引入拖动条，也不得抬高设置导航。
  for (const platform of ['win32', null]) {
    await setPlatform(platform, { titlebar: false })
    assert.notEqual((await read('.dcu-settings-page', '::before')).strip, 'drag', '无标题栏宿主不应引入拖动条')
    assert.equal(await backTop(), 18, '无标题栏宿主不得抬高设置导航')
  }
  assert.match(sidebar, /<header className="dcu-head" data-window-drag/, '侧栏标题行应保留官方拖动标记')
  await page.evaluate(() => {
    document.documentElement.dataset.platform = 'darwin'
    document.documentElement.removeAttribute('data-fullscreen')
    document.documentElement.style.setProperty('--dsh-frame-top-clearance', '64px')
  })
  assert.equal(await page.locator('.dcu-root').evaluate(el => getComputedStyle(el, '::after').height), '64px')
  await page.getByRole('button', { name: '返回', exact: true }).click()
  await page.getByRole('textbox', { name: '搜索' }).fill('仍可输入')
  assert.equal(await page.getByRole('textbox', { name: '搜索' }).inputValue(), '仍可输入')
  console.log('窗口拖动 CSS 回归通过：macOS/Windows 顶部安全区、设置浮层、按钮输入、全屏及其他平台。')
} finally {
  await browser.close()
}
