/* ============================================================
   KAT EXPRESS — анимации и интерактив
   ============================================================ */
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Прелоадер ---------- */
window.addEventListener('load', () => {
  setTimeout(() => $('#preloader').classList.add('is-done'), 500);
});
// страховка, если load не наступил
setTimeout(() => $('#preloader')?.classList.add('is-done'), 3500);

/* ---------- Прогресс скролла + шапка + кнопка «наверх» ---------- */
const header = $('#header');
const progress = $('#scrollProgress');
const toTop = $('#toTop');
let lastY = 0;

function onScroll() {
  const y = scrollY;
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

  header.classList.toggle('is-stuck', y > 30);
  // прячем шапку при скролле вниз, показываем вверх
  if (y > 400 && y > lastY) header.classList.add('is-hidden');
  else header.classList.remove('is-hidden');
  lastY = y;

  toTop.classList.toggle('is-shown', y > 700);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Бургер-меню ---------- */
const burger = $('#burger');
const nav = $('#nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('is-open');
  nav.classList.toggle('is-open');
  document.body.style.overflow = nav.classList.contains('is-open') ? 'hidden' : '';
});
// аккордеон подменю на мобиле
$$('.has-drop > .nav__link').forEach(btn => {
  btn.addEventListener('click', () => {
    if (innerWidth <= 1080) btn.parentElement.classList.toggle('is-open');
  });
});
$$('#nav a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('is-open');
  nav.classList.remove('is-open');
  document.body.style.overflow = '';
}));

/* ---------- Свечение за курсором ---------- */
const glow = $('#cursorGlow');
if (matchMedia('(pointer:fine)').matches) {
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    gx += (tx - gx) * .12;
    gy += (ty - gy) * .12;
    glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Появление при скролле ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      const d = en.target.dataset.delay;
      if (d) en.target.style.setProperty('--d', d + 'ms');
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  });
}, { threshold: .15, rootMargin: '0px 0px -60px' });
$$('.reveal, .card-reveal').forEach(el => io.observe(el));

/* ---------- Счётчики ---------- */
const counterIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const target = +el.dataset.target;
    const dur = 1800;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
    counterIO.unobserve(el);
  });
}, { threshold: .5 });
$$('.counter').forEach(el => counterIO.observe(el));

/* ---------- Эффект печати в заголовке hero ---------- */
const typed = $('#typedTitle');
if (typed && !prefersReduced) {
  const full = typed.textContent;
  typed.textContent = '';
  let i = 0;
  const caret = document.createElement('span');
  caret.className = 'caret';
  typed.after(caret);
  setTimeout(function type() {
    if (i <= full.length) {
      typed.textContent = full.slice(0, i++);
      setTimeout(type, 85);
    } else {
      setTimeout(() => caret.remove(), 1200);
    }
  }, 1200);
}

/* ---------- Частицы на фоне hero ---------- */
const canvas = $('#particles');
if (canvas && !prefersReduced) {
  const ctx = canvas.getContext('2d');
  let W, H, parts = [];
  const COLORS = ['rgba(255,61,154,', 'rgba(217,70,239,', 'rgba(139,92,246,', 'rgba(255,180,220,'];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    const count = Math.min(90, Math.floor(W / 16));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.6 + .6,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: Math.random() * .5 + .25,
      ph: Math.random() * Math.PI * 2
    }));
  }
  resize();
  addEventListener('resize', resize);

  let mx = -999, my = -999;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left; my = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mx = my = -999; });

  (function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      // легкое отталкивание от курсора
      const dx = p.x - mx, dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 12000) {
        const d = Math.sqrt(d2) || 1;
        p.x += (dx / d) * 1.4;
        p.y += (dy / d) * 1.4;
      }

      const tw = .65 + .35 * Math.sin(t / 600 + p.ph); // мерцание
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * tw, 0, Math.PI * 2);
      ctx.fillStyle = p.c + (p.a * tw) + ')';
      ctx.fill();

      // связи между близкими частицами
      for (const q of parts) {
        if (q === p) continue;
        const ddx = p.x - q.x, ddy = p.y - q.y;
        const dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < 9000) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255,120,190,${.14 * (1 - dist2 / 9000)})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })(0);
}

/* ---------- Параллакс блобов по мыши ---------- */
if (matchMedia('(pointer:fine)').matches && !prefersReduced) {
  const blobs = $$('.blob');
  addEventListener('mousemove', e => {
    const nx = (e.clientX / innerWidth - .5);
    const ny = (e.clientY / innerHeight - .5);
    blobs.forEach((b, i) => {
      const depth = (i + 1) * 18;
      b.style.marginLeft = (nx * depth) + 'px';
      b.style.marginTop = (ny * depth) + 'px';
    });
  });
}

