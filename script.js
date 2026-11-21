
const $ = s => document.querySelector(s);
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* =====================================================
   RELOJ
===================================================== */
const reloj = $('#clock');
const hora = () => {
  if(reloj){
    reloj.textContent = new Date().toTimeString().slice(0, 5);
  }
};
hora();
setInterval(hora, 20000);
/* =====================================================
   CARRUSEL DE VIDEOS MOONSHINE
===================================================== */

/* =====================================================
   CARRUSEL DE VIDEOS MOONSHINE
   VIDRIO CÓSMICO + DESEMPEÑADO + PARTÍCULAS
===================================================== */

(() => {

  const track = $('#videoTrack');
  const prev = $('#videoPrev');
  const next = $('#videoNext');

  if(!track || !prev || !next) return;

  const espacios = [...track.querySelectorAll('.vid')];
  const videos = [];

  /* ===== ACTIVAR VIDEOS CON ENLACE ===== */

  espacios.forEach((card, index) => {

    const id = (card.dataset.vimeo || '').trim();

    if(!id){
      card.hidden = true;
      return;
    }

    card.hidden = false;
    card.classList.add('is-active');

    let iframe = card.querySelector('iframe');

    if(!iframe){

      iframe = document.createElement('iframe');

      iframe.src = `https://player.vimeo.com/video/${id}`;
      iframe.title = `Video ${index + 1}`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';

      card.appendChild(iframe);

    }

    videos.push(card);

  });


  /* ===== EFECTO DE CRISTAL EN CADA MARCO ===== */

  if(!sinMovimiento){

    videos.forEach(card => {

      const canvas = document.createElement('canvas');

      canvas.className = 'vid-glass';
      canvas.setAttribute('aria-hidden', 'true');

      card.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      let W = 0;
      let H = 0;
      let dpr = 1;

      let zonas = [];
      let particulas = [];

      let lx = -999;
      let ly = -999;

      let animando = false;


      /* ===== FIGURA REDONDEADA ===== */

      function roundedRect(context, x, y, width, height, radius){

        const r = Math.min(radius, width / 2, height / 2);

        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + width - r, y);
        context.quadraticCurveTo(x + width, y, x + width, y + r);
        context.lineTo(x + width, y + height - r);
        context.quadraticCurveTo(
          x + width, y + height,
          x + width - r, y + height
        );
        context.lineTo(x + r, y + height);
        context.quadraticCurveTo(
          x, y + height,
          x, y + height - r
        );
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();

      }


      /* ===== AJUSTAR CANVAS ===== */

      function ajustar(){

        const rect = card.getBoundingClientRect();

        W = rect.width;
        H = rect.height;

        if(!W || !H) return;

        dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        zonas = [];
        particulas = [];

        iniciarAnimacion();

      }


      /* ===== VIDRIO EMPAÑADO DEL MARCO ===== */

      function dibujarGlass(){

        ctx.clearRect(0, 0, W, H);

        const gradiente = ctx.createLinearGradient(0, 0, W, H);

        gradiente.addColorStop(0, 'rgba(130,230,255,.34)');
        gradiente.addColorStop(.45, 'rgba(25,115,155,.23)');
        gradiente.addColorStop(1, 'rgba(2,20,48,.42)');

        ctx.fillStyle = gradiente;

        /* Marco exterior */

        roundedRect(ctx, 0, 0, W, H, 21);

        /* Hueco central: deja libre el reproductor */

        roundedRect(
          ctx,
          10, 10,
          W - 20, H - 20,
          13
        );

        ctx.fill('evenodd');


        /* Bruma suave */

        ctx.save();

        ctx.globalCompositeOperation = 'source-atop';

        for(let i = 0; i < 12; i++){

          const x = (i * 73.7) % W;
          const y = (i * 41.3) % H;
          const radio = 15 + (i % 4) * 8;

          const nube = ctx.createRadialGradient(
            x, y, 0,
            x, y, radio
          );

          nube.addColorStop(0, 'rgba(190,245,255,.23)');
          nube.addColorStop(.6, 'rgba(70,180,220,.09)');
          nube.addColorStop(1, 'rgba(30,120,180,0)');

          ctx.fillStyle = nube;
          ctx.beginPath();
          ctx.arc(x, y, radio, 0, Math.PI * 2);
          ctx.fill();

        }

        ctx.restore();


        /* Desempañado local */

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        zonas.forEach(z => {

          const edad = performance.now() - z.t;

          const fuerza = edad < 180
            ? edad / 180
            : Math.max(0, 1 - (edad - 180) / 1900);

          if(fuerza <= 0) return;

          const radio = 34;

          const grad = ctx.createRadialGradient(
            z.x, z.y, 0,
            z.x, z.y, radio
          );

          grad.addColorStop(0, `rgba(255,255,255,${fuerza})`);
          grad.addColorStop(.55, `rgba(255,255,255,${fuerza * .85})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(z.x, z.y, radio, 0, Math.PI * 2);
          ctx.fill();

        });

        ctx.restore();

      }


      /* ===== ESTRELLAS DE CUATRO PUNTAS ===== */

      function estrella(x, y, s){

        ctx.beginPath();

        ctx.moveTo(x, y - s * 2);
        ctx.quadraticCurveTo(x + s * .25, y - s * .25, x + s * 2, y);
        ctx.quadraticCurveTo(x + s * .25, y + s * .25, x, y + s * 2);
        ctx.quadraticCurveTo(x - s * .25, y + s * .25, x - s * 2, y);
        ctx.quadraticCurveTo(x - s * .25, y - s * .25, x, y - s * 2);

        ctx.closePath();
        ctx.fill();

      }


      /* ===== POLVO ESTELAR ===== */

      function emitir(x, y, cantidad = 2){

        for(let i = 0; i < cantidad; i++){

          const angulo = Math.random() * Math.PI * 2;
          const velocidad = .2 + Math.random() * .8;

          particulas.push({

            x: x + (Math.random() - .5) * 8,
            y: y + (Math.random() - .5) * 8,

            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad,

            size: .6 + Math.random() * 1.4,
            estrella: Math.random() < .45,

            vida: 500 + Math.random() * 650,
            t: performance.now()

          });

        }

      }


      /* ===== DIBUJAR PARTÍCULAS ===== */

      function dibujarParticulas(ahora){

        particulas = particulas.filter(
          p => ahora - p.t < p.vida
        );

        particulas.forEach(p => {

          const vida = 1 - (ahora - p.t) / p.vida;

          p.x += p.vx;
          p.y += p.vy;

          p.vx *= .985;
          p.vy *= .985;

          ctx.globalAlpha = vida;
          ctx.fillStyle = '#d9faff';
          ctx.shadowColor = '#35d8ff';
          ctx.shadowBlur = 8;

          if(p.estrella){

            estrella(p.x, p.y, p.size);

          }else{

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

          }

        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

      }


      /* ===== ANIMACIÓN ===== */

      function cuadro(){

        const ahora = performance.now();

        dibujarGlass();
        dibujarParticulas(ahora);

        zonas = zonas.filter(z => ahora - z.t < 2200);

        if(zonas.length || particulas.length){

          requestAnimationFrame(cuadro);

        }else{

          animando = false;

        }

      }


      function iniciarAnimacion(){

        if(animando) return;

        animando = true;
        requestAnimationFrame(cuadro);

      }


      /* ===== SEGUIR EL CURSOR ===== */

      function mover(event){

        if(event.pointerType !== 'mouse') return;

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const distancia = Math.hypot(x - lx, y - ly);

        if(distancia > 1){

          const pasos = Math.max(1, Math.ceil(distancia / 5));

          for(let i = 0; i < pasos; i++){

            const t = (i + 1) / pasos;

            const px = lx + (x - lx) * t;
            const py = ly + (y - ly) * t;

            zonas.push({
              x:px,
              y:py,
              t:performance.now()
            });

            if(Math.random() < .8){
              emitir(px, py, 2);
            }

          }

          lx = x;
          ly = y;

          iniciarAnimacion();

        }

      }


      card.addEventListener('pointermove', mover);

      card.addEventListener('pointerleave', () => {

        lx = -999;
        ly = -999;

      });


      /* ===== TAMAÑO RESPONSIVE ===== */

      const observer = new ResizeObserver(ajustar);
      observer.observe(card);

      ajustar();

    });

  }


  /* ===== NAVEGACIÓN POR PAREJAS ===== */

  let pagina = 0;

  function actualizarCarrusel(){

    const totalPaginas = Math.ceil(videos.length / 2);

    track.classList.toggle('is-single', videos.length === 1);

    prev.hidden = false;
    next.hidden = false;

    prev.disabled = pagina === 0;
    next.disabled = pagina >= totalPaginas - 1;

    if(videos.length <= 1){

      track.style.transform = 'translateX(0)';
      return;

    }

    const primerVideo = videos[pagina * 2];

    if(primerVideo){

      track.style.transform =
        `translateX(-${primerVideo.offsetLeft}px)`;

    }

  }


  prev.addEventListener('click', () => {

    if(pagina > 0){

      pagina--;
      actualizarCarrusel();

    }

  });


  next.addEventListener('click', () => {

    const totalPaginas = Math.ceil(videos.length / 2);

    if(pagina < totalPaginas - 1){

      pagina++;
      actualizarCarrusel();

    }

  });


  window.addEventListener('resize', actualizarCarrusel);

  actualizarCarrusel();

})();
/* =====================================================
   VAPOR GLASS MATE + REVELACIÓN CÓSMICA
===================================================== */
if(!sinMovimiento){

  const caja = $('#burn');
  const A = $('#photo');
  const B = $('#fire');

  if(caja && A && B){

    const a = A.getContext('2d');
    const b = B.getContext('2d');

    const M = document.createElement('canvas');
    const m = M.getContext('2d');

    const img = new Image();

    let w, h;
    let listo = false;
    let corriendo = false;

    let zonas = [];
    let particulas = [];

    let lx = -999;
    let ly = -999;

    let inicioClick = 0;

    const d = Math.min(devicePixelRatio || 1, 1.5);


    /* ===== FOTOGRAFÍA ORIGINAL ===== */

    function dibujarFoto(ctx){

      if(!listo) return;

      const escala = Math.max(
        w / img.width,
        h / img.height
      );

      const iw = img.width * escala;
      const ih = img.height * escala;

      ctx.drawImage(
        img,
        (w - iw) / 2,
        (h - ih) / 2,
        iw,
        ih
      );

    }

    function ajustar(){

      w = caja.clientWidth;
      h = caja.clientHeight;

      [A, B, M].forEach(c => {
        c.width = w * d;
        c.height = h * d;
      });

      a.setTransform(d, 0, 0, d, 0, 0);
      b.setTransform(d, 0, 0, d, 0, 0);
      m.setTransform(d, 0, 0, d, 0, 0);

      a.clearRect(0, 0, w, h);

      dibujarFoto(a);

      zonas = [];

      iniciarAnimacion();

    }

    img.onload = () => {
      listo = true;
      ajustar();
    };

    img.onerror = () => iniciarAnimacion();

    img.src = 'media/LUUZ-1 (1).jpg';

    window.addEventListener('resize', ajustar);


    /* ===== VIDRIO MATE DESENFOCADO ===== */

    function dibujarGlass(){

      b.clearRect(0, 0, w, h);

      b.save();
      b.filter = 'blur(10px)';
      dibujarFoto(b);
      b.restore();

      b.filter = 'none';

      b.fillStyle = 'rgba(2,1,5,.70)';
      b.fillRect(0, 0, w, h);

      const brillo = b.createLinearGradient(0, 0, w, h);

      brillo.addColorStop(0, 'rgba(190,180,210,.12)');
      brillo.addColorStop(.45, 'rgba(100,90,120,.035)');
      brillo.addColorStop(1, 'rgba(180,170,195,.09)');

      b.fillStyle = brillo;
      b.fillRect(0, 0, w, h);

      for(let i = 0; i < 22; i++){

        const x = (i * 137.5) % w;
        const y = (i * 83.7) % h;
        const r = 40 + (i % 5) * 20;

        const nube = b.createRadialGradient(
          x, y, 0,
          x, y, r
        );

        nube.addColorStop(0, 'rgba(205,195,220,.10)');
        nube.addColorStop(.55, 'rgba(150,140,170,.045)');
        nube.addColorStop(1, 'rgba(100,90,120,0)');

        b.fillStyle = nube;

        b.beginPath();
        b.arc(x, y, r, 0, Math.PI * 2);
        b.fill();

      }

    }

    /* ===== DESPEJE LOCAL DEL CURSOR ===== */

    function despejar(px, py){

      zonas.push({
        x: px,
        y: py,
        t: performance.now()
      });

    }

    /* ===== POLVO ESTELAR ===== */

    function emitir(px, py, cantidad = 8){

      const tamanos = [.5, 1, 2];

      for(let i = 0; i < cantidad; i++){

        const angulo = Math.random() * Math.PI * 2;
        const velocidad = .2 + Math.random() * 1.1;

        particulas.push({

          x: px + (Math.random() - .5) * 28,
          y: py + (Math.random() - .5) * 28,

          vx: Math.cos(angulo) * velocidad,
          vy: Math.sin(angulo) * velocidad,

          size: tamanos[Math.random() * 3 | 0],
          estrella: Math.random() < .4,

          vida: 700 + Math.random() * 800,
          t: performance.now()

        });

      }

    }

    /* ===== ESTRELLAS DE CUATRO PUNTAS ===== */

    function estrella(x, y, s){

      b.beginPath();

      b.moveTo(x, y - s * 2);
      b.quadraticCurveTo(x + s * .25, y - s * .25, x + s * 2, y);

      b.quadraticCurveTo(x + s * .25, y + s * .25, x, y + s * 2);

      b.quadraticCurveTo(x - s * .25, y + s * .25, x - s * 2, y);

      b.quadraticCurveTo(x - s * .25, y - s * .25, x, y - s * 2);

      b.closePath();
      b.fill();

    }


    /* ===== MÁSCARA DE REVELACIÓN ===== */

    function dibujarMascara(ahora){

      m.clearRect(0, 0, w, h);

      let global = 0;

      if(inicioClick){

        const tiempo = ahora - inicioClick;

        if(tiempo < 5000){

          global = tiempo / 5000;

        }else if(tiempo < 20000){

          global = 1;

        }else if(tiempo < 25000){

          global = 1 - (tiempo - 20000) / 5000;

        }else{

          inicioClick = 0;

        }

      }

      if(global > 0){

        m.fillStyle = `rgba(255,255,255,${global})`;
        m.fillRect(0, 0, w, h);

      }


      /* REVELACIÓN INDIVIDUAL DEL CURSOR */

      zonas.forEach(z => {

        const edad = ahora - z.t;

        let fuerza;

        if(edad < 180){

          fuerza = edad / 180;

        }else{

          fuerza = Math.max(
            0,
            1 - (edad - 180) / 2200
          );

        }

        if(fuerza <= 0) return;

        const radio = 39;

        m.save();

        m.globalCompositeOperation = 'lighter';

        const gradiente = m.createRadialGradient(
          z.x, z.y, 0,
          z.x, z.y, radio
        );

        gradiente.addColorStop(0, `rgba(255,255,255,${fuerza})`);
        gradiente.addColorStop(.55, `rgba(255,255,255,${fuerza * .95})`);
        gradiente.addColorStop(.82, `rgba(255,255,255,${fuerza * .45})`);
        gradiente.addColorStop(1, 'rgba(255,255,255,0)');

        m.fillStyle = gradiente;

        m.beginPath();
        m.arc(z.x, z.y, radio, 0, Math.PI * 2);
        m.fill();


        /* BORDES IRREGULARES */

        for(let i = 0; i < 3; i++){

          const angulo = i * 2.1 + z.x * .01;
          const x = z.x + Math.cos(angulo) * 24;
          const y = z.y + Math.sin(angulo) * 24;

          const satelite = m.createRadialGradient(
            x, y, 0,
            x, y, 19
          );

          satelite.addColorStop(0, `rgba(255,255,255,${fuerza * .8})`);
          satelite.addColorStop(1, 'rgba(255,255,255,0)');

          m.fillStyle = satelite;

          m.beginPath();
          m.arc(x, y, 19, 0, Math.PI * 2);
          m.fill();

        }

        m.restore();

      });

      zonas = zonas.filter(z => ahora - z.t < 2400);

    }


    /* ===== PARTÍCULAS EN MOVIMIENTO ===== */

    function dibujarParticulas(ahora){

      particulas = particulas.filter(
        p => ahora - p.t < p.vida
      );

      particulas.forEach(p => {

        const vida = 1 - (ahora - p.t) / p.vida;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= .987;
        p.vy *= .987;

        b.globalAlpha = vida;
        b.fillStyle = '#f1edff';
        b.shadowColor = '#c9b5ff';
        b.shadowBlur = 7;

        if(p.estrella){

          estrella(p.x, p.y, p.size);

        }else{

          b.beginPath();
          b.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          b.fill();

        }

      });

      b.globalAlpha = 1;
      b.shadowBlur = 0;

    }


    /* ===== ANIMACIÓN PRINCIPAL ===== */

    function cuadro(ahora){

      dibujarGlass();

      dibujarMascara(ahora);

      b.save();

      b.globalCompositeOperation = 'destination-out';
      b.drawImage(M, 0, 0, w, h);

      b.restore();

      dibujarParticulas(ahora);

      const tiempoClickActiva =
        inicioClick && ahora - inicioClick < 25000;

      if(
        zonas.length ||
        particulas.length ||
        tiempoClickActiva
      ){

        requestAnimationFrame(cuadro);

      }else{

        corriendo = false;

      }

    }


    function iniciarAnimacion(){

      if(!corriendo){

        corriendo = true;
        requestAnimationFrame(cuadro);

      }

    }


    /* ===== MOVIMIENTO FLUIDO ===== */

    function mover(cx, cy){

      const r = caja.getBoundingClientRect();

      const px = cx - r.left;
      const py = cy - r.top;

      const distancia = Math.hypot(px - lx, py - ly);

      if(distancia > 1){

        const pasos = Math.max(
          1,
          Math.ceil(distancia / 5)
        );

        for(let i = 0; i < pasos; i++){

          const t = (i + 1) / pasos;

          const x = lx + (px - lx) * t;
          const y = ly + (py - ly) * t;

          despejar(x, y);

          if(Math.random() < .8){
            emitir(x, y, 2);
          }

        }

        lx = px;
        ly = py;

        iniciarAnimacion();

      }

    }


    caja.addEventListener('pointermove', e => {

      if(e.pointerType === 'mouse'){
        mover(e.clientX, e.clientY);
      }

    });

    caja.addEventListener('pointerleave', () => {
      lx = -999;
      ly = -999;
    });


    /* ===== CLIC: REVELACIÓN ===== */

    function revelarTodo(){

      inicioClick = performance.now();

      zonas = [];

      emitir(w / 2, h / 2, 100);

      iniciarAnimacion();

    }

    caja.addEventListener('pointerdown', revelarTodo);


    /* ===== TÁCTIL ===== */

    caja.addEventListener('touchmove', e => {

      mover(
        e.touches[0].clientX,
        e.touches[0].clientY
      );

    }, { passive:true });

    caja.addEventListener('touchstart', revelarTodo, { passive:true });

    ajustar();

  }

}


/* =====================================================
   ROSTRO CÓSMICO INTERACTIVO
===================================================== */

(() => {

  const canvas = $('#cosmicFace');
  if(!canvas) return;

  const ctx = canvas.getContext('2d', { alpha:true });

  const source = new Image();
  source.src = 'media/rostro-cosmico.png';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pointer = {
    x:-10000,
    y:-10000,
    active:false
  };

  const particles = [];
  const ambientParticles = [];

  let W = 0;
  let H = 0;
  let dpr = 1;

  let layout = null;
  let animationId = null;
  let lastTime = 0;
  let lastAmbientSpawn = 0;


  /* ===== CONFIGURACIÓN ===== */

  const settings = {
    sampleStep:4,
    maxParticles:17000,
    radius:78,
    push:5.8,
    spring:.018,
    friction:.91
  };


  /* ===== AJUSTAR CANVAS ===== */

  function resize(){

    W = window.innerWidth;
    H = window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if(source.complete && source.naturalWidth){
      positionTargets();
    }

  }


  /* ===== POSICIÓN Y TAMAÑO DEL ROSTRO ===== */

  function positionTargets(){

    const ratio = source.naturalWidth / source.naturalHeight;
    const mobile = W < 700;

    const targetHeight = Math.min(
      H * (mobile ? .90 : 1.08),
      W / ratio * (mobile ? 1.20 : 1.35)
    );

    const targetWidth = targetHeight * ratio;

    layout = {
      width:targetWidth,
      height:targetHeight,

      left:W - targetWidth + targetWidth * .02,

      top:H - targetHeight + (mobile ? targetHeight * .08 : targetHeight * .02)
    };

    particles.forEach(p => {

      p.tx = layout.left + p.ox * layout.width;
      p.ty = layout.top + p.oy * layout.height;

    });

  }


  /* ===== CONSTRUIR PARTÍCULAS DEL ROSTRO ===== */

  function buildParticles(){

    const off = document.createElement('canvas');

    off.width = source.naturalWidth;
    off.height = source.naturalHeight;

    const offCtx = off.getContext('2d', {
      willReadFrequently:true
    });

    offCtx.drawImage(source, 0, 0);

    const pixels = offCtx.getImageData(
      0, 0,
      off.width,
      off.height
    ).data;

    const step = settings.sampleStep;


    for(let y = 0; y < off.height; y += step){

      for(let x = 0; x < off.width; x += step){

        if(particles.length >= settings.maxParticles) break;

        const index = (y * off.width + x) * 4;

        const alpha = pixels[index + 3];
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        const brightness = (r + g + b) / 3;

        if(alpha < 30 || brightness < 48) continue;

        const ox = x / off.width;
        const oy = y / off.height;

        const color = brightness > 205
          ? '238,239,255'
          : (b > r * 1.12 ? '174,181,255' : '210,211,224');

        particles.push({

          ox,
          oy,

          tx:0,
          ty:0,

          x:0,
          y:0,

          vx:0,
          vy:0,

          size:.45 + Math.random() * 1.05,
          alpha:.35 + Math.random() * .55,

          phase:Math.random() * Math.PI * 2,
          speed:.55 + Math.random() * 1.35,

          color

        });

      }

    }


    positionTargets();

    particles.forEach(p => {
      p.x = p.tx;
      p.y = p.ty;
    });

    if(!reduceMotion){
      startAnimation();
    }else{
      drawFrame(performance.now());
    }

  }


  /* ===== PARTÍCULAS AMBIENTALES FLOTANTES ===== */

  function emitAmbientParticles(now){

    if(now - lastAmbientSpawn < 300) return;

    lastAmbientSpawn = now;

    const cantidad = Math.random() < .25 ? 2 : 1;

    for(let i = 0; i < cantidad; i++){

      const borde = Math.floor(Math.random() * 4);
      const velocidad = .18 + Math.random() * .24;

      let x, y, vx, vy;

      if(borde === 0){

        x = Math.random() * W;
        y = -8;

        vx = (Math.random() - .5) * velocidad;
        vy = velocidad;

      }else if(borde === 1){

        x = Math.random() * W;
        y = H + 8;

        vx = (Math.random() - .5) * velocidad;
        vy = -velocidad;

      }else if(borde === 2){

        x = -8;
        y = Math.random() * H;

        vx = velocidad;
        vy = (Math.random() - .5) * velocidad;

      }else{

        x = W + 8;
        y = Math.random() * H;

        vx = -velocidad;
        vy = (Math.random() - .5) * velocidad;

      }

      ambientParticles.push({

        x,y,
        vx,vy,

        size:.45 + Math.random() * .8,
        alpha:.18 + Math.random() * .3,

        phase:Math.random() * Math.PI * 2,

        born:now,
        life:18000 + Math.random() * 12000

      });

    }

  }


  /* ===== DIBUJAR PARTÍCULAS AMBIENTALES ===== */

  function drawAmbientParticles(now, dt){

    for(let i = ambientParticles.length - 1; i >= 0; i--){

      const p = ambientParticles[i];
      const edad = now - p.born;

      if(
        edad > p.life ||
        p.x < -30 || p.x > W + 30 ||
        p.y < -30 || p.y > H + 30
      ){

        ambientParticles.splice(i, 1);
        continue;

      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const entrada = Math.min(1, edad / 1800);
      const salida = Math.min(1, (p.life - edad) / 3500);

      const brillo = .75 + Math.sin(now * .001 + p.phase) * .25;
      const alpha = p.alpha * entrada * salida * brillo;

      ctx.fillStyle = `rgba(210,211,224,${alpha})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

    }

  }


  /* ===== MOVIMIENTO DEL CURSOR ===== */

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


  /* ===== ANIMACIÓN DEL ROSTRO ===== */

  function drawFrame(now){

    const dt = Math.min(
      2,
      (now - (lastTime || now)) / 16.67 || 1
    );

    lastTime = now;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';


    if(!reduceMotion){

      emitAmbientParticles(now);
      drawAmbientParticles(now, dt);

    }


    const radius = settings.radius;
    const radius2 = radius * radius;


    for(const p of particles){

      let ax = (p.tx - p.x) * settings.spring;
      let ay = (p.ty - p.y) * settings.spring;


      /* REPULSIÓN DEL CURSOR */

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


      /* DERIVA ORGÁNICA */

      const shimmer = Math.sin(now * .0011 * p.speed + p.phase);

      ax += Math.sin(now * .00035 + p.phase) * .006;
      ay += Math.cos(now * .00032 + p.phase) * .006;


      /* MOVIMIENTO Y RETORNO */

      p.vx = (p.vx + ax * dt) * Math.pow(settings.friction, dt);
      p.vy = (p.vy + ay * dt) * Math.pow(settings.friction, dt);

      p.x += p.vx * dt;
      p.y += p.vy * dt;


      /* BRILLO */

      const twinkle = .68 + (shimmer + 1) * .16;

      const alpha = Math.max(
        .08,
        Math.min(1, p.alpha * twinkle)
      );

      const size = p.size * (shimmer > .82 ? 1.45 : 1);

      ctx.fillStyle = `rgba(${p.color},${alpha})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();


      /* DESTELLOS DE CUATRO PUNTAS */

      if(shimmer > .94 && p.size > .9){

        ctx.strokeStyle = `rgba(225,229,255,${alpha * .42})`;
        ctx.lineWidth = .55;

        ctx.beginPath();

        ctx.moveTo(p.x - 2.4, p.y);
        ctx.lineTo(p.x + 2.4, p.y);

        ctx.moveTo(p.x, p.y - 2.4);
        ctx.lineTo(p.x, p.y + 2.4);

        ctx.stroke();

      }

    }


    ctx.globalCompositeOperation = 'source-over';

    if(!reduceMotion){
      animationId = requestAnimationFrame(drawFrame);
    }

  }


  /* ===== INICIAR ANIMACIÓN ===== */

  function startAnimation(){

    if(animationId === null){

      lastTime = 0;
      animationId = requestAnimationFrame(drawFrame);

    }

  }


  /* ===== CARGA DE IMAGEN ===== */

  source.onload = () => {

    resize();
    buildParticles();

  };


  source.onerror = () => {

    console.error(
      'No se pudo cargar media/rostro-cosmico.png. Revisa el nombre y la ubicación del archivo.'
    );

  };


  /* ===== EVENTOS ===== */

  window.addEventListener('resize', resize);

  window.addEventListener(
    'pointermove',
    onPointerMove,
    { passive:true }
  );

  window.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);

  resize();

})();


/* =====================================================
   CARRUSEL MOONSHINE
===================================================== */

/* Solo se incluyen las tarjetas que ya tienen fotografía. */

const photoCards = [
  ...document.querySelectorAll('.photo-card:not(.is-empty)')
];

const photoPrev = $('#photoPrev');
const photoNext = $('#photoNext');

const lightbox = $('#photoLightbox');
const lightboxImg = $('#lightboxImg');
const lightboxTitle = $('#lightboxTitle');
const lightboxClose = $('#lightboxClose');

let photoIndex = 0;
let photoTimer = null;


/* ===== DIBUJAR CARRUSEL ===== */

function renderCarousel(){

  const total = photoCards.length;

  if(!total) return;

  photoCards.forEach((card, i) => {

    let offset = (i - photoIndex + total) % total;

    if(offset > total / 2){
      offset -= total;
    }

    const visible = Math.abs(offset) <= 1;

    card.style.setProperty('--offset', offset);

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

    card.classList.toggle('is-center', offset === 0);

    card.style.pointerEvents = visible ? 'auto' : 'none';

    card.setAttribute(
      'aria-hidden',
      visible ? 'false' : 'true'
    );

  });

}


/* ===== DESPLAZAMIENTO ===== */

function moveCarousel(direction){

  if(!photoCards.length) return;

  photoIndex = (
    photoIndex + direction + photoCards.length
  ) % photoCards.length;

  renderCarousel();
  restartPhotoTimer();

}


/* ===== TEMPORIZADOR AUTOMÁTICO ===== */

function restartPhotoTimer(){

  clearInterval(photoTimer);

  if(
    !sinMovimiento &&
    (!lightbox || !lightbox.classList.contains('active'))
  ){

    photoTimer = setInterval(() => {

      moveCarousel(1);

    }, 10000);

  }

}


/* ===== FLECHAS ===== */

if(photoPrev){
  photoPrev.addEventListener('click', () => moveCarousel(-1));
}

if(photoNext){
  photoNext.addEventListener('click', () => moveCarousel(1));
}


/* ===== ABRIR FOTOGRAFÍA AMPLIADA ===== */

photoCards.forEach(card => {

  card.addEventListener('click', () => {

    if(!lightbox || !lightboxImg || !lightboxTitle) return;

    const img = card.querySelector('img');

    if(!img) return;

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

    lightboxTitle.textContent =
      card.dataset.title || card.dataset.l || '';

    lightbox.classList.add('active');

    lightbox.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';

    clearInterval(photoTimer);

  });

});


/* ===== CERRAR VENTANA ===== */

function closeLightbox(){

  if(!lightbox) return;

  lightbox.classList.remove('active');

  lightbox.setAttribute('aria-hidden', 'true');

  document.body.style.overflow = '';

  restartPhotoTimer();

}


if(lightboxClose){
  lightboxClose.addEventListener('click', closeLightbox);
}


/* ===== CERRAR AL HACER CLIC FUERA ===== */

if(lightbox){

  lightbox.addEventListener('click', e => {

    if(e.target === lightbox){
      closeLightbox();
    }

  });

}


/* ===== CERRAR CON ESCAPE ===== */

document.addEventListener('keydown', e => {

  if(
    e.key === 'Escape' &&
    lightbox &&
    lightbox.classList.contains('active')
  ){

    closeLightbox();

  }

});


/* ===== INICIAR CARRUSEL ===== */

/* Ya no depende de que exista la ventana ampliada. */

if(photoCards.length){

  renderCarousel();
  restartPhotoTimer();

}



/* =====================================================
   PARTÍCULAS AMBIENTALES INDEPENDIENTES
===================================================== */

(() => {

  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.id = 'ambientParticles';

  Object.assign(canvas.style, {
    position:'fixed',
    inset:'0',
    width:'100%',
    height:'100%',
    pointerEvents:'none',
    zIndex:'0',
    opacity:'1'
  });

  document.body.appendChild(canvas);

  let W = 0;
  let H = 0;
  let dpr = 1;

  const particles = [];
  const MAX_PARTICLES = 95;


  /* ===== AJUSTAR TAMAÑO ===== */

  function resize(){

    W = window.innerWidth;
    H = window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  }


  /* ===== CREAR PARTÍCULAS ===== */

  function createParticle(){

    const angle = Math.random() * Math.PI * 2;
    const speed = .12 + Math.random() * .28;

    return {

      x:Math.random() * W,
      y:Math.random() * H,

      vx:Math.cos(angle) * speed,
      vy:Math.sin(angle) * speed,

      size:.5 + Math.random() * 1.3,

      alpha:.15 + Math.random() * .38,

      phase:Math.random() * Math.PI * 2,

      drift:.15 + Math.random() * .35

    };

  }


  /* ===== POBLACIÓN INICIAL ===== */

  for(let i = 0; i < MAX_PARTICLES; i++){
    particles.push(createParticle());
  }


  /* ===== ANIMACIÓN ===== */

  let lastTime = 0;

  function animate(now){

    const dt = Math.min(
      2,
      (now - (lastTime || now)) / 16.67 || 1
    );

    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    for(const p of particles){

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.x += Math.sin(now * .0003 + p.phase) * p.drift * .025;
      p.y += Math.cos(now * .00025 + p.phase) * p.drift * .025;


      if(
        p.x < -10 || p.x > W + 10 ||
        p.y < -10 || p.y > H + 10
      ){

        Object.assign(p, createParticle());

      }


      const shimmer =
        .65 + Math.sin(now * .001 + p.phase) * .35;

      ctx.globalAlpha = p.alpha * shimmer;

      ctx.fillStyle = '#e5dcff';

      ctx.shadowColor = '#bda7ff';
      ctx.shadowBlur = 5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    requestAnimationFrame(animate);

  }

  window.addEventListener('resize', resize);

  resize();

  requestAnimationFrame(animate);

})();


/* =====================================================
   REPRODUCTOR MUSICAL MOONSHINE
===================================================== */

(() => {

  const audio = $('#moonshineAudio');
  const toggle = $('#musicToggle');
  const progress = $('#musicProgress');
  const volume = $('#musicVolume');

  if(!audio || !toggle || !progress || !volume) return;

  audio.volume = 0.08;
  audio.loop = true;


  function actualizarBoton(){

    const reproduciendo = !audio.paused;

    toggle.textContent = reproduciendo ? 'Ⅱ' : '▶';

    toggle.setAttribute(
      'aria-label',
      reproduciendo ? 'Pausar música' : 'Reproducir música'
    );

  }


  /* INTENTAR REPRODUCIR AL ENTRAR */

  audio.play()
    .then(actualizarBoton)
    .catch(() => {
      actualizarBoton();
    });


  /* REPRODUCIR / PAUSAR */

  toggle.addEventListener('click', () => {

    if(audio.paused){
      audio.play().catch(() => actualizarBoton());
    }else{
      audio.pause();
    }

  });

  audio.addEventListener('play', actualizarBoton);
  audio.addEventListener('pause', actualizarBoton);


  /* ACTUALIZAR BARRA DE PROGRESO */

  audio.addEventListener('timeupdate', () => {

    if(!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    progress.value = (audio.currentTime / audio.duration) * 100;

    progress.style.setProperty(
      '--progress',
      `${progress.value}%`
    );

  });


  /* PERMITIR AVANZAR O RETROCEDER */

  progress.addEventListener('input', () => {

    if(!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    audio.currentTime = (progress.value / 100) * audio.duration;

    progress.style.setProperty(
      '--progress',
      `${progress.value}%`
    );

  });


  /* CONTROL DE VOLUMEN */

  volume.addEventListener('input', () => {

    audio.volume = Number(volume.value);

    volume.style.setProperty(
      '--volume',
      `${volume.value * 100}%`
    );

  });

  volume.style.setProperty('--volume', '8%');
  progress.style.setProperty('--progress', '0%');

})();
