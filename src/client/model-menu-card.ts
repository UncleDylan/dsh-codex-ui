/**
 * 把宿主「模型 / 推理等级」两行菜单换成 Codex 卡片：顶部居中显示当前推理强度与模型名，
 * 下面一条可拖拽的分段滑轨。只改根面板外观，模型列表、推理等级回调、加载与失败状态仍走宿主。
 *
 * 档位优先从宿主的模型目录服务读（`ModelEffortBridge`）：卡片一出现就是完整形态，
 * 提交档位也走服务，宿主不会因此关菜单，滑轨能在原地补间。服务不可用时退回老办法——
 * 借宿主自己的「推理等级」面板读一次档位并按模型名缓存；两种方式都不硬编码低／中／高。
 * 宿主选完档位会自己关掉菜单，而卡片要留在原地，所以结算后再把触发按钮点开一次。
 */

import type { ModelEffortBridge } from './model-effort-bridge.ts'

/** 宿主 `MenuSurface` 的门户根：只有模型选择菜单带 `data-menu-material`。 */
const SURFACE = '[data-menu-material]'
const CELL = ':scope>[class*="_cell"]'
const CELL_LABEL = '[class*="_cellLabel"]'
const CELL_VALUE = '[class*="_cellValue"]'
/** 「推理等级」面板的行；模型列表的行在 `[class*="_groups"]` 里，不是面板直接子节点。 */
const TIER_ROW = ':scope>[role="menuitemradio"]'
/** 菜单的触发按钮，用来关闭以及选择后重新打开菜单。 */
const TRIGGER = 'button[aria-haspopup="menu"]'