/* ---------- 3D-tilt карточки ---------- */
if (matchMedia('(pointer:fine)').matches && !prefersReduced) {
  $$('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---------- Магнитные кнопки ---------- */
if (matchMedia('(pointer:fine)').matches && !prefersReduced) {
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * .22}px, ${y * .3}px) scale(1.05)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ---------- Космический кот: лапки у клавиатуры ---------- */
const catDesk = $('#catDesk');
if (catDesk && !prefersReduced) {
  const deskKb = $('#deskKb');
  const deskKeys = $('#deskKeys');
  const pawL = $('#pawL');
  const pawR = $('#pawR');
  const yarn = $('#yarn');
  const plush = $('#plushMouse');

  /* виртуальная клавиатура (русская раскладка, упрощённая) */
  const LAYOUT = [
    ['Ё','1','2','3','4','5','6','7','8','9','0'],
    ['Й','Ц','У','К','Е','Н','Г','Ш','Щ','З','Х'],
    ['Ф','Ы','В','А','П','Р','О','Л','Д','Ж','Э'],
    ['Я','Ч','С','М','И','Т','Ь','Б','Ю'],
    ['␣']
  ];
  const keyEls = {};
  LAYOUT.forEach((row, ri) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.forEach(k => {
      const el = document.createElement('span');
      el.className = 'kb-key' + (k === '␣' ? ' kb-key--wide' : '');
      el.textContent = k === '␣' ? 'пробел' : k;
      rowEl.appendChild(el);
      if (k !== '␣') keyEls[k] = el;
      if (k === '␣') keyEls[' '] = el;
    });
    deskKeys.appendChild(rowEl);
  });

  /* лапки выезжают, когда человек начинает писать */
  let hideTimer = null;
  function showDesk() {
    clearTimeout(hideTimer);
    catDesk.classList.add('is-up');
    deskKb.classList.add('is-active');
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      catDesk.classList.remove('is-up');
      deskKb.classList.remove('is-active');
      yarn.classList.remove('is-rolling');
    }, 2600);
  }
  document.addEventListener('focusin', e => {
    if (e.target.matches('input, textarea')) showDesk();
  });
  document.addEventListener('focusout', e => {
    if (e.target.matches('input, textarea')) scheduleHide();
  });

  /* лапки двигаются за курсором */
  let mx = innerWidth / 2, my = innerHeight / 2;
  let lx = 0, ly = 0, rx = 0, ry = 0;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function movePaws() {
    if (catDesk.classList.contains('is-up')) {
      const kbR = deskKb.getBoundingClientRect();
      const cx = kbR.left + kbR.width / 2;
      const cy = kbR.top;
      // нормализованное смещение курсора относительно клавиатуры
      const tLx = Math.max(-46, Math.min(46, (mx - cx) * 0.16 - 34));
      const tLy = Math.max(-70, Math.min(26, (my - cy) * 0.14 - 46));
      const tRx = Math.max(-46, Math.min(46, (mx - cx) * 0.16 + 34));
      const tRy = Math.max(-70, Math.min(26, (my - cy) * 0.14 - 46));
      lx += (tLx - lx) * .09; ly += (tLy - ly) * .09;
      rx += (tRx - rx) * .09; ry += (tRy - ry) * .09;
      pawL.style.transform = `translate(${lx}px, ${ly}px)`;
      pawR.style.transform = `translate(${rx}px, ${ry}px)`;
    }
    requestAnimationFrame(movePaws);
  }
  movePaws();

  /* при наборе текста лапки «печатают», клавиши нажимаются */
  let lastPaw = 'r', tapLock = 0;
  document.addEventListener('keydown', e => {
    if (!e.target.matches('input, textarea')) return;
    showDesk();
    const ch = e.key.toUpperCase();
    const keyEl = keyEls[ch];
    if (keyEl) {
      keyEl.classList.add('is-hit');
      setTimeout(() => keyEl.classList.remove('is-hit'), 180);
    }
    const now = performance.now();
    if (now - tapLock > 130) {
      tapLock = now;
      const paw = lastPaw === 'l' ? pawR : pawL; // чередуем, как при слепой печати
      paw.style.setProperty('--tw', lastPaw === 'l' ? '5deg' : '-5deg');
      paw.classList.remove('is-tapping');
      void paw.offsetWidth; // рестарт анимации
      paw.classList.add('is-tapping');
      lastPaw = lastPaw === 'l' ? 'r' : 'l';
      yarn.classList.add('is-rolling');
      clearTimeout(window.__yarnT);
      window.__yarnT = setTimeout(() => yarn.classList.remove('is-rolling'), 900);
    }
    /* мышка на коврике «играется» иногда при наборе */
    if (Math.random() < .12) {
      plush.classList.remove('is-play');
      void plush.offsetWidth;
      plush.classList.add('is-play');
    }
  });
}

