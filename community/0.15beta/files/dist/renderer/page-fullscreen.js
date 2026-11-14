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
    video:fullscreen{object-fit:contain !important;background:#000}
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
    if (el && el.tagName === "VIDEO") {
      el.style.objectFit = "contain";
      el.style.background = "#000";
    }
  });
})();
