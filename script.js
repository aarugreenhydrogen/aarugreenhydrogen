/* ================================================================
   AARU GREEN HYDROGEN — MAIN SCRIPT
   Sections: Three.js particle background, nav scroll/progress,
   active nav link tracking, scroll-reveal animations,
   modal (with focus trap), contact form (validation + submission).
   ================================================================ */


  // ── THREE.JS PARTICLE BACKGROUND ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 30;

  const count = 1800;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 140;
    pos[i*3+1] = (Math.random() - 0.5) * 90;
    pos[i*3+2] = (Math.random() - 0.5) * 70 - 20;
    sizes[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x6fa845, size: 0.1, transparent: true, opacity: 0.22, sizeAttenuation: true
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  let t = 0;
  let animationPaused = false;
  (function animate() {
    requestAnimationFrame(animate);
    if (animationPaused) return;
    t += 0.001;
    particles.rotation.y = t * 0.04;
    particles.rotation.x = Math.sin(t * 0.02) * 0.015;
    renderer.render(scene, camera);
  })();

  document.addEventListener('visibilitychange', () => {
    animationPaused = document.hidden;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── NAV SCROLL, PROGRESS BAR, BACK-TO-TOP ──
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 40);
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  // ── ACTIVE NAV LINK ON SCROLL ──
  const navSections = Array.from(document.querySelectorAll('section[id]'));
  const navLinkMap = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
    navLinkMap[a.getAttribute('href').slice(1)] = a;
  });
  const navActiveObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const link = navLinkMap[e.target.id];
      if (!link) return;
      if (e.isIntersecting) {
        Object.values(navLinkMap).forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { threshold: 0, rootMargin: '-45% 0px -50% 0px' });
  navSections.forEach(s => navActiveObserver.observe(s));

  // ── SCROLL REVEAL ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── TECH BAR ANIMATION ──
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.tech-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.tech-grid').forEach(el => barObserver.observe(el));

  // ── REDUCED MOTION CHECK ──
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── COUNT-UP NUMBERS (hero stats, stats-bar, tech-metrics) ──
  function animateCountUp(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
    if (!match) return; // no numeric part (e.g. "Alkaline") — leave as-is
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(target)) return;
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    if (prefersReducedMotion) { el.textContent = prefix + numStr + suffix; return; }

    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = (target * eased).toFixed(decimals);
      el.textContent = prefix + Number(current).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + numStr + suffix;
    }
    requestAnimationFrame(tick);
  }
  const countTargets = document.querySelectorAll('.hero-stat-val, .stat-num, .tech-metric-val');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCountUp(e.target);
        countObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  countTargets.forEach(el => countObserver.observe(el));

  // ── 3D TILT ON HOVER (tech-card, service-card) ──
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tech-card, .service-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (-y * 6).toFixed(2);
        const rotateY = (x * 6).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ── HERO BACKGROUND PARALLAX ──
  if (!prefersReducedMotion) {
    const heroBgPhoto = document.querySelector('.hero-bg-photo');
    if (heroBgPhoto) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroBgPhoto.style.transform = `translateY(${y * 0.15}px)`;
        }
      }, { passive: true });
    }
  }

  // ── BUTTON RIPPLE (click feedback) ──
  document.querySelectorAll('.btn-solid, .btn-outline, .form-submit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  // ── ICON BOUNCE-IN ON CARD REVEAL ──
  if (!prefersReducedMotion) {
    const iconRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const icon = e.target.querySelector('.tech-icon, .service-icon');
          if (icon) {
            icon.style.animation = 'none';
            void icon.offsetWidth; // restart animation
            icon.style.animation = 'icon-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
          }
          iconRevealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.tech-card, .service-card').forEach(el => iconRevealObserver.observe(el));
  }

  // ── HERO CURSOR GLOW ──
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    const heroSection = document.getElementById('hero');
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'hero-cursor-glow';
    heroSection.appendChild(cursorGlow);
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      cursorGlow.style.left = (e.clientX - rect.left) + 'px';
      cursorGlow.style.top = (e.clientY - rect.top) + 'px';
      cursorGlow.style.opacity = '1';
    });
    heroSection.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });
  }

  // ── MODAL STAT COUNT-UP (animates once, first time modal opens) ──
  let modalStatsAnimated = false;
  function animateModalStats() {
    if (modalStatsAnimated) return;
    modalStatsAnimated = true;
    document.querySelectorAll('.modal-stat-card .val').forEach(el => animateCountUp(el));
  }

  // ── MODAL (with focus trap + return focus) ──
  let lastFocusedBeforeModal = null;
  function getFocusableInModal() {
    return Array.from(document.getElementById('modalBox')
      .querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'));
  }
  function trapModalFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableInModal();
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  function openModal() {
    lastFocusedBeforeModal = document.activeElement;
    document.getElementById('modalBackdrop').classList.add('open');
    document.getElementById('modalBox').classList.add('open');
    document.body.style.overflow = 'hidden';
    const focusable = getFocusableInModal();
    if (focusable.length) focusable[0].focus();
    document.addEventListener('keydown', trapModalFocus);
    animateModalStats();
  }
  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
    document.getElementById('modalBox').classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapModalFocus);
    if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
  }
  function handleBackdropClick(e) {
    if (e.target === document.getElementById('modalBackdrop')) closeModal();
  }
  window.openModal = openModal;
  window.closeModal = closeModal;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── CONTACT FORM ──
  // ── CONTACT FORM: validation + real submission ──
  const contactForm = document.getElementById('contactForm');
  const fields = {
    userName:   { group: 'group-userName',   validate: v => v.trim().length > 0 },
    userEmail:  { group: 'group-userEmail',  validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    subject:    { group: 'group-subject',    validate: v => v.trim().length > 0 },
    message:    { group: 'group-message',    validate: v => v.trim().length >= 10 }
  };

  function validateField(id) {
    const el = document.getElementById(id);
    const cfg = fields[id];
    const group = document.getElementById(cfg.group);
    const ok = cfg.validate(el.value);
    group.classList.toggle('has-error', !ok);
    group.classList.toggle('is-valid', ok);
    return ok;
  }

  Object.keys(fields).forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('blur', () => validateField(id));
    el.addEventListener('input', () => {
      const group = document.getElementById(fields[id].group);
      if (group.classList.contains('has-error')) validateField(id);
    });
  });

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const status = document.getElementById('formStatus');
    const label = btn.querySelector('.form-submit-label');

    // Honeypot spam check
    if (document.querySelector('[name="_honey"]').value) return;

    let allValid = true;
    Object.keys(fields).forEach(id => { if (!validateField(id)) allValid = false; });
    if (!allValid) {
      status.innerHTML = '<span style="color:#c0392b;">Please fix the highlighted fields.</span>';
      return;
    }

    btn.disabled = true; btn.classList.add('loading'); label.textContent = 'Sending…';
    status.innerHTML = '';

    const payload = {
      name: document.getElementById('userName').value.trim(),
      email: document.getElementById('userEmail').value.trim(),
      company: document.getElementById('userCompany').value.trim(),
      inquiry_type: document.getElementById('subject').value,
      message: document.getElementById('message').value.trim(),
      _subject: 'New inquiry — Aaru Green Hydrogen website'
    };

    fetch('https://formsubmit.co/ajax/aarugreenhydrogen@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
        return res.json();
      })
      .then(data => {
        console.log('FormSubmit response:', data);
        status.innerHTML = '<span style="color:#2c7a2c; background:#e6f4e6; padding:8px 20px; border-radius:100px; font-size:13px;">✓ Request received — if this is the first-ever submission, check aarugreenhydrogen@gmail.com (incl. spam) for a one-time activation email from FormSubmit.</span>';
        contactForm.reset();
        Object.keys(fields).forEach(id => {
          document.getElementById(fields[id].group).classList.remove('is-valid', 'has-error');
        });
        setTimeout(() => status.innerHTML = '', 10000);
      })
      .catch(err => {
        console.error('Form submission failed:', err);
        status.innerHTML = '<span style="color:#c0392b;">Something went wrong — please email us directly at aarugreenhydrogen@gmail.com.</span>';
      })
      .finally(() => {
        btn.disabled = false; btn.classList.remove('loading'); label.textContent = 'Send Inquiry →';
      });
  });
