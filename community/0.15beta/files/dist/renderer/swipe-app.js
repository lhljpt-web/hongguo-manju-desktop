// 红果漫剧 · 刷剧模式（独立窗口 Demo）
(function () {
  const CATS = ["推荐", "言情", "古装", "甜宠", "悬疑", "逆袭", "全部"];
  const state = { category: "推荐", items: [], offset: 0, loading: false, pref: true, autoNext: true, history: null };
  const unwrap = (r) => r && typeof r === "object" && "ok" in r ? (r.ok ? r.data : null) : r;

  const css = document.createElement("style");
  css.textContent = `
  html,body{margin:0;height:100%;background:#000;overflow:hidden}
  body{font-family:system-ui;color:#fff}
  #top{position:fixed;z-index:5;left:0;right:0;top:0;padding:12px 64px 12px 12px;display:flex;gap:8px;flex-wrap:wrap;background:linear-gradient(180deg,rgba(0,0,0,.7),transparent)}
  #top button{border:0;border-radius:16px;padding:7px 13px;background:rgba(255,255,255,.14);color:#fff;font:500 13px system-ui;cursor:pointer;backdrop-filter:blur(6px)}
  #top button.on{background:#ff5f57;font-weight:700}
  #close{position:fixed;right:12px;top:10px;z-index:6;border:0;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:700 18px system-ui;cursor:pointer}
  #gear{position:fixed;right:58px;top:10px;z-index:6;border:0;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:600 16px system-ui;cursor:pointer}
  #slides{height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none}
  #slides::-webkit-scrollbar{display:none}
  .hg-slide{position:relative;height:100vh;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;background:#000;overflow:hidden}
  .hg-slide video{width:100%;height:100%;object-fit:contain;background:#000}
  .hg-slide .cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.5)}
  .hg-slide .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 30%,transparent 55%,rgba(0,0,0,.82))}
  .hg-slide .meta{position:absolute;left:18px;right:88px;bottom:28px;z-index:3}
  .hg-slide .meta h3{margin:0 0 6px;font:700 20px/1.3 system-ui;text-shadow:0 2px 10px rgba(0,0,0,.6)}
  .hg-slide .meta p{margin:0;font:400 13px/1.5 system-ui;opacity:.85;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .hg-slide .meta .ep{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:12px;background:rgba(255,95,87,.9);font:600 12px system-ui}
  .hg-rail{position:absolute;right:14px;bottom:120px;z-index:4;display:flex;flex-direction:column;gap:14px;align-items:center}
  .hg-rail button{border:0;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font:500 11px/1.15 system-ui;cursor:pointer;backdrop-filter:blur(8px)}
  .hg-rail button.on{background:#ff5f57}
  .hg-slide .status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:500 14px system-ui;opacity:.9;text-align:center;z-index:2;max-width:80%}
  .hg-slide .bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.18);z-index:4}
  .hg-slide .bar i{display:block;height:100%;width:0;background:#ff5f57}
  #settings{position:fixed;inset:0;z-index:10001;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6)}
  #settings.open{display:flex}
  #settings .panel{width:min(420px,86vw);background:#1b1b1f;border-radius:16px;padding:22px;color:#fff;font:14px/1.6 system-ui;box-shadow:0 20px 60px rgba(0,0,0,.5)}
  #settings h4{margin:0 0 14px;font-size:17px}
  #settings .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}
  #settings .row:last-of-type{border-bottom:0}
  #settings .btns{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}
  #settings .btns button{border:0;border-radius:10px;padding:9px 16px;font:600 13px system-ui;cursor:pointer;background:rgba(255,255,255,.14);color:#fff}
  #settings .btns .primary{background:#ff5f57}
  `;
  document.head.appendChild(css);

  const $ = (tag, attrs, kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "style") n.style.cssText = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    for (const c of kids || []) n.appendChild(c);
    return n;
  };

  const top = $("div", { id: "top" });
  const chips = {};
  for (const c of CATS) {
    const b = $("button", { text: c });
    if (c === state.category) b.classList.add("on");
    b.onclick = () => {
      state.category = c;
      Object.values(chips).forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      reloadFeed();
    };
    chips[c] = b;
    top.appendChild(b);
  }
  const gear = $("button", { id: "gear", text: "⚙" });
  const close = $("button", { id: "close", text: "×" });
  close.onclick = () => window.close();
  const slides = $("div", { id: "slides" });
  document.body.appendChild(top);
  document.body.appendChild(gear);
  document.body.appendChild(close);
  document.body.appendChild(slides);

  const settings = $("div", { id: "settings" });
  const panel = $("div", { class: "panel" });
  panel.appendChild($("h4", { text: "刷剧设置（Demo）" }));
  const recoRow = $("div", { class: "row" });
  recoRow.appendChild($("span", { text: "个性化推荐（按观看与收藏题材加权）" }));
  const recoToggle = $("input", { type: "checkbox" });
  recoToggle.onchange = async () => {
    state.pref = recoToggle.checked;
    try { await window.desktop.swipePrefs({ recommend: recoToggle.checked }); } catch {}
    reloadFeed();
  };
  recoRow.appendChild(recoToggle);
  const autoRow = $("div", { class: "row" });
  autoRow.appendChild($("span", { text: "连续播放（报错 30 秒自动下一集）" }));
  const autoToggle = $("input", { type: "checkbox" });
  autoToggle.onchange = async () => {
    state.autoNext = autoToggle.checked;
    try { await window.desktop.swipePrefs({ autoNext: autoToggle.checked }); } catch {}
  };
  autoRow.appendChild(autoToggle);
  const btns = $("div", { class: "btns" });
  const refreshBtn = $("button", { text: "刷新推荐" });
  refreshBtn.onclick = () => reloadFeed();
  const doneBtn = $("button", { class: "primary", text: "完成" });
  doneBtn.onclick = () => settings.classList.remove("open");
  btns.appendChild(refreshBtn);
  btns.appendChild(doneBtn);
  panel.appendChild(recoRow);
  panel.appendChild(autoRow);
  panel.appendChild(btns);
  settings.appendChild(panel);
  document.body.appendChild(settings);
  gear.onclick = () => settings.classList.toggle("open");

  async function loadPrefs() {
    try {
      const prefs = unwrap(await window.desktop.swipePrefs());
      state.pref = !prefs || prefs.recommend !== false;
      state.autoNext = !prefs || prefs.autoNext !== false;
      recoToggle.checked = state.pref;
      autoToggle.checked = state.autoNext;
    } catch {}
  }

  async function reloadFeed() {
    if (state.loading) return;
    state.loading = true;
    slides.innerHTML = "";
    state.items = [];
    try {
      const res = unwrap(await window.desktop.swipeFeed(state.category, true));
      state.items = res?.items || [];
      state.offset = res?.nextOffset || state.items.length;
      if (!state.items.length) slides.appendChild($("div", { class: "hg-slide" }, [$("div", { class: "status", text: "这个分类暂时没有可播放的漫剧，换个分类试试" })]));
      for (let i = 0; i < state.items.length; i++) slides.appendChild(buildSlide(i));
    } catch (e) {
      slides.appendChild($("div", { class: "hg-slide" }, [$("div", { class: "status", text: "推荐加载失败：" + (e && e.message || e) })]));
    } finally {
      state.loading = false;
    }
  }

  function buildSlide(index) {
    const item = state.items[index];
    const slide = $("article", { class: "hg-slide" });
    slide.dataset.series = item.id;
    if (item.cover) slide.appendChild($("img", { class: "cover", src: item.cover, alt: "" }));
    slide.appendChild($("div", { class: "shade" }));
    const status = $("div", { class: "status", text: "上滑看下一部" });
    const video = $("video", { playsinline: "", preload: "none" });
    const bar = $("div", { class: "bar" }, [$("i")]);
    const meta = $("div", { class: "meta" });
    const ep = $("span", { class: "ep", text: "加载中" });
    const h3 = $("h3", { text: item.title || "" });
    const p = $("p", { text: item.description || "" });
    meta.appendChild(ep); meta.appendChild(h3); meta.appendChild(p);
    const rail = $("div", { class: "hg-rail" });
    const fav = $("button", { text: "收藏" });
    const cacheBtn = $("button", { text: "缓存" });
    const nextBtn = $("button", { text: "下一集" });
    rail.appendChild(fav); rail.appendChild(cacheBtn); rail.appendChild(nextBtn);
    slide.appendChild(status); slide.appendChild(video); slide.appendChild(bar); slide.appendChild(meta); slide.appendChild(rail);
    slide.__hg = { item, video, status, bar, ep, index, prepared: false, series: null, episodes: null, ei: 0, work: item, error: false };
    fav.onclick = async () => {
      try { await window.desktop.favorite(item, !fav.classList.contains("on")); fav.classList.toggle("on"); } catch {}
    };
    cacheBtn.onclick = async () => {
      try { await window.desktop.cacheAdd(item.id); cacheBtn.textContent = "已加入缓存"; } catch { cacheBtn.textContent = "缓存失败"; }
    };
    nextBtn.onclick = () => nextEpisode(slide);
    video.addEventListener("timeupdate", () => {
      const d = video.duration || 0;
      if (d > 0) slide.__hg.bar.firstChild.style.width = Math.min(100, video.currentTime / d * 100) + "%";
    });
    video.addEventListener("ended", () => nextEpisode(slide));
    video.addEventListener("error", () => failSlide(slide, "视频播放出错"));
    video.addEventListener("click", () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
    return slide;
  }

  function activeSlide() {
    return [...slides.querySelectorAll(".hg-slide")].find((s) => {
      const r = s.getBoundingClientRect();
      return r.top > -window.innerHeight * 0.4 && r.top < window.innerHeight * 0.4;
    });
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const slide = entry.target;
      if (!slide.__hg) continue;
      if (entry.intersectionRatio >= 0.6) prepareSlide(slide);
      else if (slide.__hg.video && !slide.__hg.video.paused) slide.__hg.video.pause();
    }
  }, { threshold: [0, 0.6, 1] });

  const mo = new MutationObserver(() => {
    slides.querySelectorAll(".hg-slide").forEach((s) => { if (!s.__hgObserved) { s.__hgObserved = true; observer.observe(s); } });
  });
  mo.observe(slides, { childList: true });

  async function prepareSlide(slide) {
    const s = slide.__hg;
    if (!s) return;
    if (s.prepared) {
      if (s.error) { s.error = false; s.prepared = false; }
      else { if (s.video) s.video.play().catch(() => {}); return; }
    }
    s.prepared = true;
    s.error = false;
    s.status.textContent = "正在获取片源…";
    try {
      if (!state.history) state.history = unwrap(await window.desktop.library().catch(() => null));
      const series = unwrap(await window.desktop.series(s.item.id));
      s.series = series;
      s.episodes = series.episodes || [];
      if (!s.episodes.length) throw new Error("该作品暂无分集");
      s.work = { id: series.id, title: series.title, cover: series.cover, description: series.description, total: series.total, ...(series.categories ? { categories: series.categories } : {}) };
      let start = 0;
      const his = (state.history?.history || []).find((h) => h.seriesId === series.id);
      if (his) {
        const idx = s.episodes.findIndex((e) => e.id === his.episodeId);
        if (idx >= 0) start = idx;
      }
      s.ei = start;
      await playEpisode(s);
    } catch (e) {
      failSlide(slide, "加载失败：" + (e && e.message || e));
    }
  }

  function failSlide(slide, message) {
    const s = slide.__hg;
    if (!s) return;
    s.error = true;
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
    if (s.countdown) { clearInterval(s.countdown); s.countdown = null; }
    if (!state.autoNext) {
      s.status.textContent = message + "（连续播放已关闭，可下滑换一部）";
      return;
    }
    let left = 30;
    s.status.textContent = message + " · " + left + " 秒后下一集";
    s.countdown = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(s.countdown);
        s.countdown = null;
        s.error = false;
        s.prepared = false;
        nextEpisode(slide);
      } else s.status.textContent = message + " · " + left + " 秒后下一集";
    }, 1000);
  }

  async function playEpisode(s) {
    const episode = s.episodes[s.ei];
    if (!episode) return;
    s.status.textContent = "正在准备第 " + episode.order + " 集…";
    s.ep.textContent = "第 " + episode.order + " 集";
    const res = unwrap(await window.desktop.playback(episode.id, false, "auto"));
    if (!res || !res.url) throw new Error("片源为空");
    s.video.src = res.url;
    s.video.muted = false;
    s.current = { episode, duration: res.duration || 0 };
    s.status.textContent = "";
    try { await s.video.play(); } catch { s.video.muted = true; await s.video.play().catch(() => { s.status.textContent = "点击画面开始播放"; }); }
    const ids = s.episodes.slice(s.ei, s.ei + 4).map((e) => e.id);
    window.desktop.bufferEpisodes(ids).catch(() => {});
    if (s.timer) clearInterval(s.timer);
    s.timer = setInterval(() => {
      const v = s.video;
      if (!v || v.paused) return;
      const progress = { seriesId: s.series.id, episodeId: episode.id, order: episode.order, time: v.currentTime, duration: v.duration || s.current?.duration || 0, work: s.work };
      if (progress.duration > 0) window.desktop.progress(progress).catch(() => {});
    }, 5000);
  }

  function nextEpisode(slide) {
    const s = slide.__hg;
    if (!s || !s.episodes) {
      const next = slide.nextElementSibling;
      if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (s.ei < s.episodes.length - 1) {
      s.ei += 1;
      playEpisode(s).catch((e) => failSlide(slide, "下一集失败：" + (e && e.message || e)));
      return;
    }
    const next = slide.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.close();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const list = [...slides.querySelectorAll(".hg-slide")];
      const i = list.indexOf(activeSlide());
      const target = list[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  loadPrefs().then(reloadFeed);
})();
