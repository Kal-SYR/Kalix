// ============================================================
//  KALIX — AI CHAT WIDGET
//  Bottom-right neural assistant. Uses the in-page Claude
//  bridge when available; falls back to onboard responses so
//  it still works on a static deploy. Markup lives in the
//  page (#kxChat); all logic stays here.
// ============================================================

(function kalixChat() {
  const root = document.getElementById("kxChat");
  if (!root) return;

  const launcher = document.getElementById("kxLauncher");
  const panel = document.getElementById("kxPanel");
  const closeBtn = document.getElementById("kxClose");
  const log = document.getElementById("kxLog");
  const form = document.getElementById("kxForm");
  const input = document.getElementById("kxInput");

  const STORE_KEY = "kalix-chat-history-v1";
  const GREETING =
    "KALIX neural assist online. Ask me about the market, the core, or where to find things.";

  let history = [];
  let pending = false;

  // ---------- persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) history = JSON.parse(raw).slice(-40);
    } catch (e) {
      history = [];
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-40)));
    } catch (e) { /* storage unavailable */ }
  }

  // ---------- rendering ----------
  function msgEl(role, text) {
    const wrap = document.createElement("div");
    wrap.className = "kx-msg " + (role === "user" ? "user" : "ai");
    const who = document.createElement("span");
    who.className = "kx-who";
    who.textContent = role === "user" ? "You" : "Core";
    const p = document.createElement("p");
    p.textContent = text;
    wrap.append(who, p);
    return wrap;
  }

  function scrollLog() {
    log.scrollTop = log.scrollHeight;
  }

  function addMsg(role, text, record) {
    log.appendChild(msgEl(role, text));
    if (record !== false) {
      history.push({ role: role, text: text });
      save();
    }
    scrollLog();
  }

  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement("div");
    typingEl.className = "kx-msg ai";
    typingEl.innerHTML =
      '<span class="kx-who">Core</span><p class="kx-dots"><i></i><i></i><i></i></p>';
    log.appendChild(typingEl);
    scrollLog();
  }
  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  // ---------- open / close ----------
  function setOpen(open) {
    root.classList.toggle("open", open);
    launcher.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    if (open) setTimeout(() => input.focus(), 250);
  }

  launcher.addEventListener("click", () =>
    setOpen(!root.classList.contains("open"))
  );
  closeBtn.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("open")) setOpen(false);
  });

  // ---------- live context ----------
  function liveQuotes() {
    const rows = [];
    document.querySelectorAll(".market-panel .card").forEach((card) => {
      const h = card.querySelector("h3");
      const price = card.querySelector(".price");
      const delta = card.querySelector(".green, .red");
      if (!h || !price) return;
      const sym = (h.querySelector(".sym") || h).textContent.trim();
      rows.push(
        sym + " " + price.textContent.trim() + (delta ? " " + delta.textContent.trim() : "")
      );
    });
    return rows.join(" · ");
  }

  function systemPrompt() {
    const quotes = liveQuotes();
    return [
      "You are KALIX AI, the onboard assistant of KALIX, a fictional next-generation neural stock exchange website.",
      "Site map: Home (index.html), About Us (about.html), Market (market.html) with live charts, Login (login.html) for account access.",
      "Tickers are fictional: NEON, CYAI, QNTX, HELIX, VOLT, NOVA.",
      "The home hero shows the 'neural core' — a living, breathing AI orb that reacts to the cursor.",
      quotes ? "Live watchlist right now: " + quotes + "." : "",
      "Voice: calm, precise, lightly futuristic. Plain text only. Maximum 3 short sentences.",
      "Everything here is a simulation; never give real financial advice.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function toApiMessages() {
    const out = [];
    for (const m of history.slice(-14)) {
      const role = m.role === "user" ? "user" : "assistant";
      if (!out.length && role === "assistant") continue;
      if (out.length && out[out.length - 1].role === role) {
        out[out.length - 1].content += "\n" + m.text;
      } else {
        out.push({ role: role, content: m.text });
      }
    }
    return out;
  }

  // ---------- onboard fallback brain ----------
  const IDLE_REPLIES = [
    "Signal received, but the pattern is unclear. Ask about the market, the core, or your account.",
    "That query sits outside my current feed. Try the market, the exchange, or navigation.",
    "Processing… no confident match. I know this exchange best — ask me about it.",
  ];

  function localReply(text) {
    const t = text.toLowerCase();
    if (/(price|market|stock|ticker|watch|chart|trade|trading)/.test(t)) {
      const q = liveQuotes();
      return q
        ? "Live feed // " + q + ". Full depth is on the Market page."
        : "The Market page carries the full live feed.";
    }
    if (/(login|log in|sign|account|register|auth)/.test(t))
      return "Head to Login in the top-right of the nav. Your session syncs across the exchange.";
    if (/(about|who|team|company|kalix)/.test(t))
      return "KALIX is a next-generation neural exchange — real-time analytics and AI-driven insight. The About Us page has the full story.";
    if (/(orb|core|sphere|ball|breath)/.test(t))
      return "That is the neural core. It breathes while the system is live — move your cursor near it and it will notice you.";
    if (/\b(hello|hi|hey|yo)\b/.test(t)) return "Uplink steady. What do you want to know?";
    if (/(help|what can you)/.test(t))
      return "I can read the live watchlist, explain the exchange, or point you to Market, About, or Login.";
    return IDLE_REPLIES[Math.floor(Math.random() * IDLE_REPLIES.length)];
  }

  // ---------- send ----------
  async function send(text) {
    if (pending) return;
    pending = true;
    root.classList.add("busy");
    addMsg("user", text);
    showTyping();

    let reply = "";
    if (window.claude && typeof window.claude.complete === "function") {
      try {
        reply = (
          (await window.claude.complete({
            system: systemPrompt(),
            max_tokens: 300,
            messages: toApiMessages(),
          })) || ""
        ).trim();
      } catch (e) {
        reply = "";
      }
    }
    if (!reply) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 600));
      reply = localReply(text);
    }

    hideTyping();
    addMsg("ai", reply);
    pending = false;
    root.classList.remove("busy");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || pending) return;
    input.value = "";
    send(text);
  });

  // ---------- boot ----------
  load();
  if (history.length) {
    history.forEach((m) => addMsg(m.role, m.text, false));
  } else {
    addMsg("ai", GREETING);
  }
})();
