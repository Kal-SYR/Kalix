// ============================================================
//  KALIX — LOGIN LOGIC  (Firebase compat, plain script)
// ============================================================

const REDIRECT = "index.html";          // where to go after login

// ---------- element refs ----------
const form       = document.getElementById("authForm");
const nameField  = document.getElementById("nameField");
const nameInput  = document.getElementById("name");
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const submitBtn  = document.getElementById("submitBtn");
const googleBtn  = document.getElementById("googleBtn");
const forgotBtn  = document.getElementById("forgotBtn");
const switchBtn  = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");
const authSub    = document.getElementById("authSub");
const authTitle  = document.querySelector(".auth-title");
const msg        = document.getElementById("authMsg");

let mode = "login"; // or "signup"
const onFile = location.protocol === "file:";

// ---------- helpers ----------
function showMsg(text, type = "error") {
  msg.textContent = text;
  msg.className = "auth-msg " + type;
}
function clearMsg() { msg.textContent = ""; msg.className = "auth-msg"; }

function setLoading(isLoading) {
  submitBtn.disabled = googleBtn.disabled = isLoading;
  submitBtn.textContent = isLoading
    ? "Please wait…"
    : (mode === "login" ? "Sign in" : "Create account");
}

function friendlyError(err) {
  const map = {
    "auth/invalid-email":          "That email address doesn't look right.",
    "auth/user-not-found":         "No account found with that email.",
    "auth/wrong-password":         "Incorrect email or password.",
    "auth/invalid-credential":     "Incorrect email or password.",
    "auth/email-already-in-use":   "An account already exists with that email.",
    "auth/weak-password":          "Password should be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Try again in a moment.",
    "auth/popup-closed-by-user":   "Google sign-in was cancelled.",
    "auth/popup-blocked":          "Your browser blocked the popup. Allow popups and retry.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/operation-not-allowed":  "This sign-in method isn't enabled yet (Firebase console -> Authentication -> Sign-in method).",
    "auth/operation-not-supported-in-this-environment":
      "Google sign-in needs http://localhost or a real website, not a file."
  };
  return map[err && err.code] || (err && err.message) || "Something went wrong. Please try again.";
}

// ---------- Firebase readiness guard ----------
// If firebase-config.js failed to initialize, we DON'T let the page die —
// we show a clear message and keep the UI usable.
let auth = null;
if (window.KALIX_FIREBASE_READY && typeof firebase !== "undefined") {
  try { auth = firebase.auth(); } catch (e) { auth = null; }
}
if (!auth) {
  showMsg("Login is offline — Firebase didn't start. Press F12 -> Console to see why, or re-check firebase-config.js.", "error");
}

function ready() {
  if (!auth) {
    showMsg("Firebase isn't running yet. Check firebase-config.js / the console (F12).", "error");
    return false;
  }
  return true;
}

// ---------- toggle login / signup ----------
function setMode(next) {
  mode = next;
  clearMsg();
  if (mode === "signup") {
    authTitle.textContent  = "CREATE ACCOUNT";
    authSub.textContent    = "Join the KALIX trading network.";
    nameField.hidden       = false;
    submitBtn.textContent  = "Create account";
    switchText.textContent = "Already have an account?";
    switchBtn.textContent  = "Sign in";
    passInput.setAttribute("autocomplete", "new-password");
  } else {
    authTitle.textContent  = "SECURE ACCESS";
    authSub.textContent    = "Sign in to enter the KALIX trading network.";
    nameField.hidden       = true;
    submitBtn.textContent  = "Sign in";
    switchText.textContent = "Don't have an account?";
    switchBtn.textContent  = "Create one";
    passInput.setAttribute("autocomplete", "current-password");
  }
}
switchBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

// ---------- email / password submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();            // stops the page from reloading (the "?" reload)
  clearMsg();
  if (!ready()) return;

  const email = emailInput.value.trim();
  const pass  = passInput.value;

  if (!email || !pass) { showMsg("Please enter your email and password."); return; }
  if (mode === "signup" && pass.length < 6) {
    showMsg("Password should be at least 6 characters."); return;
  }

  setLoading(true);
  try {
    if (mode === "signup") {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const name = nameInput.value.trim();
      if (name) await cred.user.updateProfile({ displayName: name });
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
    }
    showMsg("Success — redirecting…", "ok");
    setTimeout(() => (window.location.href = REDIRECT), 700);
  } catch (err) {
    showMsg(friendlyError(err));
    setLoading(false);
  }
});

// ---------- Google sign-in ----------
googleBtn.addEventListener("click", async () => {
  clearMsg();
  if (!ready()) return;
  if (onFile) {
    showMsg("Google sign-in only works when served (http://localhost or a real website), not opened as a file. Email + password works either way.");
    return;
  }
  setLoading(true);
  try {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showMsg("Success — redirecting…", "ok");
    setTimeout(() => (window.location.href = REDIRECT), 700);
  } catch (err) {
    showMsg(friendlyError(err));
    setLoading(false);
  }
});

// ---------- forgot password ----------
forgotBtn.addEventListener("click", async () => {
  clearMsg();
  if (!ready()) return;
  const email = emailInput.value.trim();
  if (!email) { showMsg("Enter your email above first, then tap “Forgot password?”."); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    showMsg("Password reset link sent — check your inbox.", "ok");
  } catch (err) {
    showMsg(friendlyError(err));
  }
});

// ---------- already signed in? skip the login screen ----------
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = REDIRECT;
  });
}
