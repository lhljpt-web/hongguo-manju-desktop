// 收藏页拖动排序（仅「我的收藏」网格，像安卓桌面拖动图标）
(function () {
  if (window.__hgFavSort) return;
  window.__hgFavSort = true;

  const style = document.createElement("style");
  style.textContent = `
    .work-grid.hg-sortable .work-card{cursor:grab;-webkit-user-select:none;user-select:none;touch-action:none}
    .work-card.hg-dragging{opacity:.3;outline:2px dashed rgba(255,122,114,.85);outline-offset:-2px;cursor:grabbing}
    .hg-drag-clone{position:fixed;z-index:99999;pointer-events:none;opacity:.95;border-radius:14px;overflow:hidden;background:#151318;box-shadow:0 18px 40px rgba(0,0,0,.4)}
  `;
  document.head.appendChild(style);

  const PROP_KEYS = ["item", "work", "data", "series", "record", "workItem", "entry", "value"];
  let drag = null, desired = null, frame = 0;

  const ready = () => window.desktop && typeof window.desktop.favoriteReorder === "function";

  function favoritesGrid() {
    const h2 = document.querySelector(".section-heading h2");
    if (!h2 || !/已收藏/.test(h2.textContent || "")) return null;
    const grid = document.querySelector(".work-grid");
    return grid || null;
  }

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

  function cardId(card) {
    for (let node = card, depth = 0; node && depth < 4; depth++, node = node.parentElement) {
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

  function cardsOf(grid) {
    return [...grid.querySelectorAll(".work-card")];
  }

  function activate() {
    const card = drag.card, rect = card.getBoundingClientRect();
    const clone = card.cloneNode(true);
    clone.classList.add("hg-drag-clone");
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";
    document.body.appendChild(clone);
    drag.clone = clone;
    drag.offsetX = drag.x - rect.left;
    drag.offsetY = drag.y - rect.top;
    drag.active = true;
    card.classList.add("hg-dragging");
  }

  function onDown(e) {
    if (e.button !== 0 || drag) return;
    const card = e.target && e.target.closest ? e.target.closest(".work-card") : null;
    if (!card) return;
    const grid = card.parentElement;
    if (!grid || !grid.classList.contains("work-grid")) return;
    if (!favoritesGrid() || !ready()) return;
    drag = { card, grid, x: e.clientX, y: e.clientY, active: false, clone: null };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
  }

  function onMove(e) {
    if (!drag) return;
    if (!drag.active) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      activate();
    }
    e.preventDefault();
    if (drag.clone) {
      drag.clone.style.left = e.clientX - drag.offsetX + "px";
      drag.clone.style.top = e.clientY - drag.offsetY + "px";
    }
    for (const card of cardsOf(drag.grid)) {
      if (card === drag.card) continue;
      const rect = card.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) continue;
      const after = e.clientX > rect.left + rect.width / 2;
      drag.grid.insertBefore(drag.card, after ? card.nextSibling : card);
      return;
    }
  }

  function onUp() {
    if (!drag) return;
    const { active, card, grid, clone } = drag;
    clone && clone.remove();
    card.classList.remove("hg-dragging");
    window.removeEventListener("pointermove", onMove, true);
    window.removeEventListener("pointerup", onUp, true);
    window.removeEventListener("pointercancel", onUp, true);
    drag = null;
    if (!active) return;
    const block = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    grid.addEventListener("click", block, true);
    setTimeout(() => grid.removeEventListener("click", block, true), 350);
    const order = cardsOf(grid).map(cardId).filter(Boolean);
    if (order.length < 2) return;
    desired = order;
    try {
      window.desktop.favoriteReorder(order).catch(() => {
      });
      window.desktop.hgLog && window.desktop.hgLog("favorite order saved " + order.length);
    } catch {
    }
  }

  // React 重新渲染可能会覆盖 DOM 顺序，这里按用户拖动后的顺序再排一次。
  function reapply() {
    if (!desired || desired.length < 2) return;
    const grid = favoritesGrid();
    if (!grid) return;
    const cards = cardsOf(grid);
    if (cards.length !== desired.length) return;
    const current = cards.map(cardId);
    if (current.join(",") === desired.join(",")) return;
    const byId = new Map(cards.map((card) => [cardId(card), card]));
    if (desired.some((id) => !byId.has(id))) return;
    for (const id of desired) grid.appendChild(byId.get(id));
  }

  function tick() {
    frame = 0;
    const grid = favoritesGrid();
    if (grid) grid.classList.add("hg-sortable");
    else {
      document.querySelectorAll(".work-grid.hg-sortable").forEach((el) => el.classList.remove("hg-sortable"));
    }
    reapply();
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(tick);
  }

  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.closest && e.target.closest(".work-grid .work-card")) e.preventDefault();
  }, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
