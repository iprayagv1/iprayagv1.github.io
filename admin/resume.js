/* ==========================================================
   Portfolio admin — resume requests (Google Apps Script backend)
   ========================================================== */
(function () {
  const A = window.Admin;
  const { App, Drafts, esc, ic, ago, toast, $, Store, ix } = A;
  const KEY = 'pg-rq-key';
  const PDF = 'assets/Prayag-Gangadharan-Resume.pdf';

  const RQ = {
    api: () => (((Drafts.read().site || App.data.site).contact || {}).resumeRequestApi || '').trim(),
    key: () => localStorage.getItem(KEY) || '',
    async call(body) {
      let res;
      try { res = await fetch(RQ.api(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ key: RQ.key() }, body)) }); }
      catch (e) { throw new Error('Can’t reach your Google script. Check the web app URL and that access is set to “Anyone”.'); }
      const j = await res.json().catch(() => { throw new Error('The script didn’t answer properly. Make sure you deployed it as a Web app.'); });
      if (!j.ok) throw new Error(j.error === 'Not allowed' ? 'The admin key in the script doesn’t match this browser’s key.' : j.error);
      return j;
    },
  };

  const View = {
    tab: 'pending', data: null,
    async render(main) {
      const ready = RQ.api() && RQ.key();
      main.innerHTML = App.topbar('Site', 'Resume requests', ready ? `<button type="button" class="btn" id="rq-refresh">${ix('undo')}Refresh</button>` : '') + `<div class="content" id="rq"></div>`;
      if (!ready) return View.setup();
      $('#rq-refresh').onclick = () => View.load();
      View.load();
    },

    // ---------- Setup ----------
    setup() {
      let key = RQ.key();
      if (!key) { const b = new Uint8Array(24); crypto.getRandomValues(b); key = Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); sessionStorage.setItem('pg-rq-newkey', sessionStorage.getItem('pg-rq-newkey') || key); key = sessionStorage.getItem('pg-rq-newkey'); }
      const pdfLive = (App.data.site.contact || {}).resume;
      $('#rq').innerHTML = `
        <div class="card setup">
          <span class="badge badge--draft">Not set up</span>
          <h2 class="serif" style="margin:0;font-size:28px">Share your resume on request</h2>
          <p class="muted">Visitors fill in their name, organisation and email. You approve here, and they get an email with a private download link (works for 7 days, 5 downloads). Your resume lives privately in your Google Drive — not on the public site. Free, using your Google account.</p>
          <ol class="setup__steps">
            <li><b>Copy the script</b> — your private admin key is already filled in.<br><button type="button" class="btn btn--sm btn--primary" id="rq-copy" style="margin-top:8px">${ix('copy')}Copy script</button></li>
            <li>Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com → New project</a>. Delete what’s there, paste, and press <b>Cmd+S</b>. Name it “Resume requests”.</li>
            <li>In the toolbar, choose the function <b>setup</b> and click <b>▶ Run</b>. Allow the permissions. Google warns the app isn’t verified because it’s your own script — click <b>Advanced → Go to Resume requests</b>.</li>
            <li>Click <b>Deploy → New deployment</b> → gear icon → <b>Web app</b>. Set <b>Execute as: Me</b> and <b>Who has access: Anyone</b>, then <b>Deploy</b> and copy the <b>Web app URL</b>.</li>
            <li>Upload your resume PDF to <a href="https://drive.google.com" target="_blank" rel="noopener">Google Drive</a> (keep it private), open it, and copy its link from the address bar.</li>
          </ol>
          <form id="rq-form" class="fgrid" novalidate>
            <div class="field"><label class="label" for="rq-url">Web app URL</label><input class="input" id="rq-url" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(RQ.api())}" spellcheck="false"></div>
            <div class="field"><label class="label" for="rq-file">Resume in Google Drive (link)</label><input class="input" id="rq-file" placeholder="https://drive.google.com/file/d/…/view" spellcheck="false"></div>
            <label class="check field"><input type="checkbox" id="rq-remove" ${pdfLive ? 'checked' : 'disabled'}> Remove the public resume PDF from the site ${pdfLive ? '' : '(already removed)'}</label>
            <p class="error" id="rq-err" hidden></p>
            <div class="row-end" style="width:100%"><button class="btn btn--primary" type="submit">Connect</button></div>
          </form>
        </div>`;
      $('#rq-copy').onclick = async () => {
        try {
          const code = (await fetch('resume-backend.gs?v=1', { cache: 'no-store' }).then(r => r.text())).replace("'PASTE-YOUR-ADMIN-KEY-HERE'", `'${key}'`);
          await navigator.clipboard.writeText(code); toast('Script copied — paste it into Google Apps Script');
        } catch (e) { toast('Couldn’t copy — try again'); }
      };
      $('#rq-form').onsubmit = async e => {
        e.preventDefault();
        const err = $('#rq-err'), btn = e.target.querySelector('button[type=submit]');
        const url = $('#rq-url').value.trim(), link = $('#rq-file').value.trim();
        const fileId = (link.match(/\/d\/([\w-]{20,})/) || link.match(/[?&]id=([\w-]{20,})/) || [])[1] || (/^[\w-]{20,}$/.test(link) ? link : '');
        const fail = m => { err.hidden = false; err.textContent = m; btn.disabled = false; btn.textContent = 'Connect'; };
        if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) return fail('Paste the Web app URL — it starts with https://script.google.com/macros/s/ and ends with /exec.');
        if (!fileId) return fail('Paste the Google Drive link of your resume.');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Connecting…'; err.hidden = true;
        localStorage.setItem(KEY, key);
        const site = Store.site(); site.contact = Object.assign({}, site.contact, { resumeRequestApi: url });
        if ($('#rq-remove').checked) site.contact.resume = '';
        Store.saveSite(site);
        try {
          const c = await RQ.call({ action: 'config', fileId });
          if (!c.config.fileName || /can’t open/.test(c.config.fileName)) throw new Error('The script can’t open that Drive file. Make sure it’s in the same Google account.');
        } catch (ex) { localStorage.removeItem(KEY); return fail(ex.message); }
        if ($('#rq-remove').checked) { const d = Drafts.read(); d.removed = [...new Set([...(d.removed || []), PDF])]; Drafts.write(d); }
        sessionStorage.removeItem('pg-rq-newkey');
        toast('Connected — publish to switch the Resume button to the request popup');
        App.route();
      };
    },

    // ---------- Requests ----------
    async load() {
      const el = $('#rq'); if (!el) return;
      el.innerHTML = `<div class="card"><p class="muted">Loading requests…</p></div>`;
      try { View.data = await RQ.call({ action: 'list' }); }
      catch (e) { el.innerHTML = `<div class="banner banner--bad">${ic('warn')}<span>${esc(e.message)}</span><span class="right"><a href="#" id="rq-reset">Set up again</a></span></div>`; $('#rq-reset').onclick = ev => { ev.preventDefault(); localStorage.removeItem(KEY); App.route(); }; return; }
      View.draw();
    },
    draw() {
      const { requests, config } = View.data;
      const n = s => requests.filter(r => r.status === s).length;
      const list = View.tab === 'all' ? requests : requests.filter(r => r.status === View.tab);
      const unpublished = !(App.data.site.contact || {}).resumeRequestApi;
      $('#rq').innerHTML = `
        ${unpublished ? `<div class="banner banner--wait">${ic('warn')}<span>Publish your changes to switch the site’s Resume button to the request popup.</span><span class="right"><a href="#/publish">Review &amp; publish</a></span></div>` : ''}
        <div class="toolbar"><div class="filters" role="group" aria-label="Filter">${[['pending', 'Pending', n('pending')], ['approved', 'Approved', n('approved')], ['declined', 'Declined', n('declined')], ['all', 'All', requests.length]].map(([k, t, c]) =>
          `<button type="button" class="filter${View.tab === k ? ' is-on' : ''}" data-tab="${k}" aria-pressed="${View.tab === k}">${t} · ${c}</button>`).join('')}</div></div>
        <div class="card rq-list">${list.length ? list.map(r => `
          <div class="rq-row" data-id="${esc(r.id)}">
            <div class="rq-row__who"><b>${esc(r.name)}</b><span>${esc(r.organisation)}</span><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></div>
            <div class="rq-row__msg">${r.message ? `“${esc(r.message)}”` : '<span class="muted">No message</span>'}<small>${ago(r.created)}${r.status === 'approved' ? ` · link ${new Date(r.expires) < new Date() ? 'expired' : 'valid until ' + new Date(r.expires).toLocaleDateString()} · downloaded ${r.downloads}×` : r.status === 'declined' ? ' · declined' : ''}</small></div>
            <div class="rq-row__acts">
              ${r.status !== 'approved' ? `<button type="button" class="btn btn--sm btn--primary" data-act="approve">${ic('check')}Approve &amp; email link</button>` : `<button type="button" class="btn btn--sm" data-act="approve">${ix('undo')}Send a new link</button>`}
              ${r.status === 'pending' ? `<button type="button" class="btn btn--sm" data-act="decline">Decline</button>` : ''}
              <button type="button" class="icon-btn icon-btn--sm icon-btn--danger" data-act="delete" aria-label="Delete request from ${esc(r.name)}">${ix('trash')}</button>
            </div>
          </div>`).join('') : `<p class="empty">${View.tab === 'pending' ? 'No requests waiting. You’ll get an email when someone asks.' : 'Nothing here yet.'}</p>`}</div>
        <div class="card rq-settings"><span class="label">Settings</span>
          <p>Resume file: <b style="font-weight:400">${esc(config.fileName || 'not set')}</b> · <a href="#" id="rq-change">Change file</a></p>
          <p>All requests: ${config.sheetUrl ? `<a href="${esc(config.sheetUrl)}" target="_blank" rel="noopener">Google Sheet</a>` : '—'} · Emails left today: ${config.quota}</p>
          <p class="hint">Links work for 7 days and 5 downloads — change LINK_DAYS and MAX_DOWNLOADS at the top of your Google script. <a href="#" id="rq-off" style="color:var(--muted)">Disconnect this browser</a></p>
        </div>`;
      $('#rq').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { View.tab = b.dataset.tab; View.draw(); });
      $('#rq-change').onclick = async e => {
        e.preventDefault();
        const link = prompt('Paste the Google Drive link of your new resume:'); if (!link) return;
        const id = (link.match(/\/d\/([\w-]{20,})/) || link.match(/[?&]id=([\w-]{20,})/) || [])[1];
        if (!id) return toast('That doesn’t look like a Google Drive file link');
        try { await RQ.call({ action: 'config', fileId: id }); toast('Resume file updated'); View.load(); } catch (ex) { toast(ex.message); }
      };
      $('#rq-off').onclick = e => { e.preventDefault(); if (confirm('Disconnect resume requests on this browser? Requests stay safe in your Google Sheet.')) { localStorage.removeItem(KEY); App.route(); } };
      $('#rq').querySelectorAll('[data-act]').forEach(b => b.onclick = () => View.act(b));
      App.refreshChrome();
    },
    async act(b) {
      const id = b.closest('.rq-row').dataset.id, r = View.data.requests.find(x => x.id === id), act = b.dataset.act;
      if (act === 'decline') {
        const wrap = document.createElement('div'); wrap.className = 'modal';
        wrap.innerHTML = `<div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="dc-t"><h2 id="dc-t">Decline ${esc(r.name)}’s request?</h2>
          <label class="check"><input type="checkbox" id="dc-mail"> Send them a short, polite email</label>
          <div class="row-end"><button type="button" class="btn" data-x>Cancel</button><button type="button" class="btn btn--danger" id="dc-go">Decline</button></div></div>`;
        document.body.appendChild(wrap);
        wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-x]')) wrap.remove(); });
        $('#dc-go', wrap).onclick = async () => { const notify = $('#dc-mail', wrap).checked; wrap.remove(); await View.run(b, { action: 'decline', id, notify }, 'Declined'); };
        return;
      }
      if (act === 'delete' && !confirm(`Delete ${r.name}’s request? Any download link it has stops working.`)) return;
      if (act === 'approve' && r.status === 'approved' && !confirm(`Send ${r.name} a new link? The old one stops working.`)) return;
      await View.run(b, { action: act, id }, act === 'approve' ? `Approved — ${r.name} has been emailed a download link` : 'Deleted');
    },
    async run(b, body, msg) {
      const html = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spinner"></span>';
      try { await RQ.call(body); toast(msg); View.load(); }
      catch (e) { toast(e.message); b.disabled = false; b.innerHTML = html; }
    },
  };
  App.views.resume = View;

  // Pending count in the sidebar
  A.resumePending = async () => {
    if (!RQ.api() || !RQ.key()) return null;
    try { const j = await RQ.call({ action: 'list' }); return j.requests.filter(r => r.status === 'pending').length; } catch (e) { return null; }
  };
})();
