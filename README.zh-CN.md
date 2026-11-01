<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Codex UI" width="100%">
</p>

<div align="center">

  # DSH Codex UI（Dylan 二开版）

  **让 DSH Web 中的项目更好整理、会话更快找到、长对话更易回看**

  [English](README.md) · [更新日志](CHANGELOG.zh-CN.md) · [Apache-2.0](LICENSE)

  [![许可证：Apache-2.0](https://img.shields.io/badge/许可证-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40uncledylan%2Fdsh-codex-ui.svg?label=npm%20package)](https://www.npmjs.com/package/@uncledylan/dsh-codex-ui)
  [![上游项目](https://img.shields.io/badge/fork%20of-MichengAI%2Fdsh--codex--ui-8250df.svg)](https://github.com/MichengAI/dsh-codex-ui)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/UncleDylan/dsh-codex-ui)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex UI 是社区维护的 DeepSeek Harness（DSH）界面增强插件，并非 DeepSeek AI 官方产品。

## 关于本 fork

本项目基于 [**MichengAI/dsh-codex-ui**](https://github.com/MichengAI/dsh-codex-ui)（v1.1.47）二次开发。原项目由 **迷城（MichengAI）** 创建并按 [Apache License 2.0](LICENSE) 开源，Codex 风格侧栏、工作区会话树、全局搜索、轮次导航以及配套插件生态的原创设计均归上游作者所有。本 fork 在其基础上完成了整体界面改造，以 `@uncledylan` npm scope 独立发布。

**不要同时启用本 fork 与上游原版（`@michengai/dsh-codex-ui`）。** 两者接管相同的官方侧栏与设置插槽，同一时间只能由一个插件拥有界面。

### 本 fork 的重大修改（1.2.0）

- **Codex 对标界面改造**——整个客户端表面按 OpenAI Codex 桌面端布局重做：
  - **窄栏（Rail）**：折叠态只保留高频动作，Codex 同款 `···` 浮窗收纳管理入口（专家、技能、连接器）。
  - **窗口级操作移入标题栏**，`←`/`→` 作为浏览器式历史导航在会话间切换。
  - **图标整族 Tabler 化**：面向宿主的图标按 20px/1.5 网格统一重绘为 Tabler 图标。
- **活动摘要卡**：整个会话的变更、输出与来源聚合为一张 Codex 规格摘要卡（只读宿主已渲染内容）。
- **模型与推理力度卡片**：宿主「模型 / 推理等级」两行菜单换成 Codex 卡片与可拖拽分段滑轨，走宿主模型目录服务，服务缺失时优雅回退到菜单方式。
- **生图工作台（Image Studio）**：独立生图模式，灵感模板卡墙选图，生成直连宿主 `dsh-image-gen` studio 路由。
- **运行指示动画**：「思考中」状态图标换成 MatrixOrb 风格点阵动画。
- **完全权限强调**：「完全权限」权限标签使用 Codex 品牌橙强调。
- **新会话页**：工作区问题引导（chips）帮助组织第一个提问，取代旧的建议卡片。
- **会话区滚动条**：为对话区域提供主题化覆盖滚动条。
- **更宽的宿主兼容区间**：peer 依赖放宽为 `>=0.2.1-rc.1 <0.3.0-0`，不再逐个钉死 RC 版本。
- **身份全面重命名**：npm scope（`@uncledylan`）、locale 命名空间、存储 key、日志前缀与内部 ID 全部更换，与上游状态互不冲突。

## 宿主兼容性

`1.2.0` 支持 DSH `0.2.0-rc.1`、`0.2.0-rc.2`，以及 `>=0.2.1-rc.1 <0.3.0-0` 区间内的宿主（当前为 `0.2.1-rc.1` 和 `0.2.1-rc.2`）。开发依赖钉在 `0.2.1-rc.2`。兼容范围声明不代表本次发布重新完成了所有宿主版本的实机测试。

**不要同时启用 Codex UI 与 `ds-bot`。** 两者都重绘侧栏与会话界面，插槽归属和布局样式高度重叠。使用其中一个前，请先停用或卸载另一个。

## 你可以用它做什么

- **整理项目与会话**：展开或折叠项目、拖拽调整顺序、置顶常用项目，查看未读提醒和运行状态。
- **快速找到内容**：通过顶部搜索查找会话、设置和快捷操作。
- **管理日常任务**：在项目或会话菜单中重命名、归档、派生会话，或打开项目目录。
- **回看长对话**：点击轮次导航跳到对应提问，或用 `←`/`→` 按历史顺序切换。
- **复用之前的输入**：输入框为空时，按上下方向键找回当前工作区中已提交的文本。
- **生成图片**：切换到生图工作台，从灵感模板组织提示词，直接通过宿主 image-gen studio 路由生成。
- **按需扩展功能**：在「设置 → 关于」查看配套插件，安装或更新需要的功能。

## 界面预览

浅色主题：工作区会话树、新会话页与底部输入框。

![浅色主题新会话](assets/screenshots/conversation-light.png)

深色主题：定时任务总览与新会话页。

![深色主题新会话](assets/screenshots/conversation.png)

通用设置：独立设置页与分区导航（浅色主题）。

![浅色主题通用设置](assets/screenshots/settings-general-light.png)

会话菜单：重命名、置顶、未读、归档、派生、复制与删除。

![会话菜单](assets/screenshots/session-menu.png)

**「设置 → 关于」**展示配套插件及安装状态。

![关于页与配套插件](assets/screenshots/settings-about.png)

## 使用前提

- 已安装可用的 DeepSeek Harness Web，PowerShell 中可直接运行 `dsh`。
- 示例使用 `web` profile，请按实际情况替换。
- Node.js 需满足 `^22.19.0 || >=24.0.0`；从源码安装还需 pnpm。

## 上游生态

下列配套插件由上游作者 [MichengAI](https://github.com/MichengAI) 维护，与本 fork 完全兼容——可从各仓库安装，也可通过本插件的「设置 → 关于」安装。桌面工作台请见 [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases)。

| 插件 | 功能 |
| --- | --- |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 为任务选择并召唤专家 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | 查找、启用、创建与导入本地技能 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | 搜索、恢复或清理已归档会话 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 通过即时通讯平台发送任务并接收回复 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 定时任务与每次运行回顾 |
| [BTW](https://github.com/MichengAI/dsh-btw) | 不打断主任务地提问边角问题 |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | 用 `/simplify` 改进 Git 变更内的代码 |
| [PUA](https://github.com/MichengAI/dsh-pua) | 引导 Agent 在失败后尝试新思路、排查原因并在完成前验证 |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | 用 `/review` 请求独立 Agent 代码评审并在当前会话接收报告 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | 通过桌面宠物查看会话通知、响应工具审批与提问 |

## 安装

以下两种方式使用同一条命令，从 npm 官方源请求最新版本。

### 让 Agent 帮你安装（推荐）

把下面的提示词发给任何能在你电脑上执行终端命令的 Agent。把 `web` 替换成实际 profile。安装完成后即可在 DSH 中使用插件。

```text
Install the DSH plugin @uncledylan/dsh-codex-ui into my local web profile by running: dsh plugin --profile web add @uncledylan/dsh-codex-ui@latest --registry=https://registry.npmjs.org/. Then run dsh --profile web --dump-config, confirm the configuration includes codex-ui, and explain how to reload DSH and start using the plugin.
```

### 手动安装

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @uncledylan/dsh-codex-ui@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

重启 DSH Web 并强制刷新浏览器（通常是 `Ctrl+Shift+R`）。新侧栏出现即安装成功。停用或卸载后会自动恢复官方侧栏。如果 profile 的 `cordis.patch.yml` 中 `ui-sidebar` 或 `ui-settings-general` 仍是 `disabled: true`，删除对应行后重新加载。

> 从上游原版切换过来？请先卸载 `@michengai/dsh-codex-ui`（`dsh plugin --profile web remove @michengai/dsh-codex-ui`），再安装本 fork。两者抢占相同插槽，不能共存。

## 使用说明

打开 DSH Web，左侧导航即由本插件渲染。

| 目标 | 操作 |
| --- | --- |
| 开始新会话 | 选择「新任务」，或使用工作区的 **+** /「新会话」动作。 |
| 查找会话或设置 | 使用顶部搜索，选择会话、设置页或快捷操作。 |
| 折叠侧栏 | 使用顶部面板按钮。折叠后的窄栏保留高频动作；`···` 打开管理浮窗。 |
| 置顶工作区 | 拖入「已置顶」分组，或在项目菜单中选择「置顶项目」。 |
| 管理会话 | 打开会话菜单：重命名、置顶、标为未读、归档、派生、复制或删除。 |
| 复用输入 | 输入框为空时按上下方向键，找回当前工作区已提交的文本。 |
| 会话间跳转 | 使用会话左侧轮次标记，或 `←`/`→` 浏览器式历史导航。 |
| 生成图片 | 在输入区打开生图工作台模式，选择灵感模板。 |
| 查看连接器 | 打开「设置 → 连接器」。地址、命令与凭据均不会展示。 |
| 管理配套插件 | 打开「设置 → 关于」安装或更新各个配套插件。 |

## 常见问题

### 置顶项目和未读标记会持久保存吗？

置顶项目保存在 DSH 配置中，重启后仍在。未读标记只保存在当前浏览器中，不同浏览器之间不同步。

### 之前的输入为什么不见了？

输入历史保存在当前浏览器中，按工作区隔离，每个工作区最多 200 条。功能启用期间记录新输入，不会导入已有会话。浏览器存储不可用时，历史临时保存在内存中。该功能不依赖 BTW 插件。

### 移除项目会删除本地文件吗？

移除工作区注册不会删除其文件夹或会话记录。已归档会话的彻底删除由配套的 Archive Manager 插件提供。

### 本 fork 和上游原版能同时运行吗？

不能。两者声明了相同的官方侧栏与设置插槽，同时启用会导致界面归属混乱，请只保留一个。

### 安装后界面没有变化？

确认安装 profile 与运行 DSH Web 的 profile 一致，然后重启 DSH Web 并强制刷新浏览器。运行 `dsh --profile web --dump-config` 确认 `codex-ui` 已挂载。

## 开发与贡献

真实宿主启停验收使用 `pnpm run test:fallback-host`，需设置 `DCU_DSH_BIN` 指向完整宿主 CLI；该命令在隔离 profile 验证侧栏回退，不调用模型，不属于默认 `pnpm test` 的验收范围。

GitHub 和 npm 都附带可直接使用的 `lib`。修改源码后、提交前请先运行 `pnpm build`。

### 从源码安装

用于调试或未发布的改动。克隆后的目录即插件源码路径：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location D:\Repository
git clone https://github.com/UncleDylan/dsh-codex-ui.git
Set-Location .\dsh-codex-ui
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

重启 DSH Web 并强制刷新浏览器。不要手动复制 `lib`；本地安装会同时读取包元数据和 `cordis.patch.yml`。

- [src\index.ts](src/index.ts)：宿主入口与非敏感的连接器目录端点。
- [src\client\index.ts](src/client/index.ts)：客户端入口，负责侧栏、工作区会话树、轮次导航与设置分区。
- [src\client\SidebarRail.tsx](src/client/SidebarRail.tsx)：折叠窄栏条目与 `···` 管理浮窗。
- [src\client\activity-summary.ts](src/client/activity-summary.ts)：活动摘要卡的只读聚合层。
- [src\client\model-menu-card.ts](src/client/model-menu-card.ts)：宿主菜单之上的 Codex 风格模型/推理力度卡片。
- [src\client\ImageStudioPanel.tsx](src/client/ImageStudioPanel.tsx)：生图模式面板。
- `tests\*.assert.ts` 与 `tests\*.spec.ts`：交互、视觉与运行时集成检查。

修改 `src` 后，重新构建、测试并从本地目录安装：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
dsh plugin --profile web add .
```

新功能应复用 DSH 现有插槽与公开服务，不依赖宿主私有 DOM，也不写入会话记录。

## 许可证

本项目与上游原版均基于 [Apache License 2.0](LICENSE) 开源。上游 © 迷城（MichengAI）；fork 修改部分 © 2026 UncleDylan。
