(function () {
  const { api, el, msg, date, size, pill, table, busy, tabs } = window.P;
  const gbp = p => "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const STAGE = { kyc: "Waiting for ID", review: "ID to check", active: "Active", rejected: "Rejected" };
  const $ = id => document.getElementById(id);
  let meta = null, currentId = null;

  async function start() {
    try { meta = await api("/api/admin/meta"); }
    catch (e) { if (e.status === 401 || e.status === 403) { location.replace("/staff-login"); return; } $("gate").classList.remove("hide"); return; }
    $("whoEmail").textContent = meta.email;
    meta.orderStatuses.forEach(s => $("orderFilter").append(el("option", { value: s }, s)));
    $("app").classList.remove("hide");
    tabs(document);
    loadClients(); loadOrders(); loadAudit(); loadSignups(); loadSettings(); setupQuotes();
  }

  $("logoutBtn").addEventListener("click", async () => { try { await api("/api/portal/logout", { method: "POST" }); } catch (e) {} location.replace("/staff-login"); });

  // ----- clients list -----
  let t;
  $("search").addEventListener("input", () => { clearTimeout(t); t = setTimeout(loadClients, 250); });
  async function loadClients() {
    const r = await api("/api/admin/clients?q=" + encodeURIComponent($("search").value));
    $("clientList").replaceChildren(...(r.items.length ? r.items.map(c => el("button", {
      type: "button", "aria-current": c.id === currentId ? "true" : "false", onclick: () => openClient(c.id),
    }, el("b", {}, c.name + (c.active ? "" : " (off)"), c.stage !== "active" ? " · " + (STAGE[c.stage] || c.stage) : ""), el("small", {}, c.email), el("small", {},
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
      ["For", x => x.category && x.category.startsWith("kyc") ? "ID check" : svcName(x.service_id)], ["From", x => x.uploaded_by === "firm" ? "NextGen" : "Client"], ["Date", x => date(x.created_at)],
      ["", x => el("span", { class: "row" }, el("a", { class: "btn small", href: "/api/admin/documents/" + x.id + "/download" }, "Download"),
        el("button", { class: "btn danger small", type: "button", onclick: async () => {
          if (!confirm("Delete " + x.filename + " for good?")) return;
          await api("/api/admin/documents/" + x.id, { method: "DELETE" }); openClient(id);
        } }, "Delete"))],
    ], d.documents, "No documents yet.");

    const kycDocs = d.documents.filter(x => x.category && x.category.startsWith("kyc"));
    const onboard = el("div", { class: "card action" }, el("h2", {}, c.stage === "review" ? "Check ID and send agreement" : "Send an agreement and invoice"),
      c.wanted_service ? el("p", {}, "Signed up for: ", el("b", {}, c.wanted_service), c.signup_note ? el("div", { class: "muted" }, "Note: " + c.signup_note) : null) : null,
      kycDocs.length ? el("div", { class: "row", style: "margin:8px 0 14px" }, kycDocs.map(x => el("a", { class: "btn line small", href: "/api/admin/documents/" + x.id + "/download" }, "Open " + x.title))) : null,
      (d.kyc && d.kyc[0]) ? el("p", {}, "Automatic ID check: ", el("b", {}, d.kyc[0].status), d.kyc[0].summary ? el("div", { class: "muted" }, d.kyc[0].summary) : null, el("div", { class: "muted" }, "Full report, photos and selfie: Didit console")) : null,
      c.stage === "kyc" ? el("p", { class: "muted" }, "Waiting for the client to complete the ID check.") : approveForm(c, d.quote),
      ["kyc", "review"].includes(c.stage) ? el("p", { style: "margin-top:10px" }, el("button", { class: "btn danger small", type: "button", onclick: async () => {
        const reason = prompt("Reason sent to the client (optional):", ""); if (reason === null) return;
        await api("/api/admin/clients/" + id + "/reject", { method: "POST", body: { reason } }); openClient(id); loadSignups();
      } }, "Reject sign-up")) : null);

    const invoices = table([
      ["Invoice", i => el("span", {}, el("b", {}, i.number), el("div", { class: "muted" }, i.description))],
      ["Amount", i => gbp(i.amount_pence)],
      ["Status", i => el("span", {}, pill(i.status === "paid" ? "Paid" : i.status === "cancelled" ? "Cancelled" : "Unpaid"), i.client_says_paid_at && i.status === "unpaid" ? el("div", { class: "muted" }, "Client says paid " + date(i.client_says_paid_at)) : null, i.paid_at ? el("div", { class: "muted" }, date(i.paid_at) + " · " + (i.paid_method || "")) : null)],
      ["Agreement", i => { const e = d.engagements.find(x => x.id === i.engagement_id); return e ? (e.status === "signed" ? "Signed by " + e.signed_name + " " + date(e.signed_at) : "Not signed yet") : ""; }],
      ["", i => i.status !== "unpaid" ? "" : el("span", { class: "row" },
        el("select", { "aria-label": "Paid by", style: "width:auto;padding:5px" }, ["Bank transfer", "Card", "Direct Debit", "Cash"].map(m => el("option", {}, m))),
        el("button", { class: "btn small", type: "button", onclick: async ev => {
          const method = ev.target.previousElementSibling.value;
          if (!confirm("Mark " + i.number + " as paid by " + method + "? The client will be emailed.")) return;
          await api("/api/admin/invoices/" + i.id, { method: "PUT", body: { status: "paid", method } }); openClient(id); loadSignups();
        } }, "Mark paid"),
        el("button", { class: "btn danger small", type: "button", onclick: async () => {
          if (!confirm("Cancel " + i.number + "?")) return;
          await api("/api/admin/invoices/" + i.id, { method: "PUT", body: { status: "cancelled" } }); openClient(id); loadSignups();
        } }, "Cancel"))],
    ], d.invoices, "No invoices yet.");
    const checklist = d.checklist.length ? el("div", {}, el("h3", { style: "margin-top:18px" }, "Document checklist"),
      d.checklist.map(it => el("div", { class: "todo" + (it.done_at ? " done" : "") }, el("b", {}, (it.done_at ? "✓ " : "○ ") + it.label), it.done_at ? el("small", { class: "muted" }, date(it.done_at)) : el("small", { class: "muted" }, "Waiting")))) : null;

    $("clientView").replaceChildren(
      el("div", { class: "card" }, el("h2", {}, c.name), el("p", { class: "muted" }, "Client since " + date(c.created_at) + " · " + (STAGE[c.stage] || c.stage)), details),
      c.stage === "rejected" ? el("div", { class: "card" }, el("p", {}, "Rejected. " + (c.reject_reason || ""))) : onboard,
      el("div", { class: "card" }, el("h2", {}, "Agreements and invoices"), invoices, checklist),
      el("div", { class: "card" }, el("h2", {}, "Services"), services, editBox,
        el("h3", { style: "margin-top:22px" }, "Add a service"), serviceForm(c, null)),
      el("div", { class: "card" }, el("h2", {}, "Documents"), docs, el("h3", { style: "margin-top:22px" }, "Upload a document for this client"), up),
      el("div", { class: "card" }, el("h2", {}, "Orders"), orderTable(d.orders.map(o => ({ ...o, client_name: c.name, client_email: c.email })))));
  }

  function approveForm(c, q) {
    const svc = (q && q.service) || c.wanted_service || meta.services[0];
    let qck = null; try { qck = q ? JSON.parse(q.checklist || "[]") : null; } catch (e) {}
    const ck = el("textarea", { name: "checklist", style: "min-height:90px" }, ((qck && qck.length) ? qck : (meta.checklists[svc] || [])).join("\n"));
    const sel = el("select", { name: "service" }, meta.services.map(x => el("option", { value: x, selected: x === svc }, x)));
    sel.addEventListener("change", () => { ck.value = (meta.checklists[sel.value] || []).join("\n"); });
    const f = el("form", { novalidate: true },
      el("div", { class: "grid2" },
        el("div", {}, el("label", {}, "Service"), sel),
        el("div", {}, el("label", {}, "Fee (£) *"), el("input", { name: "fee", inputmode: "decimal", placeholder: "150", value: q ? (q.fee_pence / 100).toFixed(2) : "" })),
        el("div", {}, el("label", {}, "Period / year"), el("input", { name: "period", placeholder: "e.g. 2025/26", value: q ? q.period || "" : "" }))),
      q ? el("p", { class: "msg ok" }, "Prefilled from accepted quote " + q.number + ". Sending closes the quote.") : null,
      el("label", {}, "What is included (goes into the letter)"),
      el("textarea", { name: "scope", style: "min-height:80px", placeholder: "e.g. Preparing and filing your 2025/26 Self Assessment tax return, including one rental property." }, q ? q.scope || "" : ""),
      el("label", {}, "Documents the client must upload after paying (one per line)"), ck,
      el("p", { style: "margin-top:12px" }, el("button", { class: "btn gold", type: "submit" }, c.stage === "review" ? "Approve ID and send agreement + invoice" : "Send agreement + invoice")),
      el("div", { class: "m" }));
    f.addEventListener("submit", async ev => {
      ev.preventDefault(); busy(f, true);
      const fd = new FormData(f);
      try {
        const r = await api("/api/admin/clients/" + c.id + "/approve", { method: "POST", body: { service: fd.get("service"), fee: fd.get("fee"), period: fd.get("period"), scope: fd.get("scope"), checklist: String(fd.get("checklist") || "").split("\n") } });
        alert("Sent. Invoice " + r.invoice + " created and the client has been emailed."); openClient(c.id); loadSignups();
      } catch (e) { msg(f.querySelector(".m"), e.message); busy(f, false); }
    });
    return f;
  }
  async function loadSignups() {
    const r = await api("/api/admin/signups");
    const n = r.items.filter(c => c.stage === "review" || c.says_paid).length;
    $("todoCount").textContent = n ? "(" + n + ")" : "";
    $("signupsBox").replaceChildren(table([
      ["Client", c => el("span", {}, el("b", {}, c.name), el("div", { class: "muted" }, c.email + (c.phone ? " · " + c.phone : "")))],
      ["Wants", c => c.wanted_service || ""],
      ["Next step", c => c.stage === "review" ? el("b", {}, "ID done: check and set fee") : c.stage === "kyc" ? "Waiting for client ID" : c.says_paid ? el("b", {}, "Client says paid, check bank") : "Waiting for signature / payment"],
      ["Since", c => date(c.created_at)],
      ["", c => el("button", { class: "btn small", type: "button", onclick: () => { document.querySelector('[data-tab="tClients"]').click(); openClient(c.id); } }, "Open")],
    ], r.items, "Nothing to do."));
  }
  async function loadSettings() {
    const st = await api("/api/admin/settings");
    const f = $("settingsForm");
    for (const k of ["account_name", "bank_name", "sort_code", "account_number", "pay_link", "dd_link", "letter_template"]) f.elements[k].value = st[k] || "";
  }
  $("settingsForm").addEventListener("submit", async ev => {
    ev.preventDefault(); const f = ev.target; busy(f, true);
    try { await api("/api/admin/settings", { method: "PUT", body: Object.fromEntries(new FormData(f)) }); msg(f.querySelector(".m"), "Saved.", true); loadSettings(); }
    catch (e) { msg(f.querySelector(".m"), e.message); }
    busy(f, false);
  });

  // ----- quotes -----
  const QSTATUS = { sent: "Sent", viewed: "Viewed", accepted: "Accepted", invoiced: "Closed – invoiced", expired: "Expired", withdrawn: "Withdrawn", replaced: "Replaced", declined: "Declined" };
  function setupQuotes() {
    const sel = $("qService");
    meta.services.forEach(x => sel.append(el("option", { value: x }, x)));
    const fillCk = () => { $("qChecklist").value = (meta.checklists[sel.value] || []).join("\n"); };
    sel.addEventListener("change", fillCk); fillCk();
    $("newQuoteBtn").addEventListener("click", () => $("newQuote").classList.toggle("hide"));
    $("quoteFilter").addEventListener("change", loadQuotes);
    $("newQuoteForm").addEventListener("submit", async ev => {
      ev.preventDefault(); const f = ev.target; const box = f.querySelector(".m"); busy(f, true); msg(box, "");
      const fd = Object.fromEntries(new FormData(f));
      fd.checklist = String(fd.checklist || "").split("\n");
      try {
        const r = await api("/api/admin/quotes", { method: "POST", body: fd });
        f.reset(); fillCk(); msg(box, "Quote " + r.number + " created and emailed to the client.", true);
        loadQuotes(); openQuote(r.id);
      } catch (e) { msg(box, e.message); }
      busy(f, false);
    });
    loadQuotes();
  }
  async function loadQuotes() {
    const r = await api("/api/admin/quotes?status=" + encodeURIComponent($("quoteFilter").value));
    const open = r.items.filter(q => ["sent", "viewed", "accepted"].includes(q.status)).length;
    $("quoteCount").textContent = !$("quoteFilter").value && open ? "(" + open + " open)" : "";
    $("quotesBox").replaceChildren(table([
      ["Quote", q => el("span", {}, el("b", {}, q.number), el("div", { class: "muted" }, date(q.created_at)))],
      ["Client", q => el("span", {}, el("b", {}, q.name), el("div", { class: "muted" }, q.email))],
      ["Service", q => q.service], ["Fee", q => gbp(q.fee_pence)],
      ["Status", q => el("span", {}, pill(QSTATUS[q.status] || q.status), q.invoice_number ? el("div", { class: "muted" }, q.invoice_number) : null)],
      ["", q => el("button", { class: "btn line small", type: "button", onclick: () => openQuote(q.id) }, "Open")],
    ], r.items, "No quotes yet."));
  }
  async function openQuote(id) {
    const d = await api("/api/admin/quotes/" + id);
    const q = d.quote;
    let ck = []; try { ck = JSON.parse(q.checklist || "[]"); } catch (e) {}
    const actions = el("p", { class: "row", style: "margin-top:12px" });
    if (["sent", "viewed"].includes(q.status)) actions.append(el("button", { class: "btn line small", type: "button", onclick: async () => {
      try { await api("/api/admin/quotes/" + id + "/resend", { method: "POST" }); alert("Quote emailed again."); openQuote(id); } catch (e) { alert(e.message); }
    } }, "Email again"));
    if (["sent", "viewed", "accepted"].includes(q.status)) actions.append(el("button", { class: "btn danger small", type: "button", onclick: async () => {
      if (!confirm("Withdraw quote " + q.number + "? The client's link will stop working.")) return;
      await api("/api/admin/quotes/" + id + "/withdraw", { method: "POST" }); openQuote(id); loadQuotes();
    } }, "Withdraw"));
    $("quoteView").replaceChildren(el("div", { class: "card" },
      el("h2", {}, q.number + " · " + (QSTATUS[q.status] || q.status)),
      el("div", { class: "bank" },
        el("div", {}, el("span", {}, "Client"), el("span", {}, q.name + " <" + q.email + ">")),
        q.company ? el("div", {}, el("span", {}, "Company"), el("span", {}, q.company)) : null,
        el("div", {}, el("span", {}, "Service"), el("b", {}, q.service + (q.period ? " (" + q.period + ")" : ""))),
        el("div", {}, el("span", {}, "Fee"), el("b", {}, gbp(q.fee_pence))),
        el("div", {}, el("span", {}, "Valid until"), el("span", {}, date(q.valid_until))),
        el("div", {}, el("span", {}, "Created by"), el("span", {}, q.created_by)),
        d.invoice ? el("div", {}, el("span", {}, "Invoice"), el("span", {}, d.invoice.number + " · " + gbp(d.invoice.amount_pence) + " · " + (d.invoice.status === "paid" ? "Paid " + date(d.invoice.paid_at) + " (" + (d.invoice.paid_method || "") + ")" : d.invoice.status))) : null),
      q.scope ? el("div", {}, el("h3", { style: "margin-top:14px" }, "What is included"), el("p", { style: "white-space:pre-wrap" }, q.scope)) : null,
      ck.length ? el("div", {}, el("h3", {}, "Documents to upload after paying"), el("ul", {}, ck.map(x => el("li", {}, x)))) : null,
      el("h3", { style: "margin-top:14px" }, "History"),
      table([["When", e => new Date(e.at).toLocaleString("en-GB")], ["What", e => e.event.replace(/_/g, " ")], ["Detail", e => e.detail || ""]], d.events, "No events."),
      actions));
    $("quoteView").scrollIntoView({ behavior: "smooth" });
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
