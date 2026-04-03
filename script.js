/* ═══════════════════════════════════════════════════════════
   SPACEPORT — SCRIPT.JS
   ═══════════════════════════════════════════════════════════ */

'use strict';

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ═══════════════════════════════════════════════════════════
   1. PRELOADER
   ═══════════════════════════════════════════════════════════ */
(function initPreloader() {
  const counter = $('#preloaderCounter');
  const fill    = $('#preloaderFill');
  const loader  = $('#preloader');
  if (!loader) return;

  document.body.style.overflow = 'hidden';
  let progress = 0;

  const timer = setInterval(() => {
    progress = Math.min(progress + (100 / 90) + Math.random() * 1.5, 100);
    const p = Math.floor(progress);
    if (counter) counter.textContent = p;
    if (fill)    fill.style.width = p + '%';
    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        loader.classList.add('done');
        document.body.style.overflow = '';
        revealHero();
      }, 300);
    }
  }, 20);
})();

function revealHero() {
  $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    if (isInViewport(el)) el.classList.add('visible');
  });
}
function isInViewport(el) {
  return el.getBoundingClientRect().top < window.innerHeight * 0.92;
}

/* ═══════════════════════════════════════════════════════════
   2. DEVELOPER PHOTO — About Section
   ─────────────────────────────────────────────────────────
   The <img id="developerPhoto"> starts at opacity:0 in CSS.
   Once it loads we add class "loaded" → CSS fades it in and
   simultaneously fades out the "SM" initials fallback.
   If it fails (404, wrong path) we hide the img tag so the
   initials remain visible as the fallback.
   ═══════════════════════════════════════════════════════════ */
(function initDeveloperPhoto() {
  const photo    = $('#developerPhoto');
  const initials = $('#devInitials');
  if (!photo) return;

  function onLoad() {
    photo.classList.add('loaded');
    // CSS sibling selector handles initials fade, but belt+braces:
    if (initials) {
      initials.style.opacity = '0';
      initials.style.pointerEvents = 'none';
    }
  }

  function onError() {
    // Image not found — show initials, hide broken <img>
    photo.style.display = 'none';
    if (initials) {
      initials.style.opacity = '1';
      initials.style.pointerEvents = '';
    }
  }

  // Image might already be cached and complete
  if (photo.complete) {
    if (photo.naturalWidth > 0) onLoad();
    else onError();
  } else {
    on(photo, 'load',  onLoad);
    on(photo, 'error', onError);
  }
})();

/* ═══════════════════════════════════════════════════════════
   3. HERO CANVAS — Particle Field
   ═══════════════════════════════════════════════════════════ */
(function initCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;
  const GOLD = '#c9a84c';

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.2 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.4 + 0.15);
      this.alpha   = Math.random() * 0.5 + 0.1;
      this.life    = 0;
      this.maxLife = Math.random() * 400 + 200;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      const p = this.life / this.maxLife;
      this.currentAlpha = this.alpha * Math.sin(p * Math.PI);
      if (this.life >= this.maxLife) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.currentAlpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.restore();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 10000), 80);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
  }

  function drawOrbs() {
    [{ x:W*0.8, y:H*0.2, r:W*0.35, a:0.06 }, { x:W*0.1, y:H*0.8, r:W*0.25, a:0.04 }].forEach(o => {
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `rgba(201,168,76,${o.a})`);
      g.addColorStop(1, 'rgba(201,168,76,0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill(); ctx.restore();
    });
  }

  let mouseX = -1e4, mouseY = -1e4;
  on(document, 'mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  function drawConnections() {
    ctx.save();
    particles.forEach((p, i) => {
      const mdx = p.x - mouseX, mdy = p.y - mouseY, md = Math.hypot(mdx, mdy);
      if (md < 120) {
        ctx.globalAlpha = (1 - md / 120) * 0.15;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouseX, mouseY); ctx.stroke();
      }
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 90) {
          ctx.globalAlpha = (1 - d / 90) * 0.08;
          ctx.strokeStyle = GOLD; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawOrbs(); drawGrid(); drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }

  resize(); initParticles(); animate();

  let rt;
  on(window, 'resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { cancelAnimationFrame(animId); resize(); initParticles(); animate(); }, 200);
  });
})();

/* ═══════════════════════════════════════════════════════════
   4. TYPING ANIMATION
   ═══════════════════════════════════════════════════════════ */
(function initTyping() {
  const el = $('#typingText');
  if (!el) return;
  const words = ['digital experiences.', 'clean interfaces.', 'scalable systems.', 'beautiful products.', 'performant apps.'];
  let wi = 0, ci = 0, del = false;

  function type() {
    const word = words[wi];
    el.textContent = del ? word.slice(0, --ci) : word.slice(0, ++ci);
    let delay = del ? 55 : 95;
    if (!del && ci === word.length) { delay = 1800; del = true; }
    else if (del && ci === 0)       { del = false; wi = (wi + 1) % words.length; delay = 400; }
    setTimeout(type, delay);
  }
  setTimeout(type, 2200);
})();

