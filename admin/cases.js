/* ==========================================================
   Portfolio admin — case studies, editor, publish, remove
   ========================================================== */
(function () {
  const { App, GH, Content, Drafts, CFG, esc, ic, ago, toast, $, PREVIEW } = window.Admin;
  const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // Extra icons used here
  const EX = {
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    up: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  };
  const ix = (k, extra = '') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${EX[k]}</svg>`;

  // ======================================================
  // Uploaded files waiting to be published (kept in IndexedDB, they can be big)
  // ======================================================
  const Files = {
    urls: {}, // repo path → object URL / data URL for previews
    db() {
      return Files._db || (Files._db = new Promise((res, rej) => {
        const r = indexedDB.open('pg-admin', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      }));
    },
    async tx(mode, fn) { const db = await Files.db(); return new Promise((res, rej) => { const t = db.transaction('files', mode); const out = fn(t.objectStore('files')); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); },
    put: (path, rec) => Files.tx('readwrite', s => s.put(rec, path)),
    get: path => Files.tx('readonly', s => s.get(path)),
    del: path => Files.tx('readwrite', s => s.delete(path)),
    clear: () => Files.tx('readwrite', s => s.clear()),
    async loadUrls() {
      const idx = (Drafts.read().files) || {};
      for (const p of Object.keys(idx)) if (!Files.urls[p]) { const r = await Files.get(p).catch(() => null); if (r) Files.urls[p] = `data:${r.type};base64,${r.base64}`; }
    },
    src(path) { return Files.urls[path] || '../' + path; },
  };

  // Read a picked image, shrink it if it's large, return { base64, type, ext, size }
  async function prepareImage(file) {
    const raster = /^image\/(png|jpe?g|webp)$/.test(file.type);
    const toB64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
    if (raster) {
      const bmp = await createImageBitmap(file).catch(() => null);
      if (bmp && (bmp.width > 2400 || file.size > 600 * 1024)) {
        const scale = Math.min(1, 2400 / bmp.width);
        const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.86));
        if (blob && blob.size < file.size) return { base64: toB64(await blob.arrayBuffer()), type: 'image/webp', ext: 'webp', size: blob.size };
      }
    }
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    return { base64: toB64(await file.arrayBuffer()), type: file.type || 'application/octet-stream', ext, size: file.size };
  }

  // ======================================================
  // Working copies: drafts if you have them, otherwise what's live
  // ======================================================
  const Store = {
    site: () => clone(Drafts.read().site || App.data.site),
    saveSite(site) {
      const d = Drafts.read();
      if (same(site, App.data.site)) delete d.site; else d.site = site;
      Drafts.write(d);
    },
    caseOf(slug) {
      const d = Drafts.read();
      if (d.cases && slug in d.cases) return clone(d.cases[slug]);
      return clone(App.data.cases[slug]);
    },
    saveCase(slug, obj) {
      const d = Drafts.read(); d.cases = d.cases || {};
      if (obj !== null && same(obj, App.data.cases[slug])) delete d.cases[slug]; else d.cases[slug] = obj;
      Drafts.write(d);
    },
    isNew: slug => !(slug in App.data.cases),
    hasDraft: slug => { const d = Drafts.read(); return !!(d.cases && slug in d.cases); },
    async addFile(path, rec) {
      await Files.put(path, rec);
      Files.urls[path] = `data:${rec.type};base64,${rec.base64}`;
      const d = Drafts.read(); d.files = d.files || {}; d.files[path] = { size: rec.size, type: rec.type, at: Date.now() };
      Drafts.write(d);
    },
    async discardCase(slug) {
      const d = Drafts.read();
      if (d.cases) delete d.cases[slug];
      for (const p of Object.keys(d.files || {})) if (p.startsWith(`assets/case/${slug}/`)) { delete d.files[p]; await Files.del(p).catch(() => {}); delete Files.urls[p]; }
      if (d.site && App.data.site) {
        // put this case study's card back the way it is live
        const live = (App.data.site.caseStudies || []).find(c => c.slug === slug);
        const list = d.site.caseStudies || [];
        const i = list.findIndex(c => c.slug === slug);
        if (live && i > -1) list[i] = clone(live); else if (!live && i > -1) list.splice(i, 1);
        if (same(d.site, App.data.site)) delete d.site;
      }
      Drafts.write(d);
    },
  };

  // ======================================================
  // The case study page file (work/<slug>.html)
  // ======================================================
  function pageHTML(c) {
    const t = esc(c.title || c.short || c.slug);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>document.documentElement.classList.add("js")</script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t} — Prayag Gangadharan</title>
  <meta name="description" content="Case study by Prayag Gangadharan: ${t}.">
  <meta name="theme-color" content="#0b0b0b">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Marcellus&display=swap">
  <link rel="stylesheet" href="../styles.css?v=8">
  <link rel="stylesheet" href="case.css?v=9">
</head>
<body>
  <a class="skip-link" href="#case">Skip to content</a>

  <header class="nav" id="top">
    <div class="nav__inner">
      <a class="nav__logo" href="../index.html" aria-label="Prayag Gangadharan, home">PG</a>
      <nav class="nav__links" aria-label="Primary">
        <a href="../index.html">Home</a>
        <a href="../index.html#works" class="is-active" aria-current="page">Works</a>
        <a href="../index.html#contact">Contact</a>
      </nav>
      <button class="nav__toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
        <img class="icon-open" src="../assets/icons/hamburger.svg" alt="" width="24" height="24">
        <img class="icon-close" src="../assets/icons/close.svg" alt="" width="24" height="24">
      </button>
    </div>
    <nav class="nav__menu" id="mobile-menu" aria-label="Mobile">
      <a href="../index.html">Home</a>
      <a href="../index.html#works">Works</a>
      <a href="../index.html#contact">Contact</a>
    </nav>
  </header>

  <!-- The page content is built from data/${c.slug}.js by case.js -->
  <main id="case"></main>

  <footer class="footer">
    <div class="footer__glow" aria-hidden="true"></div>
    <p class="footer__love">made with love by</p>
    <p class="footer__name">Prayag Gangadharan</p>
    <p class="footer__version">version 1.9</p>
  </footer>

  <script src="../script.js?v=7" defer></script>
  <script src="../content/site.js?v={{V}}" defer></script>
  <script src="data/${c.slug}.js?v={{V}}" defer></script>
  <script src="case.js?v=12" defer></script>
  <script src="../analytics.js?v=1" defer></script>
</body>
</html>
`;
  }

  // ======================================================
  // Chapter templates for new case studies / added chapters
  // ======================================================
  const TEMPLATES = {
    snapshot: () => ({ problem: '', did: '', outcome: '' }),
    context: () => ({ heading: '', body: [''], blocks: [] }),
    process: () => ({ heading: 'How the work moved', intro: '', steps: [{ name: 'Discover', items: [] }, { name: 'Define', items: [] }, { name: 'Design', items: [] }, { name: 'Deliver', items: [] }] }),
    research: () => ({ heading: 'Research & analysis', intro: '', blocks: [] }),
    problem: () => ({ statement: ['When', { role: 'who', text: 'who is affected' }, ',', { role: 'what', text: 'what goes wrong' }, ', so', { role: 'why', text: 'why it matters.' }] }),
    explorations: () => ({ name: 'Explorations', heading: '', intro: '', blocks: [] }),
    solution: () => ({ heading: '', intro: '', decisions: [{ title: '', body: '', file: '', callout: '' }] }),
    impact: () => ({ heading: 'Impact', intro: '', metrics: [{ value: '', label: '', trend: 'up' }], blocks: [] }),
    next: () => ({ takeaway: '', steps: [{ title: '', body: '' }] }),
    learnings: () => [''],
  };
  const BLOCK_TEMPLATES = {
    text: () => ({ type: 'text', body: '' }),
    image: () => ({ type: 'image', file: '', caption: '', ratio: '16 / 9' }),
    images: () => ({ type: 'images', title: '', items: [{ file: '', caption: '' }, { file: '', caption: '' }] }),
    list: () => ({ type: 'list', title: '', items: [] }),
    cards: () => ({ type: 'cards', title: '', numbered: false, items: [{ title: '', body: '' }] }),
    quotes: () => ({ type: 'quotes', title: '', items: [] }),
    funnel: () => ({ type: 'funnel', title: '', steps: [{ label: '', value: 100 }], note: '' }),
    bars: () => ({ type: 'bars', title: '', steps: [{ label: '', value: 0, display: '' }], note: '' }),
    table: () => ({ type: 'table', title: '', cols: ['Column 1', 'Column 2'], rows: [['', '']] }),
    persona: () => ({ type: 'persona', name: '', age: '', role: '', photo: '', bio: '', goals: [], motivations: [], frustrations: [] }),
    story: () => ({ type: 'story', title: '', items: [{ title: '', body: '' }] }),
  };
  const BLOCK_NAMES = { text: 'Paragraphs', image: 'Image', images: 'Two images', list: 'Bullet list', cards: 'Cards', quotes: 'Quotes', funnel: 'Funnel (%)', bars: 'Bar chart', table: 'Table', persona: 'Persona', story: 'Numbered story' };

  // ======================================================
  // Form schemas
  // f(type, key, label, extra)
  // ======================================================
  const f = (type, k, label, x = {}) => Object.assign({ type, k, label }, x);
  const MD = 'Wrap words in **double stars** for bold.';
  const caseImg = (k, label, x = {}) => f('image', k, label, Object.assign({ base: 'case' }, x));
  const BLOCK_SCHEMA = {
    text: [f('paras', 'body', 'Text', { hint: 'Leave an empty line between paragraphs. ' + MD })],
    image: [caseImg('file', 'Image'), f('text', 'caption', 'Caption'), f('select', 'ratio', 'Shape', { options: [['16 / 9', 'Wide 16:9'], ['4 / 3', 'Standard 4:3'], ['1 / 1', 'Square'], ['', 'Original']] })],
    images: [f('text', 'title', 'Title'), f('list', 'items', 'Images', { item: 'image', schema: [caseImg('file', 'Image'), f('text', 'caption', 'Caption')], make: () => ({ file: '', caption: '' }) }), f('text', 'note', 'Note underneath')],
    list: [f('text', 'title', 'Title'), f('lines', 'items', 'Points', { hint: 'One point per line. ' + MD })],
    cards: [f('text', 'title', 'Title'), f('bool', 'numbered', 'Number the cards'), f('list', 'items', 'Cards', { item: 'card', schema: [f('text', 'title', 'Card title'), f('area', 'body', 'Card text'), caseImg('logo', 'Logo (optional)', { folder: 'logos/' })], make: () => ({ title: '', body: '' }) })],
    quotes: [f('text', 'title', 'Title'), f('lines', 'items', 'Quotes', { hint: 'One quote per line. Wrap words in ==double equals== to highlight them.' })],
    funnel: [f('text', 'title', 'Title'), f('list', 'steps', 'Steps', { item: 'step', inline: true, schema: [f('text', 'label', 'Step'), f('number', 'value', '%')], make: () => ({ label: '', value: 0 }) }), f('text', 'note', 'Note underneath')],
    bars: [f('text', 'title', 'Title'), f('list', 'steps', 'Bars', { item: 'bar', inline: true, schema: [f('text', 'label', 'Label'), f('number', 'value', 'Value'), f('text', 'display', 'Shown as')], make: () => ({ label: '', value: 0, display: '' }) }), f('text', 'note', 'Note underneath')],
    table: [f('text', 'title', 'Title'), f('cells', 'cols', 'Column headings', { hint: 'Separate columns with |' }), f('rows', 'rows', 'Rows', { hint: 'One row per line, columns separated with |' })],
    persona: [f('text', 'name', 'Name', { half: true }), f('text', 'age', 'Age', { half: true }), f('text', 'role', 'Role'), caseImg('photo', 'Photo'), f('area', 'bio', 'Bio'), f('lines', 'goals', 'Goals & needs', { hint: 'One per line' }), f('lines', 'motivations', 'Motivations', { hint: 'One per line' }), f('lines', 'frustrations', 'Frustrations', { hint: 'One per line' })],
    story: [f('text', 'title', 'Title'), f('list', 'items', 'Steps', { item: 'step', schema: [f('text', 'title', 'Step title'), f('area', 'body', 'Step text')], make: () => ({ title: '', body: '' }) })],
  };

  const CHAPTERS = [
    { id: 'card', name: 'Card on home page', site: true, schema: [
      f('select', 'status', 'Status', { options: [['published', 'Published — on the site'], ['draft', 'Draft — hidden from the site']] }),
      f('select', 'showIn', 'Where the card appears', { options: [['works', 'Solved Problems'], ['ideas', 'Ideas I Couldn’t Ignore (add it in Articles & ideas)'], ['none', 'Nowhere — reachable by link only']] }),
      f('text', 'title', 'Title (used in “Keep reading”)'), f('text', 'client', 'Client', { half: true }), f('text', 'platform', 'Platform', { half: true }),
      f('text', 'cardText', 'Card description', { area: true }), f('cells', 'tags', 'Tags', { hint: 'Separate tags with |' }), f('text', 'date', 'Project date', { half: true, placeholder: 'Feb, 2025' }),
      f('text', 'logo', 'Logo file', { half: true, placeholder: 'assets/icons/sanas.svg', hint: 'Leave empty to show the client name instead.' }),
      f('image', 'thumb', 'Card image', { base: 'site', folder: 'assets/img/' }), f('text', 'thumbAlt', 'Card image description (for screen readers)'),
    ] },
    { id: 'basics', name: 'Page header', schema: [
      f('text', 'title', 'Page title'), f('text', 'short', 'Short name', { half: true, hint: 'Browser tab and breadcrumbs' }), f('text', 'eyebrow', 'Label above title', { half: true, placeholder: 'B2B SaaS · AI' }),
      f('area', 'summary', 'Summary'), f('text', 'client', 'Client', { half: true }),
      f('text', 'logo', 'Client logo path', { half: true, placeholder: '../assets/icons/sanas.svg', hint: 'Or upload one below.' }), caseImg('logoFile', 'Client logo upload', { folder: 'logos/' }),
      f('text', 'meta.role', 'Role', { half: true }), f('text', 'meta.platform', 'Platform', { half: true }), f('text', 'meta.timeline', 'Timeline', { half: true }),
      f('text', 'meta.teamLabel', '4th detail label', { half: true, placeholder: 'Team' }), f('text', 'meta.team', '4th detail', { half: true }),
      caseImg('cover', 'Cover image'),
      f('bool', 'confidential', 'Confidential (under NDA) — shows a locked page instead of chapters'),
      f('image', 'lockedBg', 'Locked page background', { base: 'site', folder: 'assets/img/', prefix: '../', showIf: c => c.confidential }),
    ] },
    { id: 'snapshot', name: 'Snapshot', schema: [f('text', 'heading', 'Heading', { placeholder: 'The project in thirty seconds' }), f('area', 'problem', 'Problem', { hint: MD }), f('area', 'did', 'What I did'), f('text', 'outcomeLabel', 'Third card label', { placeholder: 'Outcome' }), f('area', 'outcome', 'Outcome')] },
    { id: 'context', name: 'Context', schema: [f('text', 'heading', 'Heading'), f('paras', 'body', 'Text', { hint: 'Leave an empty line between paragraphs. ' + MD }), f('blocks', 'blocks', 'Content blocks')] },
    { id: 'process', name: 'Process', schema: [f('text', 'heading', 'Heading'), f('paras', 'intro', 'Intro'), f('list', 'steps', 'Phases', { item: 'phase', schema: [f('text', 'name', 'Phase', { half: true }), f('text', 'when', 'When (optional)', { half: true }), f('lines', 'items', 'Activities', { hint: 'One per line' })], make: () => ({ name: '', items: [] }) })] },
    { id: 'research', name: 'Research', schema: [f('text', 'heading', 'Heading'), f('paras', 'intro', 'Intro'), f('blocks', 'blocks', 'Content blocks')] },
    { id: 'problem', name: 'Problem', schema: [f('statement', 'statement', 'Problem statement')] },
    { id: 'explorations', name: 'Explorations', schema: [f('text', 'name', 'Chapter name', { placeholder: 'Explorations' }), f('text', 'heading', 'Heading'), f('paras', 'intro', 'Intro'), f('blocks', 'blocks', 'Content blocks')] },
    { id: 'solution', name: 'Solution', schema: [f('text', 'heading', 'Heading'), f('paras', 'intro', 'Intro'), f('list', 'decisions', 'Design decisions', { item: 'decision', hint: 'Shown as alternating rows: screenshot on one side, text on the other.', schema: [f('text', 'title', 'Title'), f('area', 'body', 'Explanation', { hint: MD }), caseImg('file', 'Screenshot'), f('text', 'callout', 'Annotation on the screenshot')], make: () => ({ title: '', body: '', file: '', callout: '' }) })] },
    { id: 'impact', name: 'Impact', schema: [f('bool', 'expected', 'Not shipped — show as “Expected impact”'), f('text', 'heading', 'Heading'), f('paras', 'intro', 'Intro'),
      f('list', 'metrics', 'Metrics', { item: 'metric', schema: [f('text', 'value', 'Number', { half: true, placeholder: '+65%' }), f('select', 'trend', 'Arrow', { half: true, options: [['up', '↗ Up'], ['down', '↘ Down'], ['', 'None']] }), f('text', 'label', 'What it measures'), f('text', 'sub', 'Detail (optional)', { placeholder: '275k → 454k' })], make: () => ({ value: '', label: '', trend: 'up' }) }),
      f('blocks', 'blocks', 'Content blocks'), f('text', 'summaryTitle', 'Summary title (optional)'), f('paras', 'summary', 'Summary (optional)')] },
    { id: 'next', name: 'What’s next', schema: [f('text', 'heading', 'Heading', { placeholder: 'Key takeaway & what’s next' }), f('area', 'takeaway', 'Key takeaway', { hint: MD }), f('text', 'stepsTitle', 'Steps title', { placeholder: 'What’s next' }), f('list', 'steps', 'Next steps', { item: 'step', schema: [f('text', 'title', 'Title'), f('area', 'body', 'Detail')], make: () => ({ title: '', body: '' }) })] },
    { id: 'learnings', name: 'Learnings', array: true, schema: [f('lines', '', 'Learnings', { hint: 'One per line. ' + MD })] },
  ];

  // ======================================================
  // Generic form engine
  // ======================================================
  const getAt = (o, path) => path === '' ? o : path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setAt(o, path, v) {
    const ks = path.split('.'); let a = o;
    ks.slice(0, -1).forEach((k, i) => { if (a[k] == null || typeof a[k] !== 'object') a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; });
    const last = ks[ks.length - 1];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length && !/blocks|items|steps|decisions|metrics/.test(last))) { if (Array.isArray(a)) a[last] = v === undefined ? '' : v; else delete a[last]; }
    else a[last] = v;
  }
  const join = p => p.filter(x => x !== '').join('.');
  const uid = () => 'f' + Math.random().toString(36).slice(2, 8);

  const Form = {
    // ctx: { root object, slug, onChange, rerender }
    render(schema, obj, base, ctx) {
      return schema.filter(s => !s.showIf || s.showIf(obj || {})).map(s => Form.field(s, obj, join([base, s.k]), ctx)).join('');
    },
    field(s, obj, path, ctx) {
      const v = s.k === '' ? obj : getAt(obj, s.k);
      const id = uid();
      const lab = `<label class="label" for="${id}">${esc(s.label)}</label>`;
      const hint = s.hint ? `<p class="hint">${esc(s.hint)}</p>` : '';
      const wrap = (inner, cls = '') => `<div class="field${s.half ? ' field--half' : ''}${cls}">${inner}</div>`;
      const ph = s.placeholder ? ` placeholder="${esc(s.placeholder)}"` : '';
      switch (s.type) {
        case 'text': return wrap(lab + (s.area
          ? `<textarea class="textarea" id="${id}" rows="3" data-path="${path}" data-kind="text"${ph}>${esc(v)}</textarea>`
          : `<input class="input" id="${id}" type="text" value="${esc(v)}" data-path="${path}" data-kind="text"${ph}>`) + hint);
        case 'number': return wrap(lab + `<input class="input" id="${id}" type="number" value="${esc(v)}" data-path="${path}" data-kind="number">` + hint);
        case 'area': return wrap(lab + `<textarea class="textarea" id="${id}" rows="3" data-path="${path}" data-kind="text"${ph}>${esc(v)}</textarea>` + hint);
        case 'paras': return wrap(lab + `<textarea class="textarea" id="${id}" rows="5" data-path="${path}" data-kind="paras">${esc((Array.isArray(v) ? v : v ? [v] : []).join('\n\n'))}</textarea>` + hint);
        case 'lines': return wrap(lab + `<textarea class="textarea" id="${id}" rows="${Math.max(3, Math.min(10, (v || []).length + 1))}" data-path="${path}" data-kind="lines">${esc((v || []).join('\n'))}</textarea>` + hint);
        case 'cells': return wrap(lab + `<input class="input" id="${id}" type="text" value="${esc((v || []).join(' | '))}" data-path="${path}" data-kind="cells">` + hint);
        case 'rows': return wrap(lab + `<textarea class="textarea mono" id="${id}" rows="${Math.max(3, (v || []).length + 1)}" data-path="${path}" data-kind="rows">${esc((v || []).map(r => r.join(' | ')).join('\n'))}</textarea>` + hint);
        case 'bool': return `<label class="check field"><input type="checkbox" data-path="${path}" data-kind="bool"${v ? ' checked' : ''}${s.k === 'confidential' ? ' data-rerender="1"' : ''}> ${esc(s.label)}</label>`;
        case 'select': return wrap(lab + `<select class="input" id="${id}" data-path="${path}" data-kind="text"${s.rerender ? ' data-rerender="1"' : ''}>${s.options.map(([val, t]) => `<option value="${esc(val)}"${(v || '') === val ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>` + hint);
        case 'image': return wrap(lab + Form.image(s, v, path, id, ctx) + hint);
        case 'list': return Form.list(s, v || [], path, ctx);
        case 'blocks': return Form.blocks(s, v || [], path, ctx);
        case 'statement': return Form.statement(s, v || [], path);
      }
      return '';
    },
    // Where an image lives in the repo
    imgRepoPath(s, v, ctx) {
      if (!v) return '';
      if (s.base === 'site') return (s.prefix ? v.replace(/^\.\.\//, '') : v);
      return `assets/case/${ctx.slug}/${s.folder || ''}${v}`;
    },
    image(s, v, path, id, ctx) {
      const rp = Form.imgRepoPath(s, v, ctx);
      return `<div class="imgfield">
        <span class="imgfield__pic">${rp ? `<img src="${esc(Files.src(rp))}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'imgfield__none',textContent:'Missing'}))">` : `<span class="imgfield__none">${ix('upload')}</span>`}</span>
        <span class="imgfield__body">
          <input class="input input--sm" id="${id}" type="text" value="${esc(v)}" data-path="${path}" data-kind="text" placeholder="${s.base === 'site' ? 'assets/img/file.webp' : 'file-name.png'}" aria-label="${esc(s.label)} file name">
          <span class="hint">${rp ? esc(rp) : 'No image yet'}</span>
        </span>
        <label class="btn btn--sm">${ix('upload')}Upload<input type="file" accept="${s.accept || 'image/*'}" hidden data-upload="${path}" data-base="${s.base}" data-folder="${esc(s.folder || '')}" data-prefix="${esc(s.prefix || '')}"></label>
      </div>`;
    },
    rowTools(path, i, n) {
      return `<span class="row-tools">
        <button type="button" class="icon-btn icon-btn--sm" data-act="move" data-path="${path}" data-i="${i}" data-dir="-1" aria-label="Move up"${i === 0 ? ' disabled' : ''}>${ix('up')}</button>
        <button type="button" class="icon-btn icon-btn--sm" data-act="move" data-path="${path}" data-i="${i}" data-dir="1" aria-label="Move down"${i === n - 1 ? ' disabled' : ''}>${ix('down')}</button>
        <button type="button" class="icon-btn icon-btn--sm icon-btn--danger" data-act="remove" data-path="${path}" data-i="${i}" aria-label="Remove">${ix('trash')}</button></span>`;
    },
    list(s, arr, path, ctx) {
      const n = arr.length;
      return `<div class="field"><span class="label">${esc(s.label)}</span>${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ''}
        <div class="rep">${arr.map((it, i) => `<div class="rep__item${s.inline ? ' rep__item--inline' : ''}">
          <div class="rep__head"><span class="rep__n">${s.item} ${i + 1}</span>${Form.rowTools(path, i, n)}</div>
          <div class="rep__body">${Form.render(s.schema, it, `${path}.${i}`, ctx)}</div></div>`).join('')}</div>
        <button type="button" class="btn btn--sm btn--add" data-act="add" data-path="${path}" data-make="${esc(JSON.stringify(s.make()))}">${ic('plus')}Add ${s.item}</button></div>`;
    },
    blocks(s, arr, path, ctx) {
      const n = arr.length;
      return `<div class="field"><span class="label">${esc(s.label)}</span>
        <div class="rep">${arr.map((b, i) => `<div class="rep__item rep__item--block">
          <div class="rep__head"><span class="rep__n">${esc(BLOCK_NAMES[b.type] || b.type)}</span>${Form.rowTools(path, i, n)}</div>
          <div class="rep__body">${BLOCK_SCHEMA[b.type] ? Form.render(BLOCK_SCHEMA[b.type], b, `${path}.${i}`, ctx) : `<p class="hint">This block type can’t be edited here.</p>`}</div></div>`).join('') || '<p class="hint">No blocks yet.</p>'}</div>
        <div class="addblock"><select class="input input--sm" data-blocktype aria-label="Block type">${Object.entries(BLOCK_NAMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <button type="button" class="btn btn--sm btn--add" data-act="addblock" data-path="${path}">${ic('plus')}Add block</button></div></div>`;
    },
    statement(s, arr, path) {
      const ROLES = [['', 'Plain text'], ['who', 'Who'], ['what', 'What'], ['how', 'How'], ['why', 'Why']];
      return `<div class="field"><span class="label">${esc(s.label)}</span>
        <p class="hint">Write the sentence in pieces. Pieces marked Who / What / How / Why get a Figma-style cursor on the page.</p>
        <div class="stmt">${arr.map((p, i) => {
          const role = typeof p === 'string' ? '' : p.role, text = typeof p === 'string' ? p : p.text;
          return `<div class="stmt__row"><select class="input input--sm stmt__role role-${role || 'plain'}" data-path="${path}.${i}" data-kind="role" aria-label="Piece ${i + 1} type">${ROLES.map(([v, t]) => `<option value="${v}"${v === role ? ' selected' : ''}>${t}</option>`).join('')}</select>
            <input class="input input--sm" type="text" value="${esc(text)}" data-path="${path}.${i}" data-kind="piece" aria-label="Piece ${i + 1} text">${Form.rowTools(path, i, arr.length)}</div>`;
        }).join('')}</div>
        <button type="button" class="btn btn--sm btn--add" data-act="add" data-path="${path}" data-make='""'>${ic('plus')}Add piece</button></div>`;
    },
    // Turn an input's text back into the stored value
    read(el, root) {
      const raw = el.type === 'checkbox' ? el.checked : el.value;
      switch (el.dataset.kind) {
        case 'number': return raw === '' ? '' : Number(raw);
        case 'bool': return raw ? true : undefined;
        case 'paras': { const p = raw.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean); return p.length > 1 ? p : (p[0] || ''); }
        case 'lines': return raw.split('\n').map(x => x.trim()).filter(Boolean);
        case 'cells': return raw.split('|').map(x => x.trim()).filter(Boolean);
        case 'rows': return raw.split('\n').filter(x => x.trim()).map(r => r.split('|').map(x => x.trim()));
        case 'piece': { const cur = getAt(root, el.dataset.path); return typeof cur === 'string' || cur == null ? raw : Object.assign({}, cur, { text: raw }); }
        case 'role': { const cur = getAt(root, el.dataset.path); const text = typeof cur === 'string' ? cur : (cur && cur.text) || ''; return raw ? { role: raw, text } : text; }
        default: return raw;
      }
    },
  };

  // ======================================================
  // Case studies list
  // ======================================================
  const List = {
    filter: 'all', q: '',
    render(main, parts) {
      if (parts[1] === 'new') return NewCase.render(main);
      if (parts[1] === 'edit' && parts[2]) return Editor.render(main, decodeURIComponent(parts[2]), parts[3]);
      const site = Store.site();
      const list = site.caseStudies || [];
      const orderChanged = !same(list.map(c => c.slug), (App.data.site.caseStudies || []).map(c => c.slug));
      main.innerHTML = App.topbar('Content', 'Case studies', `<a class="btn btn--primary" href="#/case-studies/new">${ic('plus')}New case study</a>`) + `
      <div class="content">
        <div class="toolbar">
          <div class="search">${ix('search')}<input class="input" type="search" id="q" placeholder="Search case studies" value="${esc(List.q)}" aria-label="Search case studies"></div>
          <div class="filters" role="group" aria-label="Filter">${[['all', 'All'], ['published', 'Published'], ['draft', 'Drafts'], ['conf', 'Confidential']].map(([k, t]) =>
            `<button type="button" class="filter${List.filter === k ? ' is-on' : ''}" data-filter="${k}" aria-pressed="${List.filter === k}">${t}</button>`).join('')}</div>
          <span class="muted toolbar__tip">Drag to reorder — same order as on your home page${orderChanged ? ' · <b style="color:var(--accent);font-weight:400">order changed</b>' : ''}</span>
        </div>
        <div class="table-card" id="rows"></div>
        <p class="hint">Kiwi and Figma Auto Layout are external articles — edit them under <a href="#/ideas" style="color:var(--accent)">Articles &amp; ideas</a>.</p>
      </div>`;
      List.rows();
      $('#q').oninput = e => { List.q = e.target.value; List.rows(); };
      main.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { List.filter = b.dataset.filter; List.render(main, parts); });
    },
    rows() {
      const site = Store.site();
      const list = site.caseStudies || [];
      const d = Drafts.read();
      const q = List.q.trim().toLowerCase();
      const conf = c => { const cs = Store.caseOf(c.slug); return !!(cs && cs.confidential); };
      const shown = list.filter(c => (!q || (c.title + ' ' + c.client + ' ' + c.slug).toLowerCase().includes(q)) &&
        (List.filter === 'all' || (List.filter === 'conf' ? conf(c) : c.status === List.filter)));
      const el = $('#rows');
      const drag = List.filter === 'all' && !q;
      el.innerHTML = `<div class="trow trow--head"><span></span><span></span><span class="label">Case study</span><span class="label">Status</span><span class="label">Where</span><span></span></div>` +
        (shown.map(c => {
          const idx = list.indexOf(c);
          const edited = d.cases && c.slug in d.cases;
          const status = c.status === 'published' ? (conf(c) ? '<span class="badge badge--conf">Confidential</span>' : '<span class="badge badge--pub">Published</span>') : '<span class="badge badge--draft">Draft</span>';
          return `<div class="trow" data-slug="${esc(c.slug)}" data-i="${idx}"${drag ? ' draggable="true"' : ''}>
            <span class="grip" ${drag ? '' : 'style="opacity:.2"'} aria-hidden="true">${ix('grip')}</span>
            <span class="thumb">${c.thumb ? `<img src="${esc(Files.src(c.thumb))}" alt="" loading="lazy">` : ''}</span>
            <a class="trow__title" href="#/case-studies/edit/${encodeURIComponent(c.slug)}"><b>${esc(c.title || c.slug)}</b><small>/work/${esc(c.slug)}.html · ${esc(c.client || '')}${c.date ? ' · ' + esc(c.date) : ''}${edited ? ' · <span style="color:var(--accent)">unpublished edits</span>' : ''}${Store.isNew(c.slug) ? ' · <span style="color:var(--accent)">new</span>' : ''}</small></a>
            <span>${status}</span>
            <span class="muted" style="font-size:13px">${c.showIn === 'ideas' ? 'Ideas' : c.showIn === 'none' ? 'Link only' : 'Solved Problems'}</span>
            <span class="trow__acts">
              <button type="button" class="icon-btn" data-move="-1" aria-label="Move ${esc(c.title)} up"${idx === 0 ? ' disabled' : ''}>${ix('up')}</button>
              <button type="button" class="icon-btn" data-move="1" aria-label="Move ${esc(c.title)} down"${idx === list.length - 1 ? ' disabled' : ''}>${ix('down')}</button>
              <a class="icon-btn" href="${PREVIEW ? '../work/' + esc(c.slug) + '.html' : esc(CFG.siteUrl) + '/work/' + esc(c.slug) + '.html'}" target="_blank" rel="noopener" aria-label="View ${esc(c.title)} live">${ic('eye')}</a>
              <a class="icon-btn" href="#/case-studies/edit/${encodeURIComponent(c.slug)}" aria-label="Edit ${esc(c.title)}">${ix('edit')}</a>
              <button type="button" class="icon-btn icon-btn--danger" data-remove aria-label="Remove ${esc(c.title)}">${ix('trash')}</button>
            </span></div>`;
        }).join('') || `<p class="empty" style="padding:24px">No case studies match.</p>`);
      // Reorder
      const move = (from, to) => {
        const s = Store.site(); const arr = s.caseStudies;
        if (to < 0 || to >= arr.length || from === to) return;
        arr.splice(to, 0, arr.splice(from, 1)[0]); Store.saveSite(s); List.rows(); App.refreshChrome();
        const t = $('.toolbar__tip'); if (t) t.innerHTML = 'Drag to reorder — same order as on your home page · <b style="color:var(--accent);font-weight:400">order changed</b>';
      };
      el.querySelectorAll('[data-move]').forEach(b => b.onclick = () => { const r = b.closest('.trow'); move(+r.dataset.i, +r.dataset.i + +b.dataset.move); });
      el.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => Remove.open(b.closest('.trow').dataset.slug));
      let dragI = null;
      el.querySelectorAll('.trow[draggable]').forEach(r => {
        r.addEventListener('dragstart', e => { dragI = +r.dataset.i; r.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.dataset.slug); });
        r.addEventListener('dragend', () => { r.classList.remove('is-drag'); el.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over')); });
        r.addEventListener('dragover', e => { e.preventDefault(); el.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over')); r.classList.add('is-over'); });
        r.addEventListener('drop', e => { e.preventDefault(); if (dragI !== null) move(dragI, +r.dataset.i); dragI = null; });
      });
    },
  };

  // ======================================================
  // New case study
  // ======================================================
  const NewCase = {
    render(main) {
      main.innerHTML = App.topbar('<a href="#/case-studies" class="crumb">Case studies</a> / New', 'New case study') + `
      <div class="content"><form class="card form-narrow" id="newcase" novalidate>
        <div class="field"><label class="label" for="nc-title">Title</label><input class="input" id="nc-title" required placeholder="Reducing activation drop-offs in a B2B AI product"></div>
        <div class="grid2f">
          <div class="field"><label class="label" for="nc-client">Client</label><input class="input" id="nc-client" placeholder="Sanas"></div>
          <div class="field"><label class="label" for="nc-date">Project date</label><input class="input" id="nc-date" placeholder="Feb, 2025"></div>
        </div>
        <div class="field"><label class="label" for="nc-slug">Page address</label><div class="slug"><span>/work/</span><input class="input" id="nc-slug" placeholder="client-project" spellcheck="false"><span>.html</span></div><p class="hint">Can’t be changed after publishing.</p></div>
        <fieldset class="field"><legend class="label">Start with</legend>
          <label class="check"><input type="radio" name="kind" value="full" checked> All chapters (Snapshot → What’s next)</label>
          <label class="check"><input type="radio" name="kind" value="conf"> Confidential — a locked page, no chapters</label>
        </fieldset>
        <p class="error" id="nc-err" hidden></p>
        <div class="row-end"><a class="btn" href="#/case-studies">Cancel</a><button class="btn btn--primary" type="submit">Create draft</button></div>
      </form></div>`;
      const title = $('#nc-title'), slug = $('#nc-slug'); let touched = false;
      title.focus();
      title.oninput = () => { if (!touched) slug.value = slugify((($('#nc-client').value || '') + ' ' + title.value).trim()); };
      $('#nc-client').oninput = title.oninput;
      slug.oninput = () => { touched = true; slug.value = slugify(slug.value).replace(/-$/, '') + (slug.value.endsWith('-') ? '-' : ''); };
      $('#newcase').onsubmit = e => {
        e.preventDefault();
        const err = $('#nc-err'), s = slugify(slug.value), t = title.value.trim(), client = $('#nc-client').value.trim();
        const site = Store.site();
        const fail = m => { err.hidden = false; err.textContent = m; };
        if (!t) return fail('Give the case study a title.');
        if (!s) return fail('Add a page address.');
        if ((site.caseStudies || []).some(c => c.slug === s) || s in App.data.cases) return fail('There’s already a case study at /work/' + s + '.html.');
        const conf = e.target.kind.value === 'conf';
        const c = { slug: s, short: t, client, eyebrow: '', title: t, summary: '', meta: { role: 'UX Designer', platform: '', timeline: $('#nc-date').value.trim(), teamLabel: 'Team', team: '' } };
        if (conf) Object.assign(c, { confidential: true }); else { c.cover = ''; ['snapshot', 'context', 'process', 'research', 'problem', 'explorations', 'solution', 'impact', 'next'].forEach(k => { c[k] = TEMPLATES[k](); }); }
        site.caseStudies = site.caseStudies || [];
        site.caseStudies.push({ slug: s, status: 'draft', showIn: 'works', title: t, client, platform: '', logo: '', cardText: '', tags: [], date: $('#nc-date').value.trim(), thumb: '', thumbAlt: '' });
        Store.saveSite(site); Store.saveCase(s, c);
        toast('Draft created — it stays hidden until you publish it as Published');
        location.hash = '#/case-studies/edit/' + s + '/basics';
      };
    },
  };

  // ======================================================
  // Editor
  // ======================================================
  const Editor = {
    slug: null, data: null, card: null, ch: 'basics', device: 'desktop', frameReady: false,
    render(main, slug, ch) {
      const c = Store.caseOf(slug);
      const site = Store.site();
      const card = (site.caseStudies || []).find(x => x.slug === slug);
      if (!c || !card) { main.innerHTML = App.topbar('Case studies', 'Not found') + `<div class="content"><div class="card soon"><h2>That case study doesn’t exist.</h2><a class="btn" href="#/case-studies">Back to case studies</a></div></div>`; return; }
      Editor.slug = slug; Editor.data = c; Editor.card = card; Editor.ch = ch || Editor.ch || 'basics';
      if (!CHAPTERS.find(x => x.id === Editor.ch)) Editor.ch = 'basics';
      const edited = Store.hasDraft(slug);
      main.innerHTML = App.topbar(`<a href="#/case-studies" class="crumb">Case studies</a> / ${esc(card.title || slug)}`, 'Edit case study',
        `<span class="saved" id="saved">${edited ? 'Saved in this browser' : 'Edits save automatically'}</span>
         ${edited ? `<button type="button" class="btn" id="discard">${ix('undo')}Discard changes</button>` : ''}
         <a class="btn btn--primary" href="#/publish">${ix('upload')}Review &amp; publish</a>`) + `
      <div class="editor" id="editor">
        <nav class="chapters" aria-label="Chapters"><span class="label">Page</span>
          ${CHAPTERS.slice(0, 2).map(Editor.tab).join('')}
          <span class="label" style="margin-top:14px">Chapters</span>
          ${c.confidential ? '<p class="hint" style="padding:6px 12px">Confidential pages show no chapters.</p>' : CHAPTERS.slice(2).map(Editor.tab).join('')}
        </nav>
        <form class="eform" id="eform" novalidate autocomplete="off"></form>
        <aside class="preview" aria-label="Live preview">
          <div class="preview__bar"><span class="dots"><i></i><i></i></span><span class="muted">Live preview · /work/${esc(slug)}</span>
            <span class="seg" role="group" aria-label="Preview size"><button type="button" data-dev="desktop" aria-pressed="${Editor.device === 'desktop'}" aria-label="Desktop">${ix('desktop')}</button><button type="button" data-dev="mobile" aria-pressed="${Editor.device === 'mobile'}" aria-label="Mobile">${ix('phone')}</button></span></div>
          <div class="preview__stage" id="stage"><iframe id="frame" title="Preview of the case study page" src="../work/preview.html?v=1"></iframe></div>
        </aside>
      </div>`;
      Editor.form();
      Editor.bind(main);
      Editor.frame();
    },
    tab(t) {
      const c = Editor.data;
      const on = t.id === Editor.ch;
      const present = t.id === 'card' || t.id === 'basics' || (t.id in c);
      return `<a class="chap${on ? ' is-on' : ''}" href="#/case-studies/edit/${encodeURIComponent(Editor.slug)}/${t.id}"${on ? ' aria-current="page"' : ''}>
        <span>${esc(t.id === 'explorations' && c.explorations && c.explorations.name ? c.explorations.name : t.name)}</span><i class="pip${present ? ' on' : ''}" title="${present ? 'On the page' : 'Not on the page'}"></i></a>`;
    },
    ctx() { return { slug: Editor.slug }; },
    form() {
      const t = CHAPTERS.find(x => x.id === Editor.ch);
      const c = Editor.data, el = $('#eform');
      const n = CHAPTERS.indexOf(t) - 1;
      const title = `<div class="eform__head"><h2>${n > 0 ? String(n).padStart(2, '0') + ' · ' : ''}${esc(t.name)}</h2>`;
      if (t.site) {
        el.innerHTML = title + `</div><p class="hint">How this case study appears on your home page.</p><div class="fgrid">${Form.render(t.schema, Editor.card, '', Editor.ctx())}</div>`;
      } else if (t.id === 'basics') {
        el.innerHTML = title + `</div><div class="fgrid">${Form.render(t.schema, c, '', Editor.ctx())}</div>`;
      } else if (!(t.id in c)) {
        el.innerHTML = title + `</div><div class="card soon" style="padding:28px"><p>This chapter isn’t on the page.</p><button type="button" class="btn btn--primary" data-act="addchapter">${ic('plus')}Add ${esc(t.name)}</button></div>`;
      } else {
        el.innerHTML = title + `<label class="check"><input type="checkbox" checked data-act="dropchapter"> Show this chapter</label></div>
          <div class="fgrid">${t.array ? Form.render(t.schema, c[t.id], '', Editor.ctx()).replace(/data-path=""/g, `data-path="${t.id}"`) : Form.render(t.schema, c[t.id], t.id, Editor.ctx())}</div>`;
      }
    },
    target(path) { return CHAPTERS.find(x => x.id === Editor.ch).site ? Editor.card : Editor.data; },
    save: debounce(() => {
      const site = Store.site();
      const i = (site.caseStudies || []).findIndex(x => x.slug === Editor.slug);
      if (i > -1) site.caseStudies[i] = Editor.card;
      Store.saveSite(site);
      Store.saveCase(Editor.slug, Editor.data);
      const s = $('#saved'); if (s) { s.textContent = 'Saved in this browser'; s.classList.add('is-flash'); setTimeout(() => s.classList.remove('is-flash'), 600); }
      if (!$('#discard') && $('.topbar__actions')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'discard'; b.innerHTML = ix('undo') + 'Discard changes';
        $('#saved').after(b); b.onclick = Editor.discard;
      }
      Editor.push();
    }, 350),
    discard() {
      if (!confirm('Discard all unpublished changes to this case study?')) return;
      Store.discardCase(Editor.slug).then(() => { toast('Changes discarded'); if (Store.isNew(Editor.slug)) location.hash = '#/case-studies'; else App.route(); });
    },
    bind(main) {
      const form = $('#eform');
      const onInput = e => {
        const el = e.target; if (!el.dataset.path || !el.dataset.kind) return;
        const obj = Editor.target();
        const v = Form.read(el, obj);
        setAt(obj, el.dataset.path, v);
        if (el.dataset.kind === 'role') { el.className = el.className.replace(/role-\w+/, 'role-' + (el.value || 'plain')); }
        if (el.dataset.rerender) Editor.form();
        if (el.dataset.path === 'explorations.name') { const tab = $('.chapters a.is-on span'); if (tab) tab.textContent = el.value || 'Explorations'; }
        Editor.save();
      };
      form.addEventListener('input', onInput);
      form.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onInput(e); });
      form.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const obj = Editor.target(), act = b.dataset.act;
        if (act === 'dropchapter') {
          if (!confirm('Remove this chapter from the page? You can add it back, but its text will be cleared.')) { b.checked = true; return; }
          delete obj[Editor.ch]; Editor.after(); return;
        }
        if (act === 'addchapter') { obj[Editor.ch] = TEMPLATES[Editor.ch](); Editor.after(); return; }
        const path = b.dataset.path;
        let arr = getAt(obj, path);
        if (!Array.isArray(arr)) { arr = []; setAt(obj, path, arr); arr = getAt(obj, path) || arr; }
        const i = +b.dataset.i;
        if (act === 'add') arr.push(JSON.parse(b.dataset.make));
        if (act === 'addblock') arr.push(BLOCK_TEMPLATES[b.previousElementSibling.value]());
        if (act === 'remove') { if (typeof arr[i] === 'object' && arr[i] && JSON.stringify(arr[i]).length > 60 && !confirm('Remove this item?')) return; arr.splice(i, 1); }
        if (act === 'move') { const j = i + +b.dataset.dir; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); }
        Editor.after(act === 'add' || act === 'addblock');
      });
      form.addEventListener('change', async e => {
        const inp = e.target; if (!inp.dataset.upload || !inp.files[0]) return;
        const file = inp.files[0];
        if (!file.type.startsWith('image/')) return toast('Choose an image file');
        const lab = inp.closest('label'); lab.classList.add('is-busy');
        try {
          const rec = await prepareImage(file);
          const field = inp.dataset.upload.split('.').pop();
          const baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || field;
          const name = `${baseName}.${rec.ext}`;
          let repo, value;
          if (inp.dataset.base === 'site') { repo = `${inp.dataset.folder}${name}`; value = (inp.dataset.prefix || '') + repo; }
          else { repo = `assets/case/${Editor.slug}/${inp.dataset.folder}${name}`; value = name; }
          await Store.addFile(repo, rec);
          setAt(Editor.target(), inp.dataset.upload, value);
          Editor.after(); toast(`Added ${name} (${Math.round(rec.size / 1024)} KB)`);
        } catch (ex) { toast('Couldn’t read that image'); console.error(ex); }
        finally { lab.classList.remove('is-busy'); }
      });
      const d = $('#discard'); if (d) d.onclick = Editor.discard;
      main.querySelectorAll('[data-dev]').forEach(b => b.onclick = () => { Editor.device = b.dataset.dev; main.querySelectorAll('[data-dev]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); Editor.fit(); });
    },
    after(focusLast) {
      const y = window.scrollY;
      Editor.form(); Editor.save();
      const nav = $('.chapters'); if (nav) nav.querySelectorAll('.chap').forEach((a, i) => { const t = CHAPTERS[i]; if (t) a.querySelector('.pip').classList.toggle('on', t.id === 'card' || t.id === 'basics' || t.id in Editor.data); });
      window.scrollTo(0, y);
      if (focusLast) { const items = document.querySelectorAll('#eform .rep__item'); const last = items[items.length - 1]; if (last) { const inp = last.querySelector('input,textarea,select'); if (inp) inp.focus(); } }
    },
    // ----- Live preview -----
    frame() {
      const fr = $('#frame'); Editor.frameReady = false;
      window.onmessage = e => { if (e.source === fr.contentWindow && e.data && e.data.type === 'pg-preview-ready' && e.data.first) { Editor.frameReady = true; Editor.push(true); } };
      new ResizeObserver(Editor.fit).observe($('#stage'));
      Editor.fit();
    },
    fit() {
      const st = $('#stage'), fr = $('#frame'); if (!st || !fr) return;
      const w = Editor.device === 'mobile' ? 390 : 1280;
      const scale = Math.min(1, st.clientWidth / w);
      fr.style.width = w + 'px'; fr.style.height = (st.clientHeight / scale) + 'px';
      fr.style.transform = `scale(${scale})`;
      st.classList.toggle('is-mobile', Editor.device === 'mobile');
    },
    async push(scroll) {
      const fr = $('#frame'); if (!fr || !Editor.frameReady) return;
      await Files.loadUrls();
      const site = Store.site();
      (site.caseStudies || []).forEach(p => { if (p.thumb && Files.urls[p.thumb]) p.thumb = Files.urls[p.thumb]; });
      const map = {}; Object.keys(Files.urls).forEach(k => { map[k] = Files.urls[k]; });
      const ch = CHAPTERS.find(x => x.id === Editor.ch);
      fr.contentWindow.postMessage({ type: 'pg-preview', case: Editor.data, site, files: map, scrollTo: scroll && ch && !ch.site && ch.id !== 'basics' ? Editor.ch : null }, '*');
    },
  };

  // ======================================================
  // Remove (hide or delete)
  // ======================================================
  const Remove = {
    open(slug) {
      const site = Store.site();
      const c = (site.caseStudies || []).find(x => x.slug === slug); if (!c) return;
      const word = slug.split('-')[0];
      const isNew = Store.isNew(slug);
      const wrap = document.createElement('div');
      wrap.className = 'modal'; wrap.innerHTML = `
        <div class="modal__box modal__box--danger" role="alertdialog" aria-modal="true" aria-labelledby="rm-t" aria-describedby="rm-d">
          <span class="modal__ic">${ic('warn')}</span>
          <h2 id="rm-t">Remove “${esc(c.title || slug)}”?</h2>
          <p id="rm-d" class="muted">${isNew ? 'This case study hasn’t been published yet. Removing it throws away the draft.' : 'Its page, its card on the home page and its images come off your site when you next publish.'}</p>
          ${isNew ? '' : `<div class="choice">
            <label class="check"><input type="radio" name="how" value="hide" checked> Hide it — keep as a draft, bring it back any time</label>
            <label class="check"><input type="radio" name="how" value="delete"> Delete it — remove the page and its images</label></div>`}
          <div class="field"><label class="label" for="rm-w">Type <span style="color:var(--text)">${esc(word)}</span> to confirm</label><input class="input" id="rm-w" autocomplete="off" spellcheck="false"></div>
          <div class="row-end"><button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn--danger" id="rm-go" disabled>${ix('trash')}Remove</button></div>
          <p class="hint">Removed by mistake? Every publish can be undone from Publish history.</p>
        </div>`;
      document.body.appendChild(wrap);
      const prev = document.activeElement;
      const close = () => { wrap.remove(); if (prev) prev.focus(); };
      const inp = $('#rm-w', wrap), go = $('#rm-go', wrap);
      inp.focus();
      inp.oninput = () => { go.disabled = inp.value.trim().toLowerCase() !== word.toLowerCase(); };
      wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
      wrap.addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.key === 'Enter' && !go.disabled) go.click(); });
      go.onclick = async () => {
        const how = isNew ? 'delete' : wrap.querySelector('input[name=how]:checked').value;
        const s = Store.site();
        if (how === 'hide') {
          s.caseStudies.find(x => x.slug === slug).status = 'draft';
          Store.saveSite(s); toast('Hidden — publish to take it off the site');
        } else {
          s.caseStudies = s.caseStudies.filter(x => x.slug !== slug);
          (s.ideas && s.ideas.items) && (s.ideas.items = s.ideas.items.filter(x => !(x.type === 'case' && x.slug === slug)));
          Store.saveSite(s);
          if (isNew) await Store.discardCase(slug); else Store.saveCase(slug, null);
          toast(isNew ? 'Draft removed' : 'Marked for deletion — publish to remove it');
        }
        close(); App.route();
      };
    },
  };

  // ======================================================
  // Review & publish
  // ======================================================
  const Publish = {
    async changes() {
      const d = Drafts.read();
      const out = [];
      const v = Date.now().toString(36);
      if (d.site) {
        out.push({ path: 'content/site.js', text: Content.siteFile(d.site), note: Publish.siteNote(App.data.site, d.site), kind: 'M' });
      }
      for (const slug of Object.keys(d.cases || {})) {
        const c = d.cases[slug];
        if (c === null) {
          out.push({ path: `work/${slug}.html`, remove: true, note: 'Case study page', kind: 'D' });
          out.push({ path: `work/data/${slug}.js`, remove: true, note: 'Case study content', kind: 'D' });
          out.push({ assetsOf: slug, note: `Images in assets/case/${slug}/`, kind: 'D', path: `assets/case/${slug}/…` });
        } else {
          const isNew = Store.isNew(slug);
          out.push({ path: `work/data/${slug}.js`, text: Content.caseFile(c), note: isNew ? 'New case study content' : Publish.caseNote(App.data.cases[slug], c), kind: isNew ? 'A' : 'M' });
          out.push({ path: `work/${slug}.html`, text: pageHTML(c).replace(/\{\{V\}\}/g, v), note: isNew ? 'New page' : 'Page refreshed so visitors get the new version', kind: isNew ? 'A' : 'M', quiet: !isNew });
        }
      }
      for (const p of d.removed || []) out.push({ path: p, remove: true, note: 'Deleted file', kind: 'D' });
      for (const p of Object.keys(d.files || {})) out.push({ path: p, file: true, note: `Image · ${Math.round(d.files[p].size / 1024)} KB`, kind: 'A' });
      if (d.site) out.push({ path: 'index.html', bump: v, note: 'Home page refreshed so visitors get the new version', kind: 'M', quiet: true });
      return out;
    },
    siteNote(a, b) {
      const parts = [];
      const keys = { hero: 'hero & about', experience: 'experience', ideas: 'articles & ideas', contact: 'contact links', footer: 'footer', meta: 'page info', works: 'section titles' };
      Object.keys(keys).forEach(k => { if (!same(a[k], b[k])) parts.push(keys[k]); });
      const ac = a.caseStudies || [], bc = b.caseStudies || [];
      const added = bc.filter(x => !ac.some(y => y.slug === x.slug)).map(x => 'added ' + (x.title || x.slug));
      const gone = ac.filter(x => !bc.some(y => y.slug === x.slug)).map(x => 'removed ' + (x.title || x.slug));
      parts.push(...added, ...gone);
      const keep = s => s.filter(x => ac.some(y => y.slug === x) && bc.some(y => y.slug === x));
      if (!same(keep(ac.map(x => x.slug)), keep(bc.map(x => x.slug)))) parts.push('case study order');
      const changed = bc.filter(x => { const o = ac.find(y => y.slug === x.slug); return o && !same(o, x); }).map(x => x.status !== (ac.find(y => y.slug === x.slug) || {}).status ? `${x.title}: ${x.status}` : `${x.title} card`);
      return (parts.concat(changed).join(', ') || 'Site content') .replace(/^./, m => m.toUpperCase());
    },
    caseNote(a, b) {
      const names = Object.fromEntries(CHAPTERS.map(c => [c.id, c.name]));
      const ch = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].filter(k => !same((a || {})[k], (b || {})[k]));
      const basics = ch.filter(k => !names[k] || k === 'learnings' && false);
      const named = ch.filter(k => names[k]).map(k => (k in b ? '' : 'removed ') + names[k]);
      return [basics.length ? 'Page header' : '', ...named].filter(Boolean).join(', ') || 'Content';
    },
    async render(main) {
      const list = await Publish.changes();
      const d = Drafts.read();
      const nice = { A: 'Add', M: 'Edit', D: 'Remove' };
      main.innerHTML = App.topbar('Publish', list.length ? 'Review &amp; publish' : 'Nothing to publish').replace(/<a class="pending"[^>]*>.*?<\/a>/, '') + `
      <div class="content">
        ${list.length ? `<div class="pub">
          <div class="card pub__main">
            <span class="label">What will change on your site · ${list.filter(x => !x.quiet).length} file${list.filter(x => !x.quiet).length > 1 ? 's' : ''}</span>
            <div class="changes">${list.filter(x => !x.quiet).map(x => `<div class="chg"><span class="chg__k chg__k--${x.kind}" title="${nice[x.kind]}">${x.kind}</span><span><code>${esc(x.path)}</code><small>${esc(x.note)}</small></span></div>`).join('')}</div>
            <div class="field"><label class="label" for="msg">Note for this change</label><input class="input" id="msg" value="${esc(Publish.defaultMsg(list))}"><p class="hint">Saved in your publish history.</p></div>
            ${PREVIEW && !App.signedIn() ? `<div class="banner banner--info">${ic('info')}<span>Preview mode — publishing turns on once the site is on GitHub and you sign in there. Your changes are kept in this browser.</span></div>` : ''}
            <p class="error" id="pub-err" hidden></p>
            <div class="row-end"><button type="button" class="btn" id="throw">${ix('undo')}Discard all</button><button type="button" class="btn btn--primary" id="go"${PREVIEW && !App.signedIn() ? ' disabled' : ''}>${ix('upload')}Publish now</button></div>
          </div>
          <div class="card pub__side" id="steps"><span class="label">After you press Publish</span>
            ${Publish.steps(0)}
            <p class="hint">Takes about a minute. You can keep editing while it goes live. Every publish can be undone from Publish history.</p></div>
        </div>` : `<div class="card soon"><h2>Everything is live</h2><p>Make a change anywhere in the admin and it will show up here to review before it goes on your site.</p><a class="btn" href="#/dashboard">Back to dashboard</a></div>`}
      </div>`;
      if (!list.length) return;
      $('#throw').onclick = async () => {
        if (!confirm('Throw away all unpublished changes?')) return;
        await Files.clear().catch(() => {}); Files.urls = {}; Drafts.clear(); toast('All changes discarded'); location.hash = '#/dashboard';
      };
      $('#go').onclick = () => Publish.run(list);
    },
    defaultMsg(list) {
      const top = list.filter(x => !x.quiet && !x.file);
      return top.length === 1 ? top[0].note.slice(0, 70) : `Update portfolio (${list.filter(x => !x.quiet).length} changes)`;
    },
    steps(n, extra = '') {
      const s = [['Saving to GitHub', ''], ['GitHub Pages is building', 'about 1 min'], ['Live on ' + CFG.siteUrl.replace(/^https?:\/\//, ''), '']];
      return s.map(([t, r], i) => `<div class="pstep ${i < n ? 'is-done' : i === n && n > 0 ? 'is-now' : ''}"><span class="pstep__dot">${i < n ? ic('check') : i === n && n > 0 ? '<span class="spinner"></span>' : ''}</span><span>${esc(t)}</span>${i === n && r ? `<small>${r}</small>` : ''}</div>`).join('') + extra;
    },
    async run(list) {
      const go = $('#go'), err = $('#pub-err'), msg = ($('#msg').value || 'Update portfolio').trim();
      go.disabled = true; $('#throw').disabled = true; go.innerHTML = '<span class="spinner"></span> Publishing…'; err.hidden = true;
      const steps = $('#steps'); const setStep = n => { steps.innerHTML = '<span class="label">Publishing</span>' + Publish.steps(n); };
      setStep(0); steps.querySelector('.pstep').classList.add('is-now');
      try {
        const files = [];
        for (const x of list) {
          if (x.remove) files.push({ path: x.path, remove: true });
          else if (x.assetsOf) {
            const tree = await GH.req(GH.repo(`/git/trees/${CFG.branch}?recursive=1`));
            const sf = CFG.siteFolder ? CFG.siteFolder.replace(/\/+$/, '') + '/' : '';
            tree.tree.filter(t => t.type === 'blob' && t.path.startsWith(sf + `assets/case/${x.assetsOf}/`)).forEach(t => files.push({ path: t.path.slice(sf.length), remove: true }));
          } else if (x.file) { const r = await Files.get(x.path); if (r) files.push({ path: x.path, base64: r.base64 }); }
          else if (x.bump) { const cur = await GH.getText('index.html'); files.push({ path: 'index.html', text: cur.text.replace(/content\/site\.js\?v=[\w-]+/, 'content/site.js?v=' + x.bump) }); }
          else files.push({ path: x.path, text: x.text });
        }
        const commit = await GH.commit(files, msg + '\n\nPublished from /admin');
        await Files.clear().catch(() => {}); Files.urls = {}; Drafts.clear();
        App.data = await Content.load();
        setStep(1); toast('Saved to GitHub');
        go.innerHTML = ic('check') + 'Published';
        document.querySelectorAll('.pending').forEach(x => x.remove()); App.refreshChrome();
        Publish.watch(commit.sha, Date.now());
      } catch (e) {
        err.hidden = false; err.textContent = 'Couldn’t publish: ' + e.message + (e.status === 403 || e.status === 404 ? ' — check your token has “Contents: Read and write” on this repo.' : '');
        go.disabled = false; $('#throw').disabled = false; go.innerHTML = ix('upload') + 'Try again';
        steps.innerHTML = '<span class="label">After you press Publish</span>' + Publish.steps(0);
      }
    },
    async watch(sha, t0) {
      const steps = $('#steps'); if (!steps) return;
      try {
        const b = await GH.req(GH.repo('/pages/builds/latest'));
        if (b.commit === sha && b.status === 'built') {
          steps.innerHTML = '<span class="label">Done</span>' + Publish.steps(3, `<p class="hint">Your changes are live. <a href="${esc(CFG.siteUrl)}" target="_blank" rel="noopener" style="color:var(--accent)">Open the site</a> — if you still see the old version, refresh once.</p><a class="btn" href="#/dashboard">Back to dashboard</a>`);
          return;
        }
        if (b.commit === sha && b.status === 'errored') { steps.innerHTML = `<span class="label">Something went wrong</span><div class="banner banner--bad">${ic('warn')}<span>GitHub couldn’t build the site. Your change is saved — see <a href="https://github.com/${esc(CFG.owner)}/${esc(CFG.repo)}/actions" target="_blank" rel="noopener">details on GitHub</a>.</span></div>`; return; }
      } catch (e) { /* keep waiting */ }
      if (Date.now() - t0 > 6 * 60 * 1000) { steps.innerHTML = `<span class="label">Still working</span><p class="hint">GitHub is taking longer than usual. Your change is saved — it will appear on the site shortly.</p><a class="btn" href="#/dashboard">Back to dashboard</a>`; return; }
      setTimeout(() => Publish.watch(sha, t0), 5000);
    },
  };

  App.views['case-studies'] = { render: (main) => List.render(main, location.hash.replace(/^#\/?/, '').split('/')) };
  App.views.publish = Publish;
  window.Admin.Files = Files; window.Admin.Store = Store; window.Admin.Form = Form; window.Admin.getAt = getAt; window.Admin.setAt = setAt; window.Admin.slugify = slugify; window.Admin.ix = ix; window.Admin.debounce = debounce; window.Admin.Publish = Publish; window.Admin.prepareImage = prepareImage;
})();
