window.__ModuleLoader__.load({
	id: "@uncledylan/dsh-codex-ui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		_deepseek_ai_dsh_client_ui_primitives = __toESM(_deepseek_ai_dsh_client_ui_primitives, 1);
		let react_dom = require("react-dom");
		//#region src/client/session-host.ts
		var UnknownSessionError = class extends Error {
			constructor() {
				super("unknown session");
				this.name = "UnknownSessionError";
			}
		};
		/** 旧宿主读 list.current；alpha.2 主视图改由 retainedBy.mainView 标记。 */
		function currentSessionId(state) {
			if (state === void 0) return void 0;
			if (typeof state.current === "string" && state.current !== "") return state.current;
			const byId = state.byId ?? {};
			const ids = Array.isArray(state.ids) && state.ids.length > 0 ? state.ids : Object.keys(byId);
			const pick = (id, row) => {
				if (row === void 0 || (row.retainedBy?.mainView ?? 0) <= 0) return void 0;
				const explicit = row.id?.trim();
				return explicit !== void 0 && explicit !== "" ? explicit : id;
			};
			for (const id of ids) {
				const found = pick(id, byId[id]);
				if (found !== void 0) return found;
			}
			for (const id of Object.keys(byId)) {
				if (ids.includes(id)) continue;
				const found = pick(id, byId[id]);
				if (found !== void 0) return found;
			}
		}
		/** 官方树在全局面板打开时取消会话选中。 */
		function visibleSelectedSessionId(state, panelActive = false) {
			return panelActive ? void 0 : currentSessionId(state);
		}
		function sessionRowUnread(localUnread, status, selected = false) {
			return localUnread || status?.completionUnread === true && !selected;
		}
		function sessionRunningFlags(byId, status) {
			const ids = new Set(Object.keys(byId));
			if (status !== void 0) for (const id of status.keys()) ids.add(id);
			const next = {};
			for (const id of ids) next[id] = sessionIsRunning(byId[id], status?.get(id));
			return next;
		}
		/** 旧宿主看 current 是否空会话；alpha.2 看主视图 retain 的 blank。 */
		function isBlankOnboardingSession(state) {
			if (state?.phase !== "ready") return false;
			const id = currentSessionId(state);
			return id === void 0 || state.byId?.[id]?.blank === true;
		}
		function hostAccess(ctx) {
			return ctx;
		}
		/** 有 reflect 时只 probe，不能硬读未注入服务，否则 Cordis 会挡住插件激活。 */
		function probeService(ctx, name) {
			if (ctx === void 0) return void 0;
			const access = hostAccess(ctx);
			const reflectGet = access.reflect?.get;
			const hasReflect = typeof reflectGet === "function";
			if (hasReflect) try {
				const found = reflectGet.call(access.reflect, name);
				if (found !== void 0) return found;
			} catch {}
			if (typeof access.get === "function") try {
				const found = access.get(name);
				if (found !== void 0) return found;
			} catch {
				return;
			}
			if (hasReflect) return void 0;
			try {
				return access[name];
			} catch {
				return;
			}
		}
		function isSessionArchived(ctx, id) {
			if (id === "") return false;
			const access = hostAccess(ctx);
			let store;
			try {
				store = probeService(access, "workspaces") ?? access.workspaces;
			} catch {
				return false;
			}
			return store?.list?.getSnapshot?.()?.archivedSessionIds?.includes(id) ?? false;
		}
		function openHostSession(ctx, id) {
			if (id === "") return false;
			if (isSessionArchived(ctx, id)) return false;
			const access = hostAccess(ctx);
			const uiWorkspace = probeService(access, "uiWorkspace");
			if (typeof uiWorkspace?.openSession === "function") try {
				uiWorkspace.openSession(id);
				return true;
			} catch {
				return false;
			}
			if (typeof access.sessions?.retain === "function") return false;
			if (typeof access.sessions?.open === "function") try {
				access.sessions.open(id);
				return true;
			} catch {
				return false;
			}
			return false;
		}
		async function withSessionBinding(sessions, sessionId, operation) {
			const host = sessions === void 0 ? void 0 : hostAccess({ sessions }).sessions;
			if (host === void 0) throw new UnknownSessionError();
			if (typeof host.using === "function") return host.using(sessionId, { source: "controllerOperation" }, async (reference) => {
				if (reference.ready !== void 0) await reference.ready;
				if (reference.binding === void 0) throw new UnknownSessionError();
				return operation(reference.binding);
			});
			const existing = host.binding?.(sessionId);
			if (existing !== void 0) return operation(existing);
			if (typeof host.retain !== "function") throw new UnknownSessionError();
			const reference = host.retain(sessionId, { source: "controllerOperation" });
			try {
				if (reference.ready !== void 0) await reference.ready;
				if (reference.binding === void 0) throw new UnknownSessionError();
				return await operation(reference.binding);
			} finally {
				reference.release?.();
			}
		}
		async function renameHostSession(ctx, sessionId, title) {
			await withSessionBinding(hostAccess(ctx).sessions, sessionId, async (binding) => {
				if (typeof binding.session?.rename !== "function") throw new UnknownSessionError();
				const result = await binding.session.rename(title);
				if (result.ok === false) throw result.error ?? /* @__PURE__ */ new Error("rename failed");
			});
		}
		async function forkHostSession(ctx, sessionId) {
			const access = hostAccess(ctx);
			const uiWorkspace = probeService(access, "uiWorkspace");
			if (typeof uiWorkspace?.forkSession === "function") {
				await uiWorkspace.forkSession(sessionId);
				return;
			}
			const childId = await access.sessions?.fork?.({
				sessionId,
				increaseTitle: true
			});
			if (typeof childId === "string" && childId !== "") openHostSession(access, childId);
		}
		async function archiveHostSession(ctx, sessionId) {
			const access = hostAccess(ctx);
			const uiWorkspace = probeService(access, "uiWorkspace");
			if (typeof uiWorkspace?.archiveSession === "function") {
				await uiWorkspace.archiveSession(sessionId);
				return;
			}
			await access.workspaces?.archiveSession?.(sessionId);
		}
		function mergePendingInteractions(legacy, status) {
			const next = new Map(legacy);
			for (const [id, row] of status) if (row?.pendingInteraction !== void 0) next.set(id, row.pendingInteraction);
			return next;
		}
		function sessionIsRunning(session, status) {
			if (status?.running !== void 0) return status.running === true;
			return session?.running === true;
		}
		//#endregion
		//#region src/client/session-navigation.ts
		function openConversation(host, layout, id) {
			const opened = openHostSession(host, id);
			if (opened) selectGlobalPanel(layout, null);
			return opened;
		}
		/** 归档判断必须先于 byId：已释放的归档会话不在 byId，直接 wait 会让深链永远清不掉。 */
		function deepLinkAction(byId, archived, sessionId) {
			if (archived) return "clean";
			return byId[sessionId] === void 0 ? "wait" : "open";
		}
		/** 先打开再写草稿，避免 using 释放后 composer 换新 binding。 */
		async function openConversationWithDraft(host, layout, sessions, sessionId, writeDraft) {
			return withSessionBinding(sessions, sessionId, (binding) => {
				const opened = openConversation(host, layout, sessionId);
				writeDraft(binding);
				return opened;
			});
		}
		/** 统一检测旧宿主是否提供面板切换能力，保留宿主方法的 this。 */
		function selectGlobalPanel(layout, id) {
			if ("selectPanel" in layout && typeof layout.selectPanel === "function") layout.selectPanel(id);
		}
		//#endregion
		//#region src/client/navigation-history.ts
		/** Follow host session selections without navigating the Electron document history. */
		function createNavigationHistory(store, open) {
			let entries = [];
			let index = -1;
			let pending;
			let navigating = false;
			let snapshot = {
				canBack: false,
				canForward: false
			};
			const listeners = /* @__PURE__ */ new Set();
			let viewHandlers;
			const isSession = (location) => location?.kind === "session";
			const target = (direction) => {
				for (let next = index + direction; next >= 0 && next < entries.length; next += direction) {
					const entry = entries[next];
					if (entry.kind === "settings" ? viewHandlers !== void 0 : store.getSnapshot().byId?.[entry.id] !== void 0) return next;
				}
			};
			const syncSnapshot = () => {
				const next = {
					canBack: target(-1) !== void 0,
					canForward: target(1) !== void 0
				};
				if (next.canBack === snapshot.canBack && next.canForward === snapshot.canForward) return;
				snapshot = next;
				for (const listener of listeners) listener();
			};
			const update = () => {
				const current = currentSessionId(store.getSnapshot());
				const pendingIndex = pending;
				const pendingEntry = pendingIndex === void 0 ? void 0 : entries[pendingIndex];
				if (current !== void 0 && pendingIndex !== void 0 && pendingEntry !== void 0 && isSession(pendingEntry) && pendingEntry.id === current) {
					index = pendingIndex;
					pending = void 0;
				} else if (!navigating && current !== void 0) {
					const entry = entries[index];
					if (entry === void 0 || entry.kind === "session" && entry.id !== current) {
						entries = entries.slice(0, index + 1);
						entries.push({
							kind: "session",
							id: current
						});
						index = entries.length - 1;
						pending = void 0;
					}
				}
				syncSnapshot();
			};
			const settle = () => {
				window.setTimeout(() => {
					navigating = false;
				}, 0);
			};
			const navigate = (direction) => {
				const next = target(direction);
				if (next === void 0) return;
				const targetEntry = entries[next];
				if (targetEntry.kind === "session") {
					if (isSession(entries[index])) pending = void 0;
					if (entries[index]?.kind === "settings") viewHandlers?.close();
					pending = next;
					try {
						if (!open(targetEntry.id)) pending = void 0;
					} catch (error) {
						pending = void 0;
						throw error;
					}
					update();
					return;
				}
				navigating = true;
				settle();
				if (entries[index]?.kind === "settings") viewHandlers?.close();
				index = next;
				viewHandlers?.open(targetEntry);
				syncSnapshot();
			};
			update();
			const unsubscribe = store.subscribe(update);
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				back: () => {
					navigate(-1);
				},
				forward: () => {
					navigate(1);
				},
				registerView: (handlers) => {
					viewHandlers = handlers;
					syncSnapshot();
					return () => {
						if (viewHandlers === handlers) viewHandlers = void 0;
						syncSnapshot();
					};
				},
				enterView: (location) => {
					if (navigating) return;
					const entry = entries[index];
					if (entry?.kind === "settings") {
						if (entry.section === location.section) return;
						entries = entries.slice(0, index + 1);
						entries.push({
							kind: "settings",
							section: location.section
						});
						index = entries.length - 1;
						syncSnapshot();
						return;
					}
					entries = entries.slice(0, index + 1);
					entries.push({
						kind: "settings",
						section: location.section
					});
					index = entries.length - 1;
					syncSnapshot();
				},
				leaveView: () => {
					if (navigating || entries[index]?.kind !== "settings") return;
					let start = index;
					while (start > 0 && entries[start - 1].kind === "settings") start -= 1;
					if (start !== index) entries = [...entries.slice(0, start), entries[index]];
					index = start - 1;
					pending = void 0;
					syncSnapshot();
				},
				dispose: () => {
					unsubscribe();
					viewHandlers = void 0;
					listeners.clear();
				}
			};
		}
		//#endregion
		//#region src/client/workspace-shortcuts.ts
		function hasBindings(value) {
			const state = value.hooks?.workspaceShortcuts;
			return typeof state?.getSnapshot === "function" && typeof state.subscribe === "function" && typeof value.closeAddWorkspace === "function" && typeof value.setDirectoryBusy === "function" && typeof value.createWorkspace === "function";
		}
		/** Read the official, shadowed registration's public injected face; keep its command IDs and key bindings. */
		function createWorkspaceShortcutSource(slots) {
			let entry;
			let bindings;
			let lastSearch = 0;
			let snapshot = {
				searchRequest: 0,
				addRequested: false
			};
			const listeners = /* @__PURE__ */ new Set();
			let offState = () => {};
			const publish = () => {
				const state = bindings?.hooks.workspaceShortcuts.getSnapshot();
				const searchRequest = snapshot.searchRequest + (state !== void 0 && state.searchRequest !== lastSearch ? 1 : 0);
				lastSearch = state?.searchRequest ?? 0;
				const addRequested = state?.addRequested ?? false;
				if (snapshot.bindings === bindings && snapshot.searchRequest === searchRequest && snapshot.addRequested === addRequested) return;
				snapshot = {
					searchRequest,
					addRequested,
					bindings
				};
				for (const listener of listeners) listener();
			};
			const reconcile = () => {
				const next = slots.entries("sidebar.workspaces").find((row) => row.locale === "workspace");
				if (next === entry) return;
				offState();
				entry = next;
				const injected = next?.inject?.();
				bindings = injected && hasBindings(injected) ? injected : void 0;
				lastSearch = bindings?.hooks.workspaceShortcuts.getSnapshot().searchRequest ?? 0;
				offState = bindings?.hooks.workspaceShortcuts.subscribe(publish) ?? (() => {});
				publish();
			};
			reconcile();
			const offSlots = slots.subscribe("sidebar.workspaces", reconcile);
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				dispose: () => {
					offSlots();
					offState();
					listeners.clear();
				}
			};
		}
		//#endregion
		//#region src/client/workspace-directory-flow.ts
		const WORKSPACE_DIRECTORY_FLOW = "sidebar.codex.directoryFlow";
		/** Give the selected host picker an outlet owned by our sidebar, including while collapsed.
		* Directory pickers have no children; preserve their injected face, locale and store.
		* The registry has erased the original component's types, so only this forwarding boundary
		* uses the erased registration signature. No host implementation or private state is imported.
		*/
		function registerWorkspaceDirectoryFlow(ctx) {
			ctx.slots.inject(WORKSPACE_DIRECTORY_FLOW, () => {
				let entry;
				let offEntry = () => {};
				const register = ctx.slots.register.bind(ctx.slots);
				const reconcile = () => {
					const next = ctx.slots.entriesOfSlot("sidebar.workspaces.directoryFlow")[0];
					if (next === entry) return;
					offEntry();
					offEntry = () => {};
					entry = next;
					if (!next || Object.keys(next.children ?? {}).length > 0) return;
					offEntry = register({
						name: WORKSPACE_DIRECTORY_FLOW,
						inject: next.inject,
						store: next.store,
						locale: next.locale
					}, next.component);
				};
				reconcile();
				const off = ctx.slots.subscribe("sidebar.workspaces.directoryFlow", reconcile);
				return () => {
					off();
					offEntry();
				};
			});
		}
		//#endregion
		//#region src/client/official-slot-shadow.ts
		/**
		* 真实插槽核会在同一轮同步启动里继续挂官方插件。
		* 立刻声明官方也要声明的子插槽，官方注册会抛出且不会重试，停用后官方就回不来。
		* 测试夹具没有 spec，保持同步登记。
		*/
		function registerAfterOfficialWave(slots, slot, officialReady, register, waitForOfficial = false) {
			const face = slots;
			if (typeof face.spec !== "function") return register();
			let remove = () => {};
			let done = false;
			let off = () => {};
			let timer;
			const finish = (timedOut = false) => {
				if (done) return;
				done = true;
				if (timer !== void 0) clearTimeout(timer);
				off();
				if (timedOut) console.warn(`[uncledylan-codex-ui] 等待官方 '${slot}' 注册超时；仅注册自有槽，保留官方共享声明。`);
				remove = register(timedOut);
			};
			if (officialReady()) return register();
			off = face.subscribe?.(slot, () => {
				if (officialReady()) finish(false);
			}) ?? (() => {});
			if (!waitForOfficial) queueMicrotask(() => finish(false));
			else timer = setTimeout(() => finish(true), 3e3);
			return () => {
				done = true;
				if (timer !== void 0) clearTimeout(timer);
				off();
				remove();
			};
		}
		//#endregion
		//#region src/client/settings-navigation.ts
		/**
		* 自有设置壳通过事件直接打开分区，不依赖账号入口的按钮或菜单结构。
		* 保留的宿主设置壳仍从设置入口触发，再按可访问名称选择页面。
		*/
		function pickSettingsSectionButton(buttons, labels) {
			for (const label of labels) {
				const match = buttons.find((button) => button.textContent?.trim() === label);
				if (match !== void 0) return match;
			}
		}
		/**
		* 可选插件未注册设置入口时，直接打开兜底页，避免先展示通用设置并等待导航超时。
		*/
		function routeOptionalSettingsSection(available, openRequested, openFallback) {
			if (available) {
				openRequested();
				return;
			}
			openFallback();
		}
		/** 官方 alpha.2 插件管理页占用 sidebar.panellist / main 的同一 id。 */
		const OFFICIAL_PLUGINS_PANEL_ID = "plugins";
		let cancelPendingNavigation;
		const SETTINGS_NAVIGATION_TIMEOUT_MS = 4e3;
		const SETTINGS_TRIGGER_SELECTOR = "[data-dcu-settings-trigger],[aria-haspopup=\"dialog\"]";
		const SETTINGS_OPEN_SECTION_EVENT = "dcu-settings-open-section";
		const SETTINGS_OPEN_ROOT_EVENT = "dcu-settings-open-root";
		const SETTINGS_OWNER_SELECTOR = "[data-dcu-settings-owner]";
		/** 根入口与分区跳转使用同一触发器合约，兼容保留的宿主设置壳。 */
		function openSettingsRoot(root) {
			const owner = root?.querySelector(SETTINGS_OWNER_SELECTOR);
			if (owner && !owner.dispatchEvent(new CustomEvent("dcu-settings-open-root", { cancelable: true }))) return;
			root?.querySelector(SETTINGS_TRIGGER_SELECTOR)?.click();
		}
		function openSettingsSection(root, label, onMissing, onSelected) {
			const labels = typeof label === "string" ? [label] : label;
			const trigger = root?.querySelector(SETTINGS_OWNER_SELECTOR) ?? root?.querySelector("[data-dcu-settings-trigger],[aria-haspopup=\"dialog\"]");
			if (trigger === null || trigger === void 0) {
				onMissing?.();
				return;
			}
			const opening = cancelPendingNavigation !== void 0;
			cancelPendingNavigation?.();
			const request = new CustomEvent(SETTINGS_OPEN_SECTION_EVENT, {
				detail: { labels },
				cancelable: true
			});
			const detail = { labels };
			const ownerRequest = new CustomEvent(SETTINGS_OPEN_SECTION_EVENT, {
				detail,
				cancelable: true
			});
			if (trigger.hasAttribute("data-dcu-settings-owner")) {
				trigger.dispatchEvent(ownerRequest);
				if (detail.result === "selected") onSelected?.();
				else onMissing?.();
				return;
			}
			if (!trigger.dispatchEvent(request)) {
				onSelected?.();
				return;
			}
			const pageSelector = trigger.hasAttribute("data-dcu-settings-trigger") ? "[data-dcu-settings-page]" : "[role=\"dialog\"]";
			if (!opening && document.querySelector(pageSelector) === null) trigger.click();
			let frame;
			let finished = false;
			const observer = new MutationObserver(() => {
				schedule();
			});
			const cleanup = () => {
				if (finished) return;
				finished = true;
				observer.disconnect();
				window.clearTimeout(timeout);
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				if (cancelPendingNavigation === cleanup) cancelPendingNavigation = void 0;
			};
			const select = () => {
				const target = pickSettingsSectionButton([...document.querySelectorAll(`${pageSelector} nav button`)], labels);
				if (target === void 0) return false;
				cleanup();
				target.click();
				onSelected?.();
				return true;
			};
			const schedule = () => {
				if (finished || frame !== void 0) return;
				frame = window.requestAnimationFrame(() => {
					frame = void 0;
					select();
				});
			};
			const timeout = window.setTimeout(() => {
				if (select()) return;
				cleanup();
				console.warn(`[uncledylan-codex-ui] 未找到设置分区：${labels.join(" / ")}`);
				onMissing?.();
			}, SETTINGS_NAVIGATION_TIMEOUT_MS);
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			cancelPendingNavigation = cleanup;
			schedule();
		}
		//#endregion
		//#region src/client/global-panels.tsx
		/** 从宿主注册表读取面板元数据；缓存快照以满足 React 外部状态订阅契约。 */
		function createGlobalPanelSource(slots, locale) {
			let cached = [];
			return {
				getSnapshot() {
					const next = slots.entriesOfSlot("sidebar.panellist").flatMap(({ options }) => {
						if (options.id === void 0 || options.id === "plugins") return [];
						return [{
							id: options.id,
							order: options.order ?? 0,
							label: (typeof options.label === "function" ? options.label() : options.label) ?? options.id
						}];
					}).sort((a, b) => a.order - b.order);
					if (next.length !== cached.length || next.some((panel, index) => {
						const previous = cached[index];
						return previous === void 0 || panel.id !== previous.id || panel.label !== previous.label || panel.order !== previous.order;
					})) cached = next;
					return cached;
				},
				subscribe(listener) {
					const offSlots = slots.subscribe("sidebar.panellist", listener);
					const offLocale = locale.subscribe(listener);
					return () => {
						offSlots();
						offLocale();
					};
				}
			};
		}
		function initializeComposerWidth(storage) {
			const key = "dsh.conversation.contentWidth";
			try {
				const saved = Number(storage.getItem(key));
				if (Number.isFinite(saved) && saved > 0 && saved !== 640) return;
				storage.setItem(key, String(768));
			} catch (error) {
				console.warn("[codex-ui] 无法初始化输入区宽度，将使用宿主默认值。", error);
			}
		}
		/** 新建页没有宿主 WidthHandle，补充同一宽度偏好的拖拽入口。 */
		function observeHeroWidthHandles(label) {
			const mounted = /* @__PURE__ */ new Map();
			const style = document.createElement("style");
			style.textContent = `[data-phase=hero]:has([data-conversation-scroll]){position:relative}[data-dcu-width-handle]{position:absolute;top:0;bottom:0;width:32px;padding:0;border:0;background:transparent;cursor:col-resize;touch-action:none;z-index:8;outline-offset:-5px}[data-dcu-width-handle=left]{right:calc(50% + var(--dsh-chat-content-width) / 2 + 16px)}[data-dcu-width-handle=right]{left:calc(50% + var(--dsh-chat-content-width) / 2 + 16px)}[data-dcu-width-handle]::after{content:'';position:absolute;top:calc(var(--dcu-pointer-y,50%) - 50px);height:100px;width:3px;left:14px;border-radius:3px;background:linear-gradient(transparent,var(--dsw-alias-scrollbar-hover-l1,#888),transparent);opacity:0}[data-dcu-width-handle]:hover::after,[data-dcu-width-handle]:focus-visible::after,[data-dcu-width-handle][data-dragging]::after{opacity:1}[data-phase=hero]:has([data-conversation-composer-overlay]) [data-dcu-width-handle]{display:none}`;
			document.head.append(style);
			const sync = () => {
				for (const [root, dispose] of mounted) if (!root.isConnected || root.dataset.phase !== "hero") {
					dispose();
					mounted.delete(root);
				}
				for (const root of document.querySelectorAll("[data-phase=hero]")) {
					if (mounted.has(root) || !root.querySelector("[data-conversation-scroll]")) continue;
					const clamp = (value) => Math.min(Math.max(640, value), Math.max(640, root.clientWidth - 176));
					const current = () => {
						const raw = getComputedStyle(root).getPropertyValue("--dsh-chat-user-width");
						return clamp(parseFloat(raw) || 640);
					};
					const publish = (width, save) => {
						const value = clamp(width);
						root.style.setProperty("--dsh-chat-user-width", `${value}px`);
						if (save) try {
							localStorage.setItem("dsh.conversation.contentWidth", String(value));
						} catch (error) {
							console.warn("[codex-ui] 无法保存输入区宽度。", error);
						}
					};
					const handles = ["left", "right"].map((side) => {
						const handle = document.createElement("button");
						handle.type = "button";
						handle.dataset.dcuWidthHandle = side;
						handle.setAttribute("aria-label", label);
						let origin = 0;
						let initial = 640;
						let dragging = false;
						handle.addEventListener("pointerdown", (event) => {
							if (event.button !== 0) return;
							event.preventDefault();
							origin = event.clientX;
							initial = current();
							dragging = true;
							handle.dataset.dragging = "";
							handle.setPointerCapture(event.pointerId);
						});
						handle.addEventListener("pointermove", (event) => {
							handle.style.setProperty("--dcu-pointer-y", `${event.clientY - handle.getBoundingClientRect().top}px`);
							if (dragging) publish(initial + (event.clientX - origin) * (side === "right" ? 2 : -2), false);
						});
						handle.addEventListener("pointerup", (event) => {
							if (!dragging) return;
							publish(initial + (event.clientX - origin) * (side === "right" ? 2 : -2), true);
							dragging = false;
							delete handle.dataset.dragging;
							handle.releasePointerCapture(event.pointerId);
						});
						handle.addEventListener("lostpointercapture", () => {
							if (dragging) publish(initial, false);
							dragging = false;
							delete handle.dataset.dragging;
						});
						handle.addEventListener("keydown", (event) => {
							if (![
								"ArrowLeft",
								"ArrowRight",
								"Home"
							].includes(event.key)) return;
							event.preventDefault();
							const delta = (event.key === "ArrowRight" ? 1 : -1) * (side === "right" ? 1 : -1) * 20;
							publish(event.key === "Home" ? 640 : current() + delta, true);
						});
						root.append(handle);
						return handle;
					});
					mounted.set(root, () => {
						handles.forEach((handle) => handle.remove());
					});
				}
			};
			const observer = new MutationObserver(sync);
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-phase"]
			});
			sync();
			return () => {
				observer.disconnect();
				mounted.forEach((dispose) => dispose());
				mounted.clear();
				style.remove();
			};
		}
		//#endregion
		//#region src/client/tree-expansion.ts
		const WORKSPACE_EXPANSION_STORAGE_KEY = "dsh-codex-ui.workspace-expansion.v1";
		const SCHEDULE_EXPANSION_STORAGE_KEY = "dsh-codex-ui.schedule-expansion.v1";
		const MAX_EXPANSION_ENTRIES = 500;
		const MAX_EXPANSION_KEY_LENGTH = 512;
		function browserStorage() {
			if (typeof window === "undefined") return void 0;
			try {
				return window.localStorage;
			} catch {
				return;
			}
		}
		function parseTreeExpansionState(value) {
			if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
			const entries = Object.entries(value).filter(([key, expanded]) => key.length > 0 && key.length <= MAX_EXPANSION_KEY_LENGTH && typeof expanded === "boolean").slice(0, MAX_EXPANSION_ENTRIES);
			return Object.fromEntries(entries);
		}
		function readTreeExpansionState(storage, key) {
			if (storage === void 0) return {};
			try {
				return parseTreeExpansionState(JSON.parse(storage.getItem(key) ?? "{}"));
			} catch {
				return {};
			}
		}
		function writeTreeExpansionState(storage, key, state) {
			if (storage === void 0) return;
			try {
				storage.setItem(key, JSON.stringify(parseTreeExpansionState(state)));
			} catch {}
		}
		//#endregion
		//#region src/client/SidebarRail.tsx
		/**
		* 主侧栏与设置页共用同一份窄栏数据：图标、顺序、状态全来自侧栏，
		* 设置页不再自己拼一份，避免「一进设置就少了几个键」。
		*/
		const SidebarRailContext = (0, react.createContext)(void 0);
		function useSidebarRail() {
			return (0, react.useContext)(SidebarRailContext);
		}
		/** Tabler blocks：窄栏插件入口，主侧栏与设置页共用同一字形。 */
		function RailBlocksIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 4a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1l0 -5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 14h12a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h3a2 2 0 0 1 2 2v12" })
				]
			});
		}
		/** Tabler clock：定时/自动化任务的统一时钟字形，窄栏、浮窗、宽侧栏菜单与设置页共用。 */
		function RailClockIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				className: "dcu-clock-icon",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 7v5l3 3" })
				]
			});
		}
		/** Tabler message：第三方面板（如 webchat）的窄栏字形，插件自带图标风格不符时按 id 在侧栏侧接管。 */
		function RailMessageIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 9h8" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 13h6" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12" })
				]
			});
		}
		/** Tabler photo：生图模式（image-studio 面板）的窄栏字形。 */
		function RailPhotoIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M15 8h.01" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" })
				]
			});
		}
		/** Tabler users：··· 浮窗「专家」入口。 */
		function RailUsersIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 21v-2a4 4 0 0 0 -3 -3.85" })
				]
			});
		}
		/** Tabler sparkles-2：··· 浮窗「技能」入口。 */
		function RailSparklesIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 6a9.3 9.3 0 0 0 1.516 -.546c.911 -.438 1.494 -1.015 1.937 -1.932c.207 -.428 .382 -.928 .547 -1.522c.165 .595 .34 1.095 .547 1.521c.443 .918 1.026 1.495 1.937 1.933c.426 .205 .925 .38 1.516 .546a9.3 9.3 0 0 0 -1.516 .547c-.911 .438 -1.494 1.015 -1.937 1.932a9 9 0 0 0 -.547 1.521c-.165 -.594 -.34 -1.095 -.547 -1.521c-.443 -.918 -1.026 -1.494 -1.937 -1.932a9 9 0 0 0 -1.516 -.547" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 14a21 21 0 0 0 1.652 -.532c2.542 -.953 3.853 -2.238 4.816 -4.806a20 20 0 0 0 .532 -1.662a20 20 0 0 0 .532 1.662c.963 2.567 2.275 3.853 4.816 4.806q .75 .28 1.652 .532a21 21 0 0 0 -1.652 .532c-2.542 .953 -3.854 2.238 -4.816 4.806a20 20 0 0 0 -.532 1.662a20 20 0 0 0 -.532 -1.662c-.963 -2.568 -2.275 -3.853 -4.816 -4.806a21 21 0 0 0 -1.652 -.532" })
				]
			});
		}
		/** Tabler link：··· 浮窗「连接器」入口。 */
		function RailLinkIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 15l6 -6" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" })
				]
			});
		}
		/** Tabler pin：··· 子项行尾的「固定到侧边栏」，比行图标小一号（同网格下描边自然细一号）。 */
		function RailPinIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 15l-4.5 4.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14.5 4l5.5 5.5" })
				]
			});
		}
		/** Tabler dots：窄栏 ··· 浮窗入口。 */
		function RailDotsIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" })
				]
			});
		}
		/**
		* 窄栏图标统一参数：大小与描边各一个变量，全轨（含第三方面板 svg）一次调齐。
		* vector-effect 让「描边 2」按屏幕像素计——不同 viewBox 网格的 svg 也严格等重。
		*/
		const RAIL_ICON_STYLE = `
.dcu-rail{--dcu-rail-icon-size:20px;--dcu-rail-icon-stroke:1.5}
.dcu-rail .dcu-icon svg{width:var(--dcu-rail-icon-size);height:var(--dcu-rail-icon-size)}
.dcu-rail .dcu-icon svg :is(path,circle,rect,line,polyline,polygon,ellipse){vector-effect:non-scaling-stroke;stroke-width:calc(var(--dcu-rail-icon-stroke)*1px)}
`;
		/** Tabler home：主界面与设置页窄栏共用的 home 字形。 */
		function RailHomeIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				className: "dcu-home-icon",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						stroke: "none",
						d: "M0 0h24v24H0z",
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 12l-2 0l9 -9l9 9l-2 0" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" })
				]
			});
		}
		/** 浮窗样式随组件走：主侧栏与设置页两份样式表都不必复制这份规则。几何参数对齐 Codex 同款浮窗（2560 截图实测）。 */
		const RAIL_MORE_STYLE = `
.dcu-rail-more-panel{position:fixed;left:56px;z-index:10030;min-width:274px;padding:8px;border-radius:16px;background:var(--dcu-tip-bg,#fff);box-shadow:var(--dcu-tip-shadow,0 0 0 .5px rgba(13,13,13,.08),0 3px 7.5px rgba(0,0,0,.03),0 0 16px rgba(0,0,0,.02));animation:dcu-rail-more-in 140ms cubic-bezier(.16,1,.3,1)}
@keyframes dcu-rail-more-in{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
.dcu-rail-more-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;border-radius:10px}
.dcu-rail-more-row:hover{background:var(--dcu-sidebar-hover)}
.dcu-rail-more-item{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;min-height:34px;padding:0 8px;border:0;border-radius:10px;background:transparent;color:var(--dcu-sidebar-primary);font:14px/20px var(--dsw-font-family);text-align:left;cursor:pointer}
.dcu-rail-more-icon{display:grid;place-items:center;width:20px;height:20px}
.dcu-rail-more-icon svg{display:block;width:18px;height:18px;color:var(--dcu-sidebar-icon)}
.dcu-rail-more-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dcu-rail-more-pin{visibility:hidden;display:grid;place-items:center;width:26px;height:26px;margin-right:4px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dcu-sidebar-icon);cursor:pointer}
.dcu-rail-more-row:hover .dcu-rail-more-pin,.dcu-rail-more-pin[data-pinned]{visibility:visible}
.dcu-rail-more-pin:hover{color:var(--dcu-sidebar-primary)}
.dcu-rail-more-pin[data-pinned]{color:var(--dcu-sidebar-primary)}
@media(prefers-reduced-motion:reduce){.dcu-rail-more-panel{animation:none}}
`;
		/** 窄栏 ···：点击向右弹出浮窗，外部点击或 Escape 关闭；面板锚定按钮所在行。 */
		function RailMore({ api }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [top, setTop] = (0, react.useState)(0);
			const trigger = (0, react.useRef)(null);
			const root = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					if (root.current !== null && event.target instanceof Node && !root.current.contains(event.target)) setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape" && !event.defaultPrevented) {
						event.preventDefault();
						setOpen(false);
					}
				};
				window.addEventListener("pointerdown", onPointerDown, true);
				window.addEventListener("keydown", onKeyDown, true);
				return () => {
					window.removeEventListener("pointerdown", onPointerDown, true);
					window.removeEventListener("keydown", onKeyDown, true);
				};
			}, [open]);
			const toggle = () => {
				if (!open && trigger.current !== null) {
					const rect = trigger.current.getBoundingClientRect();
					const view = trigger.current.ownerDocument.defaultView;
					const rows = api.items.length + (api.panels?.length ?? 0);
					setTop(Math.max(8, Math.min(rect.top - 6, (view?.innerHeight ?? 800) - rows * 38 - 24)));
				}
				setOpen((value) => !value);
			};
			const item = (entry) => {
				const pinnable = api.togglePin !== void 0 && entry.id !== void 0;
				const pinned = entry.id !== void 0 && (api.pinnedIds ?? []).includes(entry.id);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dcu-rail-more-row",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitem",
						className: "dcu-rail-more-item",
						onClick: () => {
							setOpen(false);
							entry.run();
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-rail-more-icon",
							children: entry.icon
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-rail-more-label",
							children: entry.label
						})]
					}), pinnable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dcu-rail-more-pin",
						"data-pinned": pinned ? "" : void 0,
						"aria-label": pinned ? api.unpinLabel : api.pinLabel,
						title: pinned ? api.unpinLabel : api.pinLabel,
						"aria-pressed": pinned,
						onClick: (event) => {
							event.stopPropagation();
							api.togglePin?.(entry.id);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailPinIcon, { size: 16 })
					})]
				}, entry.label);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: RAIL_MORE_STYLE }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						ref: trigger,
						type: "button",
						className: "dcu-icon",
						"aria-label": api.label,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						onClick: toggle,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailDotsIcon, {})
					}),
					open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-rail-more-panel",
						role: "menu",
						"aria-label": api.label,
						style: { top },
						children: [api.items.map(item), api.panels?.map(item)]
					})
				]
			});
		}
		/** 主界面的窄栏本体；设置页通过 `useSidebarRail()` 拿同一份数据渲染这一块。 */
		function SidebarRail({ api }) {
			const button = (item, content, className = "dcu-icon", ref) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				ref,
				type: "button",
				className,
				"aria-label": item.label,
				"aria-current": item.active === true ? "page" : void 0,
				"data-busy": item.busy === true ? "" : void 0,
				disabled: item.busy === true,
				onClick: item.run,
				children: content
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: api.className === void 0 ? "dcu-rail" : `dcu-rail ${api.className}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: RAIL_ICON_STYLE }),
					button(api.home, api.home.icon, "dcu-icon dcu-settings-home", api.homeRef),
					api.collapse !== void 0 && button(api.collapse, api.collapse.icon, "dcu-icon dcu-rail-collapse"),
					api.schedule !== void 0 && button(api.schedule, api.schedule.icon),
					api.panels.map((panel) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dcu-icon dcu-rail-panel-icon",
						"aria-label": panel.label,
						title: panel.label,
						"aria-current": panel.active === true ? "page" : void 0,
						onClick: panel.run,
						children: panel.node
					}, panel.id)),
					button(api.plugins, api.plugins.icon),
					api.more !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailMore, { api: api.more }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-rail-divider",
						role: "separator"
					}),
					api.pinned?.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Fragment, { children: button(item, item.icon) }, item.label)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dcu-rail-spacer" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: api.settingsRef,
						className: "dcu-settings-seat",
						children: api.settings
					})
				]
			});
		}
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const mergeClasses = (...classes) => classes.filter((className, index, array) => {
			return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
		}).join(" ").trim();
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toPascalCase = (string) => {
			const camelCase = toCamelCase(string);
			return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
		};
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/defaultAttributes.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		var defaultAttributes = {
			xmlns: "http://www.w3.org/2000/svg",
			width: 24,
			height: 24,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		};
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const hasA11yProp = (props) => {
			for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
			return false;
		};
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/context.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const LucideContext = (0, react.createContext)({});
		const useLucideContext = () => (0, react.useContext)(LucideContext);
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/Icon.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Icon = (0, react.forwardRef)(({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
			const { size: contextSize = 24, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, color: contextColor = "currentColor", className: contextClass = "" } = useLucideContext() ?? {};
			const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
			return (0, react.createElement)("svg", {
				ref,
				...defaultAttributes,
				width: size ?? contextSize ?? defaultAttributes.width,
				height: size ?? contextSize ?? defaultAttributes.height,
				stroke: color ?? contextColor,
				strokeWidth: calculatedStrokeWidth,
				className: mergeClasses("lucide", contextClass, className),
				...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
				...rest
			}, [...iconNode.map(([tag, attrs]) => (0, react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
		});
		//#endregion
		//#region node_modules/.pnpm/lucide-react@1.39.0_react@18.3.1/node_modules/lucide-react/dist/esm/createLucideIcon.mjs
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const createLucideIcon = (iconName, iconNode) => {
			const Component = (0, react.forwardRef)(({ className, ...props }, ref) => (0, react.createElement)(Icon, {
				ref,
				iconNode,
				className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
				...props
			}));
			Component.displayName = toPascalCase(iconName);
			return Component;
		};
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Archive = createLucideIcon("archive", [
			["rect", {
				width: "20",
				height: "5",
				x: "2",
				y: "3",
				rx: "1",
				key: "1wp1u1"
			}],
			["path", {
				d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
				key: "1s80jp"
			}],
			["path", {
				d: "M10 12h4",
				key: "a56b0p"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Box = createLucideIcon("box", [
			["path", {
				d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
				key: "hh9hay"
			}],
			["path", {
				d: "m3.3 7 8.7 5 8.7-5",
				key: "g66t2b"
			}],
			["path", {
				d: "M12 22V12",
				key: "d0xqtd"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const CircleQuestionMark = createLucideIcon("circle-question-mark", [
			["circle", {
				cx: "12",
				cy: "12",
				r: "10",
				key: "1mglay"
			}],
			["path", {
				d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
				key: "1u773s"
			}],
			["path", {
				d: "M12 17h.01",
				key: "p32p05"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Clock = createLucideIcon("clock", [["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}], ["path", {
			d: "M12 6v6l4 2",
			key: "mmk7yg"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Cpu = createLucideIcon("cpu", [
			["path", {
				d: "M12 20v2",
				key: "1lh1kg"
			}],
			["path", {
				d: "M12 2v2",
				key: "tus03m"
			}],
			["path", {
				d: "M17 20v2",
				key: "1rnc9c"
			}],
			["path", {
				d: "M17 2v2",
				key: "11trls"
			}],
			["path", {
				d: "M2 12h2",
				key: "1t8f8n"
			}],
			["path", {
				d: "M2 17h2",
				key: "7oei6x"
			}],
			["path", {
				d: "M2 7h2",
				key: "asdhe0"
			}],
			["path", {
				d: "M20 12h2",
				key: "1q8mjw"
			}],
			["path", {
				d: "M20 17h2",
				key: "1fpfkl"
			}],
			["path", {
				d: "M20 7h2",
				key: "1o8tra"
			}],
			["path", {
				d: "M7 20v2",
				key: "4gnj0m"
			}],
			["path", {
				d: "M7 2v2",
				key: "1i4yhu"
			}],
			["rect", {
				x: "4",
				y: "4",
				width: "16",
				height: "16",
				rx: "2",
				key: "1vbyd7"
			}],
			["rect", {
				x: "8",
				y: "8",
				width: "8",
				height: "8",
				rx: "1",
				key: "z9xiuo"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const EyeOff = createLucideIcon("eye-off", [
			["path", {
				d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
				key: "ct8e1f"
			}],
			["path", {
				d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
				key: "151rxh"
			}],
			["path", {
				d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
				key: "13bj9a"
			}],
			["path", {
				d: "m2 2 20 20",
				key: "1ooewy"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Eye = createLucideIcon("eye", [["path", {
			d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
			key: "1nclc0"
		}], ["circle", {
			cx: "12",
			cy: "12",
			r: "3",
			key: "1v7zrd"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Link = createLucideIcon("link", [["path", {
			d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
			key: "1cjeqo"
		}], ["path", {
			d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
			key: "19qd67"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const MessageCircle = createLucideIcon("message-circle", [["path", {
			d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
			key: "1sd12s"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const MessageSquare = createLucideIcon("message-square", [["path", {
			d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
			key: "18887p"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const PanelLeft = createLucideIcon("panel-left", [["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			key: "afitv7"
		}], ["path", {
			d: "M9 3v18",
			key: "fh3hqa"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const PanelRight = createLucideIcon("panel-right", [["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			key: "afitv7"
		}], ["path", {
			d: "M15 3v18",
			key: "14nvp0"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Pin = createLucideIcon("pin", [["path", {
			d: "M12 17v5",
			key: "bb1du9"
		}], ["path", {
			d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
			key: "1nkz8b"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Plus = createLucideIcon("plus", [["path", {
			d: "M5 12h14",
			key: "1ays0h"
		}], ["path", {
			d: "M12 5v14",
			key: "s699le"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Search = createLucideIcon("search", [["path", {
			d: "m21 21-4.34-4.34",
			key: "14j7rj"
		}], ["circle", {
			cx: "11",
			cy: "11",
			r: "8",
			key: "4ej97u"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Settings = createLucideIcon("settings", [["path", {
			d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
			key: "1i5ecw"
		}], ["circle", {
			cx: "12",
			cy: "12",
			r: "3",
			key: "1v7zrd"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const SlidersHorizontal = createLucideIcon("sliders-horizontal", [
			["path", {
				d: "M10 5H3",
				key: "1qgfaw"
			}],
			["path", {
				d: "M12 19H3",
				key: "yhmn1j"
			}],
			["path", {
				d: "M14 3v4",
				key: "1sua03"
			}],
			["path", {
				d: "M16 17v4",
				key: "1q0r14"
			}],
			["path", {
				d: "M21 12h-9",
				key: "1o4lsq"
			}],
			["path", {
				d: "M21 19h-5",
				key: "1rlt1p"
			}],
			["path", {
				d: "M21 5h-7",
				key: "1oszz2"
			}],
			["path", {
				d: "M8 10v4",
				key: "tgpxqk"
			}],
			["path", {
				d: "M8 12H3",
				key: "a7s4jb"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Sparkles = createLucideIcon("sparkles", [
			["path", {
				d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
				key: "1s2grr"
			}],
			["path", {
				d: "M20 2v4",
				key: "1rf3ol"
			}],
			["path", {
				d: "M22 4h-4",
				key: "gwowj6"
			}],
			["circle", {
				cx: "4",
				cy: "20",
				r: "2",
				key: "6kqj1y"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const SquarePen = createLucideIcon("square-pen", [["path", {
			d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
			key: "1m0v6g"
		}], ["path", {
			d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
			key: "ohrbg2"
		}]]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Store = createLucideIcon("store", [
			["path", {
				d: "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",
				key: "slp6dd"
			}],
			["path", {
				d: "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",
				key: "o0xfot"
			}],
			["path", {
				d: "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",
				key: "wn3emo"
			}]
		]);
		/**
		* @license lucide-react v1.39.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const User = createLucideIcon("user", [["path", {
			d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
			key: "975kel"
		}], ["circle", {
			cx: "12",
			cy: "7",
			r: "4",
			key: "17ys0d"
		}]]);
		//#endregion
		//#region src/client/host-icons.ts
		/**
		* 优先使用 0.1.7 的 Medium 导出名，0.1.5 只有旧尺寸名时回退。
		* 必须动态读取，不能写成静态属性访问，否则旧宿主一加载客户端就会拿到 undefined。
		*/
		function resolveHostIcon(icons, modern, legacy) {
			const icon = icons[modern] ?? icons[legacy];
			if (!icon) throw new Error(`宿主缺少图标 ${modern}`);
			return icon;
		}
		function hostIcon(modern, legacy) {
			return resolveHostIcon(_deepseek_ai_dsh_client_ui_primitives, modern, legacy);
		}
		const IconArchiveOutlineMedium = hostIcon("IconArchiveOutlineMedium", "IconArchiveOutline20");
		const IconBranchOutlineMedium = hostIcon("IconBranchOutlineMedium", "IconBranchOutline16");
		const IconCheckOutlineMedium = hostIcon("IconCheckOutlineMedium", "IconCheckOutline16");
		hostIcon("IconChevronDownOutlineMedium", "IconChevronDownOutline14");
		hostIcon("IconChevronRightOutlineMedium", "IconChevronRightOutline14");
		const IconCopyOutlineMedium = hostIcon("IconCopyOutlineMedium", "IconCopyOutline16");
		const IconDownloadOutlineMedium = hostIcon("IconDownloadOutlineMedium", "IconDownloadOutline16");
		const IconEditOutlineMedium = hostIcon("IconEditOutlineMedium", "IconEditOutline16");
		const IconEllipsisOutlineMedium = hostIcon("IconEllipsisOutlineMedium", "IconEllipsisOutline16");
		hostIcon("IconEnhanceOutlineMedium", "IconEnhanceOutline16");
		const IconFlatListOutlineMedium = hostIcon("IconFlatListOutlineMedium", "IconFlatListOutline16");
		const IconFolderCloseMedium = hostIcon("IconFolderCloseMedium", "IconFolderClose16");
		const IconFolderOpenMedium = hostIcon("IconFolderOpenMedium", "IconFolderOpen16");
		const IconFolderOpenOutlineMedium = hostIcon("IconFolderOpenOutlineMedium", "IconFolderOpenOutline16");
		const IconLinkOutlineMedium = hostIcon("IconLinkOutlineMedium", "IconLinkOutline16");
		const IconListPenOutlineMedium = hostIcon("IconListPenOutlineMedium", "IconListPenOutline16");
		const IconLoadingOutlineMedium = hostIcon("IconLoadingOutlineMedium", "IconLoadingOutline16");
		const IconNewChatOutlineMedium = hostIcon("IconNewChatOutlineMedium", "IconNewChatOutline16");
		hostIcon("IconPanelLeftOutlineMedium", "IconPanelLeftOutline16");
		hostIcon("IconPersonalizationOutlineMedium", "IconPersonalizationOutline16");
		const IconProjectAddOutlineMedium = hostIcon("IconProjectAddOutlineMedium", "IconProjectAddOutline16");
		const IconRefreshOutlineMedium = hostIcon("IconRefreshOutlineMedium", "IconRefreshOutline16");
		const IconSearchOutlineMedium = hostIcon("IconSearchOutlineMedium", "IconSearchOutline16");
		const IconSettingsOutlineMedium = hostIcon("IconSettingsOutlineMedium", "IconSettingsOutline16");
		hostIcon("IconSkillOutlineMedium", "IconSkillOutline16");
		const IconTrashOutlineMedium = hostIcon("IconTrashOutlineMedium", "IconTrashOutline16");
		hostIcon("IconUserOutlineMedium", "IconUserOutline16");
		const IconWorkspaceTreeOutlineMedium = hostIcon("IconWorkspaceTreeOutlineMedium", "IconWorkspaceTreeOutline16");
		//#endregion
		//#region src/client/sidebar-search.ts
		/** 按用户可见名称和辅助关键词筛选侧栏搜索结果。 */
		function filterSidebarSearchItems(items, query) {
			const needle = query.trim().toLocaleLowerCase();
			if (needle === "") return [...items];
			return items.filter((item) => `${item.label} ${item.keywords}`.toLocaleLowerCase().includes(needle));
		}
		//#endregion
		//#region src/client/companion-slots.ts
		const EMPTY_COMPANION_TABS = {
			channels: false,
			schedule: false
		};
		const reportedSlotErrors = /* @__PURE__ */ new WeakSet();
		/** 插槽声明本身不算占用；只有其他插件 register 后才视为已安装。 */
		function readSlotEntries(slots, name) {
			if (slots === void 0) return [];
			const read = slots.entriesOfSlot ?? slots.entries;
			if (typeof read !== "function") return [];
			try {
				return read.call(slots, name) ?? [];
			} catch (error) {
				if (!reportedSlotErrors.has(slots)) {
					reportedSlotErrors.add(slots);
					console.warn("[uncledylan-codex-ui] 无法读取配套插件插槽。", error);
				}
				return [];
			}
		}
		function slotHasEntries(slots, name) {
			return readSlotEntries(slots, name).length > 0;
		}
		function companionTabAvailability(slots) {
			return {
				channels: slotHasEntries(slots, "sidebar.channels"),
				schedule: slotHasEntries(slots, "sidebar.schedule")
			};
		}
		function sameCompanionTabs(left, right) {
			return left.channels === right.channels && left.schedule === right.schedule;
		}
		/** 给 React useSyncExternalStore 用的配套页签快照源。 */
		function createCompanionTabSource(slots) {
			let cached = companionTabAvailability(slots);
			return {
				getSnapshot() {
					const next = companionTabAvailability(slots);
					if (sameCompanionTabs(next, cached)) return cached;
					cached = next;
					return cached;
				},
				subscribe(onStoreChange) {
					if (slots === void 0 || typeof slots.subscribe !== "function") return () => {};
					const offChannels = slots.subscribe("sidebar.channels", onStoreChange);
					const offSchedule = slots.subscribe("sidebar.schedule", onStoreChange);
					return () => {
						offChannels?.();
						offSchedule?.();
					};
				}
			};
		}
		//#endregion
		//#region src/client/session-title-scroll.ts
		/** 会话行只展示标题第一行，避免换行把胶囊撑高。 */
		function sessionTitleLine(title) {
			return title.split(/\r?\n/)[0] ?? title;
		}
		/** 标题比可视槽多出来的像素；1px 内当作测量误差。 */
		function titleOverflowPx(scrollWidth, clientWidth) {
			const extra = Math.ceil(scrollWidth - clientWidth);
			return extra > 1 ? extra : 0;
		}
		const PX_PER_SECOND = 42;
		/** 按溢出长度估算单程时长，长标题更慢，避免一闪而过。 */
		function titleScrollDurationMs(overflowPx) {
			if (overflowPx <= 0) return 0;
			return Math.min(8e3, Math.max(1600, Math.round(overflowPx / PX_PER_SECOND * 1e3)));
		}
		//#endregion
		//#region src/client/session-tree.tsx
		function PinIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Pin, {
				"aria-hidden": "true",
				size: 16,
				strokeWidth: 1.5
			});
		}
		function QuickArchiveIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Archive, {
				"aria-hidden": "true",
				size: 16,
				strokeWidth: 1.5
			});
		}
		function SessionHoverCard({ tip, onEnter, onLeave }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-wb-tip",
				style: {
					left: tip.left,
					top: tip.top
				},
				onMouseEnter: onEnter,
				onMouseLeave: onLeave,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-title",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-tip-title-main",
							children: tip.title
						}), tip.time !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-tip-time",
							children: tip.time
						})]
					}),
					tip.project !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-folder",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tip.project })]
					}),
					tip.branch !== void 0 && tip.branch !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-folder",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBranchOutlineMedium, { size: 16 })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tip.branch })]
					})
				]
			});
		}
		function sessionMenuItems(t, options) {
			const items = [
				{
					id: "rename",
					label: t("sessions.rename"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEditOutlineMedium, { size: 16 })
				},
				{
					id: "unread",
					label: t(options.unread ? "sessions.markRead" : "sessions.markUnread"),
					icon: options.unread ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EyeOff, {
						"aria-hidden": "true",
						size: 16,
						strokeWidth: 1.5
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Eye, {
						"aria-hidden": "true",
						size: 16,
						strokeWidth: 1.5
					})
				},
				{
					id: "archive",
					label: t("sessions.archive"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArchiveOutlineMedium, { size: 16 })
				},
				{
					type: "separator",
					id: "main-separator"
				},
				{
					id: "fork",
					label: t("sessions.fork"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBranchOutlineMedium, { size: 16 })
				}
			];
			if (options.includePath === true) items.push({
				id: "openPath",
				label: t("sessions.openPath"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderOpenOutlineMedium, { size: 16 }),
				disabled: options.path === void 0
			});
			if (options.moveTargets !== void 0) items.push({
				id: "moveWorkspace",
				label: t("sessions.moveWorkspace"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 }),
				disabled: options.moveTargets.length === 0,
				submenu: options.moveTargets.map((target) => ({
					id: target.id,
					label: target.label,
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
				}))
			});
			items.push({
				type: "separator",
				id: "copy-separator"
			}, {
				id: "copyId",
				label: t("sessions.copyId"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLinkOutlineMedium, { size: 16 })
			}, {
				id: "copyTitle",
				label: t("sessions.copyTitle"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCopyOutlineMedium, { size: 16 })
			}, ...options.includePath === true ? [{
				id: "copyPath",
				label: t("sessions.copyPath"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCopyOutlineMedium, { size: 16 }),
				disabled: options.path === void 0
			}] : []);
			if (options.canDelete !== false) items.push({
				type: "separator",
				id: "delete-separator"
			}, {
				id: "delete",
				label: t("sessions.delete"),
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconTrashOutlineMedium, { size: 16 }),
				danger: true
			});
			return items;
		}
		/** 把右键落点收成 Menu 的锚点矩形，让列表贴着指针打开。 */
		function pointerMenuRect(x, y) {
			return new DOMRect(x, y, 0, 0);
		}
		function pendingLabel(kind, t) {
			switch (kind) {
				case "approval": return t("sessions.waitingApproval");
				case "plan-review": return t("sessions.planReview");
				case "question": return t("sessions.waitingAnswer");
			}
		}
		function SessionState({ pendingInteraction, unread, running, t }) {
			if (pendingInteraction !== void 0) {
				const label = pendingLabel(pendingInteraction, t);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "dcu-wb-pending",
					"data-state": "warning",
					"data-pending-kind": pendingInteraction,
					"aria-label": label,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-pending-dot",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-pending-label",
						children: label
					})]
				});
			}
			if (unread) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dcu-wb-unread",
				"aria-label": t("sessions.unread")
			});
			if (running) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dcu-wb-running",
				"aria-hidden": "true"
			});
			return null;
		}
		function SessionTime({ time }) {
			if (time === void 0 || time === "") return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dcu-wb-session-time",
				children: time
			});
		}
		function SessionRowTitle({ title }) {
			const text = sessionTitleLine(title);
			const wrapRef = (0, react.useRef)(null);
			const textRef = (0, react.useRef)(null);
			const [shift, setShift] = (0, react.useState)(0);
			(0, react.useLayoutEffect)(() => {
				const wrap = wrapRef.current;
				const inner = textRef.current;
				if (wrap === null || inner === null) return;
				const measure = () => {
					setShift(titleOverflowPx(inner.scrollWidth, wrap.clientWidth));
				};
				measure();
				let cancelled = false;
				const fonts = typeof document === "undefined" ? void 0 : document.fonts;
				if (fonts !== void 0) fonts.ready.then(() => {
					if (!cancelled) measure();
				});
				if (typeof ResizeObserver === "undefined") return () => {
					cancelled = true;
				};
				const observer = new ResizeObserver(measure);
				observer.observe(wrap);
				return () => {
					cancelled = true;
					observer.disconnect();
				};
			}, [text]);
			const style = shift > 0 ? {
				"--dcu-title-shift": `${shift}px`,
				"--dcu-title-duration": `${titleScrollDurationMs(shift)}ms`
			} : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				ref: wrapRef,
				className: "dcu-wb-session-title",
				"data-overflow": shift > 0 || void 0,
				style,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					ref: textRef,
					className: "dcu-wb-session-title-text",
					children: text
				})
			});
		}
		const SessionRow = (0, react.memo)(function SessionRow({ id, title, selected, menuOpen, unread, running, pendingInteraction, t, menuItems, onOpen, onMenuChange, onSelectAction, onArchive, onHover, onLeave, onContextMenu, menuPoint, subtitle, flat, draggable, dropActive, onDragStart, onDragEnd, onDragOver, onDrop, time }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				"data-dcu-session": id,
				className: `dcu-wb-session${selected ? " dcu-wb-selected" : ""}${menuOpen ? " dcu-wb-menu-open" : ""}${dropActive === true ? " dcu-wb-drop" : ""}${flat === true ? " dcu-wb-session-flat" : ""}`,
				role: "treeitem",
				"aria-selected": selected,
				draggable,
				onDragStart,
				onDragEnd,
				onDragOver,
				onDrop,
				onClick: onOpen,
				onContextMenu,
				onMouseEnter: onHover,
				onMouseLeave: onLeave,
				children: [
					subtitle !== void 0 && subtitle !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dcu-wb-session-copy",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRowTitle, { title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-session-sub",
							children: subtitle
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRowTitle, { title }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionState, {
						pendingInteraction,
						unread,
						running,
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionTime, { time }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-quick-actions",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dcu-wb-more",
							"aria-label": t("sessions.archive"),
							onClick: (event) => {
								event.stopPropagation();
								onArchive();
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QuickArchiveIcon, {})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-actions",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
							open: menuOpen,
							onClose: () => {
								onMenuChange(false);
							},
							items: menuItems,
							onSelect: onSelectAction,
							portal: true,
							dense: true,
							getAnchorRect: menuPoint === void 0 ? void 0 : () => pointerMenuRect(menuPoint.x, menuPoint.y),
							anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dcu-wb-more dcu-wb-context-anchor",
								"aria-label": t("sessions.actions", { name: title }),
								onClick: (event) => {
									event.stopPropagation();
									onMenuChange(!menuOpen);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutlineMedium, { size: 16 })
							})
						})
					})
				]
			});
		});
		const GroupHead = (0, react.memo)(function GroupHead({ expanded, title, icon, onToggle, actions, menuOpen }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `dcu-wb-project-head${menuOpen === true ? " dcu-wb-menu-open" : ""}`,
				role: "treeitem",
				"aria-expanded": expanded,
				tabIndex: 0,
				onClick: onToggle,
				onKeyDown: (event) => {
					if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
						event.preventDefault();
						onToggle();
					}
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-folder",
						children: icon
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-project-title",
						children: title
					}),
					actions !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-wb-actions",
						children: actions
					})
				]
			});
		});
		//#endregion
		//#region src/client/session-pending.ts
		const EMPTY_PENDING_INTERACTIONS = /* @__PURE__ */ new Map();
		const EMPTY_SESSION_STATUS = /* @__PURE__ */ new Map();
		function useEmptySessionPendingInteraction(selector) {
			return selector(EMPTY_PENDING_INTERACTIONS);
		}
		function useEmptySessionStatus(selector) {
			return selector(EMPTY_SESSION_STATUS);
		}
		function useHostSessionStatus(useSessionStatus) {
			return (useSessionStatus ?? useEmptySessionStatus)((state) => state);
		}
		/** 旧宿主订阅 pending Store；alpha.2 改走 useSessionStatus。两路都要订阅，避免条件 Hook。 */
		function useHostPendingInteractions(useSessionPendingInteraction, useSessionStatus) {
			return mergePendingInteractions((useSessionPendingInteraction ?? useEmptySessionPendingInteraction)((state) => state), (useSessionStatus ?? useEmptySessionStatus)((state) => state));
		}
		function visiblePendingKind(kind) {
			switch (kind) {
				case "approval":
				case "plan-review":
				case "question": return kind;
				default: return;
			}
		}
		/** 旧版 SessionSummary 的兼容读取；alpha.5 已将该状态迁移到独立 Store。 */
		function legacyPendingInteraction(summary) {
			if (typeof summary !== "object" || summary === null || !("pendingInteraction" in summary)) return void 0;
			return summary.pendingInteraction;
		}
		function pendingInteractionForSession(sessionId, pendingInteractions, summaryKind) {
			return visiblePendingKind(summaryKind) ?? visiblePendingKind(pendingInteractions.get(sessionId)?.kind);
		}
		//#endregion
		//#region src/business-api.ts
		const CODEX_UI_API_BASE = "/api/dsh-codex-ui";
		const CODEX_UI_API_ENDPOINTS = Object.freeze({
			connectors: `${CODEX_UI_API_BASE}/connectors`,
			dependencies: `${CODEX_UI_API_BASE}/dependencies`,
			openInExplorer: `${CODEX_UI_API_BASE}/open-in-explorer`,
			preferences: `${CODEX_UI_API_BASE}/preferences`,
			sessionMove: `${CODEX_UI_API_BASE}/session-move`
		});
		//#endregion
		//#region src/client/business-request-error.ts
		var BusinessRequestError = class extends Error {
			status;
			constructor(status) {
				super(`业务请求失败：HTTP ${status}`);
				this.status = status;
				this.name = "BusinessRequestError";
			}
		};
		function businessRequestErrorKey(error) {
			if (!(error instanceof BusinessRequestError)) return void 0;
			if (error.status === 401) return "errors.unauthorized";
			if (error.status === 403) return "errors.forbidden";
			if (error.status === 503) return "errors.serviceUnavailable";
		}
		const WORKSPACE_GROUP_ERROR_MESSAGES = {
			"group-invalid": "分组信息无效。",
			"workspace-invalid": "项目标识无效。",
			"group-missing": "目标分组不存在。",
			"order-anchor-missing": "排序锚点不存在。"
		};
		/** 以稳定错误码承载分组业务失败，诊断文案不参与界面控制逻辑。 */
		var WorkspaceGroupError = class extends Error {
			code;
			name = "WorkspaceGroupError";
			constructor(code, message = WORKSPACE_GROUP_ERROR_MESSAGES[code]) {
				super(message);
				this.code = code;
			}
		};
		/** 校验结构和归属；存储兼容模式保留旧 locale 下合法的大小写变体名称。 */
		function parseGroups(value, preserveCaseVariants) {
			if (!Array.isArray(value) || value.length > 100) return void 0;
			const groupIds = /* @__PURE__ */ new Set();
			const groupTitles = /* @__PURE__ */ new Set();
			const workspaceIds = /* @__PURE__ */ new Set();
			const groups = [];
			for (const valueGroup of value) {
				if (valueGroup === null || typeof valueGroup !== "object") return void 0;
				const group = valueGroup;
				const id = typeof group.id === "string" ? group.id.trim() : "";
				const title = typeof group.title === "string" ? group.title.trim() : "";
				if (id === "" || id.length > 128 || title === "" || title.length > 80) return void 0;
				const titleKey = preserveCaseVariants ? title : title.toLowerCase();
				if (groupIds.has(id) || groupTitles.has(titleKey)) return void 0;
				if (!Array.isArray(group.workspaceIds) || group.workspaceIds.length > 1e3) return void 0;
				const normalizedIds = [...new Set(group.workspaceIds)];
				if (!normalizedIds.every((workspaceId) => typeof workspaceId === "string" && workspaceId.trim() !== "" && workspaceId.length <= 256)) return void 0;
				if (normalizedIds.some((workspaceId) => workspaceIds.has(workspaceId))) return void 0;
				groupIds.add(id);
				groupTitles.add(titleKey);
				normalizedIds.forEach((workspaceId) => workspaceIds.add(workspaceId));
				groups.push({
					id,
					title,
					workspaceIds: normalizedIds
				});
			}
			return groups;
		}
		/** 旧数据可往返保存且不改名；新名称的大小写判重由创建、重命名操作执行。 */
		function parseStoredWorkspaceGroups(value) {
			return parseGroups(value, true);
		}
		/** 新建空分组；项目只有被显式移动后才会进入其中。 */
		function createWorkspaceGroup(groups, group) {
			if (groups.some((existing) => existing.title.toLowerCase() === group.title.trim().toLowerCase())) throw new WorkspaceGroupError("group-invalid");
			const next = parseStoredWorkspaceGroups([...groups, {
				...group,
				workspaceIds: []
			}]);
			if (next === void 0) throw new WorkspaceGroupError("group-invalid");
			return next;
		}
		/** 仅更改名称，保留分组标识、成员及其顺序。 */
		function renameWorkspaceGroup(groups, groupId, title) {
			if (!groups.some((group) => group.id === groupId)) throw new WorkspaceGroupError("group-missing");
			const normalizedTitle = title.trim();
			if (normalizedTitle === "" || normalizedTitle.length > 80 || groups.some((group) => group.id !== groupId && group.title.toLowerCase() === normalizedTitle.toLowerCase())) throw new WorkspaceGroupError("group-invalid");
			return groups.map((group) => group.id === groupId ? {
				...group,
				title: normalizedTitle
			} : group);
		}
		/** 将项目放入指定分组；未传分组时退回未分组区。 */
		function assignWorkspaceToGroup(groups, workspaceId, groupId) {
			if (workspaceId.trim() === "" || workspaceId.length > 256) throw new WorkspaceGroupError("workspace-invalid");
			if (groupId !== void 0 && !groups.some((group) => group.id === groupId)) throw new WorkspaceGroupError("group-missing");
			return groups.map((group) => ({
				...group,
				workspaceIds: group.id === groupId ? [...group.workspaceIds.filter((id) => id !== workspaceId), workspaceId] : group.workspaceIds.filter((id) => id !== workspaceId)
			}));
		}
		/** 将项目插入目标分组的指定位置，同时从原分组移除。 */
		function placeWorkspaceInGroup(groups, workspaceId, groupId, beforeId) {
			if (workspaceId.trim() === "" || workspaceId.length > 256) throw new WorkspaceGroupError("workspace-invalid");
			const target = groups.find((group) => group.id === groupId);
			if (target === void 0) throw new WorkspaceGroupError("group-missing");
			const targetIds = target.workspaceIds.filter((id) => id !== workspaceId);
			const index = beforeId === void 0 ? targetIds.length : targetIds.indexOf(beforeId);
			if (index < 0) throw new WorkspaceGroupError("order-anchor-missing");
			targetIds.splice(index, 0, workspaceId);
			return groups.map((group) => ({
				...group,
				workspaceIds: group.id === groupId ? targetIds : group.workspaceIds.filter((id) => id !== workspaceId)
			}));
		}
		/** 在同一分组内移动项目；省略锚点时放到分组末尾。 */
		function moveWorkspaceGroupMember(groups, workspaceId, groupId, beforeId) {
			const target = groups.find((group) => group.id === groupId);
			if (target === void 0) throw new WorkspaceGroupError("group-missing");
			if (!target.workspaceIds.includes(workspaceId)) return groups.map((group) => ({
				...group,
				workspaceIds: [...group.workspaceIds]
			}));
			const remaining = target.workspaceIds.filter((id) => id !== workspaceId);
			const index = beforeId === void 0 ? remaining.length : remaining.indexOf(beforeId);
			if (index < 0) throw new WorkspaceGroupError("order-anchor-missing");
			const workspaceIds = [...remaining];
			workspaceIds.splice(index, 0, workspaceId);
			return groups.map((group) => group.id === groupId ? {
				...group,
				workspaceIds
			} : {
				...group,
				workspaceIds: [...group.workspaceIds]
			});
		}
		/** 调整自定义分组顺序；省略锚点时移动到所有自定义分组末尾。 */
		function moveWorkspaceGroup(groups, groupId, beforeGroupId) {
			const moved = groups.find((group) => group.id === groupId);
			if (moved === void 0) throw new WorkspaceGroupError("group-missing");
			if (beforeGroupId === groupId) return groups.map((group) => ({
				...group,
				workspaceIds: [...group.workspaceIds]
			}));
			const remaining = groups.filter((group) => group.id !== groupId);
			const index = beforeGroupId === void 0 ? remaining.length : remaining.findIndex((group) => group.id === beforeGroupId);
			if (index < 0) throw new WorkspaceGroupError("order-anchor-missing");
			remaining.splice(index, 0, moved);
			return remaining.map((group) => ({
				...group,
				workspaceIds: [...group.workspaceIds]
			}));
		}
		/** 删除分组时仅解除归属，不影响工作区本身。 */
		function deleteWorkspaceGroup(groups, groupId) {
			return groups.filter((group) => group.id !== groupId).map((group) => ({
				...group,
				workspaceIds: [...group.workspaceIds]
			}));
		}
		/** 工作区清单变化后清理失效归属，但保留空分组供用户继续使用。 */
		function pruneWorkspaceGroups(groups, validIds) {
			const valid = new Set(validIds);
			return groups.map((group) => ({
				...group,
				workspaceIds: group.workspaceIds.filter((id) => valid.has(id))
			}));
		}
		function groupedWorkspaceIds(groups) {
			return groups.flatMap((group) => group.workspaceIds);
		}
		//#endregion
		//#region src/client/pinned-workspaces.ts
		/** 浏览器本地持久化键；用于工作区偏好的首帧恢复与 Host 故障兜底。 */
		const PINNED_WORKSPACES_STORAGE_KEY = "dsh-codex-ui.pinned-workspace-ids";
		const WORKSPACE_GROUPS_STORAGE_KEY = "dsh-codex-ui.workspace-groups.v1";
		const WORKSPACE_PREFERENCES_ENDPOINT = CODEX_UI_API_ENDPOINTS.preferences;
		/** 清理无效或重复的工作区标识。 */
		function normalizePinnedWorkspaceIds(ids) {
			return [...new Set(ids.filter((id) => id.trim() !== ""))];
		}
		/** 仅在宿主完整基线就绪后清理已经不存在的工作区，避免加载中的临时列表抹掉持久化置顶。 */
		function prunePinnedWorkspaceIds(ids, validIds) {
			const valid = new Set(validIds);
			const next = ids.filter((id) => valid.has(id));
			return next.length === ids.length ? [...ids] : next;
		}
		/** Host 数据优先；旧 Host 或待同步分组使用本地缓存，读取期间的用户操作始终优先。 */
		function resolveWorkspacePreferencesHydration(local, host, dirty, localWorkspaceGroupsPendingHostSync = false) {
			if (dirty !== void 0) return {
				pinnedWorkspaceIds: normalizePinnedWorkspaceIds(dirty.pinnedWorkspaceIds),
				workspaceGroups: dirty.workspaceGroups,
				writeHost: true
			};
			if (host.exists) {
				const preserveLocalGroups = host.workspaceGroupsSupported === false || localWorkspaceGroupsPendingHostSync;
				return {
					pinnedWorkspaceIds: normalizePinnedWorkspaceIds(host.pinnedWorkspaceIds),
					workspaceGroups: preserveLocalGroups ? local.workspaceGroups : host.workspaceGroups,
					writeHost: localWorkspaceGroupsPendingHostSync && host.workspaceGroupsSupported !== false
				};
			}
			const pinnedWorkspaceIds = normalizePinnedWorkspaceIds(local.pinnedWorkspaceIds);
			return {
				pinnedWorkspaceIds,
				workspaceGroups: local.workspaceGroups,
				writeHost: pinnedWorkspaceIds.length > 0 || local.workspaceGroups.length > 0
			};
		}
		async function readHostWorkspacePreferences(fetcher = fetch) {
			const response = await fetcher(WORKSPACE_PREFERENCES_ENDPOINT, {
				method: "GET",
				cache: "no-store",
				signal: AbortSignal.timeout(5e3)
			});
			if (!response.ok) throw new BusinessRequestError(response.status);
			const payload = await response.json();
			if (payload === null || typeof payload !== "object") throw new Error("置顶偏好响应格式无效。");
			const record = payload;
			const workspaceGroupsSupported = Object.prototype.hasOwnProperty.call(record, "workspaceGroups");
			const workspaceGroups = workspaceGroupsSupported ? parseStoredWorkspaceGroups(record.workspaceGroups) : [];
			if (typeof record.exists !== "boolean" || !Array.isArray(record.pinnedWorkspaceIds) || !record.pinnedWorkspaceIds.every((id) => typeof id === "string") || workspaceGroups === void 0) throw new Error("置顶偏好响应格式无效。");
			return {
				exists: record.exists,
				pinnedWorkspaceIds: normalizePinnedWorkspaceIds(record.pinnedWorkspaceIds),
				workspaceGroups,
				workspaceGroupsSupported
			};
		}
		async function writeHostWorkspacePreferences(pinnedWorkspaceIds, workspaceGroups, fetcher = fetch) {
			const groups = parseStoredWorkspaceGroups([...workspaceGroups]);
			if (groups === void 0) throw new Error("工作区分组数据无效。");
			const response = await fetcher(WORKSPACE_PREFERENCES_ENDPOINT, {
				method: "PUT",
				cache: "no-store",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					pinnedWorkspaceIds: normalizePinnedWorkspaceIds(pinnedWorkspaceIds),
					workspaceGroups: groups
				}),
				signal: AbortSignal.timeout(5e3)
			});
			if (!response.ok) throw new BusinessRequestError(response.status);
		}
		/** 兼容旧调用方；新代码应同时写入分组。 */
		async function readHostPinnedWorkspaceIds(fetcher = fetch) {
			return readHostWorkspacePreferences(fetcher);
		}
		/** 在置顶列表中切换一个工作区。 */
		/** 把工作区插入置顶列表的指定位置；省略锚点时追加到末尾。 */
		function insertPinnedWorkspace(ids, id, beforeId) {
			const next = ids.filter((item) => item !== id);
			if (beforeId === void 0) return [...next, id];
			if (beforeId === id) return ids.includes(id) ? [...ids] : [...next, id];
			const index = next.indexOf(beforeId);
			next.splice(index < 0 ? next.length : index, 0, id);
			return next;
		}
		function togglePinnedWorkspace(ids, workspaceId) {
			return ids.includes(workspaceId) ? ids.filter((id) => id !== workspaceId) : [...ids, workspaceId];
		}
		/** 从浏览器本地存储读取置顶工作区；损坏数据按空列表处理。 */
		function readPinnedWorkspaceIds(storage) {
			if (storage === void 0) return [];
			try {
				const value = JSON.parse(storage.getItem("dsh-codex-ui.pinned-workspace-ids") ?? "[]");
				return Array.isArray(value) && value.every((id) => typeof id === "string") ? normalizePinnedWorkspaceIds(value) : [];
			} catch {
				return [];
			}
		}
		/** 保存置顶工作区；存储不可用时不影响导航。 */
		function savePinnedWorkspaceIds(storage, ids) {
			if (storage === void 0) return;
			try {
				storage.setItem(PINNED_WORKSPACES_STORAGE_KEY, JSON.stringify(normalizePinnedWorkspaceIds(ids)));
			} catch {}
		}
		/** 分组缓存用于首帧恢复和 Host 暂时不可用时兜底，并记录尚未完成的 Host 迁移。 */
		function readWorkspaceGroupsCache(storage) {
			if (storage === void 0) return {
				workspaceGroups: [],
				pendingHostSync: false
			};
			try {
				const value = JSON.parse(storage.getItem("dsh-codex-ui.workspace-groups.v1") ?? "{\"version\":1,\"workspaceGroups\":[],\"pendingHostSync\":false}");
				if (value === null || typeof value !== "object") return {
					workspaceGroups: [],
					pendingHostSync: false
				};
				const record = value;
				const workspaceGroups = record.version === 1 ? parseStoredWorkspaceGroups(record.workspaceGroups) : void 0;
				if (workspaceGroups === void 0 || typeof record.pendingHostSync !== "boolean") return {
					workspaceGroups: [],
					pendingHostSync: false
				};
				return {
					workspaceGroups,
					pendingHostSync: record.pendingHostSync
				};
			} catch {
				return {
					workspaceGroups: [],
					pendingHostSync: false
				};
			}
		}
		function saveWorkspaceGroupsCache(storage, groups, pendingHostSync) {
			if (storage === void 0) return;
			const workspaceGroups = parseStoredWorkspaceGroups([...groups]);
			if (workspaceGroups === void 0) return;
			try {
				storage.setItem(WORKSPACE_GROUPS_STORAGE_KEY, JSON.stringify({
					version: 1,
					workspaceGroups,
					pendingHostSync
				}));
			} catch {}
		}
		//#endregion
		//#region src/client/session-manager.ts
		const SESSION_UNREAD_STORAGE_KEY = "dsh.session-unread.v1";
		function normalizeSessionIds(ids) {
			return [...new Set(ids.filter((id) => id.trim() !== ""))];
		}
		function toggleSessionId(ids, sessionId) {
			return ids.includes(sessionId) ? ids.filter((id) => id !== sessionId) : [sessionId, ...ids.filter((id) => id !== sessionId)];
		}
		/** 返回本次刷新中结束、且不在当前会话中的后台会话。 */
		function completedBackgroundSessionIds(previous, current, currentSessionId) {
			return Object.entries(current).flatMap(([id, running]) => previous[id] === true && running !== true && id !== currentSessionId ? [id] : []);
		}
		function readSessionIds(storage, key) {
			if (storage === void 0) return [];
			try {
				const value = JSON.parse(storage.getItem(key) ?? "{\"version\":1,\"ids\":[]}");
				if (value === null || typeof value !== "object") return [];
				const ids = value.ids;
				return Array.isArray(ids) && ids.every((id) => typeof id === "string") ? normalizeSessionIds(ids) : [];
			} catch {
				return [];
			}
		}
		function writeSessionIds(storage, key, ids) {
			if (storage === void 0) return;
			try {
				storage.setItem(key, JSON.stringify({
					version: 1,
					ids: normalizeSessionIds(ids)
				}));
			} catch {}
		}
		//#endregion
		//#region src/client/hover-tip.ts
		/** 把悬停卡片限制在视口内，避免贴边裁切。 */
		function clampHoverCardPosition(left, top, width, height, viewportWidth, viewportHeight) {
			const pad = 8;
			return {
				left: Math.min(Math.max(left, pad), Math.max(pad, viewportWidth - width - pad)),
				top: Math.min(Math.max(top, pad), Math.max(pad, viewportHeight - height - pad))
			};
		}
		/** 从行元素算出卡片出现在右侧的初始坐标。 */
		function hoverCardAnchor(rect) {
			return {
				left: rect.right + 8,
				top: rect.top
			};
		}
		const HOUR = 3600;
		const DAY = HOUR * 24;
		const WEEK = DAY * 7;
		const MONTH = DAY * 30;
		const YEAR = DAY * 365;
		function formatRelativeTime(updatedAt, t, now, justNow) {
			const seconds = Math.max(0, Math.floor((now - updatedAt) / 1e3));
			if (seconds < 60) return t(justNow);
			if (seconds < HOUR) return t("time.minutes", { count: Math.floor(seconds / 60) });
			if (seconds < DAY) return t("time.hours", { count: Math.floor(seconds / HOUR) });
			if (seconds < WEEK) return t("time.days", { count: Math.floor(seconds / DAY) });
			if (seconds < MONTH) return t("time.weeks", { count: Math.floor(seconds / WEEK) });
			if (seconds < YEAR) return t("time.months", { count: Math.floor(seconds / MONTH) });
			return t("time.years", { count: Math.floor(seconds / YEAR) });
		}
		/** 悬停卡片右上角。分档与 ChatGPT `$wa` 一致；英文刚刚用 Just now。 */
		function formatHoverTime(updatedAt, t, now = Date.now()) {
			return formatRelativeTime(updatedAt, t, now, "time.justNow");
		}
		/** 会话行右侧。分档相同；英文刚刚用 now，避免挤占标题。 */
		function formatCompactTime(updatedAt, t, now = Date.now()) {
			return formatRelativeTime(updatedAt, t, now, "time.justNowShort");
		}
		//#endregion
		//#region src/client/shared-now.ts
		const SHARED_NOW_INTERVAL_MS = 6e4;
		/** 对齐到下一个整档，避免「刚刚」在整分钟边界之后还多停将近一轮。 */
		function msUntilNextNowTick(now, intervalMs = SHARED_NOW_INTERVAL_MS) {
			const remainder = now % intervalMs;
			return remainder === 0 ? intervalMs : intervalMs - remainder;
		}
		const listeners = /* @__PURE__ */ new Set();
		let sharedNow = Date.now();
		let timeoutId = 0;
		let intervalId = 0;
		let cancelled = true;
		function publish(now) {
			sharedNow = now;
			for (const listener of listeners) listener();
		}
		function startClock() {
			cancelled = false;
			timeoutId = window.setTimeout(() => {
				if (cancelled) return;
				publish(Date.now());
				intervalId = window.setInterval(() => {
					publish(Date.now());
				}, SHARED_NOW_INTERVAL_MS);
				if (cancelled) {
					window.clearInterval(intervalId);
					intervalId = 0;
				}
			}, msUntilNextNowTick(Date.now()));
		}
		function stopClock() {
			cancelled = true;
			window.clearTimeout(timeoutId);
			window.clearInterval(intervalId);
			timeoutId = 0;
			intervalId = 0;
		}
		function subscribe(listener) {
			if (listeners.size === 0) {
				sharedNow = Date.now();
				startClock();
			}
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) stopClock();
			};
		}
		function getSnapshot() {
			return sharedNow;
		}
		/** 模块级当前时刻。几棵树挂着都只走一套定时器，每分钟刷新一次。 */
		function useSharedNow() {
			return (0, react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
		}
		//#endregion
		//#region src/client/conversation-bubbles.ts
		/** 撤回旧版用户卡片和长文本展开覆盖，恢复 DSH 官方气泡。 */
		const USER_BUBBLE_STYLE_ID = "dcu-user-bubble-style";
		const USER_BUBBLE_EXPAND_STYLE_ID = "dcu-user-bubble-expand-style";
		function restoreOfficialUserBubbles(root) {
			const doc = "getElementById" in root ? root : root.ownerDocument;
			doc?.getElementById(USER_BUBBLE_STYLE_ID)?.remove();
			doc?.getElementById(USER_BUBBLE_EXPAND_STYLE_ID)?.remove();
			for (const card of root.querySelectorAll("[data-dcu-user-card]")) card.remove();
			const selector = "[data-dcu-user-source],[data-dcu-expandable-user-bubble]";
			const sources = [...root.querySelectorAll(selector)];
			if (root instanceof HTMLElement && root.matches(selector)) sources.unshift(root);
			for (const source of sources) {
				source.removeAttribute("data-dcu-user-source");
				source.removeAttribute("data-dcu-expandable-user-bubble");
			}
		}
		//#endregion
		//#region src/client/conversation-header.ts
		const CONVERSATION_HEADER_STYLE_ID = "dcu-conversation-header-style";
		const HEADER_PROJECT_TIP_EVENT = "dcu-header-project-tip";
		const HEADER_SESSION_MENU_EVENT = "dcu-header-session-menu";
		const CONVERSATION_HEADER_STYLE = `
/* 页签控件高 30px，是顶栏最高子项：上下各留 8px，顶栏正好 46px（Codex --height-toolbar）。 */
header:has([data-dcu-inline-tabs]){box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:10px;min-height:var(--dcu-header-height,46px);padding-top:calc((var(--dcu-header-height,46px) - 30px)/2);padding-bottom:calc((var(--dcu-header-height,46px) - 30px)/2);border-bottom:0}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]){box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:10px;min-height:var(--dcu-header-height,46px);padding-top:calc((var(--dcu-header-height,46px) - 28px)/2);padding-bottom:calc((var(--dcu-header-height,46px) - 28px)/2);border-bottom:0}
/* titleRow 被摊平后不再生成盒子，宿主写在上面的窗口安全区内边距会整体丢失：
   macOS 折叠时顶栏内容会滑到红绿灯和 shell.leading 的打开/新建按钮下面。
   这里把等价留白补到 header 上，并用运行时窄轨宽度换算回同一绝对位置。 */
header:has([data-dcu-inline-tabs]),
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]){padding-left:max(20px,calc(var(--dsh-frame-leading-clearance,0px) - var(--dcu-sidebar-rail-width,0px)))}
header:has([data-dcu-inline-tabs]):after{display:none;content:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]):after{display:none;content:none}
header:has([data-dcu-inline-tabs]) [class*="titleRow"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="titleRow"],header:has([data-dcu-inline-tabs]) [class*="titleCluster"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="titleCluster"]{display:contents}
header:has([data-dcu-inline-tabs]) [class*="crumbs"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="crumbs"]{order:1;flex:0 999 auto;min-width:24px}
header:has([data-dcu-inline-tabs]) [class*="crumbSeg"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="crumbSeg"]{flex:none}
/* Codex 顶栏只保留当前会话标题：项目前缀段与分隔符隐藏，段结构保留以便宿主交互逻辑不变。 */
header [class*="crumbs"]>[class*="crumbSeg"]:not(:has([class*="crumbCurrent"])){display:none}
header [class*="crumbs"] [class*="crumbSep"]{display:none}
header:has([data-dcu-inline-tabs]) [class*="headerActions"],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerActions"]{order:2;flex:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerActions"]{margin-right:auto}
header [data-dcu-inline-tabs]{box-sizing:border-box;order:3;flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:0;margin:0 0 0 auto;padding:2px;height:30px;position:relative;z-index:1;overflow:hidden;border:0;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#0d0d0d) 5%,transparent)}
header:has([data-dcu-inline-tabs]) [class*="headerUtilities"]{order:4;flex:none}
header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [class*="headerUtilities"]{order:4;flex:none}
/* 新版角落插槽被 display:contents 摊平后，需要独立排序并撤销嵌套布局的边距补偿。 */
header:has([data-dcu-inline-tabs]) [data-conversation-header-corner],header:not(:has([data-dcu-inline-tabs])):has([class*="crumbCurrent"]) [data-conversation-header-corner]{order:5;flex:none;margin-left:0;margin-right:0}
header [data-dcu-tab-slider]{position:absolute;left:0;top:2px;height:26px;border-radius:7px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.08);pointer-events:none;z-index:0;opacity:0;transform:translateX(0);width:0;transition:transform 240ms cubic-bezier(.16,1,.3,1),width 240ms cubic-bezier(.16,1,.3,1),opacity 160ms ease}
body[data-ds-dark-theme] header [data-dcu-tab-slider]{background:#383838;box-shadow:0 0 0 .5px rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.3)}
/* 顶栏统一使用 34px 控件带：与宿主扩展常用的 top:3px + 28px 图标按钮同心。
   better-sidebar 0.18.0 收起时会把开关组改到 14px（按官方 padding-top:12px 算），
   这里只在紧凑顶栏存在时扣回 3px，不搬 DOM、不跟展开/收起跳动。 */
body[data-dsh-sidebar-collapsed]:has([data-dcu-inline-tabs]) [data-dsh-toggle-cluster]{top:calc(3px + env(safe-area-inset-top))}
body[data-dsh-sidebar-collapsed][data-dsh-title-bar-compat]:has([data-dcu-inline-tabs]) [data-dsh-toggle-cluster]{top:calc(var(--dsh-title-bar-strip, 40px) + 3px)}
body[data-dsh-sidebar-collapsed]:has([class*="crumbCurrent"]) [data-dsh-toggle-cluster]{top:calc(3px + env(safe-area-inset-top))}
body[data-dsh-sidebar-collapsed][data-dsh-title-bar-compat]:has([class*="crumbCurrent"]) [data-dsh-toggle-cluster]{top:calc(var(--dsh-title-bar-strip, 40px) + 3px)}
header [data-dcu-inline-tabs] [role=tab]{box-sizing:border-box;position:relative;z-index:1;height:26px;padding:3px 10px;margin:0;line-height:20px;color:var(--dsw-alias-label-tertiary);border:0;box-shadow:none;background:transparent;font-size:13px;white-space:nowrap}
header [data-dcu-inline-tabs] [role=tab][aria-selected=true],header [data-dcu-inline-tabs] [role=tab][data-state=active]{color:var(--dsw-alias-label-primary,currentColor);font-weight:500}
header [data-dcu-inline-tabs] [role=tab]:after,header [data-dcu-inline-tabs] [role=tab]:before{display:none!important;content:none!important;background:transparent!important;height:0!important}
header [data-dcu-inline-tabs] [role=tab]:focus-visible{outline:2px solid var(--dsw-alias-button-info-fill,#4c8dff);outline-offset:-2px}
/* 标题段强制居中排版：文件夹/···按钮与右侧顶栏图标共用同一垂直中线，不吃行内基线偏移。 */
header [class*="crumbSeg"]:has([class*="crumbCurrent"]){display:inline-flex;align-items:center}
header [data-dcu-title-folder],header [data-dcu-title-more]{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-tertiary,currentColor);display:inline-grid;place-items:center;padding:0;cursor:pointer;border-radius:4px}
/* 文件夹与 ··· 同为 20px 命中区、18px Tabler 图标：与右侧顶栏图标族同规格、同一中线。 */
header [data-dcu-title-folder]{width:20px;height:20px}
header [data-dcu-title-more]{width:20px;height:20px}
header [data-dcu-title-folder]:hover,header [data-dcu-title-more]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,currentColor)}
header [data-dcu-title-folder] svg,header [data-dcu-title-more] svg{display:block}
`;
		const FOLDER_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2\"/></svg>";
		const MORE_SVG = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><circle cx=\"4\" cy=\"8\" r=\"1.15\" fill=\"currentColor\"/><circle cx=\"8\" cy=\"8\" r=\"1.15\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"8\" r=\"1.15\" fill=\"currentColor\"/></svg>";
		function findConversationTablist(root) {
			if ("matches" in root && typeof root.matches === "function" && root.matches("[role=tablist]")) return root;
			return root.querySelector("header [role=tablist]") ?? void 0;
		}
		/** 只给宿主页签打内联标记，视觉重排交给样式表；DOM 结构保持宿主原样。 */
		function placeConversationTabs(root) {
			const tabs = findConversationTablist(root);
			if (tabs === void 0 || tabs.dataset.dcuInlineTabs === "") return false;
			tabs.dataset.dcuInlineTabs = "";
			return true;
		}
		function emit(name, target, extra = {}) {
			const box = target.getBoundingClientRect();
			target.dispatchEvent(new CustomEvent(name, {
				bubbles: true,
				detail: {
					left: box.right + 8,
					top: box.top,
					getRect: () => target.getBoundingClientRect(),
					...extra
				}
			}));
		}
		function buildTitleButton(doc, marker, svg, event, extra) {
			const button = doc.createElement("button");
			button.type = "button";
			if (marker === "folder") button.dataset.dcuTitleFolder = "";
			else button.dataset.dcuTitleMore = "";
			button.innerHTML = svg;
			button.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				emit(event, button, extra);
			});
			return button;
		}
		/** 在标题前后插入文件夹/三点按钮：只插入插件自己的节点，不搬移宿主标题。 */
		function decorateConversationTitle(root) {
			const title = root.querySelector("header [class*=\"crumbCurrent\"]");
			if (title === null) return false;
			const scope = title.closest("header") ?? title.ownerDocument;
			for (const stale of scope.querySelectorAll("[data-dcu-title-folder], [data-dcu-title-more]")) if (stale.previousElementSibling !== title && stale.nextElementSibling !== title) stale.remove();
			const folder = title.previousElementSibling;
			const more = title.nextElementSibling;
			if (folder?.matches("[data-dcu-title-folder]") === true && more?.matches("[data-dcu-title-more]") === true) return false;
			folder?.matches("[data-dcu-title-folder]") === true && folder.remove();
			more?.matches("[data-dcu-title-more]") === true && more.remove();
			const doc = title.ownerDocument;
			title.before(buildTitleButton(doc, "folder", FOLDER_SVG, HEADER_PROJECT_TIP_EVENT, { toggle: true }));
			title.after(buildTitleButton(doc, "more", MORE_SVG, HEADER_SESSION_MENU_EVENT));
			return true;
		}
		function selectedConversationTab(tabs) {
			return tabs.querySelector("[role=tab][aria-selected=true], [role=tab][data-state=active]") ?? void 0;
		}
		function syncTabSlider(root) {
			const tabs = findConversationTablist(root);
			if (tabs === void 0) return;
			const doc = tabs.ownerDocument;
			let slider = tabs.querySelector("[data-dcu-tab-slider]");
			if (slider === null) {
				slider = doc.createElement("span");
				slider.dataset.dcuTabSlider = "";
				tabs.prepend(slider);
			}
			const selected = selectedConversationTab(tabs);
			if (selected === void 0) {
				slider.style.opacity = "0";
				return;
			}
			const listBox = tabs.getBoundingClientRect();
			const tabBox = selected.getBoundingClientRect();
			slider.style.opacity = "1";
			slider.style.width = `${Math.max(0, tabBox.width)}px`;
			slider.style.transform = `translateX(${Math.max(0, tabBox.left - listBox.left)}px)`;
		}
		function watchTabSelection(tabs) {
			tabs.dataset.dcuTabWatch = "";
			const sync = () => {
				syncTabSlider(tabs);
			};
			const onClick = () => {
				window.requestAnimationFrame(sync);
			};
			const observer = new MutationObserver(sync);
			observer.observe(tabs, {
				attributes: true,
				subtree: true,
				attributeFilter: ["aria-selected", "data-state"]
			});
			tabs.addEventListener("click", onClick);
			return () => {
				observer.disconnect();
				tabs.removeEventListener("click", onClick);
				delete tabs.dataset.dcuTabWatch;
			};
		}
		function ensureStyle(doc) {
			if (doc.getElementById("dcu-conversation-header-style") !== null) return;
			const style = doc.createElement("style");
			style.id = CONVERSATION_HEADER_STYLE_ID;
			style.textContent = CONVERSATION_HEADER_STYLE;
			doc.head.append(style);
		}
		const CONVERSATION_BUBBLE_SELECTOR = "[data-time-hover-root],[data-dcu-user-card],[data-dcu-user-source]";
		function inspectConversationNode(node, impact, includeDescendants) {
			if (!(node instanceof Element)) return;
			if (node.matches("header") || node.closest("header") !== null || includeDescendants && node.querySelector("header") !== null) impact.headerChanged = true;
			const row = node.closest("[data-time-hover-root]");
			if (row !== null) {
				impact.bubbleRoots.add(row);
				return;
			}
			if (node.matches(CONVERSATION_BUBBLE_SELECTOR) || includeDescendants && node.querySelector(CONVERSATION_BUBBLE_SELECTOR) !== null) impact.bubbleRoots.add(node);
		}
		function conversationMutationImpact(records) {
			const impact = {
				headerChanged: false,
				bubbleRoots: /* @__PURE__ */ new Set()
			};
			for (const record of records) {
				inspectConversationNode(record.target, impact, false);
				for (const node of record.addedNodes) inspectConversationNode(node, impact, true);
				for (const node of record.removedNodes) if (node instanceof Element && (node.matches("header") || node.querySelector("header") !== null)) impact.headerChanged = true;
			}
			return impact;
		}
		/** 观察会话顶栏与用户气泡；只对相关子树变更按帧合并，流式回答不会触发全文档扫描。 */
		function observeConversationHeader(doc = document) {
			if (doc.head === null || doc.body === null) return () => {};
			ensureStyle(doc);
			restoreOfficialUserBubbles(doc);
			let applying = false;
			let frame;
			let headerPending = true;
			const bubbleRoots = /* @__PURE__ */ new Set();
			let watchedTabs;
			let stopWatchingTabs;
			const run = () => {
				frame = void 0;
				if (applying) return;
				applying = true;
				try {
					const roots = [...bubbleRoots];
					bubbleRoots.clear();
					for (const root of roots) restoreOfficialUserBubbles(root);
					if (headerPending) {
						headerPending = false;
						placeConversationTabs(doc);
						const tabs = findConversationTablist(doc);
						if (tabs !== watchedTabs) {
							stopWatchingTabs?.();
							watchedTabs = tabs;
							stopWatchingTabs = tabs === void 0 ? void 0 : watchTabSelection(tabs);
						}
						syncTabSlider(doc);
						decorateConversationTitle(doc);
					}
				} finally {
					applying = false;
				}
			};
			const sync = () => {
				if (frame !== void 0) return;
				frame = window.requestAnimationFrame(run);
			};
			sync();
			const observer = new MutationObserver((records) => {
				const impact = conversationMutationImpact(records);
				if (!impact.headerChanged && impact.bubbleRoots.size === 0) return;
				headerPending ||= impact.headerChanged;
				for (const root of impact.bubbleRoots) bubbleRoots.add(root);
				sync();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				stopWatchingTabs?.();
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				doc.getElementById(CONVERSATION_HEADER_STYLE_ID)?.remove();
				doc.querySelectorAll("[data-dcu-title-folder], [data-dcu-title-more], [data-dcu-tab-slider]").forEach((node) => node.remove());
			};
		}
		//#endregion
		//#region src/client/hover-shell.tsx
		const HOVER_TIP_SHOW_DELAY_MS = 1e3;
		const WORKSPACE_HOVER_CARD_ESTIMATED_HEIGHT = 152;
		const HoverDispatchContext = (0, react.createContext)({
			showTip: () => {},
			hideTip: () => {},
			dismissTip: () => {},
			keepTip: () => {},
			isShowing: () => false
		});
		const HoverValueContext = (0, react.createContext)(void 0);
		/** 悬停状态放在独立 Provider 里，读 tip 的卡片会更新，树组件只拿稳定的 dispatch。 */
		function HoverShell({ blocked = false, children }) {
			const [hoverTip, setHoverTip] = (0, react.useState)();
			const hideTipTimer = (0, react.useRef)();
			const showTipTimer = (0, react.useRef)();
			const pendingTip = (0, react.useRef)();
			const blockedRef = (0, react.useRef)(blocked);
			blockedRef.current = blocked;
			const tipRef = (0, react.useRef)(hoverTip);
			tipRef.current = hoverTip;
			const place = (tip) => ({
				...tip,
				...clampHoverCardPosition(tip.left, tip.top, tip.kind === "workspace" ? 316 : 248, tip.kind === "workspace" ? WORKSPACE_HOVER_CARD_ESTIMATED_HEIGHT : 148, window.innerWidth, window.innerHeight)
			});
			const dispatch = (0, react.useMemo)(() => ({
				showTip: (tip, options) => {
					if (blockedRef.current) return;
					if (hideTipTimer.current !== void 0) {
						window.clearTimeout(hideTipTimer.current);
						hideTipTimer.current = void 0;
					}
					pendingTip.current = tip;
					if (options?.immediate === true || tipRef.current !== void 0) {
						if (showTipTimer.current !== void 0) {
							window.clearTimeout(showTipTimer.current);
							showTipTimer.current = void 0;
						}
						setHoverTip(place(tip));
						return;
					}
					if (showTipTimer.current !== void 0) window.clearTimeout(showTipTimer.current);
					showTipTimer.current = window.setTimeout(() => {
						showTipTimer.current = void 0;
						const next = pendingTip.current;
						if (blockedRef.current || next === void 0) return;
						setHoverTip(place(next));
					}, HOVER_TIP_SHOW_DELAY_MS);
				},
				hideTip: () => {
					pendingTip.current = void 0;
					if (showTipTimer.current !== void 0) {
						window.clearTimeout(showTipTimer.current);
						showTipTimer.current = void 0;
					}
					if (hideTipTimer.current !== void 0) window.clearTimeout(hideTipTimer.current);
					hideTipTimer.current = window.setTimeout(() => {
						setHoverTip(void 0);
					}, 120);
				},
				dismissTip: () => {
					pendingTip.current = void 0;
					if (showTipTimer.current !== void 0) {
						window.clearTimeout(showTipTimer.current);
						showTipTimer.current = void 0;
					}
					if (hideTipTimer.current !== void 0) {
						window.clearTimeout(hideTipTimer.current);
						hideTipTimer.current = void 0;
					}
					setHoverTip(void 0);
				},
				keepTip: () => {
					if (hideTipTimer.current !== void 0) {
						window.clearTimeout(hideTipTimer.current);
						hideTipTimer.current = void 0;
					}
				},
				isShowing: (kind, id) => tipRef.current?.kind === kind && tipRef.current.id === id
			}), []);
			(0, react.useEffect)(() => () => {
				if (hideTipTimer.current !== void 0) window.clearTimeout(hideTipTimer.current);
				if (showTipTimer.current !== void 0) window.clearTimeout(showTipTimer.current);
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverDispatchContext.Provider, {
				value: dispatch,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverValueContext.Provider, {
					value: hoverTip,
					children
				})
			});
		}
		function useHoverDispatch() {
			return (0, react.useContext)(HoverDispatchContext);
		}
		function useHoverValue() {
			return (0, react.useContext)(HoverValueContext);
		}
		//#endregion
		//#region src/client/workspace-hover-card.tsx
		/** 只订阅悬停值，避免工作区树随鼠标移动整树重绘。 */
		function WorkspaceHoverCard({ t, onEditWorkspace, onToggleWorkspacePin }) {
			const hoverTip = useHoverValue();
			const { keepTip, hideTip, dismissTip } = useHoverDispatch();
			(0, react.useEffect)(() => {
				if (hoverTip === void 0) return;
				const onPointerDown = (event) => {
					const target = event.target;
					if (!(target instanceof Element)) return;
					if (target.closest(".dcu-wb-tip") !== null || target.closest("[data-dcu-title-folder]") !== null || target.closest(".dcu-wb-project-head") !== null) return;
					dismissTip();
				};
				window.addEventListener("pointerdown", onPointerDown, true);
				return () => {
					window.removeEventListener("pointerdown", onPointerDown, true);
				};
			}, [hoverTip, dismissTip]);
			if (hoverTip === void 0) return null;
			const workspace = hoverTip.kind === "workspace";
			const workspaceId = workspace ? hoverTip.id : void 0;
			const taskSummary = hoverTip.unreadCount !== void 0 && hoverTip.unreadCount > 0 ? t("workspace.taskSummary", {
				count: hoverTip.count ?? 0,
				unreadCount: hoverTip.unreadCount
			}) : t("workspace.taskCount", { count: hoverTip.count ?? 0 });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `dcu-wb-tip${workspace ? " dcu-wb-tip-workspace" : ""}`,
				style: {
					left: hoverTip.left,
					top: hoverTip.top
				},
				onMouseEnter: keepTip,
				onMouseLeave: hideTip,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-title",
						children: [
							workspace && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-folder",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-tip-title-main",
								children: hoverTip.title
							}),
							workspaceId !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dcu-wb-tip-pin",
								"aria-label": t(hoverTip.pinned === true ? "workspace.unpin" : "workspace.pin"),
								onClick: () => {
									onToggleWorkspacePin(workspaceId);
									dismissTip();
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PinIcon, {})
							}) : hoverTip.time !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-tip-time",
								children: hoverTip.time
							})
						]
					}),
					workspace && hoverTip.count !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-meta",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageCircle, {
							"aria-hidden": "true",
							size: 16,
							strokeWidth: 1.5
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: taskSummary })]
					}),
					workspace && hoverTip.path !== void 0 && hoverTip.path !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-row dcu-wb-tip-path",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-folder",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-tip-path-copy",
							children: hoverTip.path
						})]
					}),
					!workspace && hoverTip.project !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-folder",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: hoverTip.project })]
					}),
					!workspace && hoverTip.branch !== void 0 && hoverTip.branch !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tip-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-folder",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBranchOutlineMedium, { size: 16 })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: hoverTip.branch })]
					}),
					workspaceId !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dcu-wb-tip-sep" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dcu-wb-tip-edit",
						onClick: () => {
							onEditWorkspace(workspaceId, hoverTip.title);
							dismissTip();
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSettingsOutlineMedium, { size: 16 }), t("workspace.edit")]
					})] })
				]
			});
		}
		/** DSH 会话头不能写 origin=im，频道会话只靠 id 前缀。 */
		function isChannelSession(id) {
			return id.startsWith("im:");
		}
		//#endregion
		//#region src/client/schedule-sessions.ts
		const AUTOMATION_SESSION_PREFIX = "dsh-automation-session-";
		function isScheduleSession(id, _title) {
			return id.startsWith(AUTOMATION_SESSION_PREFIX);
		}
		function scheduleGroupName(title) {
			const name = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*-\s*(.+)$/.exec(title.trim())?.[2]?.trim();
			return name !== void 0 && name !== "" ? name : title.trim();
		}
		/** 把定时运行会话按任务名收成和任务树一样的分组。 */
		function groupScheduleSessions(items, locale = "zh-CN") {
			const groups = /* @__PURE__ */ new Map();
			for (const item of items) {
				if (!isScheduleSession(item.id, item.title)) continue;
				const label = scheduleGroupName(item.title);
				const current = groups.get(label) ?? {
					id: label,
					label,
					sessions: []
				};
				current.sessions.push(item);
				groups.set(label, current);
			}
			return [...groups.values()].map((group) => ({
				...group,
				sessions: [...group.sessions].sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
			})).sort((left, right) => left.label.localeCompare(right.label, locale, {
				numeric: true,
				sensitivity: "base"
			}));
		}
		//#endregion
		//#region src/client/workspace-browser.ts
		/** 任务树只保留普通会话，频道和定时会话各走自己的页签。 */
		function isTaskSession(session) {
			if (session.origin === "subagent" || session.origin === "im" || session.blank === true) return false;
			if (isChannelSession(session.id)) return false;
			return !isScheduleSession(session.id, session.displayTitle ?? session.title ?? "");
		}
		/**
		* 对齐本机 Codex 26.915.4065.0 的项目会话列表。
		* 未展开时显示 5 条；展开后每次再加 10 条。按钮文案保持「展开显示」，全部露出后消失。
		* 当前会话落在窗口外时追加到末尾。
		*/
		function projectSessionWindow(ids, state, forcedId) {
			const page = state.page < 1 ? 1 : state.page;
			const limit = state.expanded ? 5 + 10 * page : 5;
			const head = ids.slice(0, limit);
			const visible = forcedId !== void 0 && ids.includes(forcedId) && !head.includes(forcedId) ? [...head, forcedId] : head;
			return {
				ids: visible,
				showMore: visible.length < ids.length
			};
		}
		/**
		* 折叠项目文件夹时清掉「展开显示」。
		* 安装包 i$n：文件夹从展开变为折叠时，对 `project:${id}` 调用 sE(..., false)。
		*/
		function collapseProjectSessionWindow() {
			return {
				expanded: false,
				page: 1
			};
		}
		/** 第一次展开把页码设为 1（可见 15 条），之后每点一次页码加 1。 */
		function nextProjectSessionWindow(state) {
			const current = state ?? {
				expanded: false,
				page: 1
			};
			if (!current.expanded) return {
				expanded: true,
				page: 1
			};
			return {
				expanded: true,
				page: current.page + 1
			};
		}
		/**
		* 会话行蓝线的落点：只在被悬停的那一行下方，且仅当它后面那条会话被折起或不存在。
		* 下一行仍可见时交给它自己的 before 线，避免两条平行蓝线。
		*/
		function sessionDropAfterRowId(drop, renderedIds) {
			const hoveredId = drop?.hoveredId;
			if (hoveredId === void 0 || !renderedIds.includes(hoveredId)) return void 0;
			const beforeId = drop?.beforeId;
			if (beforeId !== void 0 && renderedIds.includes(beforeId)) return void 0;
			return hoveredId;
		}
		/** 过滤不应出现在工作区树中的会话。 */
		function visibleSessionIds(ids, byId, archivedIds) {
			const archived = new Set(archivedIds);
			return ids.filter((id) => {
				const session = byId[id];
				return session !== void 0 && !archived.has(id) && isTaskSession({
					...session,
					id: session.id || id
				});
			});
		}
		/** 没有归属任何项目的普通会话，放到「最近」。 */
		function ungroupedSessionIds(ids, byId, assignedIds, archivedIds) {
			const assigned = new Set(assignedIds);
			return visibleSessionIds(ids, byId, archivedIds).filter((id) => !assigned.has(id));
		}
		/** 将一个项目或会话移到指定项之前；省略锚点时追加到末尾。 */
		function moveBefore(ids, id, beforeId) {
			if (!ids.includes(id) || beforeId === id) return [...ids];
			const next = ids.filter((item) => item !== id);
			const index = beforeId === void 0 ? next.length : next.indexOf(beforeId);
			next.splice(index < 0 ? next.length : index, 0, id);
			return next;
		}
		/**
		* 复刻 Codex 的排序落点：先从当前列表移除被拖项，再把落点表示成“插到谁之前”。
		* null 表示悬停自身或最终顺序不变，此时不显示蓝线，也不执行排序。
		*/
		function reorderDropBeforeId(ids, draggedId, hoveredId, after) {
			if (draggedId === hoveredId || !ids.includes(hoveredId)) return null;
			const remaining = ids.filter((id) => id !== draggedId);
			const hoveredIndex = remaining.indexOf(hoveredId);
			if (hoveredIndex < 0) return null;
			const beforeId = after ? remaining[hoveredIndex + 1] : hoveredId;
			if (!ids.includes(draggedId)) return beforeId;
			return moveBefore(ids, draggedId, beforeId).every((id, index) => id === ids[index]) ? null : beforeId;
		}
		/**
		* 置顶标题区与首项目的上半区都表示“插到第一项之前”，因此必须共用同一条指示线。
		* 非空列表把指示线贴到首项目顶部；空列表才使用独立的起始占位线。
		*/
		function pinnedHeaderDropIndicator(ids) {
			const workspaceId = ids[0];
			return workspaceId === void 0 ? { kind: "empty" } : {
				kind: "workspace",
				workspaceId
			};
		}
		/**
		* 空置顶没有项目行可自行计算落点，松手时 dragleave 又常把 relatedTarget 置空并清掉蓝线。
		* 只要这次 drop 发生在置顶区，空列表也必须把项目置顶。
		*/
		function resolvePinnedSectionDrop(draggedWorkspace, target, pinnedEmpty) {
			if (draggedWorkspace === void 0) return void 0;
			if (target?.zone === "pinned") return {
				id: draggedWorkspace,
				beforeId: target.beforeId
			};
			return pinnedEmpty ? { id: draggedWorkspace } : void 0;
		}
		/** 按指定 id 顺序取出对应项；未出现在 ids 中的项丢弃。 */
		function orderByIds(items, ids, idOf) {
			const byId = new Map(items.map((item) => [idOf(item), item]));
			return ids.flatMap((id) => {
				const item = byId.get(id);
				return item === void 0 ? [] : [item];
			});
		}
		/** 展开移动目标的全部父级，保证页面重载并选中会话后该行仍然可见。 */
		function expandedForSessionMove(current, target) {
			const next = { ...current };
			if (target.pinned) {
				next["section:pinned"] = true;
				next[`pin:${target.workspaceId}`] = true;
				return next;
			}
			next["section:projects"] = true;
			next[target.workspaceId] = true;
			if (target.groupId !== void 0) next[`workspace-group:${target.groupId}`] = true;
			else if (target.hasGroups) next["workspace-group:ungrouped"] = true;
			return next;
		}
		function workspaceIdForSession(workspaces, sessionId) {
			return workspaces.find((workspace) => workspace.sessionIds.some((id) => String(id) === sessionId))?.workspaceId;
		}
		/** 打开或闭合只跟展开状态走；当前会话所在项目额外使用当前色。 */
		function projectFolderPresentation(isExpanded, containsCurrent) {
			return {
				open: isExpanded,
				current: containsCurrent
			};
		}
		/** 当前会话变化时展开所属项目或「最近」；会话尚未进入树则保持原展开状态。 */
		function expandedForCurrentSession(current, sessionId, tree) {
			if (sessionId === void 0 || sessionId === "") return { ...current };
			const workspaceId = workspaceIdForSession(tree.workspaces, sessionId);
			if (workspaceId !== void 0) return expandedForSessionMove(current, {
				workspaceId: String(workspaceId),
				pinned: tree.pinnedWorkspaceIds.includes(String(workspaceId)),
				groupId: tree.groups.find((group) => group.workspaceIds.includes(String(workspaceId)))?.id,
				hasGroups: tree.groups.length > 0
			});
			if (tree.recentIds.includes(sessionId)) return {
				...current,
				"section:recent": true
			};
			return { ...current };
		}
		/** 仅提供真正改变归属的目标；未分组目标固定排在自定义分组之后。 */
		function workspaceGroupMoveTargets(groups, workspaceId) {
			const currentGroupId = groups.find((group) => group.workspaceIds.includes(workspaceId))?.id;
			const targets = groups.filter((group) => group.id !== currentGroupId).map((group) => ({
				groupId: group.id,
				title: group.title
			}));
			if (currentGroupId !== void 0) targets.push({
				groupId: void 0,
				title: void 0
			});
			return targets;
		}
		const SESSION_DRAG_TYPE = "application/x-dcu-session";
		const WORKSPACE_DRAG_TYPE = "application/x-dcu-workspace";
		const WORKSPACE_GROUP_DRAG_TYPE = "application/x-dcu-workspace-group";
		const SESSION_DRAG_PREFIX = "dcu-session:";
		const WORKSPACE_DRAG_PREFIX = "dcu-workspace:";
		const WORKSPACE_GROUP_DRAG_PREFIX = "dcu-workspace-group:";
		function textPayload(data) {
			try {
				return data?.getData("text/plain") ?? "";
			} catch {
				return "";
			}
		}
		/** 写入会话拖拽载荷；drop 时以这个为准，不依赖尚未刷新的 React 状态。 */
		function writeSessionDrag(data, sessionId, title) {
			data.effectAllowed = "move";
			data.setData("text/plain", `${SESSION_DRAG_PREFIX}${sessionId}`);
			data.setData(SESSION_DRAG_TYPE, sessionId);
		}
		function writeWorkspaceDrag(data, workspaceId, title) {
			data.effectAllowed = "move";
			data.setData("text/plain", `${WORKSPACE_DRAG_PREFIX}${workspaceId}`);
			data.setData(WORKSPACE_DRAG_TYPE, workspaceId);
		}
		function writeWorkspaceGroupDrag(data, groupId, title) {
			data.effectAllowed = "move";
			data.setData("text/plain", `${WORKSPACE_GROUP_DRAG_PREFIX}${groupId}`);
			data.setData(WORKSPACE_GROUP_DRAG_TYPE, groupId);
		}
		function readSessionDrag(data, fallback) {
			try {
				const typed = data?.getData(SESSION_DRAG_TYPE);
				if (typed !== void 0 && typed.trim() !== "") return typed;
			} catch {}
			const text = textPayload(data);
			if (text.startsWith(SESSION_DRAG_PREFIX)) return text.slice(12);
			return fallback !== void 0 && fallback.trim() !== "" ? fallback : void 0;
		}
		function sessionDropAction(sourceWorkspaceId, targetWorkspaceId) {
			return sourceWorkspaceId !== void 0 && sourceWorkspaceId === targetWorkspaceId ? "reorder" : "move";
		}
		function readWorkspaceGroupDrag(data, fallback) {
			if (readSessionDrag(data) !== void 0) return void 0;
			try {
				const typed = data?.getData(WORKSPACE_GROUP_DRAG_TYPE);
				if (typed !== void 0 && typed.trim() !== "") return typed;
			} catch {}
			const text = textPayload(data);
			if (text.startsWith(WORKSPACE_GROUP_DRAG_PREFIX)) return text.slice(20);
			return fallback !== void 0 && fallback.trim() !== "" ? fallback : void 0;
		}
		/** 会话拖拽优先；有会话载荷时不得再把父项目置顶。 */
		function readWorkspaceDrag(data, fallback) {
			if (readSessionDrag(data) !== void 0) return void 0;
			if (readWorkspaceGroupDrag(data) !== void 0) return void 0;
			try {
				const typed = data?.getData(WORKSPACE_DRAG_TYPE);
				if (typed !== void 0 && typed.trim() !== "") return typed;
			} catch {}
			const text = textPayload(data);
			if (text.startsWith(WORKSPACE_DRAG_PREFIX)) return text.slice(14);
			return fallback !== void 0 && fallback.trim() !== "" ? fallback : void 0;
		}
		//#endregion
		//#region src/client/workspace-compat.ts
		function hasStartSession(value) {
			return value !== null && typeof value === "object" && "startSession" in value && typeof value.startSession === "function";
		}
		function hasConnectWorkspace(value) {
			return value !== null && typeof value === "object" && "connectWorkspace" in value && typeof value.connectWorkspace === "function";
		}
		function hasOpenWorkspace(value) {
			return value !== null && typeof value === "object" && "openWorkspace" in value && typeof value.openWorkspace === "function";
		}
		/** 与 DSH 官方最近工作区策略一致；时间相同时保留 Host 工作区顺序。 */
		function recentWorkspaceId(workspaces, sessions) {
			let selected;
			let selectedTime = Number.NEGATIVE_INFINITY;
			for (const workspace of workspaces) {
				let latest = Number.NEGATIVE_INFINITY;
				for (const sessionId of workspace.sessionIds) {
					const session = sessions[sessionId];
					if (session !== void 0) latest = Math.max(latest, session.updatedAt);
				}
				if (latest === Number.NEGATIVE_INFINITY) latest = Date.parse(workspace.createdAt);
				if (selected === void 0 || latest > selectedTime) {
					selected = workspace.workspaceId;
					selectedTime = latest;
				}
			}
			return selected;
		}
		/** 旧版提供聚合字段；alpha.5 起由工作区和会话两个 Store 分别报告基线阶段。 */
		function workspaceBaselinesReady(workspaces, sessions) {
			if ("baselinesReady" in workspaces) return workspaces.baselinesReady === true;
			return "phase" in workspaces && workspaces.phase === "ready" && "phase" in sessions && sessions.phase === "ready";
		}
		//#endregion
		//#region src/client/user-error.ts
		const WORKSPACE_GROUP_ERROR_KEYS = {
			"group-invalid": "errors.groupInvalid",
			"workspace-invalid": "errors.workspaceInvalid",
			"group-missing": "errors.groupMissing",
			"order-anchor-missing": "errors.orderAnchorMissing"
		};
		const HOST_ACTION_DEFAULT_KEYS = {
			rename: "sessions.renameFailed",
			delete: "sessions.deleteFailed",
			archive: "sessions.archiveFailed",
			fork: "sessions.forkFailed"
		};
		const HOST_ACTION_ERROR_KEYS = {
			rename: {
				"session/not-found": "sessions.unknown",
				"session/title-invalid": "sessions.renameInvalid"
			},
			delete: { "session/not-found": "sessions.unknown" },
			archive: { "session/not-found": "sessions.unknown" },
			fork: {
				"session/not-found": "sessions.unknown",
				"session/fork-unavailable": "sessions.forkUnavailable"
			}
		};
		const INSTALL_ERROR_KEYS = [
			[/没有进入当前 Profile|did not enter this profile/i, "about.installUnchanged"],
			[/pnpm 仓库不一致.*停止当前 DSH Web|pnpm store do not match.*stop the current DSH Web/i, "about.installStoreMismatchWeb"],
			[/停止当前 DSH Web|stop the current DSH Web/i, "about.installExitWeb"],
			[/完全退出桌面端|无法覆盖正在运行的插件文件|running plugin files|quit DSH Desktop/i, "about.installExitDesktop"],
			[/DSH Web 终端输出|DSH Web terminal/i, "about.installWebFailed"],
			[/pnpm 仓库不一致|pnpm store do not match/i, "about.installStoreMismatch"],
			[/构建脚本策略|build-script policy/i, "about.installBuildPolicy"],
			[/找不到 pnpm|pnpm (?:is )?not (?:available|found)/i, "about.installPnpmMissing"],
			[/安装超时|installation timed out/i, "about.installTimeout"],
			[/服务尚未就绪|Profile 信息无效|dependency service is not ready/i, "about.installServiceUnavailable"]
		];
		/** 仅显式构造的本地化错误允许原样进入界面。 */
		var UserFacingError = class extends Error {};
		/** 保留 Host 结构化失败及操作语境，界面只消费受控映射。 */
		var HostActionError = class extends Error {
			action;
			reason;
			name = "HostActionError";
			constructor(action, reason) {
				super(`Host ${action} 操作失败`);
				this.action = action;
				this.reason = reason;
			}
		};
		function objectRecord(value) {
			return value !== null && typeof value === "object" ? value : void 0;
		}
		/** DSH 明确要求跨 bundle 按结构标记识别 RemoteFailure，不能使用 instanceof。 */
		function remoteFailureCode(value) {
			const seen = /* @__PURE__ */ new Set();
			let current = value;
			while (true) {
				const record = objectRecord(current);
				if (record === void 0 || seen.has(record)) return void 0;
				seen.add(record);
				if (record.isDSHRemoteError === true && typeof record.code === "string") return record.code;
				current = record.rpcError;
			}
		}
		function diagnosticMessage(value) {
			if (value instanceof Error) return value.message;
			const record = objectRecord(value);
			return typeof record?.message === "string" ? record.message : void 0;
		}
		function hostActionErrorKey(error) {
			const code = remoteFailureCode(error.reason);
			if (code !== void 0) {
				const key = HOST_ACTION_ERROR_KEYS[error.action][code];
				if (key !== void 0) return key;
			}
			if (error.action === "delete" && diagnosticMessage(error.reason)?.includes("UNKNOWN_SESSION") === true) return "sessions.unknown";
			return HOST_ACTION_DEFAULT_KEYS[error.action];
		}
		/** 将业务错误映射为当前语言，未知底层错误统一脱敏。 */
		function userErrorText(error, t) {
			const requestKey = businessRequestErrorKey(error);
			if (requestKey !== void 0) return t(requestKey);
			if (error instanceof UserFacingError) return error.message;
			if (error instanceof WorkspaceGroupError) return t(WORKSPACE_GROUP_ERROR_KEYS[error.code]);
			if (error instanceof HostActionError) return t(hostActionErrorKey(error));
			return t("errors.generic");
		}
		/** 安装错误保留用户可执行的处理建议，但不直接展示 Host 原文。 */
		function installErrorText(error, t) {
			const requestKey = businessRequestErrorKey(error);
			if (requestKey !== void 0) return t(requestKey);
			const message = error instanceof Error ? error.message : String(error);
			return t(INSTALL_ERROR_KEYS.find(([pattern]) => pattern.test(message))?.[1] ?? "about.installFailed");
		}
		//#endregion
		//#region src/client/session-move.ts
		const SESSION_MOVE_ENDPOINT = CODEX_UI_API_ENDPOINTS.sessionMove;
		const MOVE_ACTION_PREFIX = "move-session:";
		const SESSION_MOVE_ERROR_KEYS = {
			"session-move/unavailable": "sessions.moveUnavailable",
			"session-move/service-unavailable": "sessions.moveUnavailable",
			"session-move/unauthorized": "sessions.moveUnauthorized",
			"session-move/forbidden": "sessions.moveForbidden",
			"session-move/session-not-found": "sessions.moveNotFound",
			"session-move/workspace-not-found": "sessions.moveNotFound",
			"session-move/subagent-unsupported": "sessions.moveSubagent",
			"session-move/busy": "sessions.moveBusy",
			"session-move/rollback-failed": "sessions.moveRollbackFailed"
		};
		var SessionMoveRequestError = class extends Error {
			code;
			constructor(code) {
				super(code);
				this.code = code;
				this.name = "SessionMoveRequestError";
			}
		};
		/** 将 Host 公开错误码映射为受控 i18n 键，未知错误统一使用安全兜底。 */
		function sessionMoveErrorKey(code) {
			return SESSION_MOVE_ERROR_KEYS[code] ?? "sessions.moveFailed";
		}
		function moveSessionActionId(workspaceId) {
			return `${MOVE_ACTION_PREFIX}${encodeURIComponent(workspaceId)}`;
		}
		function parseMoveSessionActionId(actionId) {
			if (!actionId.startsWith(MOVE_ACTION_PREFIX)) return void 0;
			try {
				const workspaceId = decodeURIComponent(actionId.slice(13));
				return workspaceId === "" ? void 0 : workspaceId;
			} catch {
				return;
			}
		}
		/** 按 Host 项目顺序生成目标列表，并排除会话当前所属项目。 */
		function sessionMoveTargets(workspaces, sessionId) {
			return workspaces.filter((workspace) => !workspace.sessionIds.includes(sessionId)).map((workspace) => ({
				id: workspace.workspaceId,
				label: workspace.title || workspace.workspaceId
			}));
		}
		async function requestSessionMove(sessionId, targetWorkspaceId, fetcher = fetch) {
			let response;
			try {
				response = await fetcher(SESSION_MOVE_ENDPOINT, {
					method: "POST",
					cache: "no-store",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionId,
						targetWorkspaceId
					}),
					signal: AbortSignal.timeout(3e4)
				});
			} catch {
				throw new SessionMoveRequestError("session-move/unavailable");
			}
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new SessionMoveRequestError("session-move/unavailable");
			}
			const code = payload !== null && typeof payload === "object" && typeof payload.code === "string" ? payload.code : void 0;
			if (!response.ok || payload === null || typeof payload !== "object" || payload.ok !== true) throw new SessionMoveRequestError(code ?? "session-move/failed");
		}
		/** 通过现有深链入口选中移动后的会话，同时用页面重建清除 DSH 保留的只读会话对象。 */
		function finishSessionMove({ sessionId, currentUrl, navigate }) {
			const targetUrl = new URL(currentUrl);
			targetUrl.searchParams.set("session", sessionId);
			navigate(targetUrl.toString());
		}
		//#endregion
		//#region src/client/workspace-archive.ts
		/** 按项目顺序归档会话；失败后停止，交由调用方显示并允许用户重试。 */
		async function archiveWorkspaceSessions(sessionIds, archiveSession) {
			for (const sessionId of new Set(sessionIds)) await archiveSession(sessionId);
		}
		//#endregion
		//#region src/client/workspace-drop-indicator.ts
		const ROWS = ".dcu-wb-section-head,.dcu-wb-collection-head,.dcu-wb-project-head,.dcu-wb-session,.dcu-wb-nochat,.dcu-wb-empty";
		const TARGETS = ".dcu-wb-drop,.dcu-wb-group-order-drop";
		function measureWorkspaceDropIndicator(root, onTargets) {
			const measured = Array.from(root.querySelectorAll(TARGETS)).filter((node) => node.closest("[data-open=false]") === null).map((target) => ({
				target,
				rect: measureTarget(root, target)
			})).filter((item) => item.rect !== void 0);
			const unique = measured.filter((item, index) => !measured.slice(0, index).some((previous) => previous.rect.top === item.rect.top && previous.rect.left === item.rect.left && previous.rect.width === item.rect.width));
			onTargets?.(unique.map((item) => item.target));
			return unique[0]?.rect;
		}
		function measureTarget(root, target) {
			const section = target.closest(".dcu-wb-section") ?? root;
			const rows = Array.from(section.querySelectorAll(ROWS)).filter((node) => node.closest("[data-open=false]") === null).map((node) => ({
				node,
				rect: node.getBoundingClientRect()
			})).filter((row) => row.rect.height > 0 && row.rect.width > 0);
			const owned = rows.filter((row) => row.node === target || target.contains(row.node));
			const after = target.classList.contains("dcu-wb-drop-after");
			let upper;
			let lower;
			let anchor = target.getBoundingClientRect();
			if (owned.length > 0) {
				const edge = after ? owned[owned.length - 1] : owned[0];
				const index = rows.indexOf(edge);
				anchor = edge.rect;
				upper = after ? edge.rect.bottom : rows[index - 1]?.rect.bottom;
				lower = after ? rows[index + 1]?.rect.top : edge.rect.top;
			} else if (target.matches(".dcu-wb-pin-start,.dcu-wb-pin-end")) {
				if (anchor.width <= 0 || anchor.height <= 0) return void 0;
				const itemRows = rows.filter((row) => !row.node.matches(".dcu-wb-section-head,.dcu-wb-empty,.dcu-wb-nochat"));
				if (target.matches(".dcu-wb-pin-end") && itemRows.length > 0) {
					const last = itemRows[itemRows.length - 1];
					anchor = last.rect;
					upper = last.rect.bottom;
					lower = rows.find((row) => row.rect.top >= last.rect.bottom - .5)?.rect.top;
				} else if (target.matches(".dcu-wb-pin-start") && itemRows.length > 0) {
					const first = itemRows[0];
					anchor = first.rect;
					lower = first.rect.top;
					upper = rows.filter((row) => row.rect.bottom <= first.rect.top + .5).at(-1)?.rect.bottom;
				} else {
					upper = rows.filter((row) => row.rect.bottom <= anchor.top).at(-1)?.rect.bottom;
					lower = rows.find((row) => row.rect.top >= anchor.bottom)?.rect.top;
					if (lower === void 0) lower = anchor.bottom;
					if (upper === void 0) upper = anchor.top;
				}
			} else return void 0;
			const center = upper === void 0 ? lower - 4 : lower === void 0 ? upper + 4 : (upper + lower) / 2;
			const box = root.getBoundingClientRect();
			return {
				top: center - box.top - root.clientTop + root.scrollTop - 4,
				left: anchor.left - box.left - root.clientLeft + root.scrollLeft + 4,
				width: Math.max(0, anchor.width - 12)
			};
		}
		/** 仅拖拽期间刷新，滚动、折叠动画和尺寸变化都使用当前帧的布局；结束时完整清理。 */
		function mountWorkspaceDropIndicator(root) {
			const line = root.ownerDocument.createElement("div");
			line.className = "dcu-wb-drop-indicator";
			line.setAttribute("aria-hidden", "true");
			root.append(line);
			root.dataset.dropIndicator = "measured";
			const view = root.ownerDocument.defaultView;
			let frame = 0;
			let previous = "";
			let previousConflict = [];
			const update = () => {
				const rect = measureWorkspaceDropIndicator(root, (targets) => {
					const conflict = targets.length > 1 ? targets : [];
					if (conflict.length > 1 && (conflict.length !== previousConflict.length || conflict.some((target, index) => target !== previousConflict[index]))) console.warn("Codex UI 拖拽存在多个有效落点，请检查跨区状态清理。", { count: conflict.length });
					previousConflict = conflict;
				});
				const next = rect === void 0 ? "" : `${rect.top},${rect.left},${rect.width}`;
				line.hidden = rect === void 0;
				if (rect !== void 0 && next !== previous) {
					line.style.top = `${rect.top}px`;
					line.style.left = `${rect.left}px`;
					line.style.width = `${rect.width}px`;
				}
				previous = next;
				frame = view.requestAnimationFrame(update);
			};
			update();
			return () => {
				view.cancelAnimationFrame(frame);
				line.remove();
				delete root.dataset.dropIndicator;
			};
		}
		//#endregion
		//#region src/client/CodexWorkspaceBrowser.tsx
		const DISCLOSURE_EXIT_MS = 180;
		function NewSessionIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SquarePen, {
				"aria-hidden": "true",
				size: 16,
				strokeWidth: 1.5
			});
		}
		function CreateGroupIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconProjectAddOutlineMedium, { size: 16 });
		}
		function AddWorkspaceIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Plus, {
				"aria-hidden": "true",
				size: 16,
				strokeWidth: 1.5
			});
		}
		/** 使用独立节点生成稳定的拖拽预览，避免浏览器把目标高亮和操作按钮截入默认快照。 */
		function setDragPreview(dataTransfer, title, icon) {
			const preview = document.createElement("div");
			preview.className = "dcu-wb-drag-ghost";
			if (icon !== void 0 && icon !== null) {
				const previewIcon = icon.cloneNode(true);
				previewIcon.className = "dcu-wb-drag-ghost-icon";
				previewIcon.setAttribute("aria-hidden", "true");
				preview.appendChild(previewIcon);
			}
			const previewTitle = document.createElement("span");
			previewTitle.className = "dcu-wb-drag-ghost-title";
			previewTitle.textContent = sessionTitleLine(title);
			preview.appendChild(previewTitle);
			document.body.appendChild(preview);
			preview.offsetWidth;
			dataTransfer.setDragImage(preview, 16, 15);
			window.requestAnimationFrame(() => {
				preview.remove();
			});
		}
		function animateDisclosure(body, wasOpen, open) {
			if (wasOpen === open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return void 0;
			const height = `${body.scrollHeight}px`;
			const from = wasOpen ? {
				height,
				opacity: 1,
				transform: "translateY(0)"
			} : {
				height: "0px",
				opacity: 0,
				transform: "translateY(-2px)"
			};
			const to = open ? {
				height,
				opacity: 1,
				transform: "translateY(0)"
			} : {
				height: "0px",
				opacity: 0,
				transform: "translateY(-2px)"
			};
			return body.animate([from, to], {
				duration: DISCLOSURE_EXIT_MS,
				easing: "cubic-bezier(.16, 1, .3, 1)",
				fill: "none"
			});
		}
		/** 所有可折叠层级使用同一套原生高度动画，兼容宿主内核对 auto 高度过渡的差异。 */
		function DisclosureBody({ className, children, open }) {
			const bodyRef = (0, react.useRef)(null);
			const previousOpen = (0, react.useRef)(open);
			(0, react.useLayoutEffect)(() => {
				const body = bodyRef.current;
				if (body === null) return;
				body.inert = !open;
				const animation = animateDisclosure(body, previousOpen.current, open);
				previousOpen.current = open;
				return () => {
					animation?.cancel();
				};
			}, [open]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: bodyRef,
				className,
				"data-open": open,
				"aria-hidden": !open,
				children
			});
		}
		/** 顶层分区使用已有结构，通过统一监听器复用与项目、分组一致的原生动画。 */
		function useSectionDisclosureMotion(rootRef) {
			const previousOpen = (0, react.useRef)(/* @__PURE__ */ new WeakMap());
			(0, react.useLayoutEffect)(() => {
				const bodies = rootRef.current?.querySelectorAll(".dcu-wb-section-body") ?? [];
				for (const body of bodies) {
					const open = body.dataset.open === "true";
					const previous = previousOpen.current.get(body);
					previousOpen.current.set(body, open);
					body.inert = !open;
					if (previous !== void 0) animateDisclosure(body, previous, open);
				}
			});
		}
		function sameWorkspaceDropTarget(left, right) {
			if (left === void 0 || right === void 0) return left === right;
			if (left.zone !== right.zone) return false;
			if (left.zone === "group" && right.zone === "group") return left.groupId === right.groupId && left.beforeId === right.beforeId && left.ontoGroup === right.ontoGroup && left.crossGroup === right.crossGroup;
			if (left.zone === "ungrouped" && right.zone === "ungrouped") return left.beforeId === right.beforeId && left.ontoSection === right.ontoSection && left.crossGroup === right.crossGroup;
			return "beforeId" in left && "beforeId" in right && left.beforeId === right.beforeId;
		}
		function sameWorkspaceGroups(left, right) {
			return left.length === right.length && left.every((group, index) => group.id === right[index]?.id && group.title === right[index]?.title && sameIds(group.workspaceIds, right[index]?.workspaceIds ?? []));
		}
		function newWorkspaceGroupId() {
			if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `group-${crypto.randomUUID()}`;
			return `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
		}
		function workspaceGroupMoveActionId(groupId) {
			return `moveWorkspaceToGroup:${groupId ?? ""}`;
		}
		const stylesheet$4 = `
.dcu-wb{--dcu-wb-inset:8px;display:flex;flex:1;min-height:0;flex-direction:column;padding:4px var(--dcu-wb-inset) 8px;color:var(--dcu-sidebar-primary)}
.dcu-wb *{box-sizing:border-box}
.dcu-wb-tree{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;padding-bottom:16px;scrollbar-gutter:auto;scrollbar-width:none;user-select:none;-webkit-user-select:none}
.dcu-wb-tree::-webkit-scrollbar{display:none}
.dcu-wb-section+.dcu-wb-section{margin-top:16px}
.dcu-wb-section-head{position:relative;display:flex;align-items:center;min-height:24px;padding:0;border-radius:6px}.dcu-wb-section-head:hover .dcu-wb-actions{display:flex}.dcu-wb-section-label{position:relative;display:flex;align-items:center;gap:4px;flex:1;min-width:0;min-height:24px;border:0;padding:2px 4px 2px 12px;background:transparent;color:var(--dcu-sidebar-tertiary);font:14px/20px var(--dsw-font-family);font-weight:400;letter-spacing:0;text-align:left;cursor:pointer}.dcu-wb-section-caret{display:grid;place-items:center;flex:none;width:12px;height:12px;color:currentColor;opacity:0;transform:rotate(0deg);transform-origin:50% 50%;transition:opacity 120ms ease,transform 160ms ease}.dcu-wb-section-head .dcu-wb-section-caret{position:absolute;left:0;top:6px}.dcu-wb-section-caret svg{display:block}.dcu-wb-section-head:hover .dcu-wb-section-caret,.dcu-wb-section-label:focus-visible .dcu-wb-section-caret{opacity:.78}.dcu-wb-section-label[aria-expanded=true] .dcu-wb-section-caret{transform:rotate(90deg)}.dcu-wb-section-body{display:block}.dcu-wb-section-body[data-open=false]{display:none}.dcu-wb-section-body>div{min-height:0}.dcu-wb-section-body[data-open=true]>div{animation:dcu-wb-section-in 140ms cubic-bezier(.16,1,.3,1)}@keyframes dcu-wb-section-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.dcu-wb-section-caret{transition:none}.dcu-wb-section-body[data-open=true]>div{animation:none}}
.dcu-wb-project{position:relative;min-width:0}
.dcu-wb-collection-head .dcu-wb-more{opacity:0;pointer-events:none}
.dcu-wb-collection-head:hover .dcu-wb-more,.dcu-wb-collection-head:focus-within .dcu-wb-more,.dcu-wb-collection-head .dcu-wb-more[aria-expanded=true]{opacity:1;pointer-events:auto}
@media (pointer:coarse){.dcu-wb-collection-head .dcu-wb-more{opacity:1;pointer-events:auto}}
.dcu-wb-collection-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dcu-wb-collection-actions{flex-shrink:0;width:20px}
.dcu-wb-collections{display:grid;min-width:0;gap:4px}.dcu-wb-collection,.dcu-wb-ungrouped{position:relative;min-width:0;overflow:visible}.dcu-wb-collection-head{display:flex;align-items:center;min-height:28px;padding:0 4px;border-radius:6px;transition:background 120ms ease}.dcu-wb-collection-head:hover,.dcu-wb-collection-head:focus-within,.dcu-wb-collection-head.dcu-wb-group-drop{background:var(--dcu-sidebar-hover)}.dcu-wb-collection-head.dcu-wb-group-drop{outline:1px solid var(--dsw-alias-state-business-primary)}.dcu-wb-collection-head[draggable=true],.dcu-wb-collection-head[draggable=true] .dcu-wb-collection-label{cursor:grab}.dcu-wb-collection-head[draggable=true]:active,.dcu-wb-collection-head[draggable=true]:active .dcu-wb-collection-label{cursor:grabbing}.dcu-wb-collection-label{display:flex;align-items:center;gap:5px;min-width:0;flex:1;border:0;padding:4px;background:transparent;color:var(--dcu-sidebar-primary);font:13px/20px var(--dsw-font-family);text-align:left;cursor:pointer}.dcu-wb-collection-label .dcu-wb-section-caret{position:static;order:-1;opacity:.78}.dcu-wb-collection-label[aria-expanded=true] .dcu-wb-section-caret{transform:rotate(90deg)}.dcu-wb-collection-count{margin-left:auto;color:var(--dcu-sidebar-secondary);font-variant-numeric:tabular-nums}.dcu-wb-collection-body{position:relative;min-width:0;padding-left:12px}.dcu-wb-collection-body::before{content:"";position:absolute;left:31px;top:0;bottom:8px;width:1px;background:var(--dcu-sidebar-border)}.dcu-wb-group-member{position:relative}.dcu-wb-group-member.dcu-wb-drop::before,.dcu-wb-collection.dcu-wb-group-order-drop::before,.dcu-wb-ungrouped.dcu-wb-group-order-drop::before{content:"";position:absolute;z-index:2;left:7px;right:8px;top:-8px;height:8px;pointer-events:none;background:radial-gradient(circle at 4px 50%,transparent 1.75px,var(--dsw-alias-state-business-primary) 2px 3.75px,transparent 4px),linear-gradient(var(--dsw-alias-state-business-primary),var(--dsw-alias-state-business-primary)) 10px 50%/calc(100% - 10px) 2px no-repeat}.dcu-wb-group-member.dcu-wb-drop-after::before{top:auto;bottom:-8px}.dcu-wb-collection-body .dcu-wb-project-head{padding-left:12px}
.dcu-wb-collection.dcu-wb-workspace-move-drop,.dcu-wb-ungrouped.dcu-wb-workspace-move-drop{border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 9%,transparent);outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dcu-wb-project-head,.dcu-wb-session{position:relative;display:flex;align-items:center;gap:6px;width:100%;min-width:0;border-radius:8px;padding:0 8px;color:var(--dcu-sidebar-primary);cursor:pointer}
.dcu-wb-collection-body::before{left:calc(4px + 4px + 6px)}
.dcu-wb-project-head{height:36px;background:transparent;font:inherit;text-align:left}
.dcu-wb-project-head:hover,.dcu-wb-project-head.dcu-wb-menu-open,.dcu-wb-session:hover,.dcu-wb-session.dcu-wb-selected,.dcu-wb-session.dcu-wb-menu-open{background:var(--dcu-sidebar-hover)}.dcu-wb-project.dcu-wb-session-drop>.dcu-wb-project-head{border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 9%,transparent);outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.dcu-wb-project.dcu-wb-session-move-drop{border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 9%,transparent);outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.dcu-wb-project.dcu-wb-session-move-drop>.dcu-wb-project-head{background:transparent;outline:0}.dcu-wb-project-body>.dcu-wb-session:first-child,.dcu-wb-project-body>.dcu-wb-nochat:first-child{margin-top:4px}.dcu-wb-session+.dcu-wb-session{margin-top:2px}
.dcu-wb-project-head[draggable=true],.dcu-wb-session[draggable=true]{cursor:grab}
.dcu-wb-project-head[draggable=true]:active,.dcu-wb-session[draggable=true]:active{cursor:grabbing}
.dcu-wb-section,.dcu-wb-section:focus,.dcu-wb-section:focus-visible,.dcu-wb-project-head:focus,.dcu-wb-session:focus{outline:0}.dcu-wb-pinned-list{position:relative}.dcu-wb-pin-end,.dcu-wb-pin-start{position:absolute;left:0;right:0;height:8px;z-index:2;pointer-events:none}.dcu-wb-pin-end.dcu-wb-drop,.dcu-wb-pin-start.dcu-wb-drop{pointer-events:auto}.dcu-wb-pin-start{top:0}.dcu-wb-pin-end{bottom:-8px}.dcu-wb-project.dcu-wb-drop::before,.dcu-wb-session.dcu-wb-drop::before,.dcu-wb-pin-end.dcu-wb-drop::before,.dcu-wb-pin-start.dcu-wb-drop::before{content:"";position:absolute;z-index:2;left:7px;right:8px;top:-8px;height:8px;pointer-events:none;background:radial-gradient(circle at 4px 50%,transparent 1.75px,var(--dsw-alias-state-business-primary) 2px 3.75px,transparent 4px),linear-gradient(var(--dsw-alias-state-business-primary),var(--dsw-alias-state-business-primary)) 10px 50%/calc(100% - 10px) 2px no-repeat}.dcu-wb-pin-start.dcu-wb-drop::before{top:0}.dcu-wb-pinned-list>.dcu-wb-project:first-child.dcu-wb-drop::before{top:-4px}.dcu-wb-project.dcu-wb-drop-after::before,.dcu-wb-session.dcu-wb-drop-after::before{top:auto;bottom:-8px}.dcu-wb-dragging{opacity:.28}.dcu-wb-drag-ghost{position:fixed;top:8px;left:-9999px;z-index:10040;display:flex;align-items:center;gap:8px;max-width:220px;height:30px;padding:0 10px;border:1px solid var(--dcu-sidebar-border);border-radius:8px;background:var(--dcu-sidebar-hover);box-shadow:0 4px 12px rgba(0,0,0,.24);color:var(--dcu-sidebar-primary);font:13px/20px var(--dsw-font-family);white-space:nowrap;pointer-events:none}.dcu-wb-drag-ghost-icon{display:grid;place-items:center;flex:none;width:16px;height:16px;color:var(--dcu-sidebar-icon)}.dcu-wb-drag-ghost-icon svg{display:block;width:16px;height:16px}.dcu-wb-drag-ghost-title{min-width:0;overflow:hidden;text-overflow:ellipsis}
.dcu-wb-folder{display:grid;place-items:center;flex:none;width:16px;height:20px;color:var(--dcu-sidebar-icon)}.dcu-wb-folder.dcu-wb-folder-current{color:var(--dcu-sidebar-icon)}.dcu-wb-brand{display:block;width:16px;height:16px}
.dcu-wb-project-title,.dcu-wb-session-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}
.dcu-wb-project-title{flex:1;font-weight:400;color:var(--dcu-sidebar-primary)}
.dcu-wb-session{position:relative;min-width:0;min-height:36px;gap:0;overflow:hidden;padding-left:30px;padding-right:28px}.dcu-wb-session:has(.dcu-wb-session-sub){min-height:44px}
.dcu-wb-session-title{flex:1;margin-left:0}.dcu-wb-session-title-text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media (prefers-reduced-motion:no-preference){.dcu-wb-session:hover .dcu-wb-session-title[data-overflow] .dcu-wb-session-title-text,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-session-title[data-overflow] .dcu-wb-session-title-text{display:inline-block;width:max-content;max-width:none;overflow:visible;text-overflow:clip;animation:dcu-wb-title-scroll var(--dcu-title-duration,2.4s) linear 320ms infinite alternate}}@keyframes dcu-wb-title-scroll{0%,18%{transform:translateX(0)}82%,100%{transform:translateX(calc(-1 * var(--dcu-title-shift,0px)))}}.dcu-wb-session-time{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--dcu-sidebar-tertiary);font-size:11px;line-height:16px;font-weight:400;font-variant-numeric:tabular-nums;white-space:nowrap;pointer-events:none}.dcu-wb-session:has(.dcu-wb-session-time){padding-right:64px}.dcu-wb-session:has(.dcu-wb-unread) .dcu-wb-session-time{right:22px}.dcu-wb-session:has(.dcu-wb-unread):has(.dcu-wb-session-time){padding-right:78px}.dcu-wb-session-copy{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}.dcu-wb-session-sub{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dcu-sidebar-tertiary);font-size:12px;line-height:16px}.dcu-wb-session-flat,.dcu-wb-session-top{padding-left:8px}.dcu-wb-session-flat:has(.dcu-wb-running),.dcu-wb-session-top:has(.dcu-wb-running){padding-left:30px}
.dcu-wb-actions{display:none;align-items:center;gap:8px;flex:none}
.dcu-wb-quick-actions{position:absolute;right:8px;top:50%;display:flex;align-items:center;gap:2px;opacity:0;pointer-events:none;transform:translateY(-50%);background:var(--dcu-sidebar-hover);border-radius:6px}
.dcu-wb-project-head:hover .dcu-wb-actions,.dcu-wb-project-head.dcu-wb-menu-open .dcu-wb-actions,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-actions{display:flex}
.dcu-wb-session:hover .dcu-wb-quick-actions,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-quick-actions{opacity:1;pointer-events:auto}.dcu-wb-session:hover .dcu-wb-pending,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-pending,.dcu-wb-session:hover .dcu-wb-unread,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-unread,.dcu-wb-session:hover .dcu-wb-session-time,.dcu-wb-session.dcu-wb-menu-open .dcu-wb-session-time{visibility:hidden}.dcu-wb-session:has(.dcu-wb-pending) .dcu-wb-session-time{display:none}
.dcu-wb-more{display:grid;place-items:center;width:20px;height:20px;border:0;border-radius:4px;padding:0;background:transparent;color:var(--dcu-sidebar-tertiary);cursor:pointer}
.dcu-wb-more:hover{color:var(--dcu-sidebar-primary)}
.dcu-wb-context-anchor{opacity:0;pointer-events:none}
.dcu-wb-tip{position:fixed;z-index:10050;min-width:220px;max-width:280px;padding:10px 12px;border:1px solid var(--dcu-sidebar-border);border-radius:12px;background:var(--dcu-tip-bg,#fff);box-shadow:var(--dcu-tip-shadow,0 8px 28px rgba(31,39,36,.16));color:var(--dcu-sidebar-primary);animation:dcu-tip-in 180ms cubic-bezier(.16,1,.3,1)}.dcu-wb-tip-workspace{width:316px;min-width:0;max-width:calc(100vw - 16px);padding:10px 8px 8px}@keyframes dcu-tip-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.dcu-wb-tip{animation:none}}.dcu-wb-tip-title{display:flex;align-items:center;gap:6px;min-width:0;min-height:20px;font-size:14px;line-height:20px;font-weight:500}.dcu-wb-tip-title-main{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-wb-tip-time{flex:none;margin-left:auto;color:var(--dcu-sidebar-tertiary);font-size:12px;line-height:18px;font-weight:400}.dcu-wb-tip-pin{display:grid;place-items:center;flex:none;width:20px;height:20px;border:0;border-radius:4px;padding:0;background:transparent;color:var(--dcu-sidebar-tertiary);cursor:pointer}.dcu-wb-tip-pin:hover{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}.dcu-wb-tip-meta,.dcu-wb-tip-row{display:flex;align-items:center;gap:6px;min-width:0;margin-top:4px;color:var(--dcu-sidebar-secondary);font-size:13px;line-height:20px}.dcu-wb-tip-meta svg,.dcu-wb-tip-row svg{flex:none}.dcu-wb-tip-row>span:not(.dcu-wb-folder){min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-wb-tip-path{align-items:flex-start;margin-top:8px}.dcu-wb-tip-path-copy{min-width:0;overflow-wrap:anywhere;white-space:normal}.dcu-wb-tip-sep{height:1px;margin:8px 0 4px;background:var(--dcu-sidebar-border)}.dcu-wb-tip-edit{display:flex;align-items:center;gap:6px;width:100%;min-height:24px;border:0;padding:2px 0;background:transparent;color:var(--dcu-sidebar-primary);font:14px/20px var(--dsw-font-family);text-align:left;cursor:pointer}.dcu-wb-tip-edit svg{flex:none;color:var(--dcu-sidebar-secondary)}
.dcu-wb-session:has(.dcu-wb-pending){padding-right:112px}.dcu-wb-unread{position:absolute;right:13px;top:50%;width:7px;height:7px;margin:-3.5px 0 0;border-radius:50%;background:var(--dsw-alias-state-business-primary)}
.dcu-wb-pending{position:absolute;right:10px;top:50%;display:flex;align-items:center;gap:4px;max-width:88px;margin:0;transform:translateY(-50%);color:var(--dsw-alias-state-warn-label,#b45309);font-size:11px;line-height:16px;white-space:nowrap}.dcu-wb-pending-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-warn-primary,#f59e0b)}.dcu-wb-pending-label{min-width:0;overflow:hidden;text-overflow:ellipsis}
.dcu-wb-empty{padding:14px 8px;color:var(--dcu-sidebar-tertiary);font-size:14px}
.dcu-wb-error{margin:4px 0;padding:6px 8px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px}
.dcu-wb-rail{display:none}
.dcu-wb-rename-actions{display:flex;justify-content:flex-end;gap:8px}
.dcu-wb-delete-button{color:var(--dsw-alias-state-error-primary)!important}
.dcu-wb-delete-copy{margin:0;color:var(--dcu-sidebar-secondary);font-size:13px;line-height:20px}
.dcu-wb-move-target{display:flex;min-width:0;align-items:center;gap:8px;margin-top:4px;color:var(--dcu-sidebar-primary);font:14px/20px var(--dsw-font-family)}.dcu-wb-move-target svg{flex:none;color:var(--dcu-sidebar-secondary)}.dcu-wb-move-target-copy{min-width:0}.dcu-wb-move-project,.dcu-wb-move-path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-wb-move-path{color:var(--dcu-sidebar-tertiary);font-size:12px}
.dcu-wb-rename-input{box-sizing:border-box;width:100%;height:36px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:7px 10px;outline:0;background:var(--dsw-alias-background-secondary);color:var(--dsw-alias-label-primary);font:14px/20px var(--dsw-font-family);caret-color:var(--dsw-alias-state-business-primary);transition:border-color 120ms ease,box-shadow 120ms ease}
.dcu-wb-rename-input:hover{border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 32%,var(--dsw-alias-border-l2))}
.dcu-wb-rename-input:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary) 28%,transparent)}
`;
		const runningStyles = `.dcu-wb-running{position:absolute;left:8px;top:50%;display:grid;place-items:center;flex:none;width:16px;height:20px;margin-top:-10px;border:0;background:transparent}.dcu-wb-running::after{content:"";box-sizing:border-box;width:12px;height:12px;border:2px solid color-mix(in srgb,var(--dcu-sidebar-secondary) 25%,transparent);border-top-color:var(--dcu-sidebar-secondary);border-radius:50%;animation:dcu-wb-spin .8s linear infinite}@keyframes dcu-wb-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.dcu-wb-running::after{animation:none}}`;
		const typographyStyles = `.dcu-wb{--dcu-wb-disclosure-duration:180ms;--dcu-wb-disclosure-ease:cubic-bezier(.16,1,.3,1);font:13px/20px var(--dsw-font-family)}.dcu-wb-section-label{color:var(--dcu-sidebar-tertiary);font:14px/20px var(--dsw-font-family);font-weight:400;letter-spacing:0;padding-left:12px}/* 字号与「无聊天」等条目一致（原 12px）。 */.dcu-wb-section-caret{transition:opacity var(--dcu-wb-disclosure-duration) var(--dcu-wb-disclosure-ease),transform var(--dcu-wb-disclosure-duration) var(--dcu-wb-disclosure-ease)}.dcu-wb-section-head .dcu-wb-section-caret{display:none}.dcu-wb-section-body,.dcu-wb-project-body,.dcu-wb-collection-body{display:block;min-height:0;height:auto;overflow:clip;opacity:1;transform:none;visibility:visible}.dcu-wb-section-body[data-open=false],.dcu-wb-project-body[data-open=false],.dcu-wb-collection-body[data-open=false]{display:block;height:0;opacity:0;transform:translateY(-2px);pointer-events:none}.dcu-wb-section-body[data-open=true]:has(.dcu-wb-drop),.dcu-wb-project-body[data-open=true]:has(.dcu-wb-drop),.dcu-wb-collection-body[data-open=true]:has(.dcu-wb-drop){overflow:visible}.dcu-wb-section-body[data-open=true]>div{animation:none}@media (prefers-reduced-motion:reduce){.dcu-wb-section-caret{transition:none}}.dcu-wb-project-title{font-size:13px;line-height:18px;font-weight:400;color:var(--dcu-sidebar-primary)}.dcu-wb-session-title{font-size:14px;line-height:20px;font-weight:400;color:var(--dcu-sidebar-primary)}.dcu-wb-session.dcu-wb-selected .dcu-wb-session-title,.dcu-wb-session:hover .dcu-wb-session-title{color:var(--dcu-sidebar-primary)}.dcu-wb-empty{color:var(--dcu-sidebar-tertiary);font-size:14px;line-height:20px}.dcu-wb-pinned-list>.dcu-wb-empty{display:none}.dcu-wb-section[data-pin-drag] .dcu-wb-pinned-list>.dcu-wb-empty{display:block}`;
		const collectionLayoutStyles = `
.dcu-wb-tree{position:relative}
.dcu-wb-tree[data-drop-indicator=measured] .dcu-wb-drop::before,.dcu-wb-tree[data-drop-indicator=measured] .dcu-wb-group-order-drop::before{display:none}
.dcu-wb-drop-indicator{position:absolute;z-index:3;height:8px;pointer-events:none;color:var(--dsw-alias-state-business-primary)}
.dcu-wb-drop-indicator::before{content:"";position:absolute;left:6px;right:0;top:3px;height:2px;border-radius:999px;background:currentColor}
.dcu-wb-drop-indicator::after{content:"";position:absolute;box-sizing:border-box;left:0;top:0;width:8px;height:8px;border:2px solid currentColor;border-radius:50%}
.dcu-wb-project-body:has(>.dcu-wb-session)::after{content:"";display:block;height:4px;pointer-events:none}
.dcu-wb-section-body[data-open=true]:has(.dcu-wb-group-order-drop),.dcu-wb-section-body[data-open=true]:has(.dcu-wb-pin-end),.dcu-wb-section-body[data-open=true]:has(.dcu-wb-pin-start){overflow:visible}
.dcu-wb-collection-body{padding-left:0}
.dcu-wb-collection-body>.dcu-wb-group-member:first-child{padding-top:4px}
.dcu-wb-collection-body .dcu-wb-project-head{padding-left:8px}
.dcu-wb-collection-body>.dcu-wb-empty{padding:8px 8px 8px 26px}
.dcu-wb-collection-body>.dcu-wb-empty,.dcu-wb-nochat{font-size:13px;line-height:18px;color:var(--dcu-sidebar-tertiary)}
.dcu-wb-nochat{padding:1px 8px 5px 30px}
.dcu-wb-session-more{display:flex;gap:4px;padding:2px 8px 2px 30px}
.dcu-wb-session-more button{height:28px;border:0;border-radius:8px;padding:0 8px;background:transparent;color:var(--dcu-sidebar-tertiary);font:13px/20px var(--dsw-font-family);cursor:pointer}
.dcu-wb-session-more button:hover{color:var(--dcu-sidebar-secondary)}
.dcu-wb-collection:has(+.dcu-wb-collection)>.dcu-wb-collection-body>.dcu-wb-empty,.dcu-wb-collection:has(+.dcu-wb-ungrouped)>.dcu-wb-collection-body>.dcu-wb-empty{padding-top:18px;padding-bottom:2px}
.dcu-wb-collection-body::before,.dcu-wb-group-member::after{display:none}
.dcu-wb-collections{gap:16px}
.dcu-wb-collections:has(>.dcu-wb-project){gap:0}
.dcu-wb-collection-head{min-height:32px}
.dcu-wb-collection-head:hover{background:var(--dcu-sidebar-hover)}
.dcu-wb-collection-head.dcu-wb-group-drop{background:var(--dcu-sidebar-hover)}
.dcu-wb-collection-head{background:color-mix(in srgb,var(--dcu-sidebar-hover) 55%,transparent)}
.dcu-wb-collection-label{gap:4px;min-height:32px;font-size:13px;font-weight:600}
.dcu-wb-collection-label .dcu-wb-section-caret{width:14px;height:14px;opacity:1;color:var(--dcu-sidebar-primary)}
.dcu-wb-collection-label .dcu-wb-section-caret svg{width:14px;height:14px}
.dcu-wb-collection-label .dcu-wb-section-caret svg path{stroke-width:2}
.dcu-wb-collection-count{flex:none;font-size:12px;font-weight:400;padding-left:8px}
.dcu-wb-ungrouped .dcu-wb-collection-label{color:var(--dcu-sidebar-secondary)}
.dcu-wb-collection-head:focus-within,.dcu-wb-collection-head:has(.dcu-wb-more[aria-expanded=true]){background:var(--dcu-sidebar-hover)}
.dcu-wb-workspace-move-drop>.dcu-wb-collection-head{background:transparent}
.dcu-wb-collection-label:focus-visible,.dcu-wb-project-head:focus-visible,.dcu-wb-session:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px;border-radius:6px}
@media (pointer:coarse){.dcu-wb-collection-head,.dcu-wb-collection-label{min-height:36px}.dcu-wb-collection-actions{width:28px}.dcu-wb-collection-actions .dcu-wb-more{width:28px;height:28px}}
`;
		const WORKSPACE_TREE_STYLE = stylesheet$4 + runningStyles + typographyStyles + collectionLayoutStyles;
		function storage$1() {
			return browserStorage();
		}
		function sameIds(left, right) {
			return left.length === right.length && left.every((id, index) => id === right[index]);
		}
		function optionalText(value, key) {
			if (!(key in value)) return void 0;
			const next = value[key];
			return typeof next === "string" && next !== "" ? next : void 0;
		}
		/** 插件自有的工作区树：复刻原生层级和拖拽行为，并在每个会话菜单中增加管理操作。 */
		const noSubscription = () => () => {};
		const noBindings = () => void 0;
		const emptyShortcutRows = [];
		const noShortcuts$1 = () => emptyShortcutRows;
		function CodexWorkspaceBrowser(props) {
			const snapshot = (0, react.useSyncExternalStore)(props.workspaceShortcuts?.subscribe ?? noSubscription, props.workspaceShortcuts?.getSnapshot ?? noBindings);
			const catalog = snapshot?.bindings?.hooks.shortcuts;
			const shortcuts = (0, react.useSyncExternalStore)(catalog?.subscribe ?? noSubscription, catalog?.getSnapshot ?? noShortcuts$1);
			const requestAddWorkspace = props.workspaceShortcuts ? snapshot?.bindings?.requestAddWorkspace : props.requestAddWorkspace;
			const addWorkspaceShortcutAria = shortcuts.find((row) => row.id === "workspace.add")?.aria ?? props.addWorkspaceShortcutAria;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverShell, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodexWorkspaceTree, {
				...props,
				requestAddWorkspace,
				addWorkspaceShortcutAria
			}) });
		}
		function CodexWorkspaceTree({ wide, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces, t, archiveSession, deleteSession, deleteWorkspace, forkSession, insertSessionBefore, insertWorkspaceBefore, moveSession, openPath, openSession, renameSession, renameWorkspace, startSession, canDeleteSession, panelActive = false, requestAddWorkspace, addWorkspaceShortcutAria }) {
			const sessions = useSessions((state) => state);
			const now = useSharedNow();
			const pendingInteractions = useHostPendingInteractions(useSessionPendingInteraction, useSessionStatus);
			const sessionStatus = useHostSessionStatus(useSessionStatus);
			const selectedId = visibleSelectedSessionId(sessions, panelActive);
			const workspaces = useWorkspaces((state) => state);
			const baselinesReady = workspaceBaselinesReady(workspaces, sessions);
			const [expanded, setExpanded] = (0, react.useState)(() => readTreeExpansionState(storage$1(), WORKSPACE_EXPANSION_STORAGE_KEY));
			const [sessionWindows, setSessionWindows] = (0, react.useState)({});
			const revealMoreSessions = (workspaceId) => {
				setSessionWindows((current) => ({
					...current,
					[workspaceId]: nextProjectSessionWindow(current[workspaceId])
				}));
			};
			const [pinnedWorkspaceIds, setPinnedWorkspaceIdsState] = (0, react.useState)(() => readPinnedWorkspaceIds(storage$1()));
			const initialWorkspaceGroups = (0, react.useMemo)(() => readWorkspaceGroupsCache(storage$1()), []);
			const [workspaceGroups, setWorkspaceGroupsState] = (0, react.useState)(() => initialWorkspaceGroups.workspaceGroups);
			const pinnedWorkspaceIdsRef = (0, react.useRef)(pinnedWorkspaceIds);
			pinnedWorkspaceIdsRef.current = pinnedWorkspaceIds;
			const workspaceGroupsRef = (0, react.useRef)(workspaceGroups);
			workspaceGroupsRef.current = workspaceGroups;
			const workspaceGroupsPendingHostSyncRef = (0, react.useRef)(initialWorkspaceGroups.pendingHostSync);
			const pinnedHostSupportsWorkspaceGroupsRef = (0, react.useRef)(false);
			const pinnedHostHydratedRef = (0, react.useRef)(false);
			const pinnedHostDirtyRef = (0, react.useRef)(false);
			const pinnedHostSkipWriteRef = (0, react.useRef)();
			const pinnedHostWriteRef = (0, react.useRef)(Promise.resolve());
			const [preferencesFailure, setPreferencesFailure] = (0, react.useState)();
			const workspaceBaselineRef = (0, react.useRef)({
				ready: false,
				validIds: []
			});
			workspaceBaselineRef.current = {
				ready: baselinesReady,
				validIds: workspaces.items.map((workspace) => String(workspace.workspaceId))
			};
			const queuePinnedHostWrite = (ids, groups) => {
				const snapshot = {
					pinnedWorkspaceIds: [...ids],
					workspaceGroups: groups.map((group) => ({
						...group,
						workspaceIds: [...group.workspaceIds]
					}))
				};
				const pending = pinnedHostWriteRef.current.then(async () => {
					await writeHostWorkspacePreferences(snapshot.pinnedWorkspaceIds, snapshot.workspaceGroups);
					setPreferencesFailure(void 0);
					if (!pinnedHostSupportsWorkspaceGroupsRef.current) return;
					if (!sameIds(pinnedWorkspaceIdsRef.current, snapshot.pinnedWorkspaceIds) || !sameWorkspaceGroups(workspaceGroupsRef.current, snapshot.workspaceGroups)) return;
					workspaceGroupsPendingHostSyncRef.current = false;
					saveWorkspaceGroupsCache(storage$1(), snapshot.workspaceGroups, false);
				});
				pinnedHostWriteRef.current = pending.catch((reason) => {
					setPreferencesFailure(reason);
				});
			};
			const setPinnedWorkspaceIds = (update) => {
				pinnedHostDirtyRef.current = true;
				const current = pinnedWorkspaceIdsRef.current;
				const next = typeof update === "function" ? update(current) : update;
				pinnedWorkspaceIdsRef.current = next;
				setPinnedWorkspaceIdsState(next);
			};
			const setWorkspaceGroups = (update) => {
				const current = workspaceGroupsRef.current;
				const next = typeof update === "function" ? update(current) : update;
				pinnedHostDirtyRef.current = true;
				workspaceGroupsPendingHostSyncRef.current = true;
				workspaceGroupsRef.current = next;
				setWorkspaceGroupsState(next);
			};
			const [unreadSessionIds, setUnreadSessionIds] = (0, react.useState)(() => readSessionIds(storage$1(), SESSION_UNREAD_STORAGE_KEY));
			const rowUnread = (id) => sessionRowUnread(unreadSessionIds.includes(id), sessionStatus.get(id), selectedId === id);
			const rowRunning = (id, session) => sessionIsRunning(session ?? sessions.byId[id], sessionStatus.get(id));
			const previousSessionRunningRef = (0, react.useRef)();
			const [menu, setMenu] = (0, react.useState)();
			const [renameTarget, setRenameTarget] = (0, react.useState)();
			const [deleteTarget, setDeleteTarget] = (0, react.useState)();
			const [archiveWorkspaceTarget, setArchiveWorkspaceTarget] = (0, react.useState)();
			const [sessionMoveTarget, setSessionMoveTarget] = (0, react.useState)();
			const { showTip: publishTip, hideTip, dismissTip, isShowing } = useHoverDispatch();
			const showTip = (tip, options) => {
				if (menu !== void 0) return;
				publishTip(tip, options);
			};
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)();
			const busyRef = (0, react.useRef)();
			const [error, setError] = (0, react.useState)();
			const [workspaceDragId, setWorkspaceDragId] = (0, react.useState)();
			const [workspaceDropTarget, setWorkspaceDropTargetState] = (0, react.useState)();
			const [workspaceGroupDragId, setWorkspaceGroupDragId] = (0, react.useState)();
			const [workspaceGroupDropTarget, setWorkspaceGroupDropTargetState] = (0, react.useState)();
			const setWorkspaceGroupDropTarget = (target) => {
				setWorkspaceGroupDropTargetState((current) => {
					if (current === void 0 || target === void 0) return current === target ? current : target;
					return current.beforeId === target.beforeId ? current : target;
				});
			};
			const workspaceDropTargetRef = (0, react.useRef)();
			const setWorkspaceDropTarget = (target) => {
				if (sameWorkspaceDropTarget(workspaceDropTargetRef.current, target)) return;
				workspaceDropTargetRef.current = target;
				setWorkspaceDropTargetState(target);
			};
			const [headerMenu, setHeaderMenu] = (0, react.useState)();
			const headerMenuRef = (0, react.useRef)();
			headerMenuRef.current = headerMenu;
			const headerMenuPointerAt = (0, react.useRef)(0);
			const [sessionDrag, setSessionDrag] = (0, react.useState)();
			const [sessionDropTarget, setSessionDropTarget] = (0, react.useState)();
			const [createGroupOpen, setCreateGroupOpen] = (0, react.useState)(false);
			const [groupTitleDraft, setGroupTitleDraft] = (0, react.useState)("");
			const [deleteGroupId, setDeleteGroupId] = (0, react.useState)();
			const [groupMenuId, setGroupMenuId] = (0, react.useState)();
			const [renameGroupId, setRenameGroupId] = (0, react.useState)();
			const [renameGroupDraft, setRenameGroupDraft] = (0, react.useState)("");
			const [renameGroupError, setRenameGroupError] = (0, react.useState)();
			const groupActionTriggerRef = (0, react.useRef)();
			const projectsSectionButtonRef = (0, react.useRef)(null);
			const lastRevealedSessionIdRef = (0, react.useRef)();
			const pendingRevealScrollRef = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				writeTreeExpansionState(storage$1(), WORKSPACE_EXPANSION_STORAGE_KEY, expanded);
			}, [expanded]);
			(0, react.useEffect)(() => {
				savePinnedWorkspaceIds(storage$1(), pinnedWorkspaceIds);
				saveWorkspaceGroupsCache(storage$1(), workspaceGroups, workspaceGroupsPendingHostSyncRef.current);
				if (!pinnedHostHydratedRef.current) return;
				const skippedHydration = pinnedHostSkipWriteRef.current;
				pinnedHostSkipWriteRef.current = void 0;
				if (skippedHydration !== void 0 && sameIds(skippedHydration.pinnedWorkspaceIds, pinnedWorkspaceIds) && sameWorkspaceGroups(skippedHydration.workspaceGroups, workspaceGroups)) return;
				queuePinnedHostWrite(pinnedWorkspaceIds, workspaceGroups);
			}, [pinnedWorkspaceIds, workspaceGroups]);
			(0, react.useEffect)(() => {
				let alive = true;
				const local = {
					pinnedWorkspaceIds: [...pinnedWorkspaceIdsRef.current],
					workspaceGroups: workspaceGroupsRef.current
				};
				readHostPinnedWorkspaceIds().then((host) => {
					if (!alive) return;
					const dirty = pinnedHostDirtyRef.current ? {
						pinnedWorkspaceIds: pinnedWorkspaceIdsRef.current,
						workspaceGroups: workspaceGroupsRef.current
					} : void 0;
					const hydration = resolveWorkspacePreferencesHydration(local, host, dirty, workspaceGroupsPendingHostSyncRef.current);
					const baseline = workspaceBaselineRef.current;
					const ids = baseline.ready ? prunePinnedWorkspaceIds(hydration.pinnedWorkspaceIds, baseline.validIds) : hydration.pinnedWorkspaceIds;
					const groups = baseline.ready ? pruneWorkspaceGroups(hydration.workspaceGroups, baseline.validIds) : hydration.workspaceGroups;
					const writeHost = hydration.writeHost || !sameIds(ids, hydration.pinnedWorkspaceIds) || !sameWorkspaceGroups(groups, hydration.workspaceGroups);
					pinnedHostSupportsWorkspaceGroupsRef.current = host.workspaceGroupsSupported !== false;
					workspaceGroupsPendingHostSyncRef.current = workspaceGroupsPendingHostSyncRef.current || host.workspaceGroupsSupported === false && groups.length > 0 || !host.exists && local.workspaceGroups.length > 0;
					pinnedHostHydratedRef.current = true;
					if (!sameIds(pinnedWorkspaceIdsRef.current, ids) || !sameWorkspaceGroups(workspaceGroupsRef.current, groups)) {
						pinnedHostSkipWriteRef.current = {
							pinnedWorkspaceIds: [...ids],
							workspaceGroups: groups
						};
						pinnedWorkspaceIdsRef.current = ids;
						workspaceGroupsRef.current = groups;
						setPinnedWorkspaceIdsState(ids);
						setWorkspaceGroupsState(groups);
					}
					savePinnedWorkspaceIds(storage$1(), ids);
					if (writeHost) queuePinnedHostWrite(ids, groups);
				}).catch((reason) => {
					if (!alive) return;
					setPreferencesFailure(reason);
					pinnedHostHydratedRef.current = true;
				});
				return () => {
					alive = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				writeSessionIds(storage$1(), SESSION_UNREAD_STORAGE_KEY, unreadSessionIds);
			}, [unreadSessionIds]);
			(0, react.useEffect)(() => {
				if (!baselinesReady) return;
				const validIds = workspaces.items.map((workspace) => String(workspace.workspaceId));
				const nextPinned = prunePinnedWorkspaceIds(pinnedWorkspaceIdsRef.current, validIds);
				const nextGroups = pruneWorkspaceGroups(workspaceGroupsRef.current, validIds);
				if (!sameIds(pinnedWorkspaceIdsRef.current, nextPinned)) {
					pinnedWorkspaceIdsRef.current = nextPinned;
					setPinnedWorkspaceIdsState(nextPinned);
				}
				if (!sameWorkspaceGroups(workspaceGroupsRef.current, nextGroups)) {
					workspaceGroupsRef.current = nextGroups;
					setWorkspaceGroupsState(nextGroups);
				}
			}, [baselinesReady, workspaces.items]);
			(0, react.useEffect)(() => {
				if (selectedId !== void 0) setUnreadSessionIds((ids) => ids.filter((id) => id !== selectedId));
			}, [selectedId]);
			(0, react.useEffect)(() => {
				const next = sessionRunningFlags(sessions.byId, sessionStatus);
				const previous = previousSessionRunningRef.current;
				previousSessionRunningRef.current = next;
				if (previous === void 0) return;
				const completed = completedBackgroundSessionIds(previous, next, selectedId);
				if (completed.length > 0) setUnreadSessionIds((ids) => [...completed, ...ids.filter((id) => !completed.includes(id))]);
			}, [
				selectedId,
				sessionStatus,
				sessions.byId
			]);
			const groups = (0, react.useMemo)(() => {
				const archived = workspaces.archivedSessionIds;
				const visible = (ids) => visibleSessionIds(ids, sessions.byId, archived);
				return { items: workspaces.items.map((workspace) => ({
					...workspace,
					visibleIds: visible(workspace.sessionIds)
				})) };
			}, [
				sessions.byId,
				sessions.ids,
				workspaces.archivedSessionIds,
				workspaces.items
			]);
			const sourceWorkspaceIdForSession = (sessionId) => {
				if (sessionDrag?.sessionId === sessionId && sessionDrag.workspaceId !== "") return sessionDrag.workspaceId;
				const source = groups.items.find((workspace) => workspace.sessionIds.some((id) => String(id) === sessionId));
				return source === void 0 ? void 0 : String(source.workspaceId);
			};
			(0, react.useEffect)(() => {
				const onPointerDown = () => {
					if (headerMenuRef.current !== void 0) headerMenuPointerAt.current = performance.now();
				};
				window.addEventListener("pointerdown", onPointerDown, true);
				return () => {
					window.removeEventListener("pointerdown", onPointerDown, true);
				};
			}, []);
			(0, react.useEffect)(() => {
				const onProject = (event) => {
					const detail = event.detail;
					const current = selectedId;
					const workspace = groups.items.find((item) => current !== void 0 && item.visibleIds.includes(String(current)));
					if (workspace === void 0 || detail === void 0) return;
					if (detail.toggle === true && isShowing("workspace", workspace.workspaceId)) {
						dismissTip();
						return;
					}
					showTip({
						kind: "workspace",
						id: workspace.workspaceId,
						title: workspace.title,
						path: workspace.path,
						count: workspace.visibleIds.length,
						unreadCount: workspace.visibleIds.filter((id) => rowUnread(String(id))).length,
						pinned: pinnedWorkspaceIds.includes(String(workspace.workspaceId)),
						left: detail.left,
						top: detail.top
					}, { immediate: true });
				};
				const onMenu = (event) => {
					const detail = event.detail;
					const current = selectedId;
					if (current === void 0 || detail === void 0) return;
					dismissTip();
					if (performance.now() - headerMenuPointerAt.current < 500) {
						headerMenuPointerAt.current = 0;
						setHeaderMenu(void 0);
						return;
					}
					setHeaderMenu({
						id: current,
						getRect: detail.getRect
					});
				};
				window.addEventListener(HEADER_PROJECT_TIP_EVENT, onProject);
				window.addEventListener(HEADER_SESSION_MENU_EVENT, onMenu);
				return () => {
					window.removeEventListener(HEADER_PROJECT_TIP_EVENT, onProject);
					window.removeEventListener(HEADER_SESSION_MENU_EVENT, onMenu);
				};
			}, [
				groups.items,
				menu,
				pinnedWorkspaceIds,
				selectedId,
				unreadSessionIds
			]);
			const projectPinned = (id) => pinnedWorkspaceIds.includes(String(id));
			const pinnedGroups = orderByIds(groups.items, pinnedWorkspaceIds, (workspace) => String(workspace.workspaceId));
			const regularGroups = groups.items.filter((workspace) => !projectPinned(workspace.workspaceId));
			const pinDragActive = workspaceDragId !== void 0;
			const pinnedGroupIds = pinnedGroups.map((workspace) => String(workspace.workspaceId));
			const regularGroupIds = regularGroups.map((workspace) => String(workspace.workspaceId));
			const groupedIds = new Set(groupedWorkspaceIds(workspaceGroups));
			const workspaceGroupIds = workspaceGroups.map((group) => group.id);
			const ungroupedGroups = regularGroups.filter((workspace) => !groupedIds.has(String(workspace.workspaceId)));
			const ungroupedGroupIds = ungroupedGroups.map((workspace) => String(workspace.workspaceId));
			const workspaceById = new Map(regularGroups.map((workspace) => [String(workspace.workspaceId), workspace]));
			const pinnedHeaderDrop = workspaceDropTarget?.zone === "pinned" && workspaceDropTarget.beforeId === pinnedGroupIds[0] ? pinnedHeaderDropIndicator(pinnedGroupIds) : void 0;
			const assignedIds = workspaces.items.flatMap((workspace) => workspace.sessionIds.map((id) => String(id)));
			const recentIds = ungroupedSessionIds(sessions.ids ?? Object.keys(sessions.byId), sessions.byId, assignedIds, workspaces.archivedSessionIds).sort((left, right) => (sessions.byId[right]?.updatedAt ?? 0) - (sessions.byId[left]?.updatedAt ?? 0));
			const run = async (key, action) => {
				if (busyRef.current !== void 0) return;
				busyRef.current = key;
				setBusy(key);
				setError(void 0);
				try {
					await action();
					setMenu(void 0);
				} catch (reason) {
					setError(userErrorText(reason, t));
				} finally {
					busyRef.current = void 0;
					setBusy(void 0);
				}
			};
			const beginRename = (kind, id, title) => {
				setRenameTarget({
					kind,
					id,
					title
				});
				setRenameDraft(title);
				setMenu(void 0);
			};
			const submitRename = () => {
				if (renameTarget === void 0 || renameDraft.trim() === "") return;
				run("rename", async () => {
					if (renameTarget.kind === "workspace") await renameWorkspace(renameTarget.id, renameDraft.trim());
					else await renameSession(renameTarget.id, renameDraft.trim());
					setRenameTarget(void 0);
				});
			};
			const submitDelete = () => {
				if (deleteTarget === void 0) return;
				const target = deleteTarget;
				const operation = target.kind === "session" ? "delete-session" : "delete-workspace";
				run(operation, async () => {
					if (target.kind === "session") {
						await deleteSession(target.id);
						setUnreadSessionIds((ids) => ids.filter((id) => id !== target.id));
					} else {
						await deleteWorkspace(target.id);
						setPinnedWorkspaceIds((ids) => ids.filter((id) => id !== target.id));
					}
					setDeleteTarget(void 0);
				});
			};
			const submitArchiveWorkspace = () => {
				if (archiveWorkspaceTarget === void 0) return;
				const target = archiveWorkspaceTarget;
				run("archive-workspace", async () => {
					await archiveWorkspaceSessions(target.sessionIds, (sessionId) => archiveSession(sessionId));
					setUnreadSessionIds((ids) => ids.filter((id) => !target.sessionIds.includes(id)));
					setArchiveWorkspaceTarget(void 0);
				});
			};
			const copy = (value) => {
				if (value === void 0 || value === "") return;
				run("copy", async () => {
					await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(value);
				});
			};
			const openPathImmediately = (path) => {
				setMenu(void 0);
				setHeaderMenu(void 0);
				run("open-path", () => openPath(path));
			};
			const toggleGroup = (key, defaultOpen = true) => {
				setExpanded((current) => ({
					...current,
					[key]: !(current[key] ?? defaultOpen)
				}));
			};
			const toggleProject = (expandKey, id) => {
				if (expanded[expandKey] ?? true) setSessionWindows((current) => ({
					...current,
					[id]: collapseProjectSessionWindow()
				}));
				toggleGroup(expandKey, true);
			};
			const submitCreateGroup = () => {
				if (groupTitleDraft.trim() === "") return;
				try {
					setWorkspaceGroups((current) => createWorkspaceGroup(current, {
						id: newWorkspaceGroupId(),
						title: groupTitleDraft
					}));
					setCreateGroupOpen(false);
					setGroupTitleDraft("");
				} catch (reason) {
					setError(userErrorText(reason, t));
				}
			};
			const closeRenameGroup = () => {
				setRenameGroupId(void 0);
				setRenameGroupDraft("");
				setRenameGroupError(void 0);
				const trigger = groupActionTriggerRef.current;
				const focusTarget = trigger?.isConnected ? trigger : projectsSectionButtonRef.current;
				groupActionTriggerRef.current = void 0;
				focusTarget?.focus();
			};
			const submitRenameGroup = () => {
				if (renameGroupId === void 0 || renameGroupDraft.trim() === "") return;
				if (workspaceGroupsRef.current.find((group) => group.id === renameGroupId)?.title === renameGroupDraft.trim()) {
					closeRenameGroup();
					return;
				}
				try {
					setWorkspaceGroups((current) => renameWorkspaceGroup(current, renameGroupId, renameGroupDraft));
					closeRenameGroup();
				} catch (reason) {
					setRenameGroupError(userErrorText(reason, t));
				}
			};
			const triggerAddWorkspace = () => {
				requestAddWorkspace?.();
			};
			const sectionOpen = (id) => expanded[`section:${id}`] ?? true;
			const toggleSection = (id) => {
				setExpanded((current) => ({
					...current,
					[`section:${id}`]: !(current[`section:${id}`] ?? true)
				}));
			};
			const workspaceGroupIdFor = (workspaceId) => workspaceGroups.find((group) => group.workspaceIds.includes(workspaceId))?.id;
			const moveWorkspaceToGroup = (workspaceId, groupId) => {
				setWorkspaceGroups((current) => assignWorkspaceToGroup(current, workspaceId, groupId));
				if (pinnedWorkspaceIdsRef.current.includes(workspaceId)) setPinnedWorkspaceIds((ids) => ids.filter((id) => id !== workspaceId));
			};
			const projectMenu = (workspace) => {
				const workspaceId = String(workspace.workspaceId);
				const moveTargets = workspaceGroupMoveTargets(workspaceGroups, workspaceId).map((target) => ({
					id: workspaceGroupMoveActionId(target.groupId),
					label: target.title ?? t("workspace.removeFromGroup"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
				}));
				return [
					{
						id: "pin",
						label: t(projectPinned(workspace.workspaceId) ? "workspace.unpin" : "workspace.pin"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PinIcon, {})
					},
					{
						id: "rename",
						label: t("workspace.rename"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEditOutlineMedium, { size: 16 })
					},
					{
						type: "separator",
						id: "project-main-separator"
					},
					{
						id: "moveToGroup",
						label: t("workspace.moveToGroup"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 }),
						disabled: moveTargets.length === 0,
						submenu: moveTargets
					},
					{
						id: "openPath",
						label: t("workspace.openPath"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderOpenOutlineMedium, { size: 16 })
					},
					{
						type: "separator",
						id: "project-archive-separator"
					},
					{
						id: "archiveWorkspace",
						label: t("workspace.archive"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArchiveOutlineMedium, { size: 16 }),
						disabled: workspace.visibleIds.length === 0
					},
					{
						type: "separator",
						id: "project-delete-separator"
					},
					{
						id: "delete",
						label: t("workspace.delete"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconTrashOutlineMedium, { size: 16 }),
						danger: true
					}
				];
			};
			const handleProjectMenuAction = (workspace, id) => {
				if (busy !== void 0) return;
				const workspaceId = String(workspace.workspaceId);
				const targetGroup = workspaceGroups.find((group) => id === workspaceGroupMoveActionId(group.id));
				if (targetGroup !== void 0 || id === workspaceGroupMoveActionId()) {
					moveWorkspaceToGroup(workspaceId, targetGroup?.id);
					setMenu(void 0);
					return;
				}
				if (id === "rename") beginRename("workspace", workspace.workspaceId, workspace.title);
				if (id === "pin") {
					setPinnedWorkspaceIds((ids) => togglePinnedWorkspace(ids, workspace.workspaceId));
					setMenu(void 0);
				}
				if (id === "archiveWorkspace") {
					setArchiveWorkspaceTarget({
						id: workspaceId,
						title: workspace.title,
						sessionIds: [...workspace.visibleIds]
					});
					setError(void 0);
					setMenu(void 0);
				}
				if (id === "openPath") openPathImmediately(workspace.path);
				if (id === "delete") {
					setDeleteTarget({
						id: workspace.workspaceId,
						kind: "workspace",
						title: workspace.title
					});
					setError(void 0);
					setMenu(void 0);
				}
			};
			const canDelete = canDeleteSession?.() === true;
			const sessionMenu = (sessionId, path) => sessionMenuItems(t, {
				unread: rowUnread(sessionId),
				path,
				includePath: true,
				moveTargets: sessionMoveTargets(groups.items, sessionId).map((target) => ({
					...target,
					id: moveSessionActionId(target.id)
				})),
				canDelete
			});
			const requestSessionMove = (sessionId, targetWorkspaceId) => {
				const targetWorkspace = groups.items.find((workspace) => String(workspace.workspaceId) === targetWorkspaceId);
				const session = sessions.byId[sessionId];
				if (targetWorkspace === void 0 || session === void 0) {
					setError(t("sessions.moveNotFound"));
					return;
				}
				setMenu(void 0);
				setHeaderMenu(void 0);
				setError(void 0);
				setSessionMoveTarget({
					sessionId,
					sessionTitle: session.displayTitle,
					targetWorkspaceId,
					targetWorkspaceTitle: targetWorkspace.title,
					targetPath: targetWorkspace.path
				});
			};
			const runSessionMoveAction = (action, sessionId) => {
				const targetWorkspaceId = parseMoveSessionActionId(action);
				if (targetWorkspaceId === void 0) return false;
				requestSessionMove(sessionId, targetWorkspaceId);
				return true;
			};
			const submitSessionMove = () => {
				const target = sessionMoveTarget;
				if (target === void 0) return;
				run("session-move", async () => {
					const nextExpanded = expandedForSessionMove(expanded, {
						workspaceId: target.targetWorkspaceId,
						pinned: projectPinned(target.targetWorkspaceId),
						groupId: workspaceGroupIdFor(target.targetWorkspaceId),
						hasGroups: workspaceGroups.length > 0
					});
					setExpanded(nextExpanded);
					writeTreeExpansionState(storage$1(), WORKSPACE_EXPANSION_STORAGE_KEY, nextExpanded);
					await moveSession(target.sessionId, target.targetWorkspaceId);
					setSessionMoveTarget(void 0);
				});
			};
			const pinWorkspaceAt = (id, beforeId) => {
				setPinnedWorkspaceIds((ids) => insertPinnedWorkspace(ids, id, beforeId));
			};
			const renderGroup = (workspace, zone) => {
				const expandKey = zone === "pinned" ? `pin:${workspace.workspaceId}` : String(workspace.workspaceId);
				const isExpanded = expanded[expandKey] ?? true;
				const currentSessionId = selectedId;
				const folder = projectFolderPresentation(isExpanded, workspace.visibleIds.some((id) => id === currentSessionId));
				const shownIds = workspace.visibleIds;
				const menuOpen = menu?.type === "workspace" && menu.id === workspace.workspaceId;
				const menuAt = menuOpen && menu.x !== void 0 && menu.y !== void 0 ? {
					x: menu.x,
					y: menu.y
				} : void 0;
				const isPinnedHeaderDrop = zone === "pinned" && pinnedHeaderDrop?.kind === "workspace" && pinnedHeaderDrop.workspaceId === String(workspace.workspaceId);
				const workspaceId = String(workspace.workspaceId);
				const sessionWindow = projectSessionWindow(shownIds, sessionWindows[workspaceId] ?? {
					expanded: false,
					page: 1
				}, currentSessionId !== void 0 && shownIds.includes(currentSessionId) ? currentSessionId : void 0);
				const renderedIds = sessionWindow.ids;
				const dropAfterSessionId = sessionDropTarget?.workspaceId === workspaceId && sessionDropTarget.ontoProject !== true ? sessionDropAfterRowId(sessionDropTarget, renderedIds) : void 0;
				const zoneIds = zone === "pinned" ? pinnedGroupIds : regularGroupIds;
				const dropsBefore = workspaceDropTarget?.zone === zone && workspaceDropTarget.beforeId === workspaceId;
				const dropsAfterLast = zone === "projects" && workspaceDropTarget?.zone === zone && workspaceDropTarget.beforeId === void 0 && zoneIds[zoneIds.length - 1] === workspaceId;
				const projectSessionDrop = sessionDropTarget?.workspaceId === workspaceId && sessionDropTarget.ontoProject === true;
				const projectSessionMoveDrop = projectSessionDrop && sessionDropTarget.crossWorkspace === true;
				const handleProjectDragOver = (event) => {
					const draggedWorkspace = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
					if (draggedWorkspace !== void 0) {
						event.preventDefault();
						event.stopPropagation();
						event.dataTransfer.dropEffect = "move";
						const rect = event.currentTarget.getBoundingClientRect();
						const beforeId = reorderDropBeforeId(zoneIds, draggedWorkspace, workspaceId, event.clientY > rect.top + rect.height / 2);
						setSessionDropTarget(void 0);
						setWorkspaceDropTarget(beforeId === null ? void 0 : {
							zone,
							beforeId
						});
						return;
					}
					const draggedSessionId = readSessionDrag(event.dataTransfer, sessionDrag?.sessionId);
					if (draggedSessionId === void 0) return;
					event.preventDefault();
					event.stopPropagation();
					event.dataTransfer.dropEffect = "move";
					const action = sessionDropAction(sourceWorkspaceIdForSession(draggedSessionId), workspaceId);
					setWorkspaceDropTarget(void 0);
					setSessionDropTarget({
						workspaceId,
						beforeId: action === "reorder" ? shownIds[0] : void 0,
						ontoProject: true,
						crossWorkspace: action === "move"
					});
				};
				const handleProjectDrop = (event) => {
					const draggedWorkspace = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
					if (draggedWorkspace !== void 0) {
						event.preventDefault();
						event.stopPropagation();
						const rect = event.currentTarget.getBoundingClientRect();
						const beforeId = reorderDropBeforeId(zoneIds, draggedWorkspace, workspaceId, event.clientY > rect.top + rect.height / 2);
						setWorkspaceDragId(void 0);
						setWorkspaceDropTarget(void 0);
						if (beforeId === null) return;
						if (zone === "pinned") {
							pinWorkspaceAt(draggedWorkspace, beforeId);
							return;
						}
						const hostIds = groups.items.map((item) => String(item.workspaceId));
						if (moveBefore(hostIds, draggedWorkspace, beforeId).some((id, index) => id !== hostIds[index])) run("workspace-order", () => insertWorkspaceBefore(draggedWorkspace, beforeId));
						return;
					}
					const draggedSessionId = readSessionDrag(event.dataTransfer, sessionDrag?.sessionId);
					if (draggedSessionId === void 0) return;
					event.preventDefault();
					event.stopPropagation();
					const action = sessionDropAction(sourceWorkspaceIdForSession(draggedSessionId), workspaceId);
					setSessionDrag(void 0);
					setSessionDropTarget(void 0);
					setWorkspaceDropTarget(void 0);
					if (action === "move") {
						requestSessionMove(draggedSessionId, workspaceId);
						return;
					}
					run("session-order", () => insertSessionBefore(workspace.workspaceId, draggedSessionId, shownIds[0]));
				};
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `dcu-wb-project${isPinnedHeaderDrop || dropsBefore ? " dcu-wb-drop" : ""}${dropsAfterLast ? " dcu-wb-drop dcu-wb-drop-after" : ""}${projectSessionDrop ? " dcu-wb-session-drop" : ""}${projectSessionMoveDrop ? " dcu-wb-session-move-drop" : ""}`,
					onDragOver: handleProjectDragOver,
					onDragLeave: (event) => {
						if (event.currentTarget.contains(event.relatedTarget)) return;
						setWorkspaceDropTarget(void 0);
						setSessionDropTarget(void 0);
					},
					onDrop: handleProjectDrop,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `dcu-wb-project-head${menuOpen ? " dcu-wb-menu-open" : ""}${workspaceDragId === workspaceId ? " dcu-wb-dragging" : ""}`,
						role: "treeitem",
						"aria-expanded": isExpanded,
						tabIndex: 0,
						draggable: true,
						onDragStart: (event) => {
							event.stopPropagation();
							setSessionDrag(void 0);
							setSessionDropTarget(void 0);
							setWorkspaceGroupDragId(void 0);
							setWorkspaceGroupDropTarget(void 0);
							writeWorkspaceDrag(event.dataTransfer, workspaceId, workspace.title);
							setDragPreview(event.dataTransfer, workspace.title, event.currentTarget.querySelector(".dcu-wb-folder"));
							setWorkspaceDragId(workspaceId);
						},
						onDragEnd: () => {
							setWorkspaceDragId(void 0);
							setWorkspaceDropTarget(void 0);
							setWorkspaceGroupDropTarget(void 0);
						},
						onClick: () => {
							toggleProject(expandKey, workspaceId);
						},
						onContextMenu: (event) => {
							event.preventDefault();
							event.stopPropagation();
							dismissTip();
							setMenu({
								id: workspace.workspaceId,
								type: "workspace",
								x: event.clientX,
								y: event.clientY
							});
						},
						onMouseEnter: (event) => {
							const box = hoverCardAnchor(event.currentTarget.getBoundingClientRect());
							showTip({
								kind: "workspace",
								id: workspace.workspaceId,
								title: workspace.title,
								path: workspace.path,
								count: workspace.visibleIds.length,
								unreadCount: workspace.visibleIds.filter((id) => rowUnread(String(id))).length,
								pinned: projectPinned(workspace.workspaceId),
								left: box.left,
								top: box.top
							});
						},
						onMouseLeave: hideTip,
						onKeyDown: (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								toggleProject(expandKey, workspaceId);
							}
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `dcu-wb-folder${folder.current ? " dcu-wb-folder-current" : ""}`,
								onClick: (event) => {
									event.stopPropagation();
									const box = hoverCardAnchor(event.currentTarget.getBoundingClientRect());
									if (isShowing("workspace", workspace.workspaceId)) {
										dismissTip();
										return;
									}
									showTip({
										kind: "workspace",
										id: workspace.workspaceId,
										title: workspace.title,
										path: workspace.path,
										count: workspace.visibleIds.length,
										unreadCount: workspace.visibleIds.filter((id) => rowUnread(String(id))).length,
										pinned: projectPinned(workspace.workspaceId),
										left: box.left,
										top: box.top
									}, { immediate: true });
								},
								children: folder.open ? folder.current ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderOpenMedium, { size: 16 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderOpenOutlineMedium, { size: 16 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-project-title",
								children: workspace.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-actions",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
									open: menuOpen,
									onClose: () => {
										setMenu(void 0);
									},
									items: projectMenu(workspace),
									onSelect: (id) => {
										handleProjectMenuAction(workspace, id);
									},
									portal: true,
									dense: true,
									getAnchorRect: menuAt === void 0 ? void 0 : () => pointerMenuRect(menuAt.x, menuAt.y),
									anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dcu-wb-more",
										"aria-label": t("workspace.actions", { name: workspace.title }),
										onClick: (event) => {
											event.stopPropagation();
											dismissTip();
											setMenu((current) => current?.id === workspace.workspaceId && current?.type === "workspace" ? void 0 : {
												id: workspace.workspaceId,
												type: "workspace"
											});
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutlineMedium, { size: 16 })
									})
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dcu-wb-actions",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-wb-more",
									"aria-label": t("workspace.newSession"),
									onClick: (event) => {
										event.stopPropagation();
										startSession(workspace.workspaceId);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NewSessionIcon, {})
								})
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(DisclosureBody, {
						className: "dcu-wb-project-body",
						open: isExpanded,
						children: [
							shownIds.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-nochat",
								children: t("workspace.noChat")
							}),
							renderedIds.map((id) => {
								const session = sessions.byId[id];
								if (session === void 0) return null;
								const pendingInteraction = pendingInteractionForSession(id, pendingInteractions, legacyPendingInteraction(session));
								const path = session.cwd ?? workspace.path;
								const selected = selectedId === id;
								const sessionMenuOpen = menu?.type === "session" && menu.id === id;
								const sessionMenuAt = sessionMenuOpen && menu.x !== void 0 && menu.y !== void 0 ? {
									x: menu.x,
									y: menu.y
								} : void 0;
								const dropsBeforeSession = sessionDropTarget?.workspaceId === workspaceId && sessionDropTarget.ontoProject !== true && sessionDropTarget.beforeId === id;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									"data-dcu-session": id,
									className: `dcu-wb-session${selected ? " dcu-wb-selected" : ""}${sessionMenuOpen ? " dcu-wb-menu-open" : ""}${dropsBeforeSession ? " dcu-wb-drop" : ""}${dropAfterSessionId !== void 0 && id === dropAfterSessionId ? " dcu-wb-drop dcu-wb-drop-after" : ""}`,
									role: "treeitem",
									"aria-selected": selected,
									draggable: true,
									onDragStart: (event) => {
										event.stopPropagation();
										setWorkspaceDragId(void 0);
										setWorkspaceDropTarget(void 0);
										setWorkspaceGroupDragId(void 0);
										setWorkspaceGroupDropTarget(void 0);
										writeSessionDrag(event.dataTransfer, id, session.displayTitle);
										setDragPreview(event.dataTransfer, session.displayTitle);
										setSessionDrag({
											sessionId: id,
											workspaceId
										});
									},
									onDragEnd: () => {
										setSessionDrag(void 0);
										setSessionDropTarget(void 0);
										setWorkspaceGroupDropTarget(void 0);
									},
									onDragOver: (event) => {
										const drag = sessionDrag;
										if (drag === void 0 || drag.workspaceId !== workspaceId) return;
										event.preventDefault();
										event.stopPropagation();
										event.dataTransfer.dropEffect = "move";
										const rect = event.currentTarget.getBoundingClientRect();
										const beforeId = reorderDropBeforeId(shownIds, drag.sessionId, id, event.clientY > rect.top + rect.height / 2);
										setSessionDropTarget(beforeId === null ? void 0 : {
											workspaceId,
											beforeId,
											hoveredId: id
										});
									},
									onDragLeave: (event) => {
										if (event.currentTarget.contains(event.relatedTarget)) return;
										setSessionDropTarget(void 0);
									},
									onDrop: (event) => {
										const drag = sessionDrag;
										if (drag === void 0 || drag.workspaceId !== workspaceId) return;
										event.preventDefault();
										event.stopPropagation();
										const rect = event.currentTarget.getBoundingClientRect();
										setSessionDrag(void 0);
										setSessionDropTarget(void 0);
										const beforeId = reorderDropBeforeId(shownIds, drag.sessionId, id, event.clientY > rect.top + rect.height / 2);
										if (beforeId !== null) run("session-order", () => insertSessionBefore(workspace.workspaceId, drag.sessionId, beforeId));
									},
									onClick: () => {
										if (openSession(id) !== false) setUnreadSessionIds((ids) => ids.filter((item) => item !== id));
									},
									onContextMenu: (event) => {
										event.preventDefault();
										event.stopPropagation();
										dismissTip();
										setMenu({
											id,
											type: "session",
											x: event.clientX,
											y: event.clientY
										});
									},
									onMouseEnter: (event) => {
										const box = hoverCardAnchor(event.currentTarget.getBoundingClientRect());
										const branch = optionalText(session, "branch");
										showTip({
											kind: "session",
											id,
											title: session.displayTitle,
											project: workspace.title,
											path,
											branch,
											time: formatHoverTime(session.updatedAt, t, now),
											left: box.left,
											top: box.top
										});
									},
									onMouseLeave: hideTip,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRowTitle, { title: session.displayTitle }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionState, {
											pendingInteraction,
											unread: rowUnread(id),
											running: rowRunning(id, session),
											t
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dcu-wb-quick-actions",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dcu-wb-more",
												"aria-label": t("sessions.archive"),
												onClick: (event) => {
													event.stopPropagation();
													run("archive", () => archiveSession(id));
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QuickArchiveIcon, {})
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dcu-wb-actions",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
												open: sessionMenuOpen,
												onClose: () => {
													setMenu(void 0);
												},
												items: sessionMenu(id, path),
												onSelect: (action) => {
													if (busy !== void 0 || runSessionMoveAction(action, id)) return;
													if (action === "rename") beginRename("session", id, session.displayTitle);
													if (action === "unread") {
														setUnreadSessionIds((ids) => toggleSessionId(ids, id));
														setMenu(void 0);
													}
													if (action === "archive") run("archive", () => archiveSession(id));
													if (action === "delete") {
														setDeleteTarget({
															id,
															kind: "session",
															title: session.displayTitle
														});
														setError(void 0);
														setMenu(void 0);
													}
													if (action === "fork") run("fork", () => forkSession(id));
													if (action === "openPath" && path !== void 0) openPathImmediately(path);
													if (action === "copyPath") copy(path);
													if (action === "copyTitle") copy(session.displayTitle);
													if (action === "copyId") copy(id);
												},
												portal: true,
												dense: true,
												getAnchorRect: sessionMenuAt === void 0 ? void 0 : () => pointerMenuRect(sessionMenuAt.x, sessionMenuAt.y),
												anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dcu-wb-more dcu-wb-context-anchor",
													"aria-label": t("sessions.actions", { name: session.displayTitle }),
													onClick: (event) => {
														event.stopPropagation();
														setMenu((current) => current?.id === id && current?.type === "session" ? void 0 : {
															id,
															type: "session"
														});
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutlineMedium, { size: 16 })
												})
											})
										})
									]
								}, id);
							}),
							sessionWindow.showMore && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-session-more",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: (event) => {
										event.stopPropagation();
										revealMoreSessions(workspaceId);
									},
									children: t("workspace.showMore")
								})
							})
						]
					})]
				}, workspace.workspaceId);
			};
			const renderWorkspaceCollection = (group) => {
				const groupId = group.id;
				const expandKey = `workspace-group:${group.id}`;
				const isExpanded = expanded[expandKey] ?? true;
				const members = group.workspaceIds.flatMap((id) => {
					const workspace = workspaceById.get(id);
					return workspace === void 0 ? [] : [workspace];
				});
				const memberIds = members.map((workspace) => String(workspace.workspaceId));
				const groupWorkspaceMoveDrop = workspaceDropTarget?.zone === "group" && workspaceDropTarget.groupId === group.id && workspaceDropTarget.crossGroup === true;
				const groupOrderDrop = workspaceGroupDropTarget?.beforeId === groupId;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `dcu-wb-collection${groupOrderDrop ? " dcu-wb-group-order-drop" : ""}${groupWorkspaceMoveDrop ? " dcu-wb-workspace-move-drop" : ""}`,
					onDragOver: (event) => {
						const draggedGroupId = readWorkspaceGroupDrag(event.dataTransfer, workspaceGroupDragId);
						if (draggedGroupId !== void 0) {
							event.preventDefault();
							event.stopPropagation();
							event.dataTransfer.dropEffect = "move";
							setWorkspaceDropTarget(void 0);
							const rect = event.currentTarget.querySelector(":scope > .dcu-wb-collection-head")?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
							const beforeId = reorderDropBeforeId(workspaceGroupIds, draggedGroupId, groupId, event.clientY > rect.top + rect.height / 2);
							setWorkspaceGroupDropTarget(beforeId === null ? void 0 : { beforeId });
							return;
						}
						const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
						if (dragged === void 0) return;
						event.preventDefault();
						event.stopPropagation();
						event.dataTransfer.dropEffect = "move";
						setWorkspaceGroupDropTarget(void 0);
						if (workspaceGroupIdFor(dragged) === groupId) {
							const lastId = memberIds[memberIds.length - 1];
							const beforeId = lastId === void 0 ? null : reorderDropBeforeId(memberIds, dragged, lastId, true);
							setWorkspaceDropTarget(beforeId === null ? void 0 : {
								zone: "group",
								groupId,
								beforeId
							});
							return;
						}
						setWorkspaceDropTarget({
							zone: "group",
							groupId,
							ontoGroup: true,
							crossGroup: true
						});
					},
					onDragLeave: (event) => {
						if (event.currentTarget.contains(event.relatedTarget)) return;
						setWorkspaceDropTarget(void 0);
						setWorkspaceGroupDropTarget(void 0);
					},
					onDrop: (event) => {
						const draggedGroupId = readWorkspaceGroupDrag(event.dataTransfer, workspaceGroupDragId);
						if (draggedGroupId !== void 0) {
							event.preventDefault();
							event.stopPropagation();
							const rect = event.currentTarget.querySelector(":scope > .dcu-wb-collection-head")?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
							const beforeId = reorderDropBeforeId(workspaceGroupIds, draggedGroupId, groupId, event.clientY > rect.top + rect.height / 2);
							setWorkspaceGroupDragId(void 0);
							setWorkspaceGroupDropTarget(void 0);
							if (beforeId !== null) setWorkspaceGroups((current) => moveWorkspaceGroup(current, draggedGroupId, beforeId));
							return;
						}
						const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
						if (dragged === void 0) return;
						event.preventDefault();
						event.stopPropagation();
						setWorkspaceDragId(void 0);
						setWorkspaceDropTarget(void 0);
						setWorkspaceGroups((current) => current.find((candidate) => candidate.workspaceIds.includes(dragged))?.id === groupId ? moveWorkspaceGroupMember(current, dragged, groupId) : assignWorkspaceToGroup(current, dragged, groupId));
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `dcu-wb-collection-head${workspaceGroupDragId === groupId ? " dcu-wb-dragging" : ""}`,
						draggable: true,
						onDragStart: (event) => {
							event.stopPropagation();
							setSessionDrag(void 0);
							setSessionDropTarget(void 0);
							setWorkspaceDragId(void 0);
							setWorkspaceDropTarget(void 0);
							setWorkspaceGroupDropTarget(void 0);
							writeWorkspaceGroupDrag(event.dataTransfer, groupId, group.title);
							setDragPreview(event.dataTransfer, group.title);
							setWorkspaceGroupDragId(groupId);
						},
						onDragEnd: () => {
							setWorkspaceGroupDragId(void 0);
							setWorkspaceGroupDropTarget(void 0);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dcu-wb-collection-label",
							"aria-expanded": isExpanded,
							onClick: () => {
								toggleGroup(expandKey, true);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dcu-wb-section-caret",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "12",
										height: "12",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "M6.25 4.25 10.25 8 6.25 11.75",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round",
											strokeLinejoin: "round"
										})
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dcu-wb-collection-title",
									children: group.title
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dcu-wb-collection-count",
									children: members.length
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-collection-actions",
							onClick: (event) => {
								event.stopPropagation();
							},
							onDragStart: (event) => {
								event.preventDefault();
								event.stopPropagation();
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
								open: groupMenuId === groupId,
								onClose: () => {
									setGroupMenuId(void 0);
								},
								items: [
									{
										id: "rename",
										label: t("workspace.renameGroup"),
										icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEditOutlineMedium, { size: 16 })
									},
									{
										type: "separator",
										id: "group-delete-separator"
									},
									{
										id: "delete",
										label: t("workspace.deleteGroupAction"),
										icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconTrashOutlineMedium, { size: 16 }),
										danger: true
									}
								],
								onSelect: (action) => {
									setGroupMenuId(void 0);
									if (action === "rename") {
										setRenameGroupId(groupId);
										setRenameGroupDraft(group.title);
										setRenameGroupError(void 0);
									}
									if (action === "delete") setDeleteGroupId(groupId);
								},
								portal: true,
								dense: true,
								anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-wb-more",
									draggable: false,
									"aria-haspopup": "menu",
									"aria-expanded": groupMenuId === groupId,
									"aria-label": t("workspace.groupActions", { name: group.title }),
									title: t("workspace.groupActions", { name: group.title }),
									onClick: (event) => {
										groupActionTriggerRef.current = event.currentTarget;
										setGroupMenuId((current) => current === groupId ? void 0 : groupId);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutlineMedium, { size: 16 })
								})
							})
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(DisclosureBody, {
						className: "dcu-wb-collection-body",
						open: isExpanded,
						children: [members.map((workspace) => {
							const workspaceId = String(workspace.workspaceId);
							const preciseTarget = workspaceDropTarget?.zone === "group" && workspaceDropTarget.groupId === groupId && workspaceDropTarget.ontoGroup !== true && workspaceDropTarget.crossGroup !== true;
							const orderDrop = preciseTarget && workspaceDropTarget.beforeId === workspaceId;
							const orderDropAfter = preciseTarget && workspaceDropTarget.beforeId === void 0 && memberIds[memberIds.length - 1] === workspaceId;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								"data-dcu-group-member": true,
								className: `dcu-wb-group-member${orderDrop ? " dcu-wb-drop" : ""}${orderDropAfter ? " dcu-wb-drop dcu-wb-drop-after" : ""}`,
								onDragOverCapture: (event) => {
									const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									if (dragged === void 0) return;
									event.preventDefault();
									event.stopPropagation();
									event.dataTransfer.dropEffect = "move";
									const rect = event.currentTarget.getBoundingClientRect();
									const beforeId = reorderDropBeforeId(memberIds, dragged, workspaceId, event.clientY > rect.top + rect.height / 2);
									setWorkspaceDropTarget(beforeId === null ? void 0 : {
										zone: "group",
										groupId,
										beforeId,
										crossGroup: workspaceGroupIdFor(dragged) !== groupId
									});
								},
								onDropCapture: (event) => {
									const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									if (dragged === void 0) return;
									event.preventDefault();
									event.stopPropagation();
									const rect = event.currentTarget.getBoundingClientRect();
									const beforeId = reorderDropBeforeId(memberIds, dragged, workspaceId, event.clientY > rect.top + rect.height / 2);
									setWorkspaceDragId(void 0);
									setWorkspaceDropTarget(void 0);
									if (beforeId === null) return;
									setWorkspaceGroups((current) => current.find((candidate) => candidate.workspaceIds.includes(dragged))?.id === groupId ? moveWorkspaceGroupMember(current, dragged, groupId, beforeId) : placeWorkspaceInGroup(current, dragged, groupId, beforeId));
								},
								children: renderGroup(workspace, "projects")
							}, workspaceId);
						}), members.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-wb-empty",
							children: t("workspace.empty")
						})]
					})]
				}, group.id);
			};
			const renderUngroupedCollection = () => {
				const ungroupedExpandKey = "workspace-group:ungrouped";
				const ungroupedExpanded = expanded[ungroupedExpandKey] ?? true;
				const ungroupedWorkspaceMoveDrop = workspaceDropTarget?.zone === "ungrouped" && workspaceDropTarget.crossGroup === true;
				const groupOrderDrop = workspaceGroupDropTarget !== void 0 && workspaceGroupDropTarget.beforeId === void 0;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `dcu-wb-ungrouped${groupOrderDrop ? " dcu-wb-group-order-drop" : ""}${ungroupedWorkspaceMoveDrop ? " dcu-wb-workspace-move-drop" : ""}`,
					onDragOver: (event) => {
						const draggedGroupId = readWorkspaceGroupDrag(event.dataTransfer, workspaceGroupDragId);
						if (draggedGroupId !== void 0) {
							event.preventDefault();
							event.stopPropagation();
							event.dataTransfer.dropEffect = "move";
							setWorkspaceDropTarget(void 0);
							const lastGroupId = workspaceGroupIds[workspaceGroupIds.length - 1];
							const beforeId = lastGroupId === void 0 ? null : reorderDropBeforeId(workspaceGroupIds, draggedGroupId, lastGroupId, true);
							setWorkspaceGroupDropTarget(beforeId === null ? void 0 : { beforeId: void 0 });
							return;
						}
						const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
						if (dragged === void 0) return;
						event.preventDefault();
						event.stopPropagation();
						event.dataTransfer.dropEffect = "move";
						setWorkspaceGroupDropTarget(void 0);
						if (workspaceGroupIdFor(dragged) === void 0) {
							const lastId = ungroupedGroupIds[ungroupedGroupIds.length - 1];
							const beforeId = lastId === void 0 ? null : reorderDropBeforeId(ungroupedGroupIds, dragged, lastId, true);
							setWorkspaceDropTarget(beforeId === null ? void 0 : {
								zone: "ungrouped",
								beforeId
							});
							return;
						}
						setWorkspaceDropTarget({
							zone: "ungrouped",
							ontoSection: true,
							crossGroup: true
						});
					},
					onDragLeave: (event) => {
						if (event.currentTarget.contains(event.relatedTarget)) return;
						setWorkspaceDropTarget(void 0);
						setWorkspaceGroupDropTarget(void 0);
					},
					onDrop: (event) => {
						const draggedGroupId = readWorkspaceGroupDrag(event.dataTransfer, workspaceGroupDragId);
						if (draggedGroupId !== void 0) {
							event.preventDefault();
							event.stopPropagation();
							const lastGroupId = workspaceGroupIds[workspaceGroupIds.length - 1];
							const beforeId = lastGroupId === void 0 ? null : reorderDropBeforeId(workspaceGroupIds, draggedGroupId, lastGroupId, true);
							setWorkspaceGroupDragId(void 0);
							setWorkspaceGroupDropTarget(void 0);
							if (beforeId !== null) setWorkspaceGroups((current) => moveWorkspaceGroup(current, draggedGroupId));
							return;
						}
						const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
						if (dragged === void 0) return;
						event.preventDefault();
						event.stopPropagation();
						setWorkspaceDragId(void 0);
						setWorkspaceDropTarget(void 0);
						setWorkspaceGroups((current) => assignWorkspaceToGroup(current, dragged));
						run("workspace-order", () => insertWorkspaceBefore(dragged));
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-collection-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dcu-wb-collection-label",
							"aria-expanded": ungroupedExpanded,
							onClick: () => {
								toggleGroup(ungroupedExpandKey, true);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dcu-wb-section-caret",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "12",
										height: "12",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "M6.25 4.25 10.25 8 6.25 11.75",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round",
											strokeLinejoin: "round"
										})
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("workspace.ungrouped") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dcu-wb-collection-count",
									children: ungroupedGroups.length
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dcu-wb-collection-actions",
							"aria-hidden": "true"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DisclosureBody, {
						className: "dcu-wb-collection-body",
						open: ungroupedExpanded,
						children: ungroupedGroups.map((workspace) => {
							const workspaceId = String(workspace.workspaceId);
							const preciseTarget = workspaceDropTarget?.zone === "ungrouped" && workspaceDropTarget.ontoSection !== true && workspaceDropTarget.crossGroup !== true;
							const orderDrop = preciseTarget && workspaceDropTarget.beforeId === workspaceId;
							const orderDropAfter = preciseTarget && workspaceDropTarget.beforeId === void 0 && ungroupedGroupIds[ungroupedGroupIds.length - 1] === workspaceId;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								"data-dcu-ungrouped-member": true,
								className: `dcu-wb-group-member dcu-wb-ungrouped-member${orderDrop ? " dcu-wb-drop" : ""}${orderDropAfter ? " dcu-wb-drop dcu-wb-drop-after" : ""}`,
								onDragOverCapture: (event) => {
									const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									if (dragged === void 0) return;
									event.preventDefault();
									event.stopPropagation();
									event.dataTransfer.dropEffect = "move";
									const rect = event.currentTarget.getBoundingClientRect();
									const beforeId = reorderDropBeforeId(ungroupedGroupIds, dragged, workspaceId, event.clientY > rect.top + rect.height / 2);
									setWorkspaceDropTarget(beforeId === null ? void 0 : {
										zone: "ungrouped",
										beforeId,
										crossGroup: workspaceGroupIdFor(dragged) !== void 0
									});
								},
								onDropCapture: (event) => {
									const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									if (dragged === void 0) return;
									event.preventDefault();
									event.stopPropagation();
									const rect = event.currentTarget.getBoundingClientRect();
									const beforeId = reorderDropBeforeId(ungroupedGroupIds, dragged, workspaceId, event.clientY > rect.top + rect.height / 2);
									setWorkspaceDragId(void 0);
									setWorkspaceDropTarget(void 0);
									if (beforeId === null) return;
									if (groupedIds.has(dragged)) setWorkspaceGroups((current) => assignWorkspaceToGroup(current, dragged));
									run("workspace-order", () => insertWorkspaceBefore(dragged, beforeId));
								},
								children: renderGroup(workspace, "projects")
							}, workspaceId);
						})
					})]
				});
			};
			const treeRef = (0, react.useRef)(null);
			useSectionDisclosureMotion(treeRef);
			const sorting = workspaceDragId !== void 0 || workspaceGroupDragId !== void 0 || sessionDrag !== void 0;
			(0, react.useLayoutEffect)(() => {
				if (!wide || !sorting || treeRef.current === null) return;
				return mountWorkspaceDropIndicator(treeRef.current);
			}, [wide, sorting]);
			(0, react.useEffect)(() => {
				const current = selectedId;
				if (current === void 0 || lastRevealedSessionIdRef.current === current) return;
				const tree = {
					workspaces: workspaces.items.map((item) => ({
						workspaceId: String(item.workspaceId),
						sessionIds: item.sessionIds.map((id) => String(id))
					})),
					pinnedWorkspaceIds,
					groups: workspaceGroups.map((group) => ({
						id: group.id,
						workspaceIds: group.workspaceIds
					})),
					recentIds
				};
				if (!(tree.workspaces.some((item) => item.sessionIds.includes(current)) || tree.recentIds.includes(current))) return;
				lastRevealedSessionIdRef.current = current;
				pendingRevealScrollRef.current = true;
				setExpanded((currentExpanded) => expandedForCurrentSession(currentExpanded, current, tree));
			}, [
				pinnedWorkspaceIds,
				recentIds,
				selectedId,
				workspaceGroups,
				workspaces.items
			]);
			(0, react.useLayoutEffect)(() => {
				if (!pendingRevealScrollRef.current) return;
				pendingRevealScrollRef.current = false;
				treeRef.current?.querySelector(".dcu-wb-session.dcu-wb-selected")?.scrollIntoView?.({ block: "nearest" });
			}, [expanded]);
			if (!wide) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dcu-wb dcu-wb-rail",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: stylesheet$4 })
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-wb",
				"aria-label": t("workspace.label"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("style", { children: [
						stylesheet$4,
						runningStyles,
						typographyStyles,
						collectionLayoutStyles
					] }),
					preferencesFailure !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-error",
						role: "status",
						children: [t("workspace.preferencesLocalOnly"), businessRequestErrorKey(preferencesFailure) !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" ", userErrorText(preferencesFailure, t)] })]
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-wb-error",
						role: "alert",
						children: t("sessions.failed", { message: error })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						ref: treeRef,
						className: "dcu-wb-tree",
						role: "tree",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dcu-wb-section",
								"aria-label": t("workspace.pinned"),
								"data-pin-drag": pinDragActive || void 0,
								onDragOver: (event) => {
									if (!pinDragActive) return;
									event.preventDefault();
									event.dataTransfer.dropEffect = "move";
									if (pinnedGroups.length === 0 || event.target === event.currentTarget || event.target instanceof Element && event.target.closest(".dcu-wb-section-head") !== null) {
										const firstId = pinnedGroupIds[0];
										const beforeId = firstId === void 0 ? void 0 : reorderDropBeforeId(pinnedGroupIds, workspaceDragId, firstId, false);
										setWorkspaceDropTarget(beforeId === null ? void 0 : {
											zone: "pinned",
											beforeId
										});
									}
								},
								onDrop: (event) => {
									event.preventDefault();
									const draggedWorkspace = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									const target = workspaceDropTargetRef.current;
									setWorkspaceDragId(void 0);
									setWorkspaceDropTarget(void 0);
									const drop = resolvePinnedSectionDrop(draggedWorkspace, target, pinnedGroups.length === 0);
									if (drop !== void 0) pinWorkspaceAt(drop.id, drop.beforeId);
								},
								onDragLeave: (event) => {
									if (!(event.relatedTarget instanceof Node) || event.currentTarget.contains(event.relatedTarget)) return;
									setWorkspaceDropTarget(void 0);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-wb-section-head",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dcu-wb-section-label",
										"aria-expanded": sectionOpen("pinned"),
										onClick: () => {
											toggleSection("pinned");
										},
										children: [t("workspace.pinned"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dcu-wb-section-caret",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												width: "12",
												height: "12",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
													d: "M6.25 4.25 10.25 8 6.25 11.75",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round",
													strokeLinejoin: "round"
												})
											})
										})]
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-wb-section-body",
									"data-open": sectionOpen("pinned"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dcu-wb-pinned-list",
										children: [
											pinDragActive && pinnedGroups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: `dcu-wb-pin-start${pinnedHeaderDrop?.kind === "empty" ? " dcu-wb-drop" : ""}`,
												onDragOver: (event) => {
													event.preventDefault();
													event.stopPropagation();
													event.dataTransfer.dropEffect = "move";
													setWorkspaceDropTarget({
														zone: "pinned",
														beforeId: void 0
													});
												},
												onDrop: (event) => {
													event.preventDefault();
													event.stopPropagation();
													const draggedWorkspace = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
													setWorkspaceDragId(void 0);
													setWorkspaceDropTarget(void 0);
													if (draggedWorkspace !== void 0) pinWorkspaceAt(draggedWorkspace);
												}
											}),
											pinnedGroups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dcu-wb-empty",
												onDragOver: (event) => {
													if (!pinDragActive) return;
													event.preventDefault();
													event.stopPropagation();
													event.dataTransfer.dropEffect = "move";
													setWorkspaceDropTarget({
														zone: "pinned",
														beforeId: void 0
													});
												},
												onDrop: (event) => {
													event.preventDefault();
													event.stopPropagation();
													const draggedWorkspace = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
													setWorkspaceDragId(void 0);
													setWorkspaceDropTarget(void 0);
													if (draggedWorkspace !== void 0) pinWorkspaceAt(draggedWorkspace);
												},
												children: t("workspace.pinnedEmpty")
											}),
											pinnedGroups.map((workspace) => renderGroup(workspace, "pinned")),
											pinDragActive && pinnedGroups.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: `dcu-wb-pin-end${workspaceDropTarget?.zone === "pinned" && workspaceDropTarget.beforeId === void 0 ? " dcu-wb-drop" : ""}`,
												onDragOver: (event) => {
													if (!pinDragActive) return;
													event.preventDefault();
													event.stopPropagation();
													event.dataTransfer.dropEffect = "move";
													const lastId = pinnedGroupIds[pinnedGroupIds.length - 1];
													if (lastId === void 0 || workspaceDragId === void 0) return;
													const beforeId = reorderDropBeforeId(pinnedGroupIds, workspaceDragId, lastId, true);
													setWorkspaceDropTarget(beforeId === null ? void 0 : {
														zone: "pinned",
														beforeId
													});
												}
											})
										]
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dcu-wb-section",
								"aria-label": t("workspace.projects"),
								onDropCapture: (event) => {
									const dragged = readWorkspaceDrag(event.dataTransfer, workspaceDragId);
									if (dragged !== void 0 && projectPinned(dragged)) setPinnedWorkspaceIds((ids) => ids.filter((id) => id !== dragged));
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-wb-section-head",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dcu-wb-section-label",
										ref: projectsSectionButtonRef,
										"aria-expanded": sectionOpen("projects"),
										onClick: () => {
											toggleSection("projects");
										},
										children: [t("workspace.projects"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dcu-wb-section-caret",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												width: "12",
												height: "12",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
													d: "M6.25 4.25 10.25 8 6.25 11.75",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round",
													strokeLinejoin: "round"
												})
											})
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dcu-wb-actions",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dcu-wb-more",
											"aria-label": t("workspace.createGroup"),
											title: t("workspace.createGroup"),
											onClick: (event) => {
												event.stopPropagation();
												setGroupTitleDraft("");
												setError(void 0);
												setCreateGroupOpen(true);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CreateGroupIcon, {})
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dcu-wb-more",
											"aria-label": t("workspace.add"),
											title: t("workspace.add"),
											"aria-keyshortcuts": addWorkspaceShortcutAria,
											disabled: requestAddWorkspace === void 0,
											onClick: (event) => {
												event.stopPropagation();
												triggerAddWorkspace();
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AddWorkspaceIcon, {})
										})]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-wb-section-body",
									"data-open": sectionOpen("projects"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dcu-wb-collections",
										children: [
											workspaceGroups.map(renderWorkspaceCollection),
											workspaceGroups.length > 0 && renderUngroupedCollection(),
											workspaceGroups.length === 0 && ungroupedGroups.map((workspace) => renderGroup(workspace, "projects")),
											workspaceGroups.length === 0 && ungroupedGroups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dcu-wb-empty",
												children: t("workspace.empty")
											})
										]
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dcu-wb-section",
								"aria-label": t("workspace.recent"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-wb-section-head",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dcu-wb-section-label",
										"aria-expanded": sectionOpen("recent"),
										onClick: () => {
											toggleSection("recent");
										},
										children: [t("workspace.recent"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dcu-wb-section-caret",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												width: "12",
												height: "12",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
													d: "M6.25 4.25 10.25 8 6.25 11.75",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round",
													strokeLinejoin: "round"
												})
											})
										})]
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-wb-section-body",
									"data-open": sectionOpen("recent"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [recentIds.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-wb-empty",
										children: t("workspace.recentEmpty")
									}), recentIds.map((id) => {
										const session = sessions.byId[id];
										if (session === void 0) return null;
										const title = session.displayTitle;
										const unread = rowUnread(id);
										const pendingInteraction = pendingInteractionForSession(id, pendingInteractions, legacyPendingInteraction(session));
										return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRow, {
											id,
											title,
											selected: selectedId === id,
											menuOpen: menu?.type === "session" && menu.id === id,
											unread,
											running: rowRunning(id, session),
											pendingInteraction,
											t,
											menuItems: sessionMenu(id, session.cwd),
											draggable: true,
											onDragStart: (event) => {
												event.stopPropagation();
												setWorkspaceDragId(void 0);
												setWorkspaceDropTarget(void 0);
												setWorkspaceGroupDragId(void 0);
												setWorkspaceGroupDropTarget(void 0);
												writeSessionDrag(event.dataTransfer, id, title);
												setDragPreview(event.dataTransfer, title);
												setSessionDrag({
													sessionId: id,
													workspaceId: ""
												});
											},
											onDragEnd: () => {
												setSessionDrag(void 0);
												setSessionDropTarget(void 0);
												setWorkspaceDropTarget(void 0);
												setWorkspaceGroupDropTarget(void 0);
											},
											menuPoint: menu?.type === "session" && menu.id === id && menu.x !== void 0 && menu.y !== void 0 ? {
												x: menu.x,
												y: menu.y
											} : void 0,
											onOpen: () => {
												if (openSession(id) !== false) setUnreadSessionIds((ids) => ids.filter((item) => item !== id));
											},
											onMenuChange: (open) => {
												setMenu(open ? {
													id,
													type: "session"
												} : void 0);
											},
											onArchive: () => {
												run("archive", () => archiveSession(id));
											},
											onHover: (event) => {
												const box = hoverCardAnchor(event.currentTarget.getBoundingClientRect());
												showTip({
													kind: "session",
													id,
													title,
													time: formatHoverTime(session.updatedAt, t, now),
													left: box.left,
													top: box.top
												});
											},
											onLeave: hideTip,
											onContextMenu: (event) => {
												event.preventDefault();
												event.stopPropagation();
												dismissTip();
												setMenu({
													id,
													type: "session",
													x: event.clientX,
													y: event.clientY
												});
											},
											onSelectAction: (action) => {
												if (busy !== void 0 || runSessionMoveAction(action, id)) return;
												if (action === "rename") beginRename("session", id, title);
												if (action === "unread") {
													setUnreadSessionIds((ids) => toggleSessionId(ids, id));
													setMenu(void 0);
												}
												if (action === "archive") run("archive", () => archiveSession(id));
												if (action === "delete") {
													setDeleteTarget({
														id,
														kind: "session",
														title
													});
													setError(void 0);
													setMenu(void 0);
												}
												if (action === "fork") run("fork", () => forkSession(id));
												if (action === "openPath" && session.cwd !== void 0) openPathImmediately(session.cwd);
												if (action === "copyPath") copy(session.cwd);
												if (action === "copyTitle") copy(title);
												if (action === "copyId") copy(id);
											}
										}, id);
									})] })
								})]
							})
						]
					}),
					headerMenu !== void 0 && sessions.byId[headerMenu.id] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open: true,
						onClose: () => {
							setHeaderMenu(void 0);
						},
						items: sessionMenu(headerMenu.id, sessions.byId[headerMenu.id].cwd ?? groups.items.find((item) => item.visibleIds.includes(headerMenu.id))?.path),
						onSelect: (action) => {
							const id = headerMenu.id;
							const session = sessions.byId[id];
							if (session === void 0 || busy !== void 0 || runSessionMoveAction(action, id)) return;
							const path = session.cwd ?? groups.items.find((item) => item.visibleIds.includes(id))?.path;
							if (action === "rename") beginRename("session", id, session.displayTitle);
							if (action === "unread") setUnreadSessionIds((ids) => toggleSessionId(ids, id));
							if (action === "archive") run("archive", () => archiveSession(id));
							if (action === "delete") {
								setDeleteTarget({
									id,
									kind: "session",
									title: session.displayTitle
								});
								setError(void 0);
							}
							if (action === "fork") run("fork", () => forkSession(id));
							if (action === "openPath" && path !== void 0) openPathImmediately(path);
							if (action === "copyPath") copy(path);
							if (action === "copyTitle") copy(session.displayTitle);
							if (action === "copyId") copy(id);
							setHeaderMenu(void 0);
						},
						portal: true,
						dense: true,
						side: "bottom",
						align: "start",
						getAnchorRect: () => headerMenu.getRect(),
						anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceHoverCard, {
						t,
						onEditWorkspace: (id, title) => {
							beginRename("workspace", id, title);
						},
						onToggleWorkspacePin: (id) => {
							setPinnedWorkspaceIds((ids) => togglePinnedWorkspace(ids, id));
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: renameGroupId !== void 0,
						onClose: closeRenameGroup,
						closeLabel: t("sessions.close"),
						title: t("workspace.renameGroup"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								onClick: closeRenameGroup,
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: renameGroupDraft.trim() === "",
								onClick: submitRenameGroup,
								children: t("sessions.save")
							})]
						}),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "dcu-workspace-group-name",
								children: t("workspace.groupName")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "dcu-workspace-group-name",
								className: "dcu-wb-rename-input",
								"aria-label": t("workspace.groupName"),
								maxLength: 80,
								value: renameGroupDraft,
								autoFocus: true,
								onFocus: (event) => {
									event.target.select();
								},
								onChange: (event) => {
									setRenameGroupDraft(event.target.value);
									setRenameGroupError(void 0);
								},
								onKeyDown: (event) => {
									if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
										event.preventDefault();
										submitRenameGroup();
									}
								}
							}),
							renameGroupError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "alert",
								children: t("sessions.failed", { message: renameGroupError })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: createGroupOpen,
						onClose: () => {
							setCreateGroupOpen(false);
							setGroupTitleDraft("");
							setError(void 0);
						},
						closeLabel: t("sessions.close"),
						title: t("workspace.createGroup"),
						description: t("workspace.createGroupDescription"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								onClick: () => {
									setCreateGroupOpen(false);
									setGroupTitleDraft("");
									setError(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: groupTitleDraft.trim() === "",
								onClick: submitCreateGroup,
								children: t("sessions.save")
							})]
						}),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "dcu-wb-rename-input",
							"aria-label": t("workspace.groupName"),
							value: groupTitleDraft,
							autoFocus: true,
							onChange: (event) => {
								setGroupTitleDraft(event.target.value);
								setError(void 0);
							},
							onKeyDown: (event) => {
								if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
									event.preventDefault();
									submitCreateGroup();
								}
							}
						}), error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-wb-error",
							role: "alert",
							children: t("sessions.failed", { message: error })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteGroupId !== void 0,
						onClose: () => {
							setDeleteGroupId(void 0);
						},
						closeLabel: t("sessions.close"),
						title: t("workspace.deleteGroup", { name: workspaceGroups.find((group) => group.id === deleteGroupId)?.title ?? "" }),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								onClick: () => {
									setDeleteGroupId(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								className: "dcu-wb-delete-button",
								onClick: () => {
									if (deleteGroupId !== void 0) setWorkspaceGroups((current) => deleteWorkspaceGroup(current, deleteGroupId));
									setDeleteGroupId(void 0);
								},
								children: t("workspace.deleteGroupAction")
							})]
						}),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dcu-wb-delete-copy",
							children: t("workspace.deleteGroupDescription")
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: renameTarget !== void 0,
						onClose: () => {
							setRenameTarget(void 0);
							setError(void 0);
						},
						closeLabel: t("sessions.close"),
						title: renameTarget?.kind === "workspace" ? t("workspace.rename") : t("sessions.rename"),
						description: t("sessions.renameDescription"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								onClick: () => {
									setRenameTarget(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: busy !== void 0 || renameDraft.trim() === "",
								onClick: submitRename,
								children: t("sessions.save")
							})]
						}),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "dcu-wb-rename-input",
							"aria-label": renameTarget?.kind === "workspace" ? t("workspace.rename") : t("sessions.rename"),
							value: renameDraft,
							autoFocus: true,
							onFocus: (event) => {
								event.target.select();
							},
							onChange: (event) => {
								setRenameDraft(event.target.value);
								setError(void 0);
							},
							onKeyDown: (event) => {
								if (event.key === "Enter") submitRename();
							}
						}), error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-wb-error",
							role: "alert",
							children: t("sessions.failed", { message: error })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: archiveWorkspaceTarget !== void 0,
						onClose: () => {
							if (busy !== "archive-workspace") {
								setArchiveWorkspaceTarget(void 0);
								setError(void 0);
							}
						},
						closeLabel: t("sessions.close"),
						title: t("workspace.archiveTitle", { count: archiveWorkspaceTarget?.sessionIds.length ?? 0 }),
						description: archiveWorkspaceTarget === void 0 ? void 0 : t("workspace.archiveDescription", { name: archiveWorkspaceTarget.title }),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								disabled: busy === "archive-workspace",
								onClick: () => {
									setArchiveWorkspaceTarget(void 0);
									setError(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: busy === "archive-workspace",
								onClick: submitArchiveWorkspace,
								children: t("workspace.archiveConfirm")
							})]
						}),
						children: [busy === "archive-workspace" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-wb-error",
							role: "status",
							children: t("workspace.archivePending")
						}), error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-wb-error",
							role: "alert",
							children: t("sessions.failed", { message: error })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: sessionMoveTarget !== void 0,
						onClose: () => {
							if (busy !== "session-move") {
								setSessionMoveTarget(void 0);
								setError(void 0);
							}
						},
						closeLabel: t("sessions.close"),
						title: t("sessions.moveConfirmTitle", { project: sessionMoveTarget?.targetWorkspaceTitle ?? "" }),
						description: sessionMoveTarget === void 0 ? void 0 : t("sessions.moveConfirmDescription", { name: sessionMoveTarget.sessionTitle }),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								disabled: busy === "session-move",
								onClick: () => {
									setSessionMoveTarget(void 0);
									setError(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: busy === "session-move",
								onClick: submitSessionMove,
								children: t("sessions.moveConfirmAction")
							})]
						}),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-wb-move-target",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderCloseMedium, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-wb-move-target-copy",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-wb-move-project",
										children: sessionMoveTarget?.targetWorkspaceTitle
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-wb-move-path",
										children: sessionMoveTarget?.targetPath
									})]
								})]
							}),
							busy === "session-move" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "status",
								children: t("sessions.movePending")
							}),
							error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "alert",
								children: t("sessions.failed", { message: error })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteTarget !== void 0,
						onClose: () => {
							if (busy !== "delete-workspace" && busy !== "delete-session") {
								setDeleteTarget(void 0);
								setError(void 0);
							}
						},
						closeLabel: t("sessions.close"),
						title: deleteTarget?.kind === "session" ? t("sessions.delete") : t("workspace.delete"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								disabled: busy === "delete-workspace" || busy === "delete-session",
								onClick: () => {
									setDeleteTarget(void 0);
									setError(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								className: "dcu-wb-delete-button",
								disabled: busy === "delete-workspace" || busy === "delete-session",
								onClick: submitDelete,
								children: deleteTarget?.kind === "session" ? t("sessions.delete") : t("workspace.delete")
							})]
						}),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dcu-wb-delete-copy",
								children: deleteTarget === void 0 ? "" : deleteTarget.kind === "session" ? t("sessions.deleteDescription", { name: deleteTarget.title }) : t("workspace.deleteDescription", { name: deleteTarget.title })
							}),
							busy === "delete-workspace" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "status",
								children: t("workspace.deletePending")
							}),
							busy === "delete-session" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "status",
								children: t("sessions.deletePending")
							}),
							error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "alert",
								children: t("sessions.failed", { message: error })
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/session-row-actions.tsx
		function storage() {
			return browserStorage();
		}
		/** 频道/定时共用的本地未读标记。 */
		function useSessionFlags(current) {
			const [unreadSessionIds, setUnreadSessionIds] = (0, react.useState)(() => readSessionIds(storage(), SESSION_UNREAD_STORAGE_KEY));
			(0, react.useEffect)(() => {
				writeSessionIds(storage(), SESSION_UNREAD_STORAGE_KEY, unreadSessionIds);
			}, [unreadSessionIds]);
			(0, react.useEffect)(() => {
				if (current !== void 0) setUnreadSessionIds((ids) => ids.filter((id) => id !== current));
			}, [current]);
			return {
				unreadSessionIds,
				setUnreadSessionIds
			};
		}
		function SessionHoverCardLayer() {
			const tip = useHoverValue();
			const { keepTip, hideTip } = useHoverDispatch();
			if (tip === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionHoverCard, {
				tip,
				onEnter: keepTip,
				onLeave: hideTip
			});
		}
		function useBusyAction(t, onSuccess) {
			const [busy, setBusy] = (0, react.useState)();
			const [error, setError] = (0, react.useState)();
			const busyRef = (0, react.useRef)();
			const run = async (key, action) => {
				if (busyRef.current !== void 0) return;
				busyRef.current = key;
				setBusy(key);
				setError(void 0);
				try {
					await action();
					onSuccess?.();
				} catch (reason) {
					setError(userErrorText(reason, t));
				} finally {
					busyRef.current = void 0;
					setBusy(void 0);
				}
			};
			return {
				busy,
				error,
				setError,
				run
			};
		}
		/** 频道/定时共用的重命名、删除对话框与菜单动作分派。 */
		function useSessionDialogs(actions, flags, run, closeMenu) {
			const [renameTarget, setRenameTarget] = (0, react.useState)();
			const [deleteTarget, setDeleteTarget] = (0, react.useState)();
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const submitRename = () => {
				if (renameTarget === void 0 || renameDraft.trim() === "") return;
				run("rename", async () => {
					await actions.renameSession(renameTarget.id, renameDraft.trim());
					setRenameTarget(void 0);
				});
			};
			const submitDelete = () => {
				if (deleteTarget === void 0) return;
				const target = deleteTarget;
				run("delete", async () => {
					await actions.deleteSession(target.id);
					flags.setUnreadSessionIds((ids) => ids.filter((id) => id !== target.id));
					setDeleteTarget(void 0);
				});
			};
			const handleAction = (action, id, title) => {
				if (action === "rename") {
					setRenameTarget({
						id,
						title
					});
					setRenameDraft(title);
					closeMenu();
				}
				if (action === "unread") {
					flags.setUnreadSessionIds((ids) => toggleSessionId(ids, id));
					closeMenu();
				}
				if (action === "archive") run("archive", () => actions.archiveSession(id));
				if (action === "delete") {
					setDeleteTarget({
						id,
						title
					});
					closeMenu();
				}
				if (action === "fork") run("fork", () => actions.forkSession(id));
				if (action === "copyTitle") run("copy", async () => {
					await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(title);
				});
				if (action === "copyId") run("copy", async () => {
					await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(id);
				});
			};
			return {
				renameTarget,
				deleteTarget,
				renameDraft,
				setRenameDraft,
				setRenameTarget,
				setDeleteTarget,
				submitRename,
				submitDelete,
				handleAction
			};
		}
		function SessionModals({ t, busy, error, renameTarget, deleteTarget, renameDraft, setRenameDraft, setRenameTarget, setDeleteTarget, setError, submitRename, submitDelete }) {
			const deleting = busy === "delete";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: renameTarget !== void 0,
				onClose: () => {
					setRenameTarget(void 0);
					setError(void 0);
				},
				closeLabel: t("sessions.close"),
				title: t("sessions.rename"),
				description: t("sessions.renameDescription"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dcu-wb-rename-actions",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						onClick: () => {
							setRenameTarget(void 0);
						},
						children: t("sessions.cancel")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						disabled: busy !== void 0 || renameDraft.trim() === "",
						onClick: submitRename,
						children: t("sessions.save")
					})]
				}),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					className: "dcu-wb-rename-input",
					"aria-label": t("sessions.rename"),
					value: renameDraft,
					autoFocus: true,
					onFocus: (event) => {
						event.target.select();
					},
					onChange: (event) => {
						setRenameDraft(event.target.value);
						setError(void 0);
					},
					onKeyDown: (event) => {
						if (event.key === "Enter") submitRename();
					}
				}), error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-wb-error",
					role: "alert",
					children: t("sessions.failed", { message: error })
				})]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: deleteTarget !== void 0,
				onClose: () => {
					if (!deleting) {
						setDeleteTarget(void 0);
						setError(void 0);
					}
				},
				closeLabel: t("sessions.close"),
				title: t("sessions.delete"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dcu-wb-rename-actions",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						disabled: deleting,
						onClick: () => {
							setDeleteTarget(void 0);
							setError(void 0);
						},
						children: t("sessions.cancel")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						className: "dcu-wb-delete-button",
						disabled: deleting,
						onClick: submitDelete,
						children: t("sessions.delete")
					})]
				}),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dcu-wb-delete-copy",
						children: deleteTarget === void 0 ? "" : t("sessions.deleteDescription", { name: deleteTarget.title })
					}),
					deleting && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-wb-error",
						role: "status",
						children: t("sessions.deletePending")
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-wb-error",
						role: "alert",
						children: t("sessions.failed", { message: error })
					})
				]
			})] });
		}
		//#endregion
		//#region src/client/schedule-group-actions.ts
		/** 尝试归档整组并保留逐项结果，避免首个失败让后续会话永远不执行。 */
		async function archiveScheduleGroup(sessionIds, archiveSession) {
			const archivedIds = [];
			const failedIds = [];
			for (const sessionId of sessionIds) try {
				await archiveSession(sessionId);
				archivedIds.push(sessionId);
			} catch {
				failedIds.push(sessionId);
			}
			return {
				archivedIds,
				failedIds
			};
		}
		//#endregion
		//#region src/client/ScheduleBrowser.tsx
		function ScheduleClock() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fill: "currentColor",
					d: "M8 1.15A6.85 6.85 0 1 0 8 14.85 6.85 6.85 0 0 0 8 1.15Zm0 1.4a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Z"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fill: "currentColor",
					d: "M8.62 4.35H7.28v4.2l3.02 1.78.67-1.13-2.35-1.39V4.35Z"
				})]
			});
		}
		function ScheduleBrowser(props) {
			const [menu, setMenu] = (0, react.useState)();
			const [view, setView] = (0, react.useState)("runs");
			const viewTabs = (0, react.useMemo)(() => [{
				value: "runs",
				id: "dcu-schedule-tab-runs",
				panelId: "dcu-schedule-panel-runs",
				label: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 5,
						whiteSpace: "nowrap"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFlatListOutlineMedium, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.t("sidebar.runsTab") })]
				})
			}, {
				value: "overview",
				id: "dcu-schedule-tab-overview",
				panelId: "dcu-schedule-panel-overview",
				label: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 5,
						whiteSpace: "nowrap"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconWorkspaceTreeOutlineMedium, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.t("sidebar.overviewTab") })]
				})
			}], [props.t]);
			if (props.overviewContent === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverShell, {
				blocked: menu !== void 0,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleBrowserTree, {
					...props,
					menu,
					setMenu
				})
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-schedule-browser",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-schedule-views",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SegmentedTabs, {
						className: "dcu-schedule-segmented-tabs",
						label: props.t("sidebar.scheduleTab"),
						value: view,
						onChange: (next) => {
							setMenu(void 0);
							setView(next);
						},
						items: viewTabs
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-schedule-pane",
					children: view === "runs" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverShell, {
						blocked: menu !== void 0,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleBrowserTree, {
							...props,
							menu,
							setMenu
						})
					}) : props.overviewContent
				})]
			});
		}
		function ScheduleBrowserTree({ openSession, archiveSession, deleteSession, forkSession, moveSession, renameSession, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces, t, canDeleteSession, panelActive = false, openTaskSettings, menu, setMenu }) {
			const sessions = useSessions((state) => state);
			const now = useSharedNow();
			const pendingInteractions = useHostPendingInteractions(useSessionPendingInteraction, useSessionStatus);
			const sessionStatus = useHostSessionStatus(useSessionStatus);
			const selectedId = visibleSelectedSessionId(sessions, panelActive);
			const workspaces = useWorkspaces((state) => state);
			const [expanded, setExpanded] = (0, react.useState)(() => readTreeExpansionState(browserStorage(), SCHEDULE_EXPANSION_STORAGE_KEY));
			const [groupMenu, setGroupMenu] = (0, react.useState)();
			const [archiveGroupTarget, setArchiveGroupTarget] = (0, react.useState)();
			const flags = useSessionFlags(selectedId);
			const { showTip, hideTip, dismissTip } = useHoverDispatch();
			const { busy, error, setError, run } = useBusyAction(t, () => {
				setMenu(void 0);
			});
			const dialogs = useSessionDialogs({
				archiveSession,
				deleteSession,
				forkSession,
				renameSession
			}, flags, run, () => {
				setMenu(void 0);
				setError(void 0);
			});
			const groupMenuItems = [
				{
					id: "task-settings",
					label: t("schedule.taskSettings"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSettingsOutlineMedium, { size: 16 })
				},
				{
					type: "separator",
					id: "group-separator"
				},
				{
					id: "archive-group",
					label: t("schedule.archiveGroup"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArchiveOutlineMedium, { size: 16 }),
					danger: true
				}
			];
			(0, react.useEffect)(() => {
				writeTreeExpansionState(browserStorage(), SCHEDULE_EXPANSION_STORAGE_KEY, expanded);
			}, [expanded]);
			const groups = (0, react.useMemo)(() => {
				const archived = new Set(workspaces.archivedSessionIds ?? []);
				return groupScheduleSessions((sessions.ids ?? Object.keys(sessions.byId)).flatMap((id) => {
					const session = sessions.byId[id];
					if (session === void 0 || archived.has(id) || session.blank === true || session.origin === "im" || session.origin === "subagent" || isChannelSession(id)) return [];
					return [{
						id,
						title: session.displayTitle ?? session.title ?? id,
						updatedAt: session.updatedAt,
						running: session.running === true
					}];
				}), t("meta.locale"));
			}, [
				sessions.byId,
				sessions.ids,
				t,
				workspaces.archivedSessionIds
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-wb",
				"aria-label": t("sidebar.scheduleTab"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: WORKSPACE_TREE_STYLE }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-wb-tree",
						role: "tree",
						children: [
							error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "alert",
								children: error
							}),
							groups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-empty",
								children: t("schedule.empty")
							}),
							groups.map((group) => {
								const isExpanded = expanded[group.id] ?? true;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-wb-project",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupHead, {
										expanded: isExpanded,
										title: group.label,
										icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleClock, {}),
										menuOpen: groupMenu === group.id,
										onToggle: () => {
											setExpanded((current) => ({
												...current,
												[group.id]: !isExpanded
											}));
										},
										actions: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
											open: groupMenu === group.id,
											onClose: () => {
												setGroupMenu(void 0);
											},
											items: groupMenuItems,
											onSelect: (action) => {
												setGroupMenu(void 0);
												if (action === "task-settings") {
													setMenu(void 0);
													openTaskSettings?.({
														name: group.label,
														sessionIds: group.sessions.map((session) => session.id)
													});
												}
												if (action === "archive-group") {
													setError(void 0);
													setArchiveGroupTarget({
														id: group.id,
														label: group.label,
														sessionIds: group.sessions.map((session) => session.id)
													});
												}
											},
											portal: true,
											dense: true,
											anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dcu-wb-more",
												"aria-label": t("schedule.groupActions", { name: group.label }),
												onClick: (event) => {
													event.stopPropagation();
													setMenu(void 0);
													setGroupMenu((current) => current === group.id ? void 0 : group.id);
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutlineMedium, { size: 16 })
											})
										})
									}), isExpanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-wb-project-body",
										children: group.sessions.map((session) => {
											const id = session.id;
											const title = session.title;
											const selected = selectedId === id;
											const status = sessionStatus.get(id);
											const unread = sessionRowUnread(flags.unreadSessionIds.includes(id), status, selected);
											const pendingInteraction = pendingInteractionForSession(id, pendingInteractions, sessions.byId[id]?.pendingInteraction);
											const moveTargets = moveSession === void 0 ? void 0 : sessionMoveTargets(workspaces.items ?? [], id).map((target) => ({
												...target,
												id: moveSessionActionId(target.id)
											}));
											const canDelete = canDeleteSession?.() === true;
											return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRow, {
												id,
												title,
												selected,
												menuOpen: menu?.id === id,
												unread,
												running: sessionIsRunning(sessions.byId[id], status),
												pendingInteraction,
												time: session.updatedAt === void 0 ? void 0 : formatCompactTime(session.updatedAt, t, now),
												t,
												menuItems: sessionMenuItems(t, {
													unread,
													moveTargets,
													canDelete
												}),
												menuPoint: menu?.id === id && menu.x !== void 0 && menu.y !== void 0 ? {
													x: menu.x,
													y: menu.y
												} : void 0,
												onOpen: () => {
													if (openSession(id) !== false) flags.setUnreadSessionIds((ids) => ids.filter((item) => item !== id));
												},
												onMenuChange: (open) => {
													setMenu(open ? { id } : void 0);
												},
												onArchive: () => {
													run("archive", () => archiveSession(id));
												},
												onHover: (event) => {
													const box = hoverCardAnchor(event.currentTarget.getBoundingClientRect());
													showTip({
														title,
														project: group.label,
														time: session.updatedAt === void 0 ? void 0 : formatHoverTime(session.updatedAt, t, now),
														left: box.left,
														top: box.top
													});
												},
												onLeave: hideTip,
												onContextMenu: (event) => {
													event.preventDefault();
													event.stopPropagation();
													dismissTip();
													setMenu({
														id,
														x: event.clientX,
														y: event.clientY
													});
												},
												onSelectAction: (action) => {
													if (busy !== void 0) return;
													const targetWorkspaceId = parseMoveSessionActionId(action);
													if (targetWorkspaceId !== void 0 && moveSession !== void 0) {
														setMenu(void 0);
														run("session-move", () => moveSession(id, targetWorkspaceId));
														return;
													}
													dialogs.handleAction(action, id, title);
												}
											}, id);
										})
									})]
								}, group.id);
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionHoverCardLayer, {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionModals, {
						t,
						busy,
						error,
						...dialogs,
						setError
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: archiveGroupTarget !== void 0,
						onClose: () => {
							if (busy !== "archive-group") {
								setArchiveGroupTarget(void 0);
								setError(void 0);
							}
						},
						closeLabel: t("sessions.close"),
						title: t("schedule.archiveGroup"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-wb-rename-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								disabled: busy === "archive-group",
								onClick: () => {
									setArchiveGroupTarget(void 0);
									setError(void 0);
								},
								children: t("sessions.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								className: "dcu-wb-delete-button",
								disabled: busy === "archive-group",
								onClick: () => {
									if (archiveGroupTarget === void 0) return;
									const target = archiveGroupTarget;
									run("archive-group", async () => {
										const result = await archiveScheduleGroup(target.sessionIds, (id) => archiveSession(id));
										flags.setUnreadSessionIds((ids) => ids.filter((id) => !result.archivedIds.includes(id)));
										if (result.failedIds.length > 0) {
											setArchiveGroupTarget({
												...target,
												sessionIds: result.failedIds
											});
											throw new UserFacingError(t("schedule.archiveGroupPartial", {
												archived: result.archivedIds.length,
												failed: result.failedIds.length
											}));
										}
										setArchiveGroupTarget(void 0);
									});
								},
								children: t("schedule.archiveGroupConfirm")
							})]
						}),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dcu-wb-delete-copy",
								children: archiveGroupTarget === void 0 ? "" : t("schedule.archiveGroupDescription", {
									name: archiveGroupTarget.label,
									count: archiveGroupTarget.sessionIds.length
								})
							}),
							busy === "archive-group" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "status",
								children: t("schedule.archiveGroupPending")
							}),
							error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-wb-error",
								role: "alert",
								children: t("sessions.failed", { message: error })
							})
						]
					})
				]
			});
		}
		const SIDEBAR_MOTION_EASING = "cubic-bezier(.4,0,.2,1)";
		const visibleSidebarWidths = /* @__PURE__ */ new WeakMap();
		/**
		* 已经跑过一次自动调宽的容器。首帧必须无动画，之后每一次开合都要走 CSS 过渡。
		* 不能拿 data-dcu-codex-sidebar-initialized 当判据：收起分支从不写这个标记，
		* 于是「启动即折叠」或「先折叠过」的窗口在展开时会被误判成首次绘制，动画被永久关掉。
		*/
		const primedSidebarFrames = /* @__PURE__ */ new WeakSet();
		const hostSidebarSnapshots = /* @__PURE__ */ new WeakMap();
		/** 会话顶栏用它把宿主发布的窗口 chrome 安全区换算回窄轨之外的左内边距。 */
		const SIDEBAR_RAIL_WIDTH_VAR = "--dcu-sidebar-rail-width";
		/** 值不变时不再重写 style，避免与宿主重绘叠加时反复触发 style 监听。 */
		function writeSidebarRailWidth(frame, width) {
			const value = `${width}px`;
			if (frame.style.getPropertyValue(SIDEBAR_RAIL_WIDTH_VAR) !== value) frame.style.setProperty(SIDEBAR_RAIL_WIDTH_VAR, value);
		}
		/**
		* 窄轨补偿变量必须与列轨动画同源：折叠态列宽就是窄轨宽度，展开态列宽是整块面板、补偿为 0。
		* 从列轨字符串推导而不是记录历史值，否则拖拽期间的临时写入会让两者在动画首帧失步、标题瞬跳。
		*/
		function railWidthOfTracks(tracks) {
			const width = parseSidebarGrid(tracks)?.sidebar ?? 0;
			return width <= 48 ? width : 0;
		}
		/** 我们最近一次写进 frame 的稳定列轨字符串，作为开合动画的插值起点。 */
		const appliedSidebarTracks = /* @__PURE__ */ new WeakMap();
		const gridMotions = /* @__PURE__ */ new WeakMap();
		const handleMotions = /* @__PURE__ */ new WeakMap();
		const cornerMotions = /* @__PURE__ */ new WeakMap();
		/** 工作区（白卡）左上角圆角：展开态是直角（与面板拼接），折叠态是 16px。 */
		const CONTENT_CORNER_PX = 16;
		/** 打给「最右侧可见列」的标记：样式表据此画窗口外角（右栏内容自绘白底，border-radius 裁不出来）。 */
		const OUTER_CORNER_ATTRIBUTE = "data-dcu-outer-corner";
		/**
		* 工作区左上圆角必须和列宽同步插值，否则观感是「边界先平移过去，直角边上再补一个圆角」。
		* 起止值按方向取定（而不是读当时的 computed）：宿主可能立刻写 data-sidebar-collapsed，
		* 那样 computed 一上来就是终值，动画会被自己压平。结束时写 inline 终值，保证
		* 标记晚到（宿主延迟加 data-sidebar-collapsed）也不会在动画末尾闪一下。
		*/
		function playCornerMotion(frame, collapsed) {
			const corner = frame.querySelector("[class$=\"_centerCol\"]");
			if (corner === null) return;
			const to = collapsed ? CONTENT_CORNER_PX : 0;
			cornerMotions.get(corner)?.cancel();
			if (typeof corner.animate !== "function" || prefersReducedMotion(frame)) {
				corner.style.borderTopLeftRadius = `${to}px`;
				return;
			}
			try {
				const motion = corner.animate([{ borderTopLeftRadius: `${collapsed ? 0 : CONTENT_CORNER_PX}px` }, { borderTopLeftRadius: `${to}px` }], {
					duration: 300,
					easing: SIDEBAR_MOTION_EASING
				});
				motion.onfinish = () => {
					corner.style.borderTopLeftRadius = `${to}px`;
					motion.cancel();
				};
				cornerMotions.set(corner, motion);
			} catch {
				corner.style.borderTopLeftRadius = `${to}px`;
			}
		}
		function prefersReducedMotion(frame) {
			return frame.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
		}
		/** 工作区各列（中列 + 可展开的右栏：工作区文件/终端/浏览器等分页）。 */
		const WORKSPACE_COLUMNS = "[class$=\"_centerCol\"],[class$=\"_rightbarCol\"],[class$=\"_detailsCol\"]";
		/**
		* 窗口外角的圆角必须挂在「最右侧可见列」上，列与列之间的交界一律直角。
		* 之前把 16px 直接钉在中列右上角，于是右栏（浏览器/终端等分页）一展开、
		* 中列右边界左移，圆角就跟着对话区一起跑，而窗口外角反而是直角。
		* 判定用 details 轨道而不是几何：列宽有 300ms 过渡，刚展开时右栏实测宽度还是 0，
		* 按宽度过滤会把右栏跳过、圆角继续留在对话区上。
		*/
		function syncColumnCorners(frame) {
			const center = frame.querySelector("[class$=\"_centerCol\"]");
			const side = frame.querySelector("[class$=\"_rightbarCol\"],[class$=\"_detailsCol\"]");
			if (center === null && side === null) return;
			const details = parseSidebarGrid(frame.style.gridTemplateColumns)?.details;
			const parsed = details === void 0 ? NaN : Number.parseFloat(details);
			const sideVisible = side !== null && (Number.isFinite(parsed) ? parsed > .5 : side.getBoundingClientRect().width > 1);
			if (center !== null) {
				const radius = sideVisible ? "0px" : `${CONTENT_CORNER_PX}px`;
				if (center.style.borderTopRightRadius !== radius) center.style.borderTopRightRadius = radius;
				center.removeAttribute(OUTER_CORNER_ATTRIBUTE);
			}
			if (side !== null) {
				if (sideVisible) side.setAttribute(OUTER_CORNER_ATTRIBUTE, "");
				else side.removeAttribute(OUTER_CORNER_ATTRIBUTE);
				side.style.removeProperty("border-top-right-radius");
				side.style.removeProperty("border-top-left-radius");
			}
		}
		/** 列宽过渡结束后再校准一次，防止宿主用自己的节奏把 details 轨道写晚。 */
		const cornerSyncTimers = /* @__PURE__ */ new WeakMap();
		function scheduleColumnCornerSync(frame) {
			syncColumnCorners(frame);
			const view = frame.ownerDocument.defaultView;
			if (view === null) return;
			const previous = cornerSyncTimers.get(frame);
			if (previous !== void 0) view.clearTimeout(previous);
			cornerSyncTimers.set(frame, view.setTimeout(() => {
				cornerSyncTimers.delete(frame);
				if (frame.isConnected) syncColumnCorners(frame);
			}, 360));
		}
		/**
		* 用 Web Animations API 显式补出「边界线左右平移」：列宽、窄轨补偿变量与拖拽柄一起插值。
		* 即使宿主 CSS 覆盖了 transition（transition-property 里根本没有列宽），这段动画也照常播放；
		* 动画结束后回落到 inline style 的终值，与 CSS transition 同曲线时两者完全一致，不会叠加抖动。
		*/
		function playColumnMotion(frame, from, to, railFrom, railTo) {
			if (from === to || typeof frame.animate !== "function" || prefersReducedMotion(frame)) return;
			gridMotions.get(frame)?.cancel();
			const options = {
				duration: 300,
				easing: SIDEBAR_MOTION_EASING
			};
			try {
				gridMotions.set(frame, frame.animate([{
					gridTemplateColumns: from,
					[SIDEBAR_RAIL_WIDTH_VAR]: `${railFrom}px`
				}, {
					gridTemplateColumns: to,
					[SIDEBAR_RAIL_WIDTH_VAR]: `${railTo}px`
				}], options));
			} catch {
				gridMotions.set(frame, frame.animate([{ gridTemplateColumns: from }, { gridTemplateColumns: to }], options));
			}
			const handle = frame.querySelector("[data-side=\"sidebar\"]");
			if (handle !== null && typeof handle.animate === "function") {
				handleMotions.get(handle)?.cancel();
				const fromWidth = `${parseSidebarGrid(from)?.sidebar ?? 0}px`;
				const toWidth = `${parseSidebarGrid(to)?.sidebar ?? 0}px`;
				try {
					handleMotions.set(handle, handle.animate([{ left: fromWidth }, { left: toWidth }], options));
				} catch {}
			}
		}
		/** 记下插件改写前的宿主列宽。已经带初始化标记的列宽是本插件留下的，不能当成宿主原值。 */
		function rememberHostSidebar(frame) {
			if (hostSidebarSnapshots.has(frame) || frame.hasAttribute("data-dcu-codex-sidebar-initialized")) return;
			const handle = frame.querySelector("[data-side=\"sidebar\"]");
			hostSidebarSnapshots.set(frame, {
				grid: frame.style.gridTemplateColumns,
				handleLeft: handle?.style.left ?? "",
				windowsWidth: frame.style.getPropertyValue("--dsh-windows-sidebar-width")
			});
		}
		/** 停用或卸载时撤回列宽、拖拽柄和初始化标记，让官方侧栏按宿主宽度重排。 */
		function restoreHostSidebar(frame) {
			gridMotions.get(frame)?.cancel();
			const handle = frame.querySelector("[data-side=\"sidebar\"]");
			if (handle !== null) handleMotions.get(handle)?.cancel();
			const corner = frame.querySelector("[class$=\"_centerCol\"]");
			if (corner !== null) {
				cornerMotions.get(corner)?.cancel();
				corner.style.removeProperty("border-top-left-radius");
			}
			for (const column of frame.querySelectorAll(WORKSPACE_COLUMNS)) {
				column.style.removeProperty("border-top-left-radius");
				column.style.removeProperty("border-top-right-radius");
				column.removeAttribute(OUTER_CORNER_ATTRIBUTE);
			}
			frame.removeAttribute("data-dcu-codex-sidebar-initialized");
			frame.style.removeProperty("--dcu-sidebar-expanded-width");
			frame.style.removeProperty(SIDEBAR_RAIL_WIDTH_VAR);
			const html = frame.ownerDocument.documentElement;
			const tracks = parseSidebarGrid(frame.style.gridTemplateColumns);
			if (frame.hasAttribute("data-sidebar-collapsed")) {
				if ((html.hasAttribute("data-windows-titlebar") || html.dataset.platform === "darwin") && tracks?.sidebar === 48) {
					frame.style.gridTemplateColumns = `0px ${tracks.middle} ${tracks.details}`;
					if (html.hasAttribute("data-windows-titlebar")) frame.style.setProperty("--dsh-windows-sidebar-width", "0px");
				}
				return;
			}
			const snapshot = hostSidebarSnapshots.get(frame);
			if (snapshot !== void 0) {
				frame.style.gridTemplateColumns = snapshot.grid;
				if (handle !== null) {
					if (snapshot.handleLeft === "") handle.style.removeProperty("left");
					else handle.style.left = snapshot.handleLeft;
				}
				if (snapshot.windowsWidth === "") frame.style.removeProperty("--dsh-windows-sidebar-width");
				else frame.style.setProperty("--dsh-windows-sidebar-width", snapshot.windowsWidth);
				return;
			}
			if (tracks?.sidebar === 340) {
				frame.style.gridTemplateColumns = `280px ${tracks.middle} ${tracks.details}`;
				if (handle !== null) handle.style.left = "280px";
			}
		}
		/** 解析宿主 AppFrame 的 grid-template-columns。 */
		function parseSidebarGrid(value) {
			const match = /^(\d+(?:\.\d+)?)px\s+(minmax\(\d+(?:px)?,\s*1fr\))\s+(minmax\(0(?:px)?,\s*\d+(?:\.\d+)?px\)|\d+(?:\.\d+)?px)$/.exec(value.trim());
			if (match === null) return void 0;
			return {
				sidebar: Number(match[1]),
				middle: match[2],
				details: match[3]
			};
		}
		function findSidebarFrame(root) {
			const marked = root.querySelector("[data-sidebar-collapsed]");
			if (marked !== null) return marked;
			for (const node of root.querySelectorAll("div")) if (parseSidebarGrid(node.style.gridTemplateColumns) !== void 0) return node;
		}
		/** Settings is portaled to body, so explicitly carry over the expanded width. */
		function settingsSidebarWidth(root) {
			const frame = findSidebarFrame(root);
			const expanded = Number.parseFloat(frame?.style.getPropertyValue("--dcu-sidebar-expanded-width") ?? "");
			if (Number.isFinite(expanded) && expanded >= 240) return expanded;
			const width = frame === void 0 ? void 0 : parseSidebarGrid(frame.style.gridTemplateColumns)?.sidebar;
			return width !== void 0 && width >= 240 ? width : 340;
		}
		/** 同步侧栏网格和拖拽柄，保证两者始终使用同一个可见宽度。 */
		function applySidebarWidth(frame, width) {
			const tracks = parseSidebarGrid(frame.style.gridTemplateColumns);
			if (tracks === void 0 || frame.hasAttribute("data-sidebar-collapsed")) return false;
			visibleSidebarWidths.set(frame, width);
			writeSidebarRailWidth(frame, 0);
			const next = `${width}px ${tracks.middle} ${tracks.details}`;
			const changed = frame.style.gridTemplateColumns !== next;
			if (changed) frame.style.gridTemplateColumns = next;
			appliedSidebarTracks.set(frame, next);
			const contentWidth = `${width}px`;
			if (frame.style.getPropertyValue("--dcu-sidebar-expanded-width") !== contentWidth) frame.style.setProperty("--dcu-sidebar-expanded-width", contentWidth);
			if (frame.ownerDocument.documentElement.hasAttribute("data-windows-titlebar") && frame.style.getPropertyValue("--dsh-windows-sidebar-width") !== contentWidth) frame.style.setProperty("--dsh-windows-sidebar-width", contentWidth);
			const handle = frame.querySelector("[data-side=\"sidebar\"]");
			if (handle !== null && handle.style.left !== contentWidth) handle.style.left = contentWidth;
			return changed;
		}
		/** 自动宽度调整与初始化过渡共用前置条件；手动拖拽不受此限制。 */
		function canApplySlimSidebar(frame) {
			return !frame.hasAttribute("data-dragging") && parseSidebarGrid(frame.style.gridTemplateColumns) !== void 0;
		}
		function applySlimSidebar(frame) {
			if (!canApplySlimSidebar(frame)) return false;
			if (frame.hasAttribute("data-sidebar-collapsed")) {
				const tracks = parseSidebarGrid(frame.style.gridTemplateColumns);
				const next = `48px ${tracks.middle} ${tracks.details}`;
				const changed = frame.style.gridTemplateColumns !== next;
				if (changed) frame.style.gridTemplateColumns = next;
				appliedSidebarTracks.set(frame, next);
				writeSidebarRailWidth(frame, 48);
				if (frame.ownerDocument.documentElement.hasAttribute("data-windows-titlebar") && frame.style.getPropertyValue("--dsh-windows-sidebar-width") !== `48px`) frame.style.setProperty("--dsh-windows-sidebar-width", `48px`);
				return changed;
			}
			const initialized = frame.hasAttribute("data-dcu-codex-sidebar-initialized");
			const changed = applySidebarWidth(frame, initialized ? visibleSidebarWidths.get(frame) ?? 340 : 340);
			if (!initialized) frame.setAttribute("data-dcu-codex-sidebar-initialized", "");
			return changed;
		}
		/** 仅在首帧覆盖宿主默认宽度时关闭过渡，避免刷新出现收缩动画。 */
		function pauseInitialSidebarTransition(frame) {
			const handle = frame.querySelector("[data-side=\"sidebar\"]");
			const frameTransition = frame.style.transition;
			const handleTransition = handle?.style.transition;
			frame.style.transition = "none";
			if (handle !== null) handle.style.transition = "none";
			return () => {
				frame.style.transition = frameTransition;
				if (handle !== null && handleTransition !== void 0) handle.style.transition = handleTransition;
			};
		}
		function observeSlimSidebar() {
			if (typeof document === "undefined" || document.body === null) return () => {};
			let applying = false;
			let frame;
			let pending;
			let frameObserver;
			const watchFrame = (next) => {
				if (frame === next) return;
				frameObserver?.disconnect();
				frame = next;
				if (frame === void 0) return;
				frameObserver = new MutationObserver(apply);
				frameObserver.observe(frame, {
					attributes: true,
					attributeFilter: [
						"style",
						"data-sidebar-collapsed",
						"data-dragging",
						"data-dcu-codex-sidebar-initialized"
					]
				});
			};
			const apply = () => {
				if (applying) return;
				applying = true;
				try {
					if (frame === void 0 || !frame.isConnected) watchFrame(findSidebarFrame(document));
					if (frame === void 0) return;
					rememberHostSidebar(frame);
					const firstTouch = !primedSidebarFrames.has(frame);
					const restoreTransition = firstTouch ? pauseInitialSidebarTransition(frame) : void 0;
					const tracksBefore = appliedSidebarTracks.get(frame);
					let changed = false;
					if (!canApplySlimSidebar(frame)) {
						const rail = frame.hasAttribute("data-sidebar-collapsed") ? parseSidebarGrid(frame.style.gridTemplateColumns)?.sidebar ?? 0 : 0;
						writeSidebarRailWidth(frame, rail);
					} else if (frame.hasAttribute("data-sidebar-collapsed")) changed = applySlimSidebar(frame);
					else changed = applySlimSidebar(frame);
					primedSidebarFrames.add(frame);
					scheduleColumnCornerSync(frame);
					if (changed && !firstTouch) {
						const tracksAfter = appliedSidebarTracks.get(frame);
						if (tracksBefore !== void 0 && tracksAfter !== void 0) {
							playColumnMotion(frame, tracksBefore, tracksAfter, railWidthOfTracks(tracksBefore), railWidthOfTracks(tracksAfter));
							if (parseSidebarGrid(tracksBefore)?.sidebar !== parseSidebarGrid(tracksAfter)?.sidebar) playCornerMotion(frame, frame.hasAttribute("data-sidebar-collapsed"));
						}
					}
					if (restoreTransition !== void 0) {
						if (!changed) restoreTransition();
						else window.requestAnimationFrame(() => window.requestAnimationFrame(restoreTransition));
					}
				} finally {
					applying = false;
				}
			};
			const schedule = () => {
				if (pending !== void 0) return;
				pending = window.requestAnimationFrame(() => {
					pending = void 0;
					apply();
				});
			};
			apply();
			const observer = new MutationObserver(() => {
				if (frame === void 0 || !frame.isConnected) schedule();
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				frameObserver?.disconnect();
				if (pending !== void 0) window.cancelAnimationFrame(pending);
				if (frame !== void 0) restoreHostSidebar(frame);
			};
		}
		//#endregion
		//#region src/client/sidebar-drag.ts
		/** Codex: min(520px, 100vw - 320px)。 */
		const SIDEBAR_MAX_PX = 520;
		/** 左移超过开始宽度的一半时收起侧栏，避免轻微拖动误触。 */
		function shouldCollapseOnSidebarDrag(startWidth, startX, endX) {
			return startX - endX > startWidth / 2;
		}
		/** 直接按可见宽度计算拖拽结果，绕开宿主与 Codex 不一致的最小宽度。 */
		function sidebarWidthDuringDrag(startWidth, startX, currentX) {
			const viewportCap = typeof window === "undefined" ? SIDEBAR_MAX_PX : Math.min(SIDEBAR_MAX_PX, window.innerWidth - 320);
			return Math.min(Math.max(240, viewportCap), Math.max(240, startWidth + currentX - startX));
		}
		function isSidebarDragHandle(target) {
			if (target === null || typeof target !== "object" || !("closest" in target)) return false;
			const handle = target.closest("[data-side=\"sidebar\"]");
			return handle !== null && String(handle.className).includes("handle");
		}
		//#endregion
		//#region src/client/automation-task-settings.ts
		const AUTOMATION_TASK_SETTINGS_EVENT = "dsh-automation:open-task-settings";
		const AUTOMATION_TASK_SETTINGS_STORAGE_KEY = "dsh-automation:pending-task-settings";
		function parseAutomationTaskSettingsRequest(value) {
			if (value === null || typeof value !== "object") return void 0;
			const record = value;
			if (typeof record.name !== "string" || record.name.trim() === "" || !Array.isArray(record.sessionIds) || record.sessionIds.some((id) => typeof id !== "string" || id === "")) return void 0;
			if (record.automationId !== void 0 && (typeof record.automationId !== "string" || record.automationId.trim() === "")) return void 0;
			return {
				...typeof record.automationId === "string" ? { automationId: record.automationId } : {},
				name: record.name,
				sessionIds: [...record.sessionIds]
			};
		}
		/** 定时设置页可能切换分区后才挂载：先保存一次性请求，再通知已挂载实例。 */
		function requestAutomationTaskSettings(request) {
			if (typeof window === "undefined") return;
			const validated = parseAutomationTaskSettingsRequest(request);
			if (validated === void 0) return;
			try {
				window.sessionStorage.setItem(AUTOMATION_TASK_SETTINGS_STORAGE_KEY, JSON.stringify(validated));
			} catch {}
			window.dispatchEvent(new CustomEvent(AUTOMATION_TASK_SETTINGS_EVENT, { detail: validated }));
		}
		function clearAutomationTaskSettingsRequest() {
			if (typeof window === "undefined") return;
			try {
				window.sessionStorage.removeItem(AUTOMATION_TASK_SETTINGS_STORAGE_KEY);
			} catch {}
		}
		//#endregion
		//#region src/client/new-conversation-style.ts
		/** 新建页底部输入布局；保留宿主节点、插槽与 active 会话底部信息。 */
		const NEW_CONVERSATION_STYLE = `
[data-phase=hero]:has([data-conversation-scroll]){container:dcu-new-conversation / inline-size}
[data-phase=hero] [data-conversation-scroll][class]{--dsh-composer-side-clearance:16px;justify-content:flex-start;scrollbar-gutter:stable both-edges}
[data-phase=hero] [data-composer-seat]{flex:1 0 auto;min-height:100%}
[data-phase=hero] [data-composer-seat]>:has([class*="_composerHero"]){display:flex;flex:1;flex-direction:column}
[data-phase=hero] [class*="_composerHero"]{box-sizing:border-box;flex:1;width:100%;max-width:none;min-width:0;margin-inline:auto;gap:0;padding-bottom:32px}
[data-phase=hero] [class*="_composerHero"]>:first-child{box-sizing:border-box;flex:1;width:100%;max-width:768px;align-self:center;height:auto;min-height:340px;align-items:center;padding:32px 28px}
[data-phase=hero] [class*="_composerHero"]>:first-child>[class$="_stack"]{width:100%;max-width:none;min-width:0;align-items:center;gap:32px}
[data-phase=hero] [class*="_composerHero"] [class$="_headline"]{flex-direction:column;flex-wrap:nowrap;gap:16px}
[data-phase=hero] [class*="_composerHero"] [class$="_titleGroup"]{display:none}
[data-phase=hero] [class*="_composerHero"] [class$="_fishHitbox"]{width:56px;height:56px}
[data-phase=hero] [class*="_composerHero"] [class$="_fishHitbox"] svg{width:56px;height:auto;color:#DDDDDD}
[data-phase=hero] [class*="_heroWorkspaceRow"]{box-sizing:border-box;flex:none;width:min(calc(var(--dsh-composer-card-max-width) + 2 * var(--dsh-composer-side-clearance) - 56px),calc(100% - 56px));align-self:center;justify-content:flex-start;flex-wrap:wrap;gap:8px;min-height:48px;margin:0 28px -10px;padding:6px 12px 16px;border-radius:18px 18px 0 0;background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,var(--dsw-alias-bg-base))}
[data-phase=hero] [class*="_heroWorkspaceRow"]>[class$="_workspace"]{min-width:0;max-width:100%;font-weight:400}
.dcu-hero-question{margin:0;max-width:100%;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:28px;font-weight:500;line-height:36px;text-align:center;text-wrap:balance;overflow-wrap:anywhere}
.dcu-hero-workspace{appearance:none;display:inline;margin:0;padding:0;border:none;background:none;color:inherit;font:inherit;letter-spacing:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;text-decoration-color:color-mix(in srgb,currentColor 35%,transparent);cursor:pointer;border-radius:6px;transition:color 120ms}
.dcu-hero-workspace:hover{color:#6A6B6D;text-decoration-color:currentColor}
.dcu-hero-workspace:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:3px}
[data-phase=hero] [class*="_heroWorkspaceRow"]>[class$="_workspace"][data-dcu-proxy]{background:transparent}
@media(prefers-reduced-motion:reduce){.dcu-hero-workspace{transition:none}}
@container dcu-new-conversation (width < 640px){
  [data-phase=hero] [class*="_composerHero"]>:first-child{padding:32px 24px;min-height:420px}
}
`;
		//#endregion
		//#region src/client/composer-tool-menus.ts
		/** 只适配由输入区工具触发的菜单；保留原条目、选择回调及目录创建流程。 */
		const TOOL = "[class*=\"_heroWorkspaceRow\"] button,[data-composer-card] button[aria-haspopup],[data-composer-card] button[aria-expanded]";
		const MENU = "[role=\"menu\"],[role=\"listbox\"]";
		const COMPOSER_TOOL_MENU_STYLE = `
[class*="_heroWorkspaceRow"] button{min-height:28px;border-radius:999px;font-size:13px;line-height:20px}
[class*="_heroWorkspaceRow"] button:hover,[class*="_heroWorkspaceRow"] button[aria-expanded=true]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]){box-sizing:border-box;max-height:var(--dcu-tool-menu-height,360px)!important;padding:5px!important;border-radius:16px!important;background:#fff!important;color:var(--dsw-alias-label-primary);box-shadow:0 8px 32px #0002,0 0 0 1px #0000000a!important;display:flex;flex-direction:column;gap:0;z-index:1100}
/* 原生菜单保留宿主宽度约束；Git 弹窗沿用独立尺寸，避免观察器标记前后跳变。 */
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover])[data-gitgraph-popover]{min-width:0!important;width:262px;max-width:calc(100vw - 24px)}
:is([data-dcu-tool-menu=inline],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]:not([data-dcu-tool-menu=portal]))[data-gitgraph-popover]{width:320px}
[data-dcu-tool-menu=portal]{position:fixed!important;left:var(--dcu-tool-menu-x)!important;top:var(--dcu-tool-menu-y)!important;bottom:auto!important;right:auto!important}
:is([data-dcu-tool-menu=inline],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]:not([data-dcu-tool-menu=portal])){translate:var(--dcu-tool-menu-shift,0px) 0}
[class*="_heroWorkspaceRow"] [data-gitgraph-popover]:not([data-dcu-tool-menu=portal]){top:auto!important;bottom:calc(100% + 4px)!important}
body[data-ds-dark-theme] :is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]){background:#1c1c1c!important;box-shadow:0 8px 32px #0003,0 0 0 1px #ffffff08!important}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover])>[class*="_viewport"]{min-height:0;max-height:none;overflow-y:auto;scrollbar-width:thin}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) :is([role=menuitem],[role=menuitemradio],[role=menuitemcheckbox],[role=option]){box-sizing:border-box;min-height:28px;padding:4px 9px;gap:8px;border-radius:8px;font-size:13px;line-height:20px}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) :is([role=menuitem],[role=menuitemradio],[role=option]):hover:not(:disabled),:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) [class*="_selected"],:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) [aria-selected=true],:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) [aria-checked=true]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent)}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) [class*="_itemIcon"] svg{width:16px;height:16px}
:is([data-dcu-tool-menu],[class*="_heroWorkspaceRow"] [data-gitgraph-popover]) [class*="_footer"]{flex:none;margin-top:5px;padding-top:5px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent)}
[data-dcu-tool-filter]{box-sizing:border-box;flex:none;width:100%;height:32px;padding:4px 10px;margin:0 0 1px;border:0;border-radius:8px;outline:none;background:transparent;color:inherit;font:13px/20px var(--dsw-font-family)}
[data-dcu-tool-filter]:focus-visible{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-label-primary) 20%,transparent)}
[data-dcu-tool-empty]{padding:8px 10px;font-size:13px;color:var(--dsw-alias-label-secondary)}
[data-dcu-tool-filtered]{display:none!important}
/* 建议菜单单独换肤：外框跟随宿主输入区，保留宿主定位和动态高度，不给内部列表套固定宽度。 */
[data-conversation-scroll] [data-trigger-menu]{box-sizing:border-box;left:0;right:0;width:auto;min-width:0;max-width:none;padding:5px;border-radius:16px;background:#fff;box-shadow:0 8px 32px #0002,0 0 0 1px #0000000a}
body[data-ds-dark-theme] [data-conversation-scroll] [data-trigger-menu]{background:#1c1c1c;box-shadow:0 8px 32px #0003,0 0 0 1px #ffffff08}
[data-conversation-scroll] [data-trigger-menu]>[role=listbox]{box-sizing:border-box;width:100%;min-width:0;align-self:stretch;scrollbar-width:thin}
[data-conversation-scroll] [data-trigger-menu] [role=option]{box-sizing:border-box;width:100%;min-width:0;min-height:28px;padding:4px 9px;gap:8px;border-radius:8px;font-size:13px;line-height:20px}
[data-conversation-scroll] [data-trigger-menu] [role=option][aria-selected=true]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent)}
`;
		function observeComposerToolMenus(copy) {
			let anchor;
			let known = /* @__PURE__ */ new Set();
			let pendingUntil = 0;
			const mounted = /* @__PURE__ */ new Map();
			const now = () => Date.now();
			function capture(event) {
				const target = event.target instanceof Element ? event.target.closest(TOOL) : null;
				if (target === null || target.closest("[data-conversation-scroll]") === null) return;
				anchor = target;
				known = new Set(document.querySelectorAll(MENU));
				pendingUntil = now() + 1e3;
			}
			function mount(menu, trigger) {
				const portal = getComputedStyle(menu).position === "fixed";
				menu.setAttribute("data-dcu-tool-menu", portal ? "portal" : "inline");
				const isProject = trigger.matches("[class*=\"_heroWorkspaceRow\"]>button:first-child");
				const viewport = menu.querySelector(":scope>[class*=\"_viewport\"]");
				let input;
				let empty;
				if (isProject && viewport !== null && menu.querySelector("input") === null) {
					input = document.createElement("input");
					input.type = "search";
					input.placeholder = copy.search;
					input.setAttribute("aria-label", copy.search);
					input.setAttribute("data-dcu-tool-filter", "");
					empty = document.createElement("div");
					empty.setAttribute("data-dcu-tool-empty", "");
					empty.setAttribute("role", "status");
					empty.textContent = copy.empty;
					empty.hidden = true;
					menu.prepend(input);
					viewport.after(empty);
					input.addEventListener("input", () => {
						const query = input.value.trim().toLocaleLowerCase();
						let count = 0;
						for (const row of viewport.children) {
							const match = (row.textContent ?? "").toLocaleLowerCase().includes(query);
							row.toggleAttribute("data-dcu-tool-filtered", !match);
							if (match) count++;
						}
						empty.hidden = count > 0;
						place();
					});
					input.addEventListener("keydown", (event) => {
						if (event.key !== "ArrowDown" && event.key !== "Enter") return;
						const first = viewport.querySelector(":scope>:not([data-dcu-tool-filtered]) button:not(:disabled)");
						if (first !== null) {
							event.preventDefault();
							event.stopPropagation();
							first.focus();
							if (event.key === "Enter") first.click();
						}
					});
				}
				function place() {
					if (!trigger.isConnected || !menu.isConnected) return;
					const rect = trigger.getBoundingClientRect();
					const above = rect.top - 16;
					const below = window.innerHeight - rect.bottom - 16;
					const topSide = above >= Math.min(260, below);
					menu.style.setProperty("--dcu-tool-menu-height", `${Math.max(60, Math.min(360, topSide ? above : below))}px`);
					if (!portal) {
						const previous = parseFloat(menu.style.getPropertyValue("--dcu-tool-menu-shift")) || 0;
						const bounds = menu.getBoundingClientRect();
						const naturalLeft = bounds.left - previous;
						const left = Math.max(12, Math.min(naturalLeft, window.innerWidth - bounds.width - 12));
						menu.style.setProperty("--dcu-tool-menu-shift", `${left - naturalLeft}px`);
						return;
					}
					const bounds = menu.getBoundingClientRect();
					const x = Math.max(12, Math.min(rect.left, window.innerWidth - bounds.width - 12));
					const y = Math.max(12, topSide ? rect.top - bounds.height - 4 : rect.bottom + 4);
					menu.style.setProperty("--dcu-tool-menu-x", `${x}px`);
					menu.style.setProperty("--dcu-tool-menu-y", `${y}px`);
				}
				const resize = new ResizeObserver(place);
				resize.observe(menu);
				resize.observe(trigger);
				window.addEventListener("resize", place);
				window.addEventListener("scroll", place, true);
				place();
				mounted.set(menu, () => {
					resize.disconnect();
					window.removeEventListener("resize", place);
					window.removeEventListener("scroll", place, true);
					input?.remove();
					empty?.remove();
					menu.querySelectorAll("[data-dcu-tool-filtered]").forEach((row) => row.removeAttribute("data-dcu-tool-filtered"));
					menu.removeAttribute("data-dcu-tool-menu");
					for (const property of [
						"--dcu-tool-menu-x",
						"--dcu-tool-menu-y",
						"--dcu-tool-menu-height",
						"--dcu-tool-menu-shift"
					]) menu.style.removeProperty(property);
				});
			}
			let syncFrame;
			function syncNow() {
				syncFrame = void 0;
				for (const [menu, dispose] of mounted) if (!menu.isConnected) {
					dispose();
					mounted.delete(menu);
				}
				if (anchor === void 0 || now() > pendingUntil) return;
				for (const menu of document.querySelectorAll(MENU)) {
					if (menu.closest("[data-trigger-menu]") !== null) continue;
					if (menu.matches("[data-dcu-model-card]")) continue;
					if (menu.querySelector(":scope>[class*=\"_cell\"]") !== null) continue;
					if (known.has(menu) || mounted.has(menu) || menu.parentElement?.closest(MENU) !== null) continue;
					if (menu.getClientRects().length === 0) continue;
					mount(menu, anchor);
					pendingUntil = 0;
					break;
				}
			}
			function scheduleSync() {
				if (anchor === void 0 || now() > pendingUntil) {
					for (const [menu, dispose] of mounted) if (!menu.isConnected) {
						dispose();
						mounted.delete(menu);
					}
					return;
				}
				if (syncFrame !== void 0) return;
				syncFrame = window.requestAnimationFrame(syncNow);
			}
			const observer = new MutationObserver(scheduleSync);
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			document.addEventListener("pointerdown", capture, true);
			document.addEventListener("keydown", captureKey, true);
			function captureKey(event) {
				if ([
					"Enter",
					" ",
					"ArrowDown"
				].includes(event.key)) capture(event);
			}
			return () => {
				if (syncFrame !== void 0) window.cancelAnimationFrame(syncFrame);
				observer.disconnect();
				document.removeEventListener("pointerdown", capture, true);
				document.removeEventListener("keydown", captureKey, true);
				mounted.forEach((dispose) => dispose());
				mounted.clear();
			};
		}
		//#endregion
		//#region src/client/full-access-accent.ts
		/** Codex 会把"完全权限"工具标签染成品牌橙 #E25507；宿主文案由权限预设包渲染，
		*  容器和标签层级随版本变化，因此按可见文本精确识别后打标，样式用 !important 压过宿主文字色。 */
		const FULL_ACCESS_LABELS = /* @__PURE__ */ new Set(["完全权限", "Full access"]);
		/** 权限控件可能是 button、[role=button] 或带 aria-haspopup 的容器，全部纳入候选。 */
		const CANDIDATE = ":is([aria-haspopup],[aria-expanded],[role=button]),button";
		const COMPOSER_AREA = "[class*=\"_heroWorkspaceRow\"],[data-composer-card]";
		const FULL_ACCESS_ACCENT_STYLE = `
[data-dcu-full-access]{color:#E25507!important}
[data-dcu-full-access] *{color:#E25507!important}
`;
		function isFullAccess(element) {
			return FULL_ACCESS_LABELS.has((element.textContent ?? "").replace(/\s+/g, ""));
		}
		function observeFullAccessAccent() {
			let frame;
			const scan = () => {
				frame = void 0;
				for (const element of document.querySelectorAll(CANDIDATE)) element.toggleAttribute("data-dcu-full-access", isFullAccess(element));
			};
			const schedule = () => {
				if (frame === void 0) frame = window.requestAnimationFrame(scan);
			};
			/** 只扫描输入区工具条附近的变化；流式输出的消息节点被过滤掉，不额外占用主线程。 */
			function touchesComposer(records) {
				for (const record of records) {
					const element = record.target instanceof Element ? record.target : record.target.parentElement;
					if (element === null) continue;
					if (element.closest(COMPOSER_AREA) !== null) return true;
					if (record.addedNodes.length === 0) continue;
					if (element.querySelector(":is([aria-haspopup],[aria-expanded])") !== null) return true;
				}
				return false;
			}
			const observer = new MutationObserver((records) => {
				if (touchesComposer(records)) schedule();
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true
			});
			document.addEventListener("pointerdown", schedule, true);
			document.addEventListener("keydown", schedule, true);
			scan();
			return () => {
				observer.disconnect();
				document.removeEventListener("pointerdown", schedule, true);
				document.removeEventListener("keydown", schedule, true);
				if (frame !== void 0) {
					window.cancelAnimationFrame(frame);
					frame = void 0;
				}
				document.querySelectorAll("[data-dcu-full-access]").forEach((el) => el.removeAttribute("data-dcu-full-access"));
			};
		}
		//#endregion
		//#region src/client/DesktopNavigationControls.tsx
		const DESKTOP_NAVIGATION_CONTROLS_STYLE = `
.dcu-desktop-navigation{display:none}
html[data-windows-titlebar] .dcu-desktop-navigation{display:flex;position:fixed;left:12px;top:calc((var(--dsh-windows-titlebar-height,40px) - 28px)/2);gap:8px;z-index:30;-webkit-app-region:no-drag}
.dcu-desktop-navigation button{appearance:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;-webkit-app-region:no-drag}
.dcu-desktop-navigation button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dcu-desktop-navigation button:disabled{opacity:.35;cursor:default}
.dcu-desktop-navigation button:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
html[data-windows-titlebar]:not([data-fullscreen]):not(:has(.dcu-settings-page)):has(.dcu-desktop-navigation){--dsh-windows-menu-start:84px}
/* 折叠键入列标题栏（←/→ 与 应用 菜单之间，Codex/VS Code 同款）时菜单再让出一格 */
html[data-windows-titlebar]:not([data-fullscreen]):not(:has(.dcu-settings-page)):has(.dcu-desktop-navigation[data-collapse]){--dsh-windows-menu-start:120px}
html[data-windows-titlebar][data-fullscreen] .dcu-desktop-navigation{display:none}
`;
		function DesktopNavigationControls({ history, t, collapse }) {
			const state = (0, react.useSyncExternalStore)(history.subscribe, history.getSnapshot, history.getSnapshot);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-desktop-navigation",
				"data-collapse": collapse !== void 0 ? "" : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: DESKTOP_NAVIGATION_CONTROLS_STYLE }),
					["back", "forward"].map((direction) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": t(`navigation.${direction}`),
						title: t(`navigation.${direction}`),
						disabled: direction === "back" ? !state.canBack : !state.canForward,
						onClick: history[direction],
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
							width: "16",
							height: "16",
							viewBox: "0 0 16 16",
							fill: "none",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: direction === "back" ? "M13 8H3m0 0 4-4M3 8l4 4" : "M3 8h10m0 0-4-4m4 4-4 4",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round"
							})
						})
					}, direction)),
					collapse && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": collapse.label,
						title: collapse.label,
						onClick: collapse.run,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelLeft, {
							size: 16,
							strokeWidth: 1.6,
							"aria-hidden": "true"
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/sidebar-session.ts
		/** 先切回任务页签再创建，避免新建后仍停在频道或日程。支持同步与异步返回值。 */
		function beginSidebarSession(setTab, startSession, workspaceId) {
			setTab("tasks");
			return workspaceId === void 0 ? startSession() : startSession(workspaceId);
		}
		//#endregion
		//#region src/client/WorkspaceShortcutBridge.tsx
		function WorkspaceShortcutBridge({ source, openSearch, startSession, renderDirectoryFlow, t }) {
			const { searchRequest, addRequested, bindings } = (0, react.useSyncExternalStore)(source.subscribe, source.getSnapshot, source.getSnapshot);
			const seenSearch = (0, react.useRef)(searchRequest);
			const openSearchRef = (0, react.useRef)(openSearch);
			openSearchRef.current = openSearch;
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)();
			const mounted = (0, react.useRef)(true);
			const pending = (0, react.useRef)(false);
			const pickedPath = (0, react.useRef)(void 0);
			const currentBindings = (0, react.useRef)(bindings);
			currentBindings.current = bindings;
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				pending.current = false;
				pickedPath.current = void 0;
				setBusy(false);
				setError(void 0);
			}, [bindings]);
			(0, react.useEffect)(() => {
				if (searchRequest === seenSearch.current) return;
				seenSearch.current = searchRequest;
				bindings?.closeAddWorkspace();
				openSearchRef.current();
			}, [searchRequest, bindings]);
			(0, react.useEffect)(() => {
				bindings?.setDirectoryBusy(addRequested || busy || error !== void 0);
				return () => {
					bindings?.setDirectoryBusy(false);
				};
			}, [
				bindings,
				addRequested,
				busy,
				error
			]);
			const fail = (message) => {
				bindings?.closeAddWorkspace();
				setError(message);
			};
			const isCurrent = () => mounted.current && source.getSnapshot().bindings === bindings && currentBindings.current === bindings;
			const pick = (path) => {
				if (!bindings || pending.current) return;
				pickedPath.current = path;
				pending.current = true;
				setError(void 0);
				setBusy(true);
				bindings.createWorkspace({ path }).then((workspace) => {
					if (!isCurrent()) return;
					bindings.closeAddWorkspace();
					startSession(workspace.workspaceId);
				}).catch((reason) => {
					if (isCurrent()) fail(reason instanceof Error ? reason.message : String(reason));
				}).finally(() => {
					if (isCurrent()) {
						pending.current = false;
						setBusy(false);
					}
				});
			};
			const chooseAgain = () => {
				setError(void 0);
				pickedPath.current = void 0;
				bindings?.setDirectoryBusy(false);
				bindings?.requestAddWorkspace?.();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [renderDirectoryFlow({
				open: addRequested,
				busy,
				onCancel: () => {
					bindings?.closeAddWorkspace();
				},
				onError: (message) => {
					pickedPath.current = void 0;
					fail(message);
				},
				onPicked: pick
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: error !== void 0,
				onClose: () => {
					setError(void 0);
				},
				title: t("workspace.addFailed"),
				closeLabel: t("sessions.close"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					pickedPath.current !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						disabled: busy,
						onClick: () => {
							pick(pickedPath.current);
						},
						children: t("workspace.retry")
					}),
					bindings?.requestAddWorkspace && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						disabled: busy,
						onClick: chooseAgain,
						children: t("workspace.chooseAgain")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						onClick: () => {
							setError(void 0);
						},
						children: t("sessions.close")
					})
				] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				})
			})] });
		}
		//#endregion
		//#region src/client/HeroWorkspaceQuestion.tsx
		function heroWorkspaceChip() {
			return document.querySelector("[data-phase=hero] [class*=\"_heroWorkspaceRow\"] [class$=\"_workspace\"]");
		}
		/** 宿主工作区选择器是否处于展开状态。 */
		function isHeroWorkspacePickerOpen() {
			return heroWorkspaceChip()?.getAttribute("aria-expanded") === "true";
		}
		/** 读取宿主新建页工作区 chip 的展示名；占位状态（未选工作区）返回空串。 */
		function readHeroWorkspaceName() {
			const chip = heroWorkspaceChip();
			if (chip === null) return "";
			const label = chip.querySelector("[class$=\"_workspaceLabel\"]")?.textContent?.trim() ?? "";
			return label === "" || label === chip.getAttribute("aria-label")?.trim() ? "" : label;
		}
		/** 点击提问中的工作区名时转发到宿主工作区 chip 弹出同一个选择器，并把弹层锚点临时抬到文字上方（对齐 Codex 的弹出位置）。 */
		function openHeroWorkspacePicker(source) {
			const chip = heroWorkspaceChip();
			if (chip === null) return;
			const original = chip.getBoundingClientRect;
			chip.getBoundingClientRect = () => {
				const rect = source.getBoundingClientRect();
				const menuHeight = document.querySelector("[role=\"menu\"]")?.getBoundingClientRect().height ?? 0;
				const bottom = rect.top - menuHeight - 8;
				return new DOMRect(rect.left, bottom - rect.height, rect.width, rect.height);
			};
			chip.toggleAttribute("data-dcu-proxy", true);
			const restore = () => {
				chip.getBoundingClientRect = original;
				chip.toggleAttribute("data-dcu-proxy", false);
			};
			chip.click();
			const observer = new MutationObserver(() => {
				if (!chip.isConnected || chip.getAttribute("aria-expanded") !== "true") {
					restore();
					observer.disconnect();
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["aria-expanded"]
			});
			setTimeout(() => {
				restore();
				observer.disconnect();
			}, 6e4);
		}
		const NAME_SENTINEL = "‍";
		/** 展示用的一句话标题；布局验证脚本用它做静态渲染。工作区名是可点按钮，行为同下方 chip。 */
		function HeroQuestionLine({ t, workspace, onPickWorkspace = openHeroWorkspacePicker }) {
			const wasOpenOnPointerDown = (0, react.useRef)(false);
			if (workspace === "") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dcu-hero-question",
				children: t("home.heroQuestionEmpty")
			});
			const [before, after = ""] = t("home.heroQuestion", { name: NAME_SENTINEL }).split(NAME_SENTINEL);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				className: "dcu-hero-question",
				children: [
					before,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dcu-hero-workspace",
						onPointerDown: () => {
							wasOpenOnPointerDown.current = isHeroWorkspacePickerOpen();
						},
						onClick: (event) => {
							if (wasOpenOnPointerDown.current) {
								wasOpenOnPointerDown.current = false;
								return;
							}
							if (isHeroWorkspacePickerOpen()) {
								heroWorkspaceChip()?.click();
								return;
							}
							onPickWorkspace(event.currentTarget);
						},
						children: workspace
					}),
					after
				]
			});
		}
		/** 把“我们应该在{工作区}中做些什么？”portal 进宿主标题，跟随工作区切换实时更新。 */
		function HeroWorkspaceQuestion({ t }) {
			const [headline, setHeadline] = (0, react.useState)(null);
			const [workspace, setWorkspace] = (0, react.useState)(readHeroWorkspaceName);
			(0, react.useEffect)(() => {
				const sync = () => {
					setHeadline(document.querySelector("[data-phase=hero] [class*=\"_composerHero\"] [class$=\"_headline\"]"));
					setWorkspace(readHeroWorkspaceName());
				};
				sync();
				const observer = new MutationObserver(sync);
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					characterData: true,
					attributes: true,
					attributeFilter: ["data-phase", "aria-label"]
				});
				return () => observer.disconnect();
			}, []);
			return headline === null ? null : (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(HeroQuestionLine, {
				t,
				workspace
			}), headline);
		}
		//#endregion
		//#region src/client/CodexSidebar.tsx
		const subscribeEmptyCompanionTabs = () => () => {};
		const getEmptyCompanionTabs = () => EMPTY_COMPANION_TABS;
		const emptyFooterActions = [];
		const getEmptyFooterActions = () => emptyFooterActions;
		/** 淡出与边界移动同为 300ms；只多留 40ms 兜底，避免动画没跑完就被切成窄轨造成突变。 */
		const SIDEBAR_COLLAPSE_SETTLE_MS = 340;
		/** ··· 子项「固定到侧边栏」的持久化键：存的是可固定条目的 id 列表。 */
		const RAIL_PINNED_KEY = "dcu.rail.pinned";
		const emptyPanels = [];
		const getEmptyPanels = () => emptyPanels;
		const useLegacyPanelInfo = (selector) => selector({ activePanelId: null });
		const stylesheet$3 = `

/* 宿主窗口 chrome 底色统一到 Codex 轨道色：Windows 标题栏带（frame 背景与顶部拖动条）和原生窗口按钮区
   都从 --dsw-specific-sidebar-fill 取色；宿主 preload 的 syncWindowsAppearance 会观察样式表变化，
   重新测量该 token 并经 windows-appearance IPC 同步给主进程 titleBarOverlay，无需插件直连主进程。
   宿主把 token 定义在 body 上，必须同样覆盖 body——html/:root 上的定义会被 body 自身定义遮蔽。 */
body{--dsw-specific-sidebar-fill:#f3f3f3;--dcu-sidebar-edge:#f3f3f3;--dcu-sidebar-lift:rgba(0,0,0,.04)}
body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:#0c0c0c;--dcu-sidebar-edge:rgba(255,255,255,.10);--dcu-sidebar-lift:rgba(0,0,0,.32)}
/* 用户消息气泡换色（浅色主题）：宿主把气泡填充 alias 在 --dsw-specific-bubble（=deepseek-50 #edf3fe）、
   文字在 --dsw-alias-label-primary（#0f1115）。作用域钉在用户轮次容器 [data-chat-flow-kind=user] 上：
   只换这两处色值，不碰全局 label-primary，暗色主题（中性深气泡）保持宿主原样。 */
body:not([data-ds-dark-theme]) [data-chat-flow-kind=user]{--dsw-specific-bubble:#e8f3fe;--dsw-alias-label-primary:#0c274a}
/* 链接色（浅色主题）：宿主 alias --dsw-alias-link（=deepseek-500 #4176e6）→ #2858a4。
   只覆盖浅色主题；暗色主题的链接是宿主特意调浅的 deepseek-400，压成深蓝会在暗底上不可读。 */
body:not([data-ds-dark-theme]){--dsw-alias-link:#2858a4}
.dcu-root{--dcu-sidebar-background:#f9f9f9;--dcu-sidebar-rail:#f3f3f3;--dcu-sidebar-primary:#3d3f41;--dcu-sidebar-secondary:#5d5d5d;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#3d3f41;--dcu-sidebar-icon:#5d5d5d;--dcu-sidebar-hover:rgba(13,13,13,.08);--dcu-sidebar-border:rgba(13,13,13,.08);--dcu-tip-bg:#ffffff;--dcu-tip-shadow:0 0 0 .5px rgba(13,13,13,.08),0 3px 7.5px rgba(0,0,0,.03),0 0 16px rgba(0,0,0,.02);width:100%;height:100%;min-width:0;box-sizing:border-box;display:flex;flex-direction:row;overflow:hidden;background:var(--dcu-sidebar-rail);color:var(--dcu-sidebar-primary);font:13px/20px var(--dsw-font-family)}
/* 面板右边缘不加圆角：Codex 展开态面板与工作区之间就是一条直角分界线（实测 1px，#f3f3f3）。
   在裁切容器上补圆角会在交界处凭空多出一个缺口，看起来像侧栏和外框"融成一体"。 */body[data-ds-dark-theme] .dcu-root{--dcu-sidebar-background:#101010;--dcu-sidebar-rail:#0c0c0c;--dcu-sidebar-primary:#ededed;--dcu-sidebar-secondary:#afafaf;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#cdcdcd;--dcu-sidebar-icon:#afafaf;--dcu-sidebar-hover:rgba(255,255,255,.10);--dcu-sidebar-border:rgba(255,255,255,.08);--dcu-tip-bg:#1c1c1c;--dcu-tip-shadow:0 0 0 .5px rgba(255,255,255,.08),0 3px 7.5px rgba(0,0,0,.12),0 0 16px rgba(0,0,0,.10)}
/* 滤镜只作用于背景，避免为设置和搜索等 fixed 后代创建侧栏包含块。 */
body[data-we-sidebar-glass] .dcu-root{position:relative;background:transparent}body[data-we-sidebar-glass] .dcu-root::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background-color:color-mix(in srgb,var(--we-sidebar-color,#fff) calc(var(--we-sidebar-alpha,.15)*.66*100%),transparent);background-image:linear-gradient(180deg,rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.14)),rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.04)) 38%,rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.01)));-webkit-backdrop-filter:blur(var(--we-sidebar-blur,16px)) saturate(var(--we-sidebar-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-sidebar-blur,16px)) saturate(var(--we-sidebar-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);box-shadow:inset 0 1px 0 rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.32)),inset 0 -1px 0 rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.08)),inset 0 0 0 .5px rgba(255,255,255,calc(var(--we-sidebar-sheen,1)*.06))}body[data-ds-dark-theme][data-we-sidebar-glass] .dcu-root::before{background-color:color-mix(in srgb,var(--we-sidebar-color,#fff) calc(var(--we-sidebar-alpha,.15)*.33*100%),transparent)}body[data-we-appwindow][data-we-sidebar-glass] .dcu-root::before{-webkit-backdrop-filter:none;backdrop-filter:none}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){body[data-we-sidebar-glass] .dcu-root{background:#f9f9f9}body[data-ds-dark-theme][data-we-sidebar-glass] .dcu-root{background:#101010}body[data-we-sidebar-glass] .dcu-root::before{display:none}}
body[data-we-sidebar-glass] .dcu-expanded-shell,body[data-we-sidebar-glass] .dcu-rail,body[data-we-sidebar-glass] .dcu-foot{position:relative}
body[data-we-sidebar-glass] .dcu-rail{background:transparent}
.dcu-expanded-shell{display:flex;width:100%;min-height:0;flex:1 1 0;overflow:hidden;flex-direction:column;transform-origin:left center}
/* 面板本体（底色 + 左上角 16px 圆角）开合全程保持不透明，只被右边界的 overflow 随列宽裁掉——
   圆角因此始终钉在原地（x = 窄轨右沿），边界线平滑推移。淡入淡出只给面板内容，
   否则整块面板透明化会让圆角线跟着消失，观感就是"侧栏融进外框"。 */
.dcu-expanded-shell>*{transition:opacity var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1));animation:dcu-sidebar-expanded-in var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}.dcu-root.dcu-collapsing .dcu-expanded-shell>*{opacity:0}.dcu-root.dcu-compact .dcu-expanded-shell{display:none}/* 进场动画会锁定子元素 opacity 并压过 transition，收起时必须让位给渐变淡出，否则整帧跳成 0。 */.dcu-root.dcu-collapsing .dcu-expanded-shell>*,.dcu-root.dcu-compact .dcu-expanded-shell>*{animation:none}@keyframes dcu-sidebar-expanded-in{from{opacity:0}to{opacity:1}}
/* 面板左上角在折叠图标与品牌 logo 之间做圆角过渡：面板自绘底色，缺口透出轨道色；玻璃壁纸模式保持透明交给 ::before。
   同时按 Codex 的做法：面板与工作区（#ffffff）之间压一条 --dcu-sidebar-edge 分界线，
   并向图标轨一侧投出低强度 drop shadow（Codex 实测轨道底色从 #f3f3f3 渐暗到 #ebebeb，约 15px 衰减）。 */
/* 顶栏条（宿主 frame::before）与常驻窄轨同为 --dsw-specific-sidebar-fill = #f3f3f3，是一整块背景，
   因此不在顶栏上叠加任何投影——投影只会让顶栏偏离 #f3f3f3，破坏与窄轨的整体感。 */
body:not([data-we-sidebar-glass]) .dcu-expanded-shell{background:var(--dcu-sidebar-background);border-top-left-radius:16px;box-shadow:-6px 0 12px -5px var(--dcu-sidebar-lift),inset -1px 0 0 var(--dcu-sidebar-edge)}
/* Windows 原生标题栏下宿主用 --dsh-windows-content-radius 给工作区（中列）加 16px 圆角：右上角是窗口外角，
   恢复 Codex 同款 16px 圆角；左侧与侧栏的交界必须是直角——用 border-top-left-radius 显式清零
   （圆角声明在中列本身，特异性与顺序都压过宿主从 frame 继承的规则）。 */
[data-windows-titlebar] :is([class$="_centerCol"],[class$="_detailsCol"]){--dsh-windows-content-radius:16px;border-top-left-radius:0;border-top-right-radius:16px}
/* 折叠后侧栏只剩窄轨，不再有需要直角拼接的面板边界，工作区左上角恢复 Codex 折叠态的完整圆角（缺口透出窄轨底色）。 */
[data-windows-titlebar] [data-sidebar-collapsed] :is([class$="_centerCol"],[class$="_detailsCol"]){border-top-left-radius:var(--dsh-windows-content-radius,16px)}
/* 右栏（工作区文件/终端/浏览器等分页）内部自绘白底，宿主又给了 overflow:visible，
   在列上写 border-radius 裁不出圆角；因此由 sidebar-width.ts 给「最右侧可见列」打上
   data-dcu-outer-corner，这里用 16px 角落遮罩把窗口外角画出来——位置钉死在窗口右上角，
   右栏展开/收起时不会跟着对话区一起平移。 */
[data-dcu-outer-corner]{position:relative}
[data-dcu-outer-corner]::after{content:'';position:absolute;top:0;right:0;width:16px;height:16px;z-index:2147483647;pointer-events:none;background:radial-gradient(circle at 0 16px,transparent 16px,var(--dsw-specific-sidebar-fill,#f3f3f3) 16px)}
/* 右侧工作区分页（dock pane，浏览器/终端/开始页等）之间的缝隙有两处来源，必须分别覆盖：
   ① 单个分页容器自己的边框：border-left:.5px solid var(--dsw-alias-border-l4)；
   ② 分屏（两个分页并排）时它们之间的分隔条：宿主不画边框，而是用 0 宽分隔条的
      ::before 铺一条 .5px 背景线，颜色同样是 l4。
   l4 = #00000029，叠在白底上呈 #d6d6d6、叠在 #f3f3f3 缝隙上呈 #cccccc，都比侧栏深一档。
   这里只改这两条线自身（不能整体覆盖 --dsw-alias-border-l4，否则重命名输入框、
   展开搜索框等所有 l4 边框都会跟着变浅）。第 ① 条用 _tabHost_ 类名匹配而非
   data-dockkit-pane——实测分屏第二格不带该属性，按属性选会漏染。两条线都提到 1px，
   与侧栏面板和工作区之间的 1px 分界线同粗；深色主题维持宿主默认。
   宽度只对横向分屏（_splitRow_）生效：纵向分屏的 ::before 是靠 left/right 撑满的，
   改 width 会把那条横线截成 1px。 */
body:not([data-ds-dark-theme]) [data-dockkit-divider]::before{background:var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
body:not([data-ds-dark-theme]) [class*="_splitRow_"]>[data-dockkit-divider]::before{left:-.5px;width:1px;background:var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
body:not([data-ds-dark-theme]) [class*="_tabHost_"]:not([class*="_float_"]){border-left:1px solid var(--dsw-specific-sidebar-fill,#f3f3f3)!important}
/* 注意：绝不能用 [class$="_frame"] 给 frame 涂底色——聊天视图里也有 *_frame 类（EvIC1a_frame 等），
   会把整个会话区涂成 #f3f3f3；宿主在 [data-windows-titlebar] 下本来就会给应用外框涂 --dsw-specific-sidebar-fill。 */
/* ChatGPT 同款常驻图标竖栏：48px，独立深一号底色（Codex 轨道 #f3f3f3），点图标切换面板视图。 */
/* 折叠键在 Windows 标题栏（←/→ 与 应用 菜单之间，Codex/VS Code 同款）；非 Windows 平台保留在轨上。 */
html[data-windows-titlebar] .dcu-rail .dcu-rail-collapse{display:none}
/* Tabler plug 画在 24 网格上、四周留白比宿主 16 网格图标大，放大一号才与其他轨图标等墨量。 */
.dcu-rail{display:flex;flex:none;width:48px;flex-direction:column;align-items:center;gap:8px;padding:9px 0 8px;background:var(--dcu-sidebar-rail)}.dcu-rail .dcu-icon:hover{color:var(--dcu-sidebar-primary)}.dcu-rail .dcu-icon[aria-current=page]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}/* 只在实际发生动作（如正在新建会话）时点亮，不做常亮装饰。 */.dcu-rail .dcu-icon[data-busy]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}.dcu-rail-divider{flex:none;width:24px;height:1px;margin:4px 0;background:var(--dcu-sidebar-border)}.dcu-rail-spacer{flex:1}
/* Codex 轨道按钮为 36px 圆形点击区（窄轨 48px 居中留白），图标本体 18px svg；非主按钮墨色 #929393，新聊天 #1a1c1f。扩展槽图标统一去色。 */
.dcu-rail .dcu-icon{width:36px;height:36px;margin:0;padding:0;border-radius:50%;line-height:0;color:var(--dcu-sidebar-tertiary)}.dcu-rail .dcu-icon svg{width:18px;height:18px}.dcu-rail .dcu-rail-primary{background:color-mix(in srgb,var(--dcu-sidebar-primary) 8%,var(--dcu-sidebar-rail));color:var(--dcu-sidebar-primary)}.dcu-rail>.dcu-icon :is(svg,img){filter:grayscale(1)}
.dcu-root *{box-sizing:border-box}.dcu-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:8px;flex:none;height:var(--dcu-header-height,46px);padding:calc((var(--dcu-header-height,46px) - 28px)/2) 8px calc((var(--dcu-header-height,46px) - 28px)/2) 12px}.dcu-brand{border:0;background:transparent;color:inherit;padding:0;display:flex;align-items:center;min-width:0;overflow:hidden}.dcu-brand svg{display:block;width:auto;max-width:100%;height:24px;min-width:0}.dcu-head-actions{display:grid;grid-auto-flow:column;grid-auto-columns:28px;align-items:center;column-gap:8px;height:28px}
.dcu-icon,.dcu-menu button,.dcu-footer-link{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.dcu-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;color:var(--dcu-sidebar-icon)}.dcu-head .dcu-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;margin:0;padding:0;border-radius:50%;line-height:0}.dcu-head .dcu-icon svg{display:block;width:14px;height:14px}
.dcu-icon:hover,.dcu-menu button:hover:not(:disabled),.dcu-footer-link:hover{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}
.dcu-menu{padding:0 8px 8px;display:grid;gap:2px}.dcu-menu button,.dcu-footer-link{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:8px;align-items:center;width:100%;min-height:36px;padding:0 8px;border-radius:8px;color:var(--dcu-sidebar-navigation);font-size:14px;line-height:20px;text-align:left;font-weight:400}.dcu-menu button[aria-current=page]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary);font-weight:500}
.dcu-menu-icon{display:grid;place-items:center start;width:20px;height:20px}.dcu-menu-icon svg,.dcu-footer-link svg{display:block;width:16px;height:16px;color:var(--dcu-sidebar-icon)}.dcu-menu button:disabled{color:var(--dcu-sidebar-secondary);cursor:default;opacity:1}.dcu-menu button:disabled svg{color:var(--dcu-sidebar-secondary)}
.dcu-workspaces{display:flex;min-height:0;flex:1;flex-direction:column;margin-top:2px;padding-top:8px}/* 分割线已删：新建任务与置顶之间靠间距分层。 */.dcu-workspaces.dcu-workspaces-tabs{padding-top:0;border-top:0}.dcu-native-workspaces{display:flex;min-height:0;flex:1}.dcu-native-workspaces>*{min-width:0;flex:1}.dcu-native-workspaces .ima-tabs,.dcu-native-workspaces [role=tablist]:not(.dcu-schedule-segmented-tabs){display:none!important}.dcu-schedule-browser{display:flex;min-height:0;flex:1;flex-direction:column}.dcu-native-workspaces .dcu-schedule-views{display:flex!important;flex:none;margin:2px 8px 8px;padding:0}.dcu-native-workspaces .dcu-schedule-views [role=tablist],.dcu-schedule-views .dcu-schedule-segmented-tabs{display:grid!important;width:100%;margin:0!important;padding:2px!important;background:color-mix(in srgb,var(--dcu-sidebar-primary) 3%,transparent)!important;border-radius:8px!important;border:0.5px solid var(--dcu-sidebar-border)!important;box-sizing:border-box}.dcu-schedule-views .dcu-schedule-segmented-tabs>span{inset:2px auto 2px 2px!important;border-radius:6px!important;border:0.5px solid color-mix(in srgb,var(--dcu-sidebar-primary) 12%,transparent)!important;background:color-mix(in srgb,var(--dcu-sidebar-primary) 8%,transparent)!important;box-shadow:none!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:100%!important;height:26px!important;padding:0 6px!important;font-size:13px!important;line-height:18px!important;border-radius:6px!important;color:var(--dcu-sidebar-secondary);font-weight:500;text-align:center!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]>*{display:inline-flex!important;align-items:center!important;justify-content:center!important}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab]:hover{color:var(--dcu-sidebar-primary)}.dcu-schedule-views .dcu-schedule-segmented-tabs [role=tab][aria-selected=true]{color:var(--dcu-sidebar-primary)!important;font-weight:600}.dcu-schedule-pane{display:flex;min-height:0;flex:1}.dcu-schedule-pane>*{min-width:0;flex:1}.dcu-schedule-pane>[data-slot="sidebar.schedule"]{display:flex!important;width:100%;min-width:0;flex:1}.dcu-schedule-pane .dsh-st-rail{width:100%;min-width:0;padding:0;scrollbar-gutter:auto}.dcu-schedule-pane .dsh-st-overview{padding:2px 8px 14px;scrollbar-gutter:auto}.dcu-foot{display:grid;width:100%;gap:4px;padding:8px 8px 12px;border-top:1px solid var(--dcu-sidebar-border);transition:opacity var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),transform var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}.dcu-root.dcu-collapsing .dcu-foot{opacity:0;transform:translateX(-4px);pointer-events:none}.dcu-footer-actions:empty,.dcu-settings-seat:empty{display:none}.dcu-settings-seat>[data-dcu-settings-trigger]{width:100%;min-height:36px;padding-left:4px!important;color:var(--dcu-sidebar-navigation);font:13px/20px var(--dsw-font-family);font-weight:400}.dcu-compact{width:100%;overflow:hidden}.dcu-rail .dcu-settings-seat{width:36px;overflow:hidden}.dcu-rail .dcu-settings-seat>[data-dcu-settings-trigger]{display:grid;place-items:center;width:36px;min-height:36px;padding:0!important;font-size:0!important;line-height:0;border-radius:50%}.dcu-rail .dcu-settings-seat>[data-dcu-settings-trigger] svg{width:16px;height:16px}
.dcu-settings-seat [data-slot="settings.trigger"]{color:var(--dcu-sidebar-navigation)}
.dcu-settings-seat [data-slot="settings.trigger"]>svg{color:var(--dcu-sidebar-icon)}
/* 宿主列负责缩放，宽态内容锁为「列宽 − 48px 图标轨」，避免宿主动画把文字挤成竖排。 */
.dcu-expanded-shell{width:calc(var(--dcu-sidebar-expanded-width,340px) - 48px);flex:none}
/* 侧栏开合节奏：300ms 两端缓冲的标准曲线。
   此前用 500ms cubic-bezier(.16,1,.3,1)（指数衰减），实测前 100ms 就走完 93% 的位移、
   剩下 400ms 只在最后 27px 磨蹭，观感是「瞬跳 + 拖尾」而非边界线平移；
   cubic-bezier(.4,0,.2,1) 让 50% 的时间走约 60% 的距离，视觉上是匀速推进的分界线，并与宿主 .3s 面板节奏一致。 */
body{--dcu-sidebar-motion-duration:300ms;--dcu-sidebar-motion-ease:cubic-bezier(.4,0,.2,1)}
/* 顶栏按窄轨宽度补偿窗口安全区；注册成 <length> 后可与列宽同步插值，避免标题在第 1 帧瞬移。 */
@property --dcu-sidebar-rail-width{syntax:"<length>";inherits:true;initial-value:0px}
.dcu-root{position:relative}
/* 原生交通灯覆盖网页顶部；宽态、窄轨和动画层共用宿主安全区，保持页脚在窗口内。 */
.dcu-root{--dcu-sidebar-top-clearance:0px}
html[data-platform=darwin]:not([data-fullscreen]) .dcu-root{position:relative;--dcu-sidebar-top-clearance:var(--dsh-frame-top-clearance,48px);padding-top:var(--dcu-sidebar-top-clearance)}
/* 只开放顶部空白安全区，不让项目列表、窄轨按钮成为窗口拖动区域。 */
html[data-platform=darwin]:not([data-fullscreen]) .dcu-root::after{content:"";position:absolute;inset:0 0 auto;height:var(--dcu-sidebar-top-clearance);pointer-events:none;-webkit-app-region:drag}
[data-dcu-codex-sidebar-initialized]{transition:grid-template-columns var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),--dcu-sidebar-rail-width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
/* Windows 标题栏条由 --dsh-windows-sidebar-width 决定宽度，必须与列宽同步平移，否则顶栏先到位、侧栏再慢慢追。 */
[data-dcu-codex-sidebar-initialized]::before{transition:width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
/* dsh-better-sidebar 的 #root 布局规则会覆盖 transition 简写；合并两侧过渡而非只争抢左栏。 */
#root [data-dcu-codex-sidebar-initialized]:not([data-dragging]){transition:grid-template-columns var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),--dcu-sidebar-rail-width var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),padding-right var(--ds-transition-duration-slow,.3s) var(--ds-ease-in-out,cubic-bezier(.4,0,.2,1))}
#root [data-dcu-codex-sidebar-initialized][data-dragging]{transition:none}
[data-dcu-codex-sidebar-initialized] [data-side="sidebar"]{transition:left var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
[data-dcu-codex-sidebar-initialized][data-dragging],[data-dcu-codex-sidebar-initialized][data-dragging] [data-side="sidebar"],[data-dcu-codex-sidebar-initialized][data-dragging]::before{transition:none}
@media (prefers-reduced-motion:reduce){[data-dcu-codex-sidebar-initialized],[data-dcu-codex-sidebar-initialized] [data-side="sidebar"],[data-dcu-codex-sidebar-initialized]::before,#root [data-dcu-codex-sidebar-initialized]:not([data-dragging]){transition:none}}
.dcu-native-workspaces{flex-direction:column}.dcu-native-workspaces>[data-mcp-connector-top-mount=true]{flex:none}.dcu-root .mcpConnectorLauncher,.dcu-root [data-mcp-connector-top-mount=true]{display:none!important}
.dcu-dependency-notice{margin:0 10px 8px;border:1px solid var(--dcu-sidebar-border);border-radius:8px;padding:8px;color:var(--dcu-sidebar-secondary);font-size:12px;line-height:18px}
.dcu-search-scrim{position:fixed;z-index:10020;inset:0;display:flex;justify-content:center;align-items:flex-start;padding:72px 20px;background:color-mix(in srgb,#000 60%,transparent);animation:dcu-search-scrim-in 140ms ease-out}.dcu-search-dialog{width:min(560px,100%);max-height:min(640px,calc(100vh - 120px));overflow:auto;border:1px solid var(--dcu-sidebar-border);border-radius:16px;padding:10px;background:#ffffff;box-shadow:0 16px 40px rgba(0,0,0,.24);animation:dcu-search-dialog-in 180ms cubic-bezier(.16,1,.3,1)}body[data-ds-dark-theme] .dcu-search-dialog{background:#232323;border-color:rgba(255,255,255,.08);box-shadow:0 16px 40px rgba(0,0,0,.45)}@keyframes dcu-search-scrim-in{from{opacity:0}to{opacity:1}}@keyframes dcu-search-dialog-in{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1}}.dcu-search-input{margin-bottom:8px}.dcu-search-section{padding:6px 0}.dcu-search-title{padding:0 8px 4px;color:var(--dcu-sidebar-tertiary);font-size:12px;font-weight:600}.dcu-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;min-height:34px;border:0;border-radius:8px;padding:6px 8px;background:transparent;color:var(--dcu-sidebar-primary);font:inherit;text-align:left;cursor:pointer}.dcu-search-row:hover,.dcu-search-row[data-active=true]{background:var(--dcu-sidebar-hover)}.dcu-search-main{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-search-detail{max-width:160px;overflow:hidden;color:var(--dcu-sidebar-tertiary);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.dcu-search-empty{padding:18px 8px;color:var(--dcu-sidebar-tertiary);font-size:13px}@media (prefers-reduced-motion:reduce){.dcu-expanded-shell,.dcu-foot,.dcu-search-scrim,.dcu-search-dialog,{animation:none;transition:none}}
[data-conversation-scroll]{--dsh-composer-card-max-width:calc(var(--dsh-chat-content-width) + 32px);--dsh-composer-side-clearance:24px;--dcu-composer-bg:var(--dsw-specific-input-major,#fff);--dcu-composer-shadow:0 0 0 1px #0000000a,0 2px 8px #0000000a,0 4px 40px 8px #00000006}
body[data-ds-dark-theme] [data-conversation-scroll]{--dcu-composer-bg:var(--dsw-alias-bg-layer-2,#242424);--dcu-composer-shadow:inset 0 0 1px #fff3}
[data-conversation-scroll] [data-composer-card]{padding-top:8px;gap:4px;border:0;border-radius:22px;background:var(--dcu-composer-bg);box-shadow:var(--dcu-composer-shadow)}
/* 官方附件轨道用 -6px 抵消 12px 行间距；本皮肤为 4px，改为 +2px 保留附件到正文的 6px。 */
[data-conversation-scroll] [data-composer-card]>[data-slot="conversation.input.attachments"]>:is([class$="_rail"],[class*="_rail_"]){margin-bottom:2px}
[data-conversation-scroll] [data-input-mirror]{min-height:44px}
[data-conversation-scroll] [data-composer-card] [data-input-scroll]{margin-right:0}
[data-conversation-scroll] [data-input-scroll] [data-lexical-editor=true]{min-height:44px;padding:0 12px}
[data-conversation-scroll] [data-composer-placeholder]{inset:0 12px auto}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div{padding:0 8px 8px;gap:5px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div>div{gap:4px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div>div>div{gap:4px}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div :is(button,select):not([role]){min-height:28px;height:28px}
/* Codex 蓝色发送键；使用独立颜色，避免壁纸的透明表面令牌影响 currentColor 箭头。 */
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]{width:28px;transform:none;background:#3a83f7;color:#fff}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]:hover:not(:disabled){background:#2f74e0}
body[data-ds-dark-theme] [data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]{background:#3a83f7;color:#fff}
body[data-ds-dark-theme] [data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div button[class$=_primary]:hover:not(:disabled){background:#2f74e0}
[data-conversation-scroll] [data-composer-card]>[data-input-scroll]+div :is(button,select):focus-visible{outline:2px solid var(--dsw-alias-label-secondary);outline-offset:2px}
@supports(corner-shape:superellipse(1.1)){[data-conversation-scroll] [data-composer-card]{border-radius:22px;corner-shape:superellipse(1.1)}}
@media(max-width:639px){[data-conversation-scroll]{--dcu-composer-shadow:0 0 0 1px #0000000a,0 2px 8px #0000000a,0 4px 40px 8px #00000006}}
@media(forced-colors:active){[data-conversation-scroll] [data-composer-card]{outline:1px solid CanvasText}}
html[data-dcu-official-turn-navigator-supported=true] .dcu-turn-navigator,html:has([data-dcu-official-turn-navigator]) .dcu-turn-navigator{display:none}
/* 输入区把 clearance 设成 24px 后，旧镜像公式会变成 -28px，整条导航滑进侧栏。至少留 12px，贴在会话列内侧。 */
[data-dcu-official-turn-navigator]{right:auto!important;left:max(12px,calc(12px - (var(--dsh-composer-side-clearance) + 16px)))!important}
/* 左移后的预览朝聊天内容区展开，外观和动画继续使用宿主规则。 */
[data-dcu-official-turn-navigator] [role=tooltip]{right:auto!important;left:calc(100% + 10px)!important}
/* 右停靠面板的居中补偿改由 chat-scrollbar.ts 实测打标（data-dcu-center-comp）：
   面板以 float 形式打开时没有 data-sidebar-right-open，:has 门控匹配不到。 */
`;
		function MenuIcon({ children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dcu-menu-icon",
				children
			});
		}
		function ScheduleIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailClockIcon, {});
		}
		function SidebarSearchModal({ imSettingsAvailable, openPlugins, openSession, startSession, t, useSessions, useWorkspaces, settingsSeat, onClose }) {
			const [query, setQuery] = (0, react.useState)("");
			const [activeIndex, setActiveIndex] = (0, react.useState)(0);
			const deferredQuery = (0, react.useDeferredValue)(query);
			const sessions = useSessions((state) => state);
			const workspaces = useWorkspaces((state) => state);
			const selectSection = (0, react.useCallback)((label) => {
				openSettingsSection(settingsSeat.current, label);
			}, [settingsSeat]);
			const selectExternalSection = (0, react.useCallback)((label) => {
				openSettingsSection(settingsSeat.current, label, () => {
					selectSection(t("about.nav"));
				});
			}, [
				selectSection,
				settingsSeat,
				t
			]);
			const openImSettings = (0, react.useCallback)(() => {
				routeOptionalSettingsSection(imSettingsAvailable, () => {
					selectExternalSection([t("sidebar.imSettings"), "IM助理"]);
				}, () => {
					selectSection(t("about.nav"));
				});
			}, [
				imSettingsAvailable,
				selectExternalSection,
				selectSection,
				t
			]);
			const openSettings = (0, react.useCallback)(() => {
				openSettingsRoot(settingsSeat.current);
			}, [settingsSeat]);
			const entries = (0, react.useMemo)(() => {
				const archived = new Set(workspaces.archivedSessionIds);
				const workspaceTitles = new Map(workspaces.items.flatMap((workspace) => workspace.sessionIds.map((sessionId) => [String(sessionId), workspace.title])));
				const sessionEntries = sessions.ids.map((id) => sessions.byId[id]).filter((session) => session !== void 0 && !archived.has(session.id) && isTaskSession(session)).sort((left, right) => right.updatedAt - left.updatedAt).map((session) => ({
					id: `session:${session.id}`,
					group: "sessions",
					label: session.displayTitle,
					keywords: `${session.cwd ?? ""} ${session.id}`,
					detail: workspaceTitles.get(String(session.id)) ?? session.cwd,
					run: () => {
						onClose();
						openSession(session.id);
					}
				}));
				const settingEntries = [
					{
						id: "settings:root",
						group: "settings",
						label: t("search.settings"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							openSettings();
						}
					},
					{
						id: "settings:experts",
						group: "settings",
						label: t("sidebar.experts"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							selectExternalSection(t("sidebar.experts"));
						}
					},
					{
						id: "settings:skills",
						group: "settings",
						label: t("sidebar.skills"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							selectExternalSection(t("sidebar.skills"));
						}
					},
					{
						id: "settings:plugins",
						group: "settings",
						label: t("sidebar.plugins"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							openPlugins();
						}
					},
					{
						id: "settings:plugin-config",
						group: "settings",
						label: t("settings.pluginConfig"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							openSettingsSection(settingsSeat.current, t("settings.pluginConfig"));
						}
					},
					{
						id: "settings:connectors",
						group: "settings",
						label: t("sidebar.connectors"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							selectSection(t("sidebar.connectors"));
						}
					},
					{
						id: "settings:schedule",
						group: "settings",
						label: t("sidebar.schedule"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							selectExternalSection(t("sidebar.schedule"));
						}
					},
					{
						id: "settings:assistant",
						group: "settings",
						label: t("sidebar.assistant"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							openImSettings();
						}
					},
					{
						id: "settings:about",
						group: "settings",
						label: t("about.nav"),
						keywords: t("search.settings"),
						run: () => {
							onClose();
							selectSection(t("about.nav"));
						}
					}
				];
				return [
					...sessionEntries,
					...settingEntries,
					{
						id: "action:new",
						group: "actions",
						label: t("sidebar.newTask"),
						keywords: t("search.actions"),
						run: () => {
							onClose();
							startSession();
						}
					}
				];
			}, [
				imSettingsAvailable,
				onClose,
				openImSettings,
				openPlugins,
				openSession,
				openSettings,
				selectExternalSection,
				selectSection,
				sessions.byId,
				sessions.ids,
				startSession,
				t,
				workspaces.archivedSessionIds,
				workspaces.items
			]);
			const results = (0, react.useMemo)(() => filterSidebarSearchItems(entries, deferredQuery).slice(0, 12), [deferredQuery, entries]);
			(0, react.useEffect)(() => {
				setActiveIndex(0);
			}, [query]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						event.preventDefault();
						onClose();
						return;
					}
					if (event.key === "ArrowDown") {
						event.preventDefault();
						setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
						return;
					}
					if (event.key === "ArrowUp") {
						event.preventDefault();
						setActiveIndex((index) => Math.max(index - 1, 0));
						return;
					}
					if (event.key === "Enter") {
						const entry = results[activeIndex];
						if (entry !== void 0) {
							event.preventDefault();
							entry.run();
						}
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [
				activeIndex,
				onClose,
				results
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dcu-search-scrim",
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dcu-search-dialog",
					role: "dialog",
					"aria-modal": "true",
					"aria-label": t("sidebar.search"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-search-input",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							autoFocus: true,
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearchOutlineMedium, { size: 16 }),
							value: query,
							placeholder: t("search.placeholder"),
							onChange: (event) => {
								setQuery(event.target.value);
							}
						})
					}), results.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-search-empty",
						children: t("search.empty")
					}) : [
						"sessions",
						"settings",
						"actions"
					].map((group) => {
						const grouped = results.filter((entry) => entry.group === group);
						if (grouped.length === 0) return null;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dcu-search-section",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-search-title",
								children: t(`search.${group}`)
							}), grouped.map((entry) => {
								const index = results.indexOf(entry);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dcu-search-row",
									"data-active": index === activeIndex,
									onMouseEnter: () => {
										setActiveIndex(index);
									},
									onClick: entry.run,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dcu-search-main",
										children: entry.label
									}), entry.detail !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dcu-search-detail",
										children: entry.detail
									})]
								}, entry.id);
							})]
						}, group);
					})]
				})
			});
		}
		/** 搜索状态与大侧栏隔离：未打开时不订阅 store 快照，避免后台流式高频引发无谓的搜索索引重构。 */
		const SidebarSearch = (0, react.forwardRef)(function SidebarSearch(props, ref) {
			const [open, setOpen] = (0, react.useState)(false);
			const close = (0, react.useCallback)(() => {
				setOpen(false);
			}, []);
			(0, react.useImperativeHandle)(ref, () => ({ open: () => {
				setOpen(true);
			} }), []);
			if (!open) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarSearchModal, {
				...props,
				onClose: close
			});
		});
		/** 跟随宿主会话 phase：新建主页（hero）时 home 键高亮为当前页。 */
		function useHeroPhase() {
			const [onHome, setOnHome] = (0, react.useState)(() => document.querySelector("[data-phase]")?.getAttribute("data-phase") === "hero");
			(0, react.useEffect)(() => {
				const sync = () => setOnHome(document.querySelector("[data-phase]")?.getAttribute("data-phase") === "hero");
				sync();
				const observer = new MutationObserver(sync);
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["data-phase"]
				});
				return () => observer.disconnect();
			}, []);
			return onHome;
		}
		/** Codex 风格的 DSH 侧栏，只替换导航外观，项目浏览和设置仍由 DSH 官方组件提供。 */
		function CodexSidebar({ workspaceShortcuts, navigationHistory, globalPanels, footerActions, selectPanel, usePanelInfo = useLegacyPanelInfo, collapsed, width, openSession, startSession, toggleSidebar, archiveSession, canDeleteSession, deleteSession, forkSession, moveSession, renameSession, openPath, companionSlots, renderSlot, t, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces }) {
			const extensionPanels = [...(0, react.useSyncExternalStore)(globalPanels?.subscribe ?? subscribeEmptyCompanionTabs, globalPanels?.getSnapshot ?? getEmptyPanels, globalPanels?.getSnapshot ?? getEmptyPanels)].sort((left, right) => left.order - right.order);
			const visibleFooterActions = (0, react.useSyncExternalStore)(footerActions?.subscribe ?? subscribeEmptyCompanionTabs, footerActions?.getSnapshot ?? getEmptyFooterActions, footerActions?.getSnapshot ?? getEmptyFooterActions);
			const activePanelId = usePanelInfo((info) => info.activePanelId);
			const panelActive = activePanelId !== null && activePanelId !== "";
			const compact = collapsed || width < 80;
			const [visualCompact, setVisualCompact] = (0, react.useState)(compact);
			const [collapsing, setCollapsing] = (0, react.useState)(false);
			const settingsSeat = (0, react.useRef)(null);
			const search = (0, react.useRef)(null);
			const openSearch = () => {
				workspaceShortcuts?.getSnapshot().bindings?.closeAddWorkspace();
				search.current?.open();
			};
			const toggleSidebarRef = (0, react.useRef)(toggleSidebar);
			toggleSidebarRef.current = toggleSidebar;
			const expandSidebar = (0, react.useCallback)(() => {
				toggleSidebarRef.current();
			}, []);
			const onHome = useHeroPhase();
			const [imTab, setImTab] = (0, react.useState)("tasks");
			const [startingSession, setStartingSession] = (0, react.useState)(false);
			const [pinnedIds, setPinnedIds] = (0, react.useState)(() => {
				try {
					const raw = browserStorage()?.getItem(RAIL_PINNED_KEY);
					const parsed = raw === null || raw === void 0 ? [] : JSON.parse(raw);
					return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
				} catch {
					return [];
				}
			});
			const togglePin = (0, react.useCallback)((id) => {
				setPinnedIds((ids) => {
					const next = ids.includes(id) ? ids.filter((pinned) => pinned !== id) : [...ids, id];
					try {
						browserStorage()?.setItem(RAIL_PINNED_KEY, JSON.stringify(next));
					} catch {}
					return next;
				});
			}, []);
			const beginSession = (0, react.useCallback)(async (workspaceId) => {
				if (startingSession) return;
				setStartingSession(true);
				try {
					selectPanel?.(null);
					await Promise.resolve(beginSidebarSession(setImTab, startSession, workspaceId));
				} catch (error) {
					console.warn("新建任务失败：", error);
				} finally {
					setStartingSession(false);
				}
			}, [
				selectPanel,
				startSession,
				startingSession
			]);
			const companionTabs = (0, react.useSyncExternalStore)(companionSlots?.subscribe ?? subscribeEmptyCompanionTabs, companionSlots?.getSnapshot ?? getEmptyCompanionTabs, companionSlots?.getSnapshot ?? getEmptyCompanionTabs);
			const showChannels = companionTabs.channels;
			const showSchedule = companionTabs.schedule;
			const showCompanionTabs = showChannels || showSchedule;
			const selectSection = (label) => {
				openSettingsSection(settingsSeat.current, label);
			};
			const openPlugins = () => {
				selectExternalSection([
					t("settings.pluginConfig"),
					t("sidebar.marketplace"),
					t("sidebar.builtinPlugins")
				]);
			};
			const selectExternalSection = (label) => {
				openSettingsSection(settingsSeat.current, label, () => {
					selectSection(t("about.nav"));
				});
			};
			(0, react.useEffect)(() => {
				if (imTab === "schedule" && !showSchedule) setImTab("tasks");
			}, [
				imTab,
				showChannels,
				showSchedule
			]);
			(0, react.useEffect)(() => {
				let startX = 0;
				let startWidth = 340;
				let dragging = false;
				let pointerId;
				let frame;
				let handle;
				const stopHostDrag = (event) => {
					event.preventDefault();
					event.stopPropagation();
				};
				const finishDrag = () => {
					frame?.removeAttribute("data-dragging");
					handle?.removeAttribute("data-dragging");
					if (handle !== void 0 && pointerId !== void 0 && handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
					dragging = false;
					pointerId = void 0;
					frame = void 0;
					handle = void 0;
				};
				const onDown = (event) => {
					if (dragging || !isSidebarDragHandle(event.target)) return;
					const nextFrame = findSidebarFrame(document);
					const tracks = nextFrame === void 0 ? void 0 : parseSidebarGrid(nextFrame.style.gridTemplateColumns);
					const nextHandle = event.target instanceof Element ? event.target.closest("[data-side=\"sidebar\"]") ?? void 0 : void 0;
					if (nextFrame === void 0 || tracks === void 0 || nextHandle === void 0) return;
					stopHostDrag(event);
					dragging = true;
					pointerId = event.pointerId;
					startX = event.clientX;
					startWidth = tracks.sidebar;
					frame = nextFrame;
					handle = nextHandle;
					frame.setAttribute("data-dragging", "");
					handle.setAttribute("data-dragging", "true");
					try {
						handle.setPointerCapture(event.pointerId);
					} catch {}
				};
				const onMove = (event) => {
					if (!dragging || event.pointerId !== pointerId || frame === void 0) return;
					stopHostDrag(event);
					applySidebarWidth(frame, sidebarWidthDuringDrag(startWidth, startX, event.clientX));
				};
				const onUp = (event) => {
					if (!dragging || event.pointerId !== pointerId) return;
					stopHostDrag(event);
					if (frame !== void 0) applySidebarWidth(frame, sidebarWidthDuringDrag(startWidth, startX, event.clientX));
					const collapse = shouldCollapseOnSidebarDrag(startWidth, startX, event.clientX);
					finishDrag();
					if (collapse) window.requestAnimationFrame(() => {
						window.requestAnimationFrame(() => {
							toggleSidebarRef.current();
						});
					});
				};
				const onCancel = (event) => {
					if (event.pointerId !== pointerId) return;
					stopHostDrag(event);
					finishDrag();
				};
				window.addEventListener("pointerdown", onDown, true);
				window.addEventListener("pointermove", onMove, true);
				window.addEventListener("pointerup", onUp, true);
				window.addEventListener("pointercancel", onCancel, true);
				return () => {
					finishDrag();
					window.removeEventListener("pointerdown", onDown, true);
					window.removeEventListener("pointermove", onMove, true);
					window.removeEventListener("pointerup", onUp, true);
					window.removeEventListener("pointercancel", onCancel, true);
				};
			}, []);
			(0, react.useLayoutEffect)(() => {
				if (!compact) {
					setCollapsing(false);
					setVisualCompact(false);
					return;
				}
				if (visualCompact) {
					setCollapsing(false);
					return;
				}
				if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true) {
					setCollapsing(false);
					setVisualCompact(true);
					return;
				}
				setCollapsing(true);
				let done = false;
				const finish = () => {
					if (done) return;
					done = true;
					setVisualCompact(true);
					setCollapsing(false);
				};
				const timer = window.setTimeout(finish, SIDEBAR_COLLAPSE_SETTLE_MS);
				return () => {
					done = true;
					window.clearTimeout(timer);
				};
			}, [compact, visualCompact]);
			const workspaceSlot = (0, react.useMemo)(() => {
				return renderSlot("sidebar.workspaces", {
					wide: true,
					expandSidebar,
					panelActive
				});
			}, [
				expandSidebar,
				panelActive,
				renderSlot
			]);
			const scheduleOverviewSlot = (0, react.useMemo)(() => renderSlot("sidebar.schedule", {
				wide: true,
				expandSidebar,
				openSession,
				archiveSession,
				deleteSession,
				forkSession,
				moveSession,
				renameSession,
				openPath,
				useSessions,
				useWorkspaces,
				view: "overview",
				showViewSwitch: false
			}), [
				archiveSession,
				companionTabs.schedule,
				deleteSession,
				expandSidebar,
				forkSession,
				moveSession,
				openPath,
				openSession,
				renameSession,
				renderSlot,
				useSessions,
				useWorkspaces
			]);
			const railApi = (0, react.useMemo)(() => {
				const moreItems = [
					{
						id: "experts",
						label: t("sidebar.experts"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailUsersIcon, {}),
						run: () => {
							selectExternalSection(t("sidebar.experts"));
						}
					},
					{
						id: "skills",
						label: t("sidebar.skills"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailSparklesIcon, {}),
						run: () => {
							selectExternalSection(t("sidebar.skills"));
						}
					},
					{
						id: "connectors",
						label: t("sidebar.connectors"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailLinkIcon, {}),
						run: () => {
							selectSection(t("sidebar.connectors"));
						}
					}
				];
				return {
					home: {
						label: t("sidebar.home"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailHomeIcon, {}),
						run: () => {
							if (!onHome) beginSession();
						},
						active: !panelActive && imTab !== "schedule",
						busy: startingSession
					},
					collapse: {
						label: visualCompact ? t("sidebar.expand") : t("sidebar.collapse"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelLeft, { size: 16 }),
						run: () => {
							toggleSidebar();
						}
					},
					...showSchedule ? { schedule: {
						label: t("sidebar.scheduleTab"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleIcon, {}),
						run: () => {
							setImTab("schedule");
						},
						active: imTab === "schedule"
					} } : {},
					plugins: {
						label: t("sidebar.plugins"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailBlocksIcon, {}),
						run: () => {
							openPlugins();
						}
					},
					more: {
						label: t("sidebar.extensions"),
						items: moreItems,
						pinnedIds,
						togglePin,
						pinLabel: t("sidebar.pin"),
						unpinLabel: t("sidebar.unpin")
					},
					pinned: moreItems.filter((item) => item.id !== void 0 && pinnedIds.includes(item.id)),
					panels: extensionPanels.map((panel) => ({
						id: panel.id,
						label: panel.label,
						active: activePanelId === panel.id,
						run: () => {
							selectPanel?.(panel.id);
						},
						node: panel.id === "schedules" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailClockIcon, {}) : panel.id === "webchat" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailMessageIcon, {}) : panel.id === "image-studio" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailPhotoIcon, {}) : renderSlot("sidebar.panellist", {
							size: 16,
							active: activePanelId === panel.id
						}, { only: panel.id })
					})),
					settings: renderSlot("sidebar.settings", { wide: false }),
					settingsRef: settingsSeat
				};
			}, [
				activePanelId,
				beginSession,
				extensionPanels,
				imTab,
				onHome,
				openPlugins,
				panelActive,
				pinnedIds,
				renderSlot,
				selectPanel,
				setImTab,
				settingsSeat,
				showChannels,
				showSchedule,
				startingSession,
				t,
				togglePin,
				toggleSidebar,
				toggleSidebarRef,
				visualCompact
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarRailContext.Provider, {
				value: railApi,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
					className: `dcu-root${visualCompact ? " dcu-compact" : ""}${collapsing ? " dcu-collapsing" : ""}`,
					"aria-label": t("sidebar.label"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: stylesheet$3 }),
						navigationHistory && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DesktopNavigationControls, {
							history: navigationHistory,
							t,
							collapse: {
								label: visualCompact ? t("sidebar.expand") : t("sidebar.collapse"),
								run: () => {
									toggleSidebar();
								}
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: NEW_CONVERSATION_STYLE }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: COMPOSER_TOOL_MENU_STYLE }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: FULL_ACCESS_ACCENT_STYLE }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(HeroWorkspaceQuestion, { t }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarRail, { api: railApi }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-expanded-shell",
							onTransitionEnd: (event) => {
								if (event.target === event.currentTarget && (event.propertyName === "opacity" || event.propertyName === "transform")) {
									setVisualCompact(true);
									setCollapsing(false);
								}
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
									className: "dcu-head",
									"data-window-drag": true,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dcu-brand",
										"aria-label": t("sidebar.newTask"),
										onClick: () => {
											beginSession();
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.BrandWordmark, { size: 24 })
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-head-actions",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dcu-icon",
											"aria-label": t("sidebar.search"),
											onClick: openSearch,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearchOutlineMedium, { size: 16 })
										})
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
									className: "dcu-menu",
									"aria-label": t("sidebar.mainMenu"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											beginSession();
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MenuIcon, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconNewChatOutlineMedium, { size: 16 }) }), t("sidebar.newTask")]
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: showCompanionTabs ? "dcu-workspaces dcu-workspaces-tabs" : "dcu-workspaces",
									children: imTab === "schedule" && showSchedule ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-native-workspaces",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleBrowser, {
											openSession,
											archiveSession,
											deleteSession,
											canDeleteSession,
											forkSession,
											moveSession,
											renameSession,
											useSessions,
											useSessionPendingInteraction,
											useSessionStatus,
											useWorkspaces,
											panelActive,
											t,
											overviewContent: scheduleOverviewSlot,
											openTaskSettings: (request) => {
												openSettingsSection(settingsSeat.current, t("sidebar.schedule"), () => {
													clearAutomationTaskSettingsRequest();
													selectSection(t("about.nav"));
												}, () => {
													requestAutomationTaskSettings(request);
												});
											}
										})
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-native-workspaces",
										children: workspaceSlot
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("footer", {
									className: "dcu-foot",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-footer-actions",
										children: footerActions === void 0 ? renderSlot("sidebar.footer.action", { wide: !visualCompact }) : visibleFooterActions.map((action) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Fragment, { children: renderSlot("sidebar.footer.action", { wide: !visualCompact }, { only: action.id }) }, action.id))
									})
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarSearch, {
							ref: search,
							imSettingsAvailable: showChannels,
							openPlugins,
							settingsSeat,
							openSession,
							startSession: beginSession,
							t,
							useSessions,
							useWorkspaces
						}),
						workspaceShortcuts && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceShortcutBridge, {
							source: workspaceShortcuts,
							openSearch,
							startSession: (id) => {
								beginSession(id);
							},
							renderDirectoryFlow: (owner) => renderSlot("sidebar.codex.directoryFlow", owner),
							t
						})
					]
				})
			});
		}
		CodexSidebar.displayName = "uncledylan-codex-ui";
		//#endregion
		//#region src/dependencies.ts
		const MANAGED_DEPENDENCIES = [
			{
				id: "ui",
				packageName: "@uncledylan/dsh-codex-ui"
			},
			{
				id: "experts",
				packageName: "@michengai/dsh-agency-agents"
			},
			{
				id: "skills",
				packageName: "@michengai/dsh-skills-manager"
			},
			{
				id: "archive",
				packageName: "@michengai/dsh-archive-manager"
			},
			{
				id: "im",
				packageName: "@michengai/dsh-im-connect"
			},
			{
				id: "schedule",
				packageName: "@michengai/dsh-automation"
			},
			{
				id: "btw",
				packageName: "@michengai/dsh-btw"
			},
			{
				id: "simplify",
				packageName: "@michengai/dsh-simplify"
			},
			{
				id: "pua",
				packageName: "@michengai/dsh-pua"
			},
			{
				id: "review",
				packageName: "@michengai/dsh-code-review"
			},
			{
				id: "pet",
				packageName: "@michengai/dsh-codex-pet"
			},
			{
				id: "market",
				packageName: "dshmarket"
			}
		];
		//#endregion
		//#region src/client/AboutSection.tsx
		const PROJECT_HOMEPAGES = Object.fromEntries(MANAGED_DEPENDENCIES.map(({ id, packageName }) => [id, id === "market" ? "https://dshmarket.com" : `https://github.com/MichengAI/${packageName.split("/")[1]}`]));
		const openExternal = (url) => {
			window.open(url, "_blank", "noreferrer");
		};
		const PROGRESS_PHASES = /* @__PURE__ */ new Set([
			"resolving",
			"downloading",
			"linking",
			"building"
		]);
		const endpoint = CODEX_UI_API_ENDPOINTS.dependencies;
		const stylesheet$2 = `
.dcu-about{color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family)}.dcu-about-head{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:12px}.dcu-about-title-block{min-width:0}.dcu-about h2,.dcu-about-title{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;color:var(--dsw-alias-label-primary)}.dcu-about-intro,.dcu-about-desc{margin:12px 0 0;color:var(--dsw-alias-label-tertiary,#a0a0a0);font-size:14px;line-height:22px}.dcu-about h3{margin:24px 0 12px;font-size:16px;font-weight:600;line-height:24px;color:var(--dsw-alias-label-primary)}.dcu-about-features{margin:0;padding-left:20px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:24px}.dcu-about-dependencies-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px}.dcu-about-dependencies-heading h3{margin:0}.dcu-about-dependencies-heading+.dcu-about-intro,.dcu-about-dependencies-heading+.dcu-about-desc{margin-top:8px;margin-bottom:14px}.dcu-about-dependencies{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,10px)}.dcu-about-dependency{display:flex;align-items:center;gap:12px;min-height:64px;padding:12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dcu-about-dependency:last-child{border-bottom:0}.dcu-about-copy{min-width:0;flex:1}.dcu-about-name{font-size:13px;line-height:20px;font-weight:600}.dcu-about-package{overflow:hidden;margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.dcu-about-status{display:flex;align-items:center;gap:5px;font-size:12px}.dcu-about-status[data-installed=true]{color:var(--dsw-alias-state-success-primary)}.dcu-about-status[data-installed=false]{color:var(--dsw-alias-state-error-primary)}.dcu-about-status[data-update=true]{color:var(--dsw-alias-state-warning-primary)}.dcu-about-install{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:6px 9px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}.dcu-about-install:hover:not(:disabled){background:var(--dsw-specific-menu-item-hover)}.dcu-about-install:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dcu-about-install:disabled{cursor:default;opacity:.4}.dcu-about-install[aria-busy=true]{pointer-events:none}.dcu-about-update-all{min-height:30px;padding:4px 10px;font-weight:500;border-color:var(--dsw-alias-border-l3)}.dcu-about-progress{position:relative;margin-top:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:10px 14px 12px;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;gap:10px;font-size:12px;overflow:hidden}.dcu-about-progress code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-secondary)}.dcu-about-progress-pct{flex:none;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-weight:500}.dcu-about-progress-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--dsw-alias-border-l2);overflow:hidden}.dcu-about-progress-fill{height:100%;background:var(--dsw-alias-state-business-primary);transition:width 200ms ease}.dcu-about-progress-fill[data-wave=true]{width:40%;animation:dcu-progress-wave 1.4s ease-in-out infinite}@keyframes dcu-progress-wave{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}.dcu-about-message{margin-top:16px;border-radius:8px;padding:10px 14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;border:1px solid var(--dsw-alias-border-l2)}.dcu-about-message[data-error=true]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 30%,transparent)}
.dcu-about-title-row{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}.dcu-about-feedback-links,.dcu-about-links{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.dcu-about-external-link{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap}.dcu-about-external-link:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dcu-about-external-link:focus-visible{outline:2px solid var(--dsw-alias-state-success-primary);outline-offset:2px}.dcu-about-external-link svg{flex:none}@media(max-width:720px){.dcu-about-title-row{flex-wrap:wrap}}
.dcu-about-version{margin-left:8px;color:var(--dsw-alias-label-tertiary);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;letter-spacing:0;white-space:nowrap;vertical-align:baseline}
.dcu-about-project-link{color:inherit;text-decoration:none}.dcu-about-project-link:hover{text-decoration:underline;text-underline-offset:3px}.dcu-about-project-link:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;border-radius:2px}
.dcu-about-name-row{display:flex;align-items:center;gap:10px;min-width:0}.dcu-about-name-row .dcu-about-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dcu-about-downloads{display:inline-flex;align-items:center;gap:4px;flex:none;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:20px;font-weight:400;font-variant-numeric:tabular-nums;text-decoration:none;white-space:nowrap}.dcu-about-downloads svg{flex:none;opacity:.75}.dcu-about-downloads:hover{color:var(--dsw-alias-label-primary)}.dcu-about-downloads:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px;border-radius:2px}@media(max-width:480px){.dcu-about-dependency{flex-wrap:wrap;gap:8px}.dcu-about-copy{flex-basis:100%}}
`;
		/** 宿主图标库不提供 GitHub 品牌标识，内联后可离线使用并继承当前文字颜色。 */
		function GithubMark16() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fill: "currentColor",
					d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z"
				})
			});
		}
		function isDependencyStatus(value) {
			if (value === null || typeof value !== "object") return false;
			const status = value;
			return MANAGED_DEPENDENCIES.some((dependency) => dependency.id === status.id) && typeof status.packageName === "string" && typeof status.installed === "boolean" && typeof status.updateAvailable === "boolean";
		}
		function isInstallProgress(value) {
			if (value === null || typeof value !== "object") return false;
			const progress = value;
			const phase = progress.phase;
			const total = progress.total;
			const percent = progress.percent;
			const currentPackage = progress.currentPackage;
			return typeof progress.active === "boolean" && typeof progress.target === "string" && typeof progress.seconds === "number" && Number.isInteger(progress.seconds) && progress.seconds >= 0 && typeof progress.lastLine === "string" && (phase === null || typeof phase === "string" && PROGRESS_PHASES.has(phase)) && typeof progress.done === "number" && Number.isInteger(progress.done) && progress.done >= 0 && (total === null || typeof total === "number" && Number.isInteger(total) && total >= 0) && (percent === null || typeof percent === "number" && Number.isFinite(percent) && percent >= 0 && percent <= 100) && (currentPackage === null || typeof currentPackage === "string");
		}
		function progressLabel(progress, t) {
			if (progress.phase !== null) {
				const current = progress.currentPackage === null || progress.currentPackage === "" ? "" : ` · ${progress.currentPackage}`;
				const done = progress.done > 0 ? ` · ${t("about.packagesDone").replace("{0}", String(progress.done))}` : "";
				return `${t(`about.progress.${progress.phase}`)}${current}${done}`;
			}
			if (progress.lastLine !== "") return `${progress.lastLine}  (${progress.seconds}s)`;
			return t("about.progressHint");
		}
		/** Codex UI 的功能说明、配套管理插件状态与受限安装入口。 */
		function AboutSection({ t }) {
			const [dependencies, setDependencies] = (0, react.useState)([]);
			const [state, setState] = (0, react.useState)("loading");
			const [installing, setInstalling] = (0, react.useState)();
			const [progress, setProgress] = (0, react.useState)();
			const [message, setMessage] = (0, react.useState)();
			const [refreshFailed, setRefreshFailed] = (0, react.useState)(false);
			const [loadFailure, setLoadFailure] = (0, react.useState)();
			const alive = (0, react.useRef)(true);
			const root = (0, react.useRef)(null);
			const stateRef = (0, react.useRef)("loading");
			const requestId = (0, react.useRef)(0);
			const installingRef = (0, react.useRef)();
			stateRef.current = state;
			(0, react.useEffect)(() => {
				alive.current = true;
				return () => {
					alive.current = false;
				};
			}, []);
			const load = (0, react.useCallback)(async (signal) => {
				const currentRequest = ++requestId.current;
				if (stateRef.current !== "ready") setState("loading");
				try {
					const response = await fetch(endpoint, {
						cache: "no-store",
						signal
					});
					if (!response.ok) throw new BusinessRequestError(response.status);
					const payload = await response.json();
					if (signal?.aborted || currentRequest !== requestId.current) return;
					if (!Array.isArray(payload.dependencies) || !payload.dependencies.every(isDependencyStatus)) throw new Error();
					setDependencies(payload.dependencies);
					setState("ready");
					setRefreshFailed(false);
					setLoadFailure(void 0);
				} catch (error) {
					if (signal?.aborted || error instanceof DOMException && error.name === "AbortError" || currentRequest !== requestId.current) return;
					setLoadFailure(error);
					if (stateRef.current === "ready") setRefreshFailed(true);
					else setState("failed");
				}
			}, []);
			(0, react.useEffect)(() => {
				const node = root.current;
				const controller = new AbortController();
				const refresh = () => {
					load(controller.signal);
				};
				refresh();
				if (node === null || typeof IntersectionObserver === "undefined") return () => {
					controller.abort();
				};
				let initialized = false;
				let wasVisible = false;
				const observer = new IntersectionObserver((entries) => {
					const visible = entries.some((entry) => entry.isIntersecting);
					if (!initialized) {
						initialized = true;
						wasVisible = visible;
						return;
					}
					if (visible && !wasVisible) refresh();
					wasVisible = visible;
				}, { threshold: .2 });
				observer.observe(node);
				return () => {
					controller.abort();
					observer.disconnect();
				};
			}, [load]);
			(0, react.useEffect)(() => {
				if (installing === void 0) {
					setProgress(void 0);
					return;
				}
				let cancelled = false;
				const pull = async () => {
					try {
						const response = await fetch(`${endpoint}?action=progress`, { cache: "no-store" });
						const payload = await response.json();
						if (cancelled || !response.ok || !isInstallProgress(payload.progress)) return;
						setProgress(payload.progress);
					} catch {
						if (!cancelled) return;
					}
				};
				pull();
				const timer = window.setInterval(() => {
					pull();
				}, 800);
				return () => {
					cancelled = true;
					window.clearInterval(timer);
				};
			}, [installing]);
			const install = async (id) => {
				if (installingRef.current !== void 0) return;
				installingRef.current = id;
				setInstalling(id);
				setMessage(void 0);
				try {
					const response = await fetch(`${endpoint}?dependency=${encodeURIComponent(id)}`, { method: "POST" });
					if ([
						401,
						403,
						503
					].includes(response.status)) throw new BusinessRequestError(response.status);
					const payload = await response.json();
					if (!response.ok || !Array.isArray(payload.dependencies) || !payload.dependencies.every(isDependencyStatus)) throw new Error(typeof payload.error === "string" ? payload.error : t("about.installFailed"));
					if (!alive.current) return;
					setDependencies(payload.dependencies);
					setState("ready");
					setRefreshFailed(false);
					setMessage({
						error: false,
						text: payload.autoReload === false ? t("about.restartManually") : t("about.restartRequired")
					});
				} catch (error) {
					if (!alive.current) return;
					setMessage({
						error: true,
						text: installErrorText(error, t)
					});
				} finally {
					installingRef.current = void 0;
					if (alive.current) setInstalling(void 0);
				}
			};
			const updateAll = async () => {
				if (installingRef.current !== void 0) return;
				installingRef.current = "all";
				setInstalling("all");
				setMessage(void 0);
				try {
					const response = await fetch(`${endpoint}?action=update-all`, { method: "POST" });
					if ([
						401,
						403,
						503
					].includes(response.status)) throw new BusinessRequestError(response.status);
					const payload = await response.json();
					if (!response.ok || !Array.isArray(payload.dependencies) || !payload.dependencies.every(isDependencyStatus)) throw new Error(typeof payload.error === "string" ? payload.error : t("about.installFailed"));
					if (!alive.current) return;
					setDependencies(payload.dependencies);
					setState("ready");
					setRefreshFailed(false);
					setMessage({
						error: false,
						text: payload.restartRequired === false ? t("about.upToDate") : payload.autoReload === false ? t("about.restartManually") : t("about.restartRequired")
					});
				} catch (error) {
					if (!alive.current) return;
					setMessage({
						error: true,
						text: installErrorText(error, t)
					});
				} finally {
					installingRef.current = void 0;
					if (alive.current) setInstalling(void 0);
				}
			};
			const actionableCount = dependencies.filter((dependency) => !dependency.installed || dependency.updateAvailable).length;
			const selfVersion = dependencies.find((dependency) => dependency.id === "ui")?.version;
			const title = (id) => t(`about.dependency.${id}`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				ref: root,
				className: "dcu-about",
				"aria-label": t("about.nav"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: stylesheet$2 }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-head",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-about-title-block",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-about-title-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h2", {
									className: "dcu-about-title",
									children: [t("about.title"), selfVersion === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dcu-about-version",
										children: ["v", selfVersion]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-about-feedback-links dcu-about-links",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GithubMark16, {}),
											"aria-label": t("about.viewProject"),
											onClick: () => {
												openExternal("https://github.com/UncleDylan/dsh-codex-ui");
											},
											children: t("about.viewProject")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconListPenOutlineMedium, { size: 14 }),
											"aria-label": t("about.feedback"),
											onClick: () => {
												openExternal("https://github.com/UncleDylan/dsh-codex-ui/issues");
											},
											children: t("about.feedback")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											icon: state === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLoadingOutlineMedium, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconRefreshOutlineMedium, { size: 14 }),
											"aria-label": t("about.checkUpdate"),
											disabled: state === "loading" || installing !== void 0,
											onClick: () => {
												load();
											},
											children: state === "loading" ? t("about.checking") : t("about.checkUpdate")
										})
									]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dcu-about-desc dcu-about-intro",
								children: t("about.description")
							})]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("about.features") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
						className: "dcu-about-features",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.sidebar") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.search") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.workspace") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.sessions") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.conversation") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("about.feature.navigator") })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-about-dependencies-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("about.dependencies") }), state === "ready" && actionableCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							className: "dcu-about-install dcu-about-update-all",
							type: "button",
							"aria-busy": installing === "all",
							disabled: installing !== void 0,
							onClick: () => {
								updateAll();
							},
							children: [installing === "all" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLoadingOutlineMedium, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconDownloadOutlineMedium, { size: 14 }), installing === "all" ? t("about.updatingAll") : t("about.updateAll")]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dcu-about-intro",
						children: t("about.dependenciesDescription")
					}),
					state === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-message",
						role: "status",
						children: t("about.loading")
					}) : state === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-message",
						"data-error": "true",
						role: "alert",
						children: t(businessRequestErrorKey(loadFailure) ?? "about.statusFailed")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-dependencies",
						"aria-busy": installing !== void 0,
						children: dependencies.map((dependency) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
							className: "dcu-about-dependency",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-about-copy",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dcu-about-name-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
											className: "dcu-about-name dcu-about-project-link",
											href: PROJECT_HOMEPAGES[dependency.id],
											target: "_blank",
											rel: "noreferrer",
											children: title(dependency.id)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
											className: "dcu-about-downloads",
											href: `https://www.npmjs.com/package/${dependency.packageName}`,
											target: "_blank",
											rel: "noreferrer",
											title: t("about.downloadsSource"),
											"aria-label": `${dependency.packageName} · ${t("about.totalDownloads")} · ${typeof dependency.totalDownloads === "number" && Number.isSafeInteger(dependency.totalDownloads) && dependency.totalDownloads >= 0 ? dependency.totalDownloads.toLocaleString() : t("about.downloadsUnavailable")}`,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconDownloadOutlineMedium, {
												size: 12,
												"aria-hidden": "true"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dcu-about-downloads-count",
												children: typeof dependency.totalDownloads === "number" && Number.isSafeInteger(dependency.totalDownloads) && dependency.totalDownloads >= 0 ? dependency.totalDownloads.toLocaleString() : "—"
											})]
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dcu-about-package",
										title: dependency.packageName,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
												className: "dcu-about-project-link",
												href: PROJECT_HOMEPAGES[dependency.id],
												target: "_blank",
												rel: "noreferrer",
												children: dependency.packageName
											}),
											dependency.version === void 0 ? "" : ` · ${dependency.version}`,
											dependency.updateAvailable && dependency.latestVersion !== void 0 ? ` → ${dependency.latestVersion}` : ""
										]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-about-status",
									"data-installed": dependency.installed,
									"data-update": dependency.updateAvailable,
									children: [dependency.installed && !dependency.updateAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCheckOutlineMedium, { size: 14 }), dependency.updateAvailable ? t("about.updateAvailable") : dependency.installed ? t("about.installed") : t("about.missing")]
								}),
								(!dependency.installed || dependency.updateAvailable) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									className: "dcu-about-install",
									type: "button",
									disabled: installing !== void 0,
									onClick: () => {
										install(dependency.id);
									},
									children: [installing === dependency.id ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLoadingOutlineMedium, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconDownloadOutlineMedium, { size: 14 }), installing === dependency.id ? t("about.installing") : dependency.updateAvailable ? t("about.update") : t("about.install")]
								})
							]
						}, dependency.id))
					}),
					installing !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-about-progress",
						role: "status",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLoadingOutlineMedium, { size: 14 }) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: progress === void 0 ? t("about.progressHint") : progressLabel(progress, t) }),
							progress?.percent !== null && progress?.percent !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dcu-about-progress-pct",
								children: [progress.percent, "%"]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-about-progress-bar",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-about-progress-fill",
									"data-wave": progress?.percent === null || progress?.percent === void 0,
									style: progress?.percent === null || progress?.percent === void 0 ? void 0 : { width: `${progress.percent}%` }
								})
							})
						]
					}),
					refreshFailed && state === "ready" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-message",
						"data-error": "true",
						role: "status",
						children: t(businessRequestErrorKey(loadFailure) ?? "about.refreshFailed")
					}),
					message !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-about-message",
						"data-error": message.error,
						role: message.error ? "alert" : "status",
						children: message.text
					})
				]
			});
		}
		//#endregion
		//#region src/client/ConnectorsSection.tsx
		const MCP_CONNECTOR_UI = "/mcp-connector/ui/";
		const PROMPT_REQUEST_TYPE = "mcp-connector:start-session";
		const PROMPT_RESULT_TYPE = "mcp-connector:start-session-result";
		const stylesheet$1 = `
.dcu-connectors{color:var(--dsw-alias-label-primary)}.dcu-connectors h2{margin:0;font-size:18px}.dcu-connectors p{margin:6px 0 18px;color:var(--dsw-alias-label-secondary);font-size:12px}.dcu-connector-frame{display:block;width:100%;height:clamp(420px,calc(100vh - 160px),700px);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-base);color-scheme:light dark}.dcu-connector-list{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:9px}.dcu-connector{padding:12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dcu-connector:last-child{border-bottom:0}.dcu-connector-head{display:flex;align-items:center;gap:8px;font-weight:650}.dcu-connector-meta{margin:3px 0 8px;color:var(--dsw-alias-label-tertiary);font-size:11px}.dcu-connector-tool{padding:5px 0 0 24px;color:var(--dsw-alias-label-secondary);font-size:12px}.dcu-connector-tool span{display:block;margin-top:1px;color:var(--dsw-alias-label-tertiary);font-size:11px}.dcu-connector-empty{padding:20px 8px;color:var(--dsw-alias-label-secondary);text-align:center}
`;
		const frameLightTheme = `:root{color-scheme:light;--bg:#fff;--card:#f9f9f9;--line:rgba(13,13,13,.08);--text:#181818;--text-2:#5d5d5d;--muted:#8f8f8f;--accent:#181818;--accent-hover:#000;--accent-light:#f0f0f0;--dcu-action:#181818;--dcu-action-hover:#000;--dcu-on-action:#fff;--ok:#059669;--ok-bg:#ecfdf5;--warn:#d97706;--warn-bg:#fffbeb;--bad:#dc2626;--bad-bg:#fef2f2;--shadow:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.06);--shadow-lg:0 10px 25px rgba(0,0,0,.1)}`;
		const frameDarkTheme = `:root{color-scheme:dark;--bg:#0d0d0d;--card:#181818;--line:#212121;--text:#ededed;--text-2:#afafaf;--muted:#8f8f8f;--accent:#ededed;--accent-hover:#fff;--accent-light:#212121;--dcu-action:#2f2f2f;--dcu-action-hover:#3a3a3a;--dcu-on-action:#ededed;--ok:#34d399;--ok-bg:#0d3027;--warn:#fbbf24;--warn-bg:#35280b;--bad:#f87171;--bad-bg:#3b171b;--shadow:0 1px 3px rgba(0,0,0,.35);--shadow-lg:0 16px 35px rgba(0,0,0,.45)}`;
		const frameSurfaceTheme = `
.card.featured{border-color:var(--line)}
.card:hover,.card.featured:hover{border-color:var(--muted)}
.btn:not(.ghost):not(.danger):not(.status-warning):not(.status-bad),.icon-btn.primary,.btn-primary,.prompt-item .send-btn{background:var(--dcu-action);border-color:var(--dcu-action);color:var(--dcu-on-action)}
.btn:not(.ghost):not(.danger):not(.status-warning):not(.status-bad):hover,.icon-btn.primary:hover,.btn-primary:hover,.prompt-item .send-btn:hover{background:var(--dcu-action-hover);border-color:var(--dcu-action-hover)}
`;
		function isConnector(value) {
			if (value === null || typeof value !== "object") return false;
			const item = value;
			return typeof item.name === "string" && Array.isArray(item.tools) && item.tools.every((tool) => tool !== null && typeof tool === "object" && typeof tool.name === "string" && typeof tool.description === "string");
		}
		function isPromptRequest(value) {
			if (value === null || typeof value !== "object") return false;
			const item = value;
			return item.type === PROMPT_REQUEST_TYPE && typeof item.requestId === "string" && item.requestId !== "" && typeof item.prompt === "string" && item.prompt.trim() !== "";
		}
		function syncFrameTheme(frame) {
			const doc = frame?.contentDocument;
			if (doc === null || doc === void 0) return;
			let style = doc.head.querySelector("style[data-uncledylan-host-theme]");
			if (style === null) {
				style = doc.createElement("style");
				style.dataset.uncledylanHostTheme = "true";
				doc.head.append(style);
			}
			style.textContent = (document.body.hasAttribute("data-ds-dark-theme") ? frameDarkTheme : frameLightTheme) + frameSurfaceTheme;
		}
		function ConnectorMarket({ startPromptSession, t }) {
			const frameRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onMessage = (event) => {
					const frameWindow = frameRef.current?.contentWindow;
					if (event.origin !== window.location.origin || frameWindow === null || frameWindow === void 0 || event.source !== frameWindow) return;
					if (!isPromptRequest(event.data)) return;
					const { requestId, prompt } = event.data;
					const reply = (ok, message) => {
						frameWindow.postMessage({
							type: PROMPT_RESULT_TYPE,
							requestId,
							ok,
							message
						}, window.location.origin);
					};
					startPromptSession(prompt).then(() => {
						reply(true, t("connectors.promptReady"));
					}, (error) => {
						reply(false, userErrorText(error, t));
					});
				};
				const syncTheme = () => {
					syncFrameTheme(frameRef.current);
				};
				const observer = new MutationObserver(syncTheme);
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				window.addEventListener("message", onMessage);
				return () => {
					observer.disconnect();
					window.removeEventListener("message", onMessage);
				};
			}, [startPromptSession, t]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
				ref: frameRef,
				className: "dcu-connector-frame",
				src: MCP_CONNECTOR_UI,
				title: t("connectors.title"),
				onLoad: () => {
					syncFrameTheme(frameRef.current);
				}
			});
		}
		function NativeConnectorList({ sessionStore, t }) {
			const sessionId = (0, react.useSyncExternalStore)(sessionStore.subscribe, () => currentSessionId(sessionStore.getSnapshot()));
			const [connectors, setConnectors] = (0, react.useState)([]);
			const [state, setState] = (0, react.useState)("loading");
			const [failure, setFailure] = (0, react.useState)();
			(0, react.useEffect)(() => {
				if (sessionId === void 0) {
					setConnectors([]);
					setState("ready");
					return;
				}
				const controller = new AbortController();
				setState("loading");
				fetch(`${CODEX_UI_API_ENDPOINTS.connectors}?sessionId=${encodeURIComponent(sessionId)}`, { signal: controller.signal }).then(async (response) => {
					if (!response.ok) throw new BusinessRequestError(response.status);
					const payload = await response.json();
					if (!Array.isArray(payload.connectors) || !payload.connectors.every(isConnector)) throw new Error("连接器目录返回格式无效。");
					if (!controller.signal.aborted) setConnectors(payload.connectors);
				}).then(() => {
					if (!controller.signal.aborted) setState("ready");
				}).catch((error) => {
					if (!controller.signal.aborted) {
						setFailure(error);
						setState("failed");
					}
				});
				return () => {
					controller.abort();
				};
			}, [sessionId]);
			if (sessionId === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dcu-connector-empty",
				children: t("connectors.openSession")
			});
			if (state === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dcu-connector-empty",
				children: t("connectors.loading")
			});
			if (state === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dcu-connector-empty",
				role: "alert",
				children: t(businessRequestErrorKey(failure) ?? "connectors.failed")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-connector-list",
				children: [connectors.map((connector) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
					className: "dcu-connector",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-connector-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLinkOutlineMedium, { size: 16 }), connector.name]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-connector-meta",
							children: t("connectors.toolCount", { count: connector.tools.length })
						}),
						connector.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-connector-tool",
							children: [tool.name, tool.description !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tool.description })]
						}, tool.name))
					]
				}, connector.name)), connectors.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-connector-empty",
					children: t("connectors.empty")
				})]
			});
		}
		/** 安装 dsh-mcp-connector 时显示完整市场，否则回退到当前会话的 MCP 工具目录。 */
		function ConnectorsSection({ sessionStore, startPromptSession, t }) {
			const [marketAvailable, setMarketAvailable] = (0, react.useState)();
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				fetch(MCP_CONNECTOR_UI, {
					method: "GET",
					cache: "no-store",
					signal: controller.signal
				}).then((response) => {
					response.body?.cancel().catch(() => {});
					if (!controller.signal.aborted) setMarketAvailable(response.ok);
				}).catch(() => {
					if (!controller.signal.aborted) setMarketAvailable(false);
				});
				return () => {
					controller.abort();
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-connectors",
				"aria-label": t("connectors.title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: stylesheet$1 }), marketAvailable === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-connector-empty",
					children: t("connectors.loading")
				}) : marketAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConnectorMarket, {
					startPromptSession,
					t
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("connectors.title") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("connectors.description") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NativeConnectorList, {
						sessionStore,
						t
					})
				] })]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** 本插件独占的界面文案命名空间。 */
		const NS = "uncledylan.codexUi";
		const zh = {
			"workspace.addFailed": "无法添加工作区",
			"workspace.add": "添加工作区",
			"workspace.retry": "重试",
			"workspace.chooseAgain": "重新选择",
			"navigation.back": "后退",
			"navigation.forward": "前进",
			"home.resizeInput": "拖动调整输入区宽度",
			"home.projectSearch": "搜索项目",
			"home.projectEmpty": "没有匹配的项目",
			"home.heroQuestion": "我们应该在{name}中做些什么？",
			"home.heroQuestionEmpty": "我们应该做些什么？",
			"settings.title": "设置",
			"settings.back": "返回应用",
			"settings.openDocument": "打开配置文件",
			"settings.advanced": "高级",
			"settings.documentTitle": "配置文件",
			"settings.documentDescription": "在外部编辑器中查看和编辑配置",
			"settings.documentOpen": "打开",
			"settings.documentOpening": "打开中…",
			"settings.developerTools.title": "显示代码工作视图",
			"settings.developerTools.description": "开启后，显示轨迹、本轮代码差异，可选择完整的 Agent 预设切换",
			"settings.developerTools.error": "保存失败，请重试",
			"settings.openDocumentError": "无法打开配置文件",
			"settings.search": "搜索设置…",
			"settings.personal": "个人",
			"settings.integrations": "集成",
			"settings.pluginConfig": "插件管理",
			"settings.records": "记录与应用",
			"settings.general": "常规",
			"settings.permissions": "权限",
			"settings.editor": "编辑器",
			"settings.noResults": "没有匹配的设置分类",
			"settings.filterHint": "仅筛选导航，选择分类后切换当前页面。",
			"settings.disconnected": "连接异常",
			"settings.reconnect": "立即重连",
			"settings.connecting": "连接中",
			"settings.recovered": "连接成功",
			"input.historyHint": "↑↓ 翻历史",
			"sidebar.label": "DSH 导航",
			"sidebar.expand": "展开侧边栏",
			"sidebar.collapse": "收缩侧边栏",
			"sidebar.home": "主页",
			"sidebar.newTask": "新建任务",
			"sidebar.search": "搜索会话",
			"sidebar.mainMenu": "主菜单",
			"sidebar.extensions": "扩展管理",
			"sidebar.experts": "专家",
			"sidebar.skills": "技能",
			"sidebar.plugins": "插件管理",
			"sidebar.marketplace": "插件市场",
			"sidebar.builtinPlugins": "内置插件",
			"sidebar.connectors": "连接器",
			"sidebar.pin": "固定到侧边栏",
			"sidebar.unpin": "取消固定",
			"sidebar.schedule": "定时任务",
			"sidebar.assistant": "IM助理",
			"sidebar.imSettings": "IM助理",
			"sidebar.channelsTab": "频道",
			"sidebar.scheduleTab": "定时",
			"sidebar.imageStudio": "生图",
			"sidebar.runsTab": "记录",
			"sidebar.overviewTab": "任务",
			"channels.empty": "还没有频道会话。先在设置 → IM助理 里连接渠道。",
			"channels.loadError": "无法读取频道会话。",
			"channel.dingtalk": "钉钉",
			"channel.feishu": "飞书",
			"channel.lark": "Lark",
			"channel.weixin": "微信",
			"channel.wecom": "企业微信",
			"channel.qq": "QQ",
			"channel.telegram": "Telegram",
			"channel.unknown": "频道",
			"schedule.empty": "还没有定时任务运行记录。",
			"schedule.groupActions": "{name} 的任务操作",
			"schedule.taskSettings": "任务设置",
			"schedule.archiveGroup": "归档整组会话",
			"schedule.archiveGroupConfirm": "确认归档",
			"schedule.archiveGroupDescription": "将归档“{name}”下的 {count} 个会话。归档后可以在“设置 → 已归档”中恢复。",
			"schedule.archiveGroupPending": "正在归档整组会话…",
			"schedule.archiveGroupPartial": "已归档 {archived} 个会话，另有 {failed} 个失败。可以重试剩余会话。",
			"studio.title": "图像",
			"studio.tabTemplates": "模板",
			"studio.tabHistory": "记录",
			"studio.describePlaceholder": "描述新图像…",
			"studio.generate": "生成",
			"studio.generating": "生成中…",
			"studio.cancel": "取消",
			"studio.retry": "重试",
			"studio.download": "下载",
			"studio.copyPrompt": "复制 Prompt",
			"studio.copied": "已复制",
			"studio.editFrom": "以此图编辑",
			"studio.editMode": "以图编辑",
			"studio.removeReference": "移除参考图",
			"studio.historyEmpty": "还没有生成记录。描述一张图像开始创作。",
			"studio.templatesLoading": "灵感模板加载中…",
			"studio.templatesLoadError": "灵感模板加载失败。",
			"studio.generateFailed": "生成失败",
			"studio.allCategories": "全部",
			"studio.pluginUnavailable": "生图服务不可用：请确认已安装并配置 dsh-image-gen 插件。",
			"studio.workbench": "工作台",
			"studio.workbenchHint": "打开 dsh-image-gen 原版工作台（无限画布 + 生成面板）",
			"search.placeholder": "搜索会话、设置和操作",
			"search.empty": "没有匹配的结果。",
			"search.sessions": "会话",
			"search.settings": "设置",
			"search.actions": "快捷操作",
			"workspace.label": "工作区会话",
			"workspace.pinned": "置顶",
			"workspace.pinnedEmpty": "拖动项目到此处置顶",
			"workspace.projects": "项目",
			"workspace.ungrouped": "未分组",
			"workspace.createGroup": "新建分组",
			"workspace.createGroupDescription": "输入分组名称，项目不会自动移动。",
			"workspace.groupName": "分组名称",
			"workspace.moveToGroup": "移动到分组",
			"workspace.removeFromGroup": "移至未分组",
			"workspace.deleteGroup": "删除分组“{name}”",
			"workspace.deleteGroupAction": "删除分组",
			"workspace.deleteGroupDescription": "删除分组只会将其中项目移至未分组，不会删除项目或会话。",
			"workspace.groupActions": "分组“{name}”的操作",
			"workspace.renameGroup": "重命名分组",
			"workspace.recent": "最近",
			"workspace.recentEmpty": "无聊天",
			"workspace.noChat": "暂无聊天",
			"workspace.showMore": "展开显示",
			"workspace.empty": "暂无项目",
			"workspace.newSession": "新建会话",
			"workspace.rename": "重命名项目",
			"workspace.pin": "置顶项目",
			"workspace.unpin": "取消置顶",
			"workspace.archive": "归档所有会话",
			"workspace.archiveTitle": "归档 {count} 个会话？",
			"workspace.archiveDescription": "这会归档“{name}”中的全部会话，项目和文件夹仍会保留。",
			"workspace.archiveConfirm": "全部归档",
			"workspace.archivePending": "正在归档会话…",
			"workspace.openPath": "在资源管理器中打开",
			"workspace.delete": "移除项目",
			"workspace.deleteDescription": "将把“{name}”从项目列表中移除。文件夹和会话记录会保留。",
			"workspace.deletePending": "正在移除项目…",
			"workspace.actions": "{name} 的项目操作",
			"workspace.taskCount": "{count} 个任务",
			"workspace.taskSummary": "{count} 个任务 · {unreadCount} 条未读",
			"workspace.edit": "重命名项目",
			"sessions.close": "关闭",
			"sessions.cancel": "取消",
			"sessions.save": "保存",
			"sessions.failed": "操作失败：{message}",
			"sessions.unknown": "找不到该会话。",
			"sessions.actions": "{name} 的会话操作",
			"sessions.markUnread": "标记为未读",
			"sessions.markRead": "标记为已读",
			"sessions.unread": "未读",
			"sessions.waitingAnswer": "等待回答",
			"sessions.waitingApproval": "等待审批",
			"sessions.planReview": "计划待审",
			"sessions.rename": "重命名会话",
			"sessions.renameDescription": "保持简短且易于识别",
			"sessions.renameInvalid": "会话名称无效，请修改后重试。",
			"sessions.renameFailed": "暂时无法重命名该会话，请稍后重试。",
			"sessions.archive": "归档会话",
			"sessions.archiveFailed": "暂时无法归档该会话，请稍后重试。",
			"sessions.delete": "删除会话",
			"sessions.deleteDescription": "将永久删除会话“{name}”及其全部记录，此操作不可恢复。",
			"sessions.deletePending": "正在删除会话…",
			"sessions.deleteUnavailable": "未安装或无法连接归档管理插件。",
			"sessions.deleteFailed": "暂时无法删除该会话，请稍后重试。",
			"sessions.fork": "在新会话中继续",
			"sessions.forkUnavailable": "当前会话暂时无法在新会话中继续，请等待本轮结束后重试。",
			"sessions.forkFailed": "暂时无法创建新会话，请稍后重试。",
			"sessions.openPath": "在资源管理器中打开",
			"sessions.moveWorkspace": "项目",
			"sessions.moveUnavailable": "会话移动服务暂不可用，请重启 DSH 后重试。",
			"sessions.moveUnauthorized": "登录状态已失效，请刷新页面并重新登录。",
			"sessions.moveForbidden": "当前访问地址不受信任，或请求来源已被拒绝。",
			"sessions.moveNotFound": "会话或目标项目已不存在，请刷新后重试。",
			"sessions.moveSubagent": "子代理会话不能移动到其他项目。",
			"sessions.moveBusy": "该会话正在移动，请稍后重试。",
			"sessions.moveRollbackFailed": "会话移动失败，自动恢复未完整完成，请查看 DSH 服务端日志。",
			"sessions.moveFailed": "暂时无法移动该会话，原会话已保留。",
			"sessions.moveConfirmTitle": "将会话移至“{project}”？",
			"sessions.moveConfirmDescription": "“{name}”将移动到此项目，工作目录也会随之更改。",
			"sessions.moveConfirmAction": "移动",
			"sessions.movePending": "正在移动会话…",
			"sessions.copyPath": "复制工作目录",
			"sessions.copyTitle": "复制会话标题",
			"sessions.copyId": "复制会话 ID",
			"connectors.title": "连接器",
			"connectors.description": "显示当前会话可用的 MCP 连接器及其工具，不显示地址、命令或凭证。",
			"connectors.openSession": "请先打开一个会话以读取连接器。",
			"connectors.loading": "正在读取连接器…",
			"connectors.failed": "连接器目录暂不可用，请稍后重试。",
			"connectors.toolCount": "{count} 个工具",
			"connectors.empty": "当前会话没有可用的 MCP 连接器。",
			"connectors.promptReady": "已带入新会话",
			"connectors.promptRequired": "Prompt 不能为空。",
			"connectors.workspacesLoading": "DSH 工作区数据尚未就绪，请稍后重试。",
			"connectors.workspaceRequired": "请先选择一个工作区，再使用示例 Prompt。",
			"connectors.workspaceUnavailable": "DSH 工作区服务尚未就绪，请稍后重试。",
			"connectors.conversationUnavailable": "DSH 对话服务尚未就绪，请稍后重试。",
			"connectors.sessionPending": "新会话尚未就绪，请稍后重试。",
			"about.nav": "Codex UI",
			"about.title": "Codex UI",
			"about.viewProject": "GitHub",
			"about.feedback": "问题反馈",
			"about.checkUpdate": "检查更新",
			"about.checking": "正在检查更新…",
			"about.description": "为 DSH 提供 Codex 风格的侧栏、工作区会话管理、搜索与会话轮次导航。",
			"about.features": "基本功能",
			"about.feature.sidebar": "Codex 风格侧栏、全局会话搜索与设置入口",
			"about.feature.search": "通过顶部搜索快速定位会话、设置页面和新建任务等快捷操作",
			"about.feature.workspace": "项目文件夹可展开、折叠、拖拽排序和置顶，并保留原生工作区能力",
			"about.feature.sessions": "会话支持重命名、置顶、未读标记、归档、删除及右键快捷操作",
			"about.feature.conversation": "保留原生消息、工具调用、输入、权限和模型选择，仅调整容器视觉",
			"about.feature.navigator": "当前会话提供轮次缩略导航，可快速跳转至每一次用户提问",
			"about.dependencies": "配套管理插件",
			"about.dependenciesDescription": "每个配套插件都可单独安装和更新，也可一键安装缺失项并更新旧版本。可分别检查 Codex UI、专家、技能、归档、IM、定时任务、BTW、Simplify、PUA、代码审查、宠物和应用市场。",
			"about.loading": "正在读取依赖安装状态…",
			"about.statusFailed": "暂时无法读取依赖安装状态。",
			"about.refreshFailed": "依赖状态刷新失败，当前显示上次成功读取的结果。",
			"about.installed": "已安装",
			"about.missing": "未安装",
			"about.updateAvailable": "可更新",
			"about.install": "安装",
			"about.update": "更新",
			"about.installing": "安装中",
			"about.updateAll": "全部安装/更新",
			"about.updatingAll": "安装/更新中",
			"about.upToDate": "所有配套插件均已安装并为最新版本。",
			"about.installFailed": "依赖安装失败，请稍后重试。",
			"about.installUnchanged": "安装命令已结束，但插件没有进入当前 Profile。请重试。",
			"about.installExitDesktop": "请先完全退出 DSH Desktop，再重新打开后更新。",
			"about.installStoreMismatch": "插件目录与 pnpm 仓库不一致。请完全退出 DSH Desktop 后再更新。",
			"about.installExitWeb": "无法覆盖正在运行的插件文件。请停止当前 DSH Web 后，在终端更新插件，再重新启动 DSH Web。",
			"about.installStoreMismatchWeb": "插件目录与 pnpm 仓库不一致。请停止当前 DSH Web 后重试；仍失败时重新安装该 Profile 的依赖。",
			"about.installWebFailed": "插件更新失败。请查看 DSH Web 终端输出后重试。",
			"about.installBuildPolicy": "插件依赖的 pnpm 构建脚本策略尚未确认，请更新 Profile 配置后重试。",
			"about.installPnpmMissing": "当前环境找不到 pnpm，请安装 pnpm 并重启 DSH 后重试。",
			"about.installTimeout": "插件安装超时，请检查网络后重试。",
			"about.installServiceUnavailable": "DSH Desktop 依赖管理服务尚未就绪，请重启后重试。",
			"about.restartRequired": "正在热更新插件，窗口会自动刷新。",
			"about.restartManually": "安装完成。当前 Web 无法自动重启，请重启 DSH Web 后刷新页面。",
			"about.progressHint": "正在安装插件…",
			"about.packagesDone": "已完成 {0} 个包",
			"about.progress.resolving": "解析依赖",
			"about.progress.downloading": "下载中",
			"about.progress.linking": "写入文件",
			"about.progress.building": "构建中",
			"about.dependency.dsh": "DeepSeek Harness",
			"about.dependency.suite": "Codex 套件",
			"about.dependency.ui": "Codex UI",
			"about.dependency.experts": "专家管理",
			"about.dependency.skills": "技能管理",
			"about.dependency.archive": "归档会话",
			"about.dependency.im": "IM助理",
			"about.dependency.schedule": "定时任务",
			"about.dependency.pet": "Codex 宠物",
			"about.dependency.btw": "BTW 旁问",
			"about.dependency.simplify": "Simplify",
			"about.dependency.pua": "PUA",
			"about.dependency.review": "代码审查",
			"about.dependency.market": "应用市场",
			"about.totalDownloads": "npm 累计下载",
			"about.downloadsUnavailable": "暂不可用",
			"about.downloadsSource": "npm 官方统计：自包创建日至昨日的累计下载次数，点击查看 npm 包",
			"turns.label": "当前会话轮次导航",
			"turns.untitled": "未命名提问",
			"turns.jump": "跳转到第 {index} 轮：{summary}",
			"scrollbar.label": "会话滚动条",
			"time.justNow": "刚刚",
			"time.justNowShort": "刚刚",
			"time.minutes": "{count}分",
			"time.hours": "{count}小时",
			"time.days": "{count}天",
			"time.weeks": "{count}周",
			"time.months": "{count}个月",
			"time.years": "{count}年",
			"activity.region": "会话活动",
			"activity.changes": "变更",
			"activity.outputs": "输出内容",
			"activity.sources": "来源",
			"activity.viewChanges": "查看变更",
			"activity.viewAll": "查看全部",
			"activity.collapse": "收起",
			"activity.close": "关闭",
			"activity.countFiles": "{count} 个文件",
			"activity.countSources": "{count} 个来源",
			"errors.unauthorized": "请先登录 DSH，再重试。",
			"errors.forbidden": "请求被安全检查拒绝，请从可信的 DSH 地址重试。",
			"errors.serviceUnavailable": "服务暂不可用，请稍后重试。",
			"workspace.preferencesLocalOnly": "项目偏好尚未同步，当前使用本地缓存。",
			"errors.generic": "操作未完成，请重试。",
			"errors.groupInvalid": "分组信息无效。",
			"errors.workspaceInvalid": "项目标识无效。",
			"errors.groupMissing": "目标分组不存在。",
			"errors.orderAnchorMissing": "排序位置已失效，请重试。",
			"sessionTitle.system": "为编程助手会话生成标题。\n只输出一行，恰好两段：类型｜主题\n类型必须是其中一个：{types}\n主题必须是具体事项，不能重复类型，不要写类型名或空主题。不要写日期或表情，不要引号、前缀、解释或 Markdown。\n主题使用用户消息的语言。",
			"sessionTitle.userFrame": "根据这条用户消息生成会话标题。只返回“类型｜主题”一行，不要第三段，不要重复主题。",
			"sessionTitle.type.feature": "功能",
			"sessionTitle.type.design": "设计",
			"sessionTitle.type.fix": "修复",
			"sessionTitle.type.optimize": "优化",
			"sessionTitle.type.release": "发布",
			"sessionTitle.type.explore": "探索",
			"sessionTitle.type.docs": "文档",
			"sessionTitle.type.research": "研究",
			"meta.locale": "zh-CN"
		};
		const en = {
			"workspace.addFailed": "Could not add workspace",
			"workspace.add": "Add workspace",
			"workspace.retry": "Retry",
			"workspace.chooseAgain": "Choose again",
			"navigation.back": "Back",
			"navigation.forward": "Forward",
			"home.resizeInput": "Drag to resize the input area",
			"home.projectSearch": "Search projects",
			"home.projectEmpty": "No matching projects",
			"home.heroQuestion": "What should we do in {name}?",
			"home.heroQuestionEmpty": "What should we do?",
			"settings.title": "Settings",
			"settings.back": "Back to app",
			"settings.openDocument": "Open configuration file",
			"settings.advanced": "Advanced",
			"settings.documentTitle": "Configuration file",
			"settings.documentDescription": "View and edit configuration in an external editor",
			"settings.documentOpen": "Open",
			"settings.documentOpening": "Opening…",
			"settings.developerTools.title": "Show coding view",
			"settings.developerTools.description": "Shows trajectory, code diffs, and all Agent presets",
			"settings.developerTools.error": "Could not save. Please try again.",
			"settings.openDocumentError": "Could not open configuration file",
			"settings.search": "Search settings…",
			"settings.personal": "Personal",
			"settings.integrations": "Integrations",
			"settings.pluginConfig": "Plugin manager",
			"settings.records": "Records and app",
			"settings.general": "General",
			"settings.permissions": "Permissions",
			"settings.editor": "Editor",
			"settings.noResults": "No matching settings categories",
			"settings.filterHint": "Navigation is filtered. Select a category to switch pages.",
			"settings.disconnected": "Disconnected",
			"settings.reconnect": "Reconnect now",
			"settings.connecting": "Connecting",
			"settings.recovered": "Connected",
			"input.historyHint": "↑↓ History",
			"sidebar.label": "DSH navigation",
			"sidebar.expand": "Expand sidebar",
			"sidebar.collapse": "Collapse sidebar",
			"sidebar.home": "Home",
			"sidebar.newTask": "New task",
			"sidebar.search": "Search conversations",
			"sidebar.mainMenu": "Main menu",
			"sidebar.extensions": "Extensions",
			"sidebar.experts": "Experts",
			"sidebar.skills": "Skills",
			"sidebar.plugins": "Plugin manager",
			"sidebar.marketplace": "Plugin Market",
			"sidebar.builtinPlugins": "Built-in plugins",
			"sidebar.connectors": "Connectors",
			"sidebar.pin": "Pin to sidebar",
			"sidebar.unpin": "Unpin from sidebar",
			"sidebar.schedule": "Scheduled tasks",
			"sidebar.assistant": "IM Assistant",
			"sidebar.imSettings": "IM Assistant",
			"sidebar.channelsTab": "Channels",
			"sidebar.scheduleTab": "Schedule",
			"sidebar.imageStudio": "Images",
			"sidebar.runsTab": "Records",
			"sidebar.overviewTab": "Tasks",
			"channels.empty": "No channel conversations yet. Connect a channel in Settings → IM Assistant.",
			"channels.loadError": "Could not load channel conversations.",
			"channel.dingtalk": "DingTalk",
			"channel.feishu": "Feishu",
			"channel.lark": "Lark",
			"channel.weixin": "WeChat",
			"channel.wecom": "WeCom",
			"channel.qq": "QQ",
			"channel.telegram": "Telegram",
			"channel.unknown": "Channel",
			"schedule.empty": "No scheduled-task runs yet.",
			"schedule.groupActions": "Task actions for {name}",
			"schedule.taskSettings": "Task settings",
			"schedule.archiveGroup": "Archive all conversations",
			"schedule.archiveGroupConfirm": "Archive all",
			"schedule.archiveGroupDescription": "Archive all {count} conversations for “{name}”. You can restore them later in Settings → Archived.",
			"schedule.archiveGroupPending": "Archiving conversations…",
			"schedule.archiveGroupPartial": "Archived {archived} conversations; {failed} failed. You can retry the remaining conversations.",
			"studio.title": "Images",
			"studio.tabTemplates": "Templates",
			"studio.tabHistory": "History",
			"studio.describePlaceholder": "Describe a new image…",
			"studio.generate": "Generate",
			"studio.generating": "Generating…",
			"studio.cancel": "Cancel",
			"studio.retry": "Retry",
			"studio.download": "Download",
			"studio.copyPrompt": "Copy prompt",
			"studio.copied": "Copied",
			"studio.editFrom": "Edit from this image",
			"studio.editMode": "Edit from image",
			"studio.removeReference": "Remove reference image",
			"studio.historyEmpty": "No generations yet. Describe an image to get started.",
			"studio.templatesLoading": "Loading inspiration templates…",
			"studio.templatesLoadError": "Failed to load inspiration templates.",
			"studio.generateFailed": "Generation failed",
			"studio.allCategories": "All",
			"studio.pluginUnavailable": "Image service unavailable: make sure the dsh-image-gen plugin is installed and configured.",
			"studio.workbench": "Workbench",
			"studio.workbenchHint": "Open the original dsh-image-gen workbench (infinite canvas + generation panel)",
			"search.placeholder": "Search conversations, settings, and actions",
			"search.empty": "No matching results.",
			"search.sessions": "Conversations",
			"search.settings": "Settings",
			"search.actions": "Quick actions",
			"workspace.label": "Workspace conversations",
			"workspace.projects": "Projects",
			"workspace.ungrouped": "Ungrouped",
			"workspace.createGroup": "Create group",
			"workspace.createGroupDescription": "Enter a group name. Projects will not move automatically.",
			"workspace.groupName": "Group name",
			"workspace.moveToGroup": "Move to group",
			"workspace.removeFromGroup": "Move to ungrouped",
			"workspace.deleteGroup": "Delete group {name}",
			"workspace.deleteGroupAction": "Delete group",
			"workspace.deleteGroupDescription": "Deleting this group moves its projects to Ungrouped. It does not delete projects or conversations.",
			"workspace.groupActions": "Actions for group {name}",
			"workspace.renameGroup": "Rename group",
			"workspace.recent": "Recents",
			"workspace.recentEmpty": "No chats",
			"workspace.noChat": "No chats",
			"workspace.showMore": "Show more",
			"workspace.empty": "No projects",
			"workspace.newSession": "New conversation",
			"workspace.rename": "Rename project",
			"workspace.pin": "Pin project",
			"workspace.unpin": "Unpin",
			"workspace.archive": "Archive all conversations",
			"workspace.archiveTitle": "Archive {count} conversations?",
			"workspace.archiveDescription": "This archives every conversation in “{name}”. The project and folder remain available.",
			"workspace.archiveConfirm": "Archive all",
			"workspace.archivePending": "Archiving conversations…",
			"workspace.pinned": "Pinned",
			"workspace.pinnedEmpty": "Drag a project here to pin it",
			"workspace.openPath": "Open in file explorer",
			"workspace.delete": "Remove project",
			"workspace.deleteDescription": "This removes “{name}” from the project list. The folder and conversation records remain.",
			"workspace.deletePending": "Removing project…",
			"workspace.actions": "Project actions for {name}",
			"workspace.taskCount": "{count} tasks",
			"workspace.taskSummary": "{count} tasks · {unreadCount} unread",
			"workspace.edit": "Rename project",
			"sessions.close": "Close",
			"sessions.cancel": "Cancel",
			"sessions.save": "Save",
			"sessions.failed": "Action failed: {message}",
			"sessions.unknown": "Conversation not found.",
			"sessions.actions": "Conversation actions for {name}",
			"sessions.markUnread": "Mark as unread",
			"sessions.markRead": "Mark as read",
			"sessions.unread": "Unread",
			"sessions.waitingAnswer": "Waiting for answer",
			"sessions.waitingApproval": "Waiting for approval",
			"sessions.planReview": "Plan awaiting review",
			"sessions.rename": "Rename conversation",
			"sessions.renameDescription": "Keep it short and easy to recognize.",
			"sessions.renameInvalid": "The conversation name is invalid. Change it and try again.",
			"sessions.renameFailed": "The conversation could not be renamed. Try again later.",
			"sessions.archive": "Archive conversation",
			"sessions.archiveFailed": "The conversation could not be archived. Try again later.",
			"sessions.delete": "Delete conversation",
			"sessions.deleteDescription": "This permanently deletes “{name}” and all of its records. This cannot be undone.",
			"sessions.deletePending": "Deleting conversation…",
			"sessions.deleteUnavailable": "The archive manager plugin is not installed or unavailable.",
			"sessions.deleteFailed": "The conversation could not be deleted. Try again later.",
			"sessions.fork": "Continue in new conversation",
			"sessions.forkUnavailable": "This conversation cannot be continued in a new conversation right now. Try again after the current turn finishes.",
			"sessions.forkFailed": "A new conversation could not be created. Try again later.",
			"sessions.openPath": "Open in file explorer",
			"sessions.moveWorkspace": "Project",
			"sessions.moveUnavailable": "Conversation moving is unavailable. Restart DSH and try again.",
			"sessions.moveUnauthorized": "Your login session has expired. Refresh the page and sign in again.",
			"sessions.moveForbidden": "The current address is not trusted, or the request origin was rejected.",
			"sessions.moveNotFound": "The conversation or target project no longer exists. Refresh and try again.",
			"sessions.moveSubagent": "Subagent conversations cannot be moved to another project.",
			"sessions.moveBusy": "This conversation is already being moved. Try again shortly.",
			"sessions.moveRollbackFailed": "The conversation could not be moved, and automatic recovery did not complete. Check the DSH server logs.",
			"sessions.moveFailed": "The conversation could not be moved. The original conversation was preserved.",
			"sessions.moveConfirmTitle": "Move conversation to “{project}”?",
			"sessions.moveConfirmDescription": "“{name}” will move to this project, and its working directory will change with it.",
			"sessions.moveConfirmAction": "Move",
			"sessions.movePending": "Moving conversation…",
			"sessions.copyPath": "Copy working directory",
			"sessions.copyTitle": "Copy conversation title",
			"sessions.copyId": "Copy conversation ID",
			"connectors.title": "Connectors",
			"connectors.description": "Shows MCP connectors and tools available to this session without exposing addresses, commands, or credentials.",
			"connectors.openSession": "Open a conversation to load connectors.",
			"connectors.loading": "Loading connectors…",
			"connectors.failed": "Connectors are unavailable. Try again shortly.",
			"connectors.toolCount": "{count} tools",
			"connectors.empty": "This conversation has no available MCP connectors.",
			"connectors.promptReady": "Added to a new conversation",
			"connectors.promptRequired": "The prompt cannot be empty.",
			"connectors.workspacesLoading": "DSH workspace data is still loading. Try again shortly.",
			"connectors.workspaceRequired": "Select a workspace before using an example prompt.",
			"connectors.workspaceUnavailable": "The DSH workspace service is not ready. Try again shortly.",
			"connectors.conversationUnavailable": "The DSH conversation service is not ready. Try again shortly.",
			"connectors.sessionPending": "The new conversation is not ready yet. Try again shortly.",
			"about.nav": "Codex UI",
			"about.title": "Codex UI",
			"about.viewProject": "GitHub",
			"about.feedback": "Issues",
			"about.checkUpdate": "Check for updates",
			"about.checking": "Checking…",
			"about.description": "Adds a Codex-style sidebar, workspace conversation management, search, and turn navigation to DSH.",
			"about.features": "Core features",
			"about.feature.sidebar": "Codex-style sidebar, global conversation search, and settings entry points",
			"about.feature.search": "Find conversations, settings pages, and quick actions from the top search panel",
			"about.feature.workspace": "Expand, collapse, reorder, and pin workspace folders while retaining native workspace behavior",
			"about.feature.sessions": "Rename, pin, mark unread, archive, delete, or use context actions for conversations",
			"about.feature.conversation": "Keeps native messages, tool calls, composer, permissions, and model selection while refining the container visuals",
			"about.feature.navigator": "Navigate directly to each user prompt with the current conversation turn navigator",
			"about.dependencies": "Companion management plugins",
			"about.dependenciesDescription": "Install or update each companion separately, or install missing plugins and update old versions in one action. Check Codex UI, expert, skill, archive, IM, scheduled-task, BTW, Simplify, PUA, code review, pet, and marketplace plugins on their own.",
			"about.loading": "Loading dependency status…",
			"about.statusFailed": "Dependency status is temporarily unavailable.",
			"about.refreshFailed": "Dependency status refresh failed. Showing the last successful result.",
			"about.installed": "Installed",
			"about.missing": "Not installed",
			"about.updateAvailable": "Update available",
			"about.install": "Install",
			"about.update": "Update",
			"about.installing": "Installing",
			"about.updateAll": "Install/update all",
			"about.updatingAll": "Installing/updating",
			"about.upToDate": "All companion plugins are installed and up to date.",
			"about.installFailed": "Dependency installation failed. Try again later.",
			"about.installUnchanged": "The install command finished, but the plugin did not enter this profile. Try again.",
			"about.installExitDesktop": "Quit DSH Desktop completely, reopen it, and try the update again.",
			"about.installStoreMismatch": "The plugin directory and pnpm store do not match. Quit DSH Desktop completely and try again.",
			"about.installExitWeb": "Running plugin files cannot be replaced. Stop the current DSH Web host, update the plugin from a terminal, then restart DSH Web.",
			"about.installStoreMismatchWeb": "The plugin directory and pnpm store do not match. Stop the current DSH Web host and try again; if it persists, reinstall this Profile's dependencies.",
			"about.installWebFailed": "Plugin update failed. Check the DSH Web terminal output and try again.",
			"about.installBuildPolicy": "The pnpm build-script policy for this plugin is not configured. Update the Profile configuration and try again.",
			"about.installPnpmMissing": "pnpm is not available. Install pnpm, restart DSH, and try again.",
			"about.installTimeout": "Plugin installation timed out. Check the network and try again.",
			"about.installServiceUnavailable": "The DSH Desktop dependency service is not ready. Restart DSH Desktop and try again.",
			"about.restartRequired": "Updating plugins now. The window will refresh automatically.",
			"about.restartManually": "Installation complete. This Web host cannot restart itself; restart DSH Web, then refresh the page.",
			"about.progressHint": "Installing plugin…",
			"about.packagesDone": "{0} packages done",
			"about.progress.resolving": "Resolving",
			"about.progress.downloading": "Downloading",
			"about.progress.linking": "Writing files",
			"about.progress.building": "Building",
			"about.dependency.dsh": "DeepSeek Harness",
			"about.dependency.suite": "Codex suite",
			"about.dependency.ui": "Codex UI",
			"about.dependency.experts": "Expert management",
			"about.dependency.skills": "Skill management",
			"about.dependency.archive": "Archived conversations",
			"about.dependency.im": "IM Assistant",
			"about.dependency.schedule": "Scheduled tasks",
			"about.dependency.pet": "Codex Pet",
			"about.dependency.btw": "BTW",
			"about.dependency.simplify": "Simplify",
			"about.dependency.pua": "PUA",
			"about.dependency.review": "Code Review",
			"about.dependency.market": "App Market",
			"about.totalDownloads": "npm total downloads",
			"about.downloadsUnavailable": "Unavailable",
			"about.downloadsSource": "Cumulative npm downloads from package creation through yesterday. View package on npm.",
			"turns.label": "Conversation turn navigation",
			"turns.untitled": "Untitled prompt",
			"turns.jump": "Jump to turn {index}: {summary}",
			"scrollbar.label": "Conversation scrollbar",
			"time.justNow": "Just now",
			"time.justNowShort": "now",
			"time.minutes": "{count}m",
			"time.hours": "{count}h",
			"time.days": "{count}d",
			"time.weeks": "{count}w",
			"time.months": "{count}mo",
			"time.years": "{count}y",
			"activity.region": "Session activity",
			"activity.changes": "Changes",
			"activity.outputs": "Outputs",
			"activity.sources": "Sources",
			"activity.viewChanges": "Review changes",
			"activity.viewAll": "View all",
			"activity.collapse": "Show less",
			"activity.close": "Close",
			"activity.countFiles": "{count} files",
			"activity.countSources": "{count} sources",
			"errors.unauthorized": "Sign in to DSH, then try again.",
			"errors.forbidden": "The security check rejected this request. Try again from a trusted DSH address.",
			"errors.serviceUnavailable": "The service is unavailable. Try again later.",
			"workspace.preferencesLocalOnly": "Workspace preferences are not synced. Using the local cache.",
			"errors.generic": "The action could not be completed. Try again.",
			"errors.groupInvalid": "The group information is invalid.",
			"errors.workspaceInvalid": "The project identifier is invalid.",
			"errors.groupMissing": "The target group no longer exists.",
			"errors.orderAnchorMissing": "The target position is no longer available. Try again.",
			"sessionTitle.system": "Generate a title for a coding-assistant conversation.\nOutput exactly one line with two parts: Type｜Theme\nType must be one of: {types}\nThe theme must be a concrete subject and must not repeat the type. Do not write dates, emoji, quotes, prefixes, explanations, or Markdown.\nWrite the theme in the language of the user message.",
			"sessionTitle.userFrame": "Generate a conversation title from this user message. Return only one Type｜Theme line. Do not add a third part or repeat the theme.",
			"sessionTitle.type.feature": "Feature",
			"sessionTitle.type.design": "Design",
			"sessionTitle.type.fix": "Fix",
			"sessionTitle.type.optimize": "Optimize",
			"sessionTitle.type.release": "Release",
			"sessionTitle.type.explore": "Explore",
			"sessionTitle.type.docs": "Docs",
			"sessionTitle.type.research": "Research",
			"meta.locale": "en-US"
		};
		const HIDDEN_FOOTER_ACTION_IDS = /* @__PURE__ */ new Set(["context-overview"]);
		function visibleFooterActions(slots) {
			return slots.entriesOfSlot("sidebar.footer.action").flatMap(({ options }) => {
				const id = options.id;
				if (id === void 0 || HIDDEN_FOOTER_ACTION_IDS.has(id)) return [];
				return [{
					id,
					order: options.order ?? 0
				}];
			}).sort((left, right) => left.order - right.order);
		}
		function sameFooterActions(left, right) {
			return left.length === right.length && left.every((action, index) => {
				const previous = right[index];
				return previous !== void 0 && action.id === previous.id && action.order === previous.order;
			});
		}
		/** 给 React useSyncExternalStore 用的底部动作快照；按 slot id 过滤，不靠 DOM class。 */
		function createFooterActionSource(slots) {
			let cached = [];
			return {
				getSnapshot() {
					const next = visibleFooterActions(slots);
					if (sameFooterActions(next, cached)) return cached;
					cached = next;
					return cached;
				},
				subscribe(listener) {
					return slots.subscribe("sidebar.footer.action", listener);
				}
			};
		}
		//#endregion
		//#region src/client/slot-mirror.tsx
		const bridges = /* @__PURE__ */ new WeakMap();
		const wrappers = /* @__PURE__ */ new WeakMap();
		function withSlotAliases(Component, aliases) {
			if (typeof Component !== "function" && (typeof Component !== "object" || Component === null)) return Component;
			const pairs = Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b));
			if (pairs.length === 0) return Component;
			const signature = JSON.stringify(pairs);
			let cached = wrappers.get(Component);
			if (!cached) wrappers.set(Component, cached = /* @__PURE__ */ new Map());
			const previous = cached.get(signature);
			if (previous) return previous;
			const map = new Map(pairs);
			function SlotAliases(props) {
				const face = props;
				const renderSlot = (0, react.useMemo)(() => face.renderSlot && ((key, ...args) => face.renderSlot(map.get(key) ?? key, ...args)), [face.renderSlot]);
				const renderSlotChain = (0, react.useMemo)(() => face.renderSlotChain && ((key, ...args) => face.renderSlotChain(map.get(key) ?? key, ...args)), [face.renderSlotChain]);
				return (0, react.createElement)(Component, {
					...props,
					...renderSlot && { renderSlot },
					...renderSlotChain && { renderSlotChain }
				});
			}
			SlotAliases.displayName = Component.displayName;
			cached.set(signature, SlotAliases);
			return SlotAliases;
		}
		/**
		* Mirror effective contributions into a predeclared, exclusive root-scope alias.
		* Supports single/list/keyed; chain and session scopes are deliberately rejected.
		* The parent owns the top-level alias declaration and must call the returned disposer
		* on unmount. Source declarations/entries are never changed. Children get new declarations.
		*/
		function mirrorSlot(ctx, source, target) {
			const slots = ctx.slots;
			const readSpec = slots.spec.bind(slots);
			const register = slots.register.bind(slots);
			const validate = (spec) => {
				if (spec.scope !== "root" || ![
					"single",
					"list",
					"keyed"
				].includes(spec.kind)) throw new Error("slot mirror supports only root single/list/keyed slots");
			};
			const install = (from, to, ancestors) => {
				if (from === to || ancestors.has(from)) throw new Error("recursive slot mirror");
				let graph = bridges.get(ctx);
				if (!graph) bridges.set(ctx, graph = /* @__PURE__ */ new Map());
				let cursor = from;
				while (cursor !== void 0) {
					if (cursor === to) throw new Error("recursive slot mirror");
					cursor = graph.get(cursor);
				}
				if (graph.has(to)) throw new Error(`mirror target '${to}' already has a bridge`);
				const targetSpec = readSpec(to);
				if (!targetSpec) throw new Error(`mirror target '${to}' must be declared by its parent`);
				validate(targetSpec);
				const branch = new Set(ancestors).add(from);
				const active = /* @__PURE__ */ new Map();
				let stopped = false;
				const clear = () => {
					for (const remove of active.values()) remove();
					active.clear();
				};
				graph.set(to, from);
				const stop = () => {
					if (stopped) return;
					stopped = true;
					unsubSource();
					unsubTarget();
					graph.delete(to);
					clear();
				};
				const sync = () => {
					if (stopped) return;
					if (!readSpec(to)) {
						stop();
						return;
					}
					const spec = readSpec(from);
					if (spec) {
						validate(spec);
						if (spec.kind !== targetSpec.kind) throw new Error("slot mirror kind mismatch");
					}
					const entries = slots.entriesOfSlot(from);
					for (const [entry, remove] of active) if (!entries.includes(entry)) {
						remove();
						active.delete(entry);
					}
					for (const entry of entries) {
						if (active.has(entry)) continue;
						const aliases = Object.create(null);
						const children = Object.create(null);
						for (const [child, childSpec] of Object.entries(entry.children ?? {})) {
							validate(childSpec);
							if (branch.has(child)) throw new Error("recursive slot mirror");
							const alias = `${to}.${encodeURIComponent(child)}`;
							if (readSpec(alias)) throw new Error(`mirror child alias '${alias}' is already declared`);
							aliases[child] = alias;
							children[alias] = childSpec;
						}
						const removes = [];
						try {
							removes.push(register({
								name: to,
								...entry.options,
								inject: entry.inject,
								store: entry.store,
								locale: entry.locale,
								registrant: entry.registrant,
								...entry.children && { children }
							}, withSlotAliases(entry.component, aliases)));
							for (const [child, alias] of Object.entries(aliases)) removes.push(install(child, alias, branch));
							active.set(entry, () => {
								for (const remove of removes.reverse()) remove();
							});
						} catch (error) {
							for (const remove of removes.reverse()) remove();
							throw error;
						}
					}
				};
				const safeSync = () => {
					try {
						sync();
					} catch (error) {
						console.warn(`[uncledylan-codex-ui] slot-mirror sync error on '${from}' -> '${to}':`, error);
						stop();
					}
				};
				const unsubSource = slots.subscribe(from, safeSync);
				const unsubTarget = slots.subscribe(to, safeSync);
				try {
					sync();
				} catch (error) {
					stop();
					throw error;
				}
				return stop;
			};
			const start = () => install(source, target, /* @__PURE__ */ new Set());
			return ctx.effect ? ctx.effect(start) : start();
		}
		//#endregion
		//#region src/client/host-open-path.ts
		const OPEN_IN_EXPLORER_ENDPOINT = CODEX_UI_API_ENDPOINTS.openInExplorer;
		/** “在资源管理器中打开”属于明确的系统动作，不应被侧边栏文件预览器接管。 */
		async function openPathInHost(connection, path, fetcher = fetch) {
			let foregroundResponse;
			try {
				foregroundResponse = await fetcher(OPEN_IN_EXPLORER_ENDPOINT, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ path })
				});
			} catch {}
			if (foregroundResponse?.ok) return;
			if (foregroundResponse !== void 0 && [
				401,
				403,
				503
			].includes(foregroundResponse.status)) throw new BusinessRequestError(foregroundResponse.status);
			if (foregroundResponse !== void 0 && foregroundResponse.status !== 404 && foregroundResponse.status !== 501) {
				const payload = await foregroundResponse.json().catch(() => ({}));
				throw new Error(typeof payload.error === "string" ? payload.error : "无法在前台打开资源管理器。");
			}
			const response = await connection.api.host.openPath({ path });
			if (!response.result.ok) throw new Error(`path open failed: ${response.result.error.message}`);
		}
		//#endregion
		//#region src/client/settings-nav-icons.ts
		const ABOUT_SETTINGS_NAV_ORDER = "2147483647";
		const SETTINGS_NAV_ICON_HTML = {
			experts: "<path fill=\"currentColor\" d=\"M11.0307 5.46369C11.0305 3.78995 9.6734 2.43357 7.99961 2.43357C6.32601 2.43379 4.96972 3.79009 4.96949 5.46369C4.96949 7.13748 6.32587 8.49455 7.99961 8.49477C9.67354 8.49477 11.0307 7.13762 11.0307 5.46369ZM12.3163 5.46369C12.3163 7.84777 10.3837 9.78042 7.99961 9.78042C5.61572 9.7802 3.68288 7.84763 3.68288 5.46369C3.6831 3.07993 5.61586 1.14718 7.99961 1.14695C10.3836 1.14695 12.3161 3.0798 12.3163 5.46369Z\"/><path fill=\"currentColor\" d=\"M8.00002 10.3316C11.7343 10.3316 14.1864 11.8997 15.0387 14.4445L14.4292 14.6483L13.8197 14.8531C13.1955 12.9893 11.3673 11.6182 8.00002 11.6182C4.63277 11.6182 2.80455 12.9893 2.18031 14.8531L1.5708 14.6483L0.961304 14.4445C1.81368 11.8997 4.26579 10.3316 8.00002 10.3316Z\"/>",
			skills: "<path fill=\"currentColor\" d=\"M12.5113 15.4067C12.4395 15.6249 12.1308 15.6249 12.059 15.4067L11.643 14.1416C11.454 13.567 11.0033 13.1164 10.4288 12.9274L9.16369 12.5113C8.94544 12.4395 8.94544 12.1308 9.16369 12.059L10.4288 11.643C11.0033 11.454 11.454 11.0033 11.643 10.4288L12.059 9.16369C12.1308 8.94544 12.4395 8.94544 12.5113 9.16369L12.9274 10.4288C13.1164 11.0033 13.567 11.454 14.1416 11.643L15.4067 12.059C15.6249 12.1308 15.6249 12.4395 15.4067 12.5113L14.1416 12.9274C13.567 13.1164 13.1164 13.567 12.9274 14.1416L12.5113 15.4067Z\"/><path fill=\"currentColor\" d=\"M9.02246 0.546878C9.9822 0.546878 10.7564 0.545403 11.374 0.612307C12.0042 0.680586 12.5515 0.826244 13.0273 1.17188C13.3052 1.37376 13.5501 1.61868 13.752 1.89649C14.0975 2.37225 14.2432 2.91984 14.3115 3.54981C14.3784 4.16727 14.377 4.94206 14.377 5.90137V8.51367C13.9611 8.29533 13.5071 8.13985 13.0273 8.06055V5.90137C13.0273 4.9121 13.0259 4.22322 12.9688 3.69532C12.9129 3.18044 12.8098 2.89782 12.6592 2.69043C12.5406 2.52724 12.3966 2.38326 12.2334 2.26465C12.026 2.11404 11.7437 2.0109 11.2285 1.95508C10.7005 1.89789 10.0122 1.89649 9.02246 1.89649H6.55371C5.56395 1.89649 4.87569 1.89787 4.34766 1.95508C3.83242 2.01092 3.55022 2.11398 3.34278 2.26465C3.17953 2.38329 3.03564 2.52719 2.91699 2.69043C2.76642 2.89782 2.66325 3.18042 2.60742 3.69532C2.55027 4.22322 2.54883 4.9121 2.54883 5.90137V10.0986C2.54883 11.0878 2.55031 11.7768 2.60742 12.3047C2.66326 12.8196 2.76642 13.1032 2.91699 13.3105C3.03558 13.4736 3.17966 13.6178 3.34278 13.7363C3.5502 13.8869 3.83265 13.9901 4.34766 14.0459C4.87568 14.1031 5.56398 14.1035 6.55371 14.1035H8.08399C8.27443 14.6025 8.55077 15.0585 8.89551 15.4541H6.55371C5.59402 15.4541 4.81976 15.4546 4.20215 15.3877C3.57204 15.3194 3.02468 15.1738 2.54883 14.8281C2.27111 14.6263 2.02606 14.3813 1.82422 14.1035C1.47883 13.6278 1.33293 13.08 1.26465 12.4502C1.19783 11.8327 1.19922 11.0579 1.19922 10.0986V5.90137C1.19922 4.94206 1.1978 4.16727 1.26465 3.54981C1.33295 2.91984 1.47867 2.37225 1.82422 1.89649C2.02613 1.61864 2.27098 1.37379 2.54883 1.17188C3.02472 0.826181 3.57197 0.6806 4.20215 0.612307C4.81976 0.545393 5.594 0.546877 6.55371 0.546878H9.02246ZM9.19629 9.14649H4.5459V7.84571H9.19629V9.14649ZM11.0303 6.10645H4.5459V4.80567H11.0303V6.10645Z\"/>",
			plugins: "<path transform=\"translate(1.292 1.3)\" fill=\"currentColor\" d=\"M10.3232 9.18164C11.2868 9.18164 12.0985 9.82833 12.3506 10.7109L13.415 10.7109L13.415 11.8711L12.3496 11.8711C12.0971 12.7532 11.2864 13.3994 10.3232 13.3994C9.36031 13.3992 8.55012 12.7531 8.29785 11.8711L0 11.8711L0 10.7109L8.29688 10.7109C8.54876 9.82845 9.35988 9.18186 10.3232 9.18164ZM10.3232 10.3418C9.7999 10.3421 9.37534 10.7667 9.375 11.29C9.375 11.8137 9.79969 12.239 10.3232 12.2393C10.847 12.2393 11.2725 11.8138 11.2725 11.29C11.2721 10.7666 10.8468 10.3418 10.3232 10.3418ZM12.4326 11.291C12.4326 11.3549 12.4284 11.418 12.4229 11.4805C12.4287 11.4181 12.4326 11.355 12.4326 11.291ZM8.21484 11.2832C8.21484 11.2856 8.21484 11.2886 8.21484 11.291L8.21484 11.29C8.21484 11.2878 8.21484 11.2855 8.21484 11.2832ZM3.08301 4.59082C4.04605 4.59095 4.85696 5.23717 5.10938 6.11914L13.415 6.11914L13.415 7.2793L5.11035 7.2793C4.85833 8.16202 4.04648 8.80846 3.08301 8.80859C2.11972 8.80843 1.30963 8.16179 1.05762 7.2793L0 7.2793L0 6.11914L1.05762 6.11914C1.30994 5.23728 2.12006 4.59098 3.08301 4.59082ZM3.08301 5.75098C2.55962 5.75117 2.13512 6.17587 2.13477 6.69922C2.13477 7.22287 2.5594 7.64824 3.08301 7.64844C3.60665 7.64828 4.03223 7.2229 4.03223 6.69922C4.03187 6.17585 3.60643 5.75113 3.08301 5.75098ZM5.19238 6.69922C5.19238 6.763 5.18816 6.82633 5.18262 6.88867C5.18846 6.82629 5.19238 6.76313 5.19238 6.69922C5.19236 6.63495 5.18853 6.57152 5.18262 6.50879C5.18826 6.57154 5.19236 6.635 5.19238 6.69922ZM0.982422 6.52344C0.977382 6.58136 0.97463 6.63999 0.974609 6.69922C0.974609 6.75775 0.977496 6.81579 0.982422 6.87305C0.977758 6.81579 0.974609 6.75767 0.974609 6.69922C0.974628 6.64 0.977618 6.58142 0.982422 6.52344ZM10.3232 0C11.2869 0 12.0986 0.646596 12.3506 1.5293L13.415 1.5293L13.415 2.68945L12.3496 2.68945C12.363 2.64266 12.3754 2.59488 12.3857 2.54688C12.1838 3.50118 11.3376 4.21777 10.3232 4.21777C9.36037 4.21756 8.55018 3.57139 8.29785 2.68945L0 2.68945L0 1.5293L8.29688 1.5293C8.5487 0.646717 9.35981 0.00021854 10.3232 0ZM10.3232 1.16016C9.79984 1.16042 9.37524 1.58499 9.375 2.1084C9.375 2.63201 9.79969 3.05735 10.3232 3.05762C10.847 3.05762 11.2725 2.63217 11.2725 2.1084C11.2722 1.58483 10.8469 1.16016 10.3232 1.16016ZM12.4229 2.29883C12.4287 2.23641 12.4326 2.17331 12.4326 2.10938C12.4326 2.17327 12.4284 2.23638 12.4229 2.29883ZM8.21484 2.10938L8.21484 2.1084L8.21484 2.10938ZM8.22266 1.93359C8.21785 1.98897 8.21506 2.04499 8.21484 2.10156C8.21503 2.04501 8.2181 1.98902 8.22266 1.93359ZM8.22266 11.1162C8.2179 11.1713 8.21507 11.227 8.21484 11.2832C8.21504 11.227 8.21814 11.1713 8.22266 11.1162Z\"/>",
			connectors: "<path fill=\"currentColor\" d=\"M9.94133 6.50173C11.3218 7.99603 11.3218 10.3011 9.94128 11.7954C9.88691 11.8542 9.82125 11.9196 9.72099 12.0198L7.75707 13.9838C7.65709 14.0838 7.592 14.1491 7.53334 14.2034C6.03906 15.5843 3.7327 15.5854 2.23827 14.2048C2.17933 14.1503 2.11374 14.0844 2.01315 13.9838C1.91318 13.8839 1.84922 13.8188 1.79495 13.7601C0.413857 12.2657 0.413909 9.95948 1.795 8.46503C1.84923 8.4064 1.91335 8.34115 2.01321 8.24129L3.79275 6.46313C3.71814 7.08101 3.75236 7.71445 3.90115 8.33518L3.00344 9.23151C2.89398 9.34097 2.8535 9.38307 2.82251 9.41658C1.93771 10.3744 1.93704 11.8514 2.82179 12.8092C2.85279 12.8427 2.89383 12.884 3.0034 12.9936C3.11272 13.1029 3.15429 13.1442 3.18777 13.1752C4.14561 14.0603 5.62381 14.0608 6.58178 13.1758C6.61532 13.1448 6.65722 13.1032 6.76685 12.9935L8.73077 11.0296C8.83999 10.9204 8.88142 10.8787 8.91238 10.8452C9.79744 9.88728 9.7969 8.40911 8.91173 7.45124C8.88074 7.41775 8.83944 7.3762 8.73011 7.26687C8.62082 7.15757 8.58061 7.11623 8.54712 7.08526C8.37347 6.92477 8.18243 6.79361 7.98088 6.69165L9.00289 5.66964C9.17506 5.78373 9.34035 5.91265 9.49663 6.05703C9.55538 6.11135 9.62026 6.17652 9.72036 6.27662C9.82094 6.3772 9.88686 6.4428 9.94133 6.50173Z\"/><path fill=\"currentColor\" d=\"M6.06816 9.49196C4.68626 7.99724 4.68667 5.68942 6.06885 4.19487C6.12268 4.13671 6.18789 4.07306 6.28706 3.9739L8.24541 2.01416C8.34478 1.91479 8.41018 1.85055 8.46845 1.79665C9.96301 0.414902 12.2689 0.414922 13.7635 1.79665C13.8217 1.85051 13.8866 1.91559 13.9858 2.01486C14.0849 2.11394 14.1502 2.17769 14.204 2.23583C15.5861 3.7304 15.5866 6.03823 14.2047 7.53291C14.1508 7.59125 14.0854 7.65638 13.9858 7.75595L12.1994 9.54098C12.2614 8.92982 12.2185 8.30587 12.0634 7.69657L12.9956 6.76573C13.1044 6.65692 13.1458 6.61529 13.1765 6.58205C14.0621 5.62404 14.0621 4.1454 13.1765 3.18738C13.1458 3.15419 13.104 3.1135 12.9956 3.00508C12.8877 2.89716 12.8471 2.85551 12.814 2.82485C11.8559 1.9389 10.376 1.93886 9.41794 2.82485C9.38479 2.85554 9.34381 2.89622 9.23564 3.00439L7.27728 4.96413C7.16875 5.07265 7.12708 5.11322 7.09636 5.14643C6.21074 6.10441 6.21153 7.58236 7.09705 8.5404C7.12775 8.57357 7.16826 8.61575 7.27659 8.72408C7.38456 8.83205 7.42647 8.87227 7.45958 8.90293C7.62849 9.0591 7.81309 9.1881 8.00856 9.28894L6.98795 10.3095C6.82111 10.1978 6.66052 10.0715 6.50872 9.93114C6.45057 9.87733 6.38547 9.81341 6.28637 9.71431C6.1871 9.61504 6.12202 9.55018 6.06816 9.49196Z\"/>",
			schedule: "<path fill=\"currentColor\" d=\"M8 1.15A6.85 6.85 0 1 0 8 14.85 6.85 6.85 0 0 0 8 1.15Zm0 1.4a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Z\"/><path fill=\"currentColor\" d=\"M8.62 4.35H7.28v4.2l3.02 1.78.67-1.13-2.35-1.39V4.35Z\"/>",
			assistant: "<path fill=\"currentColor\" d=\"M2.15 2.9h11.7v8.2H6.42L2.15 13.85V2.9Zm1.4 1.4v6.62l1.78-1.12h7.12V4.3H3.55Z\"/>",
			archive: "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M15.8659 2.05975C17.2603 2.05995 18.3913 3.19096 18.3914 4.58527V5.4874C18.3914 6.02747 18.2192 6.52672 17.9303 6.93735C17.9336 6.96524 17.9388 6.99318 17.9388 7.02195V12.8884C17.9388 13.6345 17.9395 14.2379 17.8996 14.7254C17.8642 15.1593 17.7936 15.5499 17.6373 15.9141L17.5654 16.0685C17.278 16.6328 16.8405 17.1046 16.3038 17.434L16.0679 17.5661C15.66 17.7739 15.2196 17.8598 14.7237 17.9003C14.2362 17.9401 13.6327 17.9405 12.8867 17.9405H7.11122C6.36511 17.9405 5.76171 17.9401 5.27418 17.9003C4.84051 17.8649 4.44949 17.7952 4.08545 17.6391L3.93104 17.5661C3.36673 17.2785 2.89392 16.8414 2.56465 16.3044L2.43245 16.0685C2.22473 15.6608 2.13878 15.2211 2.09825 14.7254C2.05841 14.2379 2.05912 13.6345 2.05912 12.8884V7.02195C2.05912 6.99284 2.06422 6.96449 2.06758 6.93629C1.77931 6.52592 1.60858 6.02687 1.60858 5.4874V4.58527C1.60876 3.19084 2.73962 2.05975 4.1341 2.05975H15.8659ZM16.4984 7.92936C16.296 7.98169 16.0847 8.01288 15.8659 8.01291H4.1341C3.91478 8.01291 3.70246 7.98194 3.49955 7.92936V12.8884C3.49955 13.6582 3.50053 14.1927 3.53445 14.608C3.56769 15.0146 3.62923 15.244 3.71635 15.415L3.7925 15.5514C3.98339 15.8627 4.25749 16.1165 4.58464 16.2833L4.72529 16.3435C4.88095 16.3993 5.08638 16.4402 5.39158 16.4651C5.80685 16.4991 6.34138 16.5001 7.11122 16.5001H12.8867C13.6564 16.5001 14.1911 16.499 14.6063 16.4651C15.0128 16.432 15.2423 16.3703 15.4133 16.2833L15.5508 16.2061C15.8618 16.0152 16.116 15.7419 16.2827 15.415L16.3429 15.2732C16.3985 15.1177 16.4396 14.9128 16.4645 14.608C16.4985 14.1927 16.4984 13.6583 16.4984 12.8884V7.92936ZM4.1341 3.50019C3.53511 3.50019 3.0492 3.98631 3.04902 4.58527V5.4874C3.04902 6.08649 3.535 6.57248 4.1341 6.57248H15.8659C16.4648 6.57228 16.951 6.08638 16.951 5.4874V4.58527C16.9509 3.98644 16.4647 3.50038 15.8659 3.50019H4.1341Z\"/><path fill=\"currentColor\" d=\"M12.7962 12.5661V11.0832H7.20548V12.5661L12.7962 12.5661Z\"/>",
			about: "<path fill=\"currentColor\" d=\"M12.5757 7.00012C12.5757 3.92085 10.0794 1.42463 7.00012 1.42456C3.9208 1.42456 1.42456 3.9208 1.42456 7.00012C1.42463 10.0794 3.92085 12.5757 7.00012 12.5757C10.0793 12.5756 12.5756 10.0793 12.5757 7.00012ZM13.8002 7.00012C13.8001 10.7559 10.7559 13.8001 7.00012 13.8002C3.2443 13.8002 0.199291 10.7559 0.199219 7.00012C0.199219 3.24426 3.24426 0.199219 7.00012 0.199219C10.7559 0.199291 13.8002 3.2443 13.8002 7.00012Z\"/><path fill=\"currentColor\" d=\"M6.18042 8.68184C6.18043 8.09153 6.32893 7.34655 6.92127 6.8481C7.28566 6.54148 7.76104 6.27318 8.0022 6.10811C8.28964 5.91137 8.42234 5.76562 8.48328 5.58944C8.57774 5.31609 8.53121 5.00904 8.34912 4.76741C8.17409 4.53522 7.83879 4.32222 7.28186 4.32222C5.99668 4.32225 5.46969 5.11832 5.46949 5.78939H4.24414C4.24436 4.39942 5.36327 3.09691 7.28186 3.09688C8.17773 3.09688 8.89489 3.45606 9.32752 4.02999C9.75287 4.59438 9.86938 5.32775 9.64026 5.99019C9.44847 6.5444 9.04722 6.87743 8.69434 7.11898C8.29506 7.39226 8.02318 7.52192 7.70996 7.78548C7.51943 7.94582 7.40577 8.24899 7.40577 8.68184V8.75533H6.18042V8.68184Z\"/><path fill=\"currentColor\" d=\"M7.39455 9.44026V10.8109H6.16921V9.44026H7.39455Z\"/>"
		};
		const NAV_ICON_STYLE_ID = "dcu-settings-nav-icon-style";
		const NAV_ICON_CSS = [
			"[data-dcu-nav-icon] > svg { display: none !important; }",
			"[data-dcu-nav-icon]::before {",
			"  content: '';",
			"  flex: none;",
			"  width: 16px;",
			"  height: 16px;",
			"  background-color: currentColor;",
			"  -webkit-mask: var(--dcu-settings-nav-icon-mask) center / contain no-repeat;",
			"  mask: var(--dcu-settings-nav-icon-mask) center / contain no-repeat;",
			"  -webkit-mask-repeat: no-repeat;",
			"  mask-repeat: no-repeat;",
			"  -webkit-mask-position: center;",
			"  mask-position: center;",
			"  -webkit-mask-size: 16px 16px;",
			"  mask-size: 16px 16px;",
			"}"
		].join("\n");
		/** mask 只取 alpha 通道，因此把 currentColor 固定为黑色即可 */
		function iconMask(id) {
			const viewBox = id === "archive" ? "0 0 20 20" : id === "about" ? "0 0 14 14" : "0 0 16 16";
			const paths = SETTINGS_NAV_ICON_HTML[id].replace(/fill="currentColor"/g, "fill=\"black\"");
			return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${paths}</svg>`)}")`;
		}
		/** 注入导航图标样式；重复安装时复用同一个 style 元素 */
		function ensureNavIconStyle(doc) {
			if (doc.getElementById(NAV_ICON_STYLE_ID) !== null) return;
			const style = doc.createElement("style");
			style.id = NAV_ICON_STYLE_ID;
			style.textContent = NAV_ICON_CSS;
			(doc.head ?? doc.documentElement).appendChild(style);
		}
		const LABEL_ALIASES = [
			[["插件市场", "Plugin Market"], "plugins"],
			[["内置插件", "Built-in plugins"], "plugins"],
			[["插件管理", "Plugin manager"], "plugins"],
			[["专家", "Experts"], "experts"],
			[["技能", "Skills"], "skills"],
			[["插件", "Plugins"], "plugins"],
			[["连接器", "Connectors"], "connectors"],
			[["定时任务", "Scheduled tasks"], "schedule"],
			[["IM助理", "IM Assistant"], "assistant"],
			[[
				"已归档",
				"归档会话",
				"Archived",
				"Archived sessions"
			], "archive"],
			[["Codex UI"], "about"]
		];
		/** 按设置导航可见文案解析侧栏同款图标；插件市场复用插件图标。 */
		function settingsNavIconId(label) {
			const text = label.trim();
			for (const [aliases, id] of LABEL_ALIASES) if (aliases.includes(text)) return id;
		}
		function applySettingsNavIcon(button) {
			const id = settingsNavIconId(button.textContent ?? "");
			if (id === void 0) {
				if (button.hasAttribute("data-dcu-nav-icon")) {
					button.removeAttribute("data-dcu-nav-icon");
					button.style.removeProperty("--dcu-settings-nav-icon-mask");
					return true;
				}
				return false;
			}
			let changed = false;
			if (id === "about") {
				if (!button.hasAttribute("data-dcu-settings-about-last")) {
					button.setAttribute("data-dcu-settings-about-last", "");
					changed = true;
				}
				if (button.style.getPropertyValue("order") !== "2147483647" || button.style.getPropertyPriority("order") !== "important") {
					button.style.setProperty("order", ABOUT_SETTINGS_NAV_ORDER, "important");
					changed = true;
				}
			}
			if (button.querySelector(":scope > svg") === null) return changed;
			if (button.getAttribute("data-dcu-nav-icon") === id) return changed;
			const doc = button.ownerDocument;
			if (doc === null) return changed;
			ensureNavIconStyle(doc);
			button.setAttribute("data-dcu-nav-icon", id);
			button.style.setProperty("--dcu-settings-nav-icon-mask", iconMask(id));
			return true;
		}
		function applySettingsNavIcons(root) {
			let changed = 0;
			for (const button of root.querySelectorAll("[role=\"dialog\"] nav button")) if (applySettingsNavIcon(button)) changed += 1;
			return changed;
		}
		/** 设置壳只给少数分区画专用图标，这里把已安装插件的导航改成侧栏同款。 */
		function observeSettingsNavIcons() {
			if (typeof document === "undefined" || document.body === null) return () => {};
			let applying = false;
			let frame;
			const pendingRoots = /* @__PURE__ */ new Set([document]);
			const apply = () => {
				if (applying) return;
				applying = true;
				const roots = [...pendingRoots];
				pendingRoots.clear();
				try {
					for (const root of roots) applySettingsNavIcons(root);
				} finally {
					applying = false;
				}
			};
			const schedule = () => {
				if (frame !== void 0) return;
				frame = window.requestAnimationFrame(() => {
					frame = void 0;
					apply();
				});
			};
			apply();
			const observer = new MutationObserver((records) => {
				for (const record of records) {
					const button = (record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest("[role=\"dialog\"] nav button");
					if (button !== null && button !== void 0) pendingRoots.add(button.closest("[role=\"dialog\"]") ?? document);
					for (const node of record.addedNodes) {
						if (!(node instanceof Element)) continue;
						if (node.matches("[role=\"dialog\"] nav button")) pendingRoots.add(node.closest("[role=\"dialog\"]") ?? document);
						else if (node.querySelector("[role=\"dialog\"] nav button") !== null) pendingRoots.add(node);
					}
				}
				if (pendingRoots.size > 0) schedule();
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				for (const button of document.querySelectorAll("[data-dcu-nav-icon]")) {
					button.removeAttribute("data-dcu-nav-icon");
					button.style.removeProperty("--dcu-settings-nav-icon-mask");
				}
				if (document.querySelector("[data-dcu-nav-icon]") === null) document.getElementById(NAV_ICON_STYLE_ID)?.remove();
			};
		}
		//#endregion
		//#region src/client/PluginConfigSection.tsx
		function bindPluginConfigLocale(bind) {
			const cache = /* @__PURE__ */ new Map();
			return (ns) => {
				const existing = cache.get(ns);
				if (existing !== void 0) return existing;
				const translate = bind(ns);
				cache.set(ns, translate);
				return translate;
			};
		}
		const FORWARDED_CONFIG_SLOTS = /* @__PURE__ */ new Set([
			"plugins.tab",
			"plugins.add.actions",
			"plugins.item",
			"plugins.bundle.activation",
			"plugins.bundle.config",
			"plugins.row.config",
			"plugins.detail.actions",
			"plugins.detail.badge",
			"plugins.detail.section"
		]);
		var SlotEntryBoundary = class extends react.Component {
			state = { failed: false };
			static getDerivedStateFromError() {
				return { failed: true };
			}
			render() {
				return this.state.failed ? this.props.fallback : this.props.children;
			}
		};
		function isSnapshotSource(value) {
			return typeof value === "object" && value !== null && typeof value.getSnapshot === "function" && typeof value.subscribe === "function";
		}
		function hookPropName(name) {
			return `use${name[0]?.toUpperCase() ?? ""}${name.slice(1)}`;
		}
		function bindSnapshotSelector(source) {
			const subscribe = (listener) => source.subscribe(listener);
			const getSnapshot = () => source.getSnapshot();
			return function useSelected(selector = (value) => value) {
				return (0, react.useSyncExternalStore)(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
			};
		}
		function bindHookSources(hooks, bound) {
			for (const [name, source] of Object.entries(hooks ?? {})) if (isSnapshotSource(source)) bound[hookPropName(name)] = bindSnapshotSelector(source);
		}
		function bindInjectFace(inject) {
			try {
				if (typeof inject !== "function") return {};
				const face = inject();
				if (typeof face !== "object" || face === null) return {};
				const { hooks, keyedHooks, ...rest } = face;
				const bound = { ...rest };
				if (keyedHooks !== void 0) bound.keyedHooks = keyedHooks;
				bindHookSources(hooks, bound);
				bindHookSources(keyedHooks, bound);
				return bound;
			} catch {
				return {};
			}
		}
		function DelegatedOfficialSlot({ slots, name, owner, opts, bindLocale }) {
			(0, react.useSyncExternalStore)((listener) => slots.subscribe(name, listener), () => slots.getVersion(name));
			const nodes = slots.entriesOfSlot(name).filter((entry) => opts?.entryKey !== void 0 ? entry.options.key === opts.entryKey : opts?.only === void 0 || entry.options.id === opts.only).flatMap((entry, index) => {
				if (typeof entry.component !== "function") return [];
				const t = entry.locale !== void 0 && bindLocale !== void 0 ? bindLocale(entry.locale) : void 0;
				return [(0, react.createElement)(SlotEntryBoundary, {
					key: entry.options.key ?? entry.options.id ?? String(index),
					fallback: opts?.fallback ?? null,
					children: (0, react.createElement)(entry.component, {
						...owner,
						...bindInjectFace(entry.inject),
						...t === void 0 ? {} : { t }
					})
				})];
			});
			return nodes.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				"data-slot": name,
				style: { display: "contents" },
				children: nodes
			}) : opts?.fallback ?? null;
		}
		function wrapRenderSlot(slots, bindLocale) {
			return (name, owner = {}, opts) => {
				if (slots === void 0 || !FORWARDED_CONFIG_SLOTS.has(name)) return opts?.fallback ?? null;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DelegatedOfficialSlot, {
					slots,
					name,
					owner,
					opts,
					bindLocale
				});
			};
		}
		/** 设置里的官方插件管理页副本。官方卡片要 inject 和文案；单卡崩溃不得拆掉整页。 */
		function PluginConfigSection({ Official, officialLabel, slots, bindLocale, ...official }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: "dcu-plugin-config",
				"aria-label": officialLabel,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotEntryBoundary, {
					fallback: null,
					children: (0, react.createElement)(Official, {
						...official,
						renderSlot: wrapRenderSlot(slots, bindLocale)
					})
				})
			});
		}
		function createPluginConfigSection(Official, officialLabel, slots, bindLocale) {
			return function PluginConfigSectionBound(props) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginConfigSection, {
					Official,
					officialLabel: officialLabel(),
					slots,
					bindLocale,
					...props
				});
			};
		}
		//#endregion
		//#region src/client/plugin-config.ts
		const PLUGIN_CONFIG_SECTION_ID = "plugin-config";
		const OFFICIAL_PLUGIN_MANAGER_NS = "pluginManager";
		function officialPluginsPage(entry) {
			if (entry === void 0 || entry.options.key !== "plugins") return void 0;
			if (typeof entry.component !== "function" || typeof entry.inject !== "function" || entry.locale !== OFFICIAL_PLUGIN_MANAGER_NS) return void 0;
			return entry.component;
		}
		function registerPluginConfigSection(ctx) {
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => {
				let current;
				let remove;
				const refresh = () => {
					const entry = ctx.slots.entriesOfSlot("main").find((item) => item.options.key === OFFICIAL_PLUGINS_PANEL_ID);
					if (entry === current) return;
					remove?.();
					remove = void 0;
					current = entry;
					const Official = officialPluginsPage(entry);
					if (Official === void 0 || entry?.inject === void 0 || entry.locale !== OFFICIAL_PLUGIN_MANAGER_NS) return;
					remove = ctx.slots.register({
						name: "settings.section",
						id: PLUGIN_CONFIG_SECTION_ID,
						order: 16,
						label: () => t("settings.pluginConfig"),
						locale: entry.locale,
						inject: entry.inject,
						...entry.store === void 0 ? {} : { store: entry.store }
					}, createPluginConfigSection(Official, () => t("settings.pluginConfig"), ctx.slots, bindPluginConfigLocale((ns) => {
						const translate = ctx.locale.bind(ns);
						return (key, params) => translate(key, params);
					})));
				};
				const unsubscribe = ctx.slots.subscribe("main", refresh);
				refresh();
				return () => {
					unsubscribe();
					remove?.();
				};
			});
		}
		//#endregion
		//#region src/client/settings-page-model.ts
		/** 已知分区的显示顺序由 UI 插件固定。各插件自带 order 只用于同组未知项之间。 */
		const SETTINGS_NAV = {
			personal: ["account", "general"],
			integrations: [
				"models",
				"agent-presets",
				"plugins",
				"plugin-config",
				"agency-agents",
				"skills-manager",
				"codex-pet",
				"connectors",
				"scheduled-tasks",
				"im-assistant"
			],
			records: ["archived-sessions", "about"]
		};
		const GROUP_INDEX = {
			personal: 0,
			integrations: 1,
			records: 2
		};
		function settingsGroup(id) {
			for (const group of [
				"personal",
				"integrations",
				"records"
			]) if (SETTINGS_NAV[group].includes(id)) return group;
			if (/archive|about/.test(id)) return "records";
			if (/^(general|appearance|theme|language|shortcuts|voice|account)$/.test(id)) return "personal";
			return "integrations";
		}
		/** 先按 UI 插件的固定顺位，未知项跟在同组已知项之后，彼此仍保持原 order。 */
		function orderSettingsRows(rows) {
			const rank = (row) => {
				const group = settingsGroup(row.id);
				const known = SETTINGS_NAV[group].indexOf(row.id);
				const item = known >= 0 ? known : SETTINGS_NAV[group].length + Math.min(Math.max(row.order, 0), 1e6) / 1e9;
				return GROUP_INDEX[group] * 1e3 + item;
			};
			return [...rows].sort((left, right) => rank(left) - rank(right) || left.id.localeCompare(right.id));
		}
		function filterSettingsRows(rows, query) {
			const needle = query.trim().toLocaleLowerCase();
			return needle === "" ? rows : rows.filter((row) => `${row.label} ${row.id}`.toLocaleLowerCase().includes(needle));
		}
		function generalItemGroup(id) {
			if (/permission|approval|sandbox/.test(id)) return "permissions";
			if (/composer|font|conversation|chat|enter/.test(id)) return "editor";
			return "general";
		}
		//#endregion
		//#region src/client/settings-page-styles.ts
		/** Codex 设置页的局部 tokens 与布局，不覆盖宿主其他弹窗。 */
		const settingsPageStyles = `
/* 导航列宽度可补间：折叠时收到 0，和主侧栏用同一条缓动。 */
@property --dcu-settings-nav{syntax:"<length>";inherits:true;initial-value:264px}
.dcu-settings-page{--sp-bg:#fff;--sp-nav:var(--dcu-sidebar-background,#f9f9f9);--sp-card:#f9f9f9;--sp-border:rgba(13,13,13,.08);--sp-text:#181818;--sp-muted:#5d5d5d;--sp-hover:rgba(13,13,13,.08);--sp-active:rgba(13,13,13,.12);--dcu-sidebar-background:#f9f9f9;--dcu-sidebar-rail:#f3f3f3;--dcu-settings-nav:calc(var(--dcu-sidebar-expanded-width,340px) - 48px);--dcu-settings-top:0px;position:fixed;inset:0;z-index:1000;display:grid;/* 导航列 = 主界面列宽 − 48px 图标轨；折叠时收到 0。第二行从标题栏带下方开始，
   让导航列与主面板的左右上角圆角落在 frame 内部，不再被不透明的标题栏条盖掉。 */grid-template-columns:48px var(--dcu-settings-nav) minmax(0,1fr);grid-template-rows:var(--dcu-settings-top) minmax(0,1fr);background:var(--dcu-sidebar-rail);color:var(--sp-text);font:13px/1.5 var(--dsw-font-family);text-align:left;isolation:isolate;transition:--dcu-settings-nav var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
.dcu-settings-page[data-narrow]{--dcu-settings-nav:0px}
/* 顶栏带 + 窄轨 = 一整块 frame（与 --dsw-specific-sidebar-fill 同色）：标题栏带是 grid 第一行，
   桌面宿主取标题栏安全区高度，普通浏览器与全屏时为 0。带本身只负责窗口拖动。 */
.dcu-settings-page::before{content:"";grid-column:1/-1;grid-row:1;pointer-events:none;background:var(--dsw-specific-sidebar-fill,var(--dcu-sidebar-rail))}
html:is([data-platform=darwin],[data-windows-titlebar]):not([data-fullscreen]) .dcu-settings-page{--dcu-settings-top:var(--dsh-frame-top-clearance,48px)}
html:is([data-platform=darwin],[data-windows-titlebar]):not([data-fullscreen]) .dcu-settings-page::before{-webkit-app-region:drag}
.dcu-settings-rail{grid-column:1;grid-row:2}
.dcu-settings-nav{grid-column:2;grid-row:2}
.dcu-settings-main{grid-column:3;grid-row:2}
/* 折叠只收导航列：面板本体保持不透明、边界平滑推移，内容按主页同一条曲线淡出——
   与主侧栏共用 body 上的 --dcu-sidebar-motion-* 节奏，两处动画天然同步。 */
.dcu-settings-page[data-narrow] .dcu-settings-nav{pointer-events:none}
.dcu-settings-nav>*{transition:opacity var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
.dcu-settings-page[data-narrow] .dcu-settings-nav>*{opacity:0}
/* 正文面板：右上角 16px 圆角对着 frame；与导航列的交界是 1px frame 色直线（主页面板-工作区同款
   分界线）。不能用模糊投影——投影叠在 #f9f9f9 导航底上正是 #D8D8D8 竖缝的来源。
   导航列折叠后主面板贴到窄轨：左上角从直角过渡到 16px，并接管主页同款的左向 drop shadow。 */
.dcu-settings-main{background:var(--sp-bg);border-top-right-radius:16px;box-shadow:inset 1px 0 0 var(--dcu-sidebar-edge,var(--dsw-specific-sidebar-fill,#f3f3f3));transition:border-top-left-radius var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1)),box-shadow var(--dcu-sidebar-motion-duration,300ms) var(--dcu-sidebar-motion-ease,cubic-bezier(.4,0,.2,1))}
.dcu-settings-page[data-narrow] .dcu-settings-main{border-top-left-radius:16px;box-shadow:-6px 0 12px -5px var(--dcu-sidebar-lift,rgba(0,0,0,.04)),inset 1px 0 0 var(--dcu-sidebar-edge,var(--dsw-specific-sidebar-fill,#f3f3f3))}
/* 常驻窄栏沿用主界面 .dcu-rail 的类名与尺寸（图标、间距、悬停都由那份样式表负责），
   这里只补它需要的设计变量，并在主侧栏未挂载时兜底一份同样的排布。 */
.dcu-settings-rail{--dcu-sidebar-background:#f9f9f9;--dcu-sidebar-rail:#f3f3f3;--dcu-sidebar-primary:#3d3f41;--dcu-sidebar-secondary:#5d5d5d;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#3d3f41;--dcu-sidebar-icon:#5d5d5d;--dcu-sidebar-hover:rgba(13,13,13,.08);--dcu-sidebar-border:rgba(13,13,13,.08);display:flex;flex:none;flex-direction:column;align-items:center;gap:8px;width:48px;height:100%;padding:9px 0 8px;background:var(--dcu-sidebar-rail)}
body[data-ds-dark-theme] .dcu-settings-rail{--dcu-sidebar-background:#101010;--dcu-sidebar-rail:#0c0c0c;--dcu-sidebar-primary:#ededed;--dcu-sidebar-secondary:#afafaf;--dcu-sidebar-tertiary:#8f8f8f;--dcu-sidebar-navigation:#cdcdcd;--dcu-sidebar-icon:#afafaf;--dcu-sidebar-hover:rgba(255,255,255,.10);--dcu-sidebar-border:rgba(255,255,255,.08)}
.dcu-settings-rail .dcu-icon{display:grid;place-items:center;width:36px;height:36px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dcu-sidebar-tertiary);line-height:0}
.dcu-settings-rail .dcu-icon svg{width:18px;height:18px}
.dcu-settings-rail button.dcu-icon{cursor:pointer}
.dcu-settings-rail button.dcu-icon:hover{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}
.dcu-settings-rail .dcu-icon[data-active]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}
/* 设置页里的 home 只是「返回应用」入口，不高亮：当前所在由左侧导航分区表达，窄栏保持安静。 */
.dcu-settings-rail .dcu-icon[data-busy]{background:var(--dcu-sidebar-hover);color:var(--dcu-sidebar-primary)}
.dcu-settings-rail .dcu-rail-divider{flex:none;width:24px;height:1px;margin:4px 0;background:var(--dcu-sidebar-border)}
.dcu-settings-rail .dcu-rail-spacer{flex:1}
/* 折叠键已上移到 Windows 标题栏（收放设置页自己的导航列）；非 Windows 平台保留在轨上。 */
html[data-windows-titlebar] .dcu-settings-rail .dcu-rail-collapse{display:none}

body[data-ds-dark-theme] .dcu-settings-page{--sp-bg:#0d0d0d;--sp-nav:var(--dcu-sidebar-background,#101010);--sp-card:#181818;--sp-border:#212121;--sp-text:#ededed;--sp-muted:#afafaf;--sp-hover:rgba(255,255,255,.10);--sp-active:rgba(255,255,255,.12);--dcu-sidebar-background:#101010;--dcu-sidebar-rail:#0c0c0c;color-scheme:dark}
.dcu-settings-page *{box-sizing:border-box}
.dcu-settings-page button,.dcu-settings-page input{font:inherit}
.dcu-settings-page button{cursor:pointer}
.dcu-settings-page :focus-visible{outline:2px solid #459cff;outline-offset:3px}
.dcu-settings-nav{--sp-text:var(--dcu-sidebar-navigation,#303030);--sp-muted:var(--dcu-sidebar-secondary,#5d5d5d);--sp-hover:var(--dcu-sidebar-hover,rgba(13,13,13,.08));--sp-active:var(--dcu-sidebar-hover,rgba(13,13,13,.08));--sp-border:var(--dcu-sidebar-border,rgba(13,13,13,.08));display:flex;flex-direction:column;min-height:0;padding:18px 8px;background:var(--sp-nav);border-top-left-radius:16px;overflow:hidden;box-shadow:-6px 0 12px -5px var(--dcu-sidebar-lift,rgba(0,0,0,.04))}
/* 返回、插槽头与搜索框常驻，只有分区列表滚动。 */
.dcu-settings-nav>*{flex:none}
.dcu-settings-nav>.dcu-settings-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--sp-border) transparent}
/* body 直属浮层被宿主整层标为 no-drag；撤销整层扣除，仅开放顶部安全区。
   宿主把窗口拖动条画在 frame 顶部，第一行 ::before 已重新声明拖动区。 */
html[data-platform=darwin] body>.dcu-settings-page:not(#root){-webkit-app-region:initial}
/* 设置页与主界面共用同一对 ←/→ 和折叠键（浏览器式历史，设置页自身也是栈上的位置）：
   Windows 下三枚按键出现在标题栏带里，Desktop 菜单让位到 120px；
   未提供历史（或非 Windows 平台，按键由其自身样式隐藏）时菜单保持 12px。 */
html[data-windows-titlebar]:has(.dcu-settings-page){--dsh-windows-menu-start:12px}
html[data-windows-titlebar]:has(.dcu-settings-page .dcu-desktop-navigation[data-collapse]){--dsh-windows-menu-start:120px}
/* Windows 全屏时隐藏 Desktop 菜单，避免悬空遮挡设置页内容。 */
html[data-windows-titlebar][data-fullscreen] [data-windows-menu]{display:none!important}
body[data-ds-dark-theme] .dcu-settings-nav{--sp-text:var(--dcu-sidebar-navigation,#cdcdcd);--sp-muted:var(--dcu-sidebar-secondary,#afafaf);--sp-hover:var(--dcu-sidebar-hover,rgba(255,255,255,.10));--sp-active:var(--dcu-sidebar-hover,rgba(255,255,255,.10));--sp-border:var(--dcu-sidebar-border,rgba(255,255,255,.08))}
.dcu-settings-back{display:flex;align-items:center;flex-shrink:0;gap:8px;width:100%;height:30px;padding:5px 8px;border:0;border-radius:10px;background:transparent;color:var(--sp-text);text-align:left}
.dcu-settings-back:hover,.dcu-settings-link:hover{background:var(--sp-hover)}
.dcu-settings-search{display:flex;align-items:center;gap:8px;padding:5px 9px;margin:12px 0 18px;background:var(--sp-hover);border:1px solid transparent;border-radius:8px;color:var(--sp-muted)}
.dcu-settings-search:focus-within{border-color:#459cff}
.dcu-settings-search input{width:100%;min-width:0;border:0;background:transparent;color:var(--sp-text);outline:none;font-size:13px}
.dcu-settings-search input[type=search]{appearance:none;padding:0;border-radius:0;box-shadow:none;line-height:20px}
.dcu-settings-search input:focus,.dcu-settings-search input:focus-visible{outline:none;box-shadow:none}
.dcu-settings-search input::placeholder{color:var(--sp-muted)}
.dcu-settings-group{flex-shrink:0;margin:0 0 16px}
.dcu-settings-group-label{margin:0 8px 4px;color:var(--sp-muted);font-size:12px;font-weight:500}
.dcu-settings-link{display:flex;align-items:center;gap:8px;height:30px;min-height:30px;min-width:0;width:100%;padding:5px 8px;border:0;border-radius:10px;overflow:hidden;background:transparent;color:var(--sp-text);text-align:left;font-size:13px!important}
/* Codex Desktop SidebarItem / SidebarSection：30px 行高、1px 行距、内收焦点圈。 */
.dcu-settings-link+.dcu-settings-link{margin-top:1px}
.dcu-settings-back:focus-visible,.dcu-settings-link:focus-visible{outline-offset:-2px}
@supports(corner-shape:superellipse(1.5)){.dcu-settings-back,.dcu-settings-link{border-radius:12.5px;corner-shape:superellipse(1.5)}}
.dcu-settings-link[aria-current=page]{background:var(--sp-active)}
.dcu-settings-link svg{flex:none;color:var(--dcu-sidebar-icon,var(--sp-text));opacity:1}
.dcu-settings-link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dcu-settings-empty{padding:8px;color:var(--sp-muted);font-size:13px}
.dcu-settings-main{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;background:var(--sp-bg);scrollbar-width:thin;scrollbar-color:var(--sp-border) transparent}
.dcu-settings-inner{width:min(100%,864px);margin:0 auto;padding:48px 48px}
/* 模型 Pro 的多列表格按主栏宽度伸展；其他设置页仍保持易读的常规宽度。 */
.dcu-settings-inner[data-settings-section=dsh-model-pro]{width:100%}
.dcu-settings-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px}
.dcu-settings-heading h1,.dcu-settings-inner:is([data-settings-section=models],[data-settings-section=plugins],[data-settings-section=agent-presets]) [class$="_section"]>h2:is([class$="_title"],[class$="_heading"]){margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px}
.dcu-settings-inner:is([data-settings-section=models],[data-settings-section=plugins],[data-settings-section=agent-presets]) [class$="_section"]>p[class$="_intro"]{margin:0;font-size:14px;line-height:22px}
.dcu-settings-heading[data-own-title=false]{justify-content:flex-end;margin-bottom:16px}
.dcu-settings-heading:not(:has(h1,button,a,[role=button])){display:none}
.dcu-settings-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;color:var(--sp-muted)}
.dcu-settings-actions button{font-size:12px}
.dcu-settings-general-group{margin-bottom:44px}
.dcu-settings-general-group h2{margin:0 0 16px;font-size:14px;font-weight:600;color:var(--sp-text)}
.dcu-settings-card{border:1px solid var(--sp-border);border-radius:16px;background:var(--sp-card);padding:0 16px;overflow:hidden}
.dcu-settings-row+.dcu-settings-row{border-top:1px solid var(--sp-border)}
.dcu-settings-row>[data-slot]{display:contents}
.dcu-settings-row>[data-slot]>*{padding:12px 0!important;border-bottom:0!important;margin:0!important;min-width:0}
.dcu-settings-row button{font-size:13px;border-radius:8px}
.dcu-settings-row input{max-width:100%}
.dcu-settings-document{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;font-size:14px;line-height:20px}
.dcu-settings-developer-tools{display:flex;align-items:center;justify-content:space-between;gap:24px;width:100%;padding:12px 0;font-size:14px;line-height:20px}
.dcu-settings-developer-tools-copy{min-width:0}
.dcu-settings-developer-tools-title{font-size:14px;line-height:20px;font-weight:400;color:var(--sp-text)}
.dcu-settings-developer-tools-description{margin-top:4px;font-size:12px;line-height:18px;color:var(--sp-muted)}
.dcu-settings-developer-tools-error{margin-top:4px;font-size:12px;line-height:18px;color:#f87171}
.dcu-settings-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3,rgba(127,127,127,.35));cursor:pointer;outline:none}
.dcu-settings-switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#459cff);outline-offset:2px}
.dcu-settings-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary,#000)}
.dcu-settings-switch:disabled{cursor:default;opacity:.5}
.dcu-settings-switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb,#fff);box-shadow:0 1px 2px rgba(0,0,0,.15);transition:transform 120ms ease;pointer-events:none}
.dcu-settings-switch[aria-checked=true] .dcu-settings-switch-thumb{background:var(--dsw-alias-label-primary-foreground,#fff);transform:translateX(16px)}
.dcu-settings-document-copy{min-width:0}
.dcu-settings-document p{margin:4px 0 0;font-size:12px;color:var(--sp-muted);overflow-wrap:anywhere}
.dcu-settings-document button{flex:none;min-height:36px;padding:8px 16px;border:0;border-radius:8px;background:var(--sp-hover);color:var(--sp-text);font:inherit;font-size:13px;cursor:pointer;transition:background .15s}
.dcu-settings-document button:hover:not(:disabled){background:color-mix(in srgb,var(--sp-text) 14%,transparent)}
.dcu-settings-document button:focus-visible{outline:2px solid var(--sp-muted);outline-offset:3px}
.dcu-settings-document button:disabled{opacity:.55;cursor:wait}
.dcu-settings-trigger{appearance:none;box-sizing:border-box;display:flex;align-items:center;border:0;border-radius:8px;background:transparent;color:var(--dcu-sidebar-navigation,inherit);height:36px;min-height:36px;padding:0 4px;width:100%;font:400 14px/20px var(--dsw-font-family);text-align:left;cursor:pointer;transition:background-color 160ms ease,color 160ms ease,transform 120ms ease}
.dcu-settings-trigger-content{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:8px;align-items:center;width:100%;min-width:0}
.dcu-settings-trigger-content svg{display:block;width:16px;height:16px;color:var(--dcu-sidebar-icon,currentColor);transition:transform 220ms cubic-bezier(.16,1,.3,1)}
.dcu-settings-trigger:hover{background:var(--dcu-sidebar-hover,rgba(127,127,127,.12));color:var(--dcu-sidebar-primary,inherit)}
.dcu-settings-trigger:hover svg{transform:rotate(18deg)}
.dcu-settings-trigger:active{transform:scale(.98)}
.dcu-settings-trigger:focus-visible{outline:2px solid #459cff;outline-offset:2px;background:var(--dcu-sidebar-hover,rgba(127,127,127,.12))}
.dcu-settings-trigger[data-wide=false]{justify-content:center;width:36px;padding:0!important}
.dcu-settings-trigger[data-wide=false] .dcu-settings-trigger-content{grid-template-columns:16px;justify-content:center}

/* 进出场统一为整页 140ms 淡入（与 close() 的退场对称）。此前导航/内容各播一段
   opacity+transform 入场，两段位移叠在一起正是「进设置闪两下」的来源。 */
.dcu-settings-page{animation:dcu-settings-enter 140ms ease-out}
.dcu-settings-back,.dcu-settings-link{transition:background-color 160ms ease,color 160ms ease}
@keyframes dcu-settings-enter{from{opacity:0}to{opacity:1}}
/* 只有 Desktop 明确提供系统背景材质时才贯通透明层，普通浏览器保持实色。 */
html[data-dsh-native-backdrop=mica]:has(.dcu-root),html[data-dsh-native-backdrop=mica]:has(.dcu-root) body,html[data-dsh-native-backdrop=mica] #root,html[data-dsh-native-backdrop=mica] #root>[data-slot=root],html[data-dsh-native-backdrop=mica] #root>[data-slot=root]>div{background:transparent!important}
html[data-dsh-native-backdrop=mica] #root>[data-slot=root]>div>div:has(>[data-slot=sidebar]){background:transparent!important}
html[data-dsh-native-backdrop=mica] #root :is([class$="_centerCol"],[class$="_detailsCol"]){background:var(--dsw-alias-bg-base,#fff)}
html[data-dsh-native-backdrop=mica] :is(.dcu-root,.dcu-settings-nav){background:rgba(255,255,255,.18)}
html[data-dsh-native-backdrop=mica] body[data-ds-dark-theme] :is(.dcu-root,.dcu-settings-nav){background:rgba(20,23,22,.18)}
/* 会话折叠容器显式设了 visible，必须同时隐藏隔离分支的后代，避免穿透透明设置页。 */
html[data-dsh-native-backdrop=mica] body:has(.dcu-settings-page) .dcu-root :is([inert],[inert] *){visibility:hidden!important}
/* 宿主主分支（#root）只做 inert 不隐藏：设置页进出场是 140ms 交叉淡化，若把主界面藏掉，
   淡入的底就是 body 白底，整窗会闪白一帧。只有透明材质（mica）下必须真的隐藏。
   其他 body 直属 portal 可能带更高 z-index 越过设置页，维持无条件隐藏。 */
html[data-dsh-native-backdrop=mica] body:has(.dcu-settings-page) :is([data-dcu-settings-isolated-host],[data-dcu-settings-isolated-host] *){visibility:hidden!important}
body:has(.dcu-settings-page) :is([data-dcu-settings-isolated],[data-dcu-settings-isolated] *){visibility:hidden!important}
body:has(.dcu-settings-page) > [role=alert]{visibility:visible!important}
html[data-dsh-native-backdrop=mica] .dcu-settings-page,html[data-dsh-native-backdrop=mica] body:has(.dcu-settings-page) .dcu-root{background:transparent}

.dcu-plugin-config [data-plugin-panel]{height:auto;padding:0;overflow:visible;align-items:stretch;gap:24px}
.dcu-plugin-config [data-plugin-panel]>*{max-width:none}
.dcu-plugin-config [data-plugin-panel]>header :is(h1,p){display:none}
.dcu-plugin-config [data-plugin-panel]>header{justify-content:flex-end}
@media(prefers-reduced-motion:reduce){.dcu-settings-trigger,.dcu-settings-trigger-content svg,.dcu-settings-back,.dcu-settings-link,.dcu-settings-page,.dcu-settings-main,.dcu-settings-nav>*{transition:none}.dcu-settings-trigger:hover svg,.dcu-settings-trigger:active{transform:none}.dcu-settings-page,.dcu-settings-nav,.dcu-settings-inner{animation:none}}
.dcu-settings-page [data-slot="settings.section"]{min-width:0}
.dcu-settings-inner:has(.dcu-connector-frame){height:100%;display:flex;flex-direction:column}
.dcu-settings-inner:has(.dcu-connector-frame)>.dcu-settings-heading{flex:none}
.dcu-settings-page .dcu-connectors:has(>.dcu-connector-frame){display:flex;flex-direction:column;flex:1 1 0;min-height:0}
.dcu-settings-page .dcu-connector-frame{flex:1 1 0;min-height:0;height:100%}

@media(max-width:900px){.dcu-settings-inner{padding:32px 28px}.dcu-settings-heading{align-items:flex-start;flex-direction:column;gap:12px}}
@media(max-width:600px){.dcu-settings-page{grid-template-columns:1fr;grid-template-rows:var(--dcu-settings-top) auto minmax(0,1fr)}.dcu-settings-nav{grid-column:1;grid-row:2;padding:8px 12px;max-height:220px;border-right:0;border-bottom:1px solid var(--sp-border)}.dcu-settings-main{grid-column:1;grid-row:3}.dcu-settings-search{margin:6px 0}.dcu-settings-groups{display:flex;gap:8px;overflow-x:auto;flex:none}.dcu-settings-group{display:flex;gap:4px;margin:0;flex:none}.dcu-settings-group-label{display:none}.dcu-settings-link{width:auto;min-height:40px;flex:none}.dcu-settings-link+.dcu-settings-link{margin-top:0}.dcu-settings-inner{padding:32px 16px}.dcu-settings-heading{margin-bottom:28px}.dcu-settings-heading h1,.dcu-settings-inner:is([data-settings-section=models],[data-settings-section=plugins],[data-settings-section=agent-presets]) [class$="_section"]>h2:is([class$="_title"],[class$="_heading"]){font-size:22px}.dcu-settings-card{padding:0 12px}.dcu-settings-row>[data-slot]>*{flex-wrap:wrap;gap:12px!important}.dcu-settings-general-group{margin-bottom:32px}}
/* 窄屏（单列布局）时窄栏让位给导航，避免两列挤在一起。 */
@media(max-width:600px){.dcu-settings-rail{display:none}}
@media(max-height:180px){.dcu-settings-nav{overflow-y:auto}.dcu-settings-nav>.dcu-settings-scroll{flex:0 0 auto;overflow:visible}}
`;
		//#endregion
		//#region src/client/settings-focus.ts
		/** 设置页与宿主浮层共享的可交互判断，忽略隐藏及已被隔离的对话框。 */
		function settingsElementAvailable(element) {
			for (let node = element; node !== null; node = node.parentElement) {
				const style = getComputedStyle(node);
				if (node.inert || node.hidden || node.getAttribute("aria-hidden") === "true" || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
			}
			return true;
		}
		function settingsOverlays(selector = "[role=\"dialog\"],[role=\"alertdialog\"],[role=\"menu\"],[role=\"listbox\"]") {
			return [...document.querySelectorAll(selector)].filter(settingsElementAvailable);
		}
		//#endregion
		//#region src/client/CodexSettingsPage.tsx
		const groupLabels = {
			personal: "settings.personal",
			integrations: "settings.integrations",
			records: "settings.records",
			permissions: "settings.permissions",
			general: "settings.general",
			editor: "settings.editor"
		};
		function sectionIcon(id) {
			if (id === "market" || id === "plugin-marketplace") return Store;
			if (id === "better-sidebar" || id === "sidebar-cards") return PanelRight;
			if (/model/.test(id)) return Cpu;
			if (/archive/.test(id)) return Archive;
			if (/about/.test(id)) return CircleQuestionMark;
			if (/expert|agency/.test(id)) return User;
			if (/skill/.test(id)) return Sparkles;
			if (/connector|mcp/.test(id)) return Link;
			if (/schedule|automation/.test(id)) return Clock;
			if (/im|assistant/.test(id)) return MessageSquare;
			if (id === "general") return Settings;
			if (/plugin/.test(id)) return SlidersHorizontal;
			return Box;
		}
		/** 独立设置视图复用原始 section/close 合约，退出时保留底层会话与输入状态。 */
		const noShortcuts = [];
		const emptyShortcuts$1 = {
			subscribe: () => () => {},
			getSnapshot: () => noShortcuts
		};
		function CodexSettingsPage({ wide, sections, onboarding, connectionState, reconnect, accountLauncher, shortcuts = emptyShortcuts$1, navigationHistory, useSessions, renderSlot, t }) {
			const rows = (0, react.useSyncExternalStore)(sections.subscribe, sections.getSnapshot);
			const steps = (0, react.useSyncExternalStore)(onboarding.subscribe, onboarding.getSnapshot);
			const connection = (0, react.useSyncExternalStore)(connectionState.subscribe, connectionState.getSnapshot);
			const hostAccountLauncher = (0, react.useSyncExternalStore)(accountLauncher?.subscribe ?? (() => () => {}), accountLauncher?.getSnapshot ?? (() => false));
			const settingsShortcut = (0, react.useSyncExternalStore)(shortcuts.subscribe, shortcuts.getSnapshot).find((row) => row.id === "settings.open");
			const onboardingActive = useSessions((state) => isBlankOnboardingSession(state));
			const [completed, setCompleted] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [open, setOpen] = (0, react.useState)(false);
			const [activeId, setActiveId] = (0, react.useState)("general");
			const [query, setQuery] = (0, react.useState)("");
			const [narrow, setNarrow] = (0, react.useState)(false);
			const [recovered, setRecovered] = (0, react.useState)(false);
			const previousConnection = (0, react.useRef)(connection);
			const trigger = (0, react.useRef)(null);
			const launcherRoot = (0, react.useRef)(null);
			const returnFocus = (0, react.useRef)(null);
			const page = (0, react.useRef)(null);
			const back = (0, react.useRef)(null);
			const onboardingRoot = (0, react.useRef)(null);
			const main = (0, react.useRef)(null);
			const wasOpen = (0, react.useRef)(false);
			const exitAnimation = (0, react.useRef)(null);
			const active = rows.find((row) => row.id === activeId) ?? rows[0];
			const step = onboardingActive ? steps.find((item) => item.id !== "welcome-notice" && !completed.has(item.id)) : void 0;
			const close = (0, react.useCallback)(() => {
				if (exitAnimation.current !== null) return;
				const finish = () => {
					exitAnimation.current = null;
					setOpen(false);
					setQuery("");
				};
				const element = page.current;
				if (element?.animate === void 0 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
					finish();
					return;
				}
				const animation = element.animate([{ opacity: getComputedStyle(element).opacity }, { opacity: 0 }], {
					duration: 140,
					easing: "ease-out",
					fill: "forwards"
				});
				exitAnimation.current = animation;
				animation.onfinish = finish;
			}, []);
			const openSection = (0, react.useCallback)((id) => {
				if (page.current === null) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				exitAnimation.current?.cancel();
				exitAnimation.current = null;
				setActiveId(id);
				setOpen(true);
			}, []);
			(0, react.useLayoutEffect)(() => {
				const element = launcherRoot.current ?? trigger.current;
				const openRoot = (event) => {
					event.preventDefault();
					openSection("general");
				};
				const navigate = (event) => {
					const detail = event.detail;
					const labels = detail?.labels;
					if (!Array.isArray(labels)) return;
					const row = labels.flatMap((label) => rows.filter((item) => (item.id === "general" ? t("settings.general") : item.label) === label))[0];
					if (!row) {
						if (element === launcherRoot.current) {
							event.preventDefault();
							detail.result = "missing";
						}
						return;
					}
					event.preventDefault();
					detail.result = "selected";
					setQuery("");
					openSection(row.id);
				};
				element?.addEventListener(SETTINGS_OPEN_SECTION_EVENT, navigate);
				element?.addEventListener(SETTINGS_OPEN_ROOT_EVENT, openRoot);
				return () => {
					element?.removeEventListener(SETTINGS_OPEN_SECTION_EVENT, navigate);
					element?.removeEventListener(SETTINGS_OPEN_ROOT_EVENT, openRoot);
				};
			}, [
				rows,
				t,
				openSection,
				hostAccountLauncher
			]);
			(0, react.useEffect)(() => () => {
				exitAnimation.current?.cancel();
			}, []);
			const viewBridge = (0, react.useMemo)(() => ({
				open: (location) => {
					openSection(location.section ?? "general");
				},
				close: () => {
					close();
				}
			}), [close, openSection]);
			(0, react.useEffect)(() => navigationHistory?.registerView(viewBridge), [navigationHistory, viewBridge]);
			(0, react.useEffect)(() => {
				if (navigationHistory === void 0 || !open) return;
				navigationHistory.enterView({
					kind: "settings",
					section: activeId
				});
				return () => {
					navigationHistory.leaveView();
				};
			}, [navigationHistory, open]);
			(0, react.useEffect)(() => {
				if (navigationHistory === void 0 || !open) return;
				navigationHistory.enterView({
					kind: "settings",
					section: activeId
				});
			}, [
				navigationHistory,
				open,
				activeId
			]);
			(0, react.useLayoutEffect)(() => {
				if (open && page.current !== null) page.current.style.setProperty("--dcu-sidebar-expanded-width", `${settingsSidebarWidth(document)}px`);
			}, [open]);
			(0, react.useEffect)(() => {
				if (!onboardingActive) setCompleted(/* @__PURE__ */ new Set());
			}, [onboardingActive]);
			(0, react.useEffect)(() => {
				const previous = previousConnection.current;
				previousConnection.current = connection;
				setRecovered(connection === "connected" && (previous === "disconnected" || previous === "connecting"));
				if (connection !== "connected") return;
				const timer = window.setTimeout(() => {
					setRecovered(false);
				}, 3e3);
				return () => {
					window.clearTimeout(timer);
				};
			}, [connection]);
			(0, react.useLayoutEffect)(() => {
				if (wasOpen.current && !open) {
					const previous = returnFocus.current;
					(hostAccountLauncher ? previous?.isConnected && previous !== document.body ? previous : launcherRoot.current?.querySelector("button,a[href],[tabindex=\"0\"]") : trigger.current)?.focus();
				}
				wasOpen.current = open;
				if (!open || page.current === null) return;
				if (settingsElementAvailable(page.current) && settingsOverlays().length === 0) back.current?.focus();
				const hidden = /* @__PURE__ */ new Map();
				const guideModals = step === void 0 ? [] : settingsOverlays("[role=\"dialog\"][aria-modal=\"true\"],[role=\"alertdialog\"][aria-modal=\"true\"]");
				const isolate = (element) => {
					if (element.parentElement === document.body && element.hasAttribute("data-dsh-pet-overlay")) return;
					if (element.hasAttribute("data-windows-menu")) return;
					if (element.parentElement === document.body && element.getAttribute("role") === "alert") return;
					if (element === onboardingRoot.current || guideModals.includes(element)) return;
					if (guideModals.some((modal) => element.contains(modal))) {
						for (const child of element.children) if (child instanceof HTMLElement && !/^(STYLE|SCRIPT|LINK)$/.test(child.tagName)) isolate(child);
						return;
					}
					const hostBranch = element.parentElement === document.body && element.id === "root";
					hidden.set(element, {
						inert: element.inert,
						marker: element.getAttribute("data-dcu-settings-isolated"),
						hostMarker: element.getAttribute("data-dcu-settings-isolated-host")
					});
					element.inert = true;
					if (hostBranch) element.setAttribute("data-dcu-settings-isolated-host", "");
					else element.setAttribute("data-dcu-settings-isolated", "");
				};
				let branch = page.current;
				while (branch.parentElement !== null) {
					for (const sibling of branch.parentElement.children) {
						if (!(sibling instanceof HTMLElement) || sibling === branch || /^(STYLE|SCRIPT|LINK)$/.test(sibling.tagName)) continue;
						isolate(sibling);
					}
					branch = branch.parentElement;
					if (branch === document.body) break;
				}
				const onKeyDown = (event) => {
					if (event.key === "Escape" && !event.defaultPrevented && settingsOverlays().length === 0) {
						event.preventDefault();
						close();
					}
				};
				const keepFocus = (event) => {
					const target = event.target;
					if (!(target instanceof Node) || page.current === null || !settingsElementAvailable(page.current)) return;
					if (page.current.contains(target) || onboardingRoot.current?.contains(target) || [...document.querySelectorAll("body > [data-dsh-pet-overlay], body > [role=alert]")].some((root) => root.contains(target)) || [...document.querySelectorAll("[data-windows-menu]")].some((root) => root.contains(target)) || settingsOverlays().some((overlay) => overlay.contains(target))) return;
					back.current?.focus();
				};
				const wrapFocus = (event) => {
					if (event.key !== "Tab" || event.defaultPrevented || page.current === null || !settingsElementAvailable(page.current) || settingsOverlays().length > 0) return;
					const menuButtons = [...document.querySelectorAll("[data-windows-menu]")].filter(settingsElementAvailable).flatMap((host) => [...host.shadowRoot?.querySelectorAll("button") ?? host.querySelectorAll("button")]).filter((button) => button.tabIndex >= 0 && !button.matches(":disabled") && getComputedStyle(button).display !== "none");
					const pageItems = [
						page.current,
						onboardingRoot.current,
						...document.querySelectorAll("body > [data-dsh-pet-overlay], body > [role=alert]")
					].filter((root) => root !== null).flatMap((root) => [...root.querySelectorAll("button,input,select,textarea,a[href],[tabindex]")]).filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && settingsElementAvailable(element));
					const items = [...menuButtons, ...pageItems];
					if (items.length === 0) return;
					const active = document.activeElement?.shadowRoot?.activeElement ?? document.activeElement;
					const isFirst = active === items[0];
					const isLast = active === items.at(-1);
					if (event.shiftKey && isFirst) {
						event.preventDefault();
						items.at(-1)?.focus();
					} else if (!event.shiftKey && isLast) {
						event.preventDefault();
						items[0]?.focus();
					}
				};
				document.addEventListener("keydown", onKeyDown, true);
				document.addEventListener("keydown", wrapFocus);
				document.addEventListener("focusin", keepFocus);
				return () => {
					document.removeEventListener("keydown", onKeyDown, true);
					document.removeEventListener("keydown", wrapFocus);
					document.removeEventListener("focusin", keepFocus);
					for (const [element, previous] of hidden) {
						element.inert = previous.inert;
						if (previous.marker === null) element.removeAttribute("data-dcu-settings-isolated");
						else element.setAttribute("data-dcu-settings-isolated", previous.marker);
						if (previous.hostMarker === null) element.removeAttribute("data-dcu-settings-isolated-host");
						else element.setAttribute("data-dcu-settings-isolated-host", previous.hostMarker);
					}
				};
			}, [
				open,
				close,
				step?.id,
				hostAccountLauncher
			]);
			(0, react.useEffect)(() => {
				if (main.current !== null) main.current.scrollTop = 0;
			}, [active?.id]);
			const visible = orderSettingsRows(filterSettingsRows(rows, query));
			const ownTitle = active?.id === "general" ? t("settings.general") : active?.id === "plugin-config" ? t("settings.pluginConfig") : void 0;
			const connectionIndicator = connection === "disconnected" ? "disconnected" : connection === "connecting" ? "connecting" : recovered ? "recovered" : void 0;
			const sharedRail = useSidebarRail();
			const settingsRail = (0, react.useMemo)(() => {
				const leave = (run) => () => {
					close();
					run();
				};
				const plain = (label, icon) => ({
					label,
					icon,
					run: close
				});
				const collapseRail = {
					label: narrow ? t("sidebar.expand") : t("sidebar.collapse"),
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelLeft, { size: 16 }),
					run: () => {
						setNarrow((value) => !value);
					}
				};
				const shell = {
					home: {
						label: t("settings.back"),
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailHomeIcon, {}),
						run: close,
						active: false
					},
					collapse: collapseRail,
					plugins: plain(t("sidebar.plugins"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RailBlocksIcon, {})),
					more: {
						label: t("sidebar.extensions"),
						items: []
					},
					panels: [],
					settings: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-icon",
						"data-active": "true",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Settings, { size: 16 })
					}),
					homeRef: back,
					className: "dcu-settings-rail"
				};
				if (sharedRail === void 0) return shell;
				return {
					...shell,
					...sharedRail.collapse === void 0 ? {} : { collapse: {
						...collapseRail,
						icon: sharedRail.collapse.icon
					} },
					...sharedRail.schedule === void 0 ? {} : { schedule: {
						...sharedRail.schedule,
						active: false,
						run: leave(sharedRail.schedule.run)
					} },
					plugins: {
						...sharedRail.plugins,
						run: leave(sharedRail.plugins.run)
					},
					...sharedRail.more === void 0 ? {} : { more: {
						label: sharedRail.more.label,
						items: sharedRail.more.items,
						...sharedRail.more.panels === void 0 ? {} : { panels: sharedRail.more.panels.map((panel) => ({
							...panel,
							active: false,
							run: leave(panel.run)
						})) },
						pinnedIds: sharedRail.more.pinnedIds,
						togglePin: sharedRail.more.togglePin,
						pinLabel: sharedRail.more.pinLabel,
						unpinLabel: sharedRail.more.unpinLabel
					} },
					panels: sharedRail.panels.map((panel) => ({
						...panel,
						active: false,
						run: leave(panel.run)
					})),
					...sharedRail.pinned === void 0 ? {} : { pinned: sharedRail.pinned.map((item) => ({
						...item,
						active: false,
						run: leave(item.run)
					})) }
				};
			}, [
				back,
				close,
				narrow,
				sharedRail,
				t
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: settingsPageStyles }),
				hostAccountLauncher ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: launcherRoot,
					"data-dcu-settings-owner": true,
					style: { display: "contents" },
					children: renderSlot("settings.launcher", {
						wide,
						settingsOpen: open,
						...settingsShortcut?.keys.length ? { settingsShortcut: {
							keys: settingsShortcut.keys,
							aria: settingsShortcut.aria
						} } : {},
						openSettings: () => {
							openSection("general");
						},
						openOnboarding: (id) => {
							openSection(id);
						}
					})
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					ref: trigger,
					type: "button",
					className: "dcu-settings-trigger",
					"data-dcu-settings-trigger": true,
					"data-wide": wide,
					"aria-expanded": open,
					"aria-label": t("settings.title"),
					onClick: () => {
						openSection("general");
					},
					children: renderSlot("settings.trigger", { wide })
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.ConnectionIndicator, {
					state: wide ? connectionIndicator : void 0,
					disconnectedLabel: t("settings.disconnected"),
					connectingLabel: t("settings.connecting"),
					recoveredLabel: t("settings.recovered"),
					reconnectActionLabel: t("settings.reconnect"),
					restartActionLabel: t("settings.reconnect"),
					onReconnect: reconnect
				}),
				(0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: page,
					className: "dcu-settings-page",
					"data-dcu-settings-page": true,
					"data-narrow": narrow ? "" : void 0,
					role: "region",
					"aria-label": t("settings.title"),
					children: [
						navigationHistory && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DesktopNavigationControls, {
							history: navigationHistory,
							t,
							collapse: {
								label: narrow ? t("sidebar.expand") : t("sidebar.collapse"),
								run: () => {
									setNarrow((value) => !value);
								}
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarRail, { api: settingsRail }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
							className: "dcu-settings-nav",
							"aria-label": t("settings.title"),
							children: [
								renderSlot("settings.header", {}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dcu-settings-search",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Search, {
										size: 15,
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "search",
										value: query,
										"aria-label": t("settings.search"),
										placeholder: t("settings.search"),
										onChange: (event) => {
											setQuery(event.target.value);
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-settings-scroll",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dcu-settings-groups",
											children: [
												"personal",
												"integrations",
												"records"
											].map((group) => {
												const entries = visible.filter((row) => settingsGroup(row.id) === group);
												return entries.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: "dcu-settings-group",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
														className: "dcu-settings-group-label",
														children: t(groupLabels[group])
													}), entries.map((row) => {
														const Icon = sectionIcon(row.id);
														return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: "dcu-settings-link",
															"aria-current": row.id === active?.id ? "page" : void 0,
															onClick: () => {
																setActiveId(row.id);
															},
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, {
																size: 16,
																strokeWidth: 1.6,
																"aria-hidden": "true"
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: row.id === "general" ? t("settings.general") : row.label })]
														}, row.id);
													})]
												}, group);
											})
										}),
										visible.length > 0 && !visible.some((row) => row.id === active?.id) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "dcu-settings-empty",
											role: "status",
											children: t("settings.filterHint")
										}),
										visible.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "dcu-settings-empty",
											role: "status",
											children: t("settings.noResults")
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							ref: main,
							className: "dcu-settings-main",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-settings-inner",
								"data-settings-section": active?.id,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
									className: "dcu-settings-heading",
									"data-own-title": ownTitle !== void 0,
									children: [ownTitle !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: ownTitle }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dcu-settings-actions",
										children: renderSlot("settings.action", {})
									})]
								}), active !== void 0 && renderSlot("settings.section", { close }, { only: active.id })]
							})
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: onboardingRoot,
					style: { display: "contents" },
					children: step !== void 0 && renderSlot("settings.onboarding", {
						stepId: step.id,
						complete: () => {
							setCompleted((previous) => /* @__PURE__ */ new Set([...previous, step.id]));
						},
						openSection
					}, { only: step.id })
				})] }), document.body)
			] });
		}
		/** 每条偏好仍由原插件渲染和保存，只为公共条目添加可扩展的分组容器。 */
		function CodexGeneralSettings({ items, renderSlot, t }) {
			const rows = (0, react.useSyncExternalStore)(items.subscribe, items.getSnapshot);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-settings-general",
				children: [[
					"permissions",
					"general",
					"editor"
				].map((group) => {
					const entries = rows.filter((row) => generalItemGroup(row.id) === group);
					return entries.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dcu-settings-general-group",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t(groupLabels[group]) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-settings-card",
							children: entries.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dcu-settings-row",
								"data-dcu-settings-item": row.id,
								children: renderSlot("settings.general.item", {}, { only: row.id })
							}, row.id))
						})]
					}, group);
				}), renderSlot("settings.general.footer", {})]
			});
		}
		//#endregion
		//#region src/client/SettingsDocumentAction.tsx
		/** 通过宿主公开接口打开配置文件，沿用共享元数据和路径无关的操作。 */
		function SettingsDocumentAction({ describe, openDocument, t }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => describe.subscribe(listener), () => describe.getSnapshot());
			const busy = (0, react.useRef)(false);
			const [opening, setOpening] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let active = true;
				setError(false);
				describe.ensure().catch(() => {
					if (active) setError(true);
				});
				return () => {
					active = false;
				};
			}, [describe]);
			if (!snapshot.view?.hasDocument) return error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				role: "alert",
				children: t("settings.openDocumentError")
			}) : null;
			const open = async () => {
				if (busy.current) return;
				busy.current = true;
				setOpening(true);
				setError(false);
				try {
					setError(!(await openDocument()).ok);
				} catch {
					setError(true);
				} finally {
					busy.current = false;
					setOpening(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-settings-general-group",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("settings.advanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-settings-card",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-settings-document",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-settings-document-copy",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("settings.documentTitle") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("settings.documentDescription") }),
								error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									role: "alert",
									children: t("settings.openDocumentError")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": t("settings.openDocument"),
							"aria-busy": opening,
							disabled: opening,
							onClick: () => {
								open();
							},
							children: t(opening ? "settings.documentOpening" : "settings.documentOpen")
						})]
					})
				})]
			});
		}
		//#endregion
		//#region src/client/DeveloperToolsRow.tsx
		function DeveloperToolsRow({ developerTools, t }) {
			const enabled = (0, react.useSyncExternalStore)(developerTools.enabled.subscribe, developerTools.enabled.getSnapshot);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const toggle = (next) => {
				setFailed(false);
				setBusy(true);
				developerTools.setEnabled(next).catch(() => {
					setFailed(true);
				}).finally(() => {
					setBusy(false);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-settings-developer-tools",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dcu-settings-developer-tools-copy",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-settings-developer-tools-title",
							children: t("settings.developerTools.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-settings-developer-tools-description",
							children: t("settings.developerTools.description")
						}),
						failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-settings-developer-tools-error",
							role: "alert",
							children: t("settings.developerTools.error")
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": enabled,
					"aria-label": t("settings.developerTools.title"),
					disabled: busy,
					className: "dcu-settings-switch",
					onClick: () => {
						toggle(!enabled);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dcu-settings-switch-thumb" })
				})]
			});
		}
		//#endregion
		//#region src/client/settings-page-registration.ts
		const shellAliases = {
			"settings.launcher": "settings.codex.launcher",
			"settings.trigger": "settings.codex.trigger",
			"settings.header": "settings.codex.header",
			"settings.action": "settings.codex.action",
			"settings.close": "settings.codex.close",
			"settings.section": "settings.codex.section",
			"settings.onboarding": "settings.codex.onboarding"
		};
		const shellAliasChildren = {
			"settings.codex.launcher": {
				kind: "single",
				scope: "root"
			},
			"settings.codex.trigger": {
				kind: "single",
				scope: "root"
			},
			"settings.codex.header": {
				kind: "single",
				scope: "root"
			},
			"settings.codex.action": {
				kind: "list",
				scope: "root"
			},
			"settings.codex.close": {
				kind: "single",
				scope: "root"
			},
			"settings.codex.section": {
				kind: "list",
				scope: "root"
			},
			"settings.codex.onboarding": {
				kind: "list",
				scope: "root"
			}
		};
		const generalAliases = {
			"settings.general.item": "settings.codex.general.item",
			"settings.general.footer": "settings.codex.general.footer"
		};
		const generalAliasChildren = {
			"settings.codex.general.item": {
				kind: "list",
				scope: "root"
			},
			"settings.codex.general.footer": {
				kind: "list",
				scope: "root"
			}
		};
		const AliasedCodexSettingsPage = withSlotAliases(CodexSettingsPage, shellAliases);
		const AliasedCodexGeneralSettings = withSlotAliases(CodexGeneralSettings, generalAliases);
		function registerMirrors(ctx, aliases, register) {
			const unregister = register();
			const mirrors = [];
			const getSpec = ctx.slots.spec;
			try {
				for (const [source, target] of Object.entries(aliases)) if (typeof getSpec === "function") mirrors.push(ctx.slots.inject(source, () => mirrorSlot({ slots: ctx.slots }, source, target)));
			} catch (error) {
				for (const dispose of mirrors.reverse()) dispose();
				unregister();
				throw error;
			}
			return () => {
				for (const dispose of mirrors.reverse()) dispose();
				unregister();
			};
		}
		/** 快捷键服务可能晚于本插件启动。等到它就绪后再读 catalog，避免注册时一次取值把提示永久丢掉。 */
		const emptyShortcuts = [];
		function liveShortcutCatalog(ctx) {
			const listeners = /* @__PURE__ */ new Set();
			let catalog;
			const notify = () => {
				for (const listener of listeners) listener();
			};
			ctx.inject(["shortcuts"], (shortcutCtx) => {
				catalog = shortcutCtx.shortcuts.catalog;
				const unsubscribe = catalog.subscribe(notify);
				notify();
				return () => {
					unsubscribe();
					catalog = void 0;
					notify();
				};
			});
			return {
				getSnapshot: () => catalog?.getSnapshot() ?? emptyShortcuts,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}
			};
		}
		function accountLauncherPresence(slots) {
			const read = () => {
				try {
					return slots.entriesOfSlot("settings.launcher").length > 0;
				} catch {
					return false;
				}
			};
			return {
				getSnapshot: read,
				subscribe: (listener) => {
					try {
						return slots.subscribe("settings.launcher", listener);
					} catch {
						return () => {};
					}
				}
			};
		}
		function registerSettingsPage(ctx, navigationHistory) {
			const t = ctx.locale.bind(NS);
			const declared = (name) => {
				const spec = ctx.slots.spec;
				return typeof spec === "function" && spec.call(ctx.slots, name) !== void 0;
			};
			const officialSettingsReady = () => declared("settings.launcher");
			const connection = ctx.get("connection");
			const shortcuts = liveShortcutCatalog(ctx);
			const source = (name) => {
				let revision = "";
				let cached = [];
				return {
					getSnapshot: () => {
						const next = `${ctx.slots.getVersion(name)}:${ctx.locale.getSnapshot().revision}`;
						if (revision !== next) {
							revision = next;
							cached = ctx.slots.entriesOfSlot(name).map((entry) => ({
								id: entry.options.id ?? "",
								order: entry.options.order ?? 0,
								label: (typeof entry.options.label === "function" ? entry.options.label() : entry.options.label) ?? ""
							})).sort((a, b) => a.order - b.order);
						}
						return cached;
					},
					subscribe: (listener) => {
						const offSlots = ctx.slots.subscribe(name, listener);
						const offLocale = ctx.locale.subscribe(listener);
						return () => {
							offSlots();
							offLocale();
						};
					}
				};
			};
			const sections = source("settings.section");
			const onboarding = source("settings.onboarding");
			const items = source("settings.general.item");
			ctx.slots.inject("settings.trigger", () => ctx.slots.register({
				name: "settings.trigger",
				priority: -1,
				locale: NS
			}, ({ wide }) => (0, react.createElement)("span", { className: "dcu-settings-trigger-content" }, (0, react.createElement)(Settings, {
				size: 16,
				strokeWidth: 1.6
			}), wide ? (0, react.createElement)("span", null, t("settings.title")) : null)));
			ctx.slots.inject("settings.header", () => ctx.slots.register({
				name: "settings.header",
				priority: -1,
				locale: NS
			}, () => null));
			ctx.slots.inject("settings.close", () => ctx.slots.register({
				name: "settings.close",
				priority: -1,
				locale: NS
			}, () => t("settings.back")));
			let documentBound = false;
			const bindSettingsDocument = (settingsCtx, forms) => {
				if (documentBound) return;
				const remote = settingsCtx.get("remote");
				if (!remote.$host.isLoopback) return;
				documentBound = true;
				const describe = forms.describe();
				const remove = settingsCtx.slots.inject("settings.general.footer", () => settingsCtx.slots.register({
					name: "settings.general.footer",
					id: "open-document",
					priority: -1,
					locale: NS,
					inject: () => ({
						describe,
						openDocument: () => remote.settings.openSettingsDocument()
					})
				}, SettingsDocumentAction));
				return () => {
					documentBound = false;
					remove();
				};
			};
			ctx.inject(["configForms", "remote.settings"], (settingsCtx) => {
				return bindSettingsDocument(settingsCtx, settingsCtx.configForms);
			});
			ctx.inject(["configForms"], (configFormsCtx) => {
				const configForms = configFormsCtx.configForms;
				if (!configForms?.developerTools) return;
				const developerTools = configForms.developerTools;
				return configFormsCtx.slots.inject("settings.general.item", () => configFormsCtx.slots.register({
					name: "settings.general.item",
					id: "developer-tools",
					priority: -1,
					order: 15,
					locale: NS,
					inject: () => ({ developerTools })
				}, DeveloperToolsRow));
			});
			ctx.slots.inject("sidebar.settings", () => registerAfterOfficialWave(ctx.slots, "sidebar.settings", officialSettingsReady, () => {
				return registerMirrors(ctx, shellAliases, () => ctx.slots.register({
					name: "sidebar.settings",
					priority: -1,
					locale: NS,
					children: shellAliasChildren,
					inject: () => ({
						sections,
						onboarding,
						connectionState: connection.state,
						reconnect: () => {
							connection.reconnect();
						},
						accountLauncher: accountLauncherPresence(ctx.slots),
						shortcuts,
						navigationHistory
					})
				}, AliasedCodexSettingsPage));
			}, true));
			ctx.slots.inject("settings.section", () => registerAfterOfficialWave(ctx.slots, "settings.section", () => declared("settings.general.item"), () => {
				return registerMirrors(ctx, generalAliases, () => ctx.slots.register({
					name: "settings.section",
					id: "general",
					priority: -1,
					order: 0,
					locale: NS,
					label: () => t("settings.general"),
					children: generalAliasChildren,
					inject: () => ({ items })
				}, AliasedCodexGeneralSettings));
			}, true));
		}
		//#endregion
		//#region src/client/host-tabler-icons.ts
		/** 宿主图标族统一（唯一 owner）：宿主各处图标按钮换同族 Tabler，全走这里。
		*
		*  身份全部来自 app.asar 解包确认（dsh-client-ui-conversation / -sidebar-right /
		*  dsh-web-frontend dockkit）：
		*  - 对话顶栏「···」：工具条簇（headerUtilities，兜底 headerActions）里最后一颗
		*    带图标的宿主按钮——不在角槽、也不是活动卡开关（无稳定 data 标记，按结构识别）
		*  - 对话顶栏角槽按钮：[data-conversation-header-corner] 里的右侧栏开关
		*  - 右侧栏展开钮：[data-sidebar-right-expand]（新建会话页 / 侧栏收起态，与角槽同位）
		*  - 右侧栏收起钮：[data-sidebar-right-toggle]（面板条上）
		*    ↑ 三颗钮是同一功能的三个化身，共用一枚 panel 图标（marker 同名自然去重）
		*  - 分栏钮：[data-dockkit-split-button]
		*  - 全屏钮：[data-sidebar-right-mode]——宿主写的是「下一个模式」，push 态显示
		*    maximize，fullscreen 态显示 minimize
		*  - guide 页签标题罗盘：[data-sidebar-right-panel] 里 svg[class*="titleIcon"]
		*
		*  铁律：这些节点都由 React 管理，只准「原 svg 用 CSS 隐藏 + 末尾/兄弟插入自己的」，
		*  整颗重写宿主节点 / 搬移节点会重渲染脱钩白屏。数据标记做幂等；宿主重渲染重建节点后
		*  标记消失，下一轮扫描自动补挂；dispose 全量还原。 */
		const HOST_TABLER_ICONS_STYLE_ID = "dcu-host-tabler-icons-style";
		const HOST_TABLER_ICONS_STYLE = `
/* 宿主原 svg 隐藏不删；插入的 Tabler 统一 18px（与对话顶栏图标族一致，罗盘同尺）。
   flex:none 必须带：右侧栏条上的宿主按钮是 28px 盒 + 6px padding（内容区仅 16px），
   svg 作为 flex 子项默认可收缩，18px 会被压回 16px——这正是「条上图标比顶栏小」的原因。 */
[data-dcu-tabler-dots] svg:not(.dcu-tabler-icon),[data-dcu-tabler-panel] svg:not(.dcu-tabler-icon),[data-dcu-tabler-split] svg:not(.dcu-tabler-icon),[data-dcu-tabler-maximize] svg:not(.dcu-tabler-icon){display:none}
[data-dcu-tabler-dots] .dcu-tabler-icon,[data-dcu-tabler-panel] .dcu-tabler-icon,[data-dcu-tabler-split] .dcu-tabler-icon,[data-dcu-tabler-maximize] .dcu-tabler-icon{width:18px;height:18px;flex:none}
/* 分栏 / 全屏不做逐枚尺寸校正（用户定稿 2026-11-01）：右上三颗与「···」/panel
   全族统一 18px、stroke 2，同 viewBox 同字重；此前 split 16px / maximize 20px
   的墨迹校准已撤，不得回加。 */
svg[data-dcu-tabler-compass]{display:none}
svg[data-dcu-tabler-compass]+.dcu-tabler-icon{width:18px;height:18px;flex:none}
`;
		const DOTS_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/><path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/><path d=\"M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/></svg>";
		const PANEL_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12\"/><path d=\"M15 4l0 16\"/></svg>";
		const COLUMNS_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-16\"/><path d=\"M12 3v18\"/></svg>";
		const MAXIMIZE_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M4 8v-2a2 2 0 0 1 2 -2h2\"/><path d=\"M4 16v2a2 2 0 0 0 2 2h2\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v2\"/><path d=\"M16 20h2a2 2 0 0 0 2 -2v-2\"/></svg>";
		const MINIMIZE_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M15 19v-2a2 2 0 0 1 2 -2h2\"/><path d=\"M15 5v2a2 2 0 0 0 2 2h2\"/><path d=\"M5 15h2a2 2 0 0 1 2 2v2\"/><path d=\"M5 9h2a2 2 0 0 0 2 -2v-2\"/></svg>";
		const COMPASS_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"dcu-tabler-icon\"><path d=\"M8 16l2 -6l6 -2l-2 6l-6 2\"/><path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\"/></svg>";
		const MARKERS = "[data-dcu-tabler-dots],[data-dcu-tabler-panel],[data-dcu-tabler-split],[data-dcu-tabler-maximize]";
		/** 会话顶栏：结构兜底（含工具条簇的 header）。 */
		function conversationHeader(doc) {
			return [...doc.querySelectorAll("header")].find((node) => node.querySelector("[class*=\"headerUtilities\"], [class*=\"headerActions\"]")) ?? null;
		}
		const RULES = [
			{
				marker: "data-dcu-tabler-dots",
				pick: () => DOTS_ICON,
				find: (doc) => {
					const header = conversationHeader(doc);
					const cluster = header?.querySelector("[class*=\"headerUtilities\"]") ?? header?.querySelector("[class*=\"headerActions\"]") ?? header;
					if (cluster === null || cluster === void 0) return [];
					const more = [...cluster.querySelectorAll("button")].filter((button) => button.querySelector("svg") !== null && button.closest("[data-conversation-header-corner]") === null && !button.classList.contains("dcu-activity-toggle")).at(-1);
					return more === void 0 ? [] : [more];
				}
			},
			{
				marker: "data-dcu-tabler-panel",
				pick: () => PANEL_ICON,
				find: (doc) => {
					const corner = conversationHeader(doc)?.querySelector("[data-conversation-header-corner] button");
					return corner !== null && corner !== void 0 && corner.querySelector("svg") !== null ? [corner] : [];
				}
			},
			{
				marker: "data-dcu-tabler-panel",
				pick: () => PANEL_ICON,
				find: (doc) => doc.querySelectorAll("[data-sidebar-right-expand]")
			},
			{
				marker: "data-dcu-tabler-panel",
				pick: () => PANEL_ICON,
				find: (doc) => doc.querySelectorAll("[data-sidebar-right-toggle]")
			},
			{
				marker: "data-dcu-tabler-split",
				pick: () => COLUMNS_ICON,
				find: (doc) => doc.querySelectorAll("[data-dockkit-split-button]")
			},
			{
				marker: "data-dcu-tabler-maximize",
				pick: (element) => element.getAttribute("data-sidebar-right-mode") === "push" ? MINIMIZE_ICON : MAXIMIZE_ICON,
				state: (element) => element.getAttribute("data-sidebar-right-mode") === "push" ? "min" : "max",
				find: (doc) => doc.querySelectorAll("[data-sidebar-right-mode]")
			}
		];
		function restyleButton(button, rule) {
			if (button.querySelector("svg") === null) return;
			const state = rule.state?.(button) ?? "";
			if (button.getAttribute(rule.marker) === state && button.querySelector(".dcu-tabler-icon") !== null) return;
			button.querySelectorAll(".dcu-tabler-icon").forEach((node) => node.remove());
			button.setAttribute(rule.marker, state);
			button.insertAdjacentHTML("beforeend", rule.pick(button));
		}
		/** 罗盘是页签标题里的裸 svg（不在按钮内）：标记 svg 本体、兄弟插入替换图。 */
		function restyleCompass(svg) {
			if (svg.hasAttribute("data-dcu-tabler-compass")) return;
			const sibling = svg.nextElementSibling;
			if (sibling !== null && sibling.classList.contains("dcu-tabler-icon")) sibling.remove();
			svg.setAttribute("data-dcu-tabler-compass", "");
			svg.insertAdjacentHTML("afterend", COMPASS_ICON);
		}
		/** 摘掉失去宿主锚点（React 重建后未配对）的残留 Tabler 图标。 */
		function pruneOrphans(scope) {
			for (const icon of scope.querySelectorAll(".dcu-tabler-icon")) {
				const host = icon.parentElement;
				if (host === null) continue;
				if (host.matches(MARKERS)) continue;
				const previous = icon.previousElementSibling;
				if (previous !== null && previous.hasAttribute("data-dcu-tabler-compass")) continue;
				icon.remove();
			}
		}
		function scan(doc) {
			for (const rule of RULES) for (const element of rule.find(doc)) restyleButton(element, rule);
			for (const svg of doc.querySelectorAll("[data-sidebar-right-panel] svg[class*=\"titleIcon\"]")) restyleCompass(svg);
			pruneOrphans(doc.body);
		}
		function observeHostTablerIcons(doc = document) {
			if (doc.head === null || doc.body === null) return () => {};
			if (doc.getElementById("dcu-host-tabler-icons-style") === null) {
				const style = doc.createElement("style");
				style.id = HOST_TABLER_ICONS_STYLE_ID;
				style.textContent = HOST_TABLER_ICONS_STYLE;
				doc.head.append(style);
			}
			let frame;
			const run = () => {
				frame = void 0;
				scan(doc);
			};
			const schedule = () => {
				if (frame === void 0) frame = window.requestAnimationFrame(run);
			};
			/** 只对右侧栏与会话顶栏相关子树的变更扫描；消息流正文不经过这里，不占主线程。
			*  attributes 只订阅全屏钮的模式标记：进/出全屏时 React 可能只翻转该属性不重建子节点。 */
			const RELEVANT = "[data-sidebar-right-panel],[data-sidebar-right-session],[data-sidebar-right-expand],[data-sidebar-right-toggle],[data-dockkit-host],header";
			function touchesTargets(records) {
				for (const record of records) {
					const element = record.target instanceof Element ? record.target : record.target.parentElement;
					if (element === null) continue;
					if (element.matches("[data-sidebar-right-mode]") || element.closest(RELEVANT) !== null || element.querySelector(RELEVANT) !== null) return true;
					for (const node of record.addedNodes) if (node instanceof Element && (node.matches(RELEVANT) || node.querySelector(RELEVANT) !== null)) return true;
				}
				return false;
			}
			const observer = new MutationObserver((records) => {
				if (touchesTargets(records)) schedule();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-sidebar-right-mode"]
			});
			scan(doc);
			return () => {
				observer.disconnect();
				if (frame !== void 0) {
					window.cancelAnimationFrame(frame);
					frame = void 0;
				}
				for (const button of doc.querySelectorAll(MARKERS)) {
					button.removeAttribute("data-dcu-tabler-dots");
					button.removeAttribute("data-dcu-tabler-panel");
					button.removeAttribute("data-dcu-tabler-split");
					button.removeAttribute("data-dcu-tabler-maximize");
					button.querySelectorAll(".dcu-tabler-icon").forEach((node) => node.remove());
				}
				for (const svg of doc.querySelectorAll("[data-dcu-tabler-compass]")) {
					svg.removeAttribute("data-dcu-tabler-compass");
					svg.nextElementSibling?.classList.contains("dcu-tabler-icon") && svg.nextElementSibling.remove();
				}
				for (const icon of doc.querySelectorAll("[data-sidebar-right-panel] .dcu-tabler-icon")) icon.remove();
			};
		}
		//#endregion
		//#region src/client/conversation-dom.ts
		/**
		* DSH 尚未公开会话滚动容器和消息锚点服务；把兼容读取集中在这里，方便
		* 宿主提供正式 API 后只替换这一处。所有调用均可失败，不改写会话数据。
		*/
		function conversationScrollRoot() {
			return document.querySelector("[data-conversation-scroll]");
		}
		function conversationAnchor(root, key) {
			return conversationAnchors(root).get(key) ?? null;
		}
		/** 一次扫描生成锚点索引，滚动帧内不得为每个轮次重复遍历 DOM。 */
		function conversationAnchors(root) {
			const anchors = /* @__PURE__ */ new Map();
			for (const anchor of root.querySelectorAll("[data-chat-anchor-key]")) {
				const key = anchor.dataset.chatAnchorKey;
				if (key !== void 0 && !anchors.has(key)) anchors.set(key, anchor);
			}
			return anchors;
		}
		//#endregion
		//#region src/client/activity-summary.ts
		/** 宿主把计数排成 `+{count}` / `−{count}`（U+2212 或 ASCII）；这里只取数字，符号是展示装饰。 */
		function parseCount(text) {
			const match = (text ?? "").match(/\d+/);
			return match === null ? 0 : Number(match[0]);
		}
		function countIn(scope, marker) {
			return parseCount(scope.querySelector(`[class*="${marker}"]`)?.textContent);
		}
		/**
		* 解析一张「已编辑 N 个文件」卡（`[data-changed-files]`）：
		* 文件行 = `[class*="path"]` 所在的列表行，行内带各自的 added/deleted；
		* 卡级合计取头部第一组计数，解析不到就退回按行求和。
		*/
		function parseChangedFilesCard(card) {
			const files = [];
			for (const pathNode of card.querySelectorAll("[class*=\"path\"]")) {
				const path = (pathNode.textContent ?? "").trim();
				if (path === "") continue;
				const row = pathNode.closest("[class*=\"list\"] > *") ?? pathNode.parentElement;
				if (row === null || row === card || row.contains(card.querySelector("[class*=\"stat\"]"))) continue;
				files.push({
					path,
					added: countIn(row, "added"),
					deleted: countIn(row, "deleted"),
					target: row
				});
			}
			const headerAdded = parseCount(card.querySelector("[class*=\"added\"]")?.textContent);
			const headerDeleted = parseCount(card.querySelector("[class*=\"deleted\"]")?.textContent);
			const rowAdded = files.reduce((sum, file) => sum + file.added, 0);
			const rowDeleted = files.reduce((sum, file) => sum + file.deleted, 0);
			return {
				files,
				added: rowAdded > 0 ? rowAdded : headerAdded,
				deleted: rowDeleted > 0 ? rowDeleted : headerDeleted
			};
		}
		/** 本机/内网地址不算「来源」：开发服务器和引用来源不是一回事。 */
		function isPrivateHost(host) {
			return host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0" || host === "[::1]" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
		}
		function isExternalSource(url) {
			if (url.protocol !== "http:" && url.protocol !== "https:") return false;
			return !isPrivateHost(url.hostname.toLowerCase());
		}
		/**
		* 汇总整个会话滚动根里的活动。一次 `querySelectorAll` 扫描完成，
		* 调用方（观察器）负责去抖，不要在滚动帧里反复调用。
		*/
		function collectActivity(root) {
			const changes = /* @__PURE__ */ new Map();
			let added = 0;
			let deleted = 0;
			let latestCard = null;
			for (const card of root.querySelectorAll("[data-changed-files]")) {
				latestCard = card;
				const parsed = parseChangedFilesCard(card);
				added += parsed.added;
				deleted += parsed.deleted;
				for (const file of parsed.files) {
					const seen = changes.get(file.path);
					if (seen === void 0) {
						changes.set(file.path, {
							path: file.path,
							added: file.added,
							deleted: file.deleted,
							target: file.target
						});
						continue;
					}
					seen.added += file.added;
					seen.deleted += file.deleted;
					seen.target = file.target;
				}
			}
			const mergedFiles = [...changes.values()];
			const isFlag = (value) => value === "" || value === "true" || value === "false";
			const outputs = /* @__PURE__ */ new Map();
			for (const row of root.querySelectorAll("[data-presented-file]")) {
				const attr = (row.getAttribute("data-presented-file") ?? "").trim();
				const fullPath = (row.querySelector("[class*=\"cardPreview\"]")?.getAttribute("title") ?? "").trim();
				const name = (row.querySelector("[class*=\"fileName\"]")?.textContent ?? "").trim();
				const key = !isFlag(attr) ? attr : fullPath || name || (row.textContent ?? "").trim();
				if (key === "") continue;
				const dedupeKey = key.split(/[\\/]/).pop() ?? key;
				if (outputs.has(dedupeKey)) continue;
				outputs.set(dedupeKey, {
					path: !isFlag(attr) ? attr : name || key,
					added: 0,
					deleted: 0,
					target: row,
					tooltip: fullPath !== "" && fullPath !== key ? fullPath : void 0
				});
			}
			for (const row of root.querySelectorAll("[data-variant=\"write\"], [data-variant=\"edit\"]")) {
				const path = (row.querySelector("[class*=\"fileLink\"]")?.textContent ?? "").trim();
				if (path === "" || outputs.has(path)) continue;
				outputs.set(path, {
					path,
					added: 0,
					deleted: 0,
					target: row
				});
			}
			const sources = /* @__PURE__ */ new Map();
			for (const anchor of root.querySelectorAll("a[href]")) {
				if (anchor.closest("[data-submission-echo]") !== null) continue;
				const raw = anchor.getAttribute("href") ?? "";
				let url;
				try {
					url = new URL(raw, location.href);
				} catch {
					continue;
				}
				if (!isExternalSource(url)) continue;
				url.hash = "";
				const key = url.href;
				if (sources.has(key)) continue;
				sources.set(key, {
					url: key,
					label: url.hostname,
					target: anchor
				});
			}
			return {
				changes: {
					files: mergedFiles,
					added,
					deleted,
					latestCard
				},
				outputs: [...outputs.values()],
				sources: [...sources.values()]
			};
		}
		//#endregion
		//#region src/client/activity-card.ts
		/**
		* 会话右上角的活动摘要卡：变更（整个会话累计 +/−）、输出内容、来源三段一眼可读，
		* 点击滚动到会话里对应的块并短暂高亮。数据全部来自宿主已经渲染出来的 DOM
		* （见 activity-summary.ts）：宿主没渲染的段落就不显示，绝不自己猜。
		*
		* 造型对齐 Codex 的摘要卡：300px 宽、统一 30px 行节奏、节标题深色行 + 内容行、
		* 16px 灰图标、无分隔线。开关按钮嵌在会话顶栏工具条（「···」右侧），卡片可见时
		* 给会话区右侧留出卡位，消息列在剩余空间里重新居中。
		*
		* 卡片是 body 下的固定定位浮层（不碰 React 管理的节点），锚定会话滚动容器右缘；
		* 窄视口、新建页、空数据、用户关闭（按会话记忆）时隐藏。
		*/
		/** 窄于这个宽度时正文没有余量浮卡，让位给内容。 */
		const MIN_VIEWPORT = 1100;
		/** 摘要卡宽度；定位与内容区让位宽度都由它推导。 */
		const CARD_WIDTH = 300;
		/** 每段默认展示的行数，超出走「+」展开。 */
		const MAX_ROWS = 3;
		/** 来源折叠态保留的条数。 */
		const COLLAPSED_SOURCES = 3;
		const DISMISS_KEY = "dsh.codexUi.activityDismissed";
		/** 让位目标：内容列右缘到卡片左缘要留出的宽度（卡宽 + 内容侧缝隙）。 */
		const RESERVE_TARGET = 324;
		const SUMMARY_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M13 20l7 -7\"/><path d=\"M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7\"/></svg>";
		const LINK_ICON = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6.8 9.2 9.2 6.8\"/><path d=\"M7.2 4.6 8.7 3.1a2.47 2.47 0 0 1 3.5 3.5L10.7 8.1\"/><path d=\"M8.8 11.4 7.3 12.9a2.47 2.47 0 0 1-3.5-3.5L5.3 7.9\"/></svg>";
		const PLUS_ICON = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"><path d=\"M8 3.5v9M3.5 8h9\"/></svg>";
		const ACTIVITY_CARD_STYLE = `
/* 卡片可见即让位（宽度由脚本写入 --dcu-activity-reserve，Codex 同款）：只作用于会话
   消息区（region="chat"），消息列、输入框与轮次导航一起左移重新居中；输入框座位
   （region="composer"）不许再叠一层，否则输入框会比消息列多挪一截。 */
body[data-dcu-activity-open] [data-conversation-region="chat"]{padding-right:var(--dcu-activity-reserve,0px)}
[data-conversation-region="chat"]{transition:padding-right 160ms ease}
.dcu-activity,.dcu-activity *,.dcu-activity *::before,.dcu-activity *::after{box-sizing:border-box}
.dcu-activity{position:fixed;z-index:30;width:${CARD_WIDTH}px;padding:8px 24px 10px;border-radius:20px;background:#fff;box-shadow:0 8px 24px #00000012,0 0 0 1px #0000000a;color:var(--dsw-alias-label-primary);/* 可变字体优先：宿主栈里的 Segoe UI / 微软雅黑都是静态字重，
   520/550 这类中间字重会被吸附到 400/600/700；Win11 的 Segoe UI Variable 字重轴连续。 */
font-family:"Segoe UI Variable Text","Segoe UI Variable","Segoe UI","PingFang SC","Microsoft YaHei",var(--dsw-font-family);font-size:13px;line-height:20px;animation:dcu-activity-in 180ms cubic-bezier(.16,1,.3,1) both}
body[data-ds-dark-theme] .dcu-activity{background:#202020;box-shadow:0 8px 24px #00000045,0 0 0 1px #ffffff10}
body[data-ds-dark-theme] .dcu-activity-title{color:#9d9d9e}
@keyframes dcu-activity-in{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
.dcu-activity-section{min-width:0}
.dcu-activity-section+.dcu-activity-section{margin-top:6px;padding-top:6px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
/* 统一 30px 行节奏：节标题与内容行同高，靠字色与字重区分层级（Codex 同款）。 */
.dcu-activity-head,.dcu-activity-row{display:flex;gap:8px;align-items:center;height:30px;min-width:0}
/* Codex 的节标题是中灰、半粗，不是纯黑加粗。 */
/* 550 用「500 + 0.2px 同色描边」模拟：宿主字体栈是静态字面，中间字重会被吸附，
   描边对中文同样生效且不受 font-matching 影响。 */
.dcu-activity-title{flex:1;min-width:0;overflow:hidden;color:#6a6b6d;font-weight:500;-webkit-text-stroke:0.2px currentcolor;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-meta{flex:none;overflow:hidden;color:var(--dsw-alias-label-caption);font-size:12px;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-expand{appearance:none;flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-caption);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-activity-expand:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dcu-activity-expand svg{width:16px;height:16px}
.dcu-activity-rows{margin:0;padding:0;list-style:none}
/* 具体内容行用 Codex 同款 #A3A4A5（深浅两主题都可读，悬停点亮主题蓝）。 */
.dcu-activity-row{width:100%;padding:0;border:0;background:none;color:#a3a4a5;font:inherit;line-height:20px;-webkit-text-stroke:0.15px currentcolor;text-align:left;cursor:pointer}
.dcu-activity-row:hover .dcu-activity-name{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px;border-radius:6px}
.dcu-activity-row[disabled]{cursor:default}
.dcu-activity-row[disabled] .dcu-activity-name{color:var(--dsw-alias-label-secondary)}
/* Codex：真实数据行深色，动作行（查看全部/查看变更）灰字带链接图标。 */
.dcu-activity-row-action{color:var(--dsw-alias-label-secondary)}
.dcu-activity-row-action .dcu-activity-name{color:var(--dsw-alias-label-secondary)}
.dcu-activity-row-action:hover .dcu-activity-name{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dcu-activity-icon{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-caption)}
.dcu-activity-delta{flex:none;color:var(--dsw-alias-label-caption);font-size:12px;white-space:nowrap}
.dcu-activity-delta:empty{display:none}
.dcu-activity-added,.dcu-activity-deleted{font-weight:400}
.dcu-activity-added{color:#1a7f37}
.dcu-activity-deleted{color:#cf222e}
body[data-ds-dark-theme] .dcu-activity-added{color:#3fb950}
body[data-ds-dark-theme] .dcu-activity-deleted{color:#f85149}
/* 顶栏开关：嵌在宿主工具条里的普通图标钮，压住宿主按钮的手感。 */
.dcu-activity-toggle{appearance:none;flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm,6px);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background 120ms,color 120ms}
.dcu-activity-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent));color:var(--dsw-alias-label-primary)}
.dcu-activity-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dcu-activity-toggle[aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
.dcu-activity-toggle svg{width:18px;height:18px}
/* 顶栏图标族统一已整体迁往 host-tabler-icons.ts（··· / 角槽折叠钮的识别与样式都在那里）。 */
/* 轮次导航条钉在会话区最右：官方导航（.xpvNua_frame 一类）绝对定位锚在滚动容器右缘，
   让位后容器右缘左移，导航条跟着漂走。用负 margin 把让位量补回去——不与宿主的 right
   规则竞争优先级，对任何右锚定的导航都成立；结构选择器兜底，标记缺失时也生效。 */
body[data-dcu-activity-open] [data-conversation-scroll] nav,
body[data-dcu-activity-open] [data-dcu-official-turn-navigator]{
  margin-right:calc(-1 * var(--dcu-activity-reserve, 0px))
}
/* 补偿量与让位 padding 同节奏过渡：否则导航条瞬跳到终点、会话区还在滑，左移看着发顿。 */
[data-conversation-scroll] nav,[data-dcu-official-turn-navigator]{transition:margin-right 160ms ease}
/* 顶栏开关的悬停提示：复刻宿主 Tooltip（Tooltip.module.css）的深色气泡——
   3px 7px 内边距、--dsw-radius-sm 圆角、--dsw-alias-tooltip-bg 底、13px/20px、
   150ms 淡入，固定定位在开关下方 8px。 */
.dcu-activity-tip{position:fixed;z-index:100;width:max-content;max-width:50vw;padding:3px 7px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-tooltip-bg);color:var(--dsw-static-neutral-bluish-00);font-size:13px;line-height:20px;font-family:var(--dsw-font-family);white-space:pre-line;pointer-events:none;animation:dcu-activity-tip-in 150ms var(--ds-ease-in-out,ease)}
@keyframes dcu-activity-tip-in{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.dcu-activity-tip{animation:none}}
/* 滚动定位后的高亮脉冲：临时属性，1.3s 后由脚本移除。 */
[data-dcu-activity-flash]{animation:dcu-activity-flash 1.2s ease both}
@keyframes dcu-activity-flash{from{box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-business-primary) 60%,transparent)}to{box-shadow:0 0 0 2px transparent}}
`;
		function element$1(tag, className, content) {
			const node = document.createElement(tag);
			node.className = className;
			if (content !== void 0) node.textContent = content;
			return node;
		}
		/** 行元素在宿主重渲染后可能已不在文档里：失效就当没有，不定位。 */
		function connected(target) {
			return target !== null && target !== void 0 && target.isConnected;
		}
		/**
		* 两份摘要是否在展示意义上相同。让位过渡期间 ResizeObserver 每帧都会触发 sync，
		* 摘要没变就绝不开重建——160ms 里反复 replaceChildren 正是左移动画卡顿的元凶。
		* 元素引用也算不同：宿主重渲染后旧行失效，行动作的定位目标必须跟着换。
		*/
		function sameSummary(a, b) {
			const fileKey = (file) => `${file.path}|${file.added}|${file.deleted}|${file.tooltip ?? ""}`;
			if (a.changes.added !== b.changes.added || a.changes.deleted !== b.changes.deleted) return false;
			if (a.changes.files.length !== b.changes.files.length) return false;
			for (let at = 0; at < a.changes.files.length; at++) {
				if (fileKey(a.changes.files[at]) !== fileKey(b.changes.files[at])) return false;
				if (a.changes.files[at].target !== b.changes.files[at].target) return false;
			}
			if (a.outputs.length !== b.outputs.length) return false;
			for (let at = 0; at < a.outputs.length; at++) {
				if (fileKey(a.outputs[at]) !== fileKey(b.outputs[at])) return false;
				if (a.outputs[at].target !== b.outputs[at].target) return false;
			}
			if (a.sources.length !== b.sources.length) return false;
			for (let at = 0; at < a.sources.length; at++) {
				if (a.sources[at].url !== b.sources[at].url) return false;
				if (a.sources[at].target !== b.sources[at].target) return false;
			}
			return a.changes.latestCard === b.changes.latestCard;
		}
		/** 滚动到目标块并打上 1.3s 的高亮脉冲。 */
		function reveal(target) {
			target.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			target.setAttribute("data-dcu-activity-flash", "");
			window.setTimeout(() => {
				target.removeAttribute("data-dcu-activity-flash");
			}, 1300);
		}
		function observeActivityCard(options) {
			if (typeof document === "undefined" || typeof window === "undefined") return () => {};
			const labels = options.labels;
			const style = document.createElement("style");
			style.setAttribute("data-dcu-activity-card-style", "");
			style.textContent = ACTIVITY_CARD_STYLE;
			document.head.append(style);
			const storage = browserStorage();
			let disposed = false;
			let frame;
			let activeRoot;
			let currentSession;
			let sourcesExpanded = false;
			let changesExpanded = false;
			let outputsExpanded = false;
			let appliedReserve = -1;
			let rootObserver;
			let lastSummary = null;
			let lastViewKey = "";
			let pendingRender = false;
			let dismissed;
			try {
				dismissed = storage?.getItem(DISMISS_KEY) ?? void 0;
			} catch {}
			const card = element$1("div", "dcu-activity");
			const toggle = element$1("button", "dcu-activity-toggle");
			toggle.type = "button";
			toggle.innerHTML = SUMMARY_ICON;
			toggle.setAttribute("aria-label", labels.region);
			const onReveal = (target) => reveal(target);
			function hasData(summary) {
				return summary.changes.files.length > 0 || summary.outputs.length > 0 || summary.sources.length > 0;
			}
			function isDismissed() {
				const id = options.session();
				return id !== void 0 ? dismissed === id : dismissed === "";
			}
			/** 变更/输出共用的一行：主行（呈现文件时是自述，title 带全路径），点击滚动定位。 */
			function fileRow(file) {
				const row = element$1("li", "");
				const button = element$1("button", "dcu-activity-row");
				button.type = "button";
				const name = element$1("span", "dcu-activity-name");
				name.textContent = file.path;
				button.title = file.tooltip ?? file.path;
				button.append(name);
				if (connected(file.target)) button.addEventListener("click", () => {
					if (connected(file.target)) onReveal(file.target);
				});
				else button.disabled = true;
				row.append(button);
				return row;
			}
			/** 来源行：链接图标 + 域名（Codex 的来源行同款）。 */
			function sourceRow(url, label) {
				const row = element$1("li", "");
				const link = element$1("a", "dcu-activity-row");
				link.href = url;
				link.target = "_blank";
				link.rel = "noreferrer";
				link.title = url;
				link.innerHTML = LINK_ICON;
				link.querySelector("svg")?.setAttribute("class", "dcu-activity-icon");
				link.className = "dcu-activity-row dcu-activity-link";
				link.append(element$1("span", "dcu-activity-name", label));
				row.append(link);
				return row;
			}
			/** 动作行（查看变更 / 查看全部 / 收起）：灰字 + 链接图标，Codex 同款。 */
			function actionRow(label, run) {
				const row = element$1("li", "");
				const button = element$1("button", "dcu-activity-row dcu-activity-row-action");
				button.type = "button";
				button.innerHTML = LINK_ICON;
				button.querySelector("svg")?.setAttribute("class", "dcu-activity-icon");
				button.append(element$1("span", "dcu-activity-name", label));
				button.addEventListener("click", run);
				row.append(button);
				return row;
			}
			function expandButton(run) {
				const button = element$1("button", "dcu-activity-expand");
				button.type = "button";
				button.innerHTML = PLUS_ICON;
				button.addEventListener("click", run);
				return button;
			}
			function sectionOf(kind, title) {
				const section = element$1("section", "dcu-activity-section");
				section.setAttribute("data-kind", kind);
				const head = element$1("div", "dcu-activity-head");
				head.append(element$1("span", "dcu-activity-title", title));
				section.append(head);
				return section;
			}
			function render(summary) {
				card.replaceChildren();
				card.setAttribute("role", "region");
				card.setAttribute("aria-label", labels.region);
				if (summary.changes.files.length > 0) {
					const section = sectionOf("changes", labels.changes);
					const meta = element$1("span", "dcu-activity-meta");
					const deltas = `+${summary.changes.added} −${summary.changes.deleted}`;
					meta.textContent = `${labels.countFiles(summary.changes.files.length)} ${deltas}`;
					meta.title = deltas;
					section.querySelector(".dcu-activity-head").append(meta);
					if (summary.changes.files.length > MAX_ROWS) section.querySelector(".dcu-activity-head").append(expandButton(() => {
						changesExpanded = !changesExpanded;
						sync();
					}));
					const rows = element$1("ul", "dcu-activity-rows");
					for (const file of summary.changes.files.slice(0, changesExpanded ? void 0 : MAX_ROWS)) rows.append(fileRow(file));
					if (connected(summary.changes.latestCard)) rows.append(actionRow(labels.viewChanges, () => {
						if (connected(summary.changes.latestCard)) onReveal(summary.changes.latestCard);
					}));
					section.append(rows);
					card.append(section);
				}
				if (summary.outputs.length > 0) {
					const section = sectionOf("outputs", labels.outputs);
					if (summary.outputs.length > MAX_ROWS) section.querySelector(".dcu-activity-head").append(expandButton(() => {
						outputsExpanded = !outputsExpanded;
						sync();
					}));
					const rows = element$1("ul", "dcu-activity-rows");
					for (const file of summary.outputs.slice(0, outputsExpanded ? void 0 : MAX_ROWS)) rows.append(fileRow(file));
					section.append(rows);
					card.append(section);
				}
				if (summary.sources.length > 0) {
					const section = sectionOf("sources", labels.sources);
					const meta = element$1("span", "dcu-activity-meta");
					meta.textContent = labels.countSources(summary.sources.length);
					section.querySelector(".dcu-activity-head").append(meta);
					const rows = element$1("ul", "dcu-activity-rows");
					const shown = sourcesExpanded ? summary.sources : summary.sources.slice(0, COLLAPSED_SOURCES);
					for (const source of shown) rows.append(sourceRow(source.url, source.label));
					if (summary.sources.length > COLLAPSED_SOURCES) rows.append(actionRow(sourcesExpanded ? labels.collapse : labels.viewAll, () => {
						sourcesExpanded = !sourcesExpanded;
						sync();
					}));
					section.append(rows);
					card.append(section);
				}
			}
			function dismiss() {
				const id = options.session();
				dismissed = id ?? "";
				if (id !== void 0) try {
					storage?.setItem(DISMISS_KEY, id);
				} catch {}
				sync();
			}
			function place() {
				if (!card.isConnected) return;
				const root = activeRoot;
				if (root === null || root === void 0) return;
				const rect = (root.closest("[data-conversation-region]:not([data-conversation-region=\"composer\"])") ?? root).getBoundingClientRect();
				const rightEdge = Math.min(rect.right, document.documentElement.clientWidth) - 16;
				card.style.left = `${Math.round(Math.max(8, rightEdge - CARD_WIDTH))}px`;
				card.style.top = `${Math.round(Math.max(8, rect.top + 12))}px`;
			}
			/** 会话顶栏（含工具条簇与角槽）；找不到返回 null。 */
			function sessionHeader() {
				const root = activeRoot;
				if (root === null || root === void 0) return null;
				return (root.closest("[data-conversation-region]") ?? root.parentElement)?.querySelector("header") ?? [...document.querySelectorAll("header")].find((node) => node.querySelector("[class*=\"headerUtilities\"], [class*=\"headerActions\"]")) ?? null;
			}
			/** 顶栏开关：嵌进会话顶栏工具条（「···」所在簇的末尾，宿主面板按钮之前）。 */
			function mountToggle() {
				const header = sessionHeader();
				const cluster = header?.querySelector("[class*=\"headerUtilities\"]") ?? header?.querySelector("[class*=\"headerActions\"]") ?? header;
				if (cluster === null) {
					toggle.remove();
					return;
				}
				if (toggle.parentElement !== cluster) cluster.append(toggle);
			}
			/** 让位宽度：卡片展开即按目标让位（Codex 同款）——消息列、输入框与导航条一起在
			*  「左缘到卡片」的空间里重新居中。极窄会话区保底：至少给正文留 620px，不为卡片压瘪正文。 */
			function reserveFor(region) {
				const width = region.getBoundingClientRect().width;
				return Math.ceil(Math.min(RESERVE_TARGET, Math.max(0, width - 620)));
			}
			function watchRoot(root) {
				rootObserver?.disconnect();
				rootObserver = void 0;
				if (root === null) return;
				if (typeof ResizeObserver === "undefined") return;
				rootObserver = new ResizeObserver(schedule);
				rootObserver.observe(root);
			}
			function sync() {
				frame = void 0;
				if (disposed) return;
				const root = conversationScrollRoot();
				const sessionId = options.session();
				if (sessionId !== currentSession) {
					currentSession = sessionId;
					sourcesExpanded = false;
					changesExpanded = false;
					outputsExpanded = false;
				}
				if (root !== activeRoot) {
					activeRoot = root;
					watchRoot(root);
				}
				const narrow = window.innerWidth < MIN_VIEWPORT;
				const summary = root === null ? null : collectActivity(root);
				const show = summary !== null && !narrow && hasData(summary) && !isDismissed();
				if (show) {
					if (!card.isConnected) document.body.append(card);
					const region = root.closest("[data-conversation-region]:not([data-conversation-region=\"composer\"])");
					const reserve = region === null ? 0 : reserveFor(region);
					if (reserve !== appliedReserve) {
						appliedReserve = reserve;
						if (reserve > 0) document.documentElement.style.setProperty("--dcu-activity-reserve", `${reserve}px`);
						else document.documentElement.style.removeProperty("--dcu-activity-reserve");
					}
					document.body.setAttribute("data-dcu-activity-open", "");
					const viewKey = `${sourcesExpanded}|${changesExpanded}|${outputsExpanded}|${currentSession}`;
					const unchanged = lastSummary !== null && sameSummary(lastSummary, summary) && viewKey === lastViewKey;
					if (pendingRender) {
						pendingRender = false;
						render(summary);
						lastSummary = summary;
						lastViewKey = viewKey;
					} else if (!card.hasChildNodes()) {
						pendingRender = true;
						schedule();
					} else if (!unchanged) {
						render(summary);
						lastSummary = summary;
						lastViewKey = viewKey;
					}
					place();
				} else {
					card.remove();
					lastSummary = null;
					lastViewKey = "";
					pendingRender = false;
					if (appliedReserve !== 0) {
						appliedReserve = 0;
						document.documentElement.style.removeProperty("--dcu-activity-reserve");
					}
					document.body.removeAttribute("data-dcu-activity-open");
				}
				if (summary !== null && !narrow && hasData(summary)) {
					toggle.setAttribute("aria-pressed", String(show));
					toggle.setAttribute("aria-label", show ? labels.close : labels.region);
					mountToggle();
				} else toggle.remove();
			}
			function schedule() {
				if (disposed || frame !== void 0) return;
				frame = window.requestAnimationFrame(sync);
			}
			toggle.addEventListener("click", () => {
				if (card.isConnected) {
					dismiss();
					return;
				}
				dismissed = void 0;
				if (options.session() !== void 0) try {
					storage?.removeItem(DISMISS_KEY);
				} catch {}
				schedule();
				if (tipBubble.isConnected) showTipBubble();
			});
			/** 宿主 Tooltip 同款深色气泡：fixed 定位、开关下方 8px、水平居中并夹在窗口内。 */
			const tipBubble = element$1("div", "dcu-activity-tip");
			tipBubble.setAttribute("role", "tooltip");
			function showTipBubble() {
				tipBubble.textContent = toggle.getAttribute("aria-label") ?? "";
				if (!tipBubble.isConnected) document.body.append(tipBubble);
				tipBubble.style.visibility = "hidden";
				const box = toggle.getBoundingClientRect();
				const width = tipBubble.offsetWidth;
				const left = Math.max(12, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - 12 - width));
				tipBubble.style.left = `${left}px`;
				tipBubble.style.top = `${box.bottom + 8}px`;
				tipBubble.style.visibility = "visible";
			}
			function hideTipBubble() {
				tipBubble.remove();
			}
			toggle.addEventListener("mouseenter", showTipBubble);
			toggle.addEventListener("mouseleave", hideTipBubble);
			toggle.addEventListener("focus", showTipBubble);
			toggle.addEventListener("blur", hideTipBubble);
			/** 只在动到会话滚动根（含其被整体替换）时重扫；其余突变忽略，长会话才扫得动。 */
			function relevant(record) {
				const touches = (node) => {
					if (!(node instanceof Element)) return false;
					if (node.matches("[data-conversation-scroll]") || node.querySelector("[data-conversation-scroll]") !== null) return true;
					return activeRoot !== null && activeRoot !== void 0 && activeRoot.contains(node);
				};
				if (touches(record.target)) return true;
				for (const node of record.addedNodes) if (touches(node)) return true;
				for (const node of record.removedNodes) if (touches(node)) return true;
				return false;
			}
			const observer = new MutationObserver((records) => {
				if (activeRoot === void 0) {
					schedule();
					return;
				}
				for (const record of records) if (relevant(record)) {
					schedule();
					return;
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true
			});
			window.addEventListener("resize", schedule);
			schedule();
			return () => {
				disposed = true;
				style.remove();
				observer.disconnect();
				watchRoot(null);
				window.removeEventListener("resize", schedule);
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				card.remove();
				toggle.remove();
				tipBubble.remove();
				appliedReserve = 0;
				document.documentElement.style.removeProperty("--dcu-activity-reserve");
				document.body.removeAttribute("data-dcu-activity-open");
			};
		}
		//#endregion
		//#region src/client/official-turn-navigator.ts
		const OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE = "data-dcu-official-turn-navigator";
		const OFFICIAL_TURN_MARK_ATTRIBUTE = "data-dcu-official-turn-mark";
		const OFFICIAL_TURN_TOOLTIP_ATTRIBUTE = "data-dcu-official-turn-tooltip";
		const OFFICIAL_TURN_NAVIGATOR_SUPPORTED_ATTRIBUTE = "data-dcu-official-turn-navigator-supported";
		const CAPABILITIES_ENDPOINT = `${CODEX_UI_API_ENDPOINTS.dependencies}?action=capabilities`;
		function isOfficialTurnNavigator(element) {
			if (!(element instanceof HTMLElement) || element.tagName !== "NAV") return false;
			if (element.querySelector("button[type=\"button\"][aria-label]") === null) return false;
			return element.style.getPropertyValue("--turn-natural-height") !== "" || element.querySelector("button[type=\"button\"][data-index][aria-label]") !== null;
		}
		/** 标记实际挂载的官方轮次导航，避免依赖宿主样式文件名或会话 DOM 层级。 */
		function markOfficialTurnNavigators(root = document) {
			for (const element of root.querySelectorAll(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`)) {
				if (isOfficialTurnNavigator(element)) continue;
				element.removeAttribute(OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE);
				for (const part of element.querySelectorAll(`[${OFFICIAL_TURN_MARK_ATTRIBUTE}],[${OFFICIAL_TURN_TOOLTIP_ATTRIBUTE}]`)) {
					part.removeAttribute(OFFICIAL_TURN_MARK_ATTRIBUTE);
					part.removeAttribute(OFFICIAL_TURN_TOOLTIP_ATTRIBUTE);
				}
			}
			for (const element of root.querySelectorAll("nav")) {
				if (!isOfficialTurnNavigator(element)) continue;
				element.setAttribute(OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE, "true");
			}
			return root.querySelectorAll(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`).length;
		}
		function nodeTouchesTurnNavigator(node) {
			return node instanceof Element && (node.matches(`nav,[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`) || node.closest(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`) !== null || node.querySelector(`nav,[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`) !== null);
		}
		function nodeInsideTurnNavigator(node) {
			return node instanceof Element && (node.matches(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`) || node.closest(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}]`) !== null);
		}
		function turnNavigatorMutationRelevant(records) {
			return records.some((record) => record.type === "attributes" ? record.target instanceof Element && record.target.matches("nav") : nodeInsideTurnNavigator(record.target) || [...record.addedNodes].some(nodeTouchesTurnNavigator) || [...record.removedNodes].some(nodeTouchesTurnNavigator));
		}
		async function runtimeSupportsOfficialTurnNavigator(fetchImpl) {
			try {
				const response = await fetchImpl(CAPABILITIES_ENDPOINT, { cache: "no-store" });
				if (!response.ok) return false;
				const payload = await response.json();
				if (payload === null || typeof payload !== "object") return false;
				const capabilities = payload.capabilities;
				return capabilities !== null && typeof capabilities === "object" && capabilities.officialTurnNavigator === true;
			} catch {
				return false;
			}
		}
		/** 官方导航可能在会话切换后异步挂载；仅对相关变更按帧检测，并在停用时清理标记。 */
		function observeOfficialTurnNavigators(doc = document, fetchImpl = fetch) {
			if (doc.body === null || doc.documentElement === null) return () => {};
			let active = true;
			let frame;
			const run = () => {
				frame = void 0;
				markOfficialTurnNavigators(doc);
			};
			const schedule = () => {
				if (frame !== void 0) return;
				frame = window.requestAnimationFrame(run);
			};
			const observer = new MutationObserver((records) => {
				if (turnNavigatorMutationRelevant(records)) schedule();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["style"]
			});
			schedule();
			runtimeSupportsOfficialTurnNavigator(fetchImpl).then((supported) => {
				if (!active) return;
				if (supported) doc.documentElement.setAttribute(OFFICIAL_TURN_NAVIGATOR_SUPPORTED_ATTRIBUTE, "true");
				else doc.documentElement.removeAttribute(OFFICIAL_TURN_NAVIGATOR_SUPPORTED_ATTRIBUTE);
			});
			return () => {
				active = false;
				observer.disconnect();
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				doc.documentElement.removeAttribute(OFFICIAL_TURN_NAVIGATOR_SUPPORTED_ATTRIBUTE);
				for (const element of doc.querySelectorAll(`[${OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE}],[${OFFICIAL_TURN_MARK_ATTRIBUTE}],[${OFFICIAL_TURN_TOOLTIP_ATTRIBUTE}]`)) {
					element.removeAttribute(OFFICIAL_TURN_NAVIGATOR_ATTRIBUTE);
					element.removeAttribute(OFFICIAL_TURN_MARK_ATTRIBUTE);
					element.removeAttribute(OFFICIAL_TURN_TOOLTIP_ATTRIBUTE);
				}
			};
		}
		//#endregion
		//#region src/client/TurnNavigator.tsx
		const stylesheet = `
.dcu-turn-navigator{position:fixed;z-index:20;top:50%;left:var(--dcu-turn-left,288px);transform:translateY(-50%);width:16px;max-height:calc(100vh - 120px);overflow:visible;pointer-events:none}
.dcu-turn-scroll{width:16px;max-height:inherit;overflow-x:hidden;overflow-y:auto;scrollbar-width:none;pointer-events:none}
.dcu-turn-scroll::-webkit-scrollbar{display:none}
.dcu-turn-list{display:grid;gap:2px;margin:0;padding:4px 0;list-style:none;width:16px;pointer-events:none}
.dcu-turn-link{pointer-events:auto;position:relative;display:flex;align-items:center;width:16px;height:8px;overflow:visible;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);font:13px/18px var(--dsw-font-family);text-align:left;cursor:pointer;transition:color 320ms cubic-bezier(.16,1,.3,1)}
.dcu-turn-link::before{width:var(--dcu-tick-w,5px);height:var(--dcu-tick-h,1px);flex:0 0 var(--dcu-tick-w,5px);border-radius:1px;background:currentcolor;content:'';transition:width 360ms cubic-bezier(.16,1,.3,1),height 360ms cubic-bezier(.16,1,.3,1),flex-basis 360ms cubic-bezier(.16,1,.3,1),background-color 320ms cubic-bezier(.16,1,.3,1)}
.dcu-turn-summary{position:absolute;left:16px;top:var(--dcu-summary-top,50%);transform:translateY(-50%);box-sizing:border-box;width:max-content;max-width:240px;height:32px;padding:0 12px;border-radius:16px;background:#181818;color:#ededed;box-shadow:0 8px 24px rgba(0,0,0,.28);pointer-events:none;z-index:2;display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;line-height:32px}
.dcu-turn-link[data-active=true]{color:var(--dsw-alias-label-primary)}
.dcu-turn-link[aria-current=true]{color:var(--dsw-alias-label-primary)}
.dcu-turn-link[aria-current=true]::before{width:var(--dcu-tick-w,5px);flex-basis:var(--dcu-tick-w,5px);height:var(--dcu-tick-h,1px)}
.dcu-turn-navigator[data-hovering=true] .dcu-turn-link[aria-current=true]{color:var(--dsw-alias-label-tertiary)}
.dcu-turn-navigator[data-hovering=true] .dcu-turn-link[data-active=true]{color:var(--dsw-alias-label-primary)}
.dcu-turn-link:focus-visible{outline:0;box-shadow:0 0 0 2px var(--dsw-alias-button-info-fill)}
@media (prefers-reduced-motion:reduce){.dcu-turn-link,.dcu-turn-link::before{transition:none}}
@media (max-width:760px){.dcu-turn-summary{max-width:200px}}
`;
		function tickMarkSize(index, hoverAt, _isCurrent) {
			if (hoverAt === null) return {
				width: 5,
				height: 1
			};
			const distance = Math.abs(index - hoverAt);
			const wave = Math.exp(-(distance * distance) / 2.1);
			return {
				width: Number((5 + 13 * wave).toFixed(1)),
				height: Number((1 + 1.2 * wave).toFixed(1))
			};
		}
		function hoverIndexFromPoint(list, clientY, count) {
			const box = list.getBoundingClientRect();
			if (count <= 0 || box.height <= 0) return 0;
			return Math.min(Math.max(clientY - box.top, 0), box.height) / box.height * count - .5;
		}
		/** 轮目摘要上限：整段长文本会同时进入 title、aria-label 与 DOM 文本，必须截断。 */
		const TURN_SUMMARY_LIMIT = 72;
		function textSummary(content, fallback) {
			const text = content.flatMap((block) => {
				if (typeof block !== "object" || block === null) return [];
				const value = block;
				return value.type === "text" && typeof value.text === "string" ? [value.text] : [];
			}).join(" ").replace(/\s+/g, " ").trim();
			const summary = text === "" ? fallback : text;
			return summary.length > TURN_SUMMARY_LIMIT ? `${summary.slice(0, TURN_SUMMARY_LIMIT)}…` : summary;
		}
		function userContent(data) {
			if (typeof data !== "object" || data === null) return [];
			const content = data.content;
			return Array.isArray(content) ? content : [];
		}
		function turnLinks(snapshot, fallback) {
			const links = [];
			for (const key of snapshot.order) {
				const node = snapshot.nodes.get(key);
				if (node?.kind !== "user") continue;
				links.push({
					key: node.key,
					summary: textSummary(userContent(node.data), fallback)
				});
			}
			return links;
		}
		function equalTurns(left, right) {
			return left.length === right.length && left.every((turn, index) => turn.key === right[index]?.key && turn.summary === right[index]?.summary);
		}
		function legacyTurnLinks(useSession, fallback) {
			return useSession((snapshot) => {
				const chat = "chat" in snapshot ? snapshot.chat : void 0;
				return chat === void 0 ? [] : turnLinks(chat, fallback);
			}, equalTurns);
		}
		function railLeftFromSidebar() {
			const sidebar = document.querySelector(".dcu-root");
			if (sidebar === null) return 288;
			return Math.round(sidebar.getBoundingClientRect().right) + 16;
		}
		/** 当前会话的轮次导航；只读取原生聊天锚点并滚动，不改写会话数据或消息视图。 */
		function TurnNavigator({ useChat, useSession, t }) {
			const fallback = t("turns.untitled");
			const turns = useChat === void 0 ? legacyTurnLinks(useSession, fallback) : useChat((snapshot) => turnLinks(snapshot, fallback), equalTurns);
			const [current, setCurrent] = (0, react.useState)(turns[0]?.key ?? null);
			const [hoverAt, setHoverAt] = (0, react.useState)(null);
			const [railLeft, setRailLeft] = (0, react.useState)(288);
			const [summaryTop, setSummaryTop] = (0, react.useState)(0);
			const navRef = (0, react.useRef)(null);
			const listRef = (0, react.useRef)(null);
			const turnKeys = (0, react.useMemo)(() => turns.map((turn) => turn.key).join("|"), [turns]);
			const activeIndex = hoverAt === null ? -1 : Math.max(0, Math.min(turns.length - 1, Math.round(hoverAt)));
			const activeTurn = activeIndex >= 0 ? turns[activeIndex] : void 0;
			(0, react.useEffect)(() => {
				const sidebar = document.querySelector(".dcu-root");
				const update = () => {
					const next = railLeftFromSidebar();
					setRailLeft((previous) => previous === next ? previous : next);
				};
				const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(update);
				if (sidebar !== null) observer?.observe(sidebar);
				window.addEventListener("resize", update);
				update();
				return () => {
					observer?.disconnect();
					window.removeEventListener("resize", update);
				};
			}, []);
			(0, react.useEffect)(() => {
				if (turns.length === 0) return;
				let host = null;
				let frame = null;
				const update = () => {
					frame = null;
					if (host === null) return;
					const threshold = host.getBoundingClientRect().top + Math.min(180, host.clientHeight * .35);
					const anchors = conversationAnchors(host);
					let next = turns[0]?.key ?? null;
					for (const turn of turns) {
						const anchor = anchors.get(turn.key);
						if (anchor !== void 0 && anchor.getBoundingClientRect().top <= threshold) next = turn.key;
					}
					setCurrent((previous) => previous === next ? previous : next);
				};
				const schedule = () => {
					if (frame === null) frame = window.requestAnimationFrame(update);
				};
				const bindHost = () => {
					const next = conversationScrollRoot();
					if (next === host) return;
					host?.removeEventListener("scroll", schedule);
					host = next;
					host?.addEventListener("scroll", schedule, { passive: true });
					schedule();
				};
				const observer = new MutationObserver(() => {
					if (host === null || !host.isConnected) bindHost();
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				window.addEventListener("resize", schedule);
				bindHost();
				return () => {
					observer.disconnect();
					host?.removeEventListener("scroll", schedule);
					window.removeEventListener("resize", schedule);
					if (frame !== null) window.cancelAnimationFrame(frame);
				};
			}, [turnKeys, turns]);
			(0, react.useEffect)(() => {
				const nav = navRef.current;
				const list = listRef.current;
				if (nav === null || list === null || activeIndex < 0) return;
				const button = list.querySelectorAll(".dcu-turn-link")[activeIndex];
				if (button === void 0) return;
				const next = Math.round(button.getBoundingClientRect().top + button.getBoundingClientRect().height / 2 - nav.getBoundingClientRect().top);
				setSummaryTop((previous) => previous === next ? previous : next);
			}, [activeIndex, turns.length]);
			if (turns.length === 0) return null;
			const moveHover = (event) => {
				setHoverAt(hoverIndexFromPoint(event.currentTarget, event.clientY, turns.length));
			};
			const style = {
				"--dcu-turn-left": `${railLeft}px`,
				"--dcu-summary-top": `${summaryTop}px`
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
				ref: navRef,
				className: "dcu-turn-navigator",
				"data-hovering": hoverAt !== null || void 0,
				"aria-label": t("turns.label"),
				style,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: stylesheet }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-turn-scroll",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
							ref: listRef,
							className: "dcu-turn-list",
							onMouseMove: moveHover,
							onMouseLeave: () => {
								setHoverAt(null);
							},
							children: turns.map((turn, index) => {
								const mark = tickMarkSize(index, hoverAt, current === turn.key);
								const active = hoverAt !== null && index === activeIndex;
								const tickStyle = hoverAt === null ? void 0 : {
									"--dcu-tick-w": `${mark.width}px`,
									"--dcu-tick-h": `${mark.height}px`
								};
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-turn-link",
									"data-active": active || void 0,
									"aria-current": current === turn.key || void 0,
									"aria-label": t("turns.jump", {
										index: index + 1,
										summary: turn.summary
									}),
									style: tickStyle,
									onFocus: () => {
										setHoverAt(index);
									},
									onBlur: () => {
										setHoverAt(null);
									},
									onClick: () => {
										const host = conversationScrollRoot();
										const anchor = host === null ? null : conversationAnchor(host, turn.key);
										if (host === null || anchor === null) return;
										const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
										host.scrollTo({
											top: host.scrollTop + anchor.getBoundingClientRect().top - host.getBoundingClientRect().top - 12,
											behavior: reduceMotion ? "auto" : "smooth"
										});
									}
								}) }, turn.key);
							})
						})
					}),
					activeTurn !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dcu-turn-summary",
						children: activeTurn.summary
					})
				]
			});
		}
		//#endregion
		//#region src/client/image-studio-style.ts
		/** 生图模式面板样式；宿主无全局 box-sizing 重置，这里显式声明。 */
		const IMAGE_STUDIO_STYLE = `
.dcu-image-studio{position:relative;width:100%;height:100%;min-width:0;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family)}
.dcu-image-studio *,
.dcu-image-studio *::before,
.dcu-image-studio *::after{box-sizing:border-box}
.dcu-image-studio-head{flex:none;display:flex;align-items:center;gap:16px;width:100%;max-width:1080px;margin:0 auto;padding:18px 24px 0}
.dcu-image-studio-title{margin:0;font-size:22px;font-weight:600;line-height:28px}
.dcu-image-studio-tabs{display:flex;gap:4px;margin-left:8px}
.dcu-image-studio-tab{appearance:none;border:none;background:none;padding:6px 14px;border-radius:999px;color:color-mix(in srgb,var(--dsw-alias-label-primary) 62%,transparent);font:inherit;font-size:14px;line-height:20px;cursor:pointer;transition:background 120ms,color 120ms}
.dcu-image-studio-tab:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}
.dcu-image-studio-tab[data-active]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);color:var(--dsw-alias-label-primary);font-weight:500}
.dcu-image-studio-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
.dcu-image-studio-section{width:100%;max-width:1080px;margin:0 auto;padding:12px 24px 148px}
.dcu-image-studio-chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0 12px}
.dcu-image-studio-chip{appearance:none;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent);background:none;padding:5px 14px;border-radius:999px;color:color-mix(in srgb,var(--dsw-alias-label-primary) 72%,transparent);font:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:background 120ms,color 120ms,border-color 120ms}
.dcu-image-studio-chip:hover{color:var(--dsw-alias-label-primary)}
.dcu-image-studio-chip[data-active]{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base,#fff)}
.dcu-image-studio-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;padding:0 0 24px}
.dcu-image-studio-card{position:relative;margin:0;padding:0;border:none;border-radius:16px;overflow:hidden;background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);cursor:pointer;text-align:start}
.dcu-image-studio-card img,.dcu-image-studio-card>img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.dcu-image-studio-card figcaption{position:absolute;inset:auto 0 0 0;padding:22px 12px 10px;background:linear-gradient(to top,#000000b3,transparent);color:#fff;font-size:13px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.dcu-image-studio-card:hover figcaption{white-space:normal}
.dcu-image-studio-empty{margin:0;padding:64px 24px;text-align:center;color:color-mix(in srgb,var(--dsw-alias-label-primary) 55%,transparent);font-size:14px;line-height:22px}
.dcu-image-studio-error{pointer-events:auto;margin:0;max-width:min(768px,100%);padding:8px 14px;border-radius:14px;border:1px solid color-mix(in srgb,#c0392b 30%,transparent);background:var(--dsw-alias-bg-base,#fff);box-shadow:0 4px 18px #00000014;color:#c0392b;font-size:13px;line-height:20px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dcu-image-studio-state{padding:48px 24px;text-align:center;color:color-mix(in srgb,var(--dsw-alias-label-primary) 55%,transparent);font-size:14px}
.dcu-image-studio-spinner{display:block;width:22px;height:22px;margin:0 auto 10px;border-radius:50%;border:2px solid color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent);border-top-color:var(--dsw-alias-label-primary);animation:dcu-studio-spin 800ms linear infinite}
@keyframes dcu-studio-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.dcu-image-studio-spinner{animation-duration:1.6s}}
/* 记录页大图浮层 */
.dcu-image-studio-lightbox{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:flex-start;flex-direction:column;background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 92%,transparent);backdrop-filter:blur(6px);padding:32px 24px 24px;overflow-y:auto}
.dcu-image-studio-lightbox img{max-width:min(720px,100%);max-height:62vh;border-radius:16px;box-shadow:0 12px 40px #00000026}
.dcu-image-studio-lightbox-prompt{margin:16px 0 0;max-width:720px;width:100%;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;white-space:pre-wrap;overflow-wrap:anywhere}
.dcu-image-studio-lightbox-meta{margin:6px 0 0;max-width:720px;width:100%;color:color-mix(in srgb,var(--dsw-alias-label-primary) 50%,transparent);font-size:12px;line-height:18px}
.dcu-image-studio-lightbox-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.dcu-image-studio-action{appearance:none;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);background:var(--dsw-alias-bg-base,#fff);padding:7px 14px;border-radius:999px;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:background 120ms}
.dcu-image-studio-action:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent)}
.dcu-image-studio-lightbox-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:none;background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary);font-size:16px;line-height:1;cursor:pointer}
/* 底部 pill 输入区：悬浮在内容上层，卡片/模板从它背后滚过（不垫渐变底）。
   wrapper 吃 pointer-events:none，只有 pill 本体可点，背后的卡片保持可交互。 */
.dcu-image-studio-composer-wrap{position:absolute;left:0;right:0;bottom:0;z-index:5;display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 24px 20px;pointer-events:none}
.dcu-image-studio-composer{pointer-events:auto;width:min(768px,100%);padding:10px 12px 10px 16px;border-radius:24px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 12%,transparent);background:var(--dsw-alias-bg-base,#fff);box-shadow:0 8px 28px #0000001c,0 0 0 1px #0000000a;display:flex;flex-direction:column;gap:8px}
.dcu-image-studio-composer:focus-within{border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 30%,transparent)}
.dcu-image-studio-reference{display:flex;align-items:center;gap:8px;align-self:flex-start;padding:4px 8px 4px 4px;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);font-size:12px;line-height:16px}
.dcu-image-studio-reference img{width:32px;height:32px;border-radius:8px;object-fit:cover}
.dcu-image-studio-reference-x{appearance:none;border:none;background:none;padding:2px 4px;border-radius:6px;color:color-mix(in srgb,var(--dsw-alias-label-primary) 60%,transparent);cursor:pointer;font-size:13px;line-height:1}
.dcu-image-studio-reference-x:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent)}
.dcu-image-studio-inputrow{display:flex;align-items:flex-end;gap:8px}
.dcu-image-studio-input{flex:1;min-width:0;border:none;background:none;resize:none;overflow-y:auto;color:inherit;font:inherit;font-size:14px;line-height:22px;max-height:200px;padding:6px 0;outline:none}
.dcu-image-studio-input::placeholder{color:color-mix(in srgb,var(--dsw-alias-label-primary) 40%,transparent)}
.dcu-image-studio-send{flex:none;width:34px;height:34px;border-radius:50%;border:none;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base,#fff);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 120ms}
.dcu-image-studio-send:disabled{opacity:.35;cursor:default}
.dcu-image-studio-send[data-busy]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent);color:var(--dsw-alias-label-primary)}
/* GridReveal（移植自 rareui.com/components/gridreveal，MIT + Commons Clause，需保留署名） */
.dcu-grid-reveal{position:relative;width:100%;overflow:hidden;border-radius:16px;background:#e9e9ec}
body[data-ds-dark-theme] .dcu-grid-reveal{background:#232326}
.dcu-grid-reveal canvas{display:block;width:100%;height:100%}
.dcu-grid-reveal-img{display:block;width:100%;height:100%;object-fit:cover}
.dcu-grid-reveal-caption{position:absolute;left:12px;bottom:12px;max-width:calc(100% - 24px);display:flex;height:24px;align-items:center;padding:0 10px;border-radius:999px;background:rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font-size:11px;font-weight:500;line-height:24px;pointer-events:none;overflow:hidden;transition:opacity .28s ease}
.dcu-grid-reveal-caption>span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:dcu-grid-reveal-caption-in .28s ease both}
@keyframes dcu-grid-reveal-caption-in{from{opacity:0}to{opacity:1}}
.dcu-grid-reveal-shimmer{background-image:linear-gradient(90deg,rgba(255,255,255,.5) 40%,rgba(255,255,255,.98) 50%,rgba(255,255,255,.5) 60%);background-size:250% 100%;background-clip:text;-webkit-background-clip:text;color:transparent;animation:dcu-grid-reveal-caption-in .28s ease both,dcu-grid-reveal-shimmer 1.6s .5s cubic-bezier(.45,0,.55,1) infinite}
@keyframes dcu-grid-reveal-shimmer{from{background-position:105% 0}to{background-position:-5% 0}}
@media(prefers-reduced-motion:reduce){.dcu-grid-reveal-shimmer{animation:none;background:none;color:rgba(255,255,255,.75)}}
`;
		//#endregion
		//#region src/client/GridReveal.tsx
		/**
		* GridReveal——AI 生图加载态：四宫格持续把最大格一分为二，busy 区先变清晰，
		* 图片到达后整体揭示成真图。
		*
		* 移植自 Rare UI 的 GridReveal（https://www.rareui.com/components/gridreveal ，
		* 仓库 swamimalode07/rare-ui）。许可证 MIT + Commons Clause，要求项目中保留对
		* Rare UI 的可见署名——本文件头即署名，另见 README。
		*
		* 相对原版的移植改动：去掉 Tailwind 与 motion/react 依赖——状态 pill 的
		* crossfade/shimmer 用纯 CSS 等价实现；暗色判定改用宿主的
		* body[data-ds-dark-theme]；prefers-reduced-motion 用 matchMedia 自行读取；
		* canvas 缺失（jsdom/老内核）时退化为直接 <img>。canvas 引擎逐行保留。
		*/
		const CELLS = 180;
		const HOLD = .9;
		const WAIT_CAP = .72;
		const LAST_SPLIT = .92;
		const MORPH = .055;
		const SAMPLE = 128;
		const COLOR_MS = 420;
		const GUTTER_FROM = .35;
		const GUTTER_TO = .75;
		const PHOTO_FROM = .93;
		const clamp01 = (n) => n > 0 ? n < 1 ? n : 1 : 0;
		const mix = (a, b, t) => a + (b - a) * t;
		const easeOut = (t) => 1 - Math.pow(1 - t, 3);
		function smoothstep(a, b, x) {
			const t = clamp01((x - a) / (b - a));
			return t * t * (3 - 2 * t);
		}
		function selfPaced(elapsed, duration) {
			const span = duration > 0 ? duration : 1;
			return HOLD * (1 - Math.exp(-elapsed / span));
		}
		function hash(x, y, z) {
			const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
			return n - Math.floor(n);
		}
		function makeCell(x, y, w, h, parent) {
			return {
				x,
				y,
				w,
				h,
				r: 0,
				g: 0,
				b: 0,
				tone: hash(x + 3.1, y + 1.7, w * 31.7),
				detail: 0,
				splitAt: 0,
				parent,
				kids: null
			};
		}
		function buildTree(aspect) {
			const root = makeCell(0, 0, 1, 1, null);
			const leaves = [root];
			const branches = [];
			while (leaves.length < CELLS) {
				let pick = 0;
				let widest = -1;
				for (let i = 0; i < leaves.length; i++) {
					const c = leaves[i];
					const area = c.w * aspect * c.h * (1 + .12 * hash(c.x, c.y, 7.3));
					if (area > widest) {
						widest = area;
						pick = i;
					}
				}
				const parent = leaves.splice(pick, 1)[0];
				const wide = parent.w * aspect >= parent.h;
				const half = wide ? parent.w / 2 : parent.h / 2;
				const a = wide ? makeCell(parent.x, parent.y, half, parent.h, parent) : makeCell(parent.x, parent.y, parent.w, half, parent);
				const b = wide ? makeCell(parent.x + half, parent.y, half, parent.h, parent) : makeCell(parent.x, parent.y + half, parent.w, half, parent);
				parent.kids = [a, b];
				branches.push(parent);
				leaves.push(a, b);
			}
			const opening = 3;
			const rest = Math.max(1, branches.length - opening);
			branches.forEach((cell, i) => {
				cell.splitAt = i < opening ? -.055 : LAST_SPLIT * (i - opening + 1) / rest;
			});
			return {
				root,
				branches
			};
		}
		function measureTree(root, pixels, size) {
			const gather = (cell) => {
				let s;
				if (cell.kids) {
					const a = gather(cell.kids[0]);
					const b = gather(cell.kids[1]);
					s = {
						n: a.n + b.n,
						r: a.r + b.r,
						g: a.g + b.g,
						b: a.b + b.b,
						l: a.l + b.l,
						l2: a.l2 + b.l2
					};
				} else {
					s = {
						n: 0,
						r: 0,
						g: 0,
						b: 0,
						l: 0,
						l2: 0
					};
					const x0 = Math.round(cell.x * size);
					const y0 = Math.round(cell.y * size);
					const x1 = Math.max(x0 + 1, Math.round((cell.x + cell.w) * size));
					const y1 = Math.max(y0 + 1, Math.round((cell.y + cell.h) * size));
					for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
						const i = (y * size + x) * 4;
						const r = pixels[i];
						const g = pixels[i + 1];
						const b = pixels[i + 2];
						const l = .299 * r + .587 * g + .114 * b;
						s.n++;
						s.r += r;
						s.g += g;
						s.b += b;
						s.l += l;
						s.l2 += l * l;
					}
				}
				const n = s.n || 1;
				cell.r = s.r / n;
				cell.g = s.g / n;
				cell.b = s.b / n;
				cell.detail = Math.max(0, s.l2 / n - s.l / n * (s.l / n));
				return s;
			};
			gather(root);
		}
		function orderByDetail(branches, openedBefore) {
			const pending = branches.filter((c) => c.splitAt > openedBefore);
			if (pending.length < 2) return;
			const slots = pending.map((c) => c.splitAt).sort((a, b) => a - b);
			const queue = pending.filter((c) => !c.parent || c.parent.splitAt <= openedBefore);
			let next = 0;
			while (queue.length && next < slots.length) {
				let pick = 0;
				for (let i = 1; i < queue.length; i++) if (queue[i].detail > queue[pick].detail) pick = i;
				const cell = queue.splice(pick, 1)[0];
				cell.splitAt = slots[next++];
				for (const kid of cell.kids ?? []) if (kid.kids) queue.push(kid);
			}
		}
		function coverRect(iw, ih, w, h) {
			const s = Math.max(w / iw, h / ih);
			return {
				dx: (w - iw * s) / 2,
				dy: (h - ih * s) / 2,
				dw: iw * s,
				dh: ih * s
			};
		}
		function greyOf(tone, dark, clock) {
			return (dark ? 30 : 228) + tone * 13 + Math.sin(clock * 1.5 + tone * 6.28) * 3;
		}
		function drawScene(s) {
			const { ctx, root, width, height, split } = s;
			const tint = s.hasColors ? s.fade : 0;
			const shade = (grey, target) => Math.round(mix(grey, target, tint));
			const base = greyOf(root.tone, s.dark, s.clock);
			ctx.fillStyle = `rgb(${Math.round(shade(base, root.r) * .92)},${Math.round(shade(base, root.g) * .92)},${Math.round(shade(base, root.b) * .92)})`;
			ctx.fillRect(0, 0, width, height);
			const soft = 1 - smoothstep(GUTTER_FROM, GUTTER_TO, split);
			const gutter = s.scale * soft;
			const rounded = soft > .01 && typeof ctx.roundRect === "function";
			const paint = (p) => {
				const x = Math.round(p.x);
				const y = Math.round(p.y);
				const w = Math.round(p.x + p.w) - x;
				const h = Math.round(p.y + p.h) - y;
				const onLeft = x <= 0;
				const onTop = y <= 0;
				const onRight = x + w >= width;
				const onBottom = y + h >= height;
				const left = onLeft ? 0 : gutter;
				const top = onTop ? 0 : gutter;
				const innerW = w - left - (onRight ? 0 : gutter);
				const innerH = h - top - (onBottom ? 0 : gutter);
				if (innerW <= 0 || innerH <= 0) return;
				const grey = greyOf(p.tone, s.dark, s.clock);
				ctx.fillStyle = `rgb(${shade(grey, p.r)},${shade(grey, p.g)},${shade(grey, p.b)})`;
				if (rounded) {
					const radius = Math.min(innerW, innerH) * .12 * soft;
					ctx.beginPath();
					ctx.roundRect(x + left, y + top, innerW, innerH, [
						!onLeft && !onTop ? radius : 0,
						!onRight && !onTop ? radius : 0,
						!onRight && !onBottom ? radius : 0,
						!onLeft && !onBottom ? radius : 0
					]);
					ctx.fill();
				} else ctx.fillRect(x + left, y + top, innerW, innerH);
			};
			const walk = (cell, p) => {
				if (!cell.kids || split < cell.splitAt) {
					paint(p);
					return;
				}
				const t = easeOut(clamp01((split - cell.splitAt) / MORPH));
				for (const kid of cell.kids) walk(kid, {
					x: mix(p.x, kid.x * width, t),
					y: mix(p.y, kid.y * height, t),
					w: mix(p.w, kid.w * width, t),
					h: mix(p.h, kid.h * height, t),
					r: mix(p.r, kid.r, t),
					g: mix(p.g, kid.g, t),
					b: mix(p.b, kid.b, t),
					tone: mix(p.tone, kid.tone, t)
				});
			};
			walk(root, {
				x: 0,
				y: 0,
				w: width,
				h: height,
				r: root.r,
				g: root.g,
				b: root.b,
				tone: root.tone
			});
			if (!s.image) return;
			const photo = s.hasColors ? smoothstep(PHOTO_FROM, 1, split) * s.fade : s.fade;
			if (photo <= .002) return;
			const fit = coverRect(s.image.naturalWidth, s.image.naturalHeight, width, height);
			ctx.globalAlpha = photo;
			ctx.drawImage(s.image, fit.dx, fit.dy, fit.dw, fit.dh);
			ctx.globalAlpha = 1;
		}
		function readAverages(el, root, branches, at) {
			const buffer = document.createElement("canvas");
			buffer.width = SAMPLE;
			buffer.height = SAMPLE;
			const ctx = buffer.getContext("2d", { willReadFrequently: true });
			if (!ctx) return false;
			const fit = coverRect(el.naturalWidth, el.naturalHeight, SAMPLE, SAMPLE);
			ctx.drawImage(el, fit.dx, fit.dy, fit.dw, fit.dh);
			try {
				measureTree(root, ctx.getImageData(0, 0, SAMPLE, SAMPLE).data, SAMPLE);
				orderByDetail(branches, at);
				return true;
			} catch {
				return false;
			}
		}
		const cx = (...parts) => parts.filter(Boolean).join(" ");
		function GridReveal({ src, alt = "", progress, aspect = 1, caption, estimatedDuration = 6e3, onRevealComplete, onError, className, style, ...props }) {
			const [reduce, setReduce] = (0, react.useState)(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
			(0, react.useEffect)(() => {
				const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
				if (query === void 0) return;
				const onChange = () => {
					setReduce(query.matches);
				};
				query.addEventListener?.("change", onChange);
				return () => {
					query.removeEventListener?.("change", onChange);
				};
			}, []);
			const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
			const frameRef = (0, react.useRef)(null);
			const canvasRef = (0, react.useRef)(null);
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [revealed, setRevealed] = (0, react.useState)(false);
			const [canvasOk, setCanvasOk] = (0, react.useState)(true);
			const [lastSrc, setLastSrc] = (0, react.useState)(src);
			if (src !== lastSrc) {
				setLastSrc(src);
				setLoaded(false);
				setRevealed(false);
			}
			const progressRef = (0, react.useRef)(progress);
			const durationRef = (0, react.useRef)(estimatedDuration);
			const doneRef = (0, react.useRef)(onRevealComplete);
			const errorRef = (0, react.useRef)(onError);
			(0, react.useEffect)(() => {
				progressRef.current = progress;
				durationRef.current = estimatedDuration;
				doneRef.current = onRevealComplete;
				errorRef.current = onError;
			});
			(0, react.useEffect)(() => {
				const canvas = canvasRef.current;
				const frame = frameRef.current;
				if (!canvas || !frame) return;
				let ctx = null;
				try {
					ctx = canvas.getContext("2d");
				} catch {
					ctx = null;
				}
				if (!ctx) {
					setCanvasOk(false);
					return;
				}
				const { root, branches } = buildTree(ratio);
				const scene = {
					ctx,
					root,
					width: 0,
					height: 0,
					scale: 1,
					dark: false,
					clock: 0,
					split: 0,
					fade: 0,
					hasColors: false,
					image: null
				};
				let loadedAt = -1;
				let cancelled = false;
				const render = (split, now) => {
					scene.dark = document.body.hasAttribute("data-ds-dark-theme");
					scene.split = split;
					scene.fade = loadedAt < 0 ? 0 : smoothstep(0, COLOR_MS, now - loadedAt);
					drawScene(scene);
				};
				const repaint = () => {
					if (!reduce) return render(scene.split, performance.now());
					const settled = loadedAt < 0 ? performance.now() : loadedAt + COLOR_MS;
					render(scene.image ? 1 : WAIT_CAP, settled);
				};
				const resize = () => {
					const dpr = Math.min(window.devicePixelRatio || 1, 2);
					const rect = frame.getBoundingClientRect();
					const w = Math.max(1, Math.round(rect.width * dpr));
					const h = Math.max(1, Math.round(rect.height * dpr));
					scene.scale = dpr;
					if (w === scene.width && h === scene.height) return;
					scene.width = w;
					scene.height = h;
					canvas.width = w;
					canvas.height = h;
					repaint();
				};
				resize();
				const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
				observer?.observe(frame);
				const load = (url, withCors) => {
					const el = new Image();
					if (withCors) el.crossOrigin = "anonymous";
					el.decoding = "async";
					el.onload = () => {
						if (cancelled) return;
						if (!el.naturalWidth || !el.naturalHeight) {
							errorRef.current?.();
							return;
						}
						scene.image = el;
						loadedAt = performance.now();
						scene.hasColors = readAverages(el, root, branches, scene.split);
						setLoaded(true);
						if (reduce) repaint();
					};
					el.onerror = () => {
						if (cancelled) return;
						if (withCors) load(url, false);
						else errorRef.current?.();
					};
					el.src = url;
				};
				if (src) load(src, true);
				if (reduce) {
					repaint();
					return () => {
						cancelled = true;
						observer?.disconnect();
					};
				}
				let frameId = 0;
				let last = 0;
				let elapsed = 0;
				let eased = 0;
				let split = 0;
				let fired = false;
				let stopped = false;
				let visible = true;
				const tick = (now) => {
					frameId = requestAnimationFrame(tick);
					if (!last) last = now;
					const dt = Math.min((now - last) / 1e3, .05);
					last = now;
					elapsed += dt;
					scene.clock = elapsed;
					const ready = scene.image !== null;
					const paced = progressRef.current === void 0;
					let target;
					if (ready) target = 1;
					else if (paced) target = selfPaced(elapsed * 1e3, durationRef.current);
					else target = Math.min(clamp01(progressRef.current), HOLD);
					eased += (target - eased) * (1 - Math.exp(-dt * 5.5));
					split += (Math.min(eased, ready ? 1 : WAIT_CAP) - split) * (1 - Math.exp(-dt * 4));
					render(split, now);
					if (!fired && ready && eased > .995 && now - loadedAt > COLOR_MS) {
						fired = true;
						setRevealed(true);
						doneRef.current?.();
					}
					if (fired && split > .9995) {
						render(1, now);
						stopped = true;
						cancelAnimationFrame(frameId);
					}
				};
				const start = () => {
					if (stopped) return;
					last = 0;
					cancelAnimationFrame(frameId);
					frameId = requestAnimationFrame(tick);
				};
				const visibility = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
					const entry = entries[0];
					if (entry === void 0 || entry.isIntersecting === visible) return;
					visible = entry.isIntersecting;
					if (visible) start();
					else cancelAnimationFrame(frameId);
				}, { rootMargin: "150px" }) : null;
				visibility?.observe(frame);
				start();
				return () => {
					cancelled = true;
					cancelAnimationFrame(frameId);
					observer?.disconnect();
					visibility?.disconnect();
				};
			}, [
				reduce,
				src,
				ratio
			]);
			(0, react.useEffect)(() => {
				if (reduce && loaded) doneRef.current?.();
			}, [reduce, loaded]);
			const finished = reduce ? loaded : revealed;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: frameRef,
				"data-slot": "grid-reveal",
				className: cx("dcu-grid-reveal", className),
				style: {
					aspectRatio: ratio,
					...style
				},
				...props,
				children: [canvasOk ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					...alt ? {
						role: "img",
						"aria-label": alt
					} : { "aria-hidden": true }
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					...alt ? { alt } : { "aria-hidden": true },
					className: "dcu-grid-reveal-img",
					onLoad: () => {
						setLoaded(true);
						doneRef.current?.();
					},
					onError: () => {
						errorRef.current?.();
					},
					src: src ?? void 0
				}), caption !== void 0 && caption !== "" && !finished ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dcu-grid-reveal-caption",
					style: { opacity: finished ? 0 : 1 },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: reduce ? void 0 : "dcu-grid-reveal-shimmer",
						children: caption
					})
				}) : null]
			});
		}
		//#endregion
		//#region src/client/image-studio.ts
		/** image-studio 全局面板 id：panellist 与 main 的 key 共用。 */
		const IMAGE_STUDIO_PANEL_ID = "image-studio";
		/**
		* dsh-image-gen 注册的右侧栏工作台页签 id（client.js SIDEBAR_STUDIO_TAB_ID）。
		* 通过宿主 sidebarRight.openTab 调起的就是这套原版工作台（无限画布 + 生成面板）。
		*/
		const STUDIO_SIDEBAR_TAB_ID = "dsh-image-gen/studio";
		const STUDIO_HEALTH_ROUTE = "/plugins/dsh-image-gen/settings-health";
		const STUDIO_ROUTE = "/plugins/dsh-image-gen/studio";
		const STUDIO_IMAGE_ROUTE = "/plugins/dsh-image-gen/image";
		const STUDIO_INSPIRATION_CATALOG_ROUTE = "/plugins/dsh-image-gen/inspiration/catalog";
		const HISTORY_STORAGE_KEY = "dcu.imageStudio.history";
		/** 灵感图由宿主路由代理缓存，浏览器侧不用拼镜像 URL。 */
		function inspirationImageUrl(sourceId, caseId) {
			return `/plugins/dsh-image-gen/inspiration/image/${encodeURIComponent(sourceId)}/${encodeURIComponent(caseId)}`;
		}
		/** dsh-image-gen 是否已安装（路由 404 = 未装；settings 存在即插件在位）。 */
		async function isImageStudioAvailable() {
			try {
				return (await fetch(STUDIO_HEALTH_ROUTE, { credentials: "same-origin" })).ok;
			} catch {
				return false;
			}
		}
		/** 读工作台配置；插件未装或未配置时返回 null。 */
		async function fetchStudioConfig() {
			const response = await fetch(STUDIO_ROUTE, { credentials: "same-origin" });
			if (!response.ok) return null;
			const payload = await response.json();
			if (typeof payload !== "object" || payload === null) return null;
			const { providers, activeProvider } = payload;
			if (!Array.isArray(providers) || providers.length === 0 || typeof activeProvider !== "string") return null;
			return {
				providers: providers.flatMap((entry) => {
					if (typeof entry !== "object" || entry === null) return [];
					const profile = entry;
					if (typeof profile.provider !== "string" || typeof profile.label !== "string" || typeof profile.model !== "string") return [];
					return [{
						provider: profile.provider,
						...typeof profile.channel === "string" ? { channel: profile.channel } : {},
						label: profile.label,
						model: profile.model,
						configured: profile.configured === true,
						supportsEditing: profile.supportsEditing === true,
						defaultRatio: typeof profile.defaultRatio === "string" ? profile.defaultRatio : "1:1",
						defaultQuality: typeof profile.defaultQuality === "string" ? profile.defaultQuality : "auto"
					}];
				}),
				activeProvider,
				...typeof payload.activeChannel === "string" ? { activeChannel: payload.activeChannel } : {}
			};
		}
		/** 从配置装配一次生成请求：active provider+channel 的 profile，退而求首个 configured。未配置时抛错。 */
		function buildGenerateRequest(config, prompt, mode = "generate", reference) {
			const matches = (profile) => profile.provider === config.activeProvider && (config.activeChannel === void 0 || profile.channel === config.activeChannel);
			const profile = config.providers.find(matches) ?? config.providers.find((entry) => entry.provider === config.activeProvider) ?? config.providers.find((entry) => entry.configured);
			if (profile === void 0 || !profile.configured) throw new Error("no-configured-provider");
			return {
				mode,
				provider: profile.provider,
				...profile.channel === void 0 ? {} : { channel: profile.channel },
				model: profile.model,
				prompt: prompt.trim(),
				ratio: profile.defaultRatio,
				quality: profile.defaultQuality,
				...mode === "edit" && reference !== void 0 ? { references: [{ attachment: reference }] } : {}
			};
		}
		/** 展开 StudioGenerateResponse：单图归一为一张，批量展开 items（失败的次张记录进 errors 由调用方呈现）。 */
		function expandGenerateResponse(response) {
			const base = {
				provider: response.provider,
				...response.channel === void 0 ? {} : { channel: response.channel },
				model: response.model,
				prompt: response.prompt,
				createdAt: response.createdAt
			};
			return (Array.isArray(response.items) && response.items.length > 0 ? response.items.map((item) => ({
				attachment: item.attachment,
				output: item.output,
				...base
			})) : [{
				attachment: response.attachment,
				output: response.output,
				...base
			}]).map((item) => ({
				...item,
				ratio: void 0
			}));
		}
		/** 发起一次生成；非 2xx 或错误体时抛出可展示的消息。 */
		async function generateImage(request, signal) {
			const response = await fetch(STUDIO_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				signal,
				headers: { "content-type": "application/json" },
				body: JSON.stringify(request)
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok || typeof payload !== "object" || payload === null || !("attachment" in payload)) {
				const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`;
				throw new Error(message);
			}
			return payload;
		}
		const blobUrlCache = /* @__PURE__ */ new Map();
		/** 取生成图的 blob objectURL（同 ref 命中缓存）；缓存超限从最旧开始 revoke。 */
		async function fetchImageBlobUrl(attachment) {
			const key = JSON.stringify(attachment);
			const cached = blobUrlCache.get(key);
			if (cached !== void 0) return cached;
			const response = await fetch(STUDIO_IMAGE_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ attachment })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const url = URL.createObjectURL(await response.blob());
			blobUrlCache.set(key, url);
			if (blobUrlCache.size > 60) {
				const oldest = blobUrlCache.keys().next().value;
				if (oldest !== void 0) {
					URL.revokeObjectURL(blobUrlCache.get(oldest) ?? "");
					blobUrlCache.delete(oldest);
				}
			}
			return url;
		}
		/** 读取灵感库（宿主端已解析好的目录）；失败返回 null。 */
		async function fetchInspirationCatalog() {
			const response = await fetch(STUDIO_INSPIRATION_CATALOG_ROUTE, { credentials: "same-origin" });
			if (!response.ok) return [];
			const payload = await response.json();
			const sources = typeof payload === "object" && payload !== null ? payload.sources : void 0;
			if (!Array.isArray(sources)) return [];
			return sources.flatMap((source) => {
				if (typeof source !== "object" || source === null) return [];
				const { id: sourceId, cases } = source;
				if (typeof sourceId !== "string" || !Array.isArray(cases)) return [];
				return cases.flatMap((entry) => {
					if (typeof entry !== "object" || entry === null) return [];
					const item = entry;
					if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.prompt !== "string") return [];
					return [{
						sourceId,
						id: item.id,
						title: item.title,
						prompt: item.prompt,
						category: typeof item.category === "string" ? item.category : ""
					}];
				});
			});
		}
		/** 读本地生成记录；坏数据一律当空处理（记录只是加速器，丢了不影响功能）。 */
		function readStudioHistory(storage = browserStorage()) {
			if (storage === void 0) return [];
			try {
				const raw = storage.getItem(HISTORY_STORAGE_KEY);
				const parsed = raw === null ? [] : JSON.parse(raw);
				if (!Array.isArray(parsed)) return [];
				return parsed.flatMap((entry) => {
					if (typeof entry !== "object" || entry === null) return [];
					const item = entry;
					const attachment = item.attachment;
					if (typeof attachment !== "object" || attachment === null || typeof attachment.attachmentId !== "string") return [];
					if (typeof item.prompt !== "string" || typeof item.createdAt !== "number") return [];
					return [{
						attachment,
						output: typeof item.output === "string" ? item.output : "",
						provider: typeof item.provider === "string" ? item.provider : "",
						model: typeof item.model === "string" ? item.model : "",
						prompt: item.prompt,
						createdAt: item.createdAt,
						...typeof item.ratio === "string" ? { ratio: item.ratio } : {}
					}];
				});
			} catch {
				return [];
			}
		}
		/** 追加一条生成记录（新记录在前），超限从最旧裁剪后持久化。 */
		function addStudioHistory(existing, item, storage = browserStorage()) {
			const next = [item, ...existing].slice(0, 100);
			try {
				storage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
			} catch {}
			return next;
		}
		//#endregion
		//#region src/client/ImageStudioPanel.tsx
		/** 生图模式面板：灵感模板卡墙 + 底部输入框，生成直连 dsh-image-gen 的 studio 路由。 */
		/** 记录卡片：懒取 blob objectURL（命中 image-studio.ts 的全局 LRU，不逐组件 revoke）。 */
		function HistoryCard({ item, t, onOpen }) {
			const [src, setSrc] = (0, react.useState)("");
			const [failed, setFailed] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let alive = true;
				fetchImageBlobUrl(item.attachment).then((url) => {
					if (alive) setSrc(url);
				}).catch(() => {
					if (alive) setFailed(true);
				});
				return () => {
					alive = false;
				};
			}, [item.attachment]);
			if (failed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
				className: "dcu-image-studio-card",
				onClick: () => {},
				"data-dcu-studio-failed": true,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					alt: "",
					"aria-hidden": "true",
					src: ""
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", { children: t("studio.generateFailed") })]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
				className: "dcu-image-studio-card",
				onClick: () => onOpen(item),
				children: [src === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					alt: "",
					"aria-hidden": "true",
					src: ""
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					alt: item.prompt.slice(0, 80),
					loading: "lazy",
					src
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", { children: item.prompt })]
			});
		}
		/** 大图浮层：下载 / 复制 Prompt / 以此图编辑。 */
		function Lightbox({ item, src, t, onClose, onEditFrom }) {
			const [copied, setCopied] = (0, react.useState)(false);
			const download = () => {
				const extension = item.attachment.mediaType.includes("jpeg") ? "jpg" : item.attachment.mediaType.includes("webp") ? "webp" : "png";
				const anchor = document.createElement("a");
				anchor.href = src;
				anchor.download = item.attachment.name ?? `image-${item.createdAt}.${extension}`;
				anchor.click();
			};
			const copyPrompt = () => {
				navigator.clipboard?.writeText(item.prompt).then(() => {
					setCopied(true);
					window.setTimeout(() => {
						setCopied(false);
					}, 1500);
				}).catch(() => {});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dcu-image-studio-lightbox",
				onClick: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dcu-image-studio-lightbox-close",
						"aria-label": t("studio.removeReference"),
						onClick: onClose,
						children: "×"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						alt: item.prompt.slice(0, 80),
						src
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dcu-image-studio-lightbox-prompt",
						children: item.prompt
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dcu-image-studio-lightbox-meta",
						children: [item.provider, item.model].filter(Boolean).join(" · ")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-image-studio-lightbox-actions",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dcu-image-studio-action",
								onClick: download,
								children: t("studio.download")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dcu-image-studio-action",
								onClick: copyPrompt,
								children: copied ? t("studio.copied") : t("studio.copyPrompt")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dcu-image-studio-action",
								onClick: () => onEditFrom(item),
								children: t("studio.editFrom")
							})
						]
					})
				]
			});
		}
		/** 中列生图面板；由 index.ts 注册进 main 插槽（key = image-studio）。 */
		function ImageStudioPanel({ t, openStudioWorkbench, workbenchAvailable }) {
			const [available, setAvailable] = (0, react.useState)(null);
			const [config, setConfig] = (0, react.useState)(null);
			const [tab, setTab] = (0, react.useState)("templates");
			const [inspiration, setInspiration] = (0, react.useState)({ kind: "loading" });
			const [category, setCategory] = (0, react.useState)(null);
			const [history, setHistory] = (0, react.useState)([]);
			const [prompt, setPrompt] = (0, react.useState)("");
			const [reference, setReference] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [incoming, setIncoming] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [lastPrompt, setLastPrompt] = (0, react.useState)("");
			const [openItem, setOpenItem] = (0, react.useState)(null);
			const [openSrc, setOpenSrc] = (0, react.useState)("");
			const [workbench, setWorkbench] = (0, react.useState)("checking");
			const inputRef = (0, react.useRef)(null);
			const abortRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setWorkbench(workbenchAvailable?.() === true ? "available" : "missing");
			}, [workbenchAvailable]);
			(0, react.useEffect)(() => {
				const input = inputRef.current;
				if (input === null) return;
				input.style.height = "auto";
				input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
			}, [prompt]);
			(0, react.useEffect)(() => {
				let alive = true;
				isImageStudioAvailable().then((ok) => {
					if (alive) setAvailable(ok);
				});
				fetchStudioConfig().then((value) => {
					if (alive) setConfig(value);
				}).catch(() => {});
				fetchInspirationCatalog().then((cases) => {
					if (!alive) return;
					setInspiration(cases.length > 0 ? {
						kind: "ready",
						cases
					} : { kind: "error" });
				}).catch(() => {
					if (alive) setInspiration({ kind: "error" });
				});
				setHistory(readStudioHistory());
				return () => {
					alive = false;
					abortRef.current?.abort();
				};
			}, []);
			const categories = (0, react.useMemo)(() => {
				if (inspiration.kind !== "ready") return [];
				return [...new Set(inspiration.cases.map((item) => item.category).filter((item) => item !== ""))];
			}, [inspiration]);
			const visibleCases = (0, react.useMemo)(() => {
				if (inspiration.kind !== "ready") return [];
				return category === null ? inspiration.cases : inspiration.cases.filter((item) => item.category === category);
			}, [inspiration, category]);
			const submit = (0, react.useCallback)((text) => {
				const trimmed = text.trim();
				if (trimmed === "" || busy || config === null) return;
				const controller = new AbortController();
				abortRef.current = controller;
				setBusy(true);
				setError(null);
				setIncoming(null);
				setLastPrompt(trimmed);
				setTab("history");
				const mode = reference === null ? "generate" : "edit";
				(async () => {
					try {
						const items = expandGenerateResponse(await generateImage(buildGenerateRequest(config, trimmed, mode, reference?.attachment), controller.signal));
						setHistory((current) => items.reduce((accumulator, item) => addStudioHistory(accumulator, item), current));
						setPrompt("");
						setReference(null);
						const url = await fetchImageBlobUrl(items[0].attachment).catch(() => "");
						if (controller.signal.aborted) return;
						setIncoming(url === "" ? null : {
							item: items[0],
							url
						});
					} catch (reason) {
						if (controller.signal.aborted) return;
						setError(reason instanceof Error ? reason.message : String(reason));
					} finally {
						if (abortRef.current === controller) abortRef.current = null;
						setBusy(false);
					}
				})();
			}, [
				busy,
				config,
				reference
			]);
			const openBig = (0, react.useCallback)((item) => {
				setOpenItem(item);
				fetchImageBlobUrl(item.attachment).then(setOpenSrc).catch(() => setOpenSrc(""));
			}, []);
			const editFrom = (0, react.useCallback)((item) => {
				fetchImageBlobUrl(item.attachment).then((src) => {
					setReference({
						attachment: item.attachment,
						src
					});
					setOpenItem(null);
					setTab("history");
					inputRef.current?.focus();
				}).catch(() => {});
			}, []);
			if (available === false) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-image-studio",
				"data-dcu-image-studio": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: IMAGE_STUDIO_STYLE }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dcu-image-studio-empty",
					children: t("studio.pluginUnavailable")
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dcu-image-studio",
				"data-dcu-image-studio": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: IMAGE_STUDIO_STYLE }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dcu-image-studio-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
							className: "dcu-image-studio-title",
							children: t("studio.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-image-studio-tabs",
							role: "tablist",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: "dcu-image-studio-tab",
									"aria-selected": tab === "templates",
									"data-active": tab === "templates" || void 0,
									onClick: () => {
										setTab("templates");
									},
									children: t("studio.tabTemplates")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: "dcu-image-studio-tab",
									"aria-selected": tab === "history",
									"data-active": tab === "history" || void 0,
									onClick: () => {
										setTab("history");
									},
									children: t("studio.tabHistory")
								}),
								workbench === "available" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-image-studio-tab",
									"data-dcu-studio-workbench": "",
									title: t("studio.workbenchHint"),
									onClick: () => {
										if (openStudioWorkbench?.() !== true) setWorkbench("missing");
									},
									children: t("studio.workbench")
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dcu-image-studio-body",
						children: tab === "templates" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-image-studio-section",
							children: [
								categories.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dcu-image-studio-chips",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dcu-image-studio-chip",
										"data-active": category === null || void 0,
										onClick: () => {
											setCategory(null);
										},
										children: t("studio.allCategories")
									}), categories.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dcu-image-studio-chip",
										"data-active": category === item || void 0,
										onClick: () => {
											setCategory(item);
										},
										children: item
									}, item))]
								}),
								inspiration.kind === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
									className: "dcu-image-studio-state",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dcu-image-studio-spinner",
										"aria-hidden": "true"
									}), t("studio.templatesLoading")]
								}),
								inspiration.kind === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "dcu-image-studio-error",
									children: t("studio.templatesLoadError")
								}),
								inspiration.kind === "ready" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dcu-image-studio-grid",
									children: visibleCases.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
										className: "dcu-image-studio-card",
										onClick: () => {
											setPrompt(item.prompt);
											inputRef.current?.focus();
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											alt: item.title,
											loading: "lazy",
											src: inspirationImageUrl(item.sourceId, item.id)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", { children: item.title })]
									}, `${item.sourceId}/${item.id}`))
								})
							]
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dcu-image-studio-section",
							children: history.length === 0 && !busy && incoming === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dcu-image-studio-empty",
								children: t("studio.historyEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-image-studio-grid",
								children: [(busy || incoming !== null) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									"data-dcu-studio-reveal": "",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GridReveal, {
										src: incoming?.url ?? null,
										aspect: 1,
										caption: busy ? t("studio.generating") : void 0,
										onRevealComplete: () => {
											setIncoming(null);
										},
										onError: () => {
											setIncoming(null);
										}
									})
								}), history.map((item, index) => incoming !== null && item === incoming.item ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HistoryCard, {
									item,
									t,
									onOpen: openBig
								}, `${item.attachment.attachmentId}:${item.createdAt}:${index}`))]
							})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dcu-image-studio-composer-wrap",
						children: [error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
							className: "dcu-image-studio-error",
							role: "alert",
							children: [
								t("studio.generateFailed"),
								"：",
								error,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-image-studio-action",
									onClick: () => {
										submit(lastPrompt);
									},
									children: t("studio.retry")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dcu-image-studio-composer",
							"data-dcu-studio-composer": "",
							children: [reference !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-image-studio-reference",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										alt: "",
										src: reference.src
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("studio.editMode") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dcu-image-studio-reference-x",
										"aria-label": t("studio.removeReference"),
										onClick: () => {
											setReference(null);
										},
										children: "×"
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dcu-image-studio-inputrow",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									ref: inputRef,
									className: "dcu-image-studio-input",
									rows: 1,
									placeholder: t("studio.describePlaceholder"),
									value: prompt,
									"data-dcu-studio-input": "",
									onChange: (event) => {
										setPrompt(event.target.value);
									},
									onKeyDown: (event) => {
										if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
											event.preventDefault();
											submit(prompt);
										}
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dcu-image-studio-send",
									"data-busy": busy || void 0,
									disabled: !busy && prompt.trim() === "",
									"aria-label": busy ? t("studio.cancel") : t("studio.generate"),
									onClick: () => {
										if (busy) {
											abortRef.current?.abort();
											return;
										}
										submit(prompt);
									},
									children: busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dcu-image-studio-spinner",
										style: {
											margin: 0,
											width: 14,
											height: 14,
											borderWidth: 2
										},
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
										width: "16",
										height: "16",
										viewBox: "0 0 24 24",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "2",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 12h14" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 6l6 6-6 6" })]
									})
								})]
							})]
						})]
					}),
					openItem !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Lightbox, {
						item: openItem,
						src: openSrc,
						t,
						onClose: () => {
							setOpenItem(null);
						},
						onEditFrom: editFrom
					})
				]
			});
		}
		ImageStudioPanel.displayName = "dcu-image-studio";
		//#endregion
		//#region src/client/input-history.ts
		const HISTORY_KEY = "uncledylan.codex-ui.input-history.v1";
		const LEGACY_HISTORY_KEY = "michengai.btw.history.v1";
		const MAX_STORAGE_LENGTH = 1e6;
		/** 只保存已发送文本；浏览器存储失败时仍保留本次内存历史。 */
		var InputHistory = class {
			storage;
			limit;
			warn;
			scopes = /* @__PURE__ */ new Map();
			constructor(storage, limit = 200, warn = console.warn) {
				this.storage = storage;
				this.limit = limit;
				this.warn = warn;
				try {
					const current = storage?.getItem(HISTORY_KEY);
					const raw = current ?? storage?.getItem(LEGACY_HISTORY_KEY);
					if (!raw) return;
					if (raw.length > MAX_STORAGE_LENGTH) throw new Error("历史数据过大");
					const data = JSON.parse(raw);
					if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error("历史格式无效");
					for (const [key, value] of Object.entries(data).slice(-20)) if (Array.isArray(value)) this.scopes.set(key, value.filter((item) => typeof item === "string" && item.length <= 8e3).slice(-limit));
					if (current === null || current === void 0) storage?.setItem(HISTORY_KEY, JSON.stringify(Object.fromEntries(this.scopes)));
				} catch {
					warn("输入历史读取失败，本次使用内存历史。");
				}
			}
			list(scope) {
				return this.scopes.get(scope) ?? [];
			}
			add(scope, text) {
				if (!text.trim() || text.length > 8e3) return;
				const previous = this.scopes.get(scope) ?? [];
				if (previous.at(-1) === text) return;
				this.scopes.delete(scope);
				this.scopes.set(scope, [...previous, text].slice(-this.limit));
				while (this.scopes.size > 20) this.scopes.delete(this.scopes.keys().next().value);
				let serialized = JSON.stringify(Object.fromEntries(this.scopes));
				while (serialized.length > MAX_STORAGE_LENGTH && this.scopes.size) {
					const oldest = this.scopes.keys().next().value;
					const entries = this.scopes.get(oldest);
					entries.shift();
					if (!entries.length) this.scopes.delete(oldest);
					serialized = JSON.stringify(Object.fromEntries(this.scopes));
				}
				try {
					this.storage?.setItem(HISTORY_KEY, serialized);
				} catch {
					this.warn("输入历史无法保存到浏览器，本次仍可使用。");
				}
			}
		};
		/** 从空输入进入，编辑历史即退出，避免覆盖用户的新草稿。 */
		var HistoryCursor = class {
			index;
			original = "";
			displayed = "";
			entries = [];
			reset() {
				this.index = void 0;
				this.entries = [];
			}
			move(direction, draft, entries) {
				if (this.index !== void 0 && draft !== this.displayed) this.reset();
				if (this.index === void 0) {
					if (direction !== -1 || draft !== "" || entries.length === 0) return void 0;
					this.original = draft;
					this.entries = [...entries];
					this.index = this.entries.length;
				}
				this.index = Math.max(0, Math.min(this.entries.length, this.index + direction));
				if (this.index === this.entries.length) {
					const restored = this.original;
					this.reset();
					return restored;
				}
				this.displayed = this.entries[this.index] ?? "";
				return this.displayed;
			}
		};
		//#endregion
		//#region src/client/draft-attachments.ts
		/** 统一旧版图片草稿与 0.1.5 的通用附件草稿，保护已有附件不被历史召回覆盖。 */
		function hasDraftAttachments(state) {
			return (state.attachmentIds?.length ?? 0) > 0 || (state.imageIds?.length ?? 0) > 0;
		}
		//#endregion
		//#region src/client/input-history-keyboard.ts
		/** 只处理当前输入框的历史按键，保持 IME、菜单和富内容的原有行为。 */
		function bindHistoryKeys(editor, adapter) {
			const cursor = new HistoryCursor();
			let composing = false;
			let writingHistory = false;
			const begin = () => {
				composing = true;
			};
			const end = () => {
				composing = false;
			};
			const changed = () => {
				if (!writingHistory) cursor.reset();
			};
			const keydown = (event) => {
				if (event.target !== editor && !editor.contains(event.target)) return;
				if (event.defaultPrevented || composing || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || adapter.blocked()) return;
				if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
				const draft = adapter.draft();
				if (draft !== "" && !atHistoryBoundary(editor)) return;
				const next = cursor.move(event.key === "ArrowUp" ? -1 : 1, draft, adapter.entries());
				if (next === void 0) return;
				event.preventDefault();
				event.stopImmediatePropagation();
				writingHistory = true;
				try {
					adapter.setDraft(next);
				} finally {
					writingHistory = false;
				}
			};
			editor.addEventListener("compositionstart", begin);
			editor.addEventListener("compositionend", end);
			editor.addEventListener("input", changed);
			editor.addEventListener("keydown", keydown, true);
			return () => {
				editor.removeEventListener("compositionstart", begin);
				editor.removeEventListener("compositionend", end);
				editor.removeEventListener("input", changed);
				editor.removeEventListener("keydown", keydown, true);
			};
		}
		/** 召回文本中间或存在选区时，保留宿主编辑器的垂直光标移动。 */
		function atHistoryBoundary(editor) {
			if (editor instanceof HTMLTextAreaElement) return editor.selectionStart === editor.selectionEnd && (editor.selectionStart === 0 || editor.selectionEnd === editor.value.length);
			const selection = editor.ownerDocument.getSelection();
			if (!selection?.isCollapsed || !selection.rangeCount || !editor.contains(selection.anchorNode)) return false;
			const caret = selection.getRangeAt(0);
			const before = editor.ownerDocument.createRange();
			before.selectNodeContents(editor);
			before.setEnd(caret.startContainer, caret.startOffset);
			const after = editor.ownerDocument.createRange();
			after.selectNodeContents(editor);
			after.setStart(caret.endContainer, caret.endOffset);
			return before.toString() === "" || after.toString() === "";
		}
		/** 从本 slot 向上寻找唯一输入框，避免绑定侧栏、搜索或其他会话。 */
		function findComposer(anchor) {
			let parent = anchor.parentElement;
			while (parent && parent !== document.body) {
				const editors = parent.querySelectorAll("textarea:not([disabled]), [data-lexical-editor=\"true\"][contenteditable=\"true\"]");
				if (editors.length === 1) return editors[0];
				if (editors.length > 1) return void 0;
				parent = parent.parentElement;
			}
		}
		//#endregion
		//#region src/client/InputHistoryDock.tsx
		function InputHistoryHint({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: `
    [data-composer-card] [data-input-scroll]{container:dcu-composer-input / inline-size}
    [data-composer-card] [data-composer-placeholder]{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
    [data-composer-card] [data-composer-placeholder]::after{
      content:${JSON.stringify(t("input.historyHint"))};
      color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;
      white-space:nowrap;flex:0 0 auto;margin-right:8px;
    }
    @container dcu-composer-input (max-width:560px){
      [data-composer-card] [data-composer-placeholder]::after{display:none}
    }
    @media(max-width:640px){
      [data-composer-card] [data-composer-placeholder]::after{display:none}
    }
  ` });
		}
		/** 隐形输入扩展：使用宿主状态和编辑动作，不替换编辑器或创建旁问界面。 */
		function InputHistoryDock({ ctx, sessionId, history, seen }) {
			const anchor = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const binding = ctx.sessions.binding(sessionId);
				if (binding === void 0) return;
				const scope = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd ?? sessionId;
				const input = ctx.conversation.input.for(binding.ctx);
				const menu = ctx.inputTriggers.sessionOf(binding.ctx).menu;
				seen.set(binding, binding.eventSource.getSnapshot().revision);
				const collect = () => {
					const snapshot = binding.eventSource.getSnapshot();
					if (snapshot.change.kind !== "replace" && snapshot.revision <= (seen.get(binding) ?? -1)) return;
					seen.set(binding, snapshot.revision);
					if (snapshot.change.kind !== "append") return;
					for (const entry of snapshot.change.entries) {
						if (entry.event.type !== "user/message" || entry.event.data.source?.kind !== "user") continue;
						const text = entry.event.data.content.filter((block) => block.type === "text").map((block) => block.text).join("");
						history.add(scope, text);
					}
				};
				const offEvents = binding.eventSource.subscribe(collect);
				let previous = input.state.getSnapshot();
				const offInput = input.state.subscribe(() => {
					const next = input.state.getSnapshot();
					if (previous.phase === "submitting" && next.phase === "plain" && next.draft === "" && !hasDraftAttachments(previous) && previous.occurrences.length === 0) history.add(scope, previous.draft);
					previous = next;
				});
				let editor;
				let offKeys = () => {};
				const connect = () => {
					const next = anchor.current === null ? void 0 : findComposer(anchor.current);
					if (next === editor) return;
					offKeys();
					editor = next;
					if (editor === void 0) return;
					offKeys = bindHistoryKeys(editor, {
						draft: () => input.state.getSnapshot().draft,
						entries: () => history.list(scope),
						setDraft: (text) => input.setDraft(text),
						blocked: () => {
							const state = input.state.getSnapshot();
							return state.phase === "adjudicating" || state.phase === "submitting" || hasDraftAttachments(state) || state.occurrences.length > 0 || menu.getSnapshot().open;
						}
					});
				};
				connect();
				const parent = anchor.current?.parentElement?.parentElement;
				const observer = new MutationObserver(connect);
				if (parent !== null && parent !== void 0) observer.observe(parent, {
					childList: true,
					subtree: true
				});
				return () => {
					observer.disconnect();
					offKeys();
					offInput();
					offEvents();
				};
			}, [
				ctx,
				sessionId,
				history,
				seen
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				ref: anchor,
				hidden: true
			});
		}
		function registerInputHistory(ctx) {
			let storage;
			try {
				storage = window.localStorage;
			} catch {
				console.warn("[uncledylan-codex-ui] 浏览器存储不可用，使用内存输入历史。");
			}
			const history = new InputHistory(storage);
			const seen = /* @__PURE__ */ new WeakMap();
			function Dock(props) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InputHistoryDock, {
					ctx,
					sessionId: props.session.sessionId,
					history,
					seen
				});
			}
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "codex-ui-input-history",
				order: -100
			}, Dock));
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "codex-ui-input-history-hint",
				order: -100,
				locale: NS
			}, InputHistoryHint));
		}
		//#endregion
		//#region src/client/model-menu-card.ts
		/** 宿主 `MenuSurface` 的门户根：只有模型选择菜单带 `data-menu-material`。 */
		const SURFACE = "[data-menu-material]";
		const CELL = ":scope>[class*=\"_cell\"]";
		const CELL_LABEL = "[class*=\"_cellLabel\"]";
		const CELL_VALUE = "[class*=\"_cellValue\"]";
		/** 「推理等级」面板的行；模型列表的行在 `[class*="_groups"]` 里，不是面板直接子节点。 */
		const TIER_ROW = ":scope>[role=\"menuitemradio\"]";
		/** 菜单的触发按钮，用来关闭以及选择后重新打开菜单。 */
		const TRIGGER = "button[aria-haspopup=\"menu\"]";
		const MODEL_MENU_CARD_STYLE = `
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
`;
		const text = (node) => (node?.textContent ?? "").trim();
		/** 读根面板；只有「模型」格子（适配器没有推理元数据）时交还原生菜单。 */
		function readModelMenuCard(surface) {
			const cells = [...surface.querySelectorAll(CELL)];
			if (cells.length < 2) return void 0;
			const [modelCell, effortCell] = cells;
			const model = text(modelCell.querySelector(CELL_VALUE));
			const effort = text(effortCell.querySelector(CELL_VALUE));
			if (model === "" || effort === "" || modelCell.disabled || effortCell.disabled) return void 0;
			return {
				surface,
				modelCell,
				effortCell,
				model,
				effort,
				modelCaption: text(modelCell.querySelector(CELL_LABEL)),
				effortCaption: text(effortCell.querySelector(CELL_LABEL))
			};
		}
		function element(tag, className, content) {
			const node = document.createElement(tag);
			node.className = className;
			if (content !== void 0) node.textContent = content;
			return node;
		}
		const SVG = (className, body, width = 1.5) => `<svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
		/** 右上的关闭按钮；左侧那格只留空白，让强度文字压在卡片中线上。 */
		const CLOSE = SVG("", "<path d=\"M4.6 4.6 11.4 11.4M11.4 4.6 4.6 11.4\"/>", 1.4);
		const ARROW = SVG("dcu-model-card-arrow", "<path d=\"M6.4 3.6 10.6 8 6.4 12.4\"/>", 1.5);
		/** 逐帧等待某一帧条件成立，走完上限帧数仍不成立就交回 false。 */
		function waitFrames(test, frames, done, frame = 0) {
			if (test()) {
				done(true);
				return;
			}
			if (frame >= frames) {
				done(false);
				return;
			}
			window.requestAnimationFrame(() => {
				waitFrames(test, frames, done, frame + 1);
			});
		}
		/** 逐帧等待宿主渲染出「推理等级」面板，上限约 30 帧。 */
		function whenTiers(surface, done, frame = 0) {
			const rows = [...surface.querySelectorAll(TIER_ROW)];
			if (rows.length > 0 || frame > 30) {
				done(rows);
				return;
			}
			window.requestAnimationFrame(() => {
				whenTiers(surface, done, frame + 1);
			});
		}
		/**
		* 用宿主的键盘约定退回根面板：先试 Shift+Tab（与 Escape 等价，更少被全局快捷键吃掉），
		* 一帧后仍是下钻面板时改试 Escape；两者都失效就放弃，交给调用方恢复原生菜单。
		*/
		function backToRoot(surface, done) {
			const key = (init) => {
				(surface.querySelector(TIER_ROW) ?? surface).dispatchEvent(new KeyboardEvent("keydown", {
					bubbles: true,
					cancelable: true,
					...init
				}));
			};
			key({
				key: "Tab",
				shiftKey: true
			});
			window.requestAnimationFrame(() => {
				if (!surface.isConnected || surface.querySelector(CELL) === null) return done?.();
				key({ key: "Escape" });
				window.requestAnimationFrame(() => {
					if (surface.isConnected && surface.querySelector(CELL) === null) done?.();
				});
			});
		}
		/** 菜单的触发按钮：按 aria-controls 精确对上这个面板，避免误点别的菜单。 */
		function findTrigger(surface) {
			const buttons = [...document.querySelectorAll(TRIGGER)];
			if (surface.id !== "") {
				const exact = buttons.find((button) => button.getAttribute("aria-controls") === surface.id);
				if (exact !== void 0) return exact;
			}
			return buttons.find((button) => button.getAttribute("aria-expanded") === "true");
		}
		/** 模型名 -> 档位文字。宿主每个模型公布的档位极少变动，缓存后二次打开无需再探测。 */
		const TIER_CACHE = /* @__PURE__ */ new Map();
		/** 一段时间内重建的卡片不再播放入场动画：读档位、选完档位重开都不算新开一次。 */
		let quietUntil = 0;
		/** 观察宿主的模型菜单，把根面板换成 Codex 卡片；返回清理函数。 */
		function observeModelMenuCard(options = {}) {
			if (typeof document === "undefined" || typeof window === "undefined") return () => {};
			const closeLabel = options.close ?? "Close";
			const style = document.createElement("style");
			style.setAttribute("data-dcu-model-card-style", "");
			style.textContent = MODEL_MENU_CARD_STYLE;
			document.head.append(style);
			const states = /* @__PURE__ */ new WeakMap();
			let frame;
			let disposed = false;
			function stateOf(surface) {
				let state = states.get(surface);
				if (state === void 0) {
					state = {
						ticks: [],
						tiers: /* @__PURE__ */ new Map(),
						active: 0,
						host: 0,
						probing: false,
						committing: false,
						unsupported: false,
						external: false,
						busy: false,
						dragging: false,
						moved: false,
						ready: false
					};
					states.set(surface, state);
				}
				return state;
			}
			function teardown(surface, state) {
				if (state?.card?.isConnected === true) state.card.remove();
				if (state !== void 0) {
					state.card = void 0;
					state.name = void 0;
					state.effort = void 0;
					state.slider = void 0;
					state.rest = void 0;
					state.thumb = void 0;
					state.range = void 0;
					state.ticks = [];
					state.lostAt = void 0;
					state.ready = false;
				}
				surface.removeAttribute("data-dcu-model-card");
			}
			/** 按当前档位重画：强调色强度文字、滑轨填充比例、圆点明暗。`ratio` 供拖动预览传连续位置。 */
			function paint(state, card, tiers, index, ratio = tiers.length > 1 ? index / (tiers.length - 1) : 0) {
				const tier = tiers[index] ?? card.effort;
				state.active = index;
				if (state.effort !== void 0 && state.effort.textContent !== tier) {
					state.effort.textContent = tier;
					if (typeof state.effort.animate === "function") state.effort.animate([{
						opacity: 0,
						transform: "translateY(2px)"
					}, {
						opacity: 1,
						transform: "none"
					}], {
						duration: 160,
						easing: "cubic-bezier(.2,.8,.3,1)"
					});
				}
				state.card?.setAttribute("aria-label", `${card.model} · ${tier}`);
				state.card?.style.setProperty("--dcu-pos", String(ratio));
				state.card?.toggleAttribute("data-off", index === 0);
				state.card?.toggleAttribute("data-max", index === tiers.length - 1);
				if (state.range !== void 0) {
					state.range.max = String(Math.max(0, tiers.length - 1));
					if (!state.dragging) {
						state.range.value = String(index);
						state.range.setAttribute("aria-valuetext", tier);
					}
				}
				state.ticks.forEach((tick, at) => {
					tick.toggleAttribute("data-past", at <= index);
					tick.toggleAttribute("data-active", at === index);
				});
			}
			/**
			* 提交档位：仍点宿主的推理等级行，沿用它的回调与失败提示。
			* 宿主结算成功后会关掉菜单，这里等它卸载再把触发按钮点开，卡片看起来就没关过。
			*/
			function commit(surface, state, card, index) {
				const tiers = state.tiers.get(card.model);
				if (tiers === void 0 || state.committing) return;
				state.preview = index;
				paint(state, card, tiers, index);
				if (index === state.host) return;
				state.committing = true;
				const efforts = options.efforts;
				if (state.external && efforts !== void 0) {
					efforts.select(index).then((ok) => {
						state.committing = false;
						if (disposed) return;
						if (!ok) state.preview = void 0;
						schedule();
					});
					return;
				}
				const trigger = state.trigger ?? findTrigger(surface);
				state.trigger = trigger;
				(readModelMenuCard(surface) ?? card).effortCell.click();
				whenTiers(surface, (rows) => {
					rows[index]?.click();
					quietUntil = performance.now() + 800;
					waitFrames(() => document.querySelector(SURFACE) === null, 45, (closed) => {
						state.committing = false;
						if (disposed) return;
						if (closed) {
							trigger?.click();
							return;
						}
						if (!surface.isConnected) return;
						if (readModelMenuCard(surface) === void 0) backToRoot(surface);
						schedule();
					});
				});
			}
			/**
			* 画卡片。档位未知时只画头部（模型名 + 宿主当前强度），并留出滑轨的高度，
			* 读到档位后原地补上滑轨——高度不变，宿主的定位不用重算，也就不会闪。
			*/
			function build(surface, state, card, tiers, index) {
				const root = element("div", "dcu-model-card");
				root.setAttribute("role", "group");
				root.tabIndex = -1;
				if (performance.now() < quietUntil) root.setAttribute("data-quiet", "");
				const head = element("div", "dcu-model-card-head");
				const mark = element("span", "dcu-model-card-mark");
				mark.setAttribute("aria-hidden", "true");
				const effort = element("span", "dcu-model-card-effort", tiers?.[index] ?? card.effort);
				const close = element("button", "dcu-model-card-close");
				close.type = "button";
				close.setAttribute("aria-label", closeLabel);
				close.title = closeLabel;
				close.insertAdjacentHTML("beforeend", CLOSE);
				close.addEventListener("click", () => {
					const trigger = state.trigger ?? findTrigger(surface);
					if (trigger !== void 0) {
						trigger.click();
						return;
					}
					surface.dispatchEvent(new KeyboardEvent("keydown", {
						key: "Escape",
						bubbles: true,
						cancelable: true
					}));
				});
				head.append(mark, effort, close);
				const model = element("button", "dcu-model-card-model");
				model.type = "button";
				model.title = card.model;
				model.setAttribute("aria-label", `${card.modelCaption}: ${card.model}`);
				model.append(element("span", "dcu-model-card-name", card.model));
				model.insertAdjacentHTML("beforeend", ARROW);
				model.addEventListener("click", () => {
					state.trigger?.focus();
					const trigger = state.trigger;
					root.setAttribute("data-leaving", "");
					surface.setAttribute("data-dcu-pane-in", "");
					window.setTimeout(() => surface.removeAttribute("data-dcu-pane-in"), 600);
					window.setTimeout(() => {
						card.modelCell.click();
						window.requestAnimationFrame(() => teardown(surface, state));
						if (trigger !== void 0) watchSelection(trigger);
					}, 110);
				});
				const slider = element("div", "dcu-model-card-slider");
				slider.setAttribute("data-idle", "");
				state.slider = slider;
				state.rest = void 0;
				state.range = void 0;
				state.ticks = [];
				root.append(head, model, slider);
				state.card = root;
				state.name = model;
				state.effort = effort;
				state.ready = tiers !== void 0;
				state.host = index;
				state.trigger = findTrigger(surface) ?? state.trigger;
				surface.removeAttribute("data-dcu-tool-menu");
				for (const property of [
					"--dcu-tool-menu-x",
					"--dcu-tool-menu-y",
					"--dcu-tool-menu-height",
					"--dcu-tool-menu-shift"
				]) surface.style.removeProperty(property);
				surface.setAttribute("data-dcu-model-card", "");
				root.setAttribute("data-instant", "");
				surface.append(root);
				root.setAttribute("aria-label", `${card.model} · ${tiers?.[index] ?? card.effort}`);
				if (tiers === void 0) state.ready = false;
				else hydrate(surface, state, card, tiers, index);
				window.requestAnimationFrame(() => root.removeAttribute("data-instant"));
			}
			/**
			* 把轨道、刻度与透明 range 填进已有卡片。档位从无到有时只走这里，
			* 卡片元素本身不重建，所以不会出现「整块重画」的闪动。
			*/
			function hydrate(surface, state, card, tiers, index) {
				if (tiers.length < 2) {
					state.ready = false;
					return;
				}
				const root = state.card;
				const slider = state.slider;
				if (root === void 0 || slider === void 0) return;
				if (state.range === void 0) {
					const track = element("div", "dcu-model-card-track");
					const rest = element("div", "dcu-model-card-rest");
					const shine = element("div", "dcu-model-card-shine");
					shine.setAttribute("aria-hidden", "true");
					track.append(rest, shine);
					const range = element("input", "dcu-model-card-range");
					range.type = "range";
					range.min = "0";
					range.max = String(tiers.length - 1);
					range.step = "1";
					range.value = String(index);
					range.setAttribute("aria-label", card.effortCaption || card.model);
					let pressX = 0;
					let pressY = 0;
					/** 拖动跟手：把指针位置换算成连续的 --dcu-pos。原生 value 按 step 离散跳，
					*  若从这里取值滑块就会在档位之间瞬移；连续分数让滑块 1:1 贴住手指。 */
					const dragTo = (event) => {
						const box = track.getBoundingClientRect();
						const span = Math.max(1, box.width - 30);
						const ratio = Math.min(1, Math.max(0, (event.clientX - box.left - 15) / span));
						const at = Math.round(ratio * (tiers.length - 1));
						state.preview = at;
						paint(state, card, tiers, at, ratio);
					};
					const markMoved = (event) => {
						if (Math.hypot(event.clientX - pressX, event.clientY - pressY) > 3) {
							state.moved = true;
							dragTo(event);
						}
					};
					const stopDrag = () => {
						state.dragging = false;
						state.moved = false;
						state.preview = void 0;
						root.removeAttribute("data-dragging");
						window.removeEventListener("pointerup", stopDrag);
						window.removeEventListener("pointercancel", stopDrag);
						window.removeEventListener("pointermove", markMoved);
					};
					range.addEventListener("change", () => {
						const at = Number(range.value);
						state.preview = void 0;
						stopDrag();
						paint(state, card, tiers, at);
						commit(surface, state, card, at);
					});
					range.addEventListener("pointerdown", (event) => {
						event.stopPropagation();
						pressX = event.clientX;
						pressY = event.clientY;
						state.dragging = true;
						state.moved = false;
						root.setAttribute("data-dragging", "");
						window.addEventListener("pointerup", stopDrag);
						window.addEventListener("pointercancel", stopDrag);
						window.addEventListener("pointermove", markMoved);
					});
					range.addEventListener("blur", stopDrag);
					range.addEventListener("keydown", (event) => {
						if (event.key === "ArrowUp" || event.key === "ArrowDown") event.stopPropagation();
					});
					const thumb = element("div", "dcu-model-card-thumb");
					slider.append(track, range, thumb);
					state.ticks = tiers.map((label, at) => {
						const dot = element("span", "dcu-model-card-dot");
						dot.style.setProperty("--dcu-pos", String(at / (tiers.length - 1)));
						dot.setAttribute("aria-hidden", "true");
						dot.title = label;
						slider.append(dot);
						return dot;
					});
					state.range = range;
					state.rest = rest;
					state.thumb = thumb;
				}
				slider.removeAttribute("data-idle");
				state.ready = true;
				root.setAttribute("data-instant", "");
				paint(state, card, tiers, index);
				window.requestAnimationFrame(() => root.removeAttribute("data-instant"));
			}
			/**
			* 下钻模型列表后盯住触发按钮：宿主选中模型会关掉菜单并把新模型写回 title，
			* title 一变就说明选完了，把菜单重新点开，卡片留在原位。
			* 手动关闭（Escape、点外面）不会改 title，菜单就真的关掉。
			*/
			function watchSelection(trigger) {
				const before = trigger.title;
				let timer;
				const stop = () => {
					observer.disconnect();
					if (timer !== void 0) window.clearTimeout(timer);
				};
				const observer = new MutationObserver(() => {
					if (disposed || trigger.title === before) return;
					stop();
					quietUntil = performance.now() + 800;
					waitFrames(() => document.querySelector(SURFACE) === null, 45, (closed) => {
						if (!closed || disposed || !trigger.isConnected) return;
						trigger.click();
					});
				});
				observer.observe(trigger, {
					attributes: true,
					attributeFilter: ["title"]
				});
				timer = window.setTimeout(stop, 6e4);
			}
			function render(surface, state, card) {
				const external = options.efforts?.read();
				const externalTiers = external !== void 0 && external.levels.length > 0 ? external.levels.map((level) => level.label) : void 0;
				const tiers = externalTiers ?? state.tiers.get(card.model) ?? TIER_CACHE.get(card.model);
				state.external = externalTiers !== void 0;
				state.busy = external?.busy === true;
				if (tiers !== void 0) state.tiers.set(card.model, tiers);
				if (tiers === void 0) {
					if (state.card?.isConnected !== true) build(surface, state, card, void 0, 0);
					if (!state.probing && !state.unsupported) probe(surface, state, card);
					return;
				}
				const found = externalTiers === void 0 ? tiers.indexOf(card.effort) : external.index;
				const host = found >= 0 ? found : Math.min(state.active, Math.max(0, tiers.length - 1));
				state.host = host;
				if (state.preview === host) state.preview = void 0;
				const index = state.preview ?? host;
				if (state.card?.isConnected === true) {
					if (state.ready && !(state.dragging && state.moved)) paint(state, card, tiers, index);
					else if (!state.ready) hydrate(surface, state, card, tiers, index);
					return;
				}
				build(surface, state, card, tiers, index);
			}
			/** 借宿主自己的推理等级面板读一次档位；期间仍由卡片占位，读完退回根面板。 */
			function probe(surface, state, card) {
				state.probing = true;
				card.effortCell.click();
				whenTiers(surface, (rows) => {
					if (rows.length === 0 || !surface.isConnected) {
						state.probing = false;
						state.unsupported = true;
						teardown(surface, state);
						return;
					}
					const named = rows.filter((row) => text(row.querySelector("[class*=\"_modelName\"]") ?? row) !== "Default");
					state.tiers.set(card.model, named.map((row) => text(row.querySelector("[class*=\"_modelName\"]") ?? row)));
					TIER_CACHE.set(card.model, state.tiers.get(card.model));
					state.active = Math.max(0, named.findIndex((row) => row.getAttribute("aria-checked") === "true"));
					quietUntil = performance.now() + 800;
					backToRoot(surface, () => {
						state.probing = false;
						schedule();
					});
					window.setTimeout(() => {
						if (!state.probing) return;
						state.probing = false;
						if (surface.isConnected && readModelMenuCard(surface) === void 0) teardown(surface, state);
						schedule();
					}, 1200);
				});
			}
			function sync() {
				frame = void 0;
				if (disposed) return;
				for (const surface of document.querySelectorAll(SURFACE)) {
					const state = states.get(surface);
					if (state?.probing === true || state?.committing === true) continue;
					const card = readModelMenuCard(surface);
					if (card !== void 0) {
						if (state?.unsupported === true) {
							teardown(surface, state);
							continue;
						}
						if (state !== void 0) state.lostAt = void 0;
						render(surface, state ?? stateOf(surface), card);
						continue;
					}
					if (state !== void 0) {
						if (state.lostAt === void 0) {
							state.lostAt = performance.now();
							window.setTimeout(schedule, 160);
						}
						if (performance.now() - state.lostAt >= 150) teardown(surface, state);
					}
				}
			}
			function schedule() {
				if (disposed || frame !== void 0) return;
				frame = window.requestAnimationFrame(sync);
			}
			const observer = new MutationObserver(schedule);
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true
			});
			schedule();
			return () => {
				disposed = true;
				style.remove();
				if (frame !== void 0) window.cancelAnimationFrame(frame);
				observer.disconnect();
				for (const surface of document.querySelectorAll(SURFACE)) {
					surface.removeAttribute("data-dcu-pane-in");
					const state = states.get(surface);
					if (state !== void 0) teardown(surface, state);
				}
			};
		}
		//#endregion
		//#region src/client/model-effort-bridge.ts
		/**
		* 模型公布的具名档位。宿主菜单在模型没有配置默认档位时会在最前面插一行「Default」，
		* 但那不是档位——它表示「不发送推理参数，用提供方自己的默认」，对声明了 off（不填
		* 参数值）的手配模型来说和 off 是同一个请求，铺出来只会是一格模糊不清的重复项。
		* 滑轨只铺具名档位，与默认档位的语义留给「当前生效值落在哪个具名档位」来表达。
		*/
		function levelsOf(reasoning) {
			if (reasoning === void 0) return [];
			return (reasoning.efforts ?? []).map((level) => ({
				id: level.id,
				label: level.name
			}));
		}
		/**
		* @param service 按名字取客户端服务（通常是 `ctx.get`）。
		* @param session 当前会话 id；菜单属于当前会话，档位也按它会话取。
		*/
		function createModelEffortBridge(service, session) {
			const directory = () => {
				const directories = service("modelDirectories");
				const id = session();
				if (directories === void 0 || id === void 0 || typeof directories.directoryFor !== "function") return void 0;
				try {
					return directories.directoryFor(id);
				} catch {
					return;
				}
			};
			const view = () => {
				const state = directory()?.store.getSnapshot();
				const current = state?.current;
				if (state === void 0 || current === void 0 || current === null) return void 0;
				return {
					model: state.groups?.find((group) => group.id === current.provider)?.models.find((entry) => entry.id === current.model),
					current,
					state
				};
			};
			return {
				read() {
					const found = view();
					if (found === void 0) return void 0;
					const { model, current, state } = found;
					const reasoning = model?.reasoning;
					const busy = state.pending !== void 0 && state.pending !== null;
					const levels = levelsOf(reasoning);
					const effective = current.reasoningEffort ?? reasoning?.defaultEffort;
					const at = levels.findIndex((level) => level.id === effective);
					return {
						levels,
						index: at < 0 ? 0 : at,
						busy
					};
				},
				async select(index) {
					const found = view();
					if (found === void 0) return false;
					const { model, current } = found;
					const ids = levelsOf(model?.reasoning).map((level) => level.id);
					const target = directory();
					if (target === void 0) return false;
					const effort = ids[index];
					try {
						return (await target.select({
							provider: current.provider,
							model: current.model,
							...effort === void 0 ? {} : { reasoningEffort: effort }
						}))?.ok === true;
					} catch {
						return false;
					}
				}
			};
		}
		//#endregion
		//#region src/client/running-orb.ts
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
		const WHALE_ICON = "[data-chat-running] span[aria-hidden=\"true\"]>svg";
		const ORB_MARK = "data-dcu-running-orb";
		const RUNNING_ORB_STYLE = `
[${ORB_MARK}]{position:relative;width:20px!important;height:20px!important}
[${ORB_MARK}]>:not(canvas){visibility:hidden}
[${ORB_MARK}]>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
`;
		const TAU = Math.PI * 2;
		/**
		* 网格密度按盒子大小取：宿主图标盒默认 14px，我们放大到 20px——行高 22px 装得下，
		* 再大就要挤压布局了。14px 时代 7×7 每颗点不足 1 设备像素，糊成一片；20px 配 5×5
		* 每颗点能拿到 ~4 设备像素，点阵才读得清。大盒子（预览/未来宿主放大）仍用 7×7。
		*/
		const DENSE_GRID = 7;
		const SMALL_GRID = 5;
		const ORBITERS = [
			{
				radius: .62,
				speed: 2.2,
				phase: 0,
				spread: .42
			},
			{
				radius: .4,
				speed: -1.7,
				phase: 2.1,
				spread: .36
			},
			{
				radius: .8,
				speed: 1.15,
				phase: 4,
				spread: .34
			}
		];
		/** thinking 态的热度场：三个轨道热点的高斯和，铺底 0.26 保证球体轮廓还在。 */
		function heatOf(nx, ny, t) {
			let heat = 0;
			for (const orbiter of ORBITERS) {
				const angle = t * orbiter.speed + orbiter.phase;
				const dx = nx - Math.cos(angle) * orbiter.radius;
				const dy = ny - Math.sin(angle) * orbiter.radius;
				heat += Math.exp(-(dx * dx + dy * dy) / (orbiter.spread * orbiter.spread));
			}
			return .26 + .8 * Math.min(1, heat);
		}
		function createOrb(canvas, box) {
			const size = box.clientWidth || 14;
			const dpr = Math.min(4, Math.max(2, window.devicePixelRatio || 1));
			const buffer = Math.round(size * dpr);
			const ctx = canvas.getContext("2d");
			if (buffer <= 0 || ctx === null) return void 0;
			canvas.width = canvas.height = buffer;
			ctx.scale(buffer / size, buffer / size);
			const grid = size >= 32 ? DENSE_GRID : SMALL_GRID;
			const spacing = size * .74 / (grid - 1);
			const half = (grid - 1) / 2;
			const maxRadius = spacing * .6;
			const center = size / 2;
			const dots = [];
			for (let iy = 0; iy < grid; iy++) for (let ix = 0; ix < grid; ix++) {
				const nx = (ix - half) / half;
				const ny = (iy - half) / half;
				const distance = Math.hypot(nx, ny);
				if (distance > 1.12) continue;
				dots.push({
					x: center + (ix - half) * spacing,
					y: center + (iy - half) * spacing,
					nx,
					ny,
					distance
				});
			}
			return {
				canvas,
				ctx,
				dots,
				maxRadius,
				dpr,
				color: "",
				colorAt: 0
			};
		}
		function drawOrb(orb, t, now) {
			if (now - orb.colorAt > 1e3) {
				orb.colorAt = now;
				orb.color = getComputedStyle(orb.canvas).color;
			}
			const ctx = orb.ctx;
			const size = orb.canvas.width / orb.dpr;
			ctx.clearRect(0, 0, size, size);
			ctx.fillStyle = orb.color;
			for (const dot of orb.dots) {
				const intensity = Math.min(1, Math.max(0, heatOf(dot.nx, dot.ny, t)));
				const radius = orb.maxRadius * Math.exp(-dot.distance * dot.distance * 1.7) * intensity;
				if (radius * orb.dpr < .5) continue;
				ctx.beginPath();
				ctx.arc(dot.x, dot.y, radius, 0, TAU);
				ctx.fill();
			}
		}
		function observeRunningOrb(doc = document) {
			if (typeof document === "undefined" || typeof window === "undefined") return () => {};
			const style = doc.createElement("style");
			style.setAttribute("data-dcu-running-orb-style", "");
			style.textContent = RUNNING_ORB_STYLE;
			doc.head.append(style);
			const orbs = [];
			let raf;
			let timer;
			let t = 0;
			let last = performance.now();
			const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			function prune() {
				for (let at = orbs.length - 1; at >= 0; at--) if (!orbs[at].canvas.isConnected) orbs.splice(at, 1);
			}
			function tick(now) {
				raf = void 0;
				const dt = Math.min((now - last) / 1e3, .05);
				last = now;
				t += dt;
				prune();
				for (const orb of orbs) drawOrb(orb, t, now);
				if (orbs.length > 0) raf = window.requestAnimationFrame(tick);
			}
			function ensureLoop() {
				if (reduced || raf !== void 0 || orbs.length === 0) return;
				last = performance.now();
				raf = window.requestAnimationFrame(tick);
			}
			const scan = () => {
				timer = void 0;
				for (const svg of doc.querySelectorAll(WHALE_ICON)) {
					const box = svg.parentElement;
					if (box === null || box.hasAttribute(ORB_MARK)) continue;
					box.setAttribute(ORB_MARK, "");
					const canvas = doc.createElement("canvas");
					box.append(canvas);
					const orb = createOrb(canvas, box);
					if (orb === void 0) {
						canvas.remove();
						box.removeAttribute(ORB_MARK);
						continue;
					}
					orbs.push(orb);
					if (reduced) drawOrb(orb, 0, performance.now());
				}
				ensureLoop();
			};
			/** 打标走 setTimeout 而不是 rAF：标签页不可见时 rAF 会被整个冻结，状态行会一直等着不打标。 */
			const schedule = () => {
				if (timer !== void 0) return;
				timer = window.setTimeout(scan, 0);
			};
			/** 只有状态行附近的变化才值得扫一遍；流式输出的消息节点在这里被过滤掉。 */
			function touchesRunning(records) {
				for (const record of records) {
					const element = record.target instanceof Element ? record.target : record.target.parentElement;
					if (element === null) continue;
					if (element.closest("[data-chat-running]") !== null) return true;
					if (record.addedNodes.length === 0) continue;
					for (const node of record.addedNodes) if (node instanceof Element && (node.matches("[data-chat-running]") || node.querySelector("[data-chat-running]") !== null)) return true;
				}
				return false;
			}
			const observer = new MutationObserver((records) => {
				if (touchesRunning(records)) schedule();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true
			});
			schedule();
			return () => {
				observer.disconnect();
				if (timer !== void 0) window.clearTimeout(timer);
				if (raf !== void 0) window.cancelAnimationFrame(raf);
				timer = raf = void 0;
				style.remove();
				for (const box of doc.querySelectorAll(`[${ORB_MARK}]`)) {
					box.removeAttribute(ORB_MARK);
					box.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
				}
				orbs.length = 0;
			};
		}
		//#endregion
		//#region src/client/chat-scrollbar.ts
		/**
		* 把会话滚动条的「长条」钉到窗口最右缘。
		*
		* 会话区的滚动容器（`[data-conversation-scroll]`）右缘会被右侧停靠面板挤进窗口
		* 中部，原生 5px 滚动条跟着骑在那个边上，看起来悬在半空。原生滚动条离不开自己
		* 的容器，所以这里把原生条藏掉，渲染一条自己的轨：fixed 定位钉在视口右缘，滑块
		* 几何每帧从滚动容器实测，拖动、点按轨道、滚轮都写回容器的 scrollTop——容器照
		* 常滚动，只是长条换了位置。
		*
		* 容器可能随会话切换销毁重建，观察器按 official-turn-navigator 的模式做全量扫描
		* + 过滤；滑块几何走 scroll 事件和 ResizeObserver，不跑常驻动画循环。
		*/
		const SCROLL_ROOT = "[data-conversation-scroll]";
		const RAIL_MARK = "data-dcu-chat-rail";
		const CHAT_SCROLLBAR_STYLE = `
${SCROLL_ROOT}{scrollbar-width:none}
${SCROLL_ROOT}::-webkit-scrollbar{width:0;height:0}
[data-dcu-chat-scrollbar]{scrollbar-width:none}
[data-dcu-chat-scrollbar]::-webkit-scrollbar{width:0;height:0}
[data-conversation-region="chat"][data-dcu-center-comp]{padding-left:var(--dcu-center-comp-width,14px)!important;transition:padding-left var(--ds-transition-duration-slow,200ms) var(--ds-ease-in-out,ease)}
[${RAIL_MARK}]{position:fixed;z-index:30;right:0;width:14px;box-sizing:border-box;padding:2px 0;pointer-events:auto;touch-action:none}
[${RAIL_MARK}][data-overflow=false]{display:none}
[${RAIL_MARK}]::-webkit-scrollbar{display:none}
[${RAIL_MARK}] .dcu-chat-rail-thumb{position:absolute;right:3px;width:5px;border-radius:3px;background:var(--dsh-scrollbar-thumb,var(--dsw-alias-scrollbar-bg-l1));min-height:40px}
[${RAIL_MARK}]:hover .dcu-chat-rail-thumb,[${RAIL_MARK}] .dcu-chat-rail-thumb[data-dragging=true]{background:var(--dsh-scrollbar-thumb-hover,var(--dsw-alias-scrollbar-hover-l1))}
`;
		function verticallyScrollable(el) {
			const overflow = getComputedStyle(el).overflowY;
			return (overflow === "auto" || overflow === "scroll") && el.scrollHeight - el.clientHeight > 1;
		}
		/**
		* 真正承载会话滚动的元素：通常是容器本身，但宿主可能把滚动交给更内层（ChatView 的
		* 滚动层）——那条内层原生条才是用户拖着走的长条。从消息锚点向上找最近的可滚祖先。
		*/
		function transcriptScroller(root) {
			const anchor = root.querySelector("[data-chat-anchor-key]");
			let element = anchor instanceof Element ? anchor.parentElement : null;
			while (element !== null && element !== void 0 && element !== root && root.contains(element)) {
				if (element instanceof HTMLElement && verticallyScrollable(element)) return element;
				element = element.parentElement;
			}
			return root;
		}
		function observeChatScrollbar(doc = document, label = "会话滚动条") {
			if (typeof document === "undefined" || typeof window === "undefined") return () => {};
			const style = doc.createElement("style");
			style.setAttribute("data-dcu-chat-scrollbar-style", "");
			style.textContent = CHAT_SCROLLBAR_STYLE;
			doc.head.append(style);
			const rails = /* @__PURE__ */ new Map();
			/** 每个会话区已写入的居中补偿量：值没变不重复写样式。 */
			const appliedComp = /* @__PURE__ */ new WeakMap();
			let scanFrame;
			let paintFrame;
			const geometry = (rail) => {
				const scroller = rail.scroller;
				if (!scroller.isConnected) return void 0;
				const box = scroller.getBoundingClientRect();
				if (box.height <= 0) return void 0;
				const span = scroller.scrollHeight - scroller.clientHeight;
				const overflow = span > 1;
				const track = box.height - 4;
				const thumbHeight = overflow ? Math.max(40, Math.round(scroller.clientHeight / scroller.scrollHeight * track)) : 0;
				const progress = span > 0 ? scroller.scrollTop / span : 0;
				return {
					overflow,
					thumbTop: Math.round(progress * (track - thumbHeight)),
					thumbHeight,
					top: Math.round(box.top),
					height: Math.round(box.height)
				};
			};
			const paint = () => {
				paintFrame = void 0;
				for (const rail of rails.values()) {
					const state = geometry(rail);
					if (state === void 0) continue;
					rail.rail.dataset.overflow = String(state.overflow);
					rail.rail.style.top = `${state.top}px`;
					rail.rail.style.height = `${state.height}px`;
					rail.thumb.style.height = `${state.thumbHeight}px`;
					rail.thumb.style.transform = `translateY(${state.thumbTop}px)`;
					const span = rail.scroller.scrollHeight - rail.scroller.clientHeight;
					rail.rail.setAttribute("aria-valuenow", String(span > 0 ? Math.round(rail.scroller.scrollTop / span * 100) : 0));
				}
				syncCenterComp();
			};
			const schedulePaint = () => {
				if (paintFrame !== void 0) return;
				paintFrame = window.requestAnimationFrame(paint);
			};
			const scrollToFraction = (rail, clientY) => {
				const box = rail.rail.getBoundingClientRect();
				const track = box.height - 4;
				const span = rail.scroller.scrollHeight - rail.scroller.clientHeight;
				if (span <= 0 || track <= 0) return;
				const thumbHeight = Math.max(40, rail.scroller.clientHeight / rail.scroller.scrollHeight * track);
				const y = Math.min(Math.max(clientY - box.top - 2 - thumbHeight / 2, 0), track - thumbHeight);
				rail.scroller.scrollTop = y / (track - thumbHeight) * span;
			};
			const bindRail = (rail) => {
				rail.thumb.addEventListener("pointerdown", (event) => {
					const span = rail.scroller.scrollHeight - rail.scroller.clientHeight;
					rail.drag = {
						pointerId: event.pointerId,
						pointerY: event.clientY,
						scrollTop: rail.scroller.scrollTop,
						span
					};
					rail.thumb.dataset.dragging = "true";
					try {
						rail.thumb.setPointerCapture(event.pointerId);
					} catch {}
					event.preventDefault();
				});
				rail.thumb.addEventListener("pointermove", (event) => {
					if (rail.drag === null || event.pointerId !== rail.drag.pointerId) return;
					const track = rail.rail.getBoundingClientRect().height - 4;
					const grip = track - Math.max(40, rail.scroller.clientHeight / rail.scroller.scrollHeight * track);
					if (grip <= 0 || rail.drag.span <= 0) return;
					rail.scroller.scrollTop = rail.drag.scrollTop + (event.clientY - rail.drag.pointerY) / grip * rail.drag.span;
				});
				const release = (event) => {
					if (rail.drag === null || event.pointerId !== rail.drag.pointerId) return;
					rail.drag = null;
					delete rail.thumb.dataset.dragging;
					try {
						rail.thumb.releasePointerCapture(event.pointerId);
					} catch {}
				};
				rail.thumb.addEventListener("pointerup", release);
				rail.thumb.addEventListener("pointercancel", release);
				rail.rail.addEventListener("pointerdown", (event) => {
					if (event.target !== rail.rail) return;
					scrollToFraction(rail, event.clientY);
				});
				rail.rail.addEventListener("wheel", (event) => {
					event.preventDefault();
					rail.scroller.scrollBy({ top: event.deltaY });
				}, { passive: false });
				rail.scroller.addEventListener("scroll", schedulePaint, { passive: true });
			};
			const scan = () => {
				scanFrame = void 0;
				for (const root of doc.querySelectorAll(SCROLL_ROOT)) {
					const scroller = transcriptScroller(root);
					if (rails.has(scroller)) continue;
					const rail = doc.createElement("div");
					rail.className = "dcu-chat-rail";
					rail.setAttribute(RAIL_MARK, "");
					rail.setAttribute("role", "scrollbar");
					rail.setAttribute("aria-orientation", "vertical");
					rail.setAttribute("aria-label", label);
					if (scroller.id !== "") rail.setAttribute("aria-controls", scroller.id);
					const thumb = doc.createElement("div");
					thumb.className = "dcu-chat-rail-thumb";
					rail.append(thumb);
					doc.body.append(rail);
					const entry = {
						scroller,
						rail,
						thumb,
						drag: null
					};
					rails.set(scroller, entry);
					bindRail(entry);
					const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(schedulePaint);
					observer?.observe(scroller);
					for (const child of scroller.children) observer?.observe(child);
					scroller.setAttribute("data-dcu-chat-scrollbar", "");
				}
				prune();
				syncCenterComp();
				schedulePaint();
			};
			/**
			* 居中补偿：右侧停靠面板推开会话区后，容器右缘到面板之间隔着滚动条槽与面板边距，
			* 对话列中心偏左。补偿量不写死——用消息锚点的包盒实测对话列的真实左右缘，量出
			* 「右缝 − 左缝」作为 padding-left（列中心恰好右移差值的一半，两缝相等）。
			*
			* 测量只在「未补偿」状态下做一次：补偿一半进左缝、一半进右缝，带着过渡边测量边
			* 施加会自激振荡（200ms 过渡就是控制延迟）。baseDiff 是布局结构常量（滚动条槽 +
			* 面板边距），不随列宽、滚动、流式输出变化，量一次就够；面板收起时撤掉，重开重测。
			*/
			function syncCenterComp() {
				for (const scroller of rails.keys()) {
					const region = scroller.closest("[data-conversation-region=\"chat\"]");
					if (region === null) continue;
					const regionBox = region.getBoundingClientRect();
					if (!(regionBox.right < window.innerWidth - 40)) {
						if (appliedComp.get(region) !== 0) {
							appliedComp.set(region, 0);
							region.removeAttribute("data-dcu-center-comp");
							region.style.removeProperty("--dcu-center-comp-width");
						}
						continue;
					}
					if (region.hasAttribute("data-dcu-center-comp")) continue;
					let left = Number.POSITIVE_INFINITY;
					let right = Number.NEGATIVE_INFINITY;
					for (const anchor of region.querySelectorAll("[data-chat-anchor-key]")) {
						const box = anchor.getBoundingClientRect();
						if (box.width <= 0) continue;
						left = Math.min(left, box.left);
						right = Math.max(right, box.right);
					}
					if (!Number.isFinite(left) || right <= left) continue;
					const panel = doc.querySelector("[data-sidebar-right-panel]");
					const panelBox = panel instanceof HTMLElement ? panel.getBoundingClientRect() : null;
					const boundary = panelBox !== null && panelBox.left > regionBox.left + 40 && panelBox.left < window.innerWidth - 40 ? panelBox.left : window.innerWidth;
					const diff = Math.round(boundary - right - (left - regionBox.left));
					const compensation = diff > 4 ? Math.min(diff + 2, 62) : 0;
					appliedComp.set(region, compensation);
					if (compensation > 0) {
						region.setAttribute("data-dcu-center-comp", "");
						region.style.setProperty("--dcu-center-comp-width", `${compensation}px`);
					}
				}
			}
			function prune() {
				for (const [scroller, rail] of [...rails]) {
					if (scroller.isConnected) continue;
					rail.rail.remove();
					rails.delete(scroller);
				}
			}
			const scheduleScan = () => {
				if (scanFrame !== void 0) return;
				scanFrame = window.setTimeout(scan, 0);
			};
			/** 只有会话滚动容器附近的变化才值得重扫；流式输出的消息节点在容器内，不会触发重建。 */
			function touchesScroller(records) {
				for (const record of records) {
					const element = record.target instanceof Element ? record.target : record.target.parentElement;
					if (element === null) continue;
					if (element.closest(SCROLL_ROOT) !== null) continue;
					if (record.addedNodes.length === 0) continue;
					for (const node of record.addedNodes) if (node instanceof Element && (node.matches(SCROLL_ROOT) || node.querySelector(SCROLL_ROOT) !== null)) return true;
				}
				return false;
			}
			const observer = new MutationObserver((records) => {
				if (touchesScroller(records)) scheduleScan();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true
			});
			window.addEventListener("resize", schedulePaint);
			scan();
			return () => {
				observer.disconnect();
				if (scanFrame !== void 0) window.clearTimeout(scanFrame);
				if (paintFrame !== void 0) window.cancelAnimationFrame(paintFrame);
				scanFrame = paintFrame = void 0;
				window.removeEventListener("resize", schedulePaint);
				style.remove();
				for (const [scroller, rail] of rails) {
					rail.rail.remove();
					scroller.removeAttribute("data-dcu-chat-scrollbar");
				}
				for (const region of doc.querySelectorAll("[data-dcu-center-comp]")) region.removeAttribute("data-dcu-center-comp");
				rails.clear();
			};
		}
		//#endregion
		//#region src/client/archive-session-delete.ts
		/** 永久删除会话由归档管理插件通过 remote.workspaceRegistry.deleteSession 提供。 */
		function hasArchiveSessionDelete(value) {
			return value !== null && typeof value === "object" && typeof value.deleteSession === "function";
		}
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"sessions",
			"workspaces",
			"layout",
			"locale",
			"connection",
			"inputTriggers",
			"conversation"
		];
		function hasDeleteSession(value) {
			return hasArchiveSessionDelete(value);
		}
		async function runHostAction(action, execute) {
			try {
				return await execute();
			} catch (reason) {
				if (reason instanceof UserFacingError || reason instanceof HostActionError) throw reason;
				throw new HostActionError(action, reason);
			}
		}
		/** Archive Manager replaces the official ui-workspace row with this optional service. */
		async function startWorkspaceSession(ctx, workspaceId) {
			const uiWorkspace = probeService(ctx, "uiWorkspace");
			try {
				if (hasStartSession(uiWorkspace)) {
					await Promise.resolve(uiWorkspace.startSession(workspaceId));
					return true;
				}
				if (hasStartSession(ctx.workspaces)) {
					await Promise.resolve(ctx.workspaces.startSession(workspaceId));
					return true;
				}
				console.warn("DSH 工作空间服务尚未就绪，无法新建会话。");
				return false;
			} catch (error) {
				console.warn("新建会话失败：", error);
				return false;
			}
		}
		/** 替换 DSH 的官方 sidebar 插槽，不修改 DSH 源码或会话数据。 */
		function apply(ctx) {
			Object.assign(globalThis, { __dcuCurrentSessionId: currentSessionId });
			document.documentElement.dataset.dcuVersion = "1.2.0";
			const widthStorage = browserStorage();
			if (widthStorage) initializeComposerWidth(widthStorage);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "uncledylan-codex-ui: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.effect(() => observeHeroWidthHandles(t("home.resizeInput")), "uncledylan-codex-ui: hero width handles");
			registerInputHistory(ctx);
			const usePanelInfo = (selector) => {
				const panelInfo = ctx.layout.panelInfo;
				return (0, react.useSyncExternalStore)(panelInfo.subscribe, () => selector(panelInfo.getSnapshot()));
			};
			const navigationHistory = createNavigationHistory(ctx.sessions.list, (id) => openConversation(ctx, ctx.layout, id));
			ctx.effect(() => () => {
				navigationHistory.dispose();
			}, "uncledylan-codex-ui: navigation history");
			registerSettingsPage(ctx, navigationHistory);
			registerPluginConfigSection(ctx);
			const connection = ctx.get("connection");
			const openPath = (path) => openPathInHost(connection, path);
			ctx.effect(() => observeSlimSidebar(), "uncledylan-codex-ui: slim sidebar");
			ctx.effect(() => observeSettingsNavIcons(), "uncledylan-codex-ui: settings nav icons");
			ctx.effect(() => observeComposerToolMenus({
				search: t("home.projectSearch"),
				empty: t("home.projectEmpty")
			}), "uncledylan-codex-ui: composer tool menus");
			const readService = (name) => probeService(ctx, name);
			const modelEfforts = createModelEffortBridge(readService, () => currentSessionId(ctx.sessions.list.getSnapshot()));
			ctx.effect(() => observeModelMenuCard({
				close: t("sessions.close"),
				efforts: modelEfforts
			}), "uncledylan-codex-ui: model menu card");
			ctx.effect(() => observeFullAccessAccent(), "uncledylan-codex-ui: full access accent");
			ctx.effect(() => observeRunningOrb(), "uncledylan-codex-ui: running orb");
			ctx.effect(() => observeChatScrollbar(document, t("scrollbar.label")), "uncledylan-codex-ui: chat scrollbar");
			ctx.effect(() => observeConversationHeader(), "uncledylan-codex-ui: conversation header");
			ctx.effect(() => observeHostTablerIcons(), "uncledylan-codex-ui: host tabler icons");
			ctx.effect(() => observeOfficialTurnNavigators(), "uncledylan-codex-ui: official turn navigator");
			ctx.effect(() => observeActivityCard({
				labels: {
					region: t("activity.region"),
					changes: t("activity.changes"),
					outputs: t("activity.outputs"),
					sources: t("activity.sources"),
					viewChanges: t("activity.viewChanges"),
					viewAll: t("activity.viewAll"),
					collapse: t("activity.collapse"),
					close: t("activity.close"),
					countFiles: (count) => t("activity.countFiles", { count }),
					countSources: (count) => t("activity.countSources", { count })
				},
				session: () => currentSessionId(ctx.sessions.list.getSnapshot())
			}), "uncledylan-codex-ui: activity card");
			const companionSlots = createCompanionTabSource(ctx.slots);
			const globalPanels = createGlobalPanelSource(ctx.slots, ctx.locale);
			const footerActions = createFooterActionSource(ctx.slots);
			const workspaceShortcuts = createWorkspaceShortcutSource(ctx.slots);
			ctx.effect(() => () => {
				workspaceShortcuts.dispose();
			}, "uncledylan-codex-ui: workspace shortcuts");
			registerWorkspaceDirectoryFlow(ctx);
			const ownSidebarChildren = {
				[WORKSPACE_DIRECTORY_FLOW]: {
					kind: "single",
					scope: "root"
				},
				"sidebar.channels": {
					kind: "single",
					scope: "root"
				},
				"sidebar.schedule": {
					kind: "single",
					scope: "root"
				}
			};
			const sharedSidebarChildren = {
				"sidebar.panellist": {
					kind: "list",
					scope: "root"
				},
				"sidebar.workspaces": {
					kind: "single",
					scope: "root"
				},
				"sidebar.settings": {
					kind: "single",
					scope: "root"
				},
				"sidebar.footer.action": {
					kind: "list",
					scope: "root"
				}
			};
			const sidebarSlotAliases = {
				"sidebar.panellist": "sidebar.codex.panellist",
				"sidebar.workspaces": "sidebar.codex.workspaces",
				"sidebar.schedule": "sidebar.codex.schedule",
				"sidebar.settings": "sidebar.codex.settings",
				"sidebar.footer.action": "sidebar.codex.footer.action"
			};
			const sidebarAliasChildren = {
				"sidebar.codex.panellist": {
					kind: "list",
					scope: "root"
				},
				"sidebar.codex.workspaces": {
					kind: "single",
					scope: "root"
				},
				"sidebar.codex.schedule": {
					kind: "single",
					scope: "root"
				},
				"sidebar.codex.settings": {
					kind: "single",
					scope: "root"
				},
				"sidebar.codex.footer.action": {
					kind: "list",
					scope: "root"
				}
			};
			const aliasedSidebar = withSlotAliases(CodexSidebar, sidebarSlotAliases);
			const officialSidebarReady = () => ctx.slots.spec?.("sidebar.workspaces") !== void 0;
			ctx.slots.inject("sidebar", () => registerAfterOfficialWave(ctx.slots, "sidebar", officialSidebarReady, (timedOut = false) => {
				const declared = (name) => {
					const spec = ctx.slots.spec;
					return typeof spec === "function" && spec.call(ctx.slots, name) !== void 0;
				};
				const allSidebarChildren = {
					...sharedSidebarChildren,
					...ownSidebarChildren,
					...sidebarAliasChildren
				};
				const children = {};
				const candidates = timedOut ? {
					...ownSidebarChildren,
					...sidebarAliasChildren
				} : allSidebarChildren;
				for (const [name, spec] of Object.entries(candidates)) if (!declared(name)) Object.assign(children, { [name]: spec });
				const register = (next) => {
					try {
						const unregister = ctx.slots.register({
							name: "sidebar",
							priority: -1,
							registrant: "uncledylan-codex-ui",
							locale: NS,
							children: next,
							inject: () => ({
								navigationHistory,
								workspaceShortcuts,
								openSession: (sessionId) => openConversation(ctx, ctx.layout, sessionId),
								startSession: (workspaceId) => {
									startWorkspaceSession(ctx, workspaceId);
								},
								toggleSidebar: () => {
									ctx.layout.toggleSidebar();
								},
								archiveSession,
								canDeleteSession: () => hasArchiveSessionDelete(ctx.get("remote.workspaceRegistry")),
								deleteSession,
								forkSession,
								moveSession,
								renameSession,
								openPath,
								companionSlots,
								globalPanels,
								footerActions,
								selectPanel: (id) => {
									selectGlobalPanel(ctx.layout, id);
								},
								usePanelInfo
							})
						}, aliasedSidebar);
						const mirrors = [];
						try {
							for (const [source, target] of Object.entries(sidebarSlotAliases)) if (typeof ctx.slots.spec === "function") mirrors.push(ctx.slots.inject(source, () => mirrorSlot({ slots: ctx.slots }, source, target)));
						} catch (error) {
							for (const dispose of mirrors.reverse()) dispose();
							unregister();
							throw error;
						}
						return () => {
							for (const dispose of mirrors.reverse()) dispose();
							unregister();
						};
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						const conflict = /slot "([^"]+)" is already declared/.exec(message);
						const conflictKey = conflict === null ? void 0 : Object.keys(next).find((key) => key === conflict[1]);
						if (conflictKey === void 0 || next[conflictKey] === void 0) throw error;
						const rest = { ...next };
						delete rest[conflictKey];
						return register(rest);
					}
				};
				return register(children);
			}, true));
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "turn-navigator",
				order: 100,
				locale: NS
			}, TurnNavigator));
			const openStudioWorkbench = () => {
				if (readService("sidebarRightTabs")?.get?.("dsh-image-gen/studio") === void 0) return false;
				const sidebarRight = readService("sidebarRight");
				if (typeof sidebarRight?.openTab !== "function") return false;
				try {
					sidebarRight.openTab(STUDIO_SIDEBAR_TAB_ID);
					return true;
				} catch (error) {
					console.warn("打开图像工作台失败：", error);
					return false;
				}
			};
			const workbenchAvailable = () => {
				return readService("sidebarRightTabs")?.get?.(STUDIO_SIDEBAR_TAB_ID) !== void 0;
			};
			isImageStudioAvailable().then((available) => {
				if (!available) return;
				try {
					ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
						name: "sidebar.panellist",
						id: IMAGE_STUDIO_PANEL_ID,
						order: 0,
						locale: NS,
						label: () => t("sidebar.imageStudio")
					}, RailPhotoIcon));
					ctx.slots.inject("main", () => ctx.slots.register({
						name: "main",
						key: IMAGE_STUDIO_PANEL_ID,
						locale: NS,
						inject: () => ({
							openStudioWorkbench,
							workbenchAvailable
						})
					}, ImageStudioPanel));
				} catch (error) {
					console.warn("生图模式注册失败：", error);
				}
			});
			const forkSession = async (sessionId) => {
				await runHostAction("fork", () => forkHostSession(ctx, sessionId));
			};
			const renameSession = async (sessionId, title) => {
				await runHostAction("rename", async () => {
					try {
						await renameHostSession(ctx, sessionId, title);
					} catch (reason) {
						if (reason instanceof UnknownSessionError) throw new UserFacingError(t("sessions.unknown"));
						throw reason;
					}
				});
			};
			const deleteSession = async (sessionId) => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (!hasDeleteSession(registry)) throw new UserFacingError(t("sessions.deleteUnavailable"));
				await runHostAction("delete", async () => {
					const result = await registry.deleteSession(sessionId);
					if (!result.ok) throw result.error === void 0 ? new UserFacingError(t("sessions.deleteUnavailable")) : result.error;
				});
			};
			const archiveSession = (sessionId) => runHostAction("archive", () => archiveHostSession(ctx, sessionId));
			const moveSession = async (sessionId, targetWorkspaceId) => {
				try {
					await requestSessionMove(sessionId, targetWorkspaceId);
				} catch (error) {
					if (!(error instanceof SessionMoveRequestError)) throw error;
					throw new UserFacingError(t(sessionMoveErrorKey(error.code)));
				}
				finishSessionMove({
					sessionId,
					currentUrl: window.location.href,
					navigate: (url) => {
						window.location.replace(url);
					}
				});
			};
			const startConnectorPromptSession = async (promptText) => {
				const prompt = promptText.trim();
				if (prompt === "") throw new UserFacingError(t("connectors.promptRequired"));
				const workspaces = ctx.workspaces.list.getSnapshot();
				const sessionSnapshot = ctx.sessions.list.getSnapshot();
				const selectedSessionId = currentSessionId(sessionSnapshot);
				const currentWorkspaceId = selectedSessionId === void 0 ? void 0 : workspaces.items.find((workspace) => workspace.sessionIds.includes(selectedSessionId))?.workspaceId;
				const baselinesReady = workspaceBaselinesReady(workspaces, sessionSnapshot);
				const targetWorkspaceId = currentWorkspaceId ?? (baselinesReady ? recentWorkspaceId(workspaces.items, sessionSnapshot.byId) : void 0);
				if (targetWorkspaceId === void 0 && !baselinesReady) throw new UserFacingError(t("connectors.workspacesLoading"));
				if (targetWorkspaceId === void 0) throw new UserFacingError(t("connectors.workspaceRequired"));
				const uiWorkspace = probeService(ctx, "uiWorkspace");
				const conversation = ctx.get("conversation");
				if (conversation === void 0) throw new UserFacingError(t("connectors.conversationUnavailable"));
				try {
					if (hasOpenWorkspace(uiWorkspace)) {
						await Promise.resolve(uiWorkspace.openWorkspace(targetWorkspaceId, (id) => {
							const binding = ctx.sessions.binding(id);
							if (binding?.ctx === void 0) throw new UnknownSessionError();
							conversation.input.for(binding.ctx).setDraft(prompt);
						}));
						selectGlobalPanel(ctx.layout, null);
						return;
					}
					const workspaceNavigation = hasConnectWorkspace(uiWorkspace) ? uiWorkspace : hasConnectWorkspace(ctx.workspaces) ? ctx.workspaces : void 0;
					if (workspaceNavigation === void 0) throw new UserFacingError(t("connectors.workspaceUnavailable"));
					const sessionId = await workspaceNavigation.connectWorkspace(targetWorkspaceId);
					await openConversationWithDraft(ctx, ctx.layout, ctx.sessions, sessionId, (binding) => {
						if (binding.ctx === void 0) throw new UnknownSessionError();
						conversation.input.for(binding.ctx).setDraft(prompt);
					});
				} catch (reason) {
					if (reason instanceof UnknownSessionError) throw new UserFacingError(t("connectors.sessionPending"));
					throw reason;
				}
			};
			ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
				name: "sidebar.workspaces",
				priority: -1,
				locale: NS,
				inject: () => ({
					archiveSession,
					canDeleteSession: () => hasArchiveSessionDelete(ctx.get("remote.workspaceRegistry")),
					deleteSession,
					deleteWorkspace: (workspaceId) => ctx.workspaces.delete(workspaceId),
					forkSession,
					moveSession,
					openPath,
					openSession: (sessionId) => openConversation(ctx, ctx.layout, sessionId),
					renameSession,
					renameWorkspace: (workspaceId, title) => ctx.workspaces.rename(workspaceId, title),
					insertWorkspaceBefore: (workspaceId, beforeWorkspaceId) => ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId),
					insertSessionBefore: (workspaceId, sessionId, beforeSessionId) => ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId),
					startSession: (workspaceId) => {
						startWorkspaceSession(ctx, workspaceId);
					},
					workspaceShortcuts
				})
			}, CodexWorkspaceBrowser));
			ctx.effect(() => {
				if (typeof window === "undefined") return () => {};
				const sessionId = new URL(window.location.href).searchParams.get("session");
				if (sessionId === null || sessionId === "") return () => {};
				const cleanSessionDeepLink = () => {
					try {
						const currentUrl = new URL(window.location.href);
						currentUrl.searchParams.delete("session");
						window.history.replaceState(null, "", currentUrl.pathname + currentUrl.search + currentUrl.hash);
					} catch {}
				};
				let opened = false;
				const openDeepLink = () => {
					if (opened) return;
					const decision = deepLinkAction(ctx.sessions.list.getSnapshot().byId, isSessionArchived(ctx, sessionId), sessionId);
					if (decision === "wait") return;
					opened = true;
					if (decision === "clean") {
						cleanSessionDeepLink();
						return;
					}
					if (!openConversation(ctx, ctx.layout, sessionId)) cleanSessionDeepLink();
				};
				openDeepLink();
				return ctx.sessions.list.subscribe(openDeepLink);
			}, "uncledylan-codex-ui: session deep link");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "connectors",
				order: 30,
				label: () => t("sidebar.connectors"),
				icon: "connector",
				inject: () => ({
					sessionStore: ctx.sessions.list,
					startPromptSession: startConnectorPromptSession,
					t
				})
			}, ConnectorsSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "about",
				order: Number.MAX_SAFE_INTEGER,
				label: () => t("about.nav"),
				locale: NS
			}, AboutSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.startWorkspaceSession = startWorkspaceSession;
		return module.exports;
	}
});