/* ═══════════════════════════════════════════════════════════
   5. NAVIGATION
   ═══════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = $('#navbar'), hamburger = $('#hamburger'), mobileMenu = $('#mobileMenu');
  let open = false;

  on(window, 'scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink(); updateScrollProgress(); toggleBackTop();
  }, { passive: true });

  on(hamburger, 'click', () => {
    open = !open;
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  $$('.mobile-link').forEach(link => on(link, 'click', () => {
    open = false;
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }));

  on(document, 'click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const t = $(link.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

function updateActiveLink() {
  let current = '';
  $$('section[id]').forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = s.id; });
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === current));
}
function updateScrollProgress() {
  const d = document.documentElement;
  const pct = (window.scrollY / (d.scrollHeight - d.clientHeight)) * 100;
  const bar = $('#scrollProgress');
  if (bar) bar.style.width = pct + '%';
}
function toggleBackTop() {
  const btn = $('#backTop');
  if (btn) btn.classList.toggle('show', window.scrollY > 500);
}
on($('#backTop'), 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ═══════════════════════════════════════════════════════════
   6. THEME TOGGLE
   ═══════════════════════════════════════════════════════════ */
(function initTheme() {
  const btn = $('#themeToggle'), html = document.documentElement;
  const stored = localStorage.getItem('spaceport-theme');
  if (stored) html.dataset.theme = stored;
  on(btn, 'click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('spaceport-theme', next);
  });
})();

/* ═══════════════════════════════════════════════════════════
   7. CUSTOM CURSOR
   ─────────────────────────────────────────────────────────
   The two cursor divs start at opacity:0 in CSS (invisible
   everywhere, including touch devices).

   This function runs ONLY if the device has a fine pointer
   (real mouse / trackpad).  On match:
     • Adds class "cursor-active" to <body> → CSS makes them
       visible (opacity:1) and sets body {cursor:none}.
     • Runs the RAF animation loop to position them.
     • Adds hover-ring enlargement on interactive elements.

   Touch phones / tablets → matchMedia fails → function does
   nothing → cursor elements stay invisible, body keeps
   cursor:auto → native cursor used normally.
   ═══════════════════════════════════════════════════════════ */
(function initCursor() {
  // Gate: fine pointer only (mouse / trackpad)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');
  if (!dot || !ring) return;

  // Activate: CSS will now show them and hide native cursor
  document.body.classList.add('cursor-active');

  let mx = window.innerWidth / 2,  my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let visible = false;

  // Track mouse
  on(document, 'mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!visible) {
      dot.style.opacity  = '';   // let CSS rule take over
      ring.style.opacity = '';
      visible = true;
    }
  });

  // Hide on leave, restore on enter
  on(document, 'mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; visible = false; });
  on(document, 'mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; visible = true; });

  // Animation loop
  (function animateCursor() {
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  })();

  // Hover state
  const targets = 'a, button, label, .project-card, .tech-pill, .tag, .skill-bar-item, .overlay-btn, input, textarea';
  on(document, 'mouseover', e => { if (e.target.closest(targets)) ring.classList.add('hover'); });
  on(document, 'mouseout',  e => { if (e.target.closest(targets)) ring.classList.remove('hover'); });
})();

/* ═══════════════════════════════════════════════════════════
   8. SCROLL REVEAL — Intersection Observer
   ═══════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  const opts = { threshold: 0.12, rootMargin: '0px 0px -50px 0px' };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, opts);

  $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

  // Staggered project cards
  const cardObs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 120);
        cardObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  $$('.project-card').forEach(c => cardObs.observe(c));

  // Timeline items
  const tlObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); tlObs.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  $$('.timeline-item').forEach(i => tlObs.observe(i));

  // Section headers
  $$('.section-header').forEach(h => { h.classList.add('reveal-up'); observer.observe(h); });

  // About content
  $$('.about-content p, .about-tags, .about-image-wrap').forEach((el, i) => {
    el.classList.add('reveal-up');
    el.style.transitionDelay = (i * 0.12) + 's';
    observer.observe(el);
  });
})();

/* ═══════════════════════════════════════════════════════════
   9. SKILL BARS
   ═══════════════════════════════════════════════════════════ */
(function initSkillBars() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill  = entry.target.querySelector('.skill-fill');
        const level = entry.target.dataset.level || 0;
        if (fill) setTimeout(() => fill.style.width = level + '%', 200);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  $$('.skill-bar-item').forEach(b => obs.observe(b));
})();