export const MODEL_MENU_CARD_STYLE = `
[data-menu-material][data-dcu-model-card]{box-sizing:border-box;width:auto!important;min-width:0!important;max-width:none!important;padding:0!important;border:0!important;border-radius:20px!important;background:#fff!important;box-shadow:0 14px 40px #0000001f,0 0 0 1px #0000000d!important;overflow:hidden}
body[data-ds-dark-theme] [data-menu-material][data-dcu-model-card]{background:#202020!important;box-shadow:0 14px 40px #0006,0 0 0 1px #ffffff12!important}
/* 原生两行与推理等级行一律让位给卡片。 */
[data-menu-material][data-dcu-model-card]>:not(.dcu-model-card){display:none!important}
/* 档位位置用一个注册过的自定义属性表达，交给 CSS 补间：
   滑块、灰带、圆点、强度文字都从它派生，改一次值整条滑轨一起滑，不依赖脚本量像素。 */
@property --dcu-pos{syntax:"<number>";inherits:true;initial-value:0}
/* 档位由低到高用「浅蓝到深蓝」的同一条色带：轨道本身就是这条色带，灰条盖住未选择的一侧。 */
.dcu-model-card{--dcu-pos:0;--dcu-accent:var(--dsw-alias-state-business-primary,#3a83f7);--dcu-accent-min:#75a4f8;--dcu-accent-max:#1f55d6;--dcu-track:#e8e7e8;--dcu-caption:#98999a;--dcu-icon:#a6a6a6;--dcu-thumb:#fff;--dcu-dot-idle:#b7b7b8;--dcu-dot-on:#ffffff8a;box-sizing:border-box;display:flex;flex-direction:column;width:min(286px,calc(100vw - 24px));padding:15px 17px 16px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);outline:none;transform-origin:100% 100%;animation:dcu-model-card-in 180ms cubic-bezier(.16,1,.3,1) both;transition:--dcu-pos 300ms cubic-bezier(.34,1.36,.64,1)}
/* 拖动时跟手、首次就位要直接到位，这两种情况不做补间。 */
.dcu-model-card[data-dragging],.dcu-model-card[data-instant]{transition:none}
.dcu-model-card[data-quiet]{animation:none}
body[data-ds-dark-theme] .dcu-model-card{--dcu-track:#3a3a3a;--dcu-caption:#9d9d9e;--dcu-icon:#8e8e8e;--dcu-dot-idle:#636364;--dcu-dot-on:#ffffff6b}
@keyframes dcu-model-card-in{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
@keyframes dcu-model-card-out{to{opacity:0;transform:scale(.97)}}
/* 卡片交还给宿主时（下钻模型列表等）给原生面板一个淡入，避免硬切。 */
[data-menu-material][data-dcu-pane-in]>:not([aria-hidden]){animation:dcu-pane-in 170ms cubic-bezier(.16,1,.3,1) both}
@keyframes dcu-pane-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.dcu-model-card[data-leaving]{animation:dcu-model-card-out 110ms ease both;pointer-events:none}
.dcu-model-card-head{display:grid;grid-template-columns:20px 1fr 20px;align-items:center;min-height:20px;gap:4px}
/* 左右两侧各留一格，让强度文字始终压在卡片中线上（不画多余图标）。 */
.dcu-model-card-mark{display:block;width:20px;height:20px}
/* 强度文字跟着档位一起由浅入深，最低档也至少走 35% 的深度，保证够看。 */
.dcu-model-card-effort{justify-self:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dcu-accent);font-size:15px;font-weight:600;line-height:20px}
.dcu-model-card-effort{color:color-mix(in srgb,var(--dcu-accent-max) calc(35% + var(--dcu-pos,0) * 65%),var(--dcu-accent-min))}
.dcu-model-card-close{appearance:none;justify-self:end;display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:none;color:var(--dcu-icon);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-model-card-close:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dcu-model-card-close:focus-visible{outline:2px solid var(--dcu-accent);outline-offset:1px}
.dcu-model-card-close svg{width:14px;height:14px}
.dcu-model-card-model{appearance:none;align-self:center;display:flex;align-items:center;gap:2px;max-width:100%;margin-top:2px;padding:2px 6px;border:0;border-radius:8px;background:none;color:var(--dcu-caption);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-model-card-model:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}
.dcu-model-card-model:focus-visible{outline:2px solid var(--dcu-accent);outline-offset:1px}
.dcu-model-card-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:400;line-height:18px}
.dcu-model-card-arrow{flex:none;width:13px;height:13px;opacity:.85}
.dcu-model-card-slider{position:relative;height:30px;margin-top:11px;transition:opacity 140ms ease}
.dcu-model-card-slider[data-idle]{opacity:0}
.dcu-model-card-track{position:absolute;inset:0;z-index:0;border-radius:999px;background:linear-gradient(90deg,var(--dcu-accent-min),var(--dcu-accent-max))}
/* 灰条从滑块中心盖到右端，左边缘藏在滑块下面，蓝条与滑块之间不会有缝。 */
.dcu-model-card-rest{position:absolute;top:0;bottom:0;left:calc((100% - 30px) * var(--dcu-pos,0) + 15px);right:0;border-radius:0 999px 999px 0;background:var(--dcu-track)}
/* 最小档整条轨道退回灰色；滑块是圆的，露出的色带边角会显得脏。 */
.dcu-model-card[data-off] .dcu-model-card-track{background:var(--dcu-track)}
.dcu-model-card[data-off] .dcu-model-card-rest{left:0;border-radius:999px}
.dcu-model-card-thumb{position:absolute;top:50%;left:calc((100% - 30px) * var(--dcu-pos,0) + 15px);z-index:3;width:30px;height:30px;border-radius:50%;background:var(--dcu-thumb);box-shadow:0 1px 2px #00000029,0 3px 8px #00000014;transform:translate(-50%,-50%);pointer-events:none}
.dcu-model-card-range{position:absolute;inset:0;z-index:2;width:100%;height:100%;margin:0;padding:0;border:0;background:none;-webkit-appearance:none;appearance:none;opacity:0;cursor:pointer}
.dcu-model-card-range::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border:0;border-radius:50%;background:#000}
.dcu-model-card-range:focus-visible{outline:none}
.dcu-model-card-slider:has(.dcu-model-card-range:focus-visible) .dcu-model-card-thumb{box-shadow:0 0 0 3px color-mix(in srgb,var(--dcu-accent) 32%,transparent),0 1px 2px #00000029}
/* 圆点只做刻度，不挡拖动：命中区域交给上面那层透明 range。 */
.dcu-model-card-dot{position:absolute;top:50%;left:calc((100% - 30px) * var(--dcu-pos) + 15px);z-index:3;display:grid;place-items:center;width:12px;height:12px;transform:translate(-50%,-50%);pointer-events:none}
.dcu-model-card-dot::before{content:"";width:4px;height:4px;border-radius:50%;background:var(--dcu-dot-idle);transition:background 160ms,transform 160ms,opacity 200ms}
.dcu-model-card-dot[data-past]::before{background:var(--dcu-dot-on)}
/* 最高档整条色带点亮：白点完成刻度使命，退场（Codex 同款）。 */
.dcu-model-card[data-max] .dcu-model-card-dot::before{opacity:0}
/* 流光层：最高档时盖在色带上——一道斜向高光缓缓扫过，星点随之漂流闪烁。平时整层透明，进出最高档都淡入淡出。 */
.dcu-model-card-shine{position:absolute;inset:0;z-index:1;overflow:hidden;border-radius:inherit;opacity:0;pointer-events:none;transition:opacity 260ms ease}
.dcu-model-card[data-max] .dcu-model-card-shine{opacity:1}
.dcu-model-card-shine::before{content:"";position:absolute;top:0;bottom:0;left:-60%;width:60%;background:linear-gradient(100deg,transparent,#ffffff2e 42%,#ffffff52 50%,#ffffff2e 58%,transparent);animation:dcu-shine-sweep 3.4s cubic-bezier(.4,0,.6,1) infinite}
.dcu-model-card-shine::after{content:"";position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 12px 10px,#fff 55%,transparent),radial-gradient(1px 1px at 34px 20px,#ffffffcc 55%,transparent),radial-gradient(1.4px 1.4px at 58px 8px,#fff 55%,transparent),radial-gradient(1px 1px at 76px 18px,#ffffffb3 55%,transparent),radial-gradient(1.3px 1.3px at 94px 12px,#fff 55%,transparent);background-size:104px 30px;animation:dcu-shine-drift 9s linear infinite,dcu-shine-twinkle 2.4s ease-in-out infinite}
@keyframes dcu-shine-sweep{from{transform:translateX(0)}to{transform:translateX(267%)}}
/* 星点以一颗瓦片的宽度循环平移，首尾相接不跳变。 */
@keyframes dcu-shine-drift{to{background-position:104px 0}}
@keyframes dcu-shine-twinkle{0%,100%{opacity:.45}50%{opacity:.9}}
/* 圆点明暗随档位渐变；滑块与灰带的位移都从 --dcu-pos 派生，由根上的补间一起带动。 */
/* 这里的动效是这套皮肤的核心（弹层入场、档位滑动），不跟随系统的「减少动态效果」开关关闭：
   之前几版把它做成跟随，结果在关掉动画的机器上看起来就是「什么都没生效」。 */
`

