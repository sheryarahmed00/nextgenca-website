(function () {
  const { api, msg, busy } = window.P;
  const f = document.getElementById("staffForm");
  const m = f.querySelector(".m");
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const username = f.username.value.trim(), password = f.password.value;
    if (!username || !password) { msg(m, "Enter your username and password."); return; }
    busy(f, true);
    try {
      await api("/api/staff/login", { method: "POST", body: { username, password } });
      location.replace("/portal-admin");
    } catch (err) {
      msg(m, err.message);
      f.password.value = "";
      busy(f, false);
    }
  });
})();