/* ═══════════════════════════════════════════════════════════
   10. EXPERIENCE TABS
   ═══════════════════════════════════════════════════════════ */
(function initTabs() {
  const workTL = $('#workTimeline'), eduTL = $('#educationTimeline');

  $$('.tab-btn').forEach(btn => on(btn, 'click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (!workTL || !eduTL) return;
    workTL.classList.toggle('hidden', tab !== 'work');
    eduTL.classList.toggle('hidden',  tab !== 'education');
    const tl = tab === 'work' ? workTL : eduTL;
    $$('.timeline-item', tl).forEach((item, i) => {
      item.classList.remove('visible');
      setTimeout(() => item.classList.add('visible'), i * 120 + 50);
    });
  }));

  setTimeout(() => {
    if (workTL) $$('.timeline-item', workTL).forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 150);
    });
  }, 800);
})();

/* ═══════════════════════════════════════════════════════════
   11. PROJECT MODALS
   ═══════════════════════════════════════════════════════════ */
(function initModals() {
  const overlay  = $('#modalOverlay');
  const closeBtn = $('#modalClose');
  const content  = $('#modalContent');

  const projects = [
    {
      title: 'FinSpace — Financial Dashboard',
      image: 'images/finspace.png',
      live:   'https://fin-space.vercel.app/',
      github: 'https://github.com/Solomon946/FinSpace',
      tag: 'Financial Platform',
      desc: 'Real-time financial dashboard with sub-second latency. Features dynamic charting with Chart.js, customisable goals, and an intuitive interface powered by FinSpace.',
      longDesc: 'Built as a modern financial dashboard, this platform provides real-time insights into income, expenses, and budgeting. Features interactive charts, category-based tracking, and smart analytics to help users make better financial decisions.',
      tech: ['JavaScript', 'Chart.js', 'Locomotive.js', 'Firebase', 'CSS', 'Figma', 'Vercel'],
    },
    {
      title: 'SpaceAI — AI Based Security Platform',
      image: 'images/spaceAI.png',
      live:   'https://spaceai-2815f.web.app/',
      github: 'https://github.com/Solomon946/SpaceAI',
      tag: 'Security Platform',
      desc: 'AI-powered security platform designed to monitor, detect, and respond to potential threats in real time. Features intelligent surveillance, anomaly detection, and a clean dashboard.',
      longDesc: 'Leverages real-time data processing and intelligent algorithms to identify unusual activities. Centralised dashboard with live monitoring, alert management, and analytics — built for handling multiple security endpoints.',
      tech: ['JavaScript', 'AES-256', 'Chart.js', 'Swipe.js', 'AI Concepts', 'Firebase'],
    },
    {
      title: 'SpacePort — Personal Portfolio',
      image: 'images/spaceport.png',
      live:   'https://space-port-beta.vercel.app/',
      github: 'https://github.com/Solomon946/SpacePort',
      tag: 'Portfolio',
      desc: 'Modern, highly interactive personal portfolio with smooth animations, interactive project showcases, and dynamic UI components built on pure HTML, CSS & JS.',
      longDesc: 'Emphasises modern frontend practices using semantic HTML, modular CSS, and efficient JavaScript for DOM manipulation. Features Intersection Observer scroll reveals, Canvas particle system, and CSS-only responsiveness.',
      tech: ['JavaScript', 'CSS', 'HTML5', 'Canvas API', 'Locomotive.js', 'Vercel', 'Figma'],
    },
    {
      title: 'SplitterSpace — Expense Splitter',
      image: 'images/splitterspace.png',
      live:   '#',
      github: '#',
      tag: 'Expense Splitter',
      desc: 'Smart expense splitting app that allows users to manage shared expenses, track balances, and simplify who owes whom with a clean and intuitive interface.',
      longDesc: 'Enables users to add participants, record shared expenses, and automatically calculate balances with optimised debt simplification. Features localStorage persistence, modals, animated lists, and full validation.',
      tech: ['JavaScript', 'Framer Motion', 'OpenAI', 'LocalStorage', 'Figma', 'CSS Grid'],
    },
  ];

  function openModal(idx) {
    const p = projects[idx];
    if (!p || !content) return;
    content.innerHTML = `
      <div class="modal-project-img" style="background:linear-gradient(135deg,hsl(${[220,160,30,280][idx]},30%,12%),hsl(${[250,190,60,310][idx]},40%,18%))">
        <img src="${p.image}" alt="${p.title}" onerror="this.style.display='none'" />
      </div>
      <div class="modal-tag"><span class="modal-tag-label">${p.tag}</span></div>
      <h2>${p.title}</h2>
      <p>${p.desc}</p>
      <p>${p.longDesc}</p>
      <div class="modal-tech">${p.tech.map(t => `<span>${t}</span>`).join('')}</div>
      <div class="modal-actions">
        <a href="${p.live}" class="btn btn-primary" target="_blank" rel="noopener">
          <span>Live Demo</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
        <a href="${p.github}" class="btn btn-ghost" target="_blank" rel="noopener">
          <span>GitHub</span>
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
        </a>
      </div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtn && closeBtn.focus(), 100);
  }

  function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  on(document, 'click', e => { const b = e.target.closest('.view-btn'); if (b) openModal(+b.dataset.modal); });
  on(closeBtn, 'click', closeModal);
  on(overlay, 'click', e => { if (e.target === overlay) closeModal(); });
  on(document, 'keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* ═══════════════════════════════════════════════════════════
   12. CONTACT FORM VALIDATION
   ═══════════════════════════════════════════════════════════ */
(function initForm() {
  const form = $('#contactForm');
  if (!form) return;

  const fields = [
    { id: 'formName',    errorId: 'nameError',    validate: v => v.trim().length >= 2 },
    { id: 'formEmail',   errorId: 'emailError',   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 'formSubject', errorId: 'subjectError', validate: v => v.trim().length >= 3 },
    { id: 'formMessage', errorId: 'messageError', validate: v => v.trim().length >= 10 },
  ];

  function vf(field) {
    const input = $(`#${field.id}`), err = $(`#${field.errorId}`);
    if (!input || !err) return true;
    const ok = field.validate(input.value);
    input.classList.toggle('error', !ok);
    err.classList.toggle('show', !ok);
    return ok;
  }

  fields.forEach(f => {
    const input = $(`#${f.id}`);
    on(input, 'blur',  () => vf(f));
    on(input, 'input', () => { if (input.classList.contains('error')) vf(f); });
  });

  on(form, 'submit', e => {
    e.preventDefault();
    if (!fields.every(f => vf(f))) return;
    const btn = form.querySelector('button[type="submit"]');
    const txt = btn?.querySelector('.btn-text');
    const ok  = $('#formSuccess');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
    if (txt)  txt.textContent = 'Sending…';
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
      if (txt)  txt.textContent = 'Send Message';
      if (ok)   ok.classList.add('show');
      form.reset();
      $$('.form-input', form).forEach(i => i.blur());
      setTimeout(() => ok?.classList.remove('show'), 5000);
    }, 1400);
  });
})();