export type ModelMenuCard = {
  surface: HTMLElement
  /** 「模型」格子：下钻到宿主的模型列表。 */
  modelCell: HTMLButtonElement
  /** 「推理等级」格子：读档位与提交档位都借它。 */
  effortCell: HTMLButtonElement
  model: string
  effort: string
  /** 宿主自己的格子标题（「模型」「推理等级」），用作卡片无障碍名称，避免新增文案。 */
  modelCaption: string
  effortCaption: string
}

export type ModelMenuCardOptions = {
  /** 关闭按钮的无障碍名称与提示。 */
  close?: string
  /** 宿主模型目录：直接读档位、直接提交档位。缺省时退回点菜单行的老路径。 */
  efforts?: ModelEffortBridge
}

type SurfaceState = {
  card?: HTMLElement
  name?: HTMLElement
  effort?: HTMLElement
  /** 滑轨外壳：卡片一建出来就在，档位读到后才往里填轨道与圆点。 */
  slider?: HTMLElement
  /** 盖住未选侧的那条灰带。 */
  rest?: HTMLElement
  /** 滑块：档位之间由它滑动过渡。 */
  thumb?: HTMLElement
  range?: HTMLInputElement
  ticks: HTMLElement[]
  /** 模型名 -> 档位文字，顺序即宿主渲染顺序。 */
  tiers: Map<string, readonly string[]>
  active: number
  probing: boolean
  committing: boolean
  unsupported: boolean
  /** 档位是否来自宿主目录服务（而不是借面板探测出来的）。 */
  external: boolean
  /** 宿主正在结算上一次选择。 */
  busy: boolean
  /** 正在拖动滑轨：这一小段时间滑块跟手，不做补间。 */
  dragging: boolean
  /** 按下之后指针是否真的移动过：只有真拖动才让滑块跟手，单击轨道等落定后滑过去。 */
  moved: boolean
  /** 从哪一刻开始读不到根面板的格子：宿主重渲染的中间帧不该把卡片拆掉。 */
  lostAt?: number
  /** 当前卡片是否已带上档位（头部形态还不够，读到档位后要重建一次）。 */
  ready: boolean
  /** 宿主上报的档位下标（不含拖动预览），用来判断「点的是不是当前档位」。 */
  host: number
  /** 菜单触发按钮：关闭与「选完再打开」都靠它。 */
  trigger?: HTMLButtonElement
  /** 拖动滑轨时的预览下标；宿主上报的值在这之前不覆盖它。 */
  preview?: number
}

const text = (node: Element | null | undefined): string => (node?.textContent ?? '').trim()