/* ---------- Слайдер отзывов ---------- */
const track = $('#revTrack');
if (track) {
  const slides = $$('.review', track);
  const dotsBox = $('#revDots');
  let index = 0, perView = 3, timer;

  function calcPerView() {
    const w = innerWidth;
    perView = w <= 640 ? 1 : w <= 1080 ? 2 : 3;
  }
  function maxIndex() { return Math.max(0, slides.length - perView); }

  function buildDots() {
    dotsBox.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const d = document.createElement('button');
      d.className = 'rdot' + (i === index ? ' is-active' : '');
      d.setAttribute('aria-label', 'Слайд ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsBox.appendChild(d);
    }
  }
  function go(i) {
    index = Math.max(0, Math.min(i, maxIndex()));
    const gap = 24;
    const step = slides[0].getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-index * step}px)`;
    $$('.rdot', dotsBox).forEach((d, k) => d.classList.toggle('is-active', k === index));
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (!prefersReduced) timer = setInterval(() => go(index >= maxIndex() ? 0 : index + 1), 5000);
  }

  $('#revNext').addEventListener('click', () => go(index >= maxIndex() ? 0 : index + 1));
  $('#revPrev').addEventListener('click', () => go(index <= 0 ? maxIndex() : index - 1));

  // свайпы
  let sx = null;
  const vp = $('#revViewport');
  vp.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  vp.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 45) go(dx < 0 ? index + 1 : index - 1);
    sx = null;
  });
  vp.addEventListener('mouseenter', () => clearInterval(timer));
  vp.addEventListener('mouseleave', restart);

  addEventListener('resize', () => { calcPerView(); buildDots(); go(index); });
  calcPerView(); buildDots(); restart();
}

/* ---------- Статус «открыто/закрыто» ---------- */
const pill = $('#openPill');
if (pill) {
  const now = new Date();
  const day = now.getDay();           // 0 = вс
  const hour = now.getHours() + now.getMinutes() / 60;
  const open = (day >= 1 && day <= 5 && hour >= 9 && hour < 19) ||
               (day === 6 && hour >= 10 && hour < 16);
  pill.textContent = open ? '● открыто сейчас' : '● закрыто';
  pill.classList.toggle('is-closed', !open);
}

/* ---------- Модальное окно ---------- */
const modal = $('#modal');
let lastFocused = null;

function openModal() {
  lastFocused = document.activeElement;
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  $('[data-step="form"]', modal).hidden = false;
  $('[data-step="success"]', modal).hidden = true;
  setTimeout(() => $('input', modal)?.focus(), 350);
}
function closeModal() {
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  lastFocused?.focus();
}
$$('[data-modal-open]').forEach(b => b.addEventListener('click', openModal));
$$('[data-modal-close]').forEach(b => b.addEventListener('click', closeModal));
addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

/* ---------- Валидация и отправка форм ---------- */
function validate(form) {
  let ok = true;
  $$('input[required]', form).forEach(inp => {
    const bad = !inp.value.trim() ||
      (inp.type === 'tel' && inp.value.replace(/\D/g, '').length < 10);
    inp.classList.toggle('is-error', bad);
    if (bad) ok = false;
  });
  return ok;
}
$$('input, textarea').forEach(inp =>
  inp.addEventListener('input', () => inp.classList.remove('is-error'))
);

function handleForm(form, onSuccess) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(form)) return;
    const btn = $('button[type="submit"]', form);
    const old = btn.textContent;
    btn.textContent = 'Отправляем…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = old;
      btn.disabled = false;
      form.reset();
      onSuccess();
    }, 900);
  });
}

handleForm($('#mainForm'), () => {
  // короткий тост вместо модалки для основной формы
  const t = document.createElement('div');
  t.textContent = '✅ Спасибо! Мы свяжемся с вами в ближайшее время.';
  Object.assign(t.style, {
    position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%) translateY(30px)',
    padding: '15px 26px', borderRadius: '99px', zIndex: 999, fontWeight: '700',
    background: 'linear-gradient(120deg,#ff3d9a,#8b5cf6)', color: '#fff',
    boxShadow: '0 18px 40px -14px rgba(255,61,154,.8)', opacity: '0',
    transition: 'all .5s cubic-bezier(.22,.8,.28,1)'
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(30px)';
    setTimeout(() => t.remove(), 600);
  }, 3800);
});

handleForm($('#modalForm'), () => {
  $('[data-step="form"]', modal).hidden = true;
  $('[data-step="success"]', modal).hidden = false;
});

/* ---------- Cookies ---------- */
const cookies = $('#cookies');
if (!localStorage.getItem('px_cookies_ok')) {
  setTimeout(() => cookies.classList.add('is-shown'), 1600);
}
$('#cookiesOk').addEventListener('click', () => {
  localStorage.setItem('px_cookies_ok', '1');
  cookies.classList.remove('is-shown');
});

/* ---------- Плавный скролл по якорям (с учётом шапки) ---------- */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + scrollY - 76;
    scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
});

/* ---------- Активный пункт меню по скроллу ---------- */
const sections = ['about', 'geo', 'reviews', 'cta']
  .map(id => document.getElementById(id)).filter(Boolean);
const navLinks = $$('.nav__link[href^="#"]');
const secIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
  });
}, { threshold: .35 });
sections.forEach(s => secIO.observe(s));
