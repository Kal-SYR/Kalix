// ============================================================
//  KALIX — HOME PAGE SCRIPT
//  Boot sequence · headline reveal · tilt · mouse glow
//  Live price walk · canvas sparklines
// ============================================================

// ---------- BOOT SEQUENCE ----------
(function bootSequence() {
  const boot = document.getElementById("boot");
  const status = document.getElementById("bootStatus");
  if (!boot) return;

  const lines = [
    "ESTABLISHING UPLINK…",
    "SYNCING NEURAL CORE…",
    "STREAMING MARKET FEED…",
    "ACCESS GRANTED"
  ];
  lines.forEach((line, i) => {
    setTimeout(() => { if (status) status.textContent = line; }, i * 350);
  });

  setTimeout(() => boot.classList.add("done"), 1450);
})();

// ---------- HEADLINE WORD REVEAL ----------
(function splitHeadline() {
  const h1 = document.querySelector(".hero h1");
  if (!h1) return;

  const words = h1.textContent.trim().split(/\s+/);
  h1.textContent = "";
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "w";
    span.textContent = word;
    span.style.animationDelay = (1.55 + i * 0.09) + "s";
    h1.appendChild(span);
    if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
  });
})();

// ---------- HERO VISUAL TILT ----------
(function heroTilt() {
  const visual = document.getElementById("heroVisual");
  if (!visual || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // wait for the frame-in animation to finish before enabling tilt
  setTimeout(() => {
    visual.classList.add("tilting");

    visual.addEventListener("mousemove", (e) => {
      const r = visual.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      visual.style.transform =
        `perspective(900px) rotateY(${px * 7}deg) rotateX(${py * -7}deg)`;
    });

    visual.addEventListener("mouseleave", () => {
      visual.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }, 2800);
})();

// ---------- MOUSE GLOW EFFECT ----------
document.addEventListener("mousemove", (e) => {
  const glow = document.querySelector(".g1");
  if (!glow) return;
  const x = e.clientX / 25;
  const y = e.clientY / 25;
  glow.style.transform = `translate(${x}px, ${y}px)`;
});

// ---------- LIVE PRICE RANDOM WALK ----------
const priceEls = document.querySelectorAll(".price");
const basePrices = [];

priceEls.forEach((el) => {
  basePrices.push(parseFloat(el.textContent.replace(/[$,]/g, "")) || 10000);
});

setInterval(() => {
  priceEls.forEach((el, i) => {
    const drift = basePrices[i] * (Math.random() - 0.48) * 0.012;
    basePrices[i] = Math.max(500, basePrices[i] + drift);

    el.textContent = "$" + Math.round(basePrices[i]).toLocaleString();
    el.classList.remove("flash-up", "flash-down");
    void el.offsetWidth; // restart transition
    el.classList.add(drift >= 0 ? "flash-up" : "flash-down");
    setTimeout(() => el.classList.remove("flash-up", "flash-down"), 900);
  });
}, 3000);

// ---------- CANVAS SPARKLINES ----------
// Shared with market.js style: any <canvas class="spark" data-trend="up|down">
(function initSparks() {
  const canvases = document.querySelectorAll("canvas.spark");
  if (!canvases.length) return;

  const CYAN = "#5fe0ff";
  const UP = "#41e69e";
  const DOWN = "#ff5d7a";

  canvases.forEach((canvas) => {
    const trend = canvas.dataset.trend === "down" ? -1 : 1;
    const color = canvas.dataset.trend === "down" ? DOWN : UP;
    const ctx = canvas.getContext("2d");

    let points = [];
    let v = 50;
    for (let i = 0; i < 60; i++) {
      v += (Math.random() - 0.5 + trend * 0.06) * 8;
      v = Math.min(95, Math.max(5, v));
      points.push(v);
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let tick = 0;
    function draw() {
      tick++;
      if (tick % 6 === 0) {
        points.shift();
        v += (Math.random() - 0.5 + trend * 0.06) * 8;
        v = Math.min(95, Math.max(5, v));
        points.push(v);
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // area fill
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - (p / 100) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color + "33");
      grad.addColorStop(1, color + "00");
      ctx.fillStyle = grad;
      ctx.fill();

      // line
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - (p / 100) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = CYAN;
      ctx.stroke();
      ctx.shadowBlur = 0;

      requestAnimationFrame(draw);
    }
    draw();
  });
})();
