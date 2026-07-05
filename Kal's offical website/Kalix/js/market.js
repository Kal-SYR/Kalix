// ============================================================
//  KALIX — MARKET PAGE SCRIPT
//  Live price walk on .stock-price · canvas sparklines
// ============================================================

// ---------- LIVE PRICE RANDOM WALK ----------
const priceEls = document.querySelectorAll(".stock-price");
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
    void el.offsetWidth;
    el.classList.add(drift >= 0 ? "flash-up" : "flash-down");
    setTimeout(() => el.classList.remove("flash-up", "flash-down"), 900);
  });
}, 3000);

// ---------- CANVAS SPARKLINES ----------
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
    for (let i = 0; i < 80; i++) {
      v += (Math.random() - 0.5 + trend * 0.05) * 8;
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
      if (tick % 5 === 0) {
        points.shift();
        v += (Math.random() - 0.5 + trend * 0.05) * 8;
        v = Math.min(95, Math.max(5, v));
        points.push(v);
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // baseline grid
      ctx.strokeStyle = "rgba(126,165,214,.12)";
      ctx.lineWidth = 1;
      for (let g = 1; g < 4; g++) {
        const gy = (h / 4) * g;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

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
      grad.addColorStop(0, color + "30");
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
