(() => {
  if (window.__hgUpdateDrawer) return;
  window.__hgUpdateDrawer = true;
  const CSS = [
    ".hg-ud{position:relative;display:block;margin-top:10px}",
    ".hg-ud-toggle{padding:6px 12px;border-radius:8px;border:1px solid rgba(127,127,127,.4);background:rgba(127,127,127,.12);color:inherit;font:inherit;font-size:12px;cursor:pointer}",
    ".hg-ud-toggle:hover{background:rgba(127,127,127,.2)}",
    ".hg-ud-panel{position:absolute;left:0;bottom:calc(100% + 6px);z-index:9999;width:280px;max-height:260px;overflow:auto;padding:10px;border-radius:10px;border:1px solid rgba(127,127,127,.4);background:#1f2126;color:#eaeaea;box-shadow:0 10px 28px rgba(0,0,0,.45);font-size:12px}",
    ".hg-ud-panel[hidden]{display:none}",
    ".hg-ud-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:600}",
    ".hg-ud-close{border:0;background:transparent;color:inherit;font-size:16px;line-height:1;cursor:pointer;padding:0 2px}",
    ".hg-ud-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 4px;border-top:1px solid rgba(127,127,127,.2)}",
    ".hg-ud-item:first-child{border-top:0}",
    ".hg-ud-meta{display:flex;flex-direction:column;gap:2px;min-width:0}",
    ".hg-ud-ver{font-weight:600}",
    ".hg-ud-sub{opacity:.65;font-size:11px}",
    ".hg-ud-pick{padding:4px 10px;border-radius:6px;border:1px solid rgba(127,127,127,.45);background:rgba(127,127,127,.15);color:inherit;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}",
    ".hg-ud-pick:disabled{opacity:.5;cursor:default}",
    ".hg-ud-msg{margin-top:8px;font-size:11px;opacity:.85;white-space:pre-wrap}",
    ".hg-ud-badge{display:inline-block;margin-left:6px;padding:0 5px;border-radius:6px;background:#2f7d4f;color:#fff;font-size:10px;vertical-align:middle}"
  ].join("");
  function ensureStyle() {
    if (document.getElementById("hg-ud-style")) return;
    const style = document.createElement("style");
    style.id = "hg-ud-style";
    style.textContent = CSS;
    document.head.append(style);
  }
  async function callApi(name, arg) {
    const fn = window.desktop && window.desktop[name];
    if (typeof fn !== "function") throw new Error("接口不可用");
    const result = await fn(arg);
    if (result && typeof result === "object" && "ok" in result) {
      if (!result.ok) throw new Error((result.error && result.error.message) || "调用失败");
      return result.data;
    }
    return result;
  }
  function formatSize(bytes) {
    const value = Number(bytes) || 0;
    return value > 0 ? (value / 1024 / 1024).toFixed(1) + " MB" : "";
  }
  function formatDate(text) {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function currentVersion() {
    const node = document.querySelector(".update-version");
    const match = node && String(node.textContent || "").match(/当前版本\s*([^\s→]+)/);
    return match ? match[1] : "";
  }
  function build(actions) {
    const holder = document.createElement("div");
    holder.className = "hg-ud";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "hg-ud-toggle";
    toggle.textContent = "社区版本";
    const panel = document.createElement("div");
    panel.className = "hg-ud-panel";
    panel.hidden = true;
    const head = document.createElement("div");
    head.className = "hg-ud-head";
    head.append(document.createTextNode("选择社区版版本"));
    const close = document.createElement("button");
    close.type = "button";
    close.className = "hg-ud-close";
    close.setAttribute("aria-label", "关闭版本抽屉");
    close.textContent = "×";
    head.append(close);
    const list = document.createElement("div");
    list.className = "hg-ud-list";
    list.textContent = "加载中…";
    const msg = document.createElement("div");
    msg.className = "hg-ud-msg";
    panel.append(head, list, msg);
    holder.append(toggle, panel);
    let loaded = false;
    async function load() {
      list.textContent = "加载中…";
      try {
        const items = await callApi("updateVersions");
        list.textContent = "";
        if (!Array.isArray(items) || !items.length) {
          list.textContent = "没有可选的社区版发布。";
          return;
        }
        const now = currentVersion();
        items.forEach((item, index) => {
          const row = document.createElement("div");
          row.className = "hg-ud-item";
          const meta = document.createElement("div");
          meta.className = "hg-ud-meta";
          const ver = document.createElement("div");
          ver.className = "hg-ud-ver";
          ver.textContent = item.version || "未知版本";
          if (index === 0) {
            const badge = document.createElement("span");
            badge.className = "hg-ud-badge";
            badge.textContent = "最新";
            ver.append(badge);
          }
          const sub = document.createElement("div");
          sub.className = "hg-ud-sub";
          sub.textContent = [formatDate(item.date), formatSize(item.size)].filter(Boolean).join(" · ");
          meta.append(ver, sub);
          const pick = document.createElement("button");
          pick.type = "button";
          pick.className = "hg-ud-pick";
          pick.textContent = item.version && item.version === now ? "当前" : "选择";
          pick.disabled = !!item.version && item.version === now;
          pick.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            pick.disabled = true;
            pick.textContent = "选择中…";
            try {
              await callApi("updatePick", item.version);
              msg.textContent = "已选择 " + item.version + "，点上方「立即更新」下载；安装会重启应用。";
              list.querySelectorAll(".hg-ud-pick").forEach((node) => {
                if (node !== pick && node.textContent === "选择") node.disabled = false;
              });
              pick.textContent = "已选";
            } catch (error) {
              pick.disabled = false;
              pick.textContent = "重试";
              msg.textContent = "选择失败：" + ((error && error.message) || "未知错误");
            }
          });
          row.append(meta, pick);
          list.append(row);
        });
        loaded = true;
      } catch (error) {
        list.textContent = "";
        msg.textContent = "版本列表获取失败：" + ((error && error.message) || "未知错误");
      }
    }
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden && !loaded) void load();
    });
    close.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      panel.hidden = true;
    });
    actions.parentElement?.append(holder);
    return holder;
  }
  ensureStyle();
  let lastPanel = null;
  setInterval(() => {
    const actions = document.querySelector(".update-actions");
    if (!actions) {
      lastPanel = null;
      return;
    }
    const parent = actions.parentElement;
    if (!parent) return;
    if (parent.querySelector(".hg-ud")) return;
    if (lastPanel !== parent) {
      lastPanel = parent;
      build(actions);
    }
  }, 700);
})();
