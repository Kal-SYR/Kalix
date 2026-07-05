
// ---------- SCROLL ANIMATION ----------
const reveals = document.querySelectorAll(".reveal");

function revealCheck() {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealCheck);
window.addEventListener("load", revealCheck);
revealCheck();

// ---------- FAKE LIVE STOCK DATA ----------
const stats = document.getElementById("stats");

const data = [
  { label: "AI Predictions", value: "+1.8M" },
  { label: "Accuracy", value: "99.91%" },
  { label: "Market Scans", value: "24/7" },
  { label: "Volume Simulated", value: "$6.2B" }
];

data.forEach(d => {
  const div = document.createElement("div");
  div.className = "stat-card reveal active";
  div.innerHTML = `<h2>${d.value}</h2><p>${d.label}</p>`;
  stats.appendChild(div);
});

// ---------- SIMPLE LIVE CHART ----------
const canvas = document.getElementById("liveChart");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 200;

let points = Array.from({length: 30}, () => Math.random() * 100);

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.beginPath();
  ctx.strokeStyle = "#5fe0ff";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#5fe0ff";

  points.forEach((p,i)=>{
    let x = i * 14;
    let y = 150 - p;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();

  points.shift();
  points.push(Math.random()*100);

  requestAnimationFrame(draw);
}

draw();

// ---------- PARTICLES SYSTEM ----------
const p = document.getElementById("particles");
const ctxp = p.getContext("2d");

p.width = window.innerWidth;
p.height = window.innerHeight;

let particles = Array.from({length:80}, ()=>({
  x:Math.random()*p.width,
  y:Math.random()*p.height,
  r:Math.random()*2,
  dx:(Math.random()-0.5)*1,
  dy:(Math.random()-0.5)*1
}));

function animateParticles(){
  ctxp.clearRect(0,0,p.width,p.height);

  particles.forEach(pt=>{
    pt.x += pt.dx;
    pt.y += pt.dy;

    if(pt.x<0||pt.x>p.width) pt.dx*=-1;
    if(pt.y<0||pt.y>p.height) pt.dy*=-1;

    ctxp.beginPath();
    ctxp.arc(pt.x,pt.y,pt.r,0,Math.PI*2);
    ctxp.fillStyle="#5fe0ff";
    ctxp.fill();
  });

  requestAnimationFrame(animateParticles);
}

animateParticles();
