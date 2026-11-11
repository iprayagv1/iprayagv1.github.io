// Builds the home page from content/site.js (window.SITE).
// Runs before script.js, so the accordion, reveal and other effects find the elements.
(function () {
  let S = window.SITE;
  // index.html#preview shows your unpublished admin edits (only in your own browser)
  if (location.hash === '#preview') {
    try { const d = JSON.parse(localStorage.getItem('pg-admin-drafts') || '{}'); if (d.site) { S = window.SITE = d.site; document.documentElement.classList.add('is-preview'); } } catch (e) {}
  }
  if (!S) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const em = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const $ = sel => document.querySelector(sel);
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  const ext = url => /^(https?:|mailto:)/.test(url || '');
  const target = url => ext(url) && !/^mailto:/.test(url) ? ' target="_blank" rel="noopener"' : '';

  // ---------- Meta ----------
  const m = S.meta || {};
  if (m.title) document.title = m.title;
  const meta = (sel, val) => { const el = $(sel); if (el && val) el.setAttribute('content', val); };
  meta('meta[name="description"]', m.description);
  meta('meta[property="og:title"]', m.title);
  meta('meta[property="og:description"]', m.shareText);
  meta('meta[property="og:image"]', m.shareImage);

  // ---------- Hero ----------
  const h = S.hero || {};
  set('.hero__name', `<span>${esc(h.firstName)}</span> <span>${esc(h.lastName)}</span>`);
  const bw = $('.hero__photo .photo-bw'), col = $('.hero__photo .photo-color');
  if (bw && h.photo) { bw.src = h.photo; bw.alt = 'Portrait of ' + [h.firstName, h.lastName].join(' '); }
  if (col && h.photoHover) col.src = h.photoHover;
  set('.hero__role', esc(h.role));
  set('.hero__bio', em(h.bio));
  set('.hero__skills', (h.skills || []).map(s => `<li>${esc(s)}</li>`).join(''));

  // ---------- Experience ----------
  const x = S.experience || {};
  const ten = $('.ten');
  if (ten && x.years) ten.firstChild.nodeValue = x.years;
  set('.timeline', (x.items || []).map((j, i) => `
    <li class="timeline__item${j.current ? ' timeline__item--current' : ''} reveal">
      <h3><button class="timeline__toggle" aria-expanded="false" aria-controls="job-${i + 1}"><span class="timeline__company">${esc(j.company)}</span>${j.current ? ' <span class="badge-now">Current</span>' : ''}</button></h3>
      <p class="timeline__role">${esc(j.role)}</p>
      <div class="timeline__details" id="job-${i + 1}"><div class="timeline__details-inner"><ul>${(j.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div>
      <div class="timeline__meta"><span>${esc(j.location)}</span><span>${esc(j.dates)}</span></div>
    </li>`).join(''));

  // ---------- Solved problems (case study cards) ----------
  const live = (S.caseStudies || []).filter(c => c.status === 'published');
  const works = live.filter(c => c.showIn === 'works');
  set('#works-title', esc((S.works || {}).title));
  const card = c => `
    <a class="card reveal" href="work/${esc(c.slug)}.html">
      ${c.logo ? `<img class="card__logo" src="${esc(c.logo)}" alt="${esc(c.client)}">` : `<span class="card__logo card__logo--text">${esc(c.client)}</span>`}
      <p class="card__desc">${esc(c.cardText)}</p>
      <ul class="tags">${(c.tags || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="card__date"><span>Project Date</span><strong>${esc(c.date)}</strong></div>
      <img class="card__shot" src="${esc(c.thumb)}" alt="${esc(c.thumbAlt)}" width="588" height="480" loading="lazy">
    </a>`;
  set('.cards', `<div class="cards__col">${works.filter((_, i) => i % 2 === 0).map(card).join('')}</div>
    <div class="cards__col cards__col--offset">${works.filter((_, i) => i % 2 === 1).map(card).join('')}</div>`);

  // ---------- Ideas (articles + concept case studies) ----------
  const ideas = S.ideas || {};
  set('#ideas-title', esc(ideas.title));
  const bySlug = Object.fromEntries((S.caseStudies || []).map(c => [c.slug, c]));
  set('.articles', (ideas.items || []).map(a => {
    let it = a;
    if (a.type === 'case') {
      const c = bySlug[a.slug];
      if (!c || c.status !== 'published') return '';
      it = { title: a.title || c.title, desc: c.cardText, tag: (c.tags || [])[0], date: c.date, thumb: c.thumb, url: `work/${c.slug}.html` };
    }
    return `<li class="reveal"><a class="article" href="${esc(it.url)}"${target(it.url)}>
      <img class="article__thumb" src="${esc(it.thumb)}" alt="" width="1000" height="647" loading="lazy">
      <div class="article__body"><h3 class="article__title">${esc(it.title)}</h3><p class="article__desc">${esc(it.desc)}</p>
      <div class="article__meta">${it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ''}<span>${esc(it.date)}</span></div></div></a></li>`;
  }).join(''));
  const va = $('.view-all');
  if (va) { if (ideas.viewAllUrl) va.href = ideas.viewAllUrl; else va.hidden = true; }

  // ---------- Contact ----------
  const c = S.contact || {};
  const link = (sel, url) => { const el = $(sel); if (!el) return; if (url) el.href = url; else el.hidden = true; };
  link('.social[aria-label="Email"]', c.email ? 'mailto:' + c.email : '');
  link('.social[aria-label="LinkedIn"]', c.linkedin);
  link('.social[aria-label="Behance"]', c.behance);
  link('.social[aria-label="Instagram"]', c.instagram);
  link('.contact__links .resume', c.resume);
  link('.reviewer', c.reviewerForm);

  // ---------- Footer ----------
  const f = S.footer || {};
  set('.footer__name', esc(f.name));
  set('.footer__version', esc(f.version));
})();
