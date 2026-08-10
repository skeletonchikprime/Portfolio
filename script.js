/* ============================================================
   STARFIELD + CONSTELLATION CANVAS
============================================================ */
(function starfield(){
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, stars = [];
  const cursor = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  const STAR_COUNT_BASE = 3200;
  let rafId = null;
  let isPressed = false;
  const LERP_FACTOR = 0.18;  // чем меньше — тем плавнее следование (0.1-0.3 оптимально)

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(STAR_COUNT_BASE, Math.floor((w * h) / 2400));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.35,
      baseAlpha: Math.random() * 0.55 + 0.3,
      tw: Math.random() * Math.PI * 2,
      twSpeed: Math.random() * 0.015 + 0.005,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      hue: Math.random() > 0.9 ? 'green' : (Math.random() > 0.55 ? 'purple' : 'white')
    }));
  }

  function draw(){
    // плавная интерполяция cursor → реальная позиция
    cursor.x += (cursor.tx - cursor.x) * LERP_FACTOR;
    cursor.y += (cursor.ty - cursor.y) * LERP_FACTOR;

    // если цель далеко — считаем что курсор «ушёл», не рисуем линии
    const mouse = { x: cursor.x, y: cursor.y };
    const isActive = Math.abs(cursor.tx - cursor.x) < 200 && Math.abs(cursor.ty - cursor.y) < 200;

    ctx.clearRect(0, 0, w, h);

    // constellation lines near cursor
    const linkDist = 130;
    if (isActive || isPressed) {
      for (let i = 0; i < stars.length; i++){
        const s = stars[i];
        const dx = s.x - mouse.x, dy = s.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist){
          const alpha = (1 - dist / linkDist) * 0.55;
          ctx.strokeStyle = `rgba(180,120,255,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < stars.length; i++){
      const s = stars[i];
      s.tw += s.twSpeed;
      const alpha = s.baseAlpha + Math.sin(s.tw) * 0.25;
      const color = s.hue === 'green' ? '57,255,160' : s.hue === 'purple' ? '196,164,255' : '237,233,247';
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color},${Math.max(0, alpha)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (!reduceMotion){
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // ── POINTER EVENTS (мышь + тач) ──
  // pointerdown: начало касания/клика — захватываем указатель, чтобы браузер не скроллил
  canvas.addEventListener('pointerdown', (e) => {
    isPressed = true;
    cursor.tx = e.clientX;
    cursor.ty = e.clientY;
    cursor.x = e.clientX;  // без задержки на старте
    cursor.y = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }, { passive: false });

  // pointermove: движение пальца/мыши
  canvas.addEventListener('pointermove', (e) => {
    cursor.tx = e.clientX;
    cursor.ty = e.clientY;
    if (isPressed) {
      // предотвращаем скролл при зажатии на canvas
      e.preventDefault();
    }
  }, { passive: false });

  // pointerup: отпускание
  canvas.addEventListener('pointerup', (e) => {
    isPressed = false;
    cursor.tx = -9999;
    cursor.ty = -9999;
    canvas.releasePointerCapture(e.pointerId);
  });

  // pointercancel: браузер отменил жест (например, системный зум)
  canvas.addEventListener('pointercancel', () => {
    isPressed = false;
    cursor.tx = -9999;
    cursor.ty = -9999;
  });

  // pointerleave: ушли за пределы canvas
  canvas.addEventListener('pointerleave', () => {
    cursor.tx = -9999;
    cursor.ty = -9999;
  });

  // для десктопа — mousemove по всему окну (когда не на canvas)
  window.addEventListener('mousemove', (e) => {
    if (!isPressed) {
      cursor.tx = e.clientX;
      cursor.ty = e.clientY;
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(draw);
    }
  });

  resize();
  draw();
})();

/* ============================================================
   TYPEWRITER
============================================================ */
(function typewriter(){
  const el = document.getElementById('typed');
  const phrases = [
    'Разрабатываю Telegram-ботов',
    'Собираю юзерботов под задачу',
    'Python · JavaScript · Node.js',
    'От идеи до релиза'
  ];
  let phraseIndex = 0, charIndex = 0, deleting = false;

  function tick(){
    const current = phrases[phraseIndex];
    if (!deleting){
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length){
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0){
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 55);
  }
  tick();
})();

/* ============================================================
   NAV — scroll state, active pill, mobile menu
============================================================ */
(function nav(){
  const navEl = document.getElementById('nav');
  const pills = document.querySelectorAll('.pill');
  const pillsWrap = document.getElementById('pills');
  const glow = document.getElementById('pillGlow');
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  const sections = ['projects', 'plugins', 'about', 'contacts'].map(id => document.getElementById(id));

  window.addEventListener('scroll', () => {
    navEl.classList.toggle('scrolled', window.scrollY > 40);
    if (mobileMenu.classList.contains('open')) closeMenu();
  }, { passive: true });

  function moveGlow(pill){
    if (!pill) { glow.style.width = '0px'; return; }
    const wrapRect = pillsWrap.getBoundingClientRect();
    const rect = pill.getBoundingClientRect();
    glow.style.width = rect.width + 'px';
    glow.style.transform = `translateX(${rect.left - wrapRect.left - 5}px)`;
  }

  function setActive(id){
    pills.forEach(p => p.classList.toggle('active', p.dataset.target === id));
    mobileLinks.forEach(p => p.classList.toggle('active', p.dataset.target === id));
    moveGlow(document.querySelector(`.pill[data-target="${id}"]`));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        setActive(entry.target.id);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => s && observer.observe(s));

  let closeTimer;

  function closeMenu(){
    if (!mobileMenu.classList.contains('open')) return;
    mobileMenu.classList.add('closing');
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => mobileMenu.classList.remove('closing'), 450);
  }

  function openMenu(){
    clearTimeout(closeTimer);
    mobileMenu.classList.remove('closing');
    mobileMenu.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', true);
  }

  burger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) closeMenu();
    else openMenu();
  });
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !burger.contains(e.target)){
      closeMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  window.addEventListener('resize', () => {
    moveGlow(document.querySelector('.pill.active'));
    if (window.innerWidth > 760) closeMenu();
  });
})();

/* ============================================================
   SCROLL REVEAL
============================================================ */
(function reveal(){
  const targets = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => observer.observe(t));
})();

/* ============================================================
   STATIC CARD SPOTLIGHT (stats, contacts)
============================================================ */
(function spotlight(){
  ['.about-stats', '.contacts-grid'].forEach(sel => {
    const wrap = document.querySelector(sel);
    if (!wrap) return;
    wrap.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.stat-card, .contact-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
})();

/* ============================================================
   STAT COUNTERS
============================================================ */
(function counters(){
  const nums = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1200;
      const start = performance.now();
      function step(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => observer.observe(n));
})();

/* ============================================================
   STATUS / GITHUB LABEL MAPS
============================================================ */
const STATUS_MAP = {
  online:  { label: 'Онлайн',        class: 'status-online' },
  offline: { label: 'Оффлайн',       class: 'status-offline' },
  dev:     { label: 'В разработке',  class: 'status-dev' },
  beta:    { label: 'Бета',          class: 'status-beta' },
  release: { label: 'Релиз',         class: 'status-release' }
};

function statusMeta(status){
  return STATUS_MAP[status] || { label: status || 'Неизвестно', class: 'status-default' };
}

function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/* ============================================================
   CARD RENDERING (used for both projects.json and plugins.json)
============================================================ */
function renderCard(item){
  const st = statusMeta(item.status);
  const tech = Array.isArray(item.tech) ? item.tech : [];

  const clientHtml = item.client && item.client.name
    ? `<div class="card-client">
         <span>Заказчик:</span>
         ${item.client.link
            ? `<a href="${escapeHtml(item.client.link)}" target="_blank" rel="noopener">${escapeHtml(item.client.name)}</a>`
            : `<span>${escapeHtml(item.client.name)}</span>`}
       </div>`
    : '';

  let githubHtml = '';
  if (item.github_status === 'public' && item.github_url){
    githubHtml = `<a class="action-github" href="${escapeHtml(item.github_url)}" target="_blank" rel="noopener">GitHub →</a>`;
  } else if (item.github_status === 'private'){
    githubHtml = `<span class="action-muted">Приватный код</span>`;
  } else {
    githubHtml = `<span class="action-muted">Закрытый код</span>`;
  }

  const liveHtml = item.live_url
    ? `<a class="action-live" href="${escapeHtml(item.live_url)}" target="_blank" rel="noopener">Открыть →</a>`
    : '';

  return `
    <article class="card" data-category="${escapeHtml(item.category || '')}">
      <div class="card-top">
        <span class="status ${st.class}"><i class="sdot"></i>${escapeHtml(st.label)}</span>
        ${item.date ? `<span class="date mono">${escapeHtml(item.date)}</span>` : ''}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="desc">${escapeHtml(item.desc)}</p>
      ${tech.length ? `<div class="tags">${tech.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      ${clientHtml}
      <div class="card-actions">${liveHtml}${githubHtml}</div>
    </article>
  `;
}

function observeNewCards(container){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('in-view'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  container.querySelectorAll('.card').forEach(c => observer.observe(c));
}

function attachSpotlight(grid){
  if (grid.dataset.spotlightBound) return;
  grid.dataset.spotlightBound = '1';
  grid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
}

const ALL_LABEL = 'Все';

function applyFilter(grid, category){
  const cards = Array.from(grid.querySelectorAll('.card'));
  let shownIndex = 0;
  cards.forEach(card => {
    const match = category === ALL_LABEL || card.dataset.category === category;
    if (match){
      card.style.display = '';
      card.classList.remove('card-hidden');
      const delay = shownIndex * 50;
      shownIndex++;
      setTimeout(() => card.classList.add('in-view'), delay);
    } else {
      card.classList.remove('in-view');
      card.classList.add('card-hidden');
      setTimeout(() => {
        if (card.classList.contains('card-hidden')) card.style.display = 'none';
      }, 400);
    }
  });
}

function moveFilterGlow(bar, glow, pill){
  if (!pill){ glow.style.width = '0px'; return; }
  const barRect = bar.getBoundingClientRect();
  const rect = pill.getBoundingClientRect();
  glow.style.width = rect.width + 'px';
  glow.style.transform = `translateX(${rect.left - barRect.left + bar.scrollLeft - 22}px)`;
}

function makeDraggable(bar, onDragEnd){
  let isDown = false, dragged = false, startX = 0, startScroll = 0;

  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.filter-pill') === null) return;
    isDown = true;
    dragged = false;
    startX = e.clientX;
    startScroll = bar.scrollLeft;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6){
      dragged = true;
      bar.classList.add('dragging');
    }
    bar.scrollLeft = startScroll - dx;
  });
  const release = () => {
    isDown = false;
    bar.classList.remove('dragging');
    if (dragged) onDragEnd();
  };
  bar.addEventListener('pointerup', release);
  bar.addEventListener('pointercancel', release);
  bar.addEventListener('click', (e) => {
    if (dragged){ e.preventDefault(); e.stopPropagation(); dragged = false; }
  }, true);
}

function setupFilters(filterBarId, grid, items){
  const bar = document.getElementById(filterBarId);
  if (!bar) return;

  const categories = [];
  items.forEach(item => {
    if (item.category && !categories.includes(item.category)) categories.push(item.category);
  });
  if (categories.length === 0){
    bar.parentElement.style.display = 'none';
    return;
  }

  const glow = document.createElement('span');
  glow.className = 'filter-glow';
  bar.innerHTML = '';
  bar.appendChild(glow);
  [ALL_LABEL, ...categories].forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-pill' + (i === 0 ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = cat;
    bar.appendChild(btn);
  });

  requestAnimationFrame(() => moveFilterGlow(bar, glow, bar.querySelector('.filter-pill.active')));

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn || btn.classList.contains('active')) return;
    bar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    moveFilterGlow(bar, glow, btn);
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    applyFilter(grid, btn.dataset.cat);
  });

  makeDraggable(bar, () => moveFilterGlow(bar, glow, bar.querySelector('.filter-pill.active')));

  window.addEventListener('resize', () => moveFilterGlow(bar, glow, bar.querySelector('.filter-pill.active')));
}

async function loadData(jsonPath, gridId, filterBarId){
  const grid = document.getElementById(gridId);
  try {
    const res = await fetch(jsonPath, { cache: 'no-store' });
    if (!res.ok) throw new Error('Network response was not ok');
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0){
      grid.innerHTML = `<p class="loader mono">пока пусто — загляните позже</p>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join('');
    observeNewCards(grid);
    attachSpotlight(grid);
    setupFilters(filterBarId, grid, items);
  } catch (err) {
    console.error(`Не удалось загрузить ${jsonPath}:`, err);
    grid.innerHTML = `<p class="loader mono">не удалось загрузить данные (${escapeHtml(jsonPath)})</p>`;
  }
}

loadData('projects.json', 'projectsGrid', 'projectsFilter');
loadData('plugins.json', 'pluginsGrid', 'pluginsFilter');