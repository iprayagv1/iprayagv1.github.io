// Each feature is set up independently so one failing never stops the others.
function safe(fn) { try { fn(); } catch (e) { console.error(e); } }
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Mobile menu ----------
safe(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  document.querySelectorAll('.nav__menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 640) setMenu(false); });
});

// ---------- Reveal on scroll ----------
safe(() => {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));
});

// ---------- Active nav link ----------
safe(() => {
  const links = {
    top: document.querySelector('.nav__links a[href="#top"]'),
    works: document.querySelector('.nav__links a[href="#works"]'),
    contact: document.querySelector('.nav__links a[href="#contact"]'),
  };
  const works = document.getElementById('works');
  const contact = document.getElementById('contact');
  if (!works || !contact || !links.top) return; // not the home page
  function update() {
    const y = window.scrollY + window.innerHeight * 0.4;
    const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
    const current = atBottom || y >= contact.offsetTop ? 'contact' : y >= works.offsetTop ? 'works' : 'top';
    Object.keys(links).forEach(k => links[k] && links[k].classList.toggle('is-active', k === current));
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
});

// ---------- Experience: accordion — one company open at a time ----------
safe(() => {
  const items = [...document.querySelectorAll('.timeline__item')];
  const navH = () => (document.querySelector('.nav__inner') || {}).offsetHeight || 76;

  function animate(panel, open) {
    if (reduceMotion) { panel.style.height = open ? 'auto' : '0px'; return; }
    const from = panel.getBoundingClientRect().height;
    const to = open ? panel.scrollHeight : 0;
    panel.style.height = from + 'px';
    panel.offsetHeight; // force layout so the transition starts from the current height
    panel.style.height = to + 'px';
    const done = e => {
      if (e.target !== panel || e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', done);
      if (panel.closest('.timeline__item').classList.contains('is-open')) panel.style.height = 'auto';
    };
    panel.addEventListener('transitionend', done);
  }

  function setOpen(item, open) {
    if (item.classList.contains('is-open') === open) return;
    const btn = item.querySelector('.timeline__toggle');
    const panel = item.querySelector('.timeline__details');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    animate(panel, open);
  }

  items.forEach(item => {
    item.querySelector('.timeline__details').setAttribute('aria-hidden', 'true');
    item.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      if (window.getSelection && String(window.getSelection()).length) return; // allow selecting text
      const opening = !item.classList.contains('is-open');
      items.forEach(other => { if (other !== item) setOpen(other, false); });
      setOpen(item, opening);
      // If closing a section above pushed this one off the top, bring it back into view
      if (opening) setTimeout(() => {
        const top = item.getBoundingClientRect().top;
        if (top < navH() + 10) window.scrollBy({ top: top - navH() - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 520);
    });
  });
});

// ---------- "10" circle: drawn like a pen stroke when it scrolls into view ----------
safe(() => {
  const circle = document.querySelector('.ten__circle');
  if (!circle) return;
  if (reduceMotion || !('IntersectionObserver' in window)) return; // stays fully drawn
  const FULL = 370, DURATION = 1100;
  let raf = null;
  const set = deg => circle.style.setProperty('--draw', deg + 'deg');
  const ease = t => 1 - Math.pow(1 - t, 3);
  set(0);

  function draw() {
    cancelAnimationFrame(raf);
    const start = performance.now() + 250; // small pause before the pen starts
    const step = now => {
      const t = Math.min(Math.max((now - start) / DURATION, 0), 1);
      set(FULL * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) draw();
      else { cancelAnimationFrame(raf); set(0); } // redraw next time it comes into view
    });
  }, { threshold: 0.6 }).observe(circle.closest('.ten'));
});

// ---------- Back to top button (added to every page) ----------
safe(() => {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML =
    '<svg class="to-top__ring" viewBox="0 0 58 58" aria-hidden="true"><circle cx="29" cy="29" r="27.5"></circle></svg>' +
    '<svg class="to-top__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';
  document.body.appendChild(btn);

  const ring = btn.querySelector('circle');
  const LEN = 2 * Math.PI * 27.5;
  ring.style.strokeDasharray = LEN;

  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    btn.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    ring.style.strokeDashoffset = LEN * (1 - (max > 0 ? Math.min(y / max, 1) : 0));
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const target = document.querySelector('.nav__logo');
    if (target) target.focus({ preventScroll: true }); // keep keyboard users at the top too
  });
});
