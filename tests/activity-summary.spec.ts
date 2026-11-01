import { describe, expect, it } from 'vitest'
import { collectActivity, parseChangedFilesCard } from '../src/client/activity-summary.ts'

/**
 * 宿主 deliverables 卡的最小复刻：卡头（title + added/deleted 合计）+ 文件列表
 * （每行 path + 各自计数）。类名走 [class*=] 模糊匹配，与真实 hashed class 相容。
 */
function changedFilesCard(files: { path: string, added: number, deleted: number }[], header?: { added: number, deleted: number }): HTMLElement {
  const card = document.createElement('div')
  card.setAttribute('data-changed-files', '')
  const stat = document.createElement('div')
  stat.className = 'kuvljq_stat'
  stat.innerHTML = `<span class="kuvljq_title">已编辑 ${files.length} 个文件</span>`
    + `<span class="kuvljq_counts"><b class="kuvljq_added">+${header?.added ?? files.reduce((s, f) => s + f.added, 0)}</b>`
    + `<b class="kuvljq_deleted">−${header?.deleted ?? files.reduce((s, f) => s + f.deleted, 0)}</b></span>`
  const list = document.createElement('div')
  list.className = 'kuvljq_list'
  for (const file of files) {
    const row = document.createElement('button')
    row.innerHTML = `<span class="kuvljq_path">${file.path}</span>`
      + `<span class="kuvljq_counts"><span class="kuvljq_added">+${file.added}</span><span class="kuvljq_deleted">−${file.deleted}</span></span>`
    list.append(row)
  }
  card.append(stat, list)
  return card
}

/** 宿主工具行最小复刻。 */
function toolRow(variant: string, path: string | null): HTMLElement {
  const row = document.createElement('div')
  row.setAttribute('data-tool', variant === 'write' ? 'write' : 'edit')
  row.setAttribute('data-variant', variant)
  if (path !== null) row.innerHTML = `<a class="pFy1Ka_fileLink" href="#">${path}</a>`
  return row
}

describe('parseChangedFilesCard', () => {
  it('按行解析路径与各自 +/-，合计优先行求和', () => {
    const card = changedFilesCard([
      { path: '复习正文.md', added: 254, deleted: 0 },
      { path: 'build_review.py', added: 58, deleted: 2 },
    ])
    const parsed = parseChangedFilesCard(card)
    expect(parsed.files.map(f => f.path)).toEqual(['复习正文.md', 'build_review.py'])
    expect(parsed.files[1].added).toBe(58)
    expect(parsed.files[1].deleted).toBe(2)
    expect(parsed.added).toBe(312)
    expect(parsed.deleted).toBe(2)
    expect(parsed.files[0].target).toBe(card.querySelector('.kuvljq_list > button'))
  })

  it('行没带计数时退回卡头合计（宿主可能折叠文件列表）', () => {
    const card = changedFilesCard([{ path: 'a.md', added: 0, deleted: 0 }], { added: 315, deleted: 4 })
    const parsed = parseChangedFilesCard(card)
    expect(parsed.added).toBe(315)
    expect(parsed.deleted).toBe(4)
  })

  it('兼容 U+2212 与 ASCII 计数', () => {
    const card = changedFilesCard([{ path: 'a.md', added: 0, deleted: 0 }], { added: 7, deleted: 0 })
    card.querySelector('.kuvljq_added')!.textContent = '+315'
    expect(parseChangedFilesCard(card).added).toBe(315)
  })
})

describe('collectActivity', () => {
  it('跨轮合并同一文件并累计 +/-，定位指向最新一轮', () => {
    const root = document.createElement('div')
    const first = changedFilesCard([{ path: 'a.md', added: 10, deleted: 1 }])
    const second = changedFilesCard([{ path: 'a.md', added: 5, deleted: 2 }, { path: 'b.py', added: 3, deleted: 0 }])
    root.append(first, second)
    const { changes } = collectActivity(root)
    expect(changes.files).toHaveLength(2)
    const a = changes.files.find(f => f.path === 'a.md')!
    expect(a.added).toBe(15)
    expect(a.deleted).toBe(3)
    expect(a.target).toBe(second.querySelector('.kuvljq_list > button')) // 最新一轮的行
    expect(changes.latestCard).toBe(second)
    expect(changes.added).toBe(18)
    expect(changes.deleted).toBe(3)
  })

  it('输出 = 呈现文件（自述优先）∪ 写/编辑工具行，按路径去重；布尔标记从容退化到行内容', () => {
    const root = document.createElement('div')
    const presented = document.createElement('div')
    presented.setAttribute('data-presented-file', '手册.html')
    presented.setAttribute('data-presented-description', '可离线打开的复习手册')
    // 真机 DOM：属性是布尔标记，显示名在 [class*=fileName]，完整路径在 cardPreview 的 title。
    const flagged = document.createElement('div')
    flagged.setAttribute('data-presented-file', 'true')
    flagged.innerHTML = '<button class="kuvljq_cardPreview" X></button>'
      + '<span class="kuvljq_fileName">笔记.md</span>'
    const tool = toolRow('write', '手册.html')
    const edit = toolRow('edit', '笔记.md')
    root.append(presented, flagged, tool, edit)
    const { outputs } = collectActivity(root)
    expect(outputs).toHaveLength(2)
    expect(outputs[0]).toMatchObject({ path: '手册.html' })
    expect(outputs[1]).toMatchObject({ path: '笔记.md' })
    expect(outputs[1].tooltip).toBeUndefined()
    expect(outputs[0].target).toBe(presented)
  })

  it('来源去重、去掉 hash、排除用户回显、本机与内网地址', () => {
    const root = document.createElement('div')
    const userEcho = document.createElement('div')
    userEcho.setAttribute('data-submission-echo', '')
    userEcho.innerHTML = '<a href="https://user-pasted.example.com/a">我贴的</a>'
    const assistant = document.createElement('div')
    assistant.innerHTML = [
      '<a href="https://deepseek.example.net/docs/intro#section">文档</a>',
      '<a href="https://deepseek.example.net/docs/intro">同页不同 hash</a>',
      '<a href="http://localhost:3000/dev">本机</a>',
      '<a href="http://192.168.100.129:3000/">内网开发服务器</a>',
      '<a href="https://arxiv.org/abs/2401.0000">论文</a>',
    ].join('')
    root.append(userEcho, assistant)
    const { sources } = collectActivity(root)
    expect(sources.map(s => s.url)).toEqual([
      'https://deepseek.example.net/docs/intro',
      'https://arxiv.org/abs/2401.0000',
    ])
    expect(sources[0].label).toBe('deepseek.example.net')
    expect(sources[0].target).toBe(assistant.querySelector('a'))
  })

  it('空会话返回全空的三段', () => {
    const summary = collectActivity(document.createElement('div'))
    expect(summary.changes.files).toHaveLength(0)
    expect(summary.changes.latestCard).toBeNull()
    expect(summary.outputs).toHaveLength(0)
    expect(summary.sources).toHaveLength(0)
  })
})
