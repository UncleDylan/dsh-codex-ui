<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Codex UI" width="100%">
</p>

<div align="center">

  # DSH Codex UI (Dylan Fork)

  **Organize projects, find conversations, and revisit long chats more easily in DSH Web**

  [简体中文](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40uncledylan%2Fdsh-codex-ui.svg?label=npm%20package)](https://www.npmjs.com/package/@uncledylan/dsh-codex-ui)
  [![Upstream: MichengAI](https://img.shields.io/badge/fork%20of-MichengAI%2Fdsh--codex--ui-8250df.svg)](https://github.com/MichengAI/dsh-codex-ui)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/UncleDylan/dsh-codex-ui)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> A community-maintained interface plugin for DeepSeek Harness (DSH), not an official DeepSeek AI product.

## About this fork

This project is a secondary-development fork of [**MichengAI/dsh-codex-ui**](https://github.com/MichengAI/dsh-codex-ui) (v1.1.47), originally created by **迷城 (MichengAI)** and released under the [Apache License 2.0](LICENSE). All credit for the original architecture — the Codex-style sidebar, workspace session tree, global search, turn navigation, and the companion-plugin ecosystem — belongs to the upstream author. This fork continues that work with its own interface overhaul, published under the `@uncledylan` npm scope.

**Do not enable this fork and the upstream original (`@michengai/dsh-codex-ui`) at the same time.** Both take over the same official sidebar and settings slots, so only one may own the UI.

### Major changes in this fork (1.2.0)

- **Codex-parity interface overhaul** — the whole client surface is reworked to match the OpenAI Codex desktop layout:
  - **Narrow rail**: the collapsed sidebar keeps only high-frequency actions; a Codex-style `···` popover holds the management entries (experts, skills, connectors).
  - **Window-level actions moved into the title bar**, and `←`/`→` act as browser-style history navigation across sessions.
  - **Tabler icon family**: host-facing icons are redrawn as Tabler icons on a shared 20px/1.5 grid.
- **Activity summary card**: changes, outputs, and sources from the whole conversation are aggregated into a Codex-spec summary card (read-only over host-rendered content).
- **Model & reasoning card**: the host's model/reasoning-level menu becomes a Codex-style card with a draggable segmented slider, wired through the host model-catalog service with a graceful menu-based fallback.
- **Image Studio panel**: a dedicated image-generation mode with an inspiration-template wall, talking directly to the `dsh-image-gen` studio route.
- **Running indicator**: the "thinking" status icon is replaced with a MatrixOrb-style dot-matrix animation.
- **Full-access accent**: the "Full access" permission label gets Codex's brand-orange accent.
- **New conversation page**: workspace question chips guide the first prompt; the old suggestion cards were removed in favor of them.
- **Chat scrollbar**: themed overlay scrollbar for the conversation area.
- **Wider host compatibility**: peer ranges accept `>=0.2.1-rc.1 <0.3.0-0` instead of pinning exact RC versions.
- **Full re-identification**: npm scope (`@uncledylan`), locale namespace, storage keys, log prefixes, and internal IDs are all `uncledylan`-branded so the fork never collides with upstream state.

## Host compatibility

Version `1.2.0` supports DSH `0.2.0-rc.1`, `0.2.0-rc.2`, and any host in the `>=0.2.1-rc.1 <0.3.0-0` range (currently `0.2.1-rc.1` and `0.2.1-rc.2`). Development dependencies are pinned to `0.2.1-rc.2`. Compatibility declarations do not imply that every supported host received a fresh live test in this release.

**Do not enable Codex UI and `ds-bot` together.** Both redesign the sidebar and conversation interface, so their slot ownership and layout styles overlap. Disable or uninstall one before using the other.

## What you can do

- **Organize projects and conversations**: expand or collapse projects, drag to reorder, pin frequently used projects, and see unread and running indicators.
- **Find things quickly**: search for conversations, settings, and quick actions from the header.
- **Manage everyday tasks**: rename, archive, or fork conversations, and open project folders from their menus.
- **Revisit long chats**: select a turn marker to jump directly to the corresponding question, or step through history with `←`/`→`.
- **Reuse earlier input**: press Up/Down in an empty composer to recall text submitted in the current workspace.
- **Generate images**: switch to Image Studio to compose prompts from inspiration templates and generate directly through the host's image-gen studio route.
- **Add features as needed**: check companion plugins in **Settings → About** and install or update the ones you need.

## Screenshots

Light theme: workspace tree, new conversation page, and bottom composer.

![Light theme new conversation](assets/screenshots/conversation-light.png)

Dark theme: scheduled task overview and new conversation page.

![Dark theme new conversation](assets/screenshots/conversation.png)

General settings: dedicated settings page with section navigation in the light theme.

![Light theme general settings](assets/screenshots/settings-general-light.png)

Conversation menu: rename, pin, unread, archive, fork, copy, and delete.

![Conversation menu](assets/screenshots/session-menu.png)

**Settings → About** lists the companion plugins and their install state.

![About page and companion plugins](assets/screenshots/settings-about.png)

## Prerequisites

- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Node.js must satisfy `^22.19.0 || >=24.0.0`. Installing from source also requires pnpm.

## Upstream ecosystem

The companion plugins below are maintained by the upstream author [MichengAI](https://github.com/MichengAI) and remain fully compatible with this fork — install them from their own repositories or through **Settings → About** in this plugin. For a desktop workbench, see [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases).

| Plugin | What you can do |
| --- | --- |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Choose and summon specialists for your task |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Find, enable, create, and import local skills |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Search, restore, or clean up archived conversations |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Send tasks and receive replies through messaging platforms |
| [Automation](https://github.com/MichengAI/dsh-automation) | Schedule tasks and review each run |
| [BTW](https://github.com/MichengAI/dsh-btw) | Ask side questions without interrupting the main task |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Use `/simplify` to improve code within your Git changes |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guide the Agent to try new approaches after failures, investigate causes, and verify results before completion |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Use `/review` to request an independent Agent code review and receive the report in the current conversation |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | View conversation notifications and respond to tool approvals and questions through a desktop pet |

## Installation

Choose agent-assisted or manual installation below. Both use the same command, requesting the latest version from the official npm registry.

### Ask an agent to install it (recommended)

Send the prompt below to any agent that can run terminal commands on your computer. Replace `web` with your actual profile. Once installed, use the plugin in DSH.

```text
Install the DSH plugin @uncledylan/dsh-codex-ui into my local web profile by running: dsh plugin --profile web add @uncledylan/dsh-codex-ui@latest --registry=https://registry.npmjs.org/. Then run dsh --profile web --dump-config, confirm the configuration includes codex-ui, and explain how to reload DSH and start using the plugin.
```

### Install manually

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @uncledylan/dsh-codex-ui@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Restart DSH Web and hard-refresh the browser (usually `Ctrl+Shift+R`). Once the new sidebar appears, you are ready to use it. Disabling or uninstalling restores the official sidebar. If the profile `cordis.patch.yml` still has `disabled: true` for `ui-sidebar` or `ui-settings-general`, delete those rows and reload.

> Switching from the upstream original? Uninstall `@michengai/dsh-codex-ui` first (`dsh plugin --profile web remove @michengai/dsh-codex-ui`), then install this fork. The two own the same slots and must not run together.

## Usage

Open DSH Web. The left navigation is rendered by this plugin.

| Goal | Action |
| --- | --- |
| Start a conversation | Select **New task**, or use a workspace **+** / **New conversation** action. |
| Find a conversation or setting | Use the header search field and choose a session, Settings page, or quick action. |
| Collapse the sidebar | Use the header panel button. The collapsed rail keeps high-frequency actions; `···` opens the management popover. |
| Pin a workspace | Drag it into **Pinned**, or use **Pin project** in the project menu. |
| Manage a conversation | Open the conversation menu to rename, pin, mark unread, archive, fork, copy, or delete. |
| Reuse input | Press Up/Down in an empty composer to recall text submitted in the current workspace. |
| Jump between turns | Use the turn marks on the left of the current conversation, or `←`/`→` for browser-style history. |
| Generate an image | Open the Image Studio mode in the composer and pick an inspiration template. |
| Inspect connectors | Open **Settings → Connectors**. Addresses, commands, and credentials are never shown. |
| Check companion plugins | Open **Settings → About** to install or update individual companion plugins. |

## FAQ

### Do pinned projects and unread markers persist?

Pinned projects are saved in your DSH configuration and survive restarts. Unread markers are stored only in the current browser and do not sync across browsers.

### Why is my earlier input missing?

Input history is stored in the current browser, separately for each workspace, with up to 200 entries per workspace. It records new input while the feature is active and does not import existing conversations. When browser storage is unavailable, history is kept temporarily in memory. The BTW plugin is not required.

### Does removing a project delete local files?

Removing a workspace registration does not delete its folder or conversation records. Permanent deletion of archived conversations is provided by the companion Archive Manager plugin.

### Can I run this fork and the upstream original side by side?

No. Both plugins claim the same official sidebar and settings slots, so enabling both leaves the UI ownership ambiguous. Keep exactly one enabled.

### What if nothing changes after installation?

Check that the installation profile matches the one running DSH Web, then restart DSH Web and hard-refresh the browser. Run `dsh --profile web --dump-config` to check that `codex-ui` is mounted.

## Development and contributing

真实宿主启停验收使用 `pnpm run test:fallback-host`，需设置 `DCU_DSH_BIN` 指向完整宿主 CLI；该命令在隔离 profile 验证侧栏回退，不调用模型，不属于默认 `pnpm test` 的验收范围。

GitHub and npm both include a ready-to-run `lib`. After changing source, run `pnpm build` before committing.

### Install from source

Use this for debugging or unpublished changes. The cloned directory becomes the plugin source path:

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

Restart DSH Web and hard-refresh the browser. Do not copy `lib` manually; local installation reads both package metadata and `cordis.patch.yml`.

- [src\index.ts](src/index.ts): host entry and the non-sensitive Connectors directory endpoint.
- [src\client\index.ts](src/client/index.ts): client entry for sidebar, workspace tree, turn navigation, and Settings sections.
- [src\client\SidebarRail.tsx](src/client/SidebarRail.tsx): collapsed-rail items and the `···` management popover.
- [src\client\activity-summary.ts](src/client/activity-summary.ts): read-only aggregation behind the activity summary card.
- [src\client\model-menu-card.ts](src/client/model-menu-card.ts): Codex-style model/reasoning card over the host menu.
- [src\client\ImageStudioPanel.tsx](src/client/ImageStudioPanel.tsx): image-generation mode panel.
- `tests\*.assert.ts` and `tests\*.spec.ts`: interaction, visual, and runtime integration checks.

After changing `src`, rebuild, test, and install from the local directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
dsh plugin --profile web add .
```

New features should reuse existing DSH slots and public services. Do not depend on private host DOM or write conversation records.

## Credits

The image studio's loading animation ([GridReveal](https://www.rareui.com/components/gridreveal)) is ported from [Rare UI](https://www.rareui.com) (repo: [swamimalode07/rare-ui](https://github.com/swamimalode07/rare-ui)), MIT with the Commons Clause. Rare UI requires a visible credit wherever a component ships — this section is that credit.

## License

This project is licensed under [Apache License 2.0](LICENSE), as is the upstream original. Upstream © 迷城 (MichengAI); fork modifications © 2026 UncleDylan.
