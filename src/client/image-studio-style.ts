/** 生图模式面板样式；宿主无全局 box-sizing 重置，这里显式声明。 */
export const IMAGE_STUDIO_STYLE = `
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
`
