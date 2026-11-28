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

  api("/api/staff/me").then(r => {
    if (r.username) { status.textContent = "Your username: " + r.username; user.value = r.username; }
    else status.textContent = "You have not set a username yet.";
  }).catch(() => {});
})();
