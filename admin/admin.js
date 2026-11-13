/* ==========================================================
   Portfolio admin — core, sign in, dashboard
   Saves content straight to your GitHub repo with your own
   access token. Nothing else stores or sees your data.
   ========================================================== */
(function () {
  const CFG = window.ADMIN_CONFIG || {};
  const API = 'https://api.github.com';
  const TOKEN_KEY = 'pg-admin-token';
  const DRAFT_KEY = 'pg-admin-drafts';
  const PREVIEW = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  // ---------- Small helpers ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el = document) => el.querySelector(sel);
  const repoPath = p => (CFG.siteFolder ? CFG.siteFolder.replace(/\/+$/, '') + '/' : '') + p;
  const ago = iso => {
    if (!iso) return '—';
    const s = Math.round((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'just now';
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, n] of units) if (s >= n) { const v = Math.floor(s / n); return v === 1 && u === 'day' ? 'yesterday' : `${v} ${u}${v > 1 ? 's' : ''} ago`; }
  };
  const toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('is-on'), 2600);
  };

  const P = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    case: '<path d="M4 5h16v14H4z"/><path d="M4 9h16"/><path d="M8 13h8M8 16h5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    exp: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    art: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    out: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  };
  const ic = (k, extra = '') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[k]}</svg>`;

  // ---------- Token storage ----------
  const Token = {
    get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
    set: (t, remember) => { Token.clear(); (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t); },
    clear: () => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); },
  };

  // ---------- GitHub API ----------
  class GHError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
  const GH = {
    token: null,
    async req(path, opts = {}) {
      const res = await fetch(API + path, {
        cache: 'no-store',
        ...opts,
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + GH.token, ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
      }).catch(() => { throw new GHError(0, 'Can’t reach GitHub. Check your internet connection.'); });
      if (res.status === 204) return null;
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401 && App.user) App.expired();
        throw new GHError(res.status, (data && data.message) || res.statusText);
      }
      return data;
    },
    repo: (p = '') => `/repos/${CFG.owner}/${CFG.repo}${p}`,
    // Read a text file → { text, sha }
    async getText(path) {
      const d = await GH.req(GH.repo(`/contents/${encodeURI(repoPath(path))}?ref=${CFG.branch}`));
      const bin = atob(d.content.replace(/\n/g, ''));
      return { text: new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))), sha: d.sha };
    },
    // Commit several files at once (one publish = one commit).
    // changes: [{ path, text } | { path, base64 } | { path, remove: true }]
    async commit(changes, message) {
      const ref = await GH.req(GH.repo(`/git/ref/heads/${CFG.branch}`));
      const base = await GH.req(GH.repo(`/git/commits/${ref.object.sha}`));
      const tree = [];
      for (const c of changes) {
        const path = c.raw ? c.path : repoPath(c.path);
        if (c.remove) { tree.push({ path, mode: '100644', type: 'blob', sha: null }); continue; }
        if (c.sha) { tree.push({ path, mode: '100644', type: 'blob', sha: c.sha }); continue; }
        const blob = await GH.req(GH.repo('/git/blobs'), { method: 'POST', body: JSON.stringify(c.base64 != null ? { content: c.base64, encoding: 'base64' } : { content: c.text, encoding: 'utf-8' }) });
        tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const newTree = await GH.req(GH.repo('/git/trees'), { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
      const commit = await GH.req(GH.repo('/git/commits'), { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }) });
      await GH.req(GH.repo(`/git/refs/heads/${CFG.branch}`), { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
      return commit;
    },
  };

  // ---------- Content files (window.X = {json};) ----------
  const Content = {
    parse(text) { return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); },
    siteFile: obj => "// Website content — edited from /admin. Keep this file valid JSON after the '=' sign.\nwindow.SITE = " + JSON.stringify(obj, null, 2) + ';\n',
    caseFile: obj => "// Case study content — edited from /admin. Keep valid JSON after the '=' sign.\nwindow.CASE = " + JSON.stringify(obj, null, 2) + ';\n',
    // Load a local script (preview mode) and return what it put on window
    loadScript(src, key) {
      return new Promise((resolve, reject) => {
        delete window[key];
        const s = document.createElement('script');
        s.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
        s.onload = () => { const v = window[key]; s.remove(); v ? resolve(v) : reject(new Error('Empty file: ' + src)); };
        s.onerror = () => { s.remove(); reject(new Error('Missing file: ' + src)); };
        document.head.appendChild(s);
      });
    },
    async load() {
      let site, cases = {};
      if (PREVIEW) {
        site = await Content.loadScript('../content/site.js', 'SITE');
        for (const c of site.caseStudies || []) {
          try { cases[c.slug] = await Content.loadScript(`../work/data/${c.slug}.js`, 'CASE'); } catch (e) { cases[c.slug] = null; }
        }
      } else {
        const f = await GH.getText('content/site.js');
        site = Content.parse(f.text);
        const list = await Promise.all((site.caseStudies || []).map(c => GH.getText(`work/data/${c.slug}.js`).then(r => Content.parse(r.text)).catch(() => null)));
        (site.caseStudies || []).forEach((c, i) => { cases[c.slug] = list[i]; });
      }
      return { site, cases };
    },
  };

  // ---------- Unpublished changes (kept in this browser until you publish) ----------
  const Drafts = {
    read() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch (e) { return {}; } },
    write(d) { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); App.refreshChrome(); },
    clear() { localStorage.removeItem(DRAFT_KEY); App.refreshChrome(); },
    count() {
      const d = Drafts.read();
      const leak = App.data ? Object.entries(App.data.cases).filter(([s, c]) => c && c.confidential && !(d.cases && s in d.cases) && ['cover', 'snapshot', 'context', 'process', 'research', 'problem', 'explorations', 'solution', 'impact', 'next', 'learnings'].some(k => k in c)).length : 0;
      return (d.site ? 1 : 0) + Object.keys(d.cases || {}).length + Object.keys(d.files || {}).length + (d.removed || []).length + leak;
    },
  };

  // ---------- Routes ----------
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'case-studies', label: 'Case studies', icon: 'case', count: () => (App.data ? (App.data.site.caseStudies || []).length : '') },
    { id: 'hero', label: 'Hero &amp; about', icon: 'home' },
    { id: 'experience', label: 'Experience', icon: 'exp', count: () => (App.data ? ((App.data.site.experience || {}).items || []).length : '') },
    { id: 'ideas', label: 'Articles &amp; ideas', icon: 'art', count: () => (App.data ? ((App.data.site.ideas || {}).items || []).length : '') },
    { id: 'contact', label: 'Contact &amp; links', icon: 'link' },
    { id: 'media', label: 'Media library', icon: 'img' },
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
    { id: 'history', label: 'Publish history', icon: 'hist' },
  ];
  const SOON = {
    'case-studies': ['Step 3', 'Add, reorder, edit and remove case studies — every chapter, with a live preview, image upload and Publish.'],
    hero: ['Step 4', 'Edit your name, role, photo, bio and skills.'],
    experience: ['Step 4', 'Add, edit, reorder and remove jobs, and mark your current role.'],
    ideas: ['Step 4', 'Manage the “Ideas I Couldn’t Ignore” list — external articles and concept case studies.'],
    contact: ['Step 4', 'Change your email, social links, resume file and reviewer form.'],
    media: ['Step 4', 'Upload and replace screenshots, logos and photos.'],
    analytics: ['Step 5b', 'Visitors, where they came from, views per case study, how far people read and reading time — from GoatCounter.'],
    history: ['Step 4', 'Every publish you’ve made, with the option to undo one.'],
  };

  // ---------- App ----------
  const App = {
    user: null, data: null, view: null, views: {},
    async start() {
      const t = Token.get();
      if (PREVIEW && sessionStorage.getItem('pg-admin-preview')) return App.enterPreview();
      if (!t) return App.renderSignIn();
      GH.token = t;
      try { await App.verify(); await App.enter(); }
      catch (e) { Token.clear(); App.renderSignIn(e.message); }
    },

    // Only the site owner, with write access to the repo, gets in.
    async verify() {
      let user;
      try { user = await GH.req('/user'); }
      catch (e) { throw new Error(e.status === 401 ? 'That token isn’t valid or has expired. Create a new one on GitHub.' : e.message); }
      if (user.login.toLowerCase() !== String(CFG.owner).toLowerCase())
        throw new Error(`This token belongs to @${user.login}. Only @${CFG.owner} can edit this site.`);
      let repo;
      try { repo = await GH.req(GH.repo()); }
      catch (e) { throw new Error(e.status === 404 ? `This token can’t see the repo ${CFG.owner}/${CFG.repo}. When creating the token, choose “Only select repositories” and pick it.` : e.message); }
      if (repo.permissions && repo.permissions.push === false) throw new Error('This token can read the repo but not change it. Give it “Contents: Read and write”.');
      App.user = user; App.repo = repo;
    },

    async enter() {
      App.renderShell();
      try { App.data = await Content.load(); }
      catch (e) { App.data = null; App.loadError = e.message; }
      App.refreshChrome();
      App.route();
      window.addEventListener('hashchange', App.route);
    },
    async enterPreview() {
      sessionStorage.setItem('pg-admin-preview', '1');
      App.user = { login: CFG.owner, name: 'Preview on your Mac', avatar_url: '' };
      await App.enter();
    },
    signOut() {
      Token.clear(); sessionStorage.removeItem('pg-admin-preview');
      App.user = null; App.data = null; location.hash = '';
      window.removeEventListener('hashchange', App.route);
      App.renderSignIn();
    },
    expired() { Token.clear(); App.user = null; App.renderSignIn('Your sign-in has expired. Sign in again with a valid token.'); },

    // ----- Sign in -----
    renderSignIn(error) {
      const tokenUrl = `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent('Portfolio admin')}&description=${encodeURIComponent('Edit ' + CFG.repo + ' from /admin')}&contents=write`;
      $('#app').innerHTML = `
      <div class="signin"><main class="signin__wrap">
        <div class="signin__top"><a class="logo" href="../index.html" aria-label="Back to the website">PG</a><span class="chip">Admin</span></div>
        <div class="signin__card">
          <h1>Sign in to edit your portfolio</h1>
          <p>Changes are saved straight to your GitHub repo <span style="color:var(--text)">${esc(CFG.owner)}/${esc(CFG.repo)}</span>. Only a token from @${esc(CFG.owner)} with write access can sign in.</p>
          <form id="signin" novalidate>
            <label class="label" for="tok">GitHub access token</label>
            <div class="pw">
              <input class="input" id="tok" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" required aria-describedby="tok-err">
              <button type="button" id="peek" aria-label="Show token" aria-pressed="false">${ic('eye')}</button>
            </div>
            <p class="error" id="tok-err" ${error ? '' : 'hidden'}>${esc(error || '')}</p>
            <label class="check"><input type="checkbox" id="remember" checked> Remember on this device</label>
            <button class="btn btn--primary" type="submit" id="go">Sign in</button>
          </form>
        </div>
        <div class="note">${ic('lock')}
          <p>First time? <a href="${tokenUrl}" target="_blank" rel="noopener">Create a token on GitHub</a> — fine-grained, “Only select repositories” → ${esc(CFG.repo)}, “Contents: Read and write”. Anyone else who opens this page can’t sign in or change anything.</p>
        </div>
        ${PREVIEW ? `<p class="preview-link">Opened from your computer. <a href="#" id="preview">Look around without signing in</a> — publishing is off.</p>` : ''}
      </main></div>`;
      const tok = $('#tok'), err = $('#tok-err'), go = $('#go');
      tok.focus();
      $('#peek').onclick = e => {
        const show = tok.type === 'password'; tok.type = show ? 'text' : 'password';
        e.currentTarget.innerHTML = ic(show ? 'eyeOff' : 'eye'); e.currentTarget.setAttribute('aria-pressed', String(show));
        e.currentTarget.setAttribute('aria-label', show ? 'Hide token' : 'Show token');
      };
      const pv = $('#preview'); if (pv) pv.onclick = e => { e.preventDefault(); App.enterPreview(); };
      $('#signin').onsubmit = async e => {
        e.preventDefault();
        const t = tok.value.trim();
        if (!t) { err.hidden = false; err.textContent = 'Paste your GitHub token.'; tok.focus(); return; }
        go.disabled = true; go.innerHTML = '<span class="spinner"></span> Checking…'; err.hidden = true;
        GH.token = t;
        try { await App.verify(); Token.set(t, $('#remember').checked); await App.enter(); }
        catch (ex) { GH.token = null; err.hidden = false; err.textContent = ex.message; go.disabled = false; go.textContent = 'Sign in'; tok.select(); }
      };
    },

    // ----- Shell: sidebar + main -----
    renderShell() {
      const u = App.user;
      $('#app').innerHTML = `
      <div class="shell" id="shell">
        <aside class="side" id="side" aria-label="Admin">
          <div class="side__brand"><a class="logo" href="#/dashboard">PG</a><span class="chip">Admin</span></div>
          <nav id="nav"></nav>
          <div class="side__user">
            <div class="who"><span class="avatar">${u.avatar_url ? `<img src="${esc(u.avatar_url)}" alt="">` : 'PG'}</span>
              <div><span>${esc(u.name || u.login)}</span><small>${PREVIEW && !GH.token ? 'Preview · not signed in' : 'Owner · @' + esc(u.login)}</small></div></div>
            <button class="signout" id="signout" type="button">${ic('out')}${PREVIEW && !GH.token ? 'Exit preview' : 'Sign out'}</button>
          </div>
        </aside>
        <div class="main" id="main"></div>
      </div>`;
      $('#signout').onclick = App.signOut;
      $('#shell').addEventListener('click', e => { if (e.target.id === 'shell') $('#shell').classList.remove('menu-open'); });
    },
    refreshChrome() {
      const nav = $('#nav'); if (!nav) return;
      const cur = App.current();
      const pend = Drafts.count();
      nav.innerHTML = NAV.map(n => {
        const c = n.count ? n.count() : '';
        return `<a class="navlink${n.id === cur ? ' is-active' : ''}" href="#/${n.id}"${n.id === cur ? ' aria-current="page"' : ''}>${ic(n.icon)}<span>${n.label}</span>${c !== '' ? `<span class="count">${c}</span>` : ''}</a>`;
      }).join('') + (pend ? `<a class="navlink" href="#/publish">${ic('check')}<span>Review &amp; publish</span><span class="dot" aria-label="${pend} unpublished"></span></a>` : '');
    },
    current() { return (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'dashboard'; },
    route() {
      if (!App.user) return;
      const id = App.current();
      $('#shell') && $('#shell').classList.remove('menu-open');
      App.refreshChrome();
      const main = $('#main');
      if (App.loadError && id !== 'history') {
        main.innerHTML = App.topbar('Something went wrong', 'Couldn’t load your content') + `<div class="content"><div class="banner banner--bad">${ic('warn')}<span>${esc(App.loadError)}</span></div><div><button class="btn" onclick="location.reload()">Try again</button></div></div>`;
        return App.bindTopbar();
      }
      const view = App.views[id] || (id === 'dashboard' ? Dashboard : null);
      if (view) view.render(main);
      else App.renderSoon(main, id);
      App.bindTopbar();
      main.scrollTop = 0; window.scrollTo(0, 0);
    },
    topbar(crumb, title, actions = '') {
      const n = Drafts.count();
      return `<header class="topbar">
        <div style="display:flex;align-items:center;gap:14px"><button class="icon-btn menu-btn" id="menu" type="button" aria-label="Open menu" aria-controls="side">${ic('menu')}</button>
        <div class="topbar__titles"><span>${crumb}</span><h1>${title}</h1></div></div>
        <div class="topbar__actions">${n ? `<a class="pending" href="#/publish">${n} unpublished change${n > 1 ? 's' : ''}</a>` : ''}${actions}</div>
      </header>`;
    },
    bindTopbar() { const m = $('#menu'); if (m) m.onclick = () => $('#shell').classList.add('menu-open'); },
    renderSoon(main, id) {
      const n = NAV.find(x => x.id === id) || { label: id };
      const s = SOON[id] || ['a later step', ''];
      main.innerHTML = App.topbar('Content', n.label) + `<div class="content"><div class="card soon"><span class="badge badge--draft">Coming in ${esc(s[0])}</span><h2>${n.label}</h2><p>${esc(s[1])}</p><a class="btn" href="#/dashboard">Back to dashboard</a></div></div>`;
    },
    preview: PREVIEW, signedIn: () => !!GH.token,
  };

  // ---------- Dashboard ----------
  const Dashboard = {
    render(main) {
      const d = App.data, site = d.site, cases = d.cases;
      const list = site.caseStudies || [];
      const pub = list.filter(c => c.status === 'published');
      const conf = list.filter(c => cases[c.slug] && cases[c.slug].confidential).length;
      const drafts = list.length - pub.length;
      const jobs = (site.experience || {}).items || [];
      const cur = jobs.find(j => j.current);
      const pend = Drafts.count();
      const hour = new Date().getHours();
      const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const first = (site.hero || {}).firstName || '';

      const stat = (href, label, value, sub, id) => `<a class="card stat" href="${href}"><span class="label">${label}</span><strong${id ? ` id="${id}"` : ''}>${value}</strong><small${id ? ` id="${id}-sub"` : ''}>${sub}</small></a>`;
      const qa = (href, icon, title, sub) => `<a class="qa" href="${href}"><span class="qa__ic">${ic(icon)}</span><span><b>${title}</b><small>${sub}</small></span></a>`;

      main.innerHTML = App.topbar(`${hello}${first ? ', ' + esc(first) : ''}`, 'Your portfolio',
        `<a class="btn" href="${PREVIEW ? '../index.html' : esc(CFG.siteUrl)}" target="_blank" rel="noopener">${ic('ext')}View site</a>
         <a class="btn btn--primary" href="#/case-studies/new">${ic('plus')}New case study</a>`) + `
      <div class="content">
        <div id="status">${PREVIEW && !App.signedIn()
          ? `<div class="banner banner--info">${ic('info')}<span>Preview mode — reading the files on your computer. Publishing turns on once the site is on GitHub and you sign in.</span></div>`
          : `<div class="banner banner--info"><span class="spinner"></span><span>Checking your live site…</span></div>`}</div>
        <div class="stats">
          ${stat('#/case-studies', 'Case studies', list.length, `${pub.length} published${drafts ? ` · ${drafts} draft${drafts > 1 ? 's' : ''}` : ''}${conf ? ` · ${conf} confidential` : ''}`)}
          ${stat('#/experience', 'Experience', jobs.length, cur ? 'Current: ' + esc(cur.company) : 'No current role set')}
          ${stat(pend ? '#/publish' : '#/dashboard', 'Unpublished changes', pend, pend ? 'Review and publish' : 'Everything is live')}
          ${stat('#/history', 'Last publish', '—', 'Loading…', 'last')}
        </div>
        <div class="split">
          <div class="card"><span class="label">Quick actions</span><div class="quick">
            ${qa('#/case-studies/new', 'plus', 'New case study', 'Start from the 11-chapter template')}
            ${qa('#/hero', 'home', 'Edit hero &amp; about', 'Name, role, bio, skills')}
            ${qa('#/experience', 'exp', 'Update experience', 'Jobs, dates, current role')}
            ${qa('#/media', 'img', 'Upload images', 'Screenshots, logos, photos')}
          </div></div>
          <div class="card"><div class="card__head"><span class="label">Recent publishes</span><a href="#/history">See all</a></div><div id="commits">
            ${PREVIEW && !App.signedIn() ? '<p class="empty">Your publishes will show here once the site is on GitHub.</p>' : [1, 2, 3, 4].map(() => '<div class="hist"><p class="skeleton">Loading change</p></div>').join('')}
          </div></div>
        </div>
        <a class="card" id="an-card" href="#/analytics" style="display:flex;align-items:center;gap:18px;text-decoration:none">
          <span class="qa__ic">${ic('chart')}</span>
          <span style="flex:1"><b style="font-weight:400;font-size:16px">Analytics</b><small class="muted" style="display:block;margin-top:4px">Visitors, case study views and how far people read — switched on in step 5b with GoatCounter.</small></span>
          <span class="badge badge--draft">Not connected</span>
        </a>
      </div>`;
      if (window.Admin.analyticsTeaser) window.Admin.analyticsTeaser($('#an-card'));
      if (!(PREVIEW && !App.signedIn())) Dashboard.loadLive();
      else { $('#last').textContent = '—'; $('#last-sub').textContent = 'Not on GitHub yet'; }
    },
    async loadLive() {
      const status = $('#status'), commitsEl = $('#commits');
      // Recent commits
      GH.req(GH.repo(`/commits?sha=${CFG.branch}&per_page=5`)).then(list => {
        if (!$('#commits')) return;
        commitsEl.innerHTML = list.length ? list.map(c => `<div class="hist">${ic('check')}<p title="${esc(c.commit.message)}">${esc(c.commit.message.split('\n')[0])}</p><small>${ago(c.commit.author.date)}</small><a href="${esc(c.html_url)}" target="_blank" rel="noopener" aria-label="Open on GitHub"><code>${c.sha.slice(0, 7)}</code></a></div>`).join('') : '<p class="empty">No publishes yet.</p>';
        if (list[0]) { $('#last').textContent = ago(list[0].commit.author.date); $('#last-sub').textContent = list[0].commit.message.split('\n')[0]; }
      }).catch(e => { if ($('#commits')) commitsEl.innerHTML = `<p class="empty">Couldn’t load history: ${esc(e.message)}</p>`; });
      // GitHub Pages status
      try {
        const b = await GH.req(GH.repo('/pages/builds/latest'));
        if (!$('#status')) return;
        const url = esc(CFG.siteUrl.replace(/^https?:\/\//, ''));
        if (b.status === 'built') status.innerHTML = `<div class="banner banner--ok">${ic('check')}<span>Site is live at <a href="${esc(CFG.siteUrl)}" target="_blank" rel="noopener">${url}</a></span><span class="right">Updated ${ago(b.updated_at)} · ${esc(CFG.branch)} branch</span></div>`;
        else if (b.status === 'errored') status.innerHTML = `<div class="banner banner--bad">${ic('warn')}<span>The last update failed to go live. ${esc((b.error && b.error.message) || '')}</span><span class="right"><a href="https://github.com/${esc(CFG.owner)}/${esc(CFG.repo)}/actions" target="_blank" rel="noopener">See details</a></span></div>`;
        else { status.innerHTML = `<div class="banner banner--wait"><span class="spinner"></span><span>Your latest changes are going live…</span><span class="right">Usually about a minute</span></div>`; setTimeout(() => $('#status') && Dashboard.loadLive(), 15000); }
      } catch (e) {
        if (!$('#status')) return;
        status.innerHTML = e.status === 404
          ? `<div class="banner banner--wait">${ic('warn')}<span>GitHub Pages isn’t switched on for this repo yet.</span><span class="right"><a href="https://github.com/${esc(CFG.owner)}/${esc(CFG.repo)}/settings/pages" target="_blank" rel="noopener">Turn it on</a></span></div>`
          : `<div class="banner banner--bad">${ic('warn')}<span>Couldn’t check the live site: ${esc(e.message)}</span></div>`;
      }
    },
  };

  // Shared with the later admin files (case studies, sections, analytics)
  window.Admin = { App, GH, Content, Drafts, Token, CFG, esc, ic, ago, toast, $, PREVIEW };
  document.addEventListener('DOMContentLoaded', App.start);
  if (document.readyState !== 'loading') App.start();
})();
