const $ = s => document.querySelector(s);
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



/* ===== REVELACIÓN CÓSMICA DE PORTADA ===== */

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

  let luces = [];
  let particulas = [];

  let lx = -999;
  let ly = -999;

  const d = Math.min(devicePixelRatio || 1,1.5);

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

    foto();

  }

  img.onload = () => {
    listo = true;
    ajustar();
  };

  img.onerror = () => ajustar();

  img.src = 'media/portada.jpg';

  addEventListener('resize',ajustar);

  function destello(px,py){

    luces.push({
      x:px,
      y:py,
      radio:0,
      vida:1100,
      t:performance.now()
    });

    for(let i=0;i<9;i++){

      particulas.push({

        x:px,
        y:py,

        vx:(Math.random()-.5)*1.8,
        vy:(Math.random()-.5)*1.8,

        size:1 + Math.random()*2.2,
        vida:500 + Math.random()*500,
        t:performance.now()

      });

    }

    if(!corriendo){

      corriendo = true;
      requestAnimationFrame(cuadro);

    }

  }

  function cuadro(ahora){

    a.clearRect(0,0,w,h);
    foto();

    b.clearRect(0,0,w,h);

    luces = luces.filter(
      l => ahora-l.t < l.vida
    );

    particulas = particulas.filter(
      p => ahora-p.t < p.vida
    );

    luces.forEach(l => {

      const tiempo = (ahora-l.t)/l.vida;

      l.radio = 12 + tiempo*24;

      const opacidad = 1-tiempo;

      const gradiente = b.createRadialGradient(
        l.x,l.y,0,
        l.x,l.y,l.radio
      );

      gradiente.addColorStop(0,`rgba(255,255,255,${opacidad*.9})`);
      gradiente.addColorStop(.25,`rgba(205,180,255,${opacidad*.55})`);
      gradiente.addColorStop(.65,`rgba(139,92,255,${opacidad*.2})`);
      gradiente.addColorStop(1,'rgba(139,92,255,0)');

      b.fillStyle = gradiente;

      b.beginPath();
      b.arc(l.x,l.y,l.radio,0,Math.PI*2);
      b.fill();

    });

    particulas.forEach(p => {

      const tiempo = (ahora-p.t)/p.vida;
      const opacidad = 1-tiempo;

      p.x += p.vx;
      p.y += p.vy;

      b.globalAlpha = opacidad;
      b.fillStyle = '#e9e6ff';
      b.shadowColor = '#a78bfa';
      b.shadowBlur = 12;

      b.beginPath();
      b.arc(p.x,p.y,p.size,0,Math.PI*2);
      b.fill();

    });

    b.globalAlpha = 1;
    b.shadowBlur = 0;

    if(luces.length || particulas.length){

      requestAnimationFrame(cuadro);

    }else{

      corriendo = false;
      b.clearRect(0,0,w,h);

    }

  }

  const mover = (cx,cy) => {

    const r = caja.getBoundingClientRect();

    const px = cx-r.left;
    const py = cy-r.top;

    if(Math.hypot(px-lx,py-ly)>16){

      lx = px;
      ly = py;

      destello(px,py);

    }

  };

  caja.addEventListener('pointermove',e => {

    if(e.pointerType==='mouse'){
      mover(e.clientX,e.clientY);
    }

  });

  caja.addEventListener('pointerdown',e => {

    const r = caja.getBoundingClientRect();

    destello(
      e.clientX-r.left,
      e.clientY-r.top
    );

  });

  caja.addEventListener('touchmove',e => {

    mover(
      e.touches[0].clientX,
      e.touches[0].clientY
    );

  },{passive:true});

}
/* ===== ROSTRO CÓSMICO INTERACTIVO ===== */

