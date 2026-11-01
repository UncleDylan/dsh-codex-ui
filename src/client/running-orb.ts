/**
 * 把「深度求索中」状态行左侧的鲸鱼尾巴换成 rare-ui MatrixOrb 的 thinking 点阵。
 *
 * 宿主把图标装在 `[data-chat-running]` 里一个 aria-hidden 的小方盒内（14px，
 * position:relative + contain:strict），里面是 APNG 鲸鱼加静态 SVG。React 每秒都会
 * 重渲染这条状态行，所以不碰它管理的子节点——只给盒子打标，往里追加一块同尺寸
 * canvas 用 CSS 盖住鲸鱼；React 重渲染只补丁自己的两个子节点，追加的 canvas 不受
 * 影响，整行卸载时 canvas 一起消失，下次出现由观察器重新打标。
 *
 * 动画取自 rareui.com 的 matrix-orb 组件（MIT）的 thinking 态：三个轨道热点扫过
 * 点阵，热度高的点亮、其余按距离衰减。颜色不用组件默认的橙色，直接继承宿主状态
 * 行的 `--dsw-alias-label-deep-diving` 蓝（读 currentColor，每秒回读一次，主题切换
 * 最多迟一秒跟上）。盒子从宿主的 14px 放大到 20px（行高 22px 内不打挤），网格密度
 * 按盒子大小取，小盒 5×5、大盒 7×7——原始 11×11 在这种尺寸只会糊成一片。
 */

const WHALE_ICON = '[data-chat-running] span[aria-hidden="true"]>svg'
const ORB_MARK = 'data-dcu-running-orb'

export const RUNNING_ORB_STYLE = `
[${ORB_MARK}]{position:relative;width:20px!important;height:20px!important}
[${ORB_MARK}]>:not(canvas){visibility:hidden}
[${ORB_MARK}]>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
`

const TAU = Math.PI * 2
/**
 * 网格密度按盒子大小取：宿主图标盒默认 14px，我们放大到 20px——行高 22px 装得下，
 * 再大就要挤压布局了。14px 时代 7×7 每颗点不足 1 设备像素，糊成一片；20px 配 5×5
 * 每颗点能拿到 ~4 设备像素，点阵才读得清。大盒子（预览/未来宿主放大）仍用 7×7。
 */
