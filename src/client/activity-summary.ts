/**
 * 会话活动聚合的纯读取层：从会话滚动根里读宿主已经渲染出来的变更卡、
 * 呈现文件与外部链接，折叠成摘要卡的「变更 / 输出 / 来源」三段数据。
 * 只读不改；宿主没渲染的东西一律当没有，不自己猜。选择器只用宿主的
 * 稳定 `data-*` 属性与 `[class*=]` 模糊匹配（与其它兼容读取的约定一致）。
 *
 * 口径：变更按整个会话累计——同一文件跨轮合并、+/− 累加；输出与来源
 * 按路径 / URL 去重。DOM 之外的轮次（分页未加载）不在统计内。
 */

export type ActivityFile = {
  /** 显示路径或呈现文件的显示名（宿主 `fileName`）。 */
  path: string
  added: number
  deleted: number
  /** 会话里可滚动定位到的行元素；宿主重渲染后可能失效，失效就当没有。 */
  target: Element | null
  /** 悬停提示（呈现文件用它带出完整工作区路径）。 */
  tooltip?: string
}

export type ActivitySource = {
  /** 去掉 hash 后的绝对 URL。 */
  url: string
  /** 展示用域名。 */
  label: string
  target: Element | null
}

export type ActivitySummary = {
  changes: { files: ActivityFile[], added: number, deleted: number, latestCard: Element | null }
  outputs: ActivityFile[]
  sources: ActivitySource[]
}

/** 宿主把计数排成 `+{count}` / `−{count}`（U+2212 或 ASCII）；这里只取数字，符号是展示装饰。 */
function parseCount(text: string | null | undefined): number {
  const match = (text ?? '').match(/\d+/)
  return match === null ? 0 : Number(match[0])
}

function countIn(scope: Element, marker: string): number {
  return parseCount(scope.querySelector(`[class*="${marker}"]`)?.textContent)
}

export type ChangedFileRow = { path: string, added: number, deleted: number, target: Element }

/**
 * 解析一张「已编辑 N 个文件」卡（`[data-changed-files]`）：
 * 文件行 = `[class*="path"]` 所在的列表行，行内带各自的 added/deleted；
 * 卡级合计取头部第一组计数，解析不到就退回按行求和。
 */
export function parseChangedFilesCard(card: Element): { files: ChangedFileRow[], added: number, deleted: number } {
  const files: ChangedFileRow[] = []
  for (const pathNode of card.querySelectorAll('[class*="path"]')) {
    const path = (pathNode.textContent ?? '').trim()
    if (path === '') continue
    const row = pathNode.closest('[class*="list"] > *') ?? pathNode.parentElement
    if (row === null || row === card || row.contains(card.querySelector('[class*="stat"]'))) continue
    files.push({ path, added: countIn(row, 'added'), deleted: countIn(row, 'deleted'), target: row })
  }
  const headerAdded = parseCount(card.querySelector('[class*="added"]')?.textContent)
  const headerDeleted = parseCount(card.querySelector('[class*="deleted"]')?.textContent)
  const rowAdded = files.reduce((sum, file) => sum + file.added, 0)
  const rowDeleted = files.reduce((sum, file) => sum + file.deleted, 0)
  return {
    files,
    added: rowAdded > 0 ? rowAdded : headerAdded,
    deleted: rowDeleted > 0 ? rowDeleted : headerDeleted,
  }
}

/** 本机/内网地址不算「来源」：开发服务器和引用来源不是一回事。 */
function isPrivateHost(host: string): boolean {
  return host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host === '[::1]'
    || host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
}

function isExternalSource(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  return !isPrivateHost(url.hostname.toLowerCase())
}

/**
 * 汇总整个会话滚动根里的活动。一次 `querySelectorAll` 扫描完成，
 * 调用方（观察器）负责去抖，不要在滚动帧里反复调用。
 */
export function collectActivity(root: Element): ActivitySummary {
  // 变更：多轮卡片按路径合并，+/− 累加；target 指向最新一轮的行（DOM 靠后者）。
  const changes = new Map<string, ActivityFile>()
  let added = 0
  let deleted = 0
  let latestCard: Element | null = null
  for (const card of root.querySelectorAll('[data-changed-files]')) {
    latestCard = card
    const parsed = parseChangedFilesCard(card)
    added += parsed.added
    deleted += parsed.deleted
    for (const file of parsed.files) {
      const seen = changes.get(file.path)
      if (seen === undefined) {
        changes.set(file.path, { path: file.path, added: file.added, deleted: file.deleted, target: file.target })
        continue
      }
      seen.added += file.added
      seen.deleted += file.deleted
      seen.target = file.target
    }
  }
  // 卡级合计优先用行求和（更细）；行没带计数（被宿主折叠等）时退回头部合计。
  const mergedFiles = [...changes.values()]

  // 输出：呈现文件（显示名 + 悬停完整路径）∪ 创建/编辑工具行里的文件链接，按路径去重。
  // 真机 DOM（dsh-client-ui-deliverables）：`data-presented-file` 是布尔标记，显示名在
  // `[class*="fileName"]`，完整工作区路径在预览按钮 `cardPreview` 的 title 上。
  const isFlag = (value: string): boolean => value === '' || value === 'true' || value === 'false'
  const outputs = new Map<string, ActivityFile>()
  for (const row of root.querySelectorAll('[data-presented-file]')) {
    const attr = (row.getAttribute('data-presented-file') ?? '').trim()
    const preview = row.querySelector('[class*="cardPreview"]')
    const fullPath = (preview?.getAttribute('title') ?? '').trim()
    const name = (row.querySelector('[class*="fileName"]')?.textContent ?? '').trim()
    const key = !isFlag(attr) ? attr : (fullPath || name || (row.textContent ?? '').trim())
    if (key === '') continue
    // 工具行显示工作区相对路径，呈现行可能只有完整路径：按文件名归一去重键。
    const dedupeKey = key.split(/[\\/]/).pop() ?? key
    if (outputs.has(dedupeKey)) continue
    outputs.set(dedupeKey, {
      path: !isFlag(attr) ? attr : (name || key),
      added: 0,
      deleted: 0,
      target: row,
      tooltip: fullPath !== '' && fullPath !== key ? fullPath : undefined,
    })
  }
  for (const row of root.querySelectorAll('[data-variant="write"], [data-variant="edit"]')) {
    const path = (row.querySelector('[class*="fileLink"]')?.textContent ?? '').trim()
    if (path === '' || outputs.has(path)) continue
    outputs.set(path, { path, added: 0, deleted: 0, target: row })
  }

  // 来源：assistant 消息里的外部链接（用户回显 `data-submission-echo` 里的不算），按 URL 去重。
  const sources = new Map<string, ActivitySource>()
  for (const anchor of root.querySelectorAll('a[href]')) {
    if (anchor.closest('[data-submission-echo]') !== null) continue
    const raw = anchor.getAttribute('href') ?? ''
    let url: URL
    try {
      url = new URL(raw, location.href)
    } catch {
      continue
    }
    if (!isExternalSource(url)) continue
    url.hash = ''
    const key = url.href
    if (sources.has(key)) continue
    sources.set(key, { url: key, label: url.hostname, target: anchor })
  }

  return {
    changes: { files: mergedFiles, added, deleted, latestCard },
    outputs: [...outputs.values()],
    sources: [...sources.values()],
  }
}
