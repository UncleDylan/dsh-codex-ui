/** 生图模式接线静态校验：rail 图标、面板注册（order 0 落在 webchat -1 与 schedules 10 之间）、locale 键位、路由常量。 */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// 1. RailPhotoIcon 必须是用户指定的 tabler-photo 字形（四条 path 原样保留）。
const rail = read('src/client/SidebarRail.tsx')
const photoIcon = rail.match(/export function RailPhotoIcon[\s\S]*?<\/svg>/)
assert.ok(photoIcon, 'SidebarRail.tsx 缺少 RailPhotoIcon')
for (const pathData of ['M15 8h.01', 'M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12', 'M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5', 'M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3']) {
  assert.ok(photoIcon[0].includes(pathData), `RailPhotoIcon 缺少 tabler-photo path: ${pathData}`)
}

// 2. 窄栏 panels 映射特判 image-studio（与 schedules/webchat 同一接管位）。
const sidebar = read('src/client/CodexSidebar.tsx')
assert.ok(sidebar.includes("panel.id === 'image-studio' ? <RailPhotoIcon />"), 'CodexSidebar 未给 image-studio 特判窄栏图标')
assert.ok(sidebar.includes("import { RailBlocksIcon, RailClockIcon, RailHomeIcon, RailLinkIcon, RailMessageIcon, RailPhotoIcon"), 'CodexSidebar 未导入 RailPhotoIcon')

// 3. index.ts 注册：panellist order 0（webchat=-1 < 0 < schedules=10）+ main keyed + 可用性探测门控。
const index = read('src/client/index.ts')
assert.ok(/id: IMAGE_STUDIO_PANEL_ID, order: 0,/.test(index), 'panellist 注册必须 order 0（聊天 -1 与定时 10 之间）')
assert.ok(index.includes("name: 'main', key: IMAGE_STUDIO_PANEL_ID"), 'main 插槽必须按 image-studio key 注册面板内容')
assert.ok(index.includes('isImageStudioAvailable()'), '注册必须以 dsh-image-gen 可用性探测为门控')

// 3b. 原版工作台调起：走宿主 sidebarRight.openTab('dsh-image-gen/studio')，页签在场探测。
assert.ok(index.includes("readService('sidebarRightTabs')"), '工作台入口必须探测 sidebarRightTabs 页签在场')
assert.ok(index.includes("readService('sidebarRight')") && index.includes('.openTab('), '工作台入口必须经宿主 sidebarRight.openTab 调起')
assert.ok(read('src/client/image-studio.ts').includes("'dsh-image-gen/studio'"), 'studio 页签 id 常量')

// 4. 路由常量与 dsh-image-gen shared.d.ts 一致。
const data = read('src/client/image-studio.ts')
assert.ok(data.includes("'/plugins/dsh-image-gen/studio'"), 'studio 路由常量')
assert.ok(data.includes("'/plugins/dsh-image-gen/image'"), 'image 路由常量')
assert.ok(data.includes("'/plugins/dsh-image-gen/settings-health'"), 'settings-health 探测路由')
assert.ok(data.includes("'/plugins/dsh-image-gen/inspiration/catalog'"), '灵感库目录路由')
assert.ok(data.includes("inspiration/image/"), '灵感图路由拼接')

// 5. locale 键位：zh/en 同时具备 sidebar.imageStudio 与 studio.* 全集，且两语言键集一致。
const locales = read('src/client/locales.ts')
const section = language => {
  const start = locales.indexOf(`export const ${language}`)
  const next = locales.indexOf('export const', start + 1)
  return locales.slice(start, next === -1 ? undefined : next)
}
const keys = language => new Set([...section(language).matchAll(/'([a-zA-Z.]+)'?:/g)].map(match => match[1]).filter(Boolean))
const zhKeys = keys('zh')
const enKeys = keys('en')
assert.ok(zhKeys.has('sidebar.imageStudio'), 'zh 缺 sidebar.imageStudio')
for (const key of [...zhKeys].filter(key => key.startsWith('studio.'))) {
  assert.ok(enKeys.has(key), `en 缺少键 ${key}`)
}
for (const key of [...enKeys].filter(key => key.startsWith('studio.'))) {
  assert.ok(zhKeys.has(key), `zh 缺少键 ${key}`)
}

// 6. 面板根容器与样式底线：宽度/高度铺满中列、显式 border-box（宿主无全局重置）。
const style = read('src/client/image-studio-style.ts')
assert.ok(style.includes('.dcu-image-studio{position:relative;width:100%;height:100%'), '面板根容器必须铺满中列')
assert.ok(style.includes('.dcu-image-studio *,'), '面板内部必须显式 border-box')

console.log('生图模式：rail 图标/注册顺序/locale 键位/路由常量/样式底线校验通过。')
