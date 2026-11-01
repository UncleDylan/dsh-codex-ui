/** 新建页底部输入布局；保留宿主节点、插槽与 active 会话底部信息。 */
export const NEW_CONVERSATION_STYLE = `
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
`
