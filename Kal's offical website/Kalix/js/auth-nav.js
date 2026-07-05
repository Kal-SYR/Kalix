// ============================================================
//  KALIX — NAV AUTH STATE  (Firebase compat, plain script)
//  Fills <li id="authSlot"> with Login (logged out) or
//  the user's name + Logout (logged in).
// ============================================================

(function () {
  if (typeof firebase === "undefined" || !firebase.apps.length) return;
  const auth = firebase.auth();
  const slot = document.getElementById("authSlot");
  if (!slot) return;

  auth.onAuthStateChanged((user) => {
    if (user) {
      const name = user.displayName || user.email || "Trader";
      slot.innerHTML =
        '<span class="nav-user">' + name + '</span> ' +
        '<a href="#" id="logoutBtn">Logout</a>';
      document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = "login.html";
      });
    } else {
      slot.innerHTML = '<a href="login.html">Login</a>';
    }
  });
})();
