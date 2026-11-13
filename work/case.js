/* ==========================================================
   Case study renderer
   Reads window.CASE (from data/<slug>.js) and window.SITE (../content/site.js)
   and builds the page into <main id="case">.
   Text supports **bold**. Images live in ../assets/case/<slug>/
   and show a labelled placeholder until the file exists.
   ========================================================== */
(function () {
  const C = window.CASE;
  const SITE = window.SITE || {};
  // Published case studies, in the order set in the admin. Paths in site.js are from the site root.
  const P = (SITE.caseStudies || window.PROJECTS || [])
    .filter(p => !p.status || p.status === 'published' || p.slug === (C && C.slug))
    .map(p => Object.assign({}, p, { thumb: /^(https?:|\.\.\/)/.test(p.thumb || '') ? p.thumb : '../' + p.thumb }));
  if (SITE.footer) {
    const fn = document.querySelector('.footer__name'), fv = document.querySelector('.footer__version');
    if (fn && SITE.footer.name) fn.textContent = SITE.footer.name;
    if (fv && SITE.footer.version) fv.textContent = SITE.footer.version;
  }
  const root = document.getElementById('case');
  if (!C || !root) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\(([^)\s]+)\)/g, '<a href="$2" class="inline-link">$1</a>');
  const paras = (arr, cls = 'lead') => (Array.isArray(arr) ? arr : arr ? [arr] : []).map(t => `<p class="${cls}">${md(t)}</p>`).join('');
  // In the admin preview, images you've uploaded but not published yet come from PREVIEW_FILES
  const imgPath = f => { const p = `assets/case/${C.slug}/${f}`; return (window.PREVIEW_FILES && window.PREVIEW_FILES[p]) || '../' + p; };
  const arrow = d => d === 'left'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const lockIcon = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

  // An image that turns into a "screenshot needed" placeholder if the file is missing
  function media(file, alt, ratio) {
    if (!file) return '';
    const path = imgPath(file);
    return `<img class="media" src="${esc(path)}" alt="${esc(alt || '')}" loading="lazy" data-ph="${esc(alt || file)}" data-file="${esc(path)}"${ratio ? ` data-ar="${esc(ratio)}"` : ''}>`;
  }
  function figure(f) {
    return `<figure class="figure"><div class="media-frame">${media(f.file, f.alt || String(f.caption || '').replace(/\*\*/g, ''), f.ratio)}</div>${f.caption ? `<figcaption>${md(f.caption)}</figcaption>` : ''}</figure>`;
  }

  // Brand / app logo with a "logo needed" placeholder until the file exists
  function logo(file, name) {
    const path = imgPath('logos/' + file);
    return `<img class="cs-logo" src="${esc(path)}" alt="${esc(name || '')} logo" data-logo="${esc(path)}" data-name="${esc(name || file)}">`;
  }

  // ---------- Content blocks (used in research / explorations) ----------
  const blocks = {
    image: b => figure(b),
    images: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="grid2">${b.items.map(figure).join('')}</div>${b.note ? `<p style="margin-top:16px;font-size:14px;color:rgba(243,243,243,.55)">${md(b.note)}</p>` : ''}`,
    list: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<ul class="bullets">${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ul>`,
    cards: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="${b.items.length === 2 || b.items.length === 4 ? 'grid2' : 'grid3'}">${b.items.map((c, i) =>
      `<div class="cs-card">${c.logo ? logo(c.logo, c.title) : ''}${b.numbered ? `<p class="n">${String(i + 1).padStart(2, '0')}</p>` : ''}${c.title ? `<h3 style="${b.numbered ? 'margin-top:12px' : ''}">${md(c.title)}</h3>` : ''}${c.body ? `<p>${md(c.body)}</p>` : ''}</div>`).join('')}</div>`,
    quotes: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="quotes">${b.items.map(q => `<blockquote class="quote" style="margin:0">${esc(q).replace(/==(.+?)==/g, '<mark>$1</mark>')}</blockquote>`).join('')}</div>`,
    // Horizontal bars scaled to the largest value (e.g. monthly growth); shows `display` text
    bars: b => { const max = Math.max(...b.steps.map(x => x.value)); return `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="funnel reveal">${b.steps.map((s, i) =>
      `<div class="funnel-row${i === b.steps.length - 1 ? ' last' : ''}"><span>${esc(s.label)}</span><div class="funnel-bar"><span style="--w:${(s.value / max).toFixed(3)}"></span></div><b>${esc(s.display || s.value)}</b></div>`).join('')}${b.note ? `<p style="margin-top:16px;font-size:14px;color:rgba(243,243,243,.55)">${md(b.note)}</p>` : ''}</div>`; },
    funnel: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="funnel reveal">${b.steps.map((s, i) =>
      `<div class="funnel-row${i === b.steps.length - 1 ? ' last' : ''}"><span>${esc(s.label)}</span><div class="funnel-bar"><span style="--w:${s.value / 100}"></span></div><b>${esc(s.value)}%</b></div>`).join('')}${b.note ? `<p style="margin-top:16px;font-size:14px;color:rgba(243,243,243,.55)">${md(b.note)}</p>` : ''}</div>`,
    table: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<div class="table-wrap"><table class="table"><thead><tr>${b.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    persona: b => {
      const col = (t, items) => items && items.length ? `<div><p class="block-title">${t}</p><ul class="bullets">${items.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>` : '';
      return `<div class="persona">
        <div class="persona-id">${b.photo ? `<div class="persona-photo">${media(b.photo, 'Persona: ' + b.name, '1 / 1')}</div>` : ''}<p class="who">${esc(b.name)}</p><p class="role">${esc(b.role || '')}</p>${b.age ? `<p class="role">Age ${esc(b.age)}</p>` : ''}</div>
        <div><p class="persona-bio">${md(b.bio)}</p><div class="persona-cols">${col('Goals &amp; needs', b.goals)}${col('Motivations', b.motivations)}${col('Frustrations', b.frustrations)}</div></div>
      </div>`;
    },
    story: b => `${b.title ? `<p class="block-title">${esc(b.title)}</p>` : ''}<ol class="story">${b.items.map(s => `<li><h3>${esc(s.title)}</h3><p>${md(s.body)}</p></li>`).join('')}</ol>`,
    text: b => paras(b.body),
  };
  const renderBlocks = arr => (arr || []).map(b => `<div class="block">${(blocks[b.type] || (() => ''))(b)}</div>`).join('');

  // ---------- Chapters ----------
  const chapters = [];
  const add = (id, name, html) => chapters.push({ id, name, html });

  if (C.snapshot) add('snapshot', 'Snapshot', `<h2>${esc(C.snapshot.heading || 'The project in thirty seconds')}</h2>
    <div class="grid3 block">
      <div class="cs-card"><p class="k">Problem</p><p>${md(C.snapshot.problem)}</p></div>
      <div class="cs-card"><p class="k">What I did</p><p>${md(C.snapshot.did)}</p></div>
      <div class="cs-card accent"><p class="k">${C.snapshot.outcomeLabel || 'Outcome'}</p><p>${md(C.snapshot.outcome)}</p></div>
    </div>`);
  if (C.context) add('context', 'Context', `<h2>${esc(C.context.heading)}</h2>${paras(C.context.body)}${renderBlocks(C.context.blocks)}`);
  if (C.process) add('process', 'Process', `<h2>${esc(C.process.heading || 'How the work moved')}</h2>${paras(C.process.intro)}
    <ol class="steps" style="--n:${Math.min(C.process.steps.length, 6)}">${C.process.steps.map((s, i) =>
      `<li><p class="i">${String(i + 1).padStart(2, '0')}</p><p class="t">${esc(s.name)}</p>${s.when ? `<p class="d">${esc(s.when)}</p>` : ''}<ul>${(s.items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')}</ol>`);
  if (C.research) add('research', 'Research', `<h2>${esc(C.research.heading)}</h2>${paras(C.research.intro)}${renderBlocks(C.research.blocks)}`);
  if (C.problem) add('problem', 'Problem', null); // rendered full-bleed below
  if (C.explorations) add('explorations', C.explorations.name || 'Explorations', `<h2>${esc(C.explorations.heading)}</h2>${paras(C.explorations.intro)}${renderBlocks(C.explorations.blocks)}`);
  if (C.solution) add('solution', 'Solution', null);
  if (C.impact) add('impact', C.impact.expected ? 'Expected impact' : 'Impact', `<h2>${esc(C.impact.heading)}</h2>${paras(C.impact.intro)}
    ${C.impact.metrics ? `<div class="${C.impact.metrics.length === 2 || C.impact.metrics.length === 4 ? 'grid2' : 'grid3'} block">${C.impact.metrics.map(m =>
      `<div class="metric"><p class="v">${esc(m.value)}${m.trend ? `<span class="trend ${m.trend}" aria-label="${m.trend === 'down' ? 'decrease' : 'increase'}">${m.trend === 'down' ? '↘' : '↗'}</span>` : ''}</p><p class="l">${md(m.label)}</p>${m.sub ? `<p class="s">${md(m.sub)}</p>` : ''}</div>`).join('')}</div>` : ''}
    ${renderBlocks(C.impact.blocks)}${C.impact.summary ? `<div class="block">${C.impact.summaryTitle ? `<p class="block-title">${esc(C.impact.summaryTitle)}</p>` : ''}${paras(C.impact.summary, C.impact.summaryTitle ? 'lead takeaway' : 'lead')}</div>` : ''}`);
  if (C.next) add('next', 'What’s next', `<h2>${esc(C.next.heading || 'Key takeaway & what’s next')}</h2>
    ${C.next.takeaway ? `<div class="block"><p class="block-title">Key takeaway</p>${paras(C.next.takeaway, 'lead takeaway')}</div>` : ''}
    <div class="block"><p class="block-title">${esc(C.next.stepsTitle || 'What’s next')}</p>${C.next.steps && C.next.steps.length
      ? `<ol class="next-steps">${C.next.steps.map((st, i) => `<li><span class="nx">${String(i + 1).padStart(2, '0')}</span><div>${st.title ? `<h3>${esc(st.title)}</h3>` : ''}<p>${md(st.body || st)}</p></div></li>`).join('')}</ol>`
      : `<div class="ph" style="--ar:auto;min-height:140px"><b>Next steps needed</b><span>Add 2–3 next steps in work/data/${esc(C.slug)}.js</span></div>`}</div>`);
  if (C.learnings && C.learnings.length) add('learnings', 'Learnings', `<h2>${esc(C.learnings.heading || 'What I’d carry forward')}</h2><ul class="rows block">${C.learnings.map(l => `<li>${md(l)}</li>`).join('')}</ul>`);

  const num = i => String(i + 1).padStart(2, '0');

  function chapterHTML(ch, i) {
    if (ch.id === 'problem') return problemHTML(i);
    if (ch.id === 'solution') return solutionHTML(i);
    return `<section class="chap" id="${ch.id}"><div><p class="chap-label"><span>${num(i)}</span> — ${esc(ch.name)}</p></div><div class="reveal">${ch.html}</div></section>`;
  }

  // Problem statement with Figma-style collaborator cursors
  const ROLE_LABEL = { who: 'Who is affected', what: 'What’s the problem', how: 'How it shows up', why: 'Why it matters' };
  const ARROW_FILL = { who: ['#f3f3f3', '#0b0b0b'], what: ['#ffcd29', '#0b0b0b'], how: ['#0b0b0b', '#f3f3f3'], why: ['#ffcd29', '#0b0b0b'] };
  const IDLE = [['cs-idle1', '7s'], ['cs-idle2', '8.5s'], ['cs-idle3', '6.5s'], ['cs-idle4', '9s']];
  function problemHTML(i) {
    let k = 0;
    const parts = C.problem.statement.map(p => {
      if (typeof p === 'string') return esc(p);
      const role = p.role, n = k++, [fill, stroke] = ARROW_FILL[role] || ARROW_FILL.who, [idle, dur] = IDLE[n % 4];
      const d = (0.15 + n * 0.7).toFixed(2) + 's';
      return `<span class="sel ${role}" style="--d:${d}">${esc(p.text)}</span><span class="anchor" aria-hidden="true"><span class="cur ${role} e${(n % 4) + 1}" style="--d:${d};--idle:${idle};--idur:${dur}"><span class="wand"><span class="ripple"></span><svg width="18" height="20" viewBox="0 0 18 20"><path d="M1 1 L1 16.5 L5.2 12.6 L8 19 L10.6 17.9 L7.9 11.7 L13.6 11.7 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="ctag">${esc(p.label || ROLE_LABEL[role])}</span></span></span></span>`;
    }).join(' ').replace(/(<\/span>) ([.,;:!?])/g, '$1$2');
    return `<section class="prob" id="problem"><p class="chap-label"><span>${num(i)}</span> — The problem</p><p class="stmt">${parts}</p></section>`;
  }

  function solutionHTML(i) {
    const S = C.solution;
    return `<section id="solution" style="scroll-margin-top:150px">
      <div class="chap"><div><p class="chap-label"><span>${num(i)}</span> — Solution</p></div><div class="reveal"><h2>${esc(S.heading)}</h2>${paras(S.intro)}</div></div>
      ${S.decisions.map((d, j) => {
        const text = `<div class="decision-text"><p class="k">Decision ${String(j + 1).padStart(2, '0')}</p><h3>${esc(d.title)}</h3>${paras(d.body, '')}</div>`;
        const pic = `<div class="decision-media"><div class="shot">${media(d.file, d.alt || d.title)}${d.callout ? `<p class="callout" style="animation-delay:${(-j * 1.3).toFixed(1)}s"><span class="callout-dot" aria-hidden="true"></span>${md(d.callout)}</p>` : ''}</div>${d.caption ? `<p class="shot-caption">${md(d.caption)}</p>` : ''}</div>`;
        // Row 1: text → image, Row 2: image → text, and so on
        return `<div class="decision ${j % 2 ? 'flip' : ''} reveal">${j % 2 ? pic + text : text + pic}</div>`;
      }).join('')}
    </section>`;
  }

  // ---------- Hero ----------
  const idx = P.findIndex(p => p.slug === C.slug);
  const m = C.meta || {};
  const metaItems = [['Role', m.role], ['Platform', m.platform], ['Timeline', m.timeline], [m.teamLabel || 'Team', m.team]].filter(x => x[1]);
  // Locked banner background: the chosen image, or this project's (already public) home-page card image
  const myCard = P.find(p => p.slug === C.slug) || {};
  const lkBg = C.lockedBg || myCard.thumb || '';
  const hero = `<section class="cs-hero">
    <p class="cs-crumb"><a href="../index.html#works">Works</a> <span aria-hidden="true">/</span> ${esc(C.short || C.title)}</p>
    <div class="cs-brand">${C.logo ? `<img src="${esc(C.logo)}" alt="${esc(C.client)}">` : C.logoFile ? logo(C.logoFile, C.client) : `<span style="font-size:20px">${esc(C.client)}</span>`}<span class="sep" aria-hidden="true"></span><span class="cs-eyebrow">Case study ${num(Math.max(idx, 0))}${C.eyebrow ? ' · ' + esc(C.eyebrow) : ''}</span>${C.confidential ? `<span class="cs-lock">${lockIcon(12)}Confidential</span>` : ''}</div>
    <h1 class="cs-title">${esc(C.title)}</h1>
    ${C.summary ? `<p class="cs-summary">${md(C.summary)}</p>` : ''}
    <dl class="cs-meta">${metaItems.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${C.confidential
      // Locked: same banner slot as the cover, with a moving blurred glow and a lock
      ? `<div class="cs-cover cs-cover--locked" role="img" aria-label="Confidential project">
          ${lkBg ? `<img class="lk-bg" src="${esc(lkBg)}" alt="">` : '<span class="lk-glow" aria-hidden="true"></span>'}
          <span class="lk-tint" aria-hidden="true"></span>
          <div class="lk-center"><span class="lk-icon">${lockIcon(28)}</span>
            <p class="lk-label">Confidential project</p><p class="lk-sub">Under NDA — the details are available on request</p></div>
        </div>`
      : `<div class="cs-cover">${media(C.cover || 'cover.png', 'Cover: ' + C.title, '16 / 9')}</div>`}
  </section>`;

  // ---------- Confidential body ----------
  const locked = C.confidential ? `<div class="locked locked--plain">
    <div class="locked-card"><div class="locked-icon">${lockIcon(24)}</div>
      <h2>This project is confidential</h2>
      <p>${md(C.lockedText || 'The work is under NDA, so the details can’t be shared publicly. I’m happy to walk you through the process and decisions on a call.')}</p>
      <a class="pill pill--light" href="mailto:career.prayag@gmail.com?subject=${encodeURIComponent('Walkthrough request: ' + C.title)}">Request a walkthrough</a>
    </div></div>` : '';

  // ---------- Chapter bar ----------
  // Confidential: only the Snapshot is shown; every other chapter is locked
  if (C.confidential) { const snap = chapters.filter(c => c.id === 'snapshot'); chapters.length = 0; chapters.push(...snap); }
  const bar = chapters.length && !C.confidential ? `<nav class="cs-chapters" aria-label="Chapters"><ol>${chapters.map((c, i) => `<li><a href="#${c.id}" data-ch="${c.id}">${num(i)} ${esc(c.name)}</a></li>`).join('')}</ol></nav>` : '';

  // ---------- Keep reading ----------
  let more = '';
  if (P.length > 1 && idx > -1) {
    const prev = P[(idx - 1 + P.length) % P.length], next = P[(idx + 1) % P.length];
    const card = (p, dir) => `<a class="navcard ${dir}" href="${p.slug}.html"><div class="top">
      <p class="dir">${dir === 'prev' ? arrow('left') + 'Previous' : 'Next' + arrow('right')}</p>
      <p class="ttl">${esc(p.title)}</p><p class="sub">${esc(p.client)} · ${esc(p.platform)}</p></div>
      <div class="pic"><img src="${esc(p.thumb)}" alt="" loading="lazy"></div></a>`;
    more = `<section class="more"><div class="more-head"><h2>Keep reading</h2><a href="../index.html#works">All case studies</a></div>
      <div class="more-grid">${card(prev, 'prev')}${card(next, 'next')}</div>
      <p class="more-count">Case study ${num(idx)} of ${String(P.length).padStart(2, '0')}</p></section>`;
  }

  document.title = `${C.short || C.title} — Prayag Gangadharan`;
  // The chapter bar shares a container with the chapters, so it stays stuck for the whole read
  root.innerHTML = C.confidential
    ? `<div class="case">${hero}</div><div class="case">${chapters.map(chapterHTML).join('')}${locked}${more}</div>`
    : `<div class="case">${hero}${locked}</div><div class="case">${bar}${chapters.map(chapterHTML).join('')}${more}</div>`;

  // ---------- Behaviour ----------
  // Missing screenshots → labelled placeholder showing exactly which file to add
  root.querySelectorAll('img.media').forEach(img => {
    const swap = () => {
      const ph = document.createElement('div');
      ph.className = 'ph';
      if (img.dataset.ar) ph.style.setProperty('--ar', img.dataset.ar);
      ph.innerHTML = `<b>Screenshot needed</b><span>${esc(img.dataset.ph)}</span><code>${esc(img.dataset.file.replace('../', 'website/'))}</code>`;
      img.replaceWith(ph);
    };
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });

  root.querySelectorAll('img.cs-logo').forEach(img => {
    const swap = () => {
      const ph = document.createElement('span');
      ph.className = 'logo-ph';
      ph.title = img.dataset.logo.replace('../', 'website/');
      ph.innerHTML = `<b>Logo</b><span>${esc(img.dataset.name)}</span>`;
      img.replaceWith(ph);
    };
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = (els, cb, opts) => {
    if (!('IntersectionObserver' in window)) { els.forEach(el => cb(el)); return; }
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { cb(e.target); o.unobserve(e.target); } }), opts);
    els.forEach(el => o.observe(el));
  };
  io(root.querySelectorAll('.reveal'), el => el.classList.add('is-visible'), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  io(root.querySelectorAll('.prob'), el => el.classList.add('in'), { threshold: 0.35 });
  if (reduce) root.querySelectorAll('.prob').forEach(el => el.classList.add('in'));

  // Hairline under the chapter bar only while it is stuck
  const barEl = root.querySelector('.cs-chapters');
  if (barEl) {
    const onScroll = () => barEl.classList.toggle('is-stuck', barEl.getBoundingClientRect().top <= parseFloat(getComputedStyle(barEl).top) + 1);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // Highlight the chapter in view
  const links = [...root.querySelectorAll('.cs-chapters a')];
  if (links.length) {
    const secs = links.map(a => document.getElementById(a.dataset.ch)).filter(Boolean);
    const update = () => {
      const y = window.innerHeight * 0.35;
      let cur = secs[0];
      secs.forEach(s => { if (s.getBoundingClientRect().top - y <= 0) cur = s; });
      links.forEach(a => {
        const on = a.dataset.ch === (cur && cur.id);
        a.classList.toggle('is-active', on);
        if (on && a.scrollIntoView && a.parentElement.parentElement.scrollWidth > a.parentElement.parentElement.clientWidth) {
          const bar = a.closest('ol'); bar.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
        }
      });
    };
    let t; window.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    update();
  }
})();
