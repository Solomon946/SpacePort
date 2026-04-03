/* ═══════════════════════════════════════════════════════════
   PORTFOLIO — SCRIPT.JS
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Helpers ────────────────────────────────────────────── */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ═══════════════════════════════════════════════════════════
   1. PRELOADER
   ═══════════════════════════════════════════════════════════ */
(function initPreloader() {
    const counter = $('#preloaderCounter');
    const fill = $('#preloaderFill');
    const loader = $('#preloader');
    if (!loader) return;

    let progress = 0;
    const duration = 1800;
    const interval = 20;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
        progress = Math.min(progress + increment + Math.random() * 1.5, 100);
        const p = Math.floor(progress);
        if (counter) counter.textContent = p;
        if (fill) fill.style.width = p + '%';

        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                loader.classList.add('done');
                document.body.style.overflow = '';
                revealHero();
            }, 300);
        }
    }, interval);

    document.body.style.overflow = 'hidden';
})();

function revealHero() {
    $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        if (isInViewport(el)) el.classList.add('visible');
    });
}

function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92;
}

/* ═══════════════════════════════════════════════════════════
   2. HERO CANVAS — Particle Field
   ═══════════════════════════════════════════════════════════ */
(function initCanvas() {
    const canvas = $('#heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], animId;

    const GOLD = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim() || '#c9a84c';

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }

    class Particle {
        constructor() { this.reset(true); }
        reset(initial) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : H + 10;
            this.r = Math.random() * 1.2 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = -(Math.random() * 0.4 + 0.15);
            this.alpha = Math.random() * 0.5 + 0.1;
            this.life = 0;
            this.maxLife = Math.random() * 400 + 200;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life++;
            const progress = this.life / this.maxLife;
            this.currentAlpha = this.alpha * Math.sin(progress * Math.PI);
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

    // Draw subtle grid lines
    function drawGrid() {
        ctx.save();
        ctx.strokeStyle = 'rgba(201,168,76,0.025)';
        ctx.lineWidth = 1;
        const spacing = 80;
        for (let x = 0; x < W; x += spacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += spacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
    }

    // Draw gradient orbs
    function drawOrbs() {
        const orbs = [
            { x: W * 0.8, y: H * 0.2, r: W * 0.35, a: 0.06 },
            { x: W * 0.1, y: H * 0.8, r: W * 0.25, a: 0.04 },
        ];
        orbs.forEach(o => {
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `rgba(201,168,76,${o.a})`);
            g.addColorStop(1, 'rgba(201,168,76,0)');
            ctx.save();
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    let mouseX = W / 2, mouseY = H / 2;
    on(document, 'mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    function drawConnections() {
        ctx.save();
        particles.forEach((p, i) => {
            // Mouse connection
            const mdx = p.x - mouseX, mdy = p.y - mouseY;
            const md = Math.sqrt(mdx * mdx + mdy * mdy);
            if (md < 120) {
                ctx.globalAlpha = (1 - md / 120) * 0.15;
                ctx.strokeStyle = GOLD;
                ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouseX, mouseY); ctx.stroke();
            }
            // Particle connections
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x, dy = p.y - q.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 90) {
                    ctx.globalAlpha = (1 - d / 90) * 0.08;
                    ctx.strokeStyle = GOLD;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                }
            }
        });
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        drawOrbs();
        drawGrid();
        drawConnections();
        particles.forEach(p => { p.update(); p.draw(); });
        animId = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    let resizeTimer;
    on(window, 'resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            cancelAnimationFrame(animId);
            resize();
            initParticles();
            animate();
        }, 200);
    });
})();

/* ═══════════════════════════════════════════════════════════
   3. TYPING ANIMATION
   ═══════════════════════════════════════════════════════════ */
(function initTyping() {
    const el = $('#typingText');
    if (!el) return;

    const words = [
        'digital experiences.',
        'clean interfaces.',
        'scalable systems.',
        'beautiful products.',
        'performant apps.',
    ];

    let wordIndex = 0, charIndex = 0, isDeleting = false;

    function type() {
        const word = words[wordIndex];
        if (isDeleting) {
            el.textContent = word.slice(0, --charIndex);
        } else {
            el.textContent = word.slice(0, ++charIndex);
        }

        let delay = isDeleting ? 55 : 95;
        if (!isDeleting && charIndex === word.length) {
            delay = 1800;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 400;
        }
        setTimeout(type, delay);
    }

    setTimeout(type, 2200);
})();

