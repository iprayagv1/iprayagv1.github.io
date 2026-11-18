/* PG Loop page loader. Load it in <head> (not deferred) together with loader.css.
   Shows once per browser session. The G forms; if the page is still loading,
   a yellow light circles the G until it has; then the p tail grows and the loader fades.
   Never waits on loading for more than 8 seconds. */
(function () {
  var html = document.documentElement;
  try { if (sessionStorage.getItem('pg-loader')) return; sessionStorage.setItem('pg-loader', '1'); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FORM = 1155, TAIL = 490, HOLD = 300, FADE = 500, MAX_WAIT = 8000;
  var el, loaded = false, formed = false, finished = false;
  html.classList.add('pg-loading');

  var SVG = '<svg viewBox="15 22.5 170 170" focusable="false">' +
    '<path class="pl-arc" d="M138.3 57.9 A50 50 0 1 0 150 90"/>' +
    '<path class="pl-tip" d="M138.3 57.9 A50 50 0 1 0 150 90"/>' +
    '<path class="pl-bar" d="M150 90 H104"/>' +
    '<path class="pl-trail" d="M138.3 57.9 A50 50 0 1 0 150 90 H104"/>' +
    '<path class="pl-up" d="M50 90 V45"/>' +
    '<path class="pl-down" d="M50 90 V175"/></svg>';

  function finish() {
    if (finished || !el || !loaded || !formed) return;
    finished = true;
    el.classList.remove('is-waiting');
    el.classList.add('is-finishing');
    setTimeout(function () {
      el.classList.add('is-done');
      html.classList.remove('pg-loading');
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, FADE + 100);
    }, reduce ? 250 : TAIL + HOLD);
  }

  document.addEventListener('DOMContentLoaded', function () {
    el = document.createElement('div');
    el.className = 'pg-loader' + (reduce ? ' is-still' : '');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading');
    el.innerHTML = SVG;
    document.body.appendChild(el);
    if (reduce) { formed = true; finish(); return; }
    requestAnimationFrame(function () { el.classList.add('is-forming'); });
    setTimeout(function () {
      formed = true;
      if (loaded) finish(); else el.classList.add('is-waiting');
    }, FORM);
  });
  window.addEventListener('load', function () { loaded = true; finish(); });
  setTimeout(function () { loaded = true; finish(); }, MAX_WAIT);
})();
