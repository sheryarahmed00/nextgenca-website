(function () {
  const { api, el, msg, date, size, pill, table, busy, tabs } = window.P;
  const $ = id => document.getElementById(id);
  let meta = null, currentId = null;

  async function start() {
    try { meta = await api("/api/admin/meta"); }
    catch (e) { if (e.status === 401 || e.status === 403) { location.replace("/portal"); return; } $("gate").classList.remove("hide"); return; }
    $("whoEmail").textContent = meta.email;
    meta.orderStatuses.forEach(s => $("orderFilter").append(el("option", { value: s }, s)));
    $("app").classList.remove("hide");
    tabs(document);
    loadClients(); loadOrders(); loadAudit();
  }

  $("logoutBtn").addEventListener("click", async () => { try { await api("/api/portal/logout", { method: "POST" }); } catch (e) {} location.replace("/portal"); });

  // ----- clients list -----
  let t;
  $("search").addEventListener("input", () => { clearTimeout(t); t = setTimeout(loadClients, 250); });
  async function loadClients() {
    const r = await api("/api/admin/clients?q=" + encodeURIComponent($("search").value));
    $("clientList").replaceChildren(...(r.items.length ? r.items.map(c => el("button", {
      type: "button", "aria-current": c.id === currentId ? "true" : "false", onclick: () => openClient(c.id),
    }, el("b", {}, c.name + (c.active ? "" : " (off)")), el("small", {}, c.email), el("small", {},
      (c.company ? c.company + " · " : "") + c.n_services + " services · " + c.n_docs + " docs" + (c.n_open ? " · " + c.n_open + " open orders" : ""))))
      : [el("p", { class: "muted", style: "padding:12px" }, "No clients yet.")]));
  }

  $("newClientBtn").addEventListener("click", () => { $("newClient").classList.toggle("hide"); });
  $("newClientForm").addEventListener("submit", async ev => {
    ev.preventDefault(); const f = ev.target; const box = f.querySelector(".m"); busy(f, true); msg(box, "");
    const fd = new FormData(f);
    try {
      const r = await api("/api/admin/clients", { method: "POST", body: { name: fd.get("name"), email: fd.get("email"), company: fd.get("company"), phone: fd.get("phone"), invite: fd.get("invite") === "1" } });
      f.reset(); $("newClient").classList.add("hide"); await loadClients(); openClient(r.id);
    } catch (e) { msg(box, e.message); }
    busy(f, false);
  });

  // ----- one client -----
  function statusSelect(name, list, value) {
    return el("select", { name }, list.map(s => el("option", { value: s, selected: s === value }, s)));
  }
  function serviceForm(c, s) {
    const f = el("form", { novalidate: true },
      el("div", { class: "grid2" },
        el("div", {}, el("label", {}, "Service *"), el("select", { name: "service" }, meta.services.map(x => el("option", { value: x, selected: s ? s.service === x : false }, x)),
          s && !meta.services.includes(s.service) ? el("option", { value: s.service, selected: true }, s.service) : null)),
        el("div", {}, el("label", {}, "Status *"), statusSelect("status", meta.serviceStatuses, s ? s.status : "In progress")),
        el("div", {}, el("label", {}, "Period / year"), el("input", { name: "period", maxlength: 80, value: s ? s.period || "" : "", placeholder: "e.g. 2025/26 or YE 31 Mar 2026" })),
        el("div", {}, el("label", {}, "Fee"), el("input", { name: "fee", maxlength: 40, value: s ? s.fee || "" : "", placeholder: "e.g. £350" })),
        el("div", {}, el("label", {}, "Start date"), el("input", { name: "start_date", type: "date", value: s ? s.start_date || "" : "" })),
        el("div", {}, el("label", {}, "Completed date"), el("input", { name: "completed_date", type: "date", value: s ? s.completed_date || "" : "" }))),
      el("label", {}, "Notes (the client can see these)"), el("textarea", { name: "notes", maxlength: 2000, style: "min-height:70px" }, s ? s.notes || "" : ""),
      el("p", { class: "row", style: "margin-top:12px" }, el("button", { class: "btn", type: "submit" }, s ? "Save changes" : "Add service"),
        s ? el("button", { class: "btn danger", type: "button", onclick: async () => {
          if (!confirm("Delete this service record?")) return;
          await api("/api/admin/services/" + s.id, { method: "DELETE" }); openClient(c.id);
        } }, "Delete") : null),
      el("div", { class: "m" }));
    f.addEventListener("submit", async ev => {
      ev.preventDefault(); busy(f, true); const fd = Object.fromEntries(new FormData(f));
      try {
        await api(s ? "/api/admin/services/" + s.id : "/api/admin/clients/" + c.id + "/services", { method: s ? "PUT" : "POST", body: fd });
        openClient(c.id); loadClients();
      } catch (e) { msg(f.querySelector(".m"), e.message); busy(f, false); }
    });
    return f;
  }

  async function openClient(id) {
    currentId = id; $("newClient").classList.add("hide");
    const d = await api("/api/admin/clients/" + id);
    const c = d.client;
    loadClients();
    const svcName = sid => (d.services.find(s => s.id === sid) || {}).service || "";

    const details = el("form", { novalidate: true },
      el("div", { class: "grid2" },
        el("div", {}, el("label", {}, "Name"), el("input", { name: "name", value: c.name })),
        el("div", {}, el("label", {}, "Email (login)"), el("input", { name: "email", type: "email", value: c.email })),
        el("div", {}, el("label", {}, "Company"), el("input", { name: "company", value: c.company || "" })),
        el("div", {}, el("label", {}, "Phone"), el("input", { name: "phone", value: c.phone || "" }))),
      el("label", { class: "row", style: "font-weight:600" }, el("input", { type: "checkbox", name: "active", checked: !!c.active, style: "width:auto" }), " Portal access on"),
      el("p", { style: "margin-top:10px" }, el("button", { class: "btn small", type: "submit" }, "Save details")), el("div", { class: "m" }));
    details.addEventListener("submit", async ev => {
      ev.preventDefault(); const fd = new FormData(details);
      try {
        await api("/api/admin/clients/" + id, { method: "PUT", body: { name: fd.get("name"), email: fd.get("email"), company: fd.get("company"), phone: fd.get("phone"), active: fd.get("active") === "on" } });
        msg(details.querySelector(".m"), "Saved.", true); loadClients();
      } catch (e) { msg(details.querySelector(".m"), e.message); }
    });

    const editBox = el("div");
    const services = table([
      ["Service", s => el("span", {}, el("b", {}, s.service), s.period ? " · " + s.period : "", s.notes ? el("div", { class: "muted" }, s.notes) : null)],
      ["Status", s => pill(s.status)], ["Started", s => date(s.start_date)], ["Completed", s => date(s.completed_date)], ["Fee", s => s.fee || ""],
      ["", s => el("button", { class: "btn line small", type: "button", onclick: () => editBox.replaceChildren(el("h3", {}, "Edit service"), serviceForm(c, s)) }, "Edit")],
    ], d.services, "No services recorded yet.");

    const up = el("form", { novalidate: true },
      el("div", { class: "grid2" },
        el("div", {}, el("label", {}, "File *"), el("input", { type: "file", name: "file", accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc,.csv,.txt" })),
        el("div", {}, el("label", {}, "Title"), el("input", { name: "title", maxlength: 120, placeholder: "e.g. Accounts YE 31 Mar 2026 (signed)" })),
        el("div", {}, el("label", {}, "Link to service"), el("select", { name: "service_id" }, el("option", { value: "" }, "None"), d.services.map(s => el("option", { value: s.id }, s.service + (s.period ? " · " + s.period : ""))))),
        el("div", {}, el("label", { class: "row", style: "font-weight:600;margin-top:36px" }, el("input", { type: "checkbox", name: "notify", value: "1", checked: true, style: "width:auto" }), " Email the client that it is ready"))),
      el("p", { style: "margin-top:12px" }, el("button", { class: "btn", type: "submit" }, "Upload to client")), el("div", { class: "m" }));
    up.addEventListener("submit", async ev => {
      ev.preventDefault(); busy(up, true);
      try { await api("/api/admin/clients/" + id + "/documents", { method: "POST", body: new FormData(up) }); openClient(id); }
      catch (e) { msg(up.querySelector(".m"), e.message); busy(up, false); }
    });

    const docs = table([
      ["Document", x => el("span", {}, el("b", {}, x.title), el("div", { class: "muted" }, x.filename + " · " + size(x.size)))],
      ["For", x => svcName(x.service_id)], ["From", x => x.uploaded_by === "firm" ? "NextGen" : "Client"], ["Date", x => date(x.created_at)],
      ["", x => el("span", { class: "row" }, el("a", { class: "btn small", href: "/api/admin/documents/" + x.id + "/download" }, "Download"),
        el("button", { class: "btn danger small", type: "button", onclick: async () => {
          if (!confirm("Delete " + x.filename + " for good?")) return;
          await api("/api/admin/documents/" + x.id, { method: "DELETE" }); openClient(id);
        } }, "Delete"))],
    ], d.documents, "No documents yet.");

    $("clientView").replaceChildren(
      el("div", { class: "card" }, el("h2", {}, c.name), el("p", { class: "muted" }, "Client since " + date(c.created_at)), details),
      el("div", { class: "card" }, el("h2", {}, "Services"), services, editBox,
        el("h3", { style: "margin-top:22px" }, "Add a service"), serviceForm(c, null)),
      el("div", { class: "card" }, el("h2", {}, "Documents"), docs, el("h3", { style: "margin-top:22px" }, "Upload a document for this client"), up),
      el("div", { class: "card" }, el("h2", {}, "Orders"), orderTable(d.orders.map(o => ({ ...o, client_name: c.name, client_email: c.email })))));
  }

  // ----- orders -----
  function orderTable(items) {
    return table([
      ["Order", o => el("span", {}, el("b", {}, "#" + o.id + " " + o.service), el("div", { class: "muted" }, o.details), el("small", { class: "muted" }, date(o.created_at)))],
      ["Client", o => el("span", {}, el("button", { class: "btn line small", type: "button", onclick: () => { document.querySelector('[data-tab="tClients"]').click(); openClient(o.client_id); } }, o.client_name), el("div", { class: "muted" }, o.client_email))],
      ["Status / note", o => {
        const f = el("form", { novalidate: true }, statusSelect("status", meta.orderStatuses, o.status),
          el("input", { name: "firm_note", maxlength: 1000, value: o.firm_note || "", placeholder: "Note for the client (e.g. fee £150)", style: "margin-top:6px" }),
          el("label", { class: "row", style: "font-weight:600;margin:6px 0" }, el("input", { type: "checkbox", name: "notify", checked: true, style: "width:auto" }), " Email client if status changes"),
          el("button", { class: "btn small", type: "submit" }, "Save"), el("div", { class: "m" }));
        f.addEventListener("submit", async ev => {
          ev.preventDefault(); const fd = new FormData(f);
          try { await api("/api/admin/orders/" + o.id, { method: "PUT", body: { status: fd.get("status"), firm_note: fd.get("firm_note"), notify: fd.get("notify") === "on" } }); msg(f.querySelector(".m"), "Saved.", true); loadOrders(); }
          catch (e) { msg(f.querySelector(".m"), e.message); }
        });
        return f;
      }],
    ], items, "No orders.");
  }
  $("orderFilter").addEventListener("change", loadOrders);
  async function loadOrders() {
    const r = await api("/api/admin/orders?status=" + encodeURIComponent($("orderFilter").value));
    $("ordersBox").replaceChildren(orderTable(r.items));
    const n = $("orderFilter").value ? null : r.items.filter(o => o.status === "New").length;
    if (n !== null) $("newCount").textContent = n ? "(" + n + " new)" : "";
  }
  async function loadAudit() {
    const r = await api("/api/admin/audit");
    $("auditBox").replaceChildren(table([
      ["When", a => new Date(a.at).toLocaleString("en-GB")], ["Who", a => a.actor], ["What", a => a.action.replace(/_/g, " ")], ["Detail", a => a.detail || ""], ["IP", a => a.ip || ""],
    ], r.items, "Nothing yet."));
  }

  start();
})();
