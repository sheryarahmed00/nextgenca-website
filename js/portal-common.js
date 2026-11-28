// Shared helpers for portal pages. All user data is inserted with textContent (never innerHTML).
(function () {
  function api(path, opt) {
    opt = opt || {};
    const headers = { "x-portal": "1" };
    let body = opt.body;
    if (body && !(body instanceof FormData)) { headers["content-type"] = "application/json"; body = JSON.stringify(body); }
    return fetch(path, { method: opt.method || "GET", headers, body, credentials: "same-origin", cache: "no-store" })
      .then(async r => {
        let j = {};
        try { j = await r.json(); } catch (e) {}
        if (!r.ok) { const err = new Error(j.error || "Something went wrong."); err.status = r.status; throw err; }
        return j;
      });
  }
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : String(k));
    return e;
  }
  function msg(box, text, ok) {
    box.replaceChildren(text ? el("div", { class: "msg " + (ok ? "ok" : "err") }, text) : "");
  }
  function date(v) {
    if (!v) return "";
    const d = new Date(v.length === 10 ? v + "T12:00:00" : v);
    return isNaN(d) ? v : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function pill(s) { return el("span", { class: "pill " + String(s || "").replace(/\s+/g, "-") }, s); }
  function table(cols, rows, empty) {
    if (!rows.length) return el("p", { class: "muted" }, empty);
    return el("table", { class: "resp" },
      el("thead", {}, el("tr", {}, cols.map(c => el("th", {}, c[0])))),
      el("tbody", {}, rows.map(r => el("tr", {}, cols.map(c => el("td", { "data-label": c[0] }, c[1](r)))))));
  }
  function busy(form, on) { form.querySelectorAll("button").forEach(b => b.disabled = on); }
  function tabs(root) {
    const btns = root.querySelectorAll("[data-tab]");
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => { x.setAttribute("aria-selected", x === b ? "true" : "false"); document.getElementById(x.dataset.tab).classList.toggle("hide", x !== b); });
    }));
  }
  window.P = { api, el, msg, date, size, pill, table, busy, tabs };

  // Log out after 5 minutes with no activity (mouse, keys, touch, scroll).
  // While someone is active, a light check every minute keeps their session alive on the server.
  if (/[?&]timeout=1/.test(location.search)) {
    const main = document.querySelector("main");
    if (main) main.prepend(el("div", { class: "msg ok", style: "max-width:440px;margin:20px auto 0" },
      "You were logged out after 5 minutes without activity. Please log in again."));
  }

  (function idleLogout() {
    const IDLE_MS = 5 * 60 * 1000;
    const isAdmin = location.pathname.startsWith("/portal-admin");
    const back = isAdmin ? "/staff-login?timeout=1" : "/portal?timeout=1";
    let last = Date.now(), lastPing = Date.now(), done = false;
    const loggedIn = () => { const b = document.getElementById("logoutBtn"); return b && b.offsetParent !== null; };
    const activity = () => {
      last = Date.now();
      if (loggedIn() && Date.now() - lastPing > 60 * 1000) {
        lastPing = Date.now();
        fetch("/api/portal/me", { headers: { "x-portal": "1" }, credentials: "same-origin", cache: "no-store" })
          .then(r => { if (r.status === 401 && !done) { done = true; location.replace(back); } }).catch(() => {});
      }
    };
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"].forEach(ev =>
      window.addEventListener(ev, activity, { passive: true, capture: true }));
    setInterval(async () => {
      if (done || !loggedIn() || Date.now() - last < IDLE_MS) return;
      done = true;
      try { await fetch("/api/portal/logout", { method: "POST", headers: { "x-portal": "1" }, credentials: "same-origin" }); } catch (e) {}
      location.replace(back);
    }, 15 * 1000);
  })();
})();