(() => {

  const canvas = $('#cosmicFace');
  if(!canvas) return;

  const ctx = canvas.getContext('2d', { alpha:true });
  const source = new Image();
  source.src = 'media/rostro-cosmico.png';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x:-10000, y:-10000, active:false };
  const particles = [];
  let W = 0, H = 0, dpr = 1;
  let layout = null;
  let animationId = null;
  let lastTime = 0;

  const settings = {
    sampleStep: 4,
    maxParticles: 17000,
    radius: 155,
    push: 7.5,
    spring: 0.018,
    friction: 0.91
  };

  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    if(source.complete && source.naturalWidth){
      positionTargets();
    }
  }

  function positionTargets(){
    const ratio = source.naturalWidth / source.naturalHeight;
    const mobile = W < 700;
    const targetHeight = Math.min(H * (mobile ? .72 : .91), W / ratio * (mobile ? 1.05 : 1.18));
    const targetWidth = targetHeight * ratio;

    /* La imagen ya tiene el rostro en 3/4, con ojos cerrados y mirando arriba a la izquierda. */
    layout = {
      width:targetWidth,
      height:targetHeight,
      left:W - targetWidth + (mobile ? targetWidth * .02 : targetWidth * .02),
      top:H - targetHeight + (mobile ? targetHeight * .08 : targetHeight * .02)
    };

    particles.forEach(p => {
      p.tx = layout.left + p.ox * layout.width;
      p.ty = layout.top + p.oy * layout.height;
    });
  }

  function buildParticles(){
    const off = document.createElement('canvas');
    off.width = source.naturalWidth;
    off.height = source.naturalHeight;
    const offCtx = off.getContext('2d', { willReadFrequently:true });
    offCtx.drawImage(source,0,0);
    const pixels = offCtx.getImageData(0,0,off.width,off.height).data;
    const step = settings.sampleStep;

    for(let y = 0; y < off.height; y += step){
      for(let x = 0; x < off.width; x += step){
        const index = (y * off.width + x) * 4;
        const alpha = pixels[index + 3];
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const brightness = (r + g + b) / 3;

        /* El umbral descarta el negro y conserva el rostro, el polvo y los filamentos luminosos. */
        if(alpha < 30 || brightness < 48) continue;
        if(particles.length >= settings.maxParticles) break;

        const ox = x / off.width;
        const oy = y / off.height;
        const color = brightness > 205
          ? '238,239,255'
          : (b > r * 1.12 ? '174,181,255' : '210,211,224');

        particles.push({
          ox, oy,
          tx:0, ty:0,
          x:0, y:0,
          vx:0, vy:0,
          size:.45 + Math.random() * 1.05,
          alpha:.35 + Math.random() * .55,
          phase:Math.random() * Math.PI * 2,
          speed:.55 + Math.random() * 1.35,
          color
        });
      }
    }

    positionTargets();
    particles.forEach(p => { p.x = p.tx; p.y = p.ty; });
    if(!reduceMotion) startAnimation();
    else drawFrame(performance.now());
  }

  function onPointerMove(event){
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function onPointerLeave(){
    pointer.active = false;
    pointer.x = -10000;
    pointer.y = -10000;
  }

  function drawFrame(now){
    const dt = Math.min(2,(now - (lastTime || now)) / 16.67 || 1);
    lastTime = now;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    const radius = settings.radius;
    const radius2 = radius * radius;

    for(const p of particles){
      let ax = (p.tx - p.x) * settings.spring;
      let ay = (p.ty - p.y) * settings.spring;

      if(pointer.active){
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if(dist2 < radius2 && dist2 > .01){
          const dist = Math.sqrt(dist2);
          const influence = 1 - dist / radius;
          const force = influence * influence * settings.push;
          ax += (dx / dist) * force;
          ay += (dy / dist) * force;
        }
      }

      /* Pequeña deriva orgánica: el rostro respira sin perder su forma. */
      const shimmer = Math.sin(now * .0011 * p.speed + p.phase);
      ax += Math.sin(now * .00035 + p.phase) * .006;
      ay += Math.cos(now * .00032 + p.phase) * .006;

      p.vx = (p.vx + ax * dt) * Math.pow(settings.friction,dt);
      p.vy = (p.vy + ay * dt) * Math.pow(settings.friction,dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const twinkle = .68 + (shimmer + 1) * .16;
      const alpha = Math.max(.08,Math.min(1,p.alpha * twinkle));
      const size = p.size * (shimmer > .82 ? 1.45 : 1);

      ctx.fillStyle = `rgba(${p.color},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x,p.y,size,0,Math.PI * 2);
      ctx.fill();

      if(shimmer > .94 && p.size > .9){
        ctx.strokeStyle = `rgba(225,229,255,${alpha * .42})`;
        ctx.lineWidth = .55;
        ctx.beginPath();
        ctx.moveTo(p.x - 2.4,p.y);
        ctx.lineTo(p.x + 2.4,p.y);
        ctx.moveTo(p.x,p.y - 2.4);
        ctx.lineTo(p.x,p.y + 2.4);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    if(!reduceMotion) animationId = requestAnimationFrame(drawFrame);
  }

  function startAnimation(){
    if(animationId === null){
      lastTime = 0;
      animationId = requestAnimationFrame(drawFrame);
    }
  }

  source.onload = () => {
    resize();
    buildParticles();
  };

  source.onerror = () => {
    console.error('No se pudo cargar media/rostro-cosmico.png. Revisa el nombre y la ubicación del archivo.');
  };

  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',onPointerMove,{passive:true});
  window.addEventListener('pointerleave',onPointerLeave);
  window.addEventListener('blur',onPointerLeave);

  resize();

})();


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
    lightbox && !lightbox.classList.contains('active')
  ){

    photoTimer = setInterval(() => {

      moveCarousel(1);

    },10000);

  }

}


/* Flechas */

if(photoPrev) photoPrev.addEventListener('click',() => moveCarousel(-1));
if(photoNext) photoNext.addEventListener('click',() => moveCarousel(1));


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

if(lightboxClose) lightboxClose.addEventListener('click',closeLightbox);


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

if(photoCards.length && lightbox){
  renderCarousel();
  restartPhotoTimer();
}
