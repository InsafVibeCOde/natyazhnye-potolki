/* Люкс Монтаж — скрипты сайта (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';

  /* ================= НАСТРОЙКИ ================= */
  // Всё, что заполняется данными заказчика. Пока значение пустое — связанный блок на сайте скрыт.
  // Подробно — в README.md.
  const CONFIG = {
    metrikaId: null,     // номер счётчика Яндекс.Метрики, например 12345678
    max: 'https://max.ru/u/f9LHodD0cOIeTNAkemGS5fLyl_J12t_ITj_i_2og3PRIHGLkD-noYUuiRo4', // ссылка на профиль в MAX
    leadsEndpoint: null, // адрес приёма заявок на российском хостинге, например 'server/send.php'
  };
  const METRIKA_ID = CONFIG.metrikaId;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/[\s,]/g, ' ');
  const html = document.documentElement;

  html.classList.remove('no-js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  // анимации только на компьютере с мышью — на телефоне без них, чтобы всё открывалось сразу
  const motion = hasGsap && !reduceMotion && finePointer;

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    // на телефонах адресная строка меняет высоту окна — не пересчитываем всё из-за этого
    ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded' });
  }
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
  html.classList.toggle('anim', motion);
  html.classList.toggle('intro', motion && finePointer);

  /* ---------- Smooth scroll (Lenis) ---------- */

  let lenis = null;
  if (motion && finePointer && window.Lenis) {
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
    // на телефоне панель с «Позвонить / Заказать звонок» видна сразу
    if (mobileBar) mobileBar.classList.add('is-visible');
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

  /* ---------- Hero: заголовок выезжает, остальное проявляется ---------- */

  const hero = $('.hero');
  let heroIntro = null;
  if (motion && finePointer && hero) {
    const heroWords = splitWords($('.hero__title'));
    gsap.set(heroWords, { yPercent: 110 });
    gsap.set('.hero__title', { opacity: 1 });

    heroIntro = gsap.timeline({ delay: 0.05 })
      .to(heroWords, { yPercent: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out', clearProps: 'transform' })
      .to('.hero__fade', { opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power1.out' }, 0.2);
  }

  /* ---------- Split headings on scroll ---------- */

  const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 900 }) : setTimeout(fn, 900));

  if (motion) whenIdle(() => {
    if (finePointer) $$('[data-split]').forEach((el) => {
      if (el.classList.contains('hero__title')) return;
      const words = splitWords(el);
      gsap.set(words, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' }),
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
  });

  /* ---------- Анимация рамки популярного полотна только в зоне видимости ---------- */

  const featured = $('.price--featured');
  if (featured && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => featured.classList.toggle('is-inview', en.isIntersecting)).observe(featured);
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
  const W = 600, H = 460, RATIO = 1.25;
  const MAX_W = Math.min(W - 100, (H - 110) * RATIO); // ширина комнаты при 100 м²
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
    // комната растёт с площадью, но даже маленькая занимает заметную часть поля;
    // сетка метров масштабируется вместе с ней — как будто камера отъезжает
    const w = MAX_W * (0.4 + 0.6 * Math.sqrt(state.area / 100));
    const h = w / RATIO;
    const PX = w / wm;
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
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x0}" y1="${y0 - 16}" x2="${x1}" y2="${y0 - 16}"/>
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x0}" y1="${y0 - 21}" x2="${x0}" y2="${y0 - 11}"/>
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x1}" y1="${y0 - 21}" x2="${x1}" y2="${y0 - 11}"/>
      <text class="plan-area-sub" x="${cx}" y="${y0 - 24}" text-anchor="middle">${dimW} м</text>
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x0 - 16}" y1="${y0}" x2="${x0 - 16}" y2="${y1}"/>
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x0 - 21}" y1="${y0}" x2="${x0 - 11}" y2="${y0}"/>
      <line class="plan-grid" style="stroke:rgba(27,26,24,.3)" x1="${x0 - 21}" y1="${y1}" x2="${x0 - 11}" y2="${y1}"/>
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
        if (line) line.style.setProperty('--p', self.progress);
        steps.forEach((s, i) => s.classList.toggle('is-lit', self.progress >= i / steps.length));
      },
    });
  } else {
    $$('.step').forEach((s) => s.classList.add('is-lit'));
    const line = $('.steps__line i');
    if (line) line.style.setProperty('--p', 1);
  }

  /* ---------- Works: счётчик для мобильной ленты ---------- */

  const worksTrack = $('.works__track');
  const worksCur = $('[data-works-cur]');
  if (worksTrack && worksCur) {
    const cards = $$('.work', worksTrack);
    worksTrack.addEventListener('scroll', () => {
      const first = cards[0];
      const step = first.offsetWidth + parseFloat(getComputedStyle(worksTrack).columnGap || 12);
      const i = Math.min(cards.length - 1, Math.round(worksTrack.scrollLeft / step));
      worksCur.textContent = String(i + 1).padStart(2, '0');
    }, { passive: true });
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
    modalText.textContent = btn.dataset.text || 'Оставьте телефон. Перезвоним и договоримся о времени замера.';
    modalSource.value = btn.dataset.source || modalTitle.textContent;
    const summary = btn.dataset.summary === 'calc' ? calcSummary() : btn.dataset.summary || '';
    modalSummary.textContent = summary;
    modalSummary.classList.toggle('is-visible', !!summary);
    modalForm.classList.remove('is-sent', 'is-error');
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

  // Заявка уходит на сервер в РФ (CONFIG.leadsEndpoint). Пока адрес не задан — только в консоль.
  const sendLead = async (data) => {
    if (!CONFIG.leadsEndpoint) { console.info('Заявка (отправка ещё не подключена):', data); return true; }
    try {
      const res = await fetch(CONFIG.leadsEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      // успех — только если сервер явно ответил { ok: true }
      const body = await res.json().catch(() => null);
      return res.ok && !!(body && body.ok);
    } catch (err) {
      return false;
    }
  };

  $$('form[data-form]').forEach((form) => {
    const errBox = $('.form__error', form);
    const submit = $('button[type="submit"]', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = $('input[name="phone"]', form);
      const agree = $('input[name="agree"]', form);
      const okPhone = phone.value.replace(/\D/g, '').length === 11;
      phone.classList.toggle('is-invalid', !okPhone);
      agree.closest('.check').classList.toggle('is-invalid', !agree.checked);
      if (!okPhone || !agree.checked) { if (!okPhone) phone.focus(); return; }

      // скрытое поле заполняют только боты — делаем вид, что всё ушло
      const trap = $('input[name="website"]', form);
      if (trap && trap.value) { form.classList.add('is-sent'); return; }

      const data = Object.fromEntries(new FormData(form));
      delete data.website;
      delete data.agree;
      if (form.closest('#modal') && modalSummary.textContent) data.calc = modalSummary.textContent;
      data.page = location.href.split('#')[0];
      // фиксируем факт согласия: когда и на какую редакцию документа
      data.consent = 'Согласие на обработку ПДн, ред. 28.09.2026';
      data.consent_at = new Date().toISOString();

      form.classList.remove('is-error');
      if (submit) submit.disabled = true;
      const ok = await sendLead(data);
      if (submit) submit.disabled = false;
      if (!ok) {
        if (errBox) errBox.textContent = 'Не получилось отправить заявку. Позвоните нам: 8 (951) 061-85-00.';
        form.classList.add('is-error');
        return;
      }
      // цель «Заявка» в Метрике — только сам факт, без телефона
      if (METRIKA_ID && window.ym) window.ym(METRIKA_ID, 'reachGoal', 'lead');

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
  // «Все фото»: сначала 12 снимков из ленты, потом прежние работы без повторов
  const allWorks = [
    ...Array.from({ length: 12 }, (_, i) => `img/works/n-${String(i + 1).padStart(2, '0')}.webp`),
    ...Array.from({ length: 12 }, (_, i) => `img/works/p-${String(i + 1).padStart(2, '0')}.webp`),
    ...[1, 2, 3, 4, 5, 8, 9, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23, 24].map((n) => `img/works/w-${String(n).padStart(2, '0')}.webp`),
  ];
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

  /* ---------- Cookie и согласие на аналитику ---------- */
  // Порядок строго такой: согласие → загрузка Метрики. До выбора и после отказа
  // скрипта Метрики на странице нет вообще.

  const CONSENT_KEY = 'cookie-consent'; // 'granted' | 'denied'
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage недоступен */ } },
  };

  const cookie = $('#cookie');
  const btnAccept = $('[data-cookie-accept]', cookie);
  const btnDecline = $('[data-cookie-decline]', cookie);
  const showCookie = () => cookie.classList.add('is-visible');
  const hideCookie = () => cookie.classList.remove('is-visible');

  const loadMetrika = () => {
    if (!METRIKA_ID || window.ym) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  };

  const clearMetrikaCookies = () => {
    const host = location.hostname;
    const base = host.split('.').slice(-2).join('.');
    document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ym')).forEach((n) => {
      const exp = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = n + exp;
      document.cookie = n + exp + '; domain=' + host;
      document.cookie = n + exp + '; domain=.' + base;
    });
  };

  if (METRIKA_ID) {
    // режим с аналитикой: явный выбор «Принять / Отклонить»
    $('[data-cookie-text]', cookie).innerHTML =
      'Мы используем cookie и Яндекс.Метрику, чтобы понимать, как улучшить сайт. Метрика включится только с вашего согласия. Подробнее — в <a href="html/cookie.html">политике cookie</a>.';
    btnAccept.textContent = 'Принять';
    btnDecline.hidden = false;
    $$('[data-cookie-settings]').forEach((l) => {
      l.hidden = false;
      l.addEventListener('click', (e) => { e.preventDefault(); showCookie(); });
    });

    const consent = store.get(CONSENT_KEY);
    if (consent === 'granted') loadMetrika();
    else if (consent !== 'denied') setTimeout(showCookie, 1500);

    btnAccept.addEventListener('click', () => { store.set(CONSENT_KEY, 'granted'); hideCookie(); loadMetrika(); });
    btnDecline.addEventListener('click', () => {
      const wasGranted = store.get(CONSENT_KEY) === 'granted';
      store.set(CONSENT_KEY, 'denied');
      hideCookie();
      // отзыв согласия: убираем cookie Метрики и перезагружаем страницу без неё
      if (wasGranted) { clearMetrikaCookies(); location.reload(); }
    });
  } else {
    // аналитики нет — баннер только информирует
    if (store.get('cookie-ok') !== '1') setTimeout(showCookie, 2500);
    btnAccept.addEventListener('click', () => { store.set('cookie-ok', '1'); hideCookie(); });
  }

  /* ---------- Расчёт калькулятора — в MAX ---------- */
  // MAX не умеет открывать чат с готовым текстом, поэтому кладём текст в буфер обмена
  // и подсказываем вставить его. Сайт при этом ничего не отправляет и не хранит.

  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 6000);
  };

  const copyText = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true, () => false);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return Promise.resolve(ok);
  };

  const shareText = {
    calc: () => `Здравствуйте! Посчитал(а) потолок на сайте: ${calcSummary()}. Хочу уточнить стоимость и записаться на бесплатный замер.`,
  };

  if (CONFIG.max) {
    $$('[data-max-share]').forEach((a) => {
      a.href = CONFIG.max;
      a.hidden = false;
      a.addEventListener('click', () => {
        const text = shareText[a.dataset.maxShare]();
        copyText(text).then((ok) => showToast(ok
          ? 'Текст скопирован. В чате MAX нажмите на поле сообщения и выберите «Вставить».'
          : 'Откроется чат в MAX — напишите нам, и мы посчитаем точнее.'));
        if (METRIKA_ID && window.ym) window.ym(METRIKA_ID, 'reachGoal', 'max');
      });
    });
  }

  /* ---------- Refresh after fonts/images ---------- */

  if (hasGsap) {
    // один пересчёт после загрузки страницы и шрифтов — вместо двух, чтобы не дёргать страницу
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const introDone = new Promise((r) => (heroIntro ? heroIntro.eventCallback('onComplete', r) : r()));
    Promise.all([loaded, fonts, introDone]).then(() => whenIdle(() => ScrollTrigger.refresh()));
  }
})();
