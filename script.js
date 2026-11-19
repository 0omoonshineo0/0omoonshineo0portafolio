const $ = s => document.querySelector(s);
const conMouse = matchMedia('(hover:hover) and (pointer:fine)').matches;
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== RELOJ ===== */
const reloj = $('#clock');
const hora = () => { reloj.textContent = new Date().toTimeString().slice(0, 5); };
hora(); setInterval(hora, 20000);

/* ===== VIDEOS DE VIMEO ===== */
document.querySelectorAll('.vid').forEach(v => {
  const id = (v.dataset.vimeo || '').trim();
  if (id) v.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
});

/* ===== CURSOR CON ESTELA (ajustes del GlowCursor, en magenta) ===== */
if (conMouse && !sinMovimiento) {
  document.body.classList.add('fx');
  const AJ = { color: '255,31,169', intensity: 1.5, trailWidth: 1, linger: 5, glow: 0.5 };
  const c = $('#trail'), x = c.getContext('2d'), star = $('#star');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const vida = AJ.linger * 110;           // cuánto dura la estela (ms)
  let W, H, pts = [], chispas = [];

  const medir = () => {
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  medir(); addEventListener('resize', medir);

  addEventListener('pointermove', e => {
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    star.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  });
  addEventListener('pointerdown', e => {            // explosión al hacer clic
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * 6.283, s = 1 + Math.random() * 4;
      chispas.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: performance.now() });
    }
  });

  (function bucle(ahora) {
    x.clearRect(0, 0, W, H);
    pts = pts.filter(p => ahora - p.t < vida);
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.shadowColor = `rgba(${AJ.color},1)`;
    x.shadowBlur = 30 * AJ.glow * AJ.intensity;
    for (let i = 1; i < pts.length; i++) {
      const k = 1 - (ahora - pts[i].t) / vida;
      x.strokeStyle = `rgba(${AJ.color},${Math.min(1, k * AJ.intensity)})`;
      x.lineWidth = (1 + k * 5) * AJ.trailWidth;
      x.beginPath(); x.moveTo(pts[i - 1].x, pts[i - 1].y); x.lineTo(pts[i].x, pts[i].y); x.stroke();
    }
    chispas = chispas.filter(s => ahora - s.t < 650);
    chispas.forEach(s => {
      const k = 1 - (ahora - s.t) / 650;
      s.x += s.vx; s.y += s.vy; s.vx *= .96; s.vy *= .96;
      x.fillStyle = `rgba(255,${120 + k * 110 | 0},230,${k})`;
      x.beginPath(); x.arc(s.x, s.y, 1 + k * 2.2, 0, 6.283); x.fill();
    });
    requestAnimationFrame(bucle);
  })(performance.now());
}

/* ===== EFECTO DE QUEMADO SOLO EN LA FOTO DE PORTADA ===== */
if (!sinMovimiento) {
  const caja = $('#burn'), A = $('#photo'), B = $('#fire');
  const a = A.getContext('2d'), b = B.getContext('2d');
  const img = new Image();
  let listo = false, w, h, corriendo = false, manchas = [], brasas = [], lx = -999, ly = -999;
  const d = Math.min(devicePixelRatio || 1, 1.5);
  const VIDA = 5200;                                // ms hasta que el fuego desaparece del todo

  function foto() {
    if (listo) {
      const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
      a.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    } else {
      const g = a.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#2a0a3d'); g.addColorStop(1, '#5a0a1f');
      a.fillStyle = g; a.fillRect(0, 0, w, h);
    }
  }
  function ajustar() {
    w = caja.clientWidth; h = caja.clientHeight;
    [A, B].forEach(c => { c.width = w * d; c.height = h * d; });
    a.setTransform(d, 0, 0, d, 0, 0); b.setTransform(d, 0, 0, d, 0, 0);
    if (!corriendo) foto();
  }
  img.onload = () => { listo = true; ajustar(); };
  img.onerror = () => ajustar();
  img.src = 'media/portada.jpg';
  addEventListener('resize', ajustar);

  // tamaño de cada mancha: crece rápido, se queda y luego se "regenera"
  const escala = t => {
    const e = Math.min(1, t / 450), grow = 1 - Math.pow(1 - e, 3);
    return t < 2600 ? grow : grow * Math.max(0, 1 - (t - 2600) / (VIDA - 2600));
  };
  // recorre todos los "lóbulos" de todas las manchas (así el borde queda irregular)
  function cada(ahora, k, fn) {
    manchas.forEach(m => {
      const sc = escala(ahora - m.t);
      m.l.forEach(l => fn(m.x + Math.cos(l.a) * l.d * m.R * sc, m.y + Math.sin(l.a) * l.d * m.R * sc, l.r * m.R * sc * k));
    });
  }
  const trazar = (ctx, ahora, k) => {
    ctx.beginPath();
    cada(ahora, k, (px, py, r) => { if (r > 0.5) { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, 6.283); } });
  };

  function quemar(px, py) {
    manchas.push({
      x: px, y: py, R: 70 + Math.random() * 55, t: performance.now(),
      l: Array.from({ length: 7 }, () => ({ a: Math.random() * 6.283, d: Math.random() * 0.7, r: 0.45 + Math.random() * 0.5 }))
    });
    if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
  }

  function cuadro(ahora) {
    manchas = manchas.filter(m => ahora - m.t < VIDA);

    // 1) foto + borde chamuscado + hueco
    a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, w, h); foto();
    a.fillStyle = 'rgba(12,0,8,.92)'; trazar(a, ahora, 1.18); a.fill();
    a.globalCompositeOperation = 'destination-out'; trazar(a, ahora, 1); a.fill();
    a.globalCompositeOperation = 'source-over';

    // 2) brillo magenta en el borde del hueco
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w, h);
    b.shadowColor = '#ff1fa9'; b.shadowBlur = 28; b.fillStyle = '#ff4fd0';
    trazar(b, ahora, 1); b.fill();
    b.shadowBlur = 0; b.globalCompositeOperation = 'destination-out';
    trazar(b, ahora, 0.84 + 0.03 * Math.sin(ahora / 90)); b.fill();
    b.globalCompositeOperation = 'source-over';

    // 3) brasas que suben
    if (manchas.length && Math.random() < 0.7) {
      const m = manchas[Math.random() * manchas.length | 0];
      brasas.push({ x: m.x + (Math.random() - .5) * m.R, y: m.y + (Math.random() - .5) * m.R, vx: (Math.random() - .5) * .6, vy: -.6 - Math.random() * 1.2, t: ahora });
    }
    brasas = brasas.filter(e => ahora - e.t < 1400);
    brasas.forEach(e => {
      const k = 1 - (ahora - e.t) / 1400; e.x += e.vx; e.y += e.vy;
      b.fillStyle = `rgba(255,${120 + k * 100 | 0},230,${k})`; b.fillRect(e.x, e.y, 2.2, 2.2);
    });

    if (manchas.length || brasas.length) requestAnimationFrame(cuadro);
    else { corriendo = false; a.clearRect(0, 0, w, h); foto(); b.clearRect(0, 0, w, h); }
  }

  const mover = (cx, cy) => {
    const r = caja.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
    if (Math.hypot(px - lx, py - ly) > 28) { lx = px; ly = py; quemar(px, py); }
  };
  caja.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') mover(e.clientX, e.clientY); });
  caja.addEventListener('pointerdown', e => quemar(e.clientX - caja.getBoundingClientRect().left, e.clientY - caja.getBoundingClientRect().top));
  caja.addEventListener('touchmove', e => mover(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
}
