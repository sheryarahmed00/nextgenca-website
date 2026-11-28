// Admin: Enquiries & Calls tab. All values inserted with textContent via P.el.
(function () {
  const { api, el, msg, pill } = window.P;
  const $ = id => document.getElementById(id);
  if (!$("tEnquiries")) return;
  let loaded = false, statuses = [];

  function dt(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function mailCell(e, who, key) {
    if (!e[key + "_last_at"]) return el("span", { class: "muted" }, "No emails");
    return el("div", {},
      el("div", {}, el("b", {}, dt(e[key + "_last_at"])), " · last from " + (e[key + "_last_from"] === "Client" ? "client" : who),
        e[key + "_count"] ? " · " + e[key + "_count"] + " emails" : ""),
      el("div", { class: "muted", style: "margin:4px 0" }, e[key + "_said"] || ""),
      e[key + "_link"] ? el("a", { href: e[key + "_link"], target: "_blank", rel: "noopener noreferrer" }, "Open in " + who + "'s Gmail") : "");
  }

  function card(e) {
    const st = el("select", { "aria-label": "Status", style: "width:auto" }, statuses.map(s => el("option", { value: s, selected: s === e.status }, s)));
    const notes = el("textarea", { "aria-label": "Notes", placeholder: "Notes", maxlength: "3000", style: "min-height:60px" });
    notes.value = e.notes || "";
    const m = el("div", { class: "m", role: "status" });
    const save = el("button", { class: "btn small", type: "button", onclick: async () => {
      save.disabled = true;
      try { await api("/api/admin/enquiries/" + e.id, { method: "PUT", body: { status: st.value, notes: notes.value } }); msg(m, "Saved.", true); }
      catch (err) { msg(m, err.message); }
      save.disabled = false;
    } }, "Save");

    return el("div", { class: "card", style: "padding:16px" },
      el("div", { class: "row", style: "justify-content:space-between;gap:10px;flex-wrap:wrap" },
        el("div", {}, el("b", {}, e.name || e.email), e.name ? el("div", { class: "muted" }, e.email) : "",
          e.phone ? el("div", { class: "muted" }, e.phone) : ""),
        pill(e.status)),
      el("div", { class: "grid2", style: "margin-top:10px" },
        el("div", {},
          el("h3", { style: "margin:0 0 4px" }, "Enquiry form"),
          e.form_at ? el("div", {}, "Filled on ", el("b", {}, dt(e.form_at))) : el("div", { class: "muted" }, "No form found"),
          e.service ? el("div", {}, "Service: " + e.service) : "",
          e.query ? el("p", { class: "muted", style: "margin:6px 0 0;white-space:pre-wrap" }, e.query) : ""),
        el("div", {},
          el("h3", { style: "margin:0 0 4px" }, "Call"),
          e.call_at ? el("div", {}, el("b", {}, dt(e.call_at)), e.call_with ? " with " + e.call_with : "") : el("div", { class: "muted" }, "No call booked"),
          e.call_booked_at ? el("div", { class: "muted" }, "Booked on " + dt(e.call_booked_at)) : ""),
        el("div", {}, el("h3", { style: "margin:10px 0 4px" }, "Sheryar's email"), mailCell(e, "Sheryar", "sheryar")),
        el("div", {}, el("h3", { style: "margin:10px 0 4px" }, "Fiza's email"), mailCell(e, "Fiza", "fiza"))),
      el("div", { class: "row", style: "gap:8px;margin-top:12px;align-items:flex-start;flex-wrap:wrap" }, st, notes, save),
      m);
  }

  let t;
  async function load() {
    const q = encodeURIComponent($("enqSearch").value), s = encodeURIComponent($("enqFilter").value);
    try {
      const r = await api("/api/admin/enquiries?q=" + q + "&status=" + s);
      if (!statuses.length) {
        statuses = r.statuses;
        statuses.forEach(x => $("enqFilter").append(el("option", { value: x }, x)));
      }
      const n = r.items.filter(x => x.status === "New").length;
      $("enqCount").textContent = n ? "(" + n + ")" : "";
      $("enqSync").textContent = r.lastSync ? "Last synced " + dt(r.lastSync) + ". Updates every 15 minutes from Sheryar's and Fiza's Gmail and calendar." : "Waiting for the first sync from Gmail.";
      $("enqBox").replaceChildren(...(r.items.length ? r.items.map(card) : [el("p", { class: "muted" }, "No enquiries yet.")]));
    } catch (err) { msg($("enqBox"), err.message); }
  }

  $("enqSearch").addEventListener("input", () => { clearTimeout(t); t = setTimeout(load, 250); });
  $("enqFilter").addEventListener("change", load);
  document.querySelector('[data-tab="tEnquiries"]').addEventListener("click", () => { if (!loaded) { loaded = true; load(); } });
  // count badge on first paint
  setTimeout(() => { if (!$("app").classList.contains("hide")) load(); else setTimeout(load, 1500); }, 800);
})();
