// ============================================================
//  KALIX — FIREBASE CONFIG  (plain script version)
// ============================================================
//  These keys are NOT secret — Firebase web keys are meant to
//  live in client code.
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyAIS1h0s9Y8XTFIwy_2VoTovEfyy8wPZNI",
  authDomain:        "kaldatabase.firebaseapp.com",
  projectId:         "kaldatabase",
  storageBucket:     "kaldatabase.firebasestorage.app",
  messagingSenderId: "43389903720",
  appId:             "1:43389903720:web:b71deb3400e6111855acdd",
  measurementId:     "G-KN676E8P8D"
};

// Flag so pages can warn you if keys are still placeholders.
window.KALIX_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialize Firebase safely. If anything is off, we log a clear
// message instead of letting it silently kill login.js.
try {
  if (typeof firebase === "undefined") {
    throw new Error("Firebase SDK didn't load. Check the <script> tags / your internet.");
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.KALIX_FIREBASE_READY = true;
  console.log("[KALIX] Firebase initialized ✓");
} catch (e) {
  window.KALIX_FIREBASE_READY = false;
  window.KALIX_FIREBASE_ERROR = e;
  console.error("[KALIX] Firebase init failed:", e);
}
