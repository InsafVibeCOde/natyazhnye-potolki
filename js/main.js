/* Люкс Монтаж — скрипты сайта (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/[\s,]/g, ' ');
  const html = document.documentElement;

  html.classList.remove('no-js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduceMotion;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (motion) html.classList.add('anim');

  /* ---------- Smooth scroll (Lenis) ---------- */

  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------- Header / mobile bar ---------- */

  const header = $('.header');
  const mobileBar = $('.mobile-bar');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle('is-hidden', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    if (mobileBar) mobileBar.classList.toggle('is-visible', y > 600);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */

  const burger = $('.burger');
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------- Split text into words ---------- */

  const splitWords = (el) => {
    const walk = (node) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          child.textContent.split(/( +|\n+)/).forEach((part) => {
            if (!part) return;
            if (/^( +|\n+)$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const i = document.createElement('span');
            i.className = 'w__i';
            i.textContent = part;
            w.appendChild(i);
            frag.appendChild(w);
          });
        } else if (child.nodeType === 1) {
          const clone = child.cloneNode(false);
          clone.appendChild(walk(child));
          frag.appendChild(clone);
        }
      });
      return frag;
    };
    const frag = walk(el);
    el.textContent = '';
    el.appendChild(frag);
    return $$('.w__i', el);
  };

  /* ---------- Hero: «включаем свет» ---------- */

  const hero = $('.hero');
  if (motion && hero) {
    const heroWords = splitWords($('.hero__title'));
    const edges = $$('.ceil-edge');
    const cores = $$('.ceil-core');
    const glows = $$('.ceil-glow');

    gsap.set([...edges, ...cores], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(glows, { opacity: 0 });
    gsap.set('.ceil-amb', { opacity: 0 });
    gsap.set(heroWords, { yPercent: 110 });
    gsap.set(['.hero__side', '.hero .eyebrow'], { y: 30 });

    gsap.timeline({ delay: 0.2 })
      .to(edges, { strokeDashoffset: 0, duration: 1.4, stagger: 0.08, ease: 'power2.inOut' })
      .to(cores, { strokeDashoffset: 0, duration: 1.2, stagger: 0.1, ease: 'power3.inOut' }, '-=0.9')
      .to(glows, { keyframes: { opacity: [0.9, 0.1, 0.7, 0.25, 1] }, duration: 0.7, ease: 'none' })
      .to('.ceil-amb', { opacity: 0.75, duration: 1.4, ease: 'power2.out' }, '<')
      .to(heroWords, { yPercent: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out' }, '-=1.1')
      .to('.hero .eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '<')
      .to('.hero__side', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8')
      .to(header, { opacity: 1, duration: 0.8 }, '<');

    gsap.to('.hero__svg', {
      scale: 1.18, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__inner', {
      y: -80, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: '30% top', end: 'bottom top', scrub: true },
    });

    if (finePointer) {
      const px = gsap.quickTo('.hero__parallax', 'x', { duration: 1.4, ease: 'power3.out' });
      const py = gsap.quickTo('.hero__parallax', 'y', { duration: 1.4, ease: 'power3.out' });
      hero.addEventListener('mousemove', (e) => {
        px((e.clientX / innerWidth - 0.5) * -40);
        py((e.clientY / innerHeight - 0.5) * -24);
      });
    }
  }

  /* ---------- Split headings on scroll ---------- */

  if (motion) {
    $$('[data-split]').forEach((el) => {
      if (el.classList.contains('hero__title')) return;
      const words = splitWords(el);
      gsap.set(words, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' }),
      });
    });

    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
    });

    $$('[data-count]').forEach((el) => {
      const target = +el.dataset.count;
      const obj = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(obj, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(obj.v); } }),
      });
    });
  }

  /* ---------- Tech: sticky media ---------- */

  const techItems = $$('.tech__item');
  const techImgs = $$('.tech__media img');
  const techCount = $('[data-tech-count]');
  let techActive = 0;
  const setTech = (i) => {
    if (i === techActive) return;
    techItems.forEach((it, k) => it.classList.toggle('is-active', k === i));
    techImgs.forEach((img, k) => {
      img.classList.remove('is-prev');
      if (k === techActive) img.classList.add('is-prev');
      img.classList.toggle('is-active', k === i);
    });
    if (techCount) techCount.textContent = String(i + 1).padStart(2, '0');
    techActive = i;
  };
  if ('IntersectionObserver' in window && techItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setTech(+en.target.dataset.tech); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    techItems.forEach((it) => io.observe(it));
  }

  /* ---------- Calculator + live plan ---------- */
  // Формула со старого сайта: площадь × 969 + 150 × (углы − 4) + 800 × светильники + 400 × трубы

  const PRICE = { m2: 969, corner: 150, light: 800, pipe: 400 };
  const state = { area: 18, corners: 4, lights: 4, pipes: 1 };
  const total = () =>
    state.area * PRICE.m2 +
    PRICE.corner * Math.max(state.corners - 4, 0) +
    PRICE.light * state.lights +
    PRICE.pipe * state.pipes;

  const calc = $('#calc');
  const plan = $('[data-plan]');
  const W = 600, H = 460, PX = 38, RATIO = 1.25;
  let prevLights = 0;

  const inPoly = (x, y, pts) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  const renderPlan = () => {
    if (!plan) return;
    const wm = Math.sqrt(state.area * RATIO);
    const hm = state.area / wm;
    const w = wm * PX, h = hm * PX;
    const x0 = (W - w) / 2, y0 = (H - h) / 2 + 12, x1 = x0 + w, y1 = y0 + h;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const n = Math.min(Math.floor((state.corners - 4) / 2), 6);
    const on = (k) => k < n; // порядок вырезов: TR, BL, BR, TL, верх, низ
    const nw = w * 0.22, nh = h * 0.24;

    const pts = [];
    if (on(3)) pts.push([x0, y0 + nh], [x0 + nw, y0 + nh], [x0 + nw, y0]); else pts.push([x0, y0]);
    if (on(4)) pts.push([cx - nw / 2, y0], [cx - nw / 2, y0 + nh * 0.6], [cx + nw / 2, y0 + nh * 0.6], [cx + nw / 2, y0]);
    if (on(0)) pts.push([x1 - nw, y0], [x1 - nw, y0 + nh], [x1, y0 + nh]); else pts.push([x1, y0]);
    if (on(2)) pts.push([x1, y1 - nh], [x1 - nw, y1 - nh], [x1 - nw, y1]); else pts.push([x1, y1]);
    if (on(5)) pts.push([cx + nw / 2, y1], [cx + nw / 2, y1 - nh * 0.6], [cx - nw / 2, y1 - nh * 0.6], [cx - nw / 2, y1]);
    if (on(1)) pts.push([x0 + nw, y1], [x0 + nw, y1 - nh], [x0, y1 - nh]); else pts.push([x0, y1]);
    const ptsStr = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

    let grid = '';
    for (let x = (W / 2) % PX; x < W; x += PX) grid += `<line class="plan-grid" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
    for (let y = (H / 2 + 12) % PX; y < H; y += PX) grid += `<line class="plan-grid" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;

    // светильники — сеткой внутри комнаты
    let lights = '';
    const L = state.lights;
    if (L > 0) {
      const cols = Math.max(1, Math.round(Math.sqrt(L * (w / h))));
      const rows = Math.ceil(L / cols);
      for (let i = 0; i < L; i++) {
        const r = Math.floor(i / cols);
        const inRow = r === rows - 1 ? L - r * cols : cols;
        const c = i % cols;
        let x = x0 + w * ((c + 1) / (inRow + 1));
        let y = y0 + h * ((r + 1) / (rows + 1));
        for (let k = 0; k < 4 && !inPoly(x, y, pts); k++) { x += (cx - x) * 0.35; y += (cy - y) * 0.35; }
        lights += `<g class="plan-light${i >= prevLights ? ' is-new' : ''}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4"/></g>`;
      }
    }
    prevLights = L;

    let pipes = '';
    for (let i = 0; i < state.pipes; i++) {
      // трубы — вдоль нижней стены, левее центра (с учётом выреза в левом нижнем углу)
      const px = x0 + 16 + (on(1) ? nw : 0) + i * 20;
      const py = y1 - 14;
      pipes += `<circle class="plan-pipe" cx="${px}" cy="${py}" r="6.5"/><circle class="plan-pipe-dot" cx="${px}" cy="${py}" r="2.2"/>`;
    }

    const dimW = wm.toFixed(1).replace('.', ',');
    const dimH = hm.toFixed(1).replace('.', ',');
    const dims = `
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x0}" y1="${y0 - 16}" x2="${x1}" y2="${y0 - 16}"/>
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x0}" y1="${y0 - 21}" x2="${x0}" y2="${y0 - 11}"/>
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x1}" y1="${y0 - 21}" x2="${x1}" y2="${y0 - 11}"/>
      <text class="plan-area-sub" x="${cx}" y="${y0 - 24}" text-anchor="middle">${dimW} м</text>
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x0 - 16}" y1="${y0}" x2="${x0 - 16}" y2="${y1}"/>
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x0 - 21}" y1="${y0}" x2="${x0 - 11}" y2="${y0}"/>
      <line class="plan-grid" style="stroke:rgba(255,255,255,.25)" x1="${x0 - 21}" y1="${y1}" x2="${x0 - 11}" y2="${y1}"/>
      <text class="plan-area-sub" x="${x0 - 24}" y="${cy}" text-anchor="middle" transform="rotate(-90 ${x0 - 24} ${cy})">${dimH} м</text>`;

    plan.innerHTML = `
      <defs>
        <filter id="pglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="pglow2" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      ${grid}
      <polygon class="plan-room" points="${ptsStr}"/>
      <polygon class="plan-contour" points="${ptsStr}" transform="translate(${cx} ${cy}) scale(.93) translate(${-cx} ${-cy})"/>
      ${lights}${pipes}${dims}`;

    const size = $('[data-out="size"]');
    if (size) size.textContent = `≈ ${dimW} × ${dimH} м`;
  };

  if (calc) {
    const range = $('#calc-area', calc);
    const areaOut = $('[data-out="area"]', calc);
    const totalOut = $('[data-out="total"]', calc);
    let shown = 0;
    let raf = 0;

    const animateTo = (target) => {
      cancelAnimationFrame(raf);
      const from = shown;
      const start = performance.now();
      const dur = reduceMotion ? 0 : 500;
      const step = (t) => {
        const k = dur ? Math.min(1, (t - start) / dur) : 1;
        shown = from + (target - from) * (1 - Math.pow(1 - k, 3));
        totalOut.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const update = () => {
      range.style.setProperty('--p', ((state.area - range.min) / (range.max - range.min)) * 100 + '%');
      areaOut.textContent = state.area;
      $$('[data-counter]', calc).forEach((c) => {
        const key = c.dataset.counter;
        $('.counter__val', c).textContent = state[key];
        $('[data-dec]', c).disabled = state[key] <= +c.dataset.min;
        $('[data-inc]', c).disabled = state[key] >= +c.dataset.max;
      });
      renderPlan();
      animateTo(total());
    };

    range.addEventListener('input', () => { state.area = +range.value; update(); });
    $$('[data-counter]', calc).forEach((c) => {
      const key = c.dataset.counter;
      $('[data-dec]', c).addEventListener('click', () => { state[key] = Math.max(+c.dataset.min, state[key] - 1); update(); });
      $('[data-inc]', c).addEventListener('click', () => { state[key] = Math.min(+c.dataset.max, state[key] + 1); update(); });
    });

    range.value = state.area;
    update();
  }

  const calcSummary = () =>
    `Площадь ${state.area} м², углов ${state.corners}, светильников ${state.lights}, труб ${state.pipes} — от ${fmt(total())} ₽`;

  /* ---------- Works: horizontal scroll ---------- */

  if (motion) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 961px)', () => {
      const track = $('.works__track');
      const bar = $('.works__progress i');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.works', start: 'top top', end: () => '+=' + dist(),
          pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; },
        },
      });
    });

    /* Steps: линия «загорается» по мере скролла */
    const steps = $$('.step');
    const line = $('.steps__line i');
    ScrollTrigger.create({
      trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true,
      onUpdate: (self) => {
        if (line) line.style.transform = `scaleX(${self.progress})`;
        steps.forEach((s, i) => s.classList.toggle('is-lit', self.progress >= i / steps.length));
      },
    });
  } else {
    $$('.step').forEach((s) => s.classList.add('is-lit'));
  }

  /* ---------- Magnetic buttons + cursor light ---------- */

  if (motion && finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });

    const light = $('.cursor-light');
    const lx = gsap.quickTo(light, 'x', { duration: 0.8, ease: 'power3.out' });
    const ly = gsap.quickTo(light, 'y', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('mousemove', (e) => {
      html.classList.add('has-cursor');
      lx(e.clientX); ly(e.clientY);
    }, { passive: true });
  }

  /* ---------- Modal ---------- */

  const modal = $('#modal');
  const modalTitle = $('.modal__title', modal);
  const modalText = $('.modal__text', modal);
  const modalSummary = $('.modal__summary', modal);
  const modalForm = $('form', modal);
  const modalSource = $('input[name="source"]', modal);
  let lastFocus = null;

  const lockScroll = (lock) => {
    document.body.style.overflow = lock ? 'hidden' : '';
    if (lenis) lock ? lenis.stop() : lenis.start();
  };

  const openModal = (btn) => {
    lastFocus = btn;
    closeMenu();
    modalTitle.textContent = btn.dataset.title || 'Бесплатный замер';
    modalText.textContent = btn.dataset.text || 'Оставьте телефон — перезвоним в течение 5 минут и подберём удобное время замера.';
    modalSource.value = btn.dataset.source || modalTitle.textContent;
    const summary = btn.dataset.summary === 'calc' ? calcSummary() : btn.dataset.summary || '';
    modalSummary.textContent = summary;
    modalSummary.classList.toggle('is-visible', !!summary);
    modalForm.classList.remove('is-sent');
    modal.classList.add('is-open');
    lockScroll(true);
    setTimeout(() => $('input[name="phone"]', modal).focus(), 120);
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    lockScroll(false);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  $$('[data-modal]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openModal(b); }));
  $('.modal__close', modal).addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ---------- Phone mask + forms ---------- */

  const maskPhone = (input) => {
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      input.value = out;
    });
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7 ('; });
    input.addEventListener('blur', () => { if (input.value.replace(/\D/g, '').length <= 1) input.value = ''; });
  };
  $$('input[name="phone"]').forEach(maskPhone);

  $$('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = $('input[name="phone"]', form);
      const agree = $('input[name="agree"]', form);
      const okPhone = phone.value.replace(/\D/g, '').length === 11;
      phone.classList.toggle('is-invalid', !okPhone);
      agree.closest('.check').classList.toggle('is-invalid', !agree.checked);
      if (!okPhone || !agree.checked) return;

      const data = Object.fromEntries(new FormData(form));
      if (form.closest('#modal') && modalSummary.textContent) data.calc = modalSummary.textContent;

      // TODO: подключить отправку заявок (Telegram-бот / почта / CRM)
      // await fetch('/send.php', { method: 'POST', body: JSON.stringify(data) });
      console.log('Заявка:', data);

      form.classList.add('is-sent');
      form.reset();
    });
  });

  /* ---------- FAQ ---------- */

  $$('.faq__item').forEach((item) => {
    const q = $('.faq__q', item);
    q.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open);
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 550);
    });
  });

  /* ---------- Lightbox ---------- */

  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCount = $('.lightbox__count', lb);
  let group = [];
  let idx = 0;

  const show = () => {
    lbImg.src = group[idx];
    lbCount.textContent = group.length > 1 ? `${idx + 1} / ${group.length}` : '';
    $('.lightbox__prev', lb).hidden = group.length < 2;
    $('.lightbox__next', lb).hidden = group.length < 2;
  };
  const openLb = (list, i) => { group = list; idx = i; show(); lb.classList.add('is-open'); lockScroll(true); };
  const closeLb = () => { lb.classList.remove('is-open'); lockScroll(false); };
  const go = (d) => { idx = (idx + d + group.length) % group.length; show(); };

  $$('[data-lightbox]').forEach((el) => {
    el.addEventListener('click', () => {
      const all = $$(`[data-lightbox="${el.dataset.lightbox}"]`);
      openLb(all.map((a) => a.dataset.full), all.indexOf(el));
    });
  });
  const allWorks = Array.from({ length: 24 }, (_, i) => `img/works/w-${String(i + 1).padStart(2, '0')}.webp`);
  $$('[data-all-works]').forEach((b) => b.addEventListener('click', () => openLb(allWorks, 0)));

  $('.lightbox__close', lb).addEventListener('click', closeLb);
  $('.lightbox__prev', lb).addEventListener('click', () => go(-1));
  $('.lightbox__next', lb).addEventListener('click', () => go(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lb.classList.contains('is-open')) closeLb();
      else if (modal.classList.contains('is-open')) closeModal();
      else closeMenu();
    }
    if (lb.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
  });

  /* ---------- Cookie ---------- */

  const cookie = $('#cookie');
  let accepted = false;
  try { accepted = localStorage.getItem('cookie-ok') === '1'; } catch (e) { /* storage недоступен */ }
  if (!accepted) setTimeout(() => cookie.classList.add('is-visible'), 2500);
  $('button', cookie).addEventListener('click', () => {
    cookie.classList.remove('is-visible');
    try { localStorage.setItem('cookie-ok', '1'); } catch (e) { /* ignore */ }
  });

  /* ---------- Refresh after fonts/images ---------- */

  if (hasGsap) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