/* ═══════════════════════════════════════════════════════════
   13. PARALLAX — Hero fade on scroll
   ═══════════════════════════════════════════════════════════ */
(function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  on(window, 'scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sy = window.scrollY, hc = $('.hero-content');
      if (hc && sy < window.innerHeight) {
        hc.style.transform = `translateY(${sy * 0.18}px)`;
        hc.style.opacity   = String(Math.max(0, 1 - (sy / window.innerHeight) * 1.2));
      }
      ticking = false;
    });
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════
   14. TECH PILLS — Stagger reveal
   ═══════════════════════════════════════════════════════════ */
(function initTechPills() {
  const pills = $$('.tech-pill'), wrap = $('.tech-orbit-wrap');
  if (!wrap) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      pills.forEach((p, i) => {
        p.style.opacity = '0'; p.style.transform = 'translateY(12px)';
        setTimeout(() => {
          p.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          p.style.opacity = ''; p.style.transform = '';
        }, i * 60);
      });
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(wrap);
})();

/* ═══════════════════════════════════════════════════════════
   15. BUTTON RIPPLE
   ═══════════════════════════════════════════════════════════ */
(function initRipple() {
  const s = document.createElement('style');
  s.textContent = '@keyframes ripple{to{transform:scale(2.5);opacity:0}}';
  document.head.appendChild(s);

  on(document, 'click', e => {
    const btn = e.target.closest('.btn-primary');
    if (!btn) return;
    const rect = btn.getBoundingClientRect(), sz = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px;background:rgba(255,255,255,0.2);border-radius:50%;transform:scale(0);animation:ripple 0.55s linear;pointer-events:none;`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
})();

/* ═══════════════════════════════════════════════════════════
   16. STAT COUNTERS
   ═══════════════════════════════════════════════════════════ */
(function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.textContent), suffix = el.textContent.replace(/[0-9]/g,'');
      let cur = 0, step = target / 40;
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.round(cur) + suffix;
        if (cur >= target) clearInterval(t);
      }, 35);
      obs.unobserve(el);
    });
  }, { threshold: 0.8 });
  $$('.stat-num').forEach(n => obs.observe(n));
})();

/* ═══════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateActiveLink(); updateScrollProgress(); toggleBackTop();
});

/* Console signature */
console.log(
  '%c✦ Sagnik Mondal — SpacePort%c\nBuilt with vanilla HTML, CSS & JS.',
  'color:#c9a84c;font-size:1.1rem;font-weight:bold;',
  'color:#888;font-size:0.82rem;'
);
