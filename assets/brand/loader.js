/* PG Loop splash screen. Load in <head> (not deferred) together with loader.css.
   Runs on every page load and refresh:
   1 · The G forms: the bowl draws (a yellow light leading the pen), then the yellow bar.
   2 · Still loading? The G winds back into a yellow dot at its centre; the dot fades away as the
       G forms again — over and over until the page has loaded (8 s cap).
   3 · Loaded: the G stays complete and the p tail grows, then the splash fades. */
(function () {
  var DRAW = 1000, BAR = 220, BACK = 650, BARBACK = 200, REST = 350, TAIL = 490, HOLD = 300, FADE = 500, MAX_WAIT = 8000;
  var EASE = 'cubic-bezier(.45,0,.55,1)';
  var SVG = '<svg viewBox="15 22.5 170 170" focusable="false">' +
    '<path class="pl-arc" d="M138.3 57.9 A50 50 0 1 0 150 90"/>' +
    '<path class="pl-tip" d="M138.3 57.9 A50 50 0 1 0 150 90"/>' +
    '<path class="pl-bar" d="M150 90 H104"/>' +
    '<circle class="pl-dot" cx="104" cy="90" r="7"/>' +
    '<path class="pl-up" d="M50 90 V45"/>' +
    '<path class="pl-down" d="M50 90 V175"/></svg>';

  /* Animates one Loop mark inside `root`. opts.isLoaded() is asked each time the bowl completes;
     opts.onDone() runs after the p tail has grown. Returns a stop() function. */
  function animate(root, opts) {
    var q = function (c) { return root.querySelector('.' + c); };
    var arc = q('pl-arc'), tip = q('pl-tip'), bar = q('pl-bar'), dot = q('pl-dot'), up = q('pl-up'), down = q('pl-down');
    var timers = [], anims = [], stopped = false;
    var later = function (ms, f) { timers.push(setTimeout(function () { if (!stopped) f(); }, ms)); };
    var run = function (el, kf, o) { o.fill = 'forwards'; var a = el.animate(kf, o); anims.push(a); return a; };
    var dash = function (el, from, to, ms, ease, delay) { return run(el, [{ strokeDashoffset: from }, { strokeDashoffset: to }], { duration: ms, easing: ease, delay: delay || 0 }); };
    function reset() {
      anims.forEach(function (a) { a.cancel(); }); anims = [];
    }
    var dotShown = false;
    function form() {
      if (dotShown) { run(dot, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.3)' }], { duration: 320, easing: 'cubic-bezier(.4,0,1,1)' }); dotShown = false; }
      dash(arc, 281, 0, DRAW, EASE);
      run(tip, [{ strokeDashoffset: 40, opacity: 1 }, { strokeDashoffset: -241, opacity: 1, offset: .92 }, { strokeDashoffset: -241, opacity: 0 }], { duration: DRAW, easing: EASE });
      dash(bar, 47, 0, BAR, 'linear', DRAW);
      later(DRAW + BAR, function () { if (opts.isLoaded()) finish(); else toDot(); });
    }
    function toDot() {
      dash(arc, 0, -281, BACK, 'cubic-bezier(.55,0,.75,.5)');
      dash(bar, 0, -47, BARBACK, 'cubic-bezier(.2,.6,.3,1)', BACK);
      run(dot, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.25)', offset: .6 }, { opacity: 1, transform: 'scale(1)' }], { duration: REST + 150, delay: BACK + BARBACK - 150 });
      dotShown = true;
      later(BACK + BARBACK + REST, form);
    }
    function finish() {
      dash(bar, 47, 0, BAR, 'cubic-bezier(.2,.6,.3,1)');
      dash(up, 46, 0, TAIL, 'cubic-bezier(.333,.5,.6,1)', BAR);
      dash(down, 86, 0, TAIL, 'cubic-bezier(.333,.5,.6,1)', BAR);
      later(BAR + TAIL + HOLD, function () { opts.onDone && opts.onDone(); });
    }
    if (!arc.animate) { [arc, bar, up, down].forEach(function (p) { p.style.strokeDashoffset = 0; }); later(400, function () { opts.onDone && opts.onDone(); }); }
    else form();
    return function stop() { stopped = true; timers.forEach(clearTimeout); reset(); };
  }
  window.PGLoop = { svg: SVG, animate: animate };

  /* The page splash */
  var html = document.documentElement;
  if (html.hasAttribute('data-no-splash')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el, loaded = false;
  html.classList.add('pg-loading');
  function close() {
    if (!el || el.classList.contains('is-done')) return;
    el.classList.add('is-done');
    html.classList.remove('pg-loading');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, FADE + 100);
  }
  document.addEventListener('DOMContentLoaded', function () {
    el = document.createElement('div');
    el.className = 'pg-loader' + (reduce ? ' is-still' : '');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading');
    el.innerHTML = SVG;
    document.body.appendChild(el);
    if (reduce) { var check = function () { if (loaded) setTimeout(close, 250); else setTimeout(check, 100); }; check(); return; }
    animate(el, { isLoaded: function () { return loaded; }, onDone: close });
  });
  window.addEventListener('load', function () { loaded = true; });
  setTimeout(function () { loaded = true; }, MAX_WAIT);
})();
