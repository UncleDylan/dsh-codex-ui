/**
 * 直接和宿主的模型目录服务打交道：读当前模型的档位、提交档位。
 *
 * 走服务而不是点菜单行有两个根本好处：
 * 一、档位不用再借「推理等级」面板探测，卡片第一次出现就是完整形态，不会闪；
 * 二、提交档位不经过宿主的菜单组件，它也就不会把菜单关掉，滑轨能原地做补间动画。
 *
 * 服务缺失、会话对不上或模型没有推理元数据时一律返回 undefined，由调用方回退到点菜单行的老路径。
 */

/** 宿主档位的一个等级：`effort` 为空表示「提供方默认值」。 */
export type EffortLevel = { readonly id?: string; readonly label: string }

export type ModelEffortView = {
  /** 档位标签，顺序与宿主「推理等级」面板一致。 */
  readonly levels: readonly EffortLevel[]
  /** 当前生效档位的下标。 */
  readonly index: number
  /** 宿主正在结算上一次选择。 */
  readonly busy: boolean
}

export type ModelEffortBridge = {
  read(): ModelEffortView | undefined
  select(index: number): Promise<boolean>
}

type DirectoryState = {
  current?: { provider: string, model: string, reasoningEffort?: string } | null
  groups?: readonly { id: string, models: readonly ModelLike[] }[]
  pending?: unknown
}

type ModelLike = {
  id: string
  reasoning?: { defaultEffort?: string, efforts?: readonly { id: string, name: string }[] }
}

type Directory = {
  store: { getSnapshot(): DirectoryState }
  select(selection: { provider: string, model: string, reasoningEffort?: string }): Promise<{ ok: boolean } | undefined>
}

type Directories = { directoryFor(sessionId: string): Directory | undefined }

/**
 * 模型公布的具名档位。宿主菜单在模型没有配置默认档位时会在最前面插一行「Default」，
 * 但那不是档位——它表示「不发送推理参数，用提供方自己的默认」，对声明了 off（不填
 * 参数值）的手配模型来说和 off 是同一个请求，铺出来只会是一格模糊不清的重复项。
 * 滑轨只铺具名档位，与默认档位的语义留给「当前生效值落在哪个具名档位」来表达。
 */
function levelsOf(reasoning: ModelLike['reasoning']): EffortLevel[] {
  if (reasoning === undefined) return []
  return (reasoning.efforts ?? []).map(level => ({ id: level.id, label: level.name }))
}

/**
 * @param service 按名字取客户端服务（通常是 `ctx.get`）。
 * @param session 当前会话 id；菜单属于当前会话，档位也按它会话取。
 */
export function createModelEffortBridge(service: (name: string) => unknown, session: () => string | undefined): ModelEffortBridge {
  const directory = (): Directory | undefined => {
    const directories = service('modelDirectories') as Directories | undefined
    const id = session()
    if (directories === undefined || id === undefined || typeof directories.directoryFor !== 'function') return undefined
    try {
      return directories.directoryFor(id)
    } catch {
      // 会话还没绑定到目录（例如正在切换会话）：这一帧就当读不到。
      return undefined
    }
  }

  const view = (): { model?: ModelLike, current: NonNullable<DirectoryState['current']>, state: DirectoryState } | undefined => {
    const state = directory()?.store.getSnapshot()
    const current = state?.current
    if (state === undefined || current === undefined || current === null) return undefined
    const model = state.groups?.find(group => group.id === current.provider)?.models.find(entry => entry.id === current.model)
    return { model, current, state }
  }

  return {
    read() {
      const found = view()
      if (found === undefined) return undefined
      const { model, current, state } = found
      const reasoning = model?.reasoning
      const busy = state.pending !== undefined && state.pending !== null
      const levels = levelsOf(reasoning)
      const effective = current.reasoningEffort ?? reasoning?.defaultEffort
      const at = levels.findIndex(level => level.id === effective)
      return { levels, index: at < 0 ? 0 : at, busy }
    },
    async select(index) {
      const found = view()
      if (found === undefined) return false
      const { model, current } = found
      const ids = levelsOf(model?.reasoning).map(level => level.id)
      const target = directory()
      if (target === undefined) return false
      const effort = ids[index]
      try {
        const result = await target.select({ provider: current.provider, model: current.model, ...effort === undefined ? {} : { reasoningEffort: effort } })
        return result?.ok === true
      } catch {
        return false
      }
    },
  }
}
