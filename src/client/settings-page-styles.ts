/** Codex 设置页的局部 tokens 与布局，不覆盖宿主其他弹窗。 */
export const settingsPageStyles = `
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
`