/* ═══════════════════════════════════════════════════════════
   4. NAVIGATION
   ═══════════════════════════════════════════════════════════ */
(function initNav() {
    const nav = $('#navbar');
    const hamburger = $('#hamburger');
    const mobileMenu = $('#mobileMenu');
    const mobileLinks = $$('.mobile-link');
    let menuOpen = false;

    // Scroll behaviour
    on(window, 'scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        updateActiveLink();
        updateScrollProgress();
        toggleBackTop();
    }, { passive: true });

    // Hamburger
    on(hamburger, 'click', () => {
        menuOpen = !menuOpen;
        hamburger.classList.toggle('open', menuOpen);
        mobileMenu.classList.toggle('open', menuOpen);
        document.body.style.overflow = menuOpen ? 'hidden' : '';
    });

    // Close menu on link click
    mobileLinks.forEach(link => {
        on(link, 'click', () => {
            menuOpen = false;
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Smooth scroll for all internal links
    on(document, 'click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        e.preventDefault();
        const target = $(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
})();

/* ── Active nav link on scroll ─────────────────────────── */
function updateActiveLink() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');
    let current = '';

    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 200) current = sec.id;
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === current);
    });
}

/* ── Scroll Progress ─────────────────────────────────────── */
function updateScrollProgress() {
    const doc = document.documentElement;
    const pct = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
    const bar = $('#scrollProgress');
    if (bar) bar.style.width = pct + '%';
}

/* ── Back to Top ─────────────────────────────────────────── */
function toggleBackTop() {
    const btn = $('#backTop');
    if (btn) btn.classList.toggle('show', window.scrollY > 500);
}

on($('#backTop'), 'click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ═══════════════════════════════════════════════════════════
   5. THEME TOGGLE
   ═══════════════════════════════════════════════════════════ */
(function initTheme() {
    const btn = $('#themeToggle');
    const html = document.documentElement;
    const stored = localStorage.getItem('portfolio-theme');
    if (stored) html.dataset.theme = stored;

    on(btn, 'click', () => {
        const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
        html.dataset.theme = next;
        localStorage.setItem('portfolio-theme', next);
    });
})();

/* ═══════════════════════════════════════════════════════════
   6. CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════ */
(function initCursor() {
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    if (!dot || !ring || window.matchMedia('(hover: none)').matches) return;

    let rx = 0, ry = 0, mx = 0, my = 0;

    on(document, 'mousemove', e => { mx = e.clientX; my = e.clientY; });

    function animate() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animate);
    }
    animate();

    // Hover state on interactive elements
    const hoverTargets = 'a, button, .project-card, .tech-pill, .tag, .skill-bar-item';
    on(document, 'mouseover', e => {
        if (e.target.closest(hoverTargets)) ring.classList.add('hover');
    });
    on(document, 'mouseout', e => {
        if (e.target.closest(hoverTargets)) ring.classList.remove('hover');
    });

    on(document, 'mouseleave', () => {
        dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    on(document, 'mouseenter', () => {
        dot.style.opacity = '1'; ring.style.opacity = '1';
    });
})();

/* ═══════════════════════════════════════════════════════════
   7. INTERSECTION OBSERVER — Scroll Animations
   ═══════════════════════════════════════════════════════════ */
(function initScrollReveal() {
    const options = { threshold: 0.12, rootMargin: '0px 0px -50px 0px' };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve skills — needed for re-animation
                if (!entry.target.classList.contains('skill-bar-item')) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, options);

    // Observe reveal elements
    $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

    // Observe project cards with stagger
    const cardObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 120);
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    $$('.project-card').forEach(card => cardObserver.observe(card));

    // Timeline items
    const timelineObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    $$('.timeline-item').forEach(item => timelineObserver.observe(item));

    // Section headers
    $$('.section-header').forEach(h => {
        h.classList.add('reveal-up');
        observer.observe(h);
    });

    // About content
    $$('.about-content p, .about-tags, .about-image-wrap').forEach((el, i) => {
        el.classList.add('reveal-up');
        el.style.transitionDelay = (i * 0.12) + 's';
        observer.observe(el);
    });
})();

