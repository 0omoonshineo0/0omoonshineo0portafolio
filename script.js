const $ = s => document.querySelector(s);
const conMouse = matchMedia('(hover:hover) and (pointer:fine)').matches;
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== RELOJ ===== */

const reloj = $('#clock');

const hora = () => {
  reloj.textContent = new Date().toTimeString().slice(0, 5);
};

hora();
setInterval(hora, 20000);


/* ===== VIDEOS DE VIMEO ===== */

document.querySelectorAll('.vid').forEach(v => {

  const id = (v.dataset.vimeo || '').trim();

  if(id){
    v.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

});


/* ===== CURSOR MÁGICO ===== */

if(conMouse && !sinMovimiento){

  document.body.classList.add('fx');

  const c = $('#trail');
  const x = c.getContext('2d');

  const dpr = Math.min(devicePixelRatio || 1, 2);

  let W, H;

  const medir = () => {

    W = innerWidth;
    H = innerHeight;

    c.width = W * dpr;
    c.height = H * dpr;

    x.setTransform(dpr, 0, 0, dpr, 0, 0);

  };

  medir();
  addEventListener('resize', medir);

  const VIOLETA = [139, 92, 255];
  const CIAN = [39, 194, 238];

  const COL = [
    [139, 92, 255],
    [205, 188, 255],
    [39, 194, 238],
    [255, 255, 255]
  ];

  const N = 20;

  const m = {
    x:-200,
    y:-200,
    vx:0,
    vy:0,
    ok:false,
    hover:0
  };

  const cola = Array.from(
    {length:N},
    () => ({x:-200,y:-200})
  );

  const aura = {x:-200,y:-200,r:26};

  let chispas = [];
  let ondas = [];

  function chispa(px,py,burst){

    const a = Math.random() * 6.283;

    const s = burst
      ? 0.8 + Math.random() * 2.6
      : 0.2 + Math.random() * 0.7;

    chispas.push({

      x:px + (Math.random() - .5) * 8,
      y:py + (Math.random() - .5) * 8,

      vx:Math.cos(a) * s,
      vy:Math.sin(a) * s - .25,

      t:performance.now(),
      L:700 + Math.random() * 900,

      r:1 + Math.random() * 2.6,

      c:COL[Math.random() * 4 | 0],
      ph:Math.random() * 6.283

    });

  }

  addEventListener('pointermove', e => {

    m.vx = e.clientX - m.x;
    m.vy = e.clientY - m.y;

    m.x = e.clientX;
    m.y = e.clientY;

    if(!m.ok){

      m.ok = true;

      cola.forEach(p => {
        p.x = m.x;
        p.y = m.y;
      });

      aura.x = m.x;
      aura.y = m.y;

    }

    const n = Math.min(
      3,
      Math.hypot(m.vx,m.vy) / 14 | 0
    );

    for(let i = 0; i < n; i++){
      chispa(m.x,m.y);
    }

    m.hover = e.target.closest && e.target.closest('a') ? 1 : 0;

  });

  addEventListener('pointerdown', e => {

    ondas.push({
      x:e.clientX,
      y:e.clientY,
      t:performance.now()
    });

    for(let i = 0; i < 18; i++){
      chispa(e.clientX,e.clientY,true);
    }

  });

  const estrella = (px,py,r,rot) => {

    x.beginPath();

    for(let i = 0; i < 8; i++){

      const a = rot + i * Math.PI / 4;
      const d = i % 2 ? r * .28 : r;

      x.lineTo(
        px + Math.cos(a) * d,
        py + Math.sin(a) * d
      );

    }

    x.closePath();
    x.fill();

  };

  (function bucle(now){

    x.clearRect(0,0,W,H);

    x.globalCompositeOperation = 'lighter';

    const vel = Math.min(
      1,
      Math.hypot(m.vx,m.vy) / 40
    );

    m.vx *= .9;
    m.vy *= .9;

    /* Cola del cursor */

    cola[0].x = m.x;
    cola[0].y = m.y;

    for(let i = 1; i < N; i++){

      const p = cola[i];
      const q = cola[i - 1];
      const k = .34 - i * .004;

      p.x += (q.x - p.x) * k +
        Math.sin(now / 260 + i * .7) * .1 * vel * i;

      p.y += (q.y - p.y) * k +
        Math.cos(now / 300 + i * .6) * .1 * vel * i;

    }

    x.lineCap = 'round';
    x.shadowColor = 'rgba(139,92,255,.9)';
    x.shadowBlur = 14;

    for(let i = N - 1; i > 0; i--){

      const f = i / N;
      const k = Math.pow(1 - f,1.4);

      const col = VIOLETA.map(
        (v,j) => v + (CIAN[j] - v) * f | 0
      );

      x.strokeStyle = `rgba(${col},${k * .85})`;
      x.lineWidth = .6 + k * 6 * (.5 + vel * .8);

      x.beginPath();
      x.moveTo(cola[i].x,cola[i].y);
      x.lineTo(cola[i - 1].x,cola[i - 1].y);
      x.stroke();

    }

    x.shadowBlur = 0;

    /* Aura */

    aura.x += (m.x - aura.x) * .16;
    aura.y += (m.y - aura.y) * .16;

    aura.r += ((26 + m.hover * 16) - aura.r) * .12;

    const g = x.createRadialGradient(
      aura.x,aura.y,0,
      aura.x,aura.y,aura.r * 1.8
    );

    g.addColorStop(0,'rgba(205,188,255,.35)');
    g.addColorStop(1,'rgba(139,92,255,0)');

    x.fillStyle = g;
    x.beginPath();
    x.arc(aura.x,aura.y,aura.r * 1.8,0,6.283);
    x.fill();

    /* Destellos */

    chispas = chispas.filter(
      s => now - s.t < s.L
    );

    chispas.forEach(s => {

      const k = 1 - (now - s.t) / s.L;

      s.x += s.vx;
      s.y += s.vy;

      s.vx *= .985;
      s.vy = s.vy * .985 - .004;

      x.fillStyle = `rgba(${s.c},${k * (.6 + .4 * Math.sin(now / 80 + s.ph))})`;

      if(s.r > 0){

        estrella(
          s.x,
          s.y,
          s.r * 3.3 * k + 1,
          now / 700 + s.ph
        );

      }else{

        x.beginPath();
        x.arc(s.x,s.y,s.r * k + .4,0,6.283);
        x.fill();

      }

    });

    /* Ondas al hacer clic */

    ondas = ondas.filter(
      o => now - o.t < 700
    );

    ondas.forEach(o => {

      const k = (now - o.t) / 700;

      x.strokeStyle = `rgba(205,188,255,${1 - k})`;
      x.lineWidth = 1;

      x.beginPath();
      x.arc(o.x,o.y,8 + k * 70,0,6.283);
      x.stroke();

    });

    /* Punta del cursor */

    x.shadowColor = 'rgba(139,92,255,1)';
    x.shadowBlur = 12;
    x.fillStyle = '#fff';

    estrella(
      m.x,
      m.y,
      8 + m.hover * 4,
      now / 1400
    );

    x.shadowBlur = 0;

    requestAnimationFrame(bucle);

  })(performance.now());

}


/* ===== EFECTO DE QUEMADO DE PORTADA ===== */

if(!sinMovimiento){

  const caja = $('#burn');
  const A = $('#photo');
  const B = $('#fire');

  const a = A.getContext('2d');
  const b = B.getContext('2d');

  const img = new Image();

  let listo = false;
  let w,h;
  let corriendo = false;

  let manchas = [];
  let brasas = [];

  let lx = -999;
  let ly = -999;

  const d = Math.min(devicePixelRatio || 1,1.5);

  const VIDA = 5200;

  function foto(){

    if(listo){

      const s = Math.max(
        w / img.width,
        h / img.height
      );

      const iw = img.width * s;
      const ih = img.height * s;

      a.drawImage(
        img,
        (w - iw) / 2,
        (h - ih) / 2,
        iw,
        ih
      );

    }else{

      const g = a.createLinearGradient(0,0,w,h);

      g.addColorStop(0,'#2a0a3d');
      g.addColorStop(1,'#5a0a1f');

      a.fillStyle = g;
      a.fillRect(0,0,w,h);

    }

  }

  function ajustar(){

    w = caja.clientWidth;
    h = caja.clientHeight;

    [A,B].forEach(c => {
      c.width = w * d;
      c.height = h * d;
    });

    a.setTransform(d,0,0,d,0,0);
    b.setTransform(d,0,0,d,0,0);

    if(!corriendo){
      foto();
    }

  }

  img.onload = () => {
    listo = true;
    ajustar();
  };

  img.onerror = () => ajustar();

  img.src = 'media/portada.jpg';

  addEventListener('resize',ajustar);

  const escala = t => {

    const e = Math.min(1,t / 450);
    const grow = 1 - Math.pow(1 - e,3);

    return t < 2600
      ? grow
      : grow * Math.max(0,1 - (t - 2600) / (VIDA - 2600));

  };

  function cada(ahora,k,fn){

    manchas.forEach(m => {

      const sc = escala(ahora - m.t);

      m.l.forEach(l => {

        fn(
          m.x + Math.cos(l.a) * l.d * m.R * sc,
          m.y + Math.sin(l.a) * l.d * m.R * sc,
          l.r * m.R * sc * k
        );

      });

    });

  }

  const trazar = (ctx,ahora,k) => {

    ctx.beginPath();

    cada(ahora,k,(px,py,r) => {

      if(r > .5){
        ctx.moveTo(px + r,py);
        ctx.arc(px,py,r,0,6.283);
      }

    });

  };

  function quemar(px,py){

    manchas.push({

      x:px,
      y:py,

      R:70 + Math.random() * 55,
      t:performance.now(),

      l:Array.from(
        {length:7},
        () => ({
          a:Math.random() * 6.283,
          d:Math.random() * .7,
          r:.45 + Math.random() * .5
        })
      )

    });

    if(!corriendo){

      corriendo = true;
      requestAnimationFrame(cuadro);

    }

  }

  function cuadro(ahora){

    manchas = manchas.filter(
      m => ahora - m.t < VIDA
    );

    /* Foto y borde */

    a.globalCompositeOperation = 'source-over';
    a.clearRect(0,0,w,h);

    foto();

    a.fillStyle = 'rgba(12,0,8,.92)';
    trazar(a,ahora,1.18);
    a.fill();

    a.globalCompositeOperation = 'destination-out';
    trazar(a,ahora,1);
    a.fill();

    a.globalCompositeOperation = 'source-over';

    /* Brillo */

    b.globalCompositeOperation = 'source-over';
    b.clearRect(0,0,w,h);

    b.shadowColor = '#8b5cff';
    b.shadowBlur = 28;
    b.fillStyle = '#d9c2ff';

    trazar(b,ahora,1);
    b.fill();

    b.shadowBlur = 0;
    b.globalCompositeOperation = 'destination-out';

    trazar(
      b,
      ahora,
      0.84 + 0.03 * Math.sin(ahora / 90)
    );

    b.fill();
    b.globalCompositeOperation = 'source-over';

    /* Brasas */

    if(manchas.length && Math.random() < .7){

      const m = manchas[
        Math.random() * manchas.length | 0
      ];

      brasas.push({

        x:m.x + (Math.random() - .5) * m.R,
        y:m.y + (Math.random() - .5) * m.R,

        vx:(Math.random() - .5) * .6,
        vy:-.6 - Math.random() * 1.2,

        t:ahora

      });

    }

    brasas = brasas.filter(
      e => ahora - e.t < 1400
    );

    brasas.forEach(e => {

      const k = 1 - (ahora - e.t) / 1400;

      e.x += e.vx;
      e.y += e.vy;

      b.fillStyle = `rgba(${170 + k * 60 | 0},${130 + k * 90 | 0},255,${k})`;

      b.fillRect(e.x,e.y,2.2,2.2);

    });

    if(manchas.length || brasas.length){

      requestAnimationFrame(cuadro);

    }else{

      corriendo = false;

      a.clearRect(0,0,w,h);
      foto();

      b.clearRect(0,0,w,h);

    }

  }

  const mover = (cx,cy) => {

    const r = caja.getBoundingClientRect();

    const px = cx - r.left;
    const py = cy - r.top;

    if(Math.hypot(px - lx,py - ly) > 28){

      lx = px;
      ly = py;

      quemar(px,py);

    }

  };

  caja.addEventListener('pointermove',e => {

    if(e.pointerType === 'mouse'){
      mover(e.clientX,e.clientY);
    }

  });

  caja.addEventListener('pointerdown',e => {

    const r = caja.getBoundingClientRect();

    quemar(
      e.clientX - r.left,
      e.clientY - r.top
    );

  });

  caja.addEventListener('touchmove',e => {

    mover(
      e.touches[0].clientX,
      e.touches[0].clientY
    );

  },{passive:true});

}


/* ===== CARRUSEL MOONSHINE ===== */

const photoCards = [...document.querySelectorAll('.photo-card')];

const photoPrev = $('#photoPrev');
const photoNext = $('#photoNext');

const lightbox = $('#photoLightbox');
const lightboxImg = $('#lightboxImg');
const lightboxTitle = $('#lightboxTitle');
const lightboxClose = $('#lightboxClose');

let photoIndex = 0;
let photoTimer = null;

function renderCarousel(){

  const total = photoCards.length;

  photoCards.forEach((card,i) => {

    let offset = (i - photoIndex + total) % total;

    if(offset > total / 2){
      offset -= total;
    }

    const visible = Math.abs(offset) <= 1;

    card.style.setProperty('--offset',offset);

    card.style.setProperty(
      '--scale',
      offset === 0 ? 1 : .78
    );

    card.style.setProperty(
      '--opacity',
      visible ? (offset === 0 ? 1 : .65) : 0
    );

    card.style.setProperty(
      '--layer',
      offset === 0 ? 3 : 2
    );

    card.classList.toggle(
      'is-center',
      offset === 0
    );

    card.style.pointerEvents = visible ? 'auto' : 'none';

    card.setAttribute(
      'aria-hidden',
      visible ? 'false' : 'true'
    );

  });

}


/* Desplazamiento */

function moveCarousel(direction){

  photoIndex = (
    photoIndex + direction + photoCards.length
  ) % photoCards.length;

  renderCarousel();
  restartPhotoTimer();

}


/* Temporizador automático */

function restartPhotoTimer(){

  clearInterval(photoTimer);

  if(
    !sinMovimiento &&
    !lightbox.classList.contains('active')
  ){

    photoTimer = setInterval(() => {

      moveCarousel(1);

    },10000);

  }

}


/* Flechas */

photoPrev.addEventListener('click',() => {
  moveCarousel(-1);
});

photoNext.addEventListener('click',() => {
  moveCarousel(1);
});


/* Abrir fotografía ampliada */

photoCards.forEach(card => {

  card.addEventListener('click',() => {

    const img = card.querySelector('img');

    if(!img) return;

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

    lightboxTitle.textContent =
      card.dataset.title || card.dataset.l || '';

    lightbox.classList.add('active');

    lightbox.setAttribute('aria-hidden','false');

    document.body.style.overflow = 'hidden';

    clearInterval(photoTimer);

  });

});


/* Cerrar ventana */

function closeLightbox(){

  lightbox.classList.remove('active');

  lightbox.setAttribute('aria-hidden','true');

  document.body.style.overflow = '';

  restartPhotoTimer();

}

lightboxClose.addEventListener('click',closeLightbox);


/* Cerrar al hacer clic fuera */

lightbox.addEventListener('click',e => {

  if(e.target === lightbox){
    closeLightbox();
  }

});


/* Cerrar con Escape */

document.addEventListener('keydown',e => {

  if(
    e.key === 'Escape' &&
    lightbox.classList.contains('active')
  ){

    closeLightbox();

  }

});


/* Iniciar carrusel */

if(photoCards.length){

  renderCarousel();
  restartPhotoTimer();

}
