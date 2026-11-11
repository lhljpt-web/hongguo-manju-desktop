// 主窗口看门狗：播放报错时按「连续播放」开关，30 秒后自动点下一集
(function () {
  if (window.__hgWatchdog) return;
  window.__hgWatchdog = true;
  const KEYWORDS = ["视频处理未完成", "播放遇到了一点问题", "本集播放资源返回空结果", "播放资源暂不可用", "此分集没有当前播放器支持"];
  let lastTrigger = 0, banner = null, countdown = null;

  const css = document.createElement("style");
  css.textContent = `
  #hg-wd-banner{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:100000;display:none;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:rgba(24,24,28,.94);color:#fff;font:500 13px system-ui;box-shadow:0 12px 34px rgba(0,0,0,.35)}
  #hg-wd-banner.on{display:flex}
  #hg-wd-banner button{border:0;border-radius:8px;padding:6px 10px;background:#ff5f57;color:#fff;font:600 12px system-ui;cursor:pointer}
  #hg-wd-banner .ghost{background:rgba(255,255,255,.16)}
  `;
  document.head.appendChild(css);
  const bar = document.createElement("div");
  bar.id = "hg-wd-banner";
  const text = document.createElement("span");
  const goBtn = document.createElement("button");
  goBtn.textContent = "立即下一集";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "取消";
  cancelBtn.className = "ghost";
  bar.appendChild(text); bar.appendChild(goBtn); bar.appendChild(cancelBtn);
  document.body.appendChild(bar);

  function hide() {
    bar.classList.remove("on");
    if (countdown) { clearInterval(countdown); countdown = null; }
  }
  function nextButton() {
    const list = [...document.querySelectorAll('button[aria-label="下一集"], button[title="下一集"]')];
    return list.find((b) => !b.disabled) || null;
  }
  function jump() {
    const btn = nextButton();
    if (btn) btn.click();
    hide();
  }
  async function autoEnabled() {
    try {
      const prefs = await window.desktop.swipePrefs();
      return !prefs || prefs.autoNext !== false;
    } catch { return true; }
  }
  async function trigger(message) {
    const now = Date.now();
    if (now - lastTrigger < 45000) return;
    lastTrigger = now;
    if (!(await autoEnabled())) return;
    let left = 30;
    text.textContent = (message || "播放出错") + " · " + left + " 秒后自动下一集";
    bar.classList.add("on");
    if (countdown) clearInterval(countdown);
    countdown = setInterval(() => {
      left -= 1;
      if (left <= 0) { jump(); return; }
      text.textContent = (message || "播放出错") + " · " + left + " 秒后自动下一集";
    }, 1000);
  }
  goBtn.onclick = jump;
  cancelBtn.onclick = hide;

  let scanTimer = null;
  function scan() {
    if (scanTimer) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      const body = document.body && document.body.innerText || "";
      const hit = KEYWORDS.find((k) => body.includes(k));
      if (hit) trigger(hit);
    }, 600);
  }
  const mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  document.addEventListener("error", (event) => {
    const el = event.target;
    if (el && el.tagName === "VIDEO") trigger("视频播放出错");
  }, true);

  document.addEventListener("stalled", (event) => {
    const el = event.target;
    if (el && el.tagName === "VIDEO") trigger("视频加载中断");
  }, true);

  try {
    const probe = document.createElement("video");
    const hevc = !!(probe.canPlayType('video/mp4; codecs="hvc1.1.6.L120.90"') || probe.canPlayType('video/mp4; codecs="hev1.1.6.L120.90"'));
    window.desktop.capabilities({ hevc }).catch(() => {});
  } catch {
  }
})();