/** 读根面板；只有「模型」格子（适配器没有推理元数据）时交还原生菜单。 */
export function readModelMenuCard(surface: HTMLElement): ModelMenuCard | undefined {
  const cells = [...surface.querySelectorAll<HTMLButtonElement>(CELL)]
  if (cells.length < 2) return undefined
  const [modelCell, effortCell] = cells as [HTMLButtonElement, HTMLButtonElement]
  const model = text(modelCell.querySelector(CELL_VALUE))
  const effort = text(effortCell.querySelector(CELL_VALUE))
  if (model === '' || effort === '' || modelCell.disabled || effortCell.disabled) return undefined
  return {
    surface,
    modelCell,
    effortCell,
    model,
    effort,
    modelCaption: text(modelCell.querySelector(CELL_LABEL)),
    effortCaption: text(effortCell.querySelector(CELL_LABEL)),
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (content !== undefined) node.textContent = content
  return node
}

const SVG = (className: string, body: string, width = 1.5): string =>
  `<svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

/** 右上的关闭按钮；左侧那格只留空白，让强度文字压在卡片中线上。 */
const CLOSE = SVG('', '<path d="M4.6 4.6 11.4 11.4M11.4 4.6 4.6 11.4"/>', 1.4)
const ARROW = SVG('dcu-model-card-arrow', '<path d="M6.4 3.6 10.6 8 6.4 12.4"/>', 1.5)

/** 逐帧等待某一帧条件成立，走完上限帧数仍不成立就交回 false。 */
function waitFrames(test: () => boolean, frames: number, done: (ok: boolean) => void, frame = 0): void {
  if (test()) { done(true); return }
  if (frame >= frames) { done(false); return }
  window.requestAnimationFrame(() => { waitFrames(test, frames, done, frame + 1) })
}

/** 逐帧等待宿主渲染出「推理等级」面板，上限约 30 帧。 */
function whenTiers(surface: HTMLElement, done: (rows: HTMLButtonElement[]) => void, frame = 0): void {
  const rows = [...surface.querySelectorAll<HTMLButtonElement>(TIER_ROW)]
  if (rows.length > 0 || frame > 30) { done(rows); return }
  window.requestAnimationFrame(() => { whenTiers(surface, done, frame + 1) })
}

/**
 * 用宿主的键盘约定退回根面板：先试 Shift+Tab（与 Escape 等价，更少被全局快捷键吃掉），
 * 一帧后仍是下钻面板时改试 Escape；两者都失效就放弃，交给调用方恢复原生菜单。
 */
function backToRoot(surface: HTMLElement, done?: () => void): void {
  const key = (init: KeyboardEventInit): void => {
    const target: EventTarget = surface.querySelector<HTMLElement>(TIER_ROW) ?? surface
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
  }
  key({ key: 'Tab', shiftKey: true })
  window.requestAnimationFrame(() => {
    if (!surface.isConnected || surface.querySelector(CELL) === null) return done?.()
    key({ key: 'Escape' })
    window.requestAnimationFrame(() => { if (surface.isConnected && surface.querySelector(CELL) === null) done?.() })
  })
}

/** 菜单的触发按钮：按 aria-controls 精确对上这个面板，避免误点别的菜单。 */
function findTrigger(surface: HTMLElement): HTMLButtonElement | undefined {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>(TRIGGER)]
  if (surface.id !== '') {
    const exact = buttons.find(button => button.getAttribute('aria-controls') === surface.id)
    if (exact !== undefined) return exact
  }
  return buttons.find(button => button.getAttribute('aria-expanded') === 'true')
}

/** 模型名 -> 档位文字。宿主每个模型公布的档位极少变动，缓存后二次打开无需再探测。 */
const TIER_CACHE = new Map<string, readonly string[]>()
/** 一段时间内重建的卡片不再播放入场动画：读档位、选完档位重开都不算新开一次。 */
let quietUntil = 0

/** 观察宿主的模型菜单，把根面板换成 Codex 卡片；返回清理函数。 */
export function observeModelMenuCard(options: ModelMenuCardOptions = {}): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {}
  const closeLabel = options.close ?? 'Close'
  // 卡片的样式随观察器一起挂载与卸载，不依赖侧栏是否挂载。
  const style = document.createElement('style')
  style.setAttribute('data-dcu-model-card-style', '')
  style.textContent = MODEL_MENU_CARD_STYLE
  document.head.append(style)
  const states = new WeakMap<HTMLElement, SurfaceState>()
  let frame: number | undefined
  let disposed = false

  function stateOf(surface: HTMLElement): SurfaceState {
    let state = states.get(surface)
    if (state === undefined) {
      state = { ticks: [], tiers: new Map(), active: 0, host: 0, probing: false, committing: false, unsupported: false, external: false, busy: false, dragging: false, moved: false, ready: false }
      states.set(surface, state)
    }
    return state
  }

  function teardown(surface: HTMLElement, state: SurfaceState | undefined): void {
    // 卡片可能随宿主面板一起被卸载（React 已经移走父节点），这时再 remove 会抛错。
    if (state?.card?.isConnected === true) state.card.remove()
    if (state !== undefined) {
      state.card = undefined
      state.name = undefined
      state.effort = undefined
      state.slider = undefined
      state.rest = undefined
      state.thumb = undefined
      state.range = undefined
      state.ticks = []
      state.lostAt = undefined
      state.ready = false
    }
    surface.removeAttribute('data-dcu-model-card')
  }

  /** 按当前档位重画：强调色强度文字、滑轨填充比例、圆点明暗。`ratio` 供拖动预览传连续位置。 */
  function paint(state: SurfaceState, card: ModelMenuCard, tiers: readonly string[], index: number, ratio = tiers.length > 1 ? index / (tiers.length - 1) : 0): void {
    const tier = tiers[index] ?? card.effort
    state.active = index
    // 只在文字真的变化时写入：观察器也在看 characterData，重复写入会造成自激循环。
    if (state.effort !== undefined && state.effort.textContent !== tier) {
      state.effort.textContent = tier
      // 换档时给强调色文字一点淡入，避免直接跳字。
      if (typeof state.effort.animate === 'function') {
        state.effort.animate([{ opacity: 0, transform: 'translateY(2px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.2,.8,.3,1)' })
      }
    }
    state.card?.setAttribute('aria-label', `${card.model} · ${tier}`)
    // 只改这一个值：滑块、灰带、圆点、强度文字都由它派生，位移补间交给 CSS。
    // 拖动预览会传指针处的连续分数，其余调用按档位换算。
    state.card?.style.setProperty('--dcu-pos', String(ratio))
    // 停在最小档时整条轨道退回灰色：滑块是圆的，色带边角会在圆的上下缘露出来。
    state.card?.toggleAttribute('data-off', index === 0)
    // 最高档点亮流光层并让白点退场（Codex 同款）。
    state.card?.toggleAttribute('data-max', index === tiers.length - 1)
    if (state.range !== undefined) {
      state.range.max = String(Math.max(0, tiers.length - 1))
      // 用户按住滑轨时不能回写 value：单击轨道的默认动作已把值改到点击处，此刻若把宿主结算
      // 前的旧档位写回去，浏览器看到值没变就不会再发 change，这次选择会整个丢掉。
      if (!state.dragging) {
        state.range.value = String(index)
        state.range.setAttribute('aria-valuetext', tier)
      }
    }
    state.ticks.forEach((tick, at) => {
      tick.toggleAttribute('data-past', at <= index)
      tick.toggleAttribute('data-active', at === index)
    })
  }

  /**
   * 提交档位：仍点宿主的推理等级行，沿用它的回调与失败提示。
   * 宿主结算成功后会关掉菜单，这里等它卸载再把触发按钮点开，卡片看起来就没关过。
   */
  function commit(surface: HTMLElement, state: SurfaceState, card: ModelMenuCard, index: number): void {
    const tiers = state.tiers.get(card.model)
    if (tiers === undefined || state.committing) return
    // 预览压住这次选择：宿主结算回来之前 sync 读到的仍是旧档位，放手会让滑到一半的滑轨被拽回去弹一下。
    // 宿主确认后 render 里 preview === host 自然清掉；被拒绝时下面显式清掉并滑回。
    state.preview = index
    paint(state, card, tiers, index)
    // 点的是宿主当前档位：宿主同样会关菜单，直接跳过，卡片保持打开。
    if (index === state.host) return
    state.committing = true
    const efforts = options.efforts
    if (state.external && efforts !== undefined) {
      // 直接提交给宿主目录：不点菜单行，宿主就不会关菜单，滑轨留在原地补间到新档位。
      void efforts.select(index).then(ok => {
        state.committing = false
        if (disposed) return
        if (!ok) state.preview = undefined
        schedule()
      })
      return
    }
    const trigger = state.trigger ?? findTrigger(surface)
    state.trigger = trigger
    const live = readModelMenuCard(surface) ?? card
    live.effortCell.click()
    whenTiers(surface, rows => {
      rows[index]?.click()
      // 选择被拒绝时宿主留在推理等级面板；正常结算时整个面板会卸载。
      quietUntil = performance.now() + 800
      // 宿主把选择交给 Host 结算，成功后才关菜单；给足结算时间再点回去。
      waitFrames(() => document.querySelector(SURFACE) === null, 45, closed => {
        state.committing = false
        if (disposed) return
        if (closed) {
          trigger?.click()
          return
        }
        if (!surface.isConnected) return
        if (readModelMenuCard(surface) === undefined) backToRoot(surface)
        schedule()
      })
    })
  }

  /**
   * 画卡片。档位未知时只画头部（模型名 + 宿主当前强度），并留出滑轨的高度，
   * 读到档位后原地补上滑轨——高度不变，宿主的定位不用重算，也就不会闪。
   */
  function build(surface: HTMLElement, state: SurfaceState, card: ModelMenuCard, tiers: readonly string[] | undefined, index: number): void {
    const root = element('div', 'dcu-model-card')
    root.setAttribute('role', 'group')
    // 可聚焦（不进 Tab 序列）：点卡片空白处时焦点留在菜单里，宿主不会判定为失焦而关菜单。
    root.tabIndex = -1
    if (performance.now() < quietUntil) root.setAttribute('data-quiet', '')

    const head = element('div', 'dcu-model-card-head')
    const mark = element('span', 'dcu-model-card-mark')
    mark.setAttribute('aria-hidden', 'true')
    const effort = element('span', 'dcu-model-card-effort', tiers?.[index] ?? card.effort)
    const close = element('button', 'dcu-model-card-close')
    close.type = 'button'
    close.setAttribute('aria-label', closeLabel)
    close.title = closeLabel
    close.insertAdjacentHTML('beforeend', CLOSE)
    close.addEventListener('click', () => {
      const trigger = state.trigger ?? findTrigger(surface)
      if (trigger !== undefined) { trigger.click(); return }
      surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    head.append(mark, effort, close)

    const model = element('button', 'dcu-model-card-model')
    model.type = 'button'
    model.title = card.model
    model.setAttribute('aria-label', `${card.modelCaption}: ${card.model}`)
    model.append(element('span', 'dcu-model-card-name', card.model))
    model.insertAdjacentHTML('beforeend', ARROW)
    model.addEventListener('click', () => {
      // 卡片马上要被移走：先把焦点挪回触发按钮，否则宿主按「失焦」把菜单一起关掉。
      state.trigger?.focus()
      const trigger = state.trigger
      // 卡片先淡出再交还宿主，和原生模型列表的淡入接上，不让弹层内容硬切。
      root.setAttribute('data-leaving', '')
      // 原生面板淡入的开关只在这次交还期间打开，不影响宿主其它菜单。
      surface.setAttribute('data-dcu-pane-in', '')
      window.setTimeout(() => surface.removeAttribute('data-dcu-pane-in'), 600)
      window.setTimeout(() => {
        // 先让宿主切到模型列表（这一帧列表还被卡片挡着），下一帧再撤卡片，
        // 中间不会闪出原生那两行。
        card.modelCell.click()
        window.requestAnimationFrame(() => teardown(surface, state))
        // 宿主选中模型后会关掉菜单；盯着触发按钮把菜单再点开，卡片留在原位。
        if (trigger !== undefined) watchSelection(trigger)
      }, 110)
    })

    // 滑轨外壳先占住高度：档位读到后原地填内容，卡片高度不变，宿主也不用重新定位。
    const slider = element('div', 'dcu-model-card-slider')
    slider.setAttribute('data-idle', '')
    state.slider = slider
    state.rest = undefined
    state.range = undefined
    state.ticks = []

    root.append(head, model, slider)
    state.card = root
    state.name = model
    state.effort = effort
    state.ready = tiers !== undefined
    state.host = index
    state.trigger = findTrigger(surface) ?? state.trigger
    // 工具菜单观察器可能已经先一步接管这个面板；清掉它的标记，避免两套样式互相拉扯。
    surface.removeAttribute('data-dcu-tool-menu')
    for (const property of ['--dcu-tool-menu-x', '--dcu-tool-menu-y', '--dcu-tool-menu-height', '--dcu-tool-menu-shift']) surface.style.removeProperty(property)
    surface.setAttribute('data-dcu-model-card', '')
    // 首次就位直接到位，不从最左滑过来；下一帧再恢复补间。
    root.setAttribute('data-instant', '')
    surface.append(root)
    root.setAttribute('aria-label', `${card.model} · ${tiers?.[index] ?? card.effort}`)
    if (tiers === undefined) state.ready = false
    else hydrate(surface, state, card, tiers, index)
    window.requestAnimationFrame(() => root.removeAttribute('data-instant'))
  }

  /**
   * 把轨道、刻度与透明 range 填进已有卡片。档位从无到有时只走这里，
   * 卡片元素本身不重建，所以不会出现「整块重画」的闪动。
   */
  function hydrate(surface: HTMLElement, state: SurfaceState, card: ModelMenuCard, tiers: readonly string[], index: number): void {
    if (tiers.length < 2) {
      state.ready = false
      return
    }
    const root = state.card
    const slider = state.slider
    if (root === undefined || slider === undefined) return
    if (state.range === undefined) {
      const track = element('div', 'dcu-model-card-track')
      const rest = element('div', 'dcu-model-card-rest')
      // 流光层压在色带上、刻度圆点与滑块之下；平时透明，最高档点亮。
      const shine = element('div', 'dcu-model-card-shine')
      shine.setAttribute('aria-hidden', 'true')
      track.append(rest, shine)
      const range = element('input', 'dcu-model-card-range')
      range.type = 'range'
      range.min = '0'
      range.max = String(tiers.length - 1)
      range.step = '1'
      range.value = String(index)
      range.setAttribute('aria-label', card.effortCaption || card.model)
      // 松手可能落在滑轨之外，所以监听挂在 window 上，避免 data-dragging 卡死导致补间一直缺席。
      // 手部抖动不算拖动：抖动的单击仍等 change 从原档位补间过去，而不是把滑块瞬移过去。
      let pressX = 0
      let pressY = 0
      /** 拖动跟手：把指针位置换算成连续的 --dcu-pos。原生 value 按 step 离散跳，
       *  若从这里取值滑块就会在档位之间瞬移；连续分数让滑块 1:1 贴住手指。 */
      const dragTo = (event: PointerEvent): void => {
        const box = track.getBoundingClientRect()
        const span = Math.max(1, box.width - 30)
        const ratio = Math.min(1, Math.max(0, (event.clientX - box.left - 15) / span))
        const at = Math.round(ratio * (tiers.length - 1))
        state.preview = at
        paint(state, card, tiers, at, ratio)
      }
      const markMoved = (event: PointerEvent): void => {
        if (Math.hypot(event.clientX - pressX, event.clientY - pressY) > 3) {
          state.moved = true
          dragTo(event)
        }
      }
      const stopDrag = (): void => {
        state.dragging = false
        state.moved = false
        state.preview = undefined
        root.removeAttribute('data-dragging')
        window.removeEventListener('pointerup', stopDrag)
        window.removeEventListener('pointercancel', stopDrag)
        window.removeEventListener('pointermove', markMoved)
      }
      range.addEventListener('change', () => {
        const at = Number(range.value)
        state.preview = undefined
        stopDrag()
        paint(state, card, tiers, at)
        commit(surface, state, card, at)
      })
      // 宿主在菜单根上接管 pointerdown 与上下方向键；滑轨需要自己处理，否则拖不动、键调不动。
      range.addEventListener('pointerdown', event => {
        event.stopPropagation()
        pressX = event.clientX
        pressY = event.clientY
        state.dragging = true
        state.moved = false
        root.setAttribute('data-dragging', '')
        window.addEventListener('pointerup', stopDrag)
        window.addEventListener('pointercancel', stopDrag)
        window.addEventListener('pointermove', markMoved)
      })
      range.addEventListener('blur', stopDrag)
      range.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.stopPropagation()
      })
      const thumb = element('div', 'dcu-model-card-thumb')
      slider.append(track, range, thumb)
      state.ticks = tiers.map((label, at) => {
        const dot = element('span', 'dcu-model-card-dot')
        dot.style.setProperty('--dcu-pos', String(at / (tiers.length - 1)))
        dot.setAttribute('aria-hidden', 'true')
        dot.title = label
        slider.append(dot)
        return dot
      })
      state.range = range
      state.rest = rest
      state.thumb = thumb
    }
    slider.removeAttribute('data-idle')
    state.ready = true
    // 第一次把轨道填上时位置直接就位，不做补间。
    root.setAttribute('data-instant', '')
    paint(state, card, tiers, index)
    window.requestAnimationFrame(() => root.removeAttribute('data-instant'))
  }

  /**
   * 下钻模型列表后盯住触发按钮：宿主选中模型会关掉菜单并把新模型写回 title，
   * title 一变就说明选完了，把菜单重新点开，卡片留在原位。
   * 手动关闭（Escape、点外面）不会改 title，菜单就真的关掉。
   */
  function watchSelection(trigger: HTMLButtonElement): void {
    const before = trigger.title
    let timer: number | undefined
    const stop = (): void => {
      observer.disconnect()
      if (timer !== undefined) window.clearTimeout(timer)
    }
    const observer = new MutationObserver(() => {
      if (disposed || trigger.title === before) return
      stop()
      quietUntil = performance.now() + 800
      waitFrames(() => document.querySelector(SURFACE) === null, 45, closed => {
        if (!closed || disposed || !trigger.isConnected) return
        trigger.click()
      })
    })
    observer.observe(trigger, { attributes: true, attributeFilter: ['title'] })
    timer = window.setTimeout(stop, 60000)
  }

  function render(surface: HTMLElement, state: SurfaceState, card: ModelMenuCard): void {
    // 宿主目录里就有档位就直接用：卡片第一次出现就是完整形态，不用借面板探测。
    const external = options.efforts?.read()
    // 只要有具名档位就走目录；回落到面板探测会把宿主那行非档位的「Default」也读进来。
    const externalTiers = external !== undefined && external.levels.length > 0 ? external.levels.map(level => level.label) : undefined
    const tiers = externalTiers ?? state.tiers.get(card.model) ?? TIER_CACHE.get(card.model)
    state.external = externalTiers !== undefined
    state.busy = external?.busy === true
    if (tiers !== undefined) state.tiers.set(card.model, tiers)
    if (tiers === undefined) {
      // 档位还没读到时先立卡片再探测，用户看到的是头部而不是空面板。
      if (state.card?.isConnected !== true) build(surface, state, card, undefined, 0)
      if (!state.probing && !state.unsupported) probe(surface, state, card)
      return
    }
    const found = externalTiers === undefined ? tiers.indexOf(card.effort) : external!.index
    const host = found >= 0 ? found : Math.min(state.active, Math.max(0, tiers.length - 1))
    state.host = host
    // 宿主已上报到预览档位时预览自然结束，之后以宿主为准。
    if (state.preview === host) state.preview = undefined
    const index = state.preview ?? host
    if (state.card?.isConnected === true) {
      // 卡片已经在场：档位从未知变已知时只补滑轨，元素不重建。
      // 真拖动中滑轨由指针逐帧驱动（见 dragTo），宿主的旧档位在这里不许打断，否则滑块会被拽回去。
      if (state.ready && !(state.dragging && state.moved)) paint(state, card, tiers, index)
      else if (!state.ready) hydrate(surface, state, card, tiers, index)
      return
    }
    build(surface, state, card, tiers, index)
  }

  /** 借宿主自己的推理等级面板读一次档位；期间仍由卡片占位，读完退回根面板。 */
  function probe(surface: HTMLElement, state: SurfaceState, card: ModelMenuCard): void {
    state.probing = true
    card.effortCell.click()
    whenTiers(surface, rows => {
      if (rows.length === 0 || !surface.isConnected) {
        // 读不到档位（面板没渲染或被关闭）：交还宿主原生菜单，不再重试。
        state.probing = false
        state.unsupported = true
        teardown(surface, state)
        return
      }
      // 宿主菜单最前面的「Default」行是「不发送推理参数」的提供方默认，不是档位，
      // 和声明了 off（不填参数值）的模型是同一个请求；滑轨只留具名档位。
      const named = rows.filter(row => text(row.querySelector('[class*="_modelName"]') ?? row) !== 'Default')
      state.tiers.set(card.model, named.map(row => text(row.querySelector('[class*="_modelName"]') ?? row)))
      TIER_CACHE.set(card.model, state.tiers.get(card.model)!)
      state.active = Math.max(0, named.findIndex(row => row.getAttribute('aria-checked') === 'true'))
      quietUntil = performance.now() + 800
      // 推理等级行随面板一起卸载，必须退回根面板；退回的这两帧里宿主还没画出格子，
      // 所以一直占位到格子回来为止，否则卡片会被拆掉再重建，首次打开就闪一下。
      backToRoot(surface, () => {
        state.probing = false
        schedule()
      })
      // 宿主不响应退回键时不能让菜单一直隐身。
      window.setTimeout(() => {
        if (!state.probing) return
        state.probing = false
        if (surface.isConnected && readModelMenuCard(surface) === undefined) teardown(surface, state)
        schedule()
      }, 1200)
    })
  }

  function sync(): void {
    frame = undefined
    if (disposed) return
    for (const surface of document.querySelectorAll<HTMLElement>(SURFACE)) {
      const state = states.get(surface)
      // 读档位与提交档位期间宿主显示的是推理等级面板，卡片要留在原位。
      if (state?.probing === true || state?.committing === true) continue
      const card = readModelMenuCard(surface)
      if (card !== undefined) {
        if (state?.unsupported === true) { teardown(surface, state); continue }
        if (state !== undefined) state.lostAt = undefined
        render(surface, state ?? stateOf(surface), card)
        continue
      }
      if (state !== undefined) {
        // 宿主重渲染的中间帧可能暂时没有格子：先别拆，拆了再建会把补间状态一起丢掉。
        if (state.lostAt === undefined) {
          state.lostAt = performance.now()
          window.setTimeout(schedule, 160)
        }
        if (performance.now() - state.lostAt >= 150) teardown(surface, state)
      }
    }
  }

  function schedule(): void {
    if (disposed || frame !== undefined) return
    frame = window.requestAnimationFrame(sync)
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  schedule()
  return () => {
    disposed = true
    style.remove()
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    observer.disconnect()
    for (const surface of document.querySelectorAll<HTMLElement>(SURFACE)) {
      surface.removeAttribute('data-dcu-pane-in')
      const state = states.get(surface)
      if (state !== undefined) teardown(surface, state)
    }
  }
}
