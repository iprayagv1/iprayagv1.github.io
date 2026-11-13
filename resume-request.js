// "Request my resume" popup. Sends the visitor's name, organisation and email to your
// private Google Apps Script; you approve in /admin and they get a private download link.
(function () {
  const S = window.SITE || {};
  const api = ((S.contact || {}).resumeRequestApi || '').trim();
  if (!api) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let box, lastFocus;

  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    box = document.createElement('div');
    box.className = 'rq';
    box.innerHTML = `
      <div class="rq__panel" role="dialog" aria-modal="true" aria-labelledby="rq-title">
        <button type="button" class="rq__close" aria-label="Close">×</button>
        <div class="rq__body">
          <p class="rq__eyebrow">Resume</p>
          <h2 id="rq-title" class="rq__title">Request my resume</h2>
          <p class="rq__lead">To keep my contact details safe from spam, I share my resume on request. Tell me who you are and I’ll email you a private download link.</p>
          <form class="rq__form" novalidate>
            <label class="rq__field"><span>Your name</span><input name="name" autocomplete="name" required maxlength="80"></label>
            <label class="rq__field"><span>Organisation</span><input name="organisation" autocomplete="organization" required maxlength="120"></label>
            <label class="rq__field"><span>Work email</span><input name="email" type="email" autocomplete="email" required maxlength="120"></label>
            <label class="rq__field"><span>Message <em>(optional)</em></span><textarea name="message" rows="3" maxlength="600" placeholder="The role you’re hiring for, or anything else"></textarea></label>
            <label class="rq__hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
            <p class="rq__error" role="alert" hidden></p>
            <button class="pill pill--light rq__send" type="submit">Send request</button>
            <p class="rq__small">Your details are only used to reply to this request.</p>
          </form>
        </div>
      </div>`;
    document.body.appendChild(box);
    document.documentElement.classList.add('rq-open');
    requestAnimationFrame(() => box.classList.add('is-in'));
    box.querySelector('input[name=name]').focus();
    box.addEventListener('click', ev => { if (ev.target === box || ev.target.closest('.rq__close')) close(); });
    box.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') close();
      if (ev.key === 'Tab') { // keep focus inside the popup
        const f = [...box.querySelectorAll('button, input:not([tabindex="-1"]), textarea, a[href]')].filter(x => !x.disabled && x.offsetParent);
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    });
    box.querySelector('form').addEventListener('submit', send);
  }

  function close() {
    if (!box) return;
    box.classList.remove('is-in');
    document.documentElement.classList.remove('rq-open');
    const b = box; box = null; setTimeout(() => b.remove(), 250);
    if (lastFocus) lastFocus.focus();
  }

  async function send(e) {
    e.preventDefault();
    const f = e.target, err = f.querySelector('.rq__error'), btn = f.querySelector('.rq__send');
    const d = Object.fromEntries(new FormData(f).entries());
    const bad = !d.name.trim() ? 'name' : !d.organisation.trim() ? 'organisation' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()) ? 'email' : '';
    if (bad) { err.hidden = false; err.textContent = bad === 'email' ? 'Please enter a valid email address.' : `Please add your ${bad}.`; f.querySelector(`[name=${bad}]`).focus(); return; }
    btn.disabled = true; btn.textContent = 'Sending…'; err.hidden = true;
    try {
      // text/plain keeps this a "simple" request, which Google Apps Script accepts from any site
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'request' }, d)) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Something went wrong.');
      box.querySelector('.rq__body').innerHTML = `
        <span class="rq__done" aria-hidden="true">✓</span>
        <h2 id="rq-title" class="rq__title">Request sent</h2>
        <p class="rq__lead">Thanks, ${esc(d.name.trim().split(' ')[0])}. Once I’ve approved it, you’ll get an email at <b>${esc(d.email.trim())}</b> with a private link to download my resume.</p>
        <button type="button" class="pill pill--light rq__send" data-close>Done</button>`;
      box.querySelector('[data-close]').onclick = close;
      box.querySelector('[data-close]').focus();
      if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'resume/request', title: 'Resume requested', event: true });
    } catch (ex) {
      err.hidden = false; err.textContent = 'Couldn’t send your request right now. Please try again, or reach out on LinkedIn.';
      btn.disabled = false; btn.textContent = 'Send request';
    }
  }

  // Any element marked data-resume-request opens the popup
  document.addEventListener('click', e => { const t = e.target.closest('[data-resume-request]'); if (t) open(e); });
})();