/* ═══════════════════════════════════════════════════════════
   8. SKILL BAR ANIMATION
   ═══════════════════════════════════════════════════════════ */
(function initSkillBars() {
    const skillObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target.querySelector('.skill-fill');
                const level = entry.target.dataset.level || 0;
                if (fill) {
                    setTimeout(() => { fill.style.width = level + '%'; }, 200);
                }
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    $$('.skill-bar-item').forEach(bar => skillObserver.observe(bar));
})();

/* ═══════════════════════════════════════════════════════════
   9. EXPERIENCE TABS
   ═══════════════════════════════════════════════════════════ */
(function initTabs() {
    const tabBtns = $$('.tab-btn');
    const workTL = $('#workTimeline');
    const eduTL = $('#educationTimeline');

    tabBtns.forEach(btn => {
        on(btn, 'click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (workTL && eduTL) {
                workTL.classList.toggle('hidden', tab !== 'work');
                eduTL.classList.toggle('hidden', tab !== 'education');

                // Re-trigger timeline animations
                const tl = tab === 'work' ? workTL : eduTL;
                $$('.timeline-item', tl).forEach((item, i) => {
                    item.classList.remove('visible');
                    setTimeout(() => item.classList.add('visible'), i * 120 + 50);
                });
            }
        });
    });

    // Initial trigger for work timeline
    setTimeout(() => {
        if (workTL) $$('.timeline-item', workTL).forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 150);
        });
    }, 800);
})();

/* ═══════════════════════════════════════════════════════════
   10. PROJECT MODALS
   ═══════════════════════════════════════════════════════════ */
