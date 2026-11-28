// Admin Settings: "My login" card to set a username + password for /staff-login
(function () {
  const { api, el, msg, busy } = window.P;
  const box = document.getElementById("tSettings");
  if (!box) return;

  const user = el("input", { name: "username", autocomplete: "username", autocapitalize: "none", spellcheck: "false", maxlength: "24", placeholder: "e.g. sheryar" });
  const pass = el("input", { name: "password", type: "password", autocomplete: "new-password", maxlength: "200", placeholder: "At least 10 characters" });
  const pass2 = el("input", { name: "password2", type: "password", autocomplete: "new-password", maxlength: "200" });
  const m = el("div", { class: "m", role: "status" });
  const status = el("p", { class: "muted" }, "");
  const form = el("form", { novalidate: true },
    el("div", { class: "grid2" },
      el("div", {}, el("label", {}, "Username"), user),
      el("div", {}, el("label", {}, "New password"), pass),
      el("div", {}, el("label", {}, "Type the password again"), pass2)),
    el("p", { style: "margin-top:12px" }, el("button", { class: "btn", type: "submit" }, "Save my login")),
    m);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (pass.value !== pass2.value) { msg(m, "The two passwords do not match."); return; }
    busy(form, true);
    try {
      const r = await api("/api/staff/password", { method: "POST", body: { username: user.value, password: pass.value } });
      pass.value = pass2.value = "";
      msg(m, "Saved. From now on you can log in at nextgenca.co.uk/staff-login with username \"" + r.username + "\".", true);
      status.textContent = "Your username: " + r.username;
    } catch (err) { msg(m, err.message); }
    busy(form, false);
  });

  box.prepend(el("div", { class: "card" },
    el("h2", {}, "My login"),
    el("p", { class: "muted" }, "Set a username and password for the staff login page (nextgenca.co.uk/staff-login). Each person sets their own. Saving signs you out on other devices."),
    status, form));

  // Reset a client's password + authenticator (e.g. lost phone). They then log in once by email code and set up again.
  const rEmail = el("input", { type: "email", placeholder: "client@email.com", autocomplete: "off" });
  const rMsg = el("div", { class: "m", role: "status" });
  const rForm = el("form", { novalidate: true },
    el("label", {}, "Client email"), rEmail,
    el("p", { style: "margin-top:12px" }, el("button", { class: "btn line", type: "submit" }, "Reset this client's login")), rMsg);
  rForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!rEmail.value.trim()) return;
    busy(rForm, true);
    try { await api("/api/portal-auth/reset", { method: "POST", body: { email: rEmail.value.trim() } });
      msg(rMsg, "Done. " + rEmail.value.trim() + " must now log in with an email code and set a new password and authenticator.", true); rEmail.value = ""; }
    catch (err) { msg(rMsg, err.message); }
    busy(rForm, false);
  });
  box.append(el("div", { class: "card" },
    el("h2", {}, "Client login reset"),
    el("p", { class: "muted" }, "Clients log in with email + password + a code from an authenticator app. If a client loses their phone or forgets the password, reset it here."),
    rForm));

  // Forced first step: anyone without a fresh password must set one before using the dashboard.
  function forceNewPassword(r) {
    const fu = el("input", { autocomplete: "username", autocapitalize: "none", spellcheck: "false", maxlength: "24", value: r.username || "" });
    const fp = el("input", { type: "password", autocomplete: "new-password", maxlength: "200", placeholder: "At least 10 characters" });
    const fp2 = el("input", { type: "password", autocomplete: "new-password", maxlength: "200" });
    const fm = el("div", { class: "m", role: "status" });
    const f = el("form", { novalidate: true },
      el("label", {}, "Username"), fu,
      el("label", {}, "New password"), fp,
      el("label", {}, "Type the new password again"), fp2,
      el("p", { style: "margin-top:16px" }, el("button", { class: "btn gold", type: "submit" }, "Save and continue")), fm);
    const ov = el("div", { class: "force-pass", role: "dialog", "aria-modal": "true" },
      el("div", { class: "card" },
        el("h2", {}, "Set a new password"),
        el("p", { class: "muted" }, "For security, please choose a new password before you continue. You will use this username and password at nextgenca.co.uk/staff-login from now on."),
        f));
    f.addEventListener("submit", async e => {
      e.preventDefault();
      if (fp.value !== fp2.value) { msg(fm, "The two passwords do not match."); return; }
      busy(f, true);
      try {
        const x = await api("/api/staff/password", { method: "POST", body: { username: fu.value, password: fp.value } });
        status.textContent = "Your username: " + x.username; user.value = x.username;
        ov.remove(); document.body.classList.remove("locked");
      } catch (err) { msg(fm, err.message); }
      busy(f, false);
    });
    document.body.append(ov); document.body.classList.add("locked"); fp.focus();
  }

  api("/api/staff/me").then(r => {
    if (r.username) { status.textContent = "Your username: " + r.username; user.value = r.username; }
    else status.textContent = "You have not set a username yet.";
    if (r.mustChange) forceNewPassword(r);
  }).catch(() => {});
})();
