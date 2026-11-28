(function () {
  const { api, el, msg, date, size, pill, table, busy, tabs } = window.P;
  const $ = id => document.getElementById(id);
  let currentEmail = "";

  function show(id) { ["stepEmail", "stepCode", "dash"].forEach(x => $(x).classList.toggle("hide", x !== id)); }

  async function start() {
    try {
      const me = await api("/api/portal/me");
      if (me.role === "admin") { location.replace("/portal-admin"); return; }
      loadDash(me.email);
    } catch (e) { show("stepEmail"); $("email").focus(); }
  }

  $("emailForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("emailMsg"), "");
    try {
      const email = $("email").value.trim();
      const r = await api("/api/portal/login/request", { method: "POST", body: { email } });
      currentEmail = email;
      $("codeInfo").textContent = r.message;
      show("stepCode"); $("code").value = ""; $("code").focus();
    } catch (e) { msg($("emailMsg"), e.message); }
    busy(f, false);
  });

  $("backBtn").addEventListener("click", () => { show("stepEmail"); $("email").focus(); });

  $("codeForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("codeMsg"), "");
    try {
      const r = await api("/api/portal/login/verify", { method: "POST", body: { email: currentEmail, code: $("code").value } });
      if (r.role === "admin") { location.replace("/portal-admin"); return; }
      loadDash(currentEmail);
    } catch (e) { msg($("codeMsg"), e.message); }
    busy(f, false);
  });

  $("logoutBtn").addEventListener("click", async () => {
    try { await api("/api/portal/logout", { method: "POST" }); } catch (e) {}
    location.replace("/portal");
  });

  let data = null;
  async function loadDash(email) {
    try { data = await api("/api/portal/dashboard"); }
    catch (e) { if (e.status === 401) { show("stepEmail"); return; } alert(e.message); return; }
    $("who").classList.remove("hide"); $("whoEmail").textContent = email;
    const c = data.client || {};
    $("hello").textContent = "Welcome, " + (c.name || "");
    $("company").textContent = c.company || "";
    const done = data.services.filter(s => s.status === "Completed" || s.status === "Submitted").length;
    const open = data.orders.filter(o => ["New", "Accepted", "In progress"].includes(o.status)).length;
    $("stats").replaceChildren(
      el("div", { class: "stat" }, el("b", {}, data.services.length), el("span", {}, "Services")),
      el("div", { class: "stat" }, el("b", {}, done), el("span", {}, "Completed")),
      el("div", { class: "stat" }, el("b", {}, data.documents.length), el("span", {}, "Documents")),
      el("div", { class: "stat" }, el("b", {}, open), el("span", {}, "Open orders")));

    const svcName = id => (data.services.find(s => s.id === id) || {}).service || "";
    $("servicesBox").replaceChildren(table([
      ["Service", s => el("span", {}, el("b", {}, s.service), s.period ? el("small", { class: "muted" }, " · " + s.period) : null, s.notes ? el("div", { class: "muted" }, s.notes) : null)],
      ["Status", s => pill(s.status)],
      ["Started", s => date(s.start_date)],
      ["Completed", s => date(s.completed_date)],
      ["Fee", s => s.fee || ""],
    ], data.services, "We have not added any services to your portal yet."));

    $("docsBox").replaceChildren(table([
      ["Document", d => el("span", {}, el("b", {}, d.title), el("div", { class: "muted" }, d.filename + " · " + size(d.size)))],
      ["For", d => svcName(d.service_id)],
      ["From", d => d.uploaded_by === "firm" ? "NextGen" : "You"],
      ["Date", d => date(d.created_at)],
      ["", d => el("a", { class: "btn small", href: "/api/portal/documents/" + d.id + "/download" }, "Download")],
    ], data.documents, "No documents yet."));

    $("ordersBox").replaceChildren(table([
      ["Order", o => el("span", {}, el("b", {}, "#" + o.id + " " + o.service), el("div", { class: "muted" }, o.details))],
      ["Status", o => pill(o.status)],
      ["Placed", o => date(o.created_at)],
      ["Note from NextGen", o => o.firm_note || ""],
    ], data.orders, "You have not placed any orders yet."));

    const sel = $("oService");
    if (sel.options.length < 2) data.serviceList.forEach(s => sel.append(el("option", { value: s }, s)));
    show("dash");
  }

  $("orderForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("orderMsg"), "");
    try {
      const r = await api("/api/portal/orders", { method: "POST", body: { service: $("oService").value, details: $("oDetails").value } });
      f.reset(); msg($("orderMsg"), "Thank you. Order #" + r.id + " is placed. We will be in touch within 1 hour during office hours.", true);
      await loadDash($("whoEmail").textContent);
    } catch (e) { msg($("orderMsg"), e.message); }
    busy(f, false);
  });

  $("upForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; msg($("upMsg"), "");
    const file = $("upFile").files[0];
    if (!file) { msg($("upMsg"), "Choose a file first."); return; }
    if (file.size > 20 * 1024 * 1024) { msg($("upMsg"), "Files must be 20 MB or smaller."); return; }
    busy(f, true);
    try {
      await api("/api/portal/upload", { method: "POST", body: new FormData(f) });
      f.reset(); msg($("upMsg"), "Uploaded. Thank you.", true);
      await loadDash($("whoEmail").textContent);
    } catch (e) { msg($("upMsg"), e.message); }
    busy(f, false);
  });

  tabs(document);
  start();
})();