(function initModals() {
    const overlay = $('#modalOverlay');
    const closeBtn = $('#modalClose');
    const content = $('#modalContent');

    const projects = [
        {
            title: 'FinSpace - Financial Dashboard',
            live: "https://fin-space.vercel.app/",
            github: "https://github.com/Solomon946/FinSpace",
            image: './images/fin-space.jpg',
            tag: 'Financial Platform',
            desc: 'Real-time financial dashboard with sub-second latency, handling data. Features include dynamic charting with D3.js, customizable goals, and a natural intuitive interface powered by FinSpace.',
            longDesc: 'Built as a modern financial dashboard inspired by FinSpace, this platform provides real-time insights into income, expenses, and budgeting. It features interactive charts, category-based tracking, and smart analytics to help users make better financial decisions. The UI is designed for clarity and speed, with responsive layouts and smooth data visualization for an intuitive user experience.',
            tech: ['JavaScript', 'Figma', 'Locomotive.js', 'Authentication', 'Firebase', 'CSS', 'Chart.js', 'Vercel'],
        },
        {
            title: 'SpaceAI - AI Based Security Platform',
            live: "https://spaceai-2815f.web.app/",
            github: "https://github.com/Solomon946/SpaceAI",
            image: './images/space-ai.jpg',
            tag: 'Security Platform',
            desc: 'An AI-powered security platform designed to monitor, detect, and respond to potential threats in real time. Features intelligent surveillance, anomaly detection, and a clean dashboard for system control and insights.',
            longDesc: 'Developed as a modern AI-driven security platform, SpaceAI leverages real-time data processing and intelligent algorithms to identify unusual activities and potential risks. The system includes a centralized dashboard with live monitoring, alert management, and analytics visualization. Designed with a focus on performance and usability, it offers a responsive interface, smooth interactions, and scalable architecture for handling multiple security endpoints efficiently.',
            tech: ['Encryption', 'Algorithms', 'JavaScript', 'AI Concepts', 'Real-time Monitoring', 'Data Visualization', 'AES-256']
        },
        {
            title: 'SpacePort - Personal Portfolio',
            live: "https://space-port-beta.vercel.app/",
            github: "https://github.com/Solomon946/SpacePort",
            image: './images/space-port.jpg',
            tag: 'Portfolio',
            desc: 'A modern, highly interactive personal portfolio designed to showcase projects, skills, and experience with smooth animations and a clean, professional UI. Focused on performance, responsiveness, and user engagement.',
            longDesc: 'Built as a visually engaging personal portfolio, SpacePort features a fully responsive design with smooth scroll animations, interactive project showcases, and dynamic UI components. The project emphasizes modern frontend practices using semantic HTML, modular CSS, and efficient JavaScript for DOM manipulation. It includes sections for projects, skills, and contact, along with micro-interactions and transitions that enhance user experience while maintaining fast load performance.',
            tech: ['Framer Motion', 'CSS / GSAP', 'JavaScript', 'Responsive Design', 'Animations', 'Vercel', 'Figma']
        },
        {
            title: 'SplitterSpace — Expense Splitter',
            image: './images/splitter-space.jpg',
            live: "https://splitter-space.vercel.app/",
            github: "https://github.com/Solomon946/SplitterSpace",
            tag: 'Expense Splitter',
            desc: 'A smart expense splitting web app that allows users to manage shared expenses, track balances, and simplify who owes whom with a clean and intuitive interface.',
            longDesc: 'Built as a practical financial utility, SplitterSpace enables users to add participants, record shared expenses, and automatically calculate balances with optimized debt simplification. The application features a responsive design, smooth UI interactions, and dynamic DOM updates for real-time feedback. It uses local storage for data persistence and includes interactive components like modals, animated lists, and validation for a seamless user experience.',
            tech: ['Vercel', 'Figma', 'JavaScript', 'LocalStorage', 'Responsive Design', 'UI Animations']
        },
    ];

    function openModal(index) {
        const p = projects[index];
        if (!p || !content) return;
        content.innerHTML = `
        <div class="modal-project-img"><img src="${p.image}" alt="${p.title}"></div>
           <div class="modal-tag"><span class="modal-tag-label">${p.tag}</span></div>
           <h2>${p.title}</h2>
           <p>${p.desc}</p>
           <p>${p.longDesc}</p>
           <div class="modal-tech">
             ${(p.tech || []).map(t => `<span>${t}</span>`).join('')}
           </div>
           <div class="modal-actions">
             <a href="${p.live}" class="btn btn-primary" target="_blank"></a>
               <span>Live Demo</span>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
             </a>
             <a href="${p.github}" class="btn btn-ghost" target="_blank">
               <span>GitHub</span>
               <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
       </a>
           </div>`;

         overlay.classList.add('open');
         document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    on(document, 'click', e => {
        const btn = e.target.closest('.view-btn');
        if (btn) openModal(parseInt(btn.dataset.modal));
    });

    on(closeBtn, 'click', closeModal);
    on(overlay, 'click', e => { if (e.target === overlay) closeModal(); });
    on(document, 'keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* ═══════════════════════════════════════════════════════════
   11. CONTACT FORM VALIDATION
   ═══════════════════════════════════════════════════════════ */
(function initForm() {
    const form = $('#contactForm');
    if (!form) return;

    const fields = [
        { id: 'formName', errorId: 'nameError', validate: v => v.trim().length >= 2 },
        { id: 'formEmail', errorId: 'emailError', validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
        { id: 'formSubject', errorId: 'subjectError', validate: v => v.trim().length >= 3 },
        { id: 'formMessage', errorId: 'messageError', validate: v => v.trim().length >= 10 },
    ];

    function validateField(field) {
        const input = $(`#${field.id}`);
        const error = $(`#${field.errorId}`);
        if (!input || !error) return true;

        const valid = field.validate(input.value);
        input.classList.toggle('error', !valid);
        error.classList.toggle('show', !valid);
        return valid;
    }

    // Real-time validation
    fields.forEach(field => {
        const input = $(`#${field.id}`);
        on(input, 'blur', () => validateField(field));
        on(input, 'input', () => {
            if (input.classList.contains('error')) validateField(field);
        });
    });

    on(form, 'submit', e => {
        e.preventDefault();
        const allValid = fields.every(f => validateField(f));
        if (!allValid) return;

        const btn = form.querySelector('button[type="submit"]');
        const btnText = btn?.querySelector('.btn-text');
        const success = $('#formSuccess');

        if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
        if (btnText) btnText.textContent = 'Sending…';

        // Simulate send
        setTimeout(() => {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            if (btnText) btnText.textContent = 'Send Message';
            if (success) success.classList.add('show');
            form.reset();
            // Remove floating labels
            $$('.form-input', form).forEach(i => i.blur());
            setTimeout(() => success?.classList.remove('show'), 5000);
        }, 1400);
    });
})();

/* ═══════════════════════════════════════════════════════════
   12. PARALLAX (subtle)
   ═══════════════════════════════════════════════════════════ */
(function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    on(window, 'scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroContent = $('.hero-content');
                if (heroContent && scrollY < window.innerHeight) {
                    heroContent.style.transform = `translateY(${scrollY * 0.18}px)`;
                    heroContent.style.opacity = 1 - (scrollY / window.innerHeight) * 1.2;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════
   13. TECH PILLS — Stagger on scroll
   ═══════════════════════════════════════════════════════════ */
(function initTechPills() {
    const pills = $$('.tech-pill');
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            pills.forEach((p, i) => {
                p.style.opacity = '0';
                p.style.transform = 'translateY(12px)';
                setTimeout(() => {
                    p.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    p.style.opacity = '';
                    p.style.transform = '';
                }, i * 60);
            });
            observer.disconnect();
        }
    }, { threshold: 0.3 });

    const wrap = $('.tech-orbit-wrap');
    if (wrap) observer.observe(wrap);
})();

/* ═══════════════════════════════════════════════════════════
   14. BUTTON RIPPLE EFFECT
   ═══════════════════════════════════════════════════════════ */
on(document, 'click', e => {
    const btn = e.target.closest('.btn-primary');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
    position:absolute;
    width:${size}px;height:${size}px;
    left:${e.clientX - rect.left - size / 2}px;
    top:${e.clientY - rect.top - size / 2}px;
    background:rgba(255,255,255,0.2);
    border-radius:50%;
    transform:scale(0);
    animation:ripple 0.55s linear;
    pointer-events:none;
  `;

    const style = document.createElement('style');
    style.textContent = '@keyframes ripple{to{transform:scale(2.5);opacity:0}}';
    if (!document.querySelector('#ripple-style')) {
        style.id = 'ripple-style';
        document.head.appendChild(style);
    }

    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

/* ═══════════════════════════════════════════════════════════
   15. SECTION TAG COUNTERS — Animated number on scroll
   ═══════════════════════════════════════════════════════════ */
(function initCounters() {
    const statNums = $$('.stat-num');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.textContent);
            const suffix = el.textContent.replace(/[0-9]/g, '');
            let current = 0;
            const steps = 40;
            const increment = target / steps;
            const timer = setInterval(() => {
                current = Math.min(current + increment, target);
                el.textContent = Math.round(current) + suffix;
                if (current >= target) clearInterval(timer);
            }, 35);
            observer.unobserve(el);
        });
    }, { threshold: 0.8 });

    statNums.forEach(n => observer.observe(n));
})();

/* ═══════════════════════════════════════════════════════════
   INIT — Run on DOM ready
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Initial nav state
    updateActiveLink();
    updateScrollProgress();
    toggleBackTop();

    // Lazy load images (future-proofing)
    if ('loading' in HTMLImageElement.prototype) {
        $$('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        const lazyObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.src = e.target.dataset.src;
                    lazyObserver.unobserve(e.target);
                }
            });
        });
        $$('img[data-src]').forEach(img => lazyObserver.observe(img));
    }
});

/* ── Console Easter Egg ─────────────────────────────────── */
console.log(
    '%c✦ Alex Mercer — Portfolio%c\nBuilt with vanilla HTML, CSS & JS.\nInterested in collaborating? Let\'s talk!',
    'color:#c9a84c;font-size:1.2rem;font-weight:bold;',
    'color:#888;font-size:0.85rem;'
);
const img = document.getElementById("avatarPhoto");

img.onload = function () {
    img.classList.add("loaded");
};
