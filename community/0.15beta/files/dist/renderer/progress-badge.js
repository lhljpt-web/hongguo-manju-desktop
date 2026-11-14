// 在「共 N 集」旁边追加「看到第 X 集」
(function () {
  if (window.__hgProgressBadge) return;
  window.__hgProgressBadge = true;
  let history = null, historyAt = 0, timer = null;

  const norm = (s) => String(s || "").replace(/\s+/g, "").trim();
  const unwrap = (r) => r && typeof r === "object" && "ok" in r ? (r.ok ? r.data : null) : r;

  async function loadHistory(force) {
    if (!force && history && Date.now() - historyAt < 8000) return history;
    try {
      const lib = unwrap(await window.desktop.library());
      history = Array.isArray(lib?.history) ? lib.history : [];
      historyAt = Date.now();
    } catch {
      history = history || [];
    }
    return history;
  }

  const PROP_KEYS = ["item", "work", "data", "series", "record", "workItem", "entry", "value", "poster"];
  function pickWork(obj) {
    if (!obj || typeof obj !== "object") return null;
    for (const key of PROP_KEYS) {
      const value = obj[key];
      if (value && typeof value === "object" && value.id != null && (value.title || value.name || value.total != null)) return value;
    }
    for (const key of Object.keys(obj)) {
      if (key === "children" || key === "work" || key === "item") continue;
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value) && value.id != null && (value.title || value.name) && (value.total != null || value.cover || value.poster)) return value;
    }
    return null;
  }
  function workOfCard(card) {
    let node = card;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      for (const key of Object.keys(node)) {
        try {
          if (key.startsWith("__reactProps$")) {
            const hit = pickWork(node[key]);
            if (hit) return hit;
          } else if (key.startsWith("__reactFiber$")) {
            let fiber = node[key];
            for (let up = 0; fiber && up < 5; up++, fiber = fiber.return) {
              const hit = pickWork(fiber.memoizedProps);
              if (hit) return hit;
            }
          }
        } catch {
        }
      }
    }
    return null;
  }

  function annotate(target) {
    if (!target || target.dataset.hgProg) return;
    const text = (target.textContent || "").trim();
    if (!/(\d+\s*集|漫剧)/.test(text)) return;
    let order = 0, matchedId = "";
    const card = target.closest(".work-card") || target;
    const badgeTotal = Number((text.match(/\d+/) || [])[0] || 0);
    const work = workOfCard(card);
    if (work && work.id != null) {
      const hit = (history || []).find((h) => String(h.seriesId) === String(work.id));
      if (hit) {
        const expect = Number(hit?.work?.total || 0);
        if (!badgeTotal || !expect || expect === badgeTotal) {
          order = Number(hit.order) || 0;
          matchedId = String(work.id);
        } else {
          matchedId = "mismatch:" + work.id;
        }
      } else {
        matchedId = "nohist:" + work.id;
      }
    }
    if (!order) {
      const counts = /* @__PURE__ */ new Map();
      for (const item of history || []) {
        const t = norm(item?.work?.title || "");
        if (t) counts.set(t, (counts.get(t) || 0) + 1);
      }
      let node = target.parentElement;
      for (let depth = 0; depth < 7 && node && !order; depth++, node = node.parentElement) {
        const blob = norm(node.textContent || "");
        if (!blob) continue;
        for (const item of history || []) {
          const title = norm(item?.work?.title || "");
          if (title.length < 2 || counts.get(title) !== 1 || !blob.includes(title)) continue;
          const expect = Number(item?.work?.total || 0);
          if (badgeTotal && expect && expect !== badgeTotal) continue;
          order = Number(item.order) || 0;
          matchedId = "title:" + title.slice(0, 12);
          break;
        }
      }
    }
    if ((window.__hgLogCount || 0) < 30) {
      window.__hgLogCount = (window.__hgLogCount || 0) + 1;
      try { window.desktop.hgLog("probe badge=" + badgeTotal + " " + matchedId + " order=" + order); } catch {}
    }
    if (!order) return;
    target.dataset.hgProg = "1";
    if (target.querySelector(".hg-progress-hint")) return;
    const badge = document.createElement("span");
    badge.className = "hg-progress-hint";
    badge.textContent = " · 看到第" + order + "集";
    badge.style.cssText = "margin-left:4px;color:#ff7a72;font-weight:600";
    target.appendChild(badge);
  }

  function scan() {
    const badges = document.querySelectorAll(".episode-badge, .spotlight-meta");
    try {
      window.desktop.hgLog("badges=" + badges.length + " history=" + (history || []).length + " hits=" + document.querySelectorAll(".hg-progress-hint").length);
    } catch {
    }
    badges.forEach(annotate);
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(async () => {
      timer = null;
      await loadHistory(false);
      scan();
    }, 400);
  }

  loadHistory(true).then(scan).catch(() => scan());
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(async () => { await loadHistory(true); scan(); }, 15000);
})();