const DENSE_GRID = 7
const SMALL_GRID = 5
const ORBITERS = [
  { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
  { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
  { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
]

/** thinking 态的热度场：三个轨道热点的高斯和，铺底 0.26 保证球体轮廓还在。 */
function heatOf(nx: number, ny: number, t: number): number {
  let heat = 0
  for (const orbiter of ORBITERS) {
    const angle = t * orbiter.speed + orbiter.phase
    const dx = nx - Math.cos(angle) * orbiter.radius
    const dy = ny - Math.sin(angle) * orbiter.radius
    heat += Math.exp(-(dx * dx + dy * dy) / (orbiter.spread * orbiter.spread))
  }
  return 0.26 + 0.8 * Math.min(1, heat)
}

type Orb = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  /** 预算好的点阵：画布坐标、归一化坐标和归一化距离。 */
  dots: readonly { x: number, y: number, nx: number, ny: number, distance: number }[]
  maxRadius: number
  dpr: number
  color: string
  colorAt: number
}

function createOrb(canvas: HTMLCanvasElement, box: HTMLElement): Orb | undefined {
  const size = box.clientWidth || 14
  // 缓冲分辨率下限 2×：dpr=1 的屏上点只有两三个像素，按 2× 渲染交给合成器平滑
  // 缩小，点边缘才圆；上限 4× 和组件原版一致。
  const dpr = Math.min(4, Math.max(2, window.devicePixelRatio || 1))
  const buffer = Math.round(size * dpr)
  const ctx = canvas.getContext('2d')
  if (buffer <= 0 || ctx === null) return undefined
  canvas.width = canvas.height = buffer
  // 按 buffer/size 而不是 dpr 缩放，取整后变换仍然精确。
  ctx.scale(buffer / size, buffer / size)
  const grid = size >= 32 ? DENSE_GRID : SMALL_GRID
  const spacing = (size * 0.74) / (grid - 1)
  const half = (grid - 1) / 2
  const maxRadius = spacing * 0.6
  const center = size / 2
  const dots: { x: number, y: number, nx: number, ny: number, distance: number }[] = []
  for (let iy = 0; iy < grid; iy++) {
    for (let ix = 0; ix < grid; ix++) {
      const nx = (ix - half) / half
      const ny = (iy - half) / half
      const distance = Math.hypot(nx, ny)
      // 1.12 而不是正方形的 1.41，切掉的角让外轮廓读起来是圆的。
      if (distance > 1.12) continue
      dots.push({ x: center + (ix - half) * spacing, y: center + (iy - half) * spacing, nx, ny, distance })
    }
  }
  return { canvas, ctx, dots, maxRadius, dpr, color: '', colorAt: 0 }
}

function drawOrb(orb: Orb, t: number, now: number): void {
  // 颜色每秒回读一次：继承状态行的 deep-diving 蓝，主题切换最多迟一秒。
  if (now - orb.colorAt > 1000) {
    orb.colorAt = now
    orb.color = getComputedStyle(orb.canvas).color
  }
  const ctx = orb.ctx
  const size = orb.canvas.width / orb.dpr
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = orb.color
  for (const dot of orb.dots) {
    const intensity = Math.min(1, Math.max(0, heatOf(dot.nx, dot.ny, t)))
    const radius = orb.maxRadius * Math.exp(-dot.distance * dot.distance * 1.7) * intensity
    // 不到半个设备像素的点画出来是雾不是点。
    if (radius * orb.dpr < 0.5) continue
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, radius, 0, TAU)
    ctx.fill()
  }
}

export function observeRunningOrb(doc: Document = document): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {}
  const style = doc.createElement('style')
  style.setAttribute('data-dcu-running-orb-style', '')
  style.textContent = RUNNING_ORB_STYLE
  doc.head.append(style)

  const orbs: Orb[] = []
  let raf: number | undefined
  let timer: number | undefined
  let t = 0
  let last = performance.now()
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function prune(): void {
    for (let at = orbs.length - 1; at >= 0; at--) {
      if (!orbs[at].canvas.isConnected) orbs.splice(at, 1)
    }
  }

  function tick(now: number): void {
    raf = undefined
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    t += dt
    prune()
    for (const orb of orbs) drawOrb(orb, t, now)
    if (orbs.length > 0) raf = window.requestAnimationFrame(tick)
  }

  function ensureLoop(): void {
    if (reduced || raf !== undefined || orbs.length === 0) return
    last = performance.now()
    raf = window.requestAnimationFrame(tick)
  }

  const scan = (): void => {
    timer = undefined
    for (const svg of doc.querySelectorAll(WHALE_ICON)) {
      const box = svg.parentElement
      if (box === null || box.hasAttribute(ORB_MARK)) continue
      box.setAttribute(ORB_MARK, '')
      const canvas = doc.createElement('canvas')
      box.append(canvas)
      const orb = createOrb(canvas, box)
      if (orb === undefined) {
        canvas.remove()
        box.removeAttribute(ORB_MARK)
        continue
      }
      orbs.push(orb)
      if (reduced) drawOrb(orb, 0, performance.now())
    }
    ensureLoop()
  }

  /** 打标走 setTimeout 而不是 rAF：标签页不可见时 rAF 会被整个冻结，状态行会一直等着不打标。 */
  const schedule = (): void => {
    if (timer !== undefined) return
    timer = window.setTimeout(scan, 0)
  }

  /** 只有状态行附近的变化才值得扫一遍；流式输出的消息节点在这里被过滤掉。 */
  function touchesRunning(records: readonly MutationRecord[]): boolean {
    for (const record of records) {
      const element = record.target instanceof Element ? record.target : record.target.parentElement
      if (element === null) continue
      if (element.closest('[data-chat-running]') !== null) return true
      if (record.addedNodes.length === 0) continue
      for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches('[data-chat-running]') || node.querySelector('[data-chat-running]') !== null)) return true
      }
    }
    return false
  }

  const observer = new MutationObserver(records => { if (touchesRunning(records)) schedule() })
  observer.observe(doc.body, { childList: true, subtree: true })
  schedule()

  return () => {
    observer.disconnect()
    if (timer !== undefined) window.clearTimeout(timer)
    if (raf !== undefined) window.cancelAnimationFrame(raf)
    timer = raf = undefined
    style.remove()
    for (const box of doc.querySelectorAll(`[${ORB_MARK}]`)) {
      box.removeAttribute(ORB_MARK)
      box.querySelectorAll('canvas').forEach(canvas => canvas.remove())
    }
    orbs.length = 0
  }
}
