// 页面全屏按钮 + 全屏视频按竖屏完整显示
(function () {
  if (window.__hgPageFullscreen) return;
  window.__hgPageFullscreen = true;

  const style = document.createElement("style");
  style.textContent = `
    .hg-fullscreen-btn{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:6px;
      padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(20,20,24,.72);
      color:#fff;font:600 12px/1 system-ui;cursor:pointer;backdrop-filter:blur(6px);opacity:.75;transition:opacity .2s}
    .hg-fullscreen-btn:hover{opacity:1}
    video:fullscreen{object-fit:contain;background:#000}
    .player-surface:fullscreen,.player-surface:-webkit-full-screen{background:#000;display:flex;align-items:center;justify-content:center}
    .player-surface:fullscreen video,.player-surface:-webkit-full-screen video{width:100%;height:100%;max-width:100%;max-height:100%}
    /* 竖屏全屏：控制栏防溢出 */
    @media (max-aspect-ratio: 1/1) {
      .player-surface:fullscreen .control-row{flex-wrap:nowrap;gap:6px;padding-left:8px;padding-right:8px}
      .player-surface:fullscreen .control-row .definition-label{display:none}
      .player-surface:fullscreen .control-row .pip-button{display:none}
      .player-surface:fullscreen .control-row .quality-select{max-width:118px}
      .player-surface:fullscreen .control-row .speed-select{max-width:74px}
      .player-surface:fullscreen .control-row .volume-controls input[type=range]{width:54px}
      .player-surface:fullscreen .control-row .time-label{font-size:12px}
      .player-surface:fullscreen .fullscreen-cache,.player-surface:fullscreen .fullscreen-sleep{max-width:92%;font-size:11px}
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "hg-fullscreen-btn";
  btn.type = "button";
  btn.textContent = "⛶ 页面全屏";
  btn.addEventListener("click", async () => {
    try {
      const on = await window.desktop.hgFullscreen();
      btn.textContent = on ? "⛶ 退出全屏" : "⛶ 页面全屏";
    } catch {
    }
  });
  const mount = () => (document.body ? document.body.appendChild(btn) : setTimeout(mount, 300));
  mount();

  document.addEventListener("fullscreenchange", () => {
    const el = document.fullscreenElement;
    if (el) {
      const fit = localStorage.getItem("hg-video-fit") || "contain";
      el.querySelectorAll("video").forEach((v) => {
        v.style.objectFit = fit;
        v.style.background = "#000";
      });
      setTimeout(() => {
        const row = document.querySelector(".player-surface .control-row");
        if (row) {
          const kids = [...row.children].map((c) => (c.className || c.tagName) + ":" + Math.round(c.getBoundingClientRect().width)).join(", ");
          try { window.desktop.hgLog("fs " + innerWidth + "x" + innerHeight + " row=" + row.clientWidth + "/" + row.scrollWidth + " [" + kids + "]"); } catch {}
        }
      }, 700);
    }
  });

  // 全屏时双击切换：完整显示(contain) / 铺满裁切(cover)
  document.addEventListener("dblclick", (event) => {
    if (!document.fullscreenElement) return;
    const video = document.querySelector("video");
    if (!video) return;
    const next = (localStorage.getItem("hg-video-fit") || "contain") === "contain" ? "cover" : "contain";
    localStorage.setItem("hg-video-fit", next);
    video.style.objectFit = next;
    event.preventDefault();
  }, true);
})();
