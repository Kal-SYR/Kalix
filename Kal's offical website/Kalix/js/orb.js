// ============================================================
//  KALIX — NEURAL CORE ORB
//  Living, breathing canvas orb for the home hero.
//  Layers: drift motes · 3D particle orbits · halo · molten
//  core · nucleus that watches the cursor · idle/click pulses
// ============================================================

(function kalixOrb() {
  const canvas = document.getElementById("orbCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const stage = canvas.parentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CYAN = [95, 224, 255];
  const EMBER = [255, 154, 61];

  let W = 0, H = 0, CX = 0, CY = 0, R = 60;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2;
    CY = H / 2;
    R = Math.min(W, H) * 0.23;
  }
  resize();

  // ---------- particle orbits (3 tilted rings) ----------
  const RINGS = [
    { tilt: 1.05, yaw: 0.4, speed: 0.30, wobble: 0.14, count: 44, radius: 1.50 },
    { tilt: 1.90, yaw: 2.2, speed: -0.20, wobble: 0.10, count: 34, radius: 1.78 },
    { tilt: 0.50, yaw: 4.0, speed: 0.14, wobble: 0.18, count: 26, radius: 2.05 },
  ];
  const orbiters = [];
  RINGS.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      orbiters.push({
        ring,
        a: (i / ring.count) * Math.PI * 2,
        size: 0.7 + Math.random() * 1.6,
        ember: Math.random() < 0.05,
        tw: Math.random() * Math.PI * 2,
      });
    }
  });

  // ---------- drift motes (slow rising dust) ----------
  const motes = Array.from({ length: 26 }, () => ({
    x: Math.random(),
    y: Math.random(),
    s: 0.5 + Math.random() * 1.1,
    vy: 0.006 + Math.random() * 0.012,
    ph: Math.random() * Math.PI * 2,
  }));

  // ---------- pointer awareness ----------
  const target = { x: 0, y: 0, hot: 0 };
  const eased = { x: 0, y: 0, hot: 0 };
  window.addEventListener("mousemove", (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    target.x = Math.max(-0.6, Math.min(0.6, nx));
    target.y = Math.max(-0.6, Math.min(0.6, ny));
    target.hot = nx > -0.9 && nx < 0.9 && ny > -0.9 && ny < 0.9 ? 1 : 0;
  });

  // ---------- pulses (idle heartbeat + click) ----------
  const pulses = [];
  function firePulse(strength) {
    pulses.push({ r: 1.02, a: 0.5 * strength, sp: 0.9 + strength * 0.5 });
  }
  stage.addEventListener("click", () => firePulse(1.4));
  let nextIdle = 3000 + Math.random() * 4000;

  // ---------- draw helpers ----------
  function drawMotes() {
    for (const m of motes) {
      const wob = Math.sin(T * 0.8 + m.ph) * 0.01;
      const a = Math.max(0.04, 0.12 + Math.sin(T * 1.4 + m.ph) * 0.08);
      ctx.fillStyle = "rgba(95, 224, 255, " + a + ")";
      ctx.beginPath();
      ctx.arc((m.x + wob) * W, m.y * H, m.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function stepMotes(dt) {
    for (const m of motes) {
      m.y -= m.vy * dt * 10;
      if (m.y < -0.05) {
        m.y = 1.05;
        m.x = Math.random();
      }
    }
  }

  function projectOrbiters(dt, r, ox, oy) {
    const back = [], front = [];
    const f = 6; // perspective strength
    for (const p of orbiters) {
      p.a += dt * p.ring.speed * (1 + eased.hot * 0.8);
      const rr = p.ring.radius + Math.sin(T * 0.7 + p.tw) * p.ring.wobble;

      // circle in the XZ plane
      const x = Math.cos(p.a) * rr;
      const z = Math.sin(p.a) * rr;
      // tilt around X
      const y1 = -z * Math.sin(p.ring.tilt);
      const z1 = z * Math.cos(p.ring.tilt);
      // yaw around Z (screen-space ring orientation)
      const cy = Math.cos(p.ring.yaw), sy = Math.sin(p.ring.yaw);
      const x2 = x * cy - y1 * sy;
      const y2 = x * sy + y1 * cy;

      const persp = f / (f + z1);
      const px = ox + x2 * persp * r;
      const py = oy + y2 * persp * r;
      const behind = z1 > 0;

      // occlude particles passing behind the sphere body
      const dx = px - ox, dy = py - oy;
      const hidden = behind && dx * dx + dy * dy < r * r * 0.92;
      const tw = 0.55 + Math.sin(T * 2.2 + p.tw) * 0.45;
      let alpha = (behind ? 0.3 : 0.78) * tw * persp;
      if (hidden) alpha *= 0.06;

      (behind ? back : front).push({
        px, py,
        s: p.size * persp,
        alpha: Math.min(1, alpha),
        ember: p.ember,
      });
    }
    return { back, front };
  }

  function drawParticles(list) {
    for (const p of list) {
      const c = p.ember ? EMBER : CYAN;
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + p.alpha * 0.25 + ")";
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.s * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + p.alpha + ")";
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHalo(ox, oy, r, glow) {
    const hr = r * 2.7;
    const g = ctx.createRadialGradient(ox, oy, r * 0.5, ox, oy, hr);
    g.addColorStop(0, "rgba(95, 224, 255, " + 0.16 * glow + ")");
    g.addColorStop(0.5, "rgba(24, 153, 194, " + 0.07 * glow + ")");
    g.addColorStop(1, "rgba(24, 153, 194, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, oy, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCore(ox, oy, r, glow) {
    // sphere body — light biased toward the cursor
    const lx = ox - r * 0.35 + eased.x * r * 0.3;
    const ly = oy - r * 0.4 + eased.y * r * 0.3;
    const g = ctx.createRadialGradient(lx, ly, r * 0.1, ox, oy, r);
    g.addColorStop(0, "rgba(235, 252, 255, .95)");
    g.addColorStop(0.25, "rgba(140, 233, 255, .9)");
    g.addColorStop(0.55, "rgba(35, 160, 205, .85)");
    g.addColorStop(0.82, "rgba(10, 60, 96, .9)");
    g.addColorStop(1, "rgba(5, 22, 42, .95)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();

    // molten swirls, clipped inside the sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.985, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      const ang = T * (0.35 + i * 0.13) + i * 2.1;
      const sx = ox + Math.cos(ang) * r * 0.45;
      const sy = oy + Math.sin(ang * 1.3 + i) * r * 0.45;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.75);
      sg.addColorStop(0, "rgba(95, 224, 255, " + (0.14 + glow * 0.08) + ")");
      sg.addColorStop(1, "rgba(95, 224, 255, 0)");
      ctx.fillStyle = sg;
      ctx.fillRect(ox - r, oy - r, r * 2, r * 2);
    }
    ctx.restore();

    // nucleus — the core's "attention", tracks the cursor
    const nx = ox + eased.x * r * 0.22;
    const ny = oy + eased.y * r * 0.22;
    const nr = r * (0.3 + glow * 0.05);
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    ng.addColorStop(0, "rgba(255, 255, 255, .95)");
    ng.addColorStop(0.4, "rgba(190, 245, 255, .55)");
    ng.addColorStop(1, "rgba(120, 230, 255, 0)");
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();

    // rim light
    ctx.strokeStyle = "rgba(140, 236, 255, " + (0.25 + glow * 0.25) + ")";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ox, oy, r, -2.4, -0.6);
    ctx.stroke();
  }

  function drawPulses(dt, ox, oy, r) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += dt * p.sp;
      p.a -= dt * 0.5;
      if (p.a <= 0 || p.r > 3) {
        pulses.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = "rgba(95, 224, 255, " + Math.max(0, p.a) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(ox, oy, r * p.r, r * p.r * 0.96, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ---------- main loop ----------
  let last = performance.now();
  let T = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    T += dt;

    // idle heartbeat pulse
    nextIdle -= dt * 1000;
    if (nextIdle <= 0) {
      firePulse(0.8 + Math.random() * 0.5);
      nextIdle = 4500 + Math.random() * 4500;
    }

    // ease pointer influence
    eased.x += (target.x - eased.x) * 0.04;
    eased.y += (target.y - eased.y) * 0.04;
    eased.hot += (target.hot - eased.hot) * 0.05;

    // breathing — two superposed sines feel organic
    const breath = Math.sin(T * 1.15) * 0.55 + Math.sin(T * 0.53 + 1.7) * 0.45;
    const r = R * (1 + breath * 0.035 + eased.hot * 0.04);
    const ox = CX + eased.x * R * 0.35;
    const oy = CY + eased.y * R * 0.35;
    const glow = 0.5 + breath * 0.18 + eased.hot * 0.3;

    ctx.clearRect(0, 0, W, H);
    stepMotes(dt);
    drawMotes();
    const parts = projectOrbiters(dt, r, ox, oy);
    drawParticles(parts.back);
    drawHalo(ox, oy, r, glow);
    drawCore(ox, oy, r, glow);
    drawPulses(dt, ox, oy, r);
    drawParticles(parts.front);

    if (!reduced) requestAnimationFrame(frame);
  }

  if (reduced) {
    frame(performance.now());
    window.addEventListener("resize", () => {
      resize();
      frame(performance.now());
    });
  } else {
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }
})();
