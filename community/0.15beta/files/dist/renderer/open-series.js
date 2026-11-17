// 刷剧窗口「观看全集」跳转：在主窗口里打开对应作品详情
(function () {
  if (window.__hgOpenSeries) return;
  window.__hgOpenSeries = true;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || "").replace(/\s+/g, "").trim();
  const PROP_KEYS = ["item", "work", "data", "series", "record", "workItem", "entry", "value"];

  function idIn(value, depth) {
    if (!value || typeof value !== "object" || depth > 3) return "";
    if (value.id != null && (value.title || value.name || value.total != null)) return String(value.id);
    for (const key of PROP_KEYS) {
      if (value[key] && typeof value[key] === "object") {
        const hit = idIn(value[key], depth + 1);
        if (hit) return hit;
      }
    }
    return "";
  }

  function cardId(el) {
    for (let node = el, depth = 0; node && depth < 6; depth++, node = node.parentElement) {
      for (const key of Object.keys(node)) {
        try {
          if (key.startsWith("__reactProps$")) {
            const hit = idIn(node[key], 0);
            if (hit) return hit;
          } else if (key.startsWith("__reactFiber$")) {
            let fiber = node[key];
            for (let up = 0; fiber && up < 6; up++, fiber = fiber.return) {
              const hit = idIn(fiber.memoizedProps, 0);
              if (hit) return hit;
            }
          }
        } catch {
        }
      }
    }
    return "";
  }

  function candidates() {
    return [...document.querySelectorAll('a,article,li,button,[class*="card"],[class*="Card"],[class*="work"],[class*="cover"],[class*="poster"]')];
  }

  function clickable(el) {
    return el.closest('a,button,[role="button"],[class*="card"],[class*="Card"]') || el;
  }

  function clickById(seriesId) {
    if (!seriesId) return false;
    for (const el of candidates()) {
      if (cardId(el) === String(seriesId)) {
        clickable(el).click();
        return true;
      }
    }
    return false;
  }

  function clickByTitle(title) {
    const needle = norm(title);
    if (needle.length < 2) return false;
    const hits = candidates().filter((el) => norm(el.textContent).includes(needle));
    if (!hits.length) return false;
    clickable(hits[hits.length - 1]).click();
    return true;
  }

  function fillInput(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function searchThenOpen(title) {
    const input = [...document.querySelectorAll("input")].find((el) => /搜索|search/i.test(el.placeholder || "") || el.type === "search");
    if (!input || !title) return false;
    input.focus();
    fillInput(input, title);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    await sleep(1800);
    return clickByTitle(title);
  }

  window.__hgOpenSeries = async function (payload) {
    try {
      const seriesId = String(payload && payload.seriesId || "");
      const title = String(payload && payload.title || "");
      for (let i = 0; i < 6; i++) {
        if (clickById(seriesId)) return true;
        await sleep(400);
      }
      if (await searchThenOpen(title)) return true;
      for (let i = 0; i < 4; i++) {
        if (clickById(seriesId)) return true;
        await sleep(500);
      }
      try {
        window.desktop && window.desktop.hgLog && window.desktop.hgLog("open-series miss " + seriesId + " " + title.slice(0, 20));
      } catch {
      }
      return false;
    } catch (e) {
      try {
        window.desktop && window.desktop.hgLog && window.desktop.hgLog("open-series error " + (e && e.message));
      } catch {
      }
      return false;
    }
  };
})();
