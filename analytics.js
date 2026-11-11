// Privacy-friendly analytics with GoatCounter (no cookies, no personal data).
// Counts page views, and on case studies: which chapters people reach and how long they read.
// Your own visits aren't counted on a browser where you've signed in to /admin
// (or turned counting off in Admin → Analytics).
(function () {
  var S = window.SITE || {};
  var code = (S.analytics || {}).goatcounter;
  if (!code) return;
  if (location.protocol === 'file:' || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
  try { if (localStorage.getItem('pg-admin-token') || localStorage.getItem('pg-no-track')) return; } catch (e) {}

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count');
  document.head.appendChild(s);

  // Send an event once GoatCounter has loaded
  var queue = [];
  function send(path, title) {
    var gc = window.goatcounter;
    if (gc && gc.count) gc.count({ path: path, title: title, event: true });
    else queue.push([path, title]);
  }
  s.onload = function () { queue.splice(0).forEach(function (q) { send(q[0], q[1]); }); };

  // ---------- Case study reading ----------
  var C = window.CASE;
  if (!C || !C.slug || C.confidential) return;
  var name = C.short || C.title || C.slug;
  var seen = {};
  function reached(id, label) {
    if (seen[id]) return; seen[id] = 1;
    send('read/' + C.slug + '/' + id, name + ' — ' + label);
  }

  // Wait until case.js has built the page
  function watch() {
    var secs = document.querySelectorAll('#case section[id]');
    if (!secs.length) return setTimeout(watch, 300);
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, id = el.id;
        var lab = el.querySelector('.chap-label');
        reached(id, lab ? lab.textContent.replace(/^\s*\d+\s*—\s*/, '').trim() : id);
        io.unobserve(el);
      });
    }, { threshold: 0.25 });
    secs.forEach(function (el) { io.observe(el); });
    var end = document.querySelector('.footer');
    if (end) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { reached('end', 'Read to the end'); o.disconnect(); } }).observe(end);
  }
  watch();

  // Reading time: only while the tab is visible, sent once when they leave
  var active = 0, since = document.visibilityState === 'visible' ? Date.now() : 0, sent = false;
  function flush() {
    if (since) { active += Date.now() - since; since = 0; }
    if (sent || active < 5000) return;
    sent = true;
    var m = active / 60000;
    var b = m < 0.5 ? 'under-30s' : m < 1 ? '30s-1m' : m < 3 ? '1-3m' : m < 5 ? '3-5m' : m < 10 ? '5-10m' : 'over-10m';
    send('time/' + C.slug + '/' + b, name + ' — read for ' + b.replace('-', ' to ').replace('under to', 'under').replace('over to', 'over'));
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush(); else if (!sent) since = Date.now();
  });
  window.addEventListener('pagehide', flush);
})();
