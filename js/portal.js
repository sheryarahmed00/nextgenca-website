(function () {
  const { api, el, msg, date, size, pill, table, busy, tabs } = window.P;
  const $ = id => document.getElementById(id);
  const gbp = p => "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let currentEmail = "", turnstileToken = "", turnstileId = null;

  function show(id) { ["stepEmail", "stepCode", "stepSecure", "stepQuote", "dash"].forEach(x => $(x).classList.toggle("hide", x !== id)); }

  async function start() {
    tabs($("authTabs"));
    if (location.hash === "#signup") document.querySelector('[data-tab="tSignup"]').click();
    const qt = new URLSearchParams(location.search).get("quote");
    if (qt && await openQuote(qt)) return;
    try {
      const me = await api("/api/portal/me");
      if (me.role === "admin") { location.replace("/portal-admin"); return; }
      currentEmail = me.email; await afterLogin();
    } catch (e) { show("stepEmail"); }
    try {
      const sl = await api("/api/portal/services-list");
      sl.services.forEach(s => $("sService").append(el("option", { value: s }, s)));
      const cfg = await api("/api/portal/config");
      if (cfg.turnstileSiteKey) {
        window.onTurnstileLoad = () => { turnstileId = window.turnstile.render("#turnstile", { sitekey: cfg.turnstileSiteKey, callback: t => turnstileToken = t }); };
        document.head.append(el("script", { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit", async: true }));
      }
    } catch (e) {}
  }

  // ----- quote link from email -----
  let quoteToken = null;
  async function openQuote(token) {
    try {
      const { quote: q } = await api("/api/portal/quote/" + encodeURIComponent(token));
      if (q.status === "sent" || q.status === "viewed") {
        quoteToken = token;
        $("qNumber").textContent = "Quote " + q.number;
        $("qHello").textContent = "Dear " + q.name + ", thank you for choosing NextGen Chartered Accountant.";
        $("qService").textContent = q.service + (q.period ? " (" + q.period + ")" : "");
        $("qFee").textContent = q.fee;
        $("qValid").textContent = date(q.valid_until);
        if (q.scope) { $("qScope").textContent = q.scope; $("qScopeBox").classList.remove("hide"); }
        show("stepQuote");
        return true;
      }
      $("email").value = q.email;
      show("stepEmail");
      msg($("emailMsg"), q.status === "accepted" || q.status === "invoiced" ? "You have already accepted this quote. Log in below to continue." : "This quote is no longer open (" + q.status + "). Please contact us.", q.status === "accepted" || q.status === "invoiced");
      return true;
    } catch (e) {
      show("stepEmail"); msg($("emailMsg"), e.message); return true;
    }
  }
  $("quoteForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; msg($("quoteMsg"), "");
    if (!f.elements.consent.checked) { msg($("quoteMsg"), "Please tick the box to agree to our privacy notice."); return; }
    busy(f, true);
    try {
      const r = await api("/api/portal/quote/" + quoteToken + "/accept", { method: "POST", body: { consent: true } });
      history.replaceState(null, "", "/portal");
      toCode(r.email, r.message);
    } catch (e) { msg($("quoteMsg"), e.message); }
    busy(f, false);
  });

  function toCode(email, message) {
    currentEmail = email;
    $("codeInfo").textContent = message;
    show("stepCode"); $("code").value = ""; $("code").focus();
  }

  $("emailForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("emailMsg"), "");
    try {
      const email = $("email").value.trim();
      const r = await api("/api/portal/login/request", { method: "POST", body: { email } });
      toCode(email, r.message);
    } catch (e) { msg($("emailMsg"), e.message); }
    busy(f, false);
  });

  $("signupForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("signupMsg"), "");
    const fd = new FormData(f);
    try {
      const body = Object.fromEntries(fd); body.consent = fd.get("consent") === "1"; body.turnstile = turnstileToken;
      const r = await api("/api/portal/signup", { method: "POST", body });
      toCode(body.email.trim(), "We have emailed a 6-digit code to " + body.email.trim() + ". It expires in 10 minutes.");
    } catch (e) {
      msg($("signupMsg"), e.message);
      if (window.turnstile && turnstileId !== null) { window.turnstile.reset(turnstileId); turnstileToken = ""; }
    }
    busy(f, false);
  });

  $("backBtn").addEventListener("click", () => show("stepEmail"));

  // ---- password + authenticator login ----
  $("showEmailLogin").addEventListener("click", () => {
    $("emailForm").classList.remove("hide"); $("email").value = $("pEmail").value; $("email").focus();
  });

  $("passForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("passMsg"), "");
    try {
      const email = $("pEmail").value.trim();
      await api("/api/portal-auth/login", { method: "POST", body: { email, password: $("pPass").value, code: $("pCode").value } });
      currentEmail = email; $("pPass").value = ""; $("pCode").value = "";
      await loadDash();
    } catch (e) { msg($("passMsg"), e.message); $("pCode").value = ""; }
    busy(f, false);
  });

  // After an email-code login: clients without a password + authenticator must set them up first.
  async function afterLogin() {
    let st;
    try { st = await api("/api/portal-auth/status"); } catch (e) { return loadDash(); }
    if (st.enabled) return loadDash();
    show("stepSecure");
    $("who").classList.remove("hide"); $("whoEmail").textContent = currentEmail;
    try {
      const r = await api("/api/portal-auth/setup/start", { method: "POST", body: {} });
      $("setupKey").textContent = r.secret;
      $("otpLink").href = r.uri;
      const qr = window.qrcode(0, "M"); qr.addData(r.uri); qr.make();
      $("qrBox").innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
    } catch (e) { msg($("secureMsg"), e.message); }
  }

  $("secureForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; msg($("secureMsg"), "");
    if ($("nPass").value !== $("nPass2").value) { msg($("secureMsg"), "The two passwords do not match."); return; }
    busy(f, true);
    try {
      await api("/api/portal-auth/setup/finish", { method: "POST", body: { password: $("nPass").value, code: $("nCode").value } });
      $("nPass").value = $("nPass2").value = $("nCode").value = "";
      await loadDash();
    } catch (e) { msg($("secureMsg"), e.message); }
    busy(f, false);
  });

  $("codeForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("codeMsg"), "");
    try {
      const r = await api("/api/portal/login/verify", { method: "POST", body: { email: currentEmail, code: $("code").value } });
      if (r.role === "admin") { location.replace("/portal-admin"); return; }
      await afterLogin();
    } catch (e) { msg($("codeMsg"), e.message); }
    busy(f, false);
  });

  $("logoutBtn").addEventListener("click", async () => {
    try { await api("/api/portal/logout", { method: "POST" }); } catch (e) {}
    location.replace("/portal");
  });

  // Mark big file pickers green once a file is chosen
  document.querySelectorAll(".big-file input").forEach(i => i.addEventListener("change", () => {
    const lab = i.closest(".big-file"); lab.classList.toggle("has", !!i.files[0]);
    const sm = lab.querySelector("small"); if (i.files[0]) sm.textContent = "✓ " + i.files[0].name;
  }));

  $("kycAutoBtn").addEventListener("click", async ev => {
    ev.target.disabled = true; msg($("kycAutoMsg"), "");
    try { const r = await api("/api/portal/kyc/start", { method: "POST" }); location.href = r.url; }
    catch (e) { msg($("kycAutoMsg"), e.message); ev.target.disabled = false; }
  });
  $("kycManualLink").addEventListener("click", ev => {
    ev.preventDefault(); window.__manualKyc = true; $("kycForm").classList.remove("hide"); $("kycForm").scrollIntoView({ behavior: "smooth" });
  });

  $("kycForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; msg($("kycMsg"), "");
    if (!$("kId").files[0] || !$("kAddr").files[0]) { msg($("kycMsg"), "Please add both photos."); return; }
    busy(f, true);
    try { await api("/api/portal/kyc", { method: "POST", body: new FormData(f) }); await loadDash(); window.scrollTo(0, 0); }
    catch (e) { msg($("kycMsg"), e.message); }
    busy(f, false);
  });

  // ---------- step 3 and 4 cards ----------
  function copyRow(label, value) {
    return el("div", {}, el("span", {}, label), el("span", {}, el("b", {}, value), " ",
      el("button", { type: "button", onclick: ev => { navigator.clipboard && navigator.clipboard.writeText(value); ev.target.textContent = "Copied"; } }, "Copy")));
  }
  function agreementCard(e, inv) {
    const box = el("div", { role: "status" });
    const f = el("form", { novalidate: true },
      el("label", { for: "sig" + e.id }, "Type your full name to sign"),
      el("input", { id: "sig" + e.id, name: "name", autocomplete: "name", required: true }),
      el("label", { class: "check" }, el("input", { type: "checkbox", name: "agree", value: "1" }), " I have read and agree to this agreement"),
      el("p", { style: "margin-top:12px" }, el("button", { class: "btn gold wide", type: "submit" }, "Sign agreement")), box);
    f.addEventListener("submit", async ev => {
      ev.preventDefault(); busy(f, true);
      const fd = new FormData(f);
      try { await api("/api/portal/agreement/sign", { method: "POST", body: { engagement_id: e.id, name: fd.get("name"), agree: fd.get("agree") === "1" } }); await loadDash(); }
      catch (err) { msg(box, err.message); busy(f, false); }
    });
    return el("div", { class: "card action" },
      el("h2", {}, "Sign your agreement"),
      el("p", { class: "muted" }, e.service + (e.period ? " · " + e.period : "") + " · " + gbp(e.fee_pence) + (inv ? " · then pay invoice " + inv.number : "")),
      el("div", { class: "letter", tabindex: "0" }, e.letter_text), f);
  }
  function payCard(inv, bank) {
    const box = el("div", { role: "status" });
    const opts = [];
    const stripeBtn = (kind, label, cls) => el("button", { class: cls, type: "button", onclick: async ev => {
      ev.target.disabled = true; msg(box, "");
      try { const r = await api("/api/portal/invoices/" + inv.id + "/checkout", { method: "POST", body: { kind } }); location.href = r.url; }
      catch (err) { msg(box, err.message); ev.target.disabled = false; }
    } }, label);
    if (bank.stripe_card) opts.push(stripeBtn("card", "Pay now: Apple Pay, Google Pay or card", "btn gold wide"));
    else if (bank.pay_link) opts.push(el("a", { class: "btn gold wide", href: bank.pay_link, target: "_blank", rel: "noopener" }, "Pay now (Apple Pay, Google Pay or card)"));
    if (bank.stripe_dd) opts.push(stripeBtn("dd", "Pay by Direct Debit", "btn wide"));
    else if (bank.dd_link) opts.push(el("a", { class: "btn wide", href: bank.dd_link, target: "_blank", rel: "noopener" }, "Pay by Direct Debit"));
    if (bank.account_number) {
      opts.push(el("p", { class: "muted", style: "margin:8px 0 0" }, "Or pay by bank transfer:"));
      opts.push(el("div", { class: "bank" },
        bank.account_name ? copyRow("Name", bank.account_name) : null,
        copyRow("Sort code", bank.sort_code), copyRow("Account", bank.account_number),
        copyRow("Reference", inv.number), bank.bank_name ? el("div", {}, el("span", {}, "Bank"), el("span", {}, bank.bank_name)) : null));
    }
    const said = inv.client_says_paid_at;
    if (said) opts.length = 0;
    const btn = el("button", { class: "btn line wide", type: "button", disabled: !!said, onclick: async ev => {
      ev.target.disabled = true;
      try { await api("/api/portal/invoices/" + inv.id + "/paid-notice", { method: "POST" }); await loadDash(); }
      catch (err) { msg(box, err.message); ev.target.disabled = false; }
    } }, said ? "Thank you, we will confirm your payment shortly" : "I have paid");
    return el("div", { class: "card action" },
      el("h2", {}, "Pay your invoice"),
      el("p", { class: "muted" }, inv.number + " · " + inv.description),
      el("div", { class: "amount" }, gbp(inv.amount_pence)),
      el("div", { class: "paybox" }, opts, btn, box),
      el("p", { class: "muted", style: "margin-top:10px;font-size:.8rem" }, bank.stripe_card ? "Card, Apple Pay, Google Pay and Direct Debit payments are handled securely by Stripe and confirmed here automatically. We never see your card details. For a bank transfer, use the invoice number as the reference." : "Use the invoice number as your payment reference. Card, Direct Debit and bank payments are handled by your bank or the payment provider. We never see your card details."));
  }
  function checklistCard(items) {
    const rows = items.map(it => {
      if (it.done_at) return el("div", { class: "todo done" }, el("b", {}, "✓ " + it.label), el("small", { class: "muted" }, "Received " + date(it.done_at)));
      const box = el("div", { role: "status", style: "width:100%" });
      const inp = el("input", { type: "file", name: "file", accept: "image/*,.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt", style: "max-width:240px" });
      const f = el("form", { class: "row", novalidate: true }, el("input", { type: "hidden", name: "checklist_id", value: it.id }),
        el("input", { type: "hidden", name: "title", value: it.label }), inp, el("button", { class: "btn small", type: "submit" }, "Upload"));
      f.addEventListener("submit", async ev => {
        ev.preventDefault();
        if (!inp.files[0]) { msg(box, "Choose a file or take a photo first."); return; }
        busy(f, true);
        try { await api("/api/portal/upload", { method: "POST", body: new FormData(f) }); await loadDash(); }
        catch (err) { msg(box, err.message); busy(f, false); }
      });
      return el("div", { class: "todo" }, el("b", {}, it.label), f, box);
    });
    return el("div", { class: "card action" }, el("h2", {}, "Send us your documents"),
      el("p", { class: "muted" }, "Take a photo or choose a file for each item. You can come back and finish later."), rows);
  }

  let data = null;
  async function loadDash() {
    try { data = await api("/api/portal/dashboard"); }
    catch (e) { if (e.status === 401) { show("stepEmail"); return; } alert(e.message); return; }
    $("who").classList.remove("hide"); $("whoEmail").textContent = currentEmail || data.client.email;
    const c = data.client || {};
    $("hello").textContent = "Welcome, " + (c.name || "");
    $("company").textContent = c.company || "";

    // which step is the client on?
    const openEng = data.engagements.find(e => e.status === "sent");
    const unpaid = data.invoices.filter(i => i.status === "unpaid");
    const signedUnpaid = unpaid.filter(i => { const e = data.engagements.find(x => x.id === i.engagement_id); return !e || e.status === "signed"; });
    const todo = data.checklist.filter(x => !x.done_at);
    // now = the step the client is on (2 to 4); 5 = everything done
    let now = 5;
    if (c.stage === "kyc") now = 2; else if (c.stage === "review") now = 3;
    else if (openEng || signedUnpaid.length) now = 3; else if (todo.length) now = 4;
    const onboarding = !!c.wanted_service && now < 5;
    $("steps").classList.toggle("hide", !onboarding);
    [...$("steps").children].forEach((li, i) => { const n = i + 1; li.className = n < now ? "done" : n === now ? "now" : ""; });
    $("kycBox").classList.toggle("hide", c.stage !== "kyc");
    if (c.stage === "kyc" && data.kycAuto) {
      $("kycAuto").classList.remove("hide");
      if (!window.__manualKyc) $("kycForm").classList.add("hide");
      // Back from Didit: fetch the result (the webhook may still be on its way)
      if (new URLSearchParams(location.search).get("kyc") && (window.__kycTries = (window.__kycTries || 0) + 1) <= 8) {
        msg($("kycAutoMsg"), "Checking your result… this takes a few seconds.", true);
        setTimeout(async () => { try { await api("/api/portal/kyc/sync", { method: "POST" }); } catch (e) {} loadDash(); }, window.__kycTries === 1 ? 500 : 4000);
      } else if (window.__kycTries > 8) {
        msg($("kycAutoMsg"), "We have not received the result yet. If you finished the check, it may take a few minutes. You can also try again.");
      }
    } else if (c.stage !== "kyc" && new URLSearchParams(location.search).get("kyc")) history.replaceState(null, "", "/portal");
    $("reviewBox").classList.toggle("hide", c.stage !== "review");
    const locked = c.stage === "kyc" || c.stage === "review" || (onboarding && !data.services.length && !data.documents.length && !data.orders.length);
    document.querySelectorAll("#dash .tabs, #dash .tab, #stats").forEach(x => x.classList.toggle("hide-locked", locked));

    const cards = [];
    if (openEng) cards.push(agreementCard(openEng, unpaid.find(i => i.engagement_id === openEng.id)));
    signedUnpaid.forEach(i => cards.push(payCard(i, data.bank || {})));
    if (todo.length) cards.push(checklistCard(data.checklist));
    // Back from Stripe: wait for the confirmation to arrive (webhook) and refresh
    const paidParam = Number(new URLSearchParams(location.search).get("paid"));
    if (paidParam) {
      const pi = data.invoices.find(i => i.id === paidParam);
      if (pi && pi.status === "unpaid" && (window.__paidTries = (window.__paidTries || 0) + 1) <= 10) {
        cards.unshift(el("div", { class: "card action" }, el("h2", {}, "Thank you, confirming your payment…"), el("p", { class: "muted" }, "This usually takes a few seconds. Direct Debit payments take 3 to 5 working days and you can carry on meanwhile.")));
        setTimeout(loadDash, 3000);
      } else history.replaceState(null, "", "/portal");
    }
    $("actionBox").replaceChildren(...cards);

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
    ], data.services, "Nothing here yet. Once we start work for you, it will show here."));

    $("docsBox").replaceChildren(table([
      ["Document", d => el("span", {}, el("b", {}, d.title), el("div", { class: "muted" }, d.filename + " · " + size(d.size)))],
      ["For", d => svcName(d.service_id)],
      ["From", d => d.uploaded_by === "firm" ? "NextGen" : "You"],
      ["Date", d => date(d.created_at)],
      ["", d => el("a", { class: "btn small", href: "/api/portal/documents/" + d.id + "/download" }, "Download")],
    ], data.documents, "No documents yet."));

    const agreements = data.engagements.filter(e => e.status === "signed");
    $("ordersBox").replaceChildren(
      table([
        ["Order", o => el("span", {}, el("b", {}, "#" + o.id + " " + o.service), el("div", { class: "muted" }, o.details))],
        ["Status", o => pill(o.status)],
        ["Placed", o => date(o.created_at)],
        ["Note from NextGen", o => o.firm_note || ""],
      ], data.orders, "You have not placed any orders yet."),
      el("h3", { style: "margin-top:24px" }, "Invoices"),
      table([
        ["Invoice", i => el("b", {}, i.number)], ["For", i => i.description], ["Amount", i => gbp(i.amount_pence)],
        ["Status", i => pill(i.status === "paid" ? "Paid" : i.status === "cancelled" ? "Cancelled" : "Unpaid")], ["Date", i => date(i.created_at)],
      ], data.invoices, "No invoices yet."),
      el("h3", { style: "margin-top:24px" }, "Signed agreements"),
      table([
        ["Service", e => e.service + (e.period ? " · " + e.period : "")], ["Signed by", e => e.signed_name], ["Date", e => date(e.signed_at)],
        ["", e => el("button", { class: "btn line small", type: "button", onclick: ev => { const n = ev.target.closest("tr").nextElementSibling; if (n && n.dataset.letter) { n.remove(); return; } const tr = el("tr", { "data-letter": "1" }, el("td", { colspan: "4" }, el("div", { class: "letter" }, e.letter_text))); ev.target.closest("tr").after(tr); } }, "View")],
      ], agreements, "None yet."));

    const sel = $("oService");
    if (sel.options.length < 2) data.serviceList.forEach(s => sel.append(el("option", { value: s }, s)));
    show("dash");
  }

  $("orderForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const f = ev.target; busy(f, true); msg($("orderMsg"), "");
    try {
      const r = await api("/api/portal/orders", { method: "POST", body: { service: $("oService").value, details: $("oDetails").value } });
      f.reset(); msg($("orderMsg"), "Thank you. Order #" + r.id + " is placed. We will reply within 1 hour during office hours.", true);
      await loadDash();
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
      await loadDash();
    } catch (e) { msg($("upMsg"), e.message); }
    busy(f, false);
  });

  tabs(document.querySelector("#dash"));
  start();
})();
