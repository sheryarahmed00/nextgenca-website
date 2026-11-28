// Admin: Enquiries & Calls tab. All values inserted with textContent via P.el.
(function () {
  const { api, el, msg, pill } = window.P;
  const $ = id => document.getElementById(id);
  if (!$("tEnquiries")) return;
  let loaded = false, statuses = [], items = [], view = "all";

  const now = () => Date.now();
  const t = v => (v ? new Date(v).getTime() : 0);
  function day(v) {
    if (!v) return "";
    return new Date(v).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }
  function dayTime(v) {
    if (!v) return "";
    const d = new Date(v);
    return day(v) + ", " + d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "");
  }
  function ago(v) {
    const mins = Math.round((now() - t(v)) / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : mins + " min ago";
    const h = Math.round(mins / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    const d = Math.round(h / 24);
    return d === 1 ? "yesterday" : d + " days ago";
  }

  // The latest email from either mailbox
  function lastMail(e) {
    const s = t(e.sheryar_last_at), f = t(e.fiza_last_at);
    if (!s && !f) return null;
    return s >= f
      ? { at: e.sheryar_last_at, from: e.sheryar_last_from, who: "Sheryar" }
      : { at: e.fiza_last_at, from: e.fiza_last_from, who: "Fiza" };
  }
  const callUpcoming = e => e.call_at && t(e.call_at) > now();
  const closed = e => ["Paid", "Work done", "Lost"].includes(e.status);
  const waiting = e => { const m = lastMail(e); return !closed(e) && m && m.from === "Client"; };

  // One plain sentence: what to do next
  function nextStep(e) {
    if (e.status === "Lost") return ["calm", "Closed – lost"];
    if (e.status === "Work done") return ["calm", "Done"];
    if (callUpcoming(e)) return ["ok", "Call " + dayTime(e.call_at) + (e.call_with ? " with " + e.call_with : "")];
    const m = lastMail(e);
    if (waiting(e)) return ["warn", "Client is waiting for a reply (" + ago(m.at) + ")"];
    if (e.status === "Paid") return ["ok", "Paid – start the work"];
    if (e.status === "Quote sent" || e.status === "Engagement sent") return ["calm", e.status + " – waiting for client"];
    if (m) return ["calm", "We replied " + ago(m.at)];
    if (e.form_at) return ["warn", "New enquiry – not answered yet"];
    return ["calm", "No action needed"];
  }

  const emails = n => n === 1 ? "1 email" : n + " emails";
  function steps(e) {
    const m = lastMail(e);
    return el("div", { class: "enq-steps" },
      el("span", { class: e.form_at ? "done" : "" }, e.form_at ? "Form " + day(e.form_at) : "No form"),
      el("span", { class: e.call_at ? "done" : "" }, e.call_at ? "Call " + day(e.call_at) : "No call"),
      el("span", { class: m ? "done" : "" }, m ? emails((e.sheryar_count || 0) + (e.fiza_count || 0)) : "No emails"));
  }

  function mailBox(e, who, key) {
    const at = e[key + "_last_at"];
    return el("div", { class: "enq-box" },
      el("h4", {}, who + "'s email"),
      at ? [
        el("p", {}, "Last email: ", el("b", {}, dayTime(at)), " (" + ago(at) + ")"),
        el("p", {}, "Last message from: ", el("b", {}, e[key + "_last_from"] === "Client" ? "the client" : who)),
        e[key + "_count"] ? el("p", {}, "Emails so far: " + e[key + "_count"]) : "",
        e[key + "_said"] ? el("div", { class: "enq-quote" }, e[key + "_said"]) : "",
        e[key + "_link"] ? el("p", { style: "margin-top:8px" }, el("a", { href: e[key + "_link"], target: "_blank", rel: "noopener noreferrer" }, "Open the email in " + who + "'s Gmail →")) : "",
      ] : el("p", { class: "muted" }, "No emails with this client."));
  }

  function row(e) {
    const [cls, text] = nextStep(e);
    const st = el("select", { "aria-label": "Status" }, statuses.map(s => el("option", { value: s, selected: s === e.status }, s)));
    const notes = el("textarea", { "aria-label": "Notes", placeholder: "Notes for the team", maxlength: "3000" });
    notes.value = e.notes || "";
    const m = el("div", { class: "m", role: "status" });
    const save = el("button", { class: "btn small", type: "button", onclick: async () => {
      save.disabled = true;
      try {
        await api("/api/admin/enquiries/" + e.id, { method: "PUT", body: { status: st.value, notes: notes.value } });
        e.status = st.value; e.notes = notes.value;
        msg(m, "Saved.", true);
        render();
      } catch (err) { msg(m, err.message); }
      save.disabled = false;
    } }, "Save");

    const wrap = el("div", { class: "enq-row" });
    const head = el("button", { type: "button", class: "enq-head", "aria-expanded": "false", onclick: () => {
      const open = wrap.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    } },
      el("div", { class: "enq-who" }, el("b", {}, e.name || e.email.split("@")[0]), el("small", {}, e.email)),
      el("div", { class: "enq-svc" }, e.service || el("span", { class: "muted" }, "Service not given"), steps(e)),
      el("div", { class: "enq-next " + cls }, text),
      el("div", { style: "display:flex;gap:10px;align-items:center" }, pill(e.status), el("span", { class: "enq-arrow", "aria-hidden": "true" }, "›")));

    const body = el("div", { class: "enq-body" },
      el("div", { class: "enq-grid" },
        el("div", { class: "enq-box" },
          el("h4", {}, "Website form"),
          e.form_at ? el("p", {}, "Filled on ", el("b", {}, dayTime(e.form_at))) : el("p", { class: "muted" }, "This client did not use the website form."),
          e.phone ? el("p", {}, "Phone: ", el("a", { href: "tel:" + e.phone.replace(/[^\d+]/g, "") }, e.phone)) : "",
          el("p", {}, "Email: ", el("a", { href: "mailto:" + e.email }, e.email)),
          e.query ? el("div", { class: "enq-quote" }, e.query) : ""),
        el("div", { class: "enq-box" },
          el("h4", {}, "Call"),
          e.call_at
            ? [el("p", {}, el("b", {}, dayTime(e.call_at)), e.call_with ? " with " + e.call_with : ""),
               e.call_booked_at ? el("p", { class: "muted" }, "Booked on " + dayTime(e.call_booked_at)) : "",
               el("p", { class: "muted" }, callUpcoming(e) ? "Coming up" : "This call has already happened")]
            : el("p", { class: "muted" }, "No call booked.")),
        mailBox(e, "Sheryar", "sheryar"),
        mailBox(e, "Fiza", "fiza")),
      el("div", { class: "enq-save" }, st, notes, save),
      m);

    wrap.append(head, body);
    return wrap;
  }

  function filtered() {
    const q = $("enqSearch").value.trim().toLowerCase();
    return items.filter(e => {
      if (q && ![e.name, e.email, e.service, e.phone].join(" ").toLowerCase().includes(q)) return false;
      if (view === "new") return e.status === "New";
      if (view === "calls") return callUpcoming(e);
      if (view === "waiting") return waiting(e);
      if (view === "open") return !closed(e);
      return true;
    }).sort((a, b) => {
      // waiting clients first, then upcoming calls (soonest first), then newest activity
      const rank = e => waiting(e) ? 0 : callUpcoming(e) ? 1 : closed(e) ? 3 : 2;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (rank(a) === 1) return t(a.call_at) - t(b.call_at);
      const latest = e => Math.max(t(e.form_at), t(e.call_booked_at), t(e.sheryar_last_at), t(e.fiza_last_at));
      return latest(b) - latest(a);
    });
  }

  function summary() {
    const n = { open: items.filter(e => !closed(e)).length, new: items.filter(e => e.status === "New").length,
      calls: items.filter(callUpcoming).length, waiting: items.filter(waiting).length };
    const btn = (key, cls, label) => el("button", { type: "button", class: cls, "aria-pressed": view === key ? "true" : "false",
      onclick: () => { view = view === key ? "all" : key; render(); } }, el("b", {}, String(n[key])), el("span", {}, label));
    $("enqSum").replaceChildren(
      btn("waiting", "warn", "Waiting for our reply"),
      btn("calls", "ok", "Calls coming up"),
      btn("new", "", "New enquiries"),
      btn("open", "", "All open"));
    $("enqCount").textContent = n.waiting ? "(" + n.waiting + ")" : "";
  }

  function render() {
    summary();
    const list = filtered();
    $("enqBox").replaceChildren(list.length
      ? el("div", { class: "enq-list" }, list.map(row))
      : el("div", { class: "card" }, el("p", { class: "muted" }, view === "all" ? "No enquiries yet." : "Nothing here right now. Tap the box again to see everyone.")));
  }

  async function load() {
    try {
      const r = await api("/api/admin/enquiries");
      statuses = r.statuses; items = r.items;
      $("enqSync").textContent = r.lastSync
        ? "Updated " + ago(r.lastSync) + " from Sheryar's and Fiza's Gmail and calendar (every 15 minutes). Tap a client to see the details."
        : "Waiting for the first update from Gmail.";
      render();
    } catch (err) { msg($("enqBox"), err.message); }
  }

  let tm;
  $("enqSearch").addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(render, 150); });
  document.querySelector('[data-tab="tEnquiries"]').addEventListener("click", () => { if (!loaded) { loaded = true; load(); } });
  setTimeout(() => { if (!$("app").classList.contains("hide")) load(); else setTimeout(load, 1500); }, 800);
})();
