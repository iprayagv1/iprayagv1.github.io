/* ==========================================================
   Portfolio admin — home page sections, media, history, analytics
   ========================================================== */
(function () {
  const A = window.Admin;
  const { App, GH, Content, Drafts, CFG, esc, ic, ago, toast, $, PREVIEW, Files, Store, Form, getAt, setAt, ix, debounce, prepareImage, slugify } = A;
  const f = (type, k, label, x = {}) => Object.assign({ type, k, label }, x);
  const siteImg = (k, label, x = {}) => f('image', k, label, Object.assign({ base: 'site', folder: 'assets/img/' }, x));

  // ======================================================
  // A page that edits part of content/site.js
  // ======================================================
  function sectionPage(main, o) {
    const site = Store.site();
    const draw = () => {
      const y = window.scrollY;
      $('#sform').innerHTML = Form.render(typeof o.schema === 'function' ? o.schema(site) : o.schema, site, '', { slug: '' });
      window.scrollTo(0, y);
    };
    const changed = () => !!Drafts.read().site;
    main.innerHTML = App.topbar(o.crumb || 'Home page', o.title,
      `<span class="saved" id="saved">${changed() ? 'Saved in this browser' : 'Edits save automatically'}</span>
       <a class="btn" href="../index.html#preview" target="_blank" rel="noopener">${ic('eye')}Preview home page</a>
       <a class="btn btn--primary" href="#/publish">${ix('upload')}Review &amp; publish</a>`) + `
      <div class="content content--form">
        ${o.intro ? `<p class="muted" style="margin:0;max-width:720px;line-height:1.6">${o.intro}</p>` : ''}
        <form class="fgrid card" id="sform" novalidate autocomplete="off" style="padding:28px"></form>
      </div>`;
    draw();
    const form = $('#sform');
    const save = debounce(() => {
      Store.saveSite(site);
      const s = $('#saved'); if (s) { s.textContent = 'Saved in this browser'; s.classList.add('is-flash'); setTimeout(() => s.classList.remove('is-flash'), 600); }
    }, 300);
    const onInput = e => {
      const el = e.target; if (!el.dataset.path || !el.dataset.kind) return;
      setAt(site, el.dataset.path, Form.read(el, site));
      const redraw = o.onChange && o.onChange(site, el.dataset.path);
      if (el.dataset.rerender || redraw) draw();
      save();
    };
    form.addEventListener('input', onInput);
    form.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onInput(e); });
    form.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const path = b.dataset.path; let arr = getAt(site, path);
      if (!Array.isArray(arr)) { setAt(site, path, []); arr = getAt(site, path); }
      const i = +b.dataset.i;
      if (b.dataset.act === 'add') arr.push(JSON.parse(b.dataset.make));
      if (b.dataset.act === 'remove') { if (!confirm('Remove this item?')) return; arr.splice(i, 1); }
      if (b.dataset.act === 'move') { const j = i + +b.dataset.dir; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); }
      draw(); save();
      if (b.dataset.act === 'add') { const items = form.querySelectorAll('.rep__item'); const last = items[items.length - 1]; const inp = last && last.querySelector('input,textarea'); if (inp) inp.focus(); }
    });
    form.addEventListener('change', async e => {
      const inp = e.target; if (!inp.dataset.upload || !inp.files[0]) return;
      const file = inp.files[0], lab = inp.closest('label'); lab.classList.add('is-busy');
      try {
        const rec = await prepareImage(file);
        const name = (slugify(file.name.replace(/\.[^.]+$/, '')) || 'file') + '.' + rec.ext;
        const repo = (inp.dataset.folder || 'assets/img/') + name;
        await Store.addFile(repo, rec);
        setAt(site, inp.dataset.upload, (inp.dataset.prefix || '') + repo);
        draw(); save(); toast(`Added ${name} (${Math.max(1, Math.round(rec.size / 1024))} KB)`);
      } catch (ex) { toast('Couldn’t read that file'); console.error(ex); }
      finally { lab.classList.remove('is-busy'); }
    });
  }

  // ---------- Hero & about ----------
  App.views.hero = { render: main => sectionPage(main, {
    title: 'Hero &amp; about',
    intro: 'The top of your home page. In the bio, wrap words in *single stars* to show them in italics.',
    schema: [
      f('text', 'hero.firstName', 'First name', { half: true }), f('text', 'hero.lastName', 'Last name', { half: true }),
      f('text', 'hero.role', 'Role under your photo', { placeholder: 'UX Designer' }),
      siteImg('hero.photo', 'Photo (black & white)'), siteImg('hero.photoHover', 'Photo on hover (colour)'),
      f('area', 'hero.bio', 'Bio', { hint: 'Wrap words in *single stars* for italics, e.g. *art*' }),
      f('lines', 'hero.skills', 'Skills', { hint: 'One per line' }),
    ],
  }) };

  // ---------- Experience ----------
  App.views.experience = { render: main => sectionPage(main, {
    title: 'Experience',
    intro: 'Your jobs, newest first. Mark one as current to show the “Current” badge.',
    schema: [
      f('text', 'experience.years', 'Years of experience (the circled number)', { half: true, placeholder: '10' }),
      f('list', 'experience.items', 'Jobs', { item: 'job', make: () => ({ company: '', role: '', location: '', dates: '', points: [] }), schema: [
        f('text', 'company', 'Company', { half: true }), f('text', 'role', 'Role', { half: true }),
        f('text', 'location', 'Location', { half: true }), f('text', 'dates', 'Dates', { half: true, placeholder: 'Jan 2025 - Present' }),
        f('bool', 'current', 'This is my current job'),
        f('lines', 'points', 'What you did', { hint: 'One point per line' }),
      ] }),
    ],
    onChange(site, path) {
      // Only one current job
      const m = path.match(/^experience\.items\.(\d+)\.current$/);
      if (m && getAt(site, path)) site.experience.items.forEach((j, i) => { if (i !== +m[1]) delete j.current; });
      return !!m;
    },
  }) };

  // ---------- Articles & ideas ----------
  App.views.ideas = { render: main => sectionPage(main, {
    title: 'Articles &amp; ideas',
    intro: 'The “Ideas I Couldn’t Ignore” section — links to your articles elsewhere, or a case study from this site.',
    schema: site => [
      f('text', 'ideas.title', 'Section title', { half: true }),
      f('text', 'ideas.viewAllUrl', '“View All” link', { half: true, placeholder: 'https://medium.com/@you', hint: 'Leave empty to hide the button.' }),
      f('list', 'ideas.items', 'Items', { item: 'item', make: () => ({ type: 'link', title: '', desc: '', tag: '', date: '', thumb: '', url: '' }), schema: [
        f('select', 'type', 'Type', { rerender: true, options: [['link', 'Link to an article elsewhere'], ['case', 'A case study on this site']] }),
        f('select', 'slug', 'Case study', { showIf: x => x.type === 'case', options: [['', 'Choose…']].concat((site.caseStudies || []).map(c => [c.slug, c.title || c.slug])) }),
        f('text', 'title', 'Title', { showIf: x => x.type !== 'case' }),
        f('text', 'title', 'Title (optional — uses the case study title)', { showIf: x => x.type === 'case' }),
        f('area', 'desc', 'Description', { showIf: x => x.type !== 'case' }),
        f('text', 'tag', 'Tag', { half: true, placeholder: 'Tutorial', showIf: x => x.type !== 'case' }),
        f('text', 'date', 'Date', { half: true, placeholder: 'Oct, 2025', showIf: x => x.type !== 'case' }),
        f('text', 'url', 'Link', { placeholder: 'https://', showIf: x => x.type !== 'case' }),
        siteImg('thumb', 'Thumbnail', { showIf: x => x.type !== 'case' }),
      ] }),
    ],
  }) };

  // ---------- Contact & links ----------
  App.views.contact = { render: main => sectionPage(main, {
    title: 'Contact &amp; links',
    intro: 'Your contact links, resume, footer and how your site appears when shared. Empty links are hidden.',
    schema: [
      f('text', 'contact.email', 'Email', { half: true }), f('text', 'contact.linkedin', 'LinkedIn', { half: true }),
      f('text', 'contact.behance', 'Behance', { half: true }), f('text', 'contact.instagram', 'Instagram', { half: true }),
      f('image', 'contact.resume', 'Resume (PDF)', { base: 'site', folder: 'assets/', accept: 'application/pdf' }),
      f('text', 'contact.reviewerForm', 'Reviewer notes form link'),
      f('text', 'works.title', '“Solved Problems” section title', { half: true }),
      f('text', 'footer.version', 'Footer version text', { half: true }),
      f('text', 'footer.name', 'Footer name', { half: true }),
      f('text', 'meta.title', 'Browser tab title'), f('area', 'meta.description', 'Search engine description'),
      f('text', 'meta.shareText', 'Text when shared on LinkedIn, WhatsApp…'), siteImg('meta.shareImage', 'Image when shared'),
    ],
  }) };

  // ======================================================
  // Media library
  // ======================================================
  const IMG = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
  const Media = {
    folder: 'assets/img/',
    usage(path) {
      const d = Drafts.read();
      const site = JSON.stringify(d.site || App.data.site);
      const name = path.split('/').pop();
      let n = site.split(path).length - 1;
      const m = path.match(/^assets\/case\/([^/]+)\/(logos\/)?(.+)$/);
      if (m) { const c = JSON.stringify((d.cases && m[1] in d.cases) ? d.cases[m[1]] : App.data.cases[m[1]] || {}); n += c.split('"' + m[3] + '"').length - 1; }
      else if (/^assets\/icons\//.test(path)) n += 1; // used by the site design itself
      else Object.values(App.data.cases).forEach(c => { n += JSON.stringify(c || {}).split(path).length - 1; });
      return n || (name === '_FILES-NEEDED.txt' ? 1 : 0);
    },
    async list() {
      const d = Drafts.read();
      const pending = Object.keys(d.files || {});
      const removed = d.removed || [];
      let files = [];
      if (PREVIEW && !App.signedIn()) {
        // No GitHub yet: show what your content points to
        const set = new Set();
        const walk = (o, slug) => JSON.stringify(o || {}).replace(/"([^"]+\.(?:png|jpe?g|webp|gif|svg|pdf))"/gi, (_, p) => { set.add(p.startsWith('assets/') ? p : p.startsWith('../') ? p.slice(3) : `assets/case/${slug}/${p}`); });
        walk(App.data.site, '');
        Object.entries(App.data.cases).forEach(([s, c]) => walk(c, s));
        files = [...set].map(p => ({ path: p }));
      } else {
        const sf = CFG.siteFolder ? CFG.siteFolder.replace(/\/+$/, '') + '/' : '';
        const tree = await GH.req(GH.repo(`/git/trees/${CFG.branch}?recursive=1`));
        files = tree.tree.filter(t => t.type === 'blob' && t.path.startsWith(sf + 'assets/') && (IMG.test(t.path) || /\.pdf$/i.test(t.path))).map(t => ({ path: t.path.slice(sf.length), size: t.size }));
      }
      pending.forEach(p => { if (!files.some(x => x.path === p)) files.push({ path: p, size: d.files[p].size }); });
      return files.map(x => Object.assign(x, { pending: pending.includes(x.path), removed: removed.includes(x.path) })).sort((a, b) => a.path.localeCompare(b.path));
    },
    async render(main) {
      const slugs = (Store.site().caseStudies || []).map(c => c.slug);
      const folders = ['assets/img/', 'assets/icons/', 'assets/'].concat(slugs.flatMap(s => [`assets/case/${s}/`, `assets/case/${s}/logos/`]));
      main.innerHTML = App.topbar('Content', 'Media library', `<a class="btn btn--primary" href="#/publish">${ix('upload')}Review &amp; publish</a>`) + `
      <div class="content">
        <div class="card upload-bar">
          <span class="label">Upload</span>
          <select class="input input--sm" id="m-folder" aria-label="Folder">${folders.map(x => `<option${x === Media.folder ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>
          <label class="btn btn--primary btn--sm">${ix('upload')}Choose images<input type="file" id="m-file" accept="image/*,application/pdf" multiple hidden></label>
          <span class="hint">Large images are resized automatically. Case study screenshots go in <code>assets/case/&lt;case study&gt;/</code>.</span>
        </div>
        ${PREVIEW && !App.signedIn() ? `<div class="banner banner--info">${ic('info')}<span>Preview mode — showing images your content uses. Once you sign in on the live site this shows every file in your repo.</span></div>` : ''}
        <div class="toolbar"><div class="search">${ix('search')}<input class="input" type="search" id="m-q" placeholder="Search files" aria-label="Search files"></div></div>
        <div class="media-grid" id="m-grid"><p class="muted">Loading…</p></div>
      </div>`;
      $('#m-folder').onchange = e => { Media.folder = e.target.value; };
      $('#m-file').onchange = async e => {
        const lab = e.target.closest('label'); lab.classList.add('is-busy');
        for (const file of e.target.files) {
          try {
            const rec = await prepareImage(file);
            const name = (slugify(file.name.replace(/\.[^.]+$/, '')) || 'image') + '.' + rec.ext;
            await Store.addFile(Media.folder + name, rec);
            toast(`Added ${name}`);
          } catch (ex) { toast('Couldn’t read ' + file.name); }
        }
        lab.classList.remove('is-busy'); Media.grid();
      };
      $('#m-q').oninput = () => Media.draw();
      await Files.loadUrls();
      Media.grid();
    },
    async grid() {
      try { Media.files = await Media.list(); } catch (e) { $('#m-grid').innerHTML = `<p class="error">Couldn’t load files: ${esc(e.message)}</p>`; return; }
      Media.draw();
    },
    draw() {
      const q = ($('#m-q').value || '').toLowerCase();
      const files = (Media.files || []).filter(x => !q || x.path.toLowerCase().includes(q));
      const groups = {};
      files.forEach(x => { const g = x.path.split('/').slice(0, -1).join('/') + '/'; (groups[g] = groups[g] || []).push(x); });
      $('#m-grid').innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([g, list]) => `
        <section class="mgroup"><h3 class="label">${esc(g)} <span class="muted">· ${list.length}</span></h3><div class="mtiles">
        ${list.map(x => {
          const used = Media.usage(x.path); const name = x.path.split('/').pop();
          return `<div class="mtile${x.removed ? ' is-removed' : ''}" data-path="${esc(x.path)}">
            <div class="mtile__pic">${/\.pdf$/i.test(x.path) ? '<span class="mtile__pdf">PDF</span>' : `<img src="${esc(Files.src(x.path))}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mtile__pdf',textContent:'Not found'}))">`}</div>
            <div class="mtile__body"><b title="${esc(x.path)}">${esc(name)}</b>
              <small>${x.size ? Math.max(1, Math.round(x.size / 1024)) + ' KB · ' : ''}${x.removed ? '<span style="color:var(--red-text)">will be deleted</span>' : x.pending ? '<span style="color:var(--accent)">not published yet</span>' : used ? `used ${used}×` : 'not used'}</small></div>
            <div class="mtile__acts">
              <button type="button" class="icon-btn icon-btn--sm" data-copy aria-label="Copy path of ${esc(name)}">${ix('copy')}</button>
              <label class="icon-btn icon-btn--sm" aria-label="Replace ${esc(name)}" title="Replace">${ix('upload')}<input type="file" hidden data-replace accept="${/\.pdf$/i.test(x.path) ? 'application/pdf' : 'image/*'}"></label>
              ${x.removed ? `<button type="button" class="icon-btn icon-btn--sm" data-restore aria-label="Keep ${esc(name)}" title="Keep">${ix('undo')}</button>`
                : `<button type="button" class="icon-btn icon-btn--sm icon-btn--danger" data-del aria-label="Delete ${esc(name)}" title="${used ? 'In use — remove it from your content first' : 'Delete'}"${used && !x.pending ? ' disabled' : ''}>${ix('trash')}</button>`}
            </div></div>`;
        }).join('')}</div></section>`).join('') : '<p class="muted">No files.</p>';
      const grid = $('#m-grid');
      grid.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { const p = b.closest('.mtile').dataset.path; (navigator.clipboard ? navigator.clipboard.writeText(p) : Promise.reject()).then(() => toast('Copied ' + p), () => prompt('Copy this path:', p)); });
      grid.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        const p = b.closest('.mtile').dataset.path; const d = Drafts.read();
        if (d.files && d.files[p]) { delete d.files[p]; await Files.del(p).catch(() => {}); delete Files.urls[p]; if (!Media.files.find(x => x.path === p && x.size && !x.pending)) { Drafts.write(d); return Media.grid(); } }
        if (!confirm(`Delete ${p} from your site when you next publish?`)) return;
        d.removed = [...new Set([...(d.removed || []), p])]; Drafts.write(d); Media.grid();
      });
      grid.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => { const p = b.closest('.mtile').dataset.path; const d = Drafts.read(); d.removed = (d.removed || []).filter(x => x !== p); Drafts.write(d); Media.grid(); });
      grid.querySelectorAll('[data-replace]').forEach(inp => inp.onchange = async () => {
        const p = inp.closest('.mtile').dataset.path, file = inp.files[0]; if (!file) return;
        // Same name and format, so every page using it gets the new image
        const buf = new Uint8Array(await file.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        await Store.addFile(p, { base64: btoa(s), type: file.type, size: file.size });
        toast('Replaced ' + p.split('/').pop() + (file.size > 800 * 1024 ? ` — it’s ${Math.round(file.size / 1024)} KB, consider a smaller file` : ''));
        Media.grid();
      });
    },
  };
  App.views.media = Media;

  // ======================================================
  // Publish history + undo
  // ======================================================
  const History = {
    async render(main) {
      main.innerHTML = App.topbar('Site', 'Publish history', `<a class="btn" href="https://github.com/${esc(CFG.owner)}/${esc(CFG.repo)}/commits/${esc(CFG.branch)}" target="_blank" rel="noopener">${ic('ext')}Open on GitHub</a>`) +
        `<div class="content"><div class="card" id="h-list"><p class="muted">Loading…</p></div></div>`;
      if (PREVIEW && !App.signedIn()) { $('#h-list').innerHTML = '<p class="empty">Your publishes will show here once the site is on GitHub and you sign in there.</p>'; return; }
      try {
        const list = await GH.req(GH.repo(`/commits?sha=${CFG.branch}&per_page=40`));
        $('#h-list').innerHTML = list.map((c, i) => `<div class="hist hist--row"><span class="hist__dot${i === 0 ? ' is-live' : ''}" title="${i === 0 ? 'Live now' : ''}"></span>
          <p><b>${esc(c.commit.message.split('\n')[0])}</b><small>${ago(c.commit.author.date)} · ${new Date(c.commit.author.date).toLocaleString()}${i === 0 ? ' · <span style="color:var(--green)">live now</span>' : ''}</small></p>
          <a href="${esc(c.html_url)}" target="_blank" rel="noopener" aria-label="See this change on GitHub"><code>${c.sha.slice(0, 7)}</code></a>
          ${c.parents.length === 1 ? `<button type="button" class="btn btn--sm" data-undo="${c.sha}">${ix('undo')}Undo</button>` : '<span></span>'}</div>`).join('') || '<p class="empty">No publishes yet.</p>';
        $('#h-list').querySelectorAll('[data-undo]').forEach(b => b.onclick = () => History.undo(b.dataset.undo, list.find(c => c.sha === b.dataset.undo), b));
      } catch (e) { $('#h-list').innerHTML = `<p class="error">Couldn’t load history: ${esc(e.message)}</p>`; }
    },
    async undo(sha, c, btn) {
      const msg = c.commit.message.split('\n')[0];
      if (!confirm(`Undo “${msg}”?\n\nThe files it changed go back to how they were before it. Later changes to other files stay.`)) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Undoing…';
      try {
        const full = await GH.req(GH.repo(`/commits/${sha}`));
        const parent = full.parents[0].sha;
        const before = await GH.req(GH.repo(`/git/trees/${parent}?recursive=1`));
        const map = Object.fromEntries(before.tree.filter(t => t.type === 'blob').map(t => [t.path, t.sha]));
        const changes = [];
        full.files.forEach(x => {
          if (x.status === 'added') changes.push({ path: x.filename, raw: true, remove: true });
          else if (x.status === 'renamed') { changes.push({ path: x.filename, raw: true, remove: true }); if (map[x.previous_filename]) changes.push({ path: x.previous_filename, raw: true, sha: map[x.previous_filename] }); }
          else if (map[x.filename]) changes.push({ path: x.filename, raw: true, sha: map[x.filename] });
        });
        await GH.commit(changes, `Undo: ${msg}\n\nReverts ${sha.slice(0, 7)} from /admin`);
        App.data = await Content.load();
        toast('Undone — the site updates in about a minute');
        History.render($('#main'));
      } catch (e) { alert('Couldn’t undo: ' + e.message); btn.disabled = false; btn.innerHTML = ix('undo') + 'Undo'; }
    },
  };
  App.views.history = History;

  // ======================================================
  // Analytics (GoatCounter)
  // ======================================================
  const KEY = 'pg-gc-key';
  const GC = {
    code: () => ((Drafts.read().site || App.data.site).analytics || {}).goatcounter || '',
    key: () => localStorage.getItem(KEY) || '',
    async get(path, params = {}) {
      const q = new URLSearchParams(params).toString();
      const res = await fetch(`https://${GC.code()}.goatcounter.com/api/v0${path}${q ? '?' + q : ''}`, { headers: { Authorization: 'Bearer ' + GC.key(), 'Content-Type': 'application/json' }, cache: 'no-store' })
        .catch(() => { throw new Error('Can’t reach GoatCounter.'); });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'GoatCounter didn’t accept the API key.' : (data.error || data.errors && JSON.stringify(data.errors) || res.statusText));
      return data;
    },
    range(days) { const end = new Date(); const start = new Date(Date.now() - days * 864e5); const iso = d => d.toISOString().slice(0, 19) + 'Z'; return { start: iso(start), end: iso(end) }; },
  };
  const BUCKETS = [['under-30s', '< 30s'], ['30s-1m', '30s–1m'], ['1-3m', '1–3m'], ['3-5m', '3–5m'], ['5-10m', '5–10m'], ['over-10m', '10m +']];
  const Analytics = {
    days: 30,
    async render(main) {
      const code = GC.code(), key = GC.key();
      main.innerHTML = App.topbar('Site', 'Analytics', code && key ? `<div class="seg seg--text" role="group" aria-label="Date range">${[7, 30, 90].map(d => `<button type="button" data-days="${d}" aria-pressed="${Analytics.days === d}">${d} days</button>`).join('')}</div>
        <a class="btn" href="https://${esc(code)}.goatcounter.com" target="_blank" rel="noopener">${ic('ext')}GoatCounter</a>` : '') + `<div class="content" id="an"></div>`;
      if (!code || !key) return Analytics.setup();
      main.querySelectorAll('[data-days]').forEach(b => b.onclick = () => { Analytics.days = +b.dataset.days; Analytics.render(main); });
      Analytics.load();
    },
    setup() {
      const code = GC.code();
      const notMe = localStorage.getItem('pg-no-track');
      $('#an').innerHTML = `
        <div class="card setup">
          <span class="badge badge--draft">Not connected</span>
          <h2 class="serif" style="margin:0;font-size:28px">Connect GoatCounter</h2>
          <p class="muted">Free, no cookies, no banner needed. You’ll see visitors, where they came from, views per case study, how far people read and how long they stay.</p>
          <ol class="setup__steps">
            <li>Sign up at <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener">goatcounter.com/signup</a> — for “Code” use <b>${esc(code || CFG.goatcounter || 'prayagv1')}</b>, so your stats live at ${esc(code || CFG.goatcounter || 'prayagv1')}.goatcounter.com.</li>
            <li>In GoatCounter go to <b>Settings → API → New API key</b>, tick <b>Read statistics</b>, and copy the key.</li>
            <li>Paste both below, then publish — counting starts on the live site.</li>
          </ol>
          <form id="gc-form" class="fgrid" novalidate>
            <div class="field field--half"><label class="label" for="gc-code">GoatCounter code</label><input class="input" id="gc-code" value="${esc(code || CFG.goatcounter || '')}" placeholder="prayagv1" spellcheck="false"></div>
            <div class="field field--half"><label class="label" for="gc-key">API key</label><input class="input" id="gc-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste key"></div>
            <p class="hint" style="width:100%">The code goes on your site so visits can be counted. The key is stored only in this browser and is never published.</p>
            <p class="error" id="gc-err" hidden></p>
            <div class="row-end" style="width:100%"><button class="btn btn--primary" type="submit">Connect</button></div>
          </form>
        </div>
        ${Analytics.meToggle(notMe)}`;
      Analytics.bindMe();
      $('#gc-form').onsubmit = async e => {
        e.preventDefault();
        const c = slugify($('#gc-code').value).replace(/-/g, ''), k = $('#gc-key').value.trim(), err = $('#gc-err');
        if (!c) { err.hidden = false; err.textContent = 'Add your GoatCounter code.'; return; }
        const site = Store.site(); site.analytics = Object.assign({}, site.analytics, { goatcounter: c }); Store.saveSite(site);
        if (k) {
          localStorage.setItem(KEY, k);
          try { await GC.get('/me'); } catch (ex) { localStorage.removeItem(KEY); err.hidden = false; err.textContent = ex.message + ' Check the code and key.'; return; }
        }
        toast(k ? 'Connected' : 'Code saved — publish to start counting');
        App.route();
      };
    },
    meToggle(notMe) {
      return `<div class="card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <span style="flex:1;min-width:240px"><b style="font-weight:400">Don’t count my own visits on this browser</b><small class="muted" style="display:block;margin-top:4px">Your visits are also skipped on any browser where you’re signed in here with “Remember on this device”.</small></span>
        <label class="switch"><input type="checkbox" id="notme"${notMe ? ' checked' : ''}><span></span></label></div>`;
    },
    bindMe() { const t = $('#notme'); if (t) t.onchange = () => { if (t.checked) localStorage.setItem('pg-no-track', '1'); else localStorage.removeItem('pg-no-track'); toast(t.checked ? 'Your visits on this browser won’t be counted' : 'Your visits will be counted'); }; },
    async load() {
      const an = $('#an');
      an.innerHTML = `<div class="stats">${[1, 2, 3, 4].map(() => '<div class="card stat"><span class="label skeleton">Loading</span><strong class="skeleton">00</strong><small class="skeleton">loading</small></div>').join('')}</div>`;
      const r = GC.range(Analytics.days);
      try {
        const [total, hits, refs, sizes, locs] = await Promise.all([
          GC.get('/stats/total', r), GC.get('/stats/hits', Object.assign({ limit: 100 }, r)),
          GC.get('/stats/toprefs', Object.assign({ limit: 8 }, r)), GC.get('/stats/sizes', r), GC.get('/stats/locations', Object.assign({ limit: 8 }, r)),
        ]);
        Analytics.draw({ total, hits: hits.hits || [], refs: refs.stats || [], sizes: sizes.stats || [], locs: locs.stats || [] });
      } catch (e) {
        an.innerHTML = `<div class="banner banner--bad">${ic('warn')}<span>${esc(e.message)}</span><span class="right"><a href="#" id="gc-reset">Reconnect</a></span></div>`;
        $('#gc-reset').onclick = ev => { ev.preventDefault(); localStorage.removeItem(KEY); App.route(); };
      }
    },
    draw(d) {
      const site = Store.site();
      const pages = d.hits.filter(h => !h.event);
      const events = d.hits.filter(h => h.event);
      const ev = p => (events.find(h => h.path === p) || {}).count || 0;
      const caseViews = slug => pages.filter(h => h.path.replace(/\.html$/, '').replace(/\/$/, '') === '/work/' + slug).reduce((a, h) => a + h.count, 0);
      const cases = (site.caseStudies || []).map(c => {
        const cd = Store.caseOf(c.slug) || {};
        const views = caseViews(c.slug);
        const chapters = cd.confidential ? [] : ['snapshot', 'context', 'process', 'research', 'problem', 'explorations', 'solution', 'impact', 'next', 'learnings'].filter(k => k in cd).map(k => ({ id: k, name: k === 'explorations' ? (cd.explorations.name || 'Explorations') : k === 'next' ? 'What’s next' : k[0].toUpperCase() + k.slice(1), n: ev(`read/${c.slug}/${k}`) }));
        const end = ev(`read/${c.slug}/end`);
        const times = BUCKETS.map(([k, label]) => ({ label, n: ev(`time/${c.slug}/${k}`) }));
        const tt = times.reduce((a, t) => a + t.n, 0);
        const top = tt ? times.reduce((a, t) => t.n > a.n ? t : a) : null;
        return { c, views, chapters, end, times, tt, top, conf: !!cd.confidential };
      });
      const caseTotal = cases.reduce((a, x) => a + x.views, 0);
      const ended = cases.reduce((a, x) => a + x.end, 0);
      const daily = (d.total.stats || []).map(s => ({ day: s.day, n: s.daily || 0 }));
      const max = Math.max(1, ...daily.map(x => x.n));
      const pct = (a, b) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
      const sizeName = { phone: 'Phone', largephone: 'Large phone', tablet: 'Tablet', desktop: 'Desktop', desktophd: 'Large desktop', unknown: 'Unknown' };
      const bars = (list, label = x => x.name, tot) => { const m = Math.max(1, ...list.map(x => x.count)); tot = tot || list.reduce((a, x) => a + x.count, 0); return list.length ? list.map(x => `<div class="hbar"><span class="hbar__l" title="${esc(label(x))}">${esc(label(x))}</span><span class="hbar__t"><i style="width:${(x.count / m * 100).toFixed(1)}%"></i></span><b>${x.count}</b><small>${pct(x.count, tot)}%</small></div>`).join('') : '<p class="empty">No data yet.</p>'; };

      $('#an').innerHTML = `
        <div class="stats">
          <div class="card stat"><span class="label">Visitors</span><strong>${d.total.total || 0}</strong><small>last ${Analytics.days} days</small></div>
          <div class="card stat"><span class="label">Case study views</span><strong>${caseTotal}</strong><small>${pct(caseTotal, d.total.total)}% of visitors opened one</small></div>
          <div class="card stat"><span class="label">Read to the end</span><strong>${pct(ended, caseTotal)}%</strong><small>${ended} of ${caseTotal} case study visits</small></div>
          <div class="card stat"><span class="label">Top source</span><strong style="font-size:26px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((d.refs[0] || {}).name || '—')}</strong><small>${d.refs[0] ? d.refs[0].count + ' visitors' : 'No referrers yet'}</small></div>
        </div>
        <div class="card"><div class="card__head"><span class="label">Visitors per day</span></div>
          ${daily.length ? `<div class="chart" role="img" aria-label="Visitors per day">${daily.map(x => `<span class="chart__bar" style="height:${(x.n / max * 100).toFixed(1)}%" title="${esc(x.day)}: ${x.n}"><i>${x.n}</i></span>`).join('')}</div>
          <div class="chart__axis"><span>${esc(daily[0].day)}</span><span>${esc(daily[daily.length - 1].day)}</span></div>` : '<p class="empty">No visits yet. It can take a few minutes after your first visitor.</p>'}</div>
        <div class="card"><div class="card__head"><span class="label">Case studies — how far people read</span></div>
          <div class="ctable">
            <div class="ctable__row ctable__row--head"><span class="label">Case study</span><span class="label">Views</span><span class="label">Read to end</span><span class="label">Usual time</span><span></span></div>
            ${cases.map((x, i) => `<details class="ctable__item"><summary class="ctable__row">
              <span><b>${esc(x.c.title || x.c.slug)}</b>${x.c.status !== 'published' ? ' <span class="badge badge--draft">Draft</span>' : ''}${x.conf ? ' <span class="badge badge--conf">Confidential</span>' : ''}</span>
              <span>${x.views}</span><span>${x.conf ? '—' : pct(x.end, x.views) + '%'}</span><span>${x.top ? esc(x.top.label) : '—'}</span><span class="ctable__more">${ix('down')}</span></summary>
              <div class="ctable__detail">
                ${x.conf ? '<p class="hint">Confidential pages only count views.</p>' : `<div><p class="label" style="margin:0 0 10px">Chapters reached</p>${x.chapters.map(ch => `<div class="hbar"><span class="hbar__l">${esc(ch.name)}</span><span class="hbar__t"><i style="width:${pct(ch.n, x.views)}%"></i></span><b>${pct(ch.n, x.views)}%</b><small>${ch.n}</small></div>`).join('')}
                  <div class="hbar"><span class="hbar__l">Read to the end</span><span class="hbar__t"><i style="width:${pct(x.end, x.views)}%"></i></span><b>${pct(x.end, x.views)}%</b><small>${x.end}</small></div></div>
                <div><p class="label" style="margin:0 0 10px">Time spent reading</p>${x.tt ? x.times.map(t => `<div class="hbar"><span class="hbar__l">${t.label}</span><span class="hbar__t"><i style="width:${pct(t.n, x.tt)}%"></i></span><b>${pct(t.n, x.tt)}%</b><small>${t.n}</small></div>`).join('') : '<p class="empty" style="padding:0">No reading time recorded yet.</p>'}</div>`}
              </div></details>`).join('')}
          </div></div>
        <div class="split3">
          <div class="card"><div class="card__head"><span class="label">Where visitors came from</span></div>${bars(d.refs, x => x.name || '(direct)')}</div>
          <div class="card"><div class="card__head"><span class="label">Devices</span></div>${bars(d.sizes, x => sizeName[x.id] || x.name || x.id)}</div>
          <div class="card"><div class="card__head"><span class="label">Countries</span></div>${bars(d.locs, x => x.name || x.id)}</div>
        </div>
        <div class="card"><div class="card__head"><span class="label">Most viewed pages</span></div>${bars(pages.slice(0, 10).map(h => ({ name: h.title ? `${h.title} (${h.path})` : h.path, count: h.count })), x => x.name, d.total.total)}</div>
        ${Analytics.meToggle(localStorage.getItem('pg-no-track'))}
        <p class="hint">Numbers come from GoatCounter. Visitors are counted once per page per day; no cookies are used. <a href="#" id="gc-off" style="color:var(--muted)">Disconnect this browser</a></p>`;
      Analytics.bindMe();
      $('#gc-off').onclick = e => { e.preventDefault(); localStorage.removeItem(KEY); App.route(); };
    },
  };
  App.views.analytics = Analytics;

  // Dashboard card: visitors this week
  A.analyticsTeaser = async card => {
    if (!card || !GC.code() || !GC.key()) return;
    card.querySelector('.badge').outerHTML = '<span class="badge badge--pub">Connected</span>';
    try {
      const t = await GC.get('/stats/total', GC.range(7));
      const sm = card.querySelector('small'); if (sm) sm.innerHTML = `<b style="font-family:var(--serif);font-weight:400;font-size:22px;color:var(--text)">${t.total || 0}</b> visitors in the last 7 days — see case study reading, sources and devices`;
    } catch (e) { /* keep the default text */ }
  };
})();
