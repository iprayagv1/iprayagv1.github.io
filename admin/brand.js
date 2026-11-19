/* ==========================================================
   Portfolio admin — Design system (brand book)
   Values mirror the "Prayag Gangadharan" design system in Claude.
   ========================================================== */
(function () {
  const A = window.Admin;
  const { App, esc, ic, $ } = A;
  const ROOT = '../assets/brand/';
  const DS_URL = 'https://claude.ai/artifact/FeAespedAt6YEtzJNfLHAH';

  const COLORS = [
    ['ground', '#0B0B0B', '#F3F3F3', 'Page background. Dark is primary.'],
    ['surface', '#141414', '#FFFFFF', 'Cards, panels and popups.'],
    ['ink', '#F3F3F3', '#111111', 'Text, icons and the Loop.'],
    ['ink-muted', '#9A9A9A', '#5C5C5C', 'Secondary text, roles, dates, labels.'],
    ['hairline', 'rgba(243,243,243,.12)', 'rgba(17,17,17,.12)', 'Dividers and section rules.'],
    ['accent', '#FFCD29', '#FFCD29', 'The Loop bar. Focus rings, “now” badges, one highlight per view.'],
    ['on-accent', '#111111', '#111111', 'Text and marks on yellow.'],
  ];
  const TYPE = [
    ['display', 'Gilda Display', 70, 74], ['h1', 'Gilda Display', 48, 56], ['h2', 'Gilda Display', 32, 40],
    ['lead', 'Marcellus', 20, 30], ['body', 'Marcellus', 16, 26], ['label', 'Marcellus', 14, 18],
  ];
  const SPACE = [['space-1', 4, 'Icon-to-label gaps'], ['space-2', 8, 'Name over role'], ['space-3', 16, 'Card padding (mobile), list gaps'], ['space-4', 28, 'Mark-to-name gap in the lockup'], ['space-5', 48, 'Page padding, section gaps'], ['space-6', 80, 'Between major sections']];
  const RADIUS = [['radius-sm', '8px', 'Favicon, small corners'], ['radius-md', '16px', 'Cards, buttons'], ['radius-icon', '24%', 'App icon and avatar tiles'], ['radius-pill', '999px', 'Tags and pills']];
  const STROKE = [['stroke-mark', 14, '64 px and up'], ['stroke-mark-48', 16, 'at 48 px'], ['stroke-mark-32', 18, 'at 32 px (nav)'], ['stroke-mark-16', 24, 'at 16 px (favicon)']];
  const ASSETS = [
    ['Mark · dark backgrounds', 'mark-for-dark-bg.svg', 'dark'], ['Mark · light backgrounds', 'mark-for-light-bg.svg', 'light'],
    ['Lockup · dark backgrounds', 'lockup-for-dark-bg.svg', 'dark'], ['Lockup · light backgrounds', 'lockup-for-light-bg.svg', 'light'],
    ['Icon · dark tile', 'icon-dark.svg', 'plain'], ['Icon · yellow tile', 'app-icon.svg', 'plain'], ['Favicon', 'favicon.svg', 'plain'],
  ];
  const MARK = (stroke = 14, bar = 'var(--accent)', ink = 'var(--text)') => `<svg viewBox="15 22.5 170 170" aria-hidden="true"><path d="M138.3 57.9 A50 50 0 1 0 150 90" fill="none" stroke="${ink}" stroke-width="${stroke}" stroke-linecap="round"/><path d="M150 90 H104" fill="none" stroke="${bar}" stroke-width="${stroke}" stroke-linecap="round"/><path d="M50 45 V175" fill="none" stroke="${ink}" stroke-width="${stroke}" stroke-linecap="round"/></svg>`;
  const LOADER = `<div class="pg-loader" id="ds-loader" role="img" aria-label="The Loop splash screen"><svg viewBox="15 22.5 170 170" focusable="false">
    <path class="pl-arc" d="M138.3 57.9 A50 50 0 1 0 150 90"/><path class="pl-bar" d="M104 90 H150"/><path class="pl-tip" d="M138.3 57.9 A50 50 0 1 0 150 90 H104"/>
    <circle class="pl-dot" cx="104" cy="90" r="7"/><path class="pl-up" d="M50 90 V45"/><path class="pl-down" d="M50 90 V175"/></svg></div>`;
  const sec = (id, title, body) => `<section class="card ds-sec" id="ds-${id}"><h2 class="ds-h">${title}</h2>${body}</section>`;

  const View = {
    timers: [],
    render(main) {
      View.stop();
      main.innerHTML = App.topbar('Brand', 'Design system', `<a class="btn" href="${DS_URL}" target="_blank" rel="noopener">${ic('ext')}Open in Claude</a>`) + `<div class="content ds">
        <div class="card ds-cover">
          <div class="ds-cover__text"><h2>Prayag Gangadharan</h2><p>I step into problems and design my way out of them.</p></div>
          <div class="ds-cover__mark">${MARK(14)}</div>
        </div>
        <nav class="ds-toc" aria-label="Sections">${['Idea', 'Logo', 'Colour', 'Type', 'Spacing', 'Corners', 'Stroke', 'Motion', 'Assets'].map(s => `<a href="#ds-${s.toLowerCase()}" data-sec="${s.toLowerCase()}">${s}</a>`).join('')}</nav>

        ${sec('idea', 'The Loop — the idea', `<div class="ds-split"><div class="ds-tile ds-tile--dark ds-tile--big">${MARK(14)}</div>
          <div class="ds-copy"><p>One line, two letters. A lowercase <b>p</b> and a capital <b>G</b> share a single round bowl.</p>
          <ul><li>The stem dropping from the left of the circle makes it a <b>p</b>.</li><li>The opening at the top right, with a bar reaching in from the edge to the centre, makes it a <b>G</b>.</li></ul>
          <p>Nothing is added that doesn’t do two jobs. The yellow bar is the moment of insight — the single spot of colour, the way out of the loop.</p></div></div>`)}

        ${sec('logo', 'Logo', `<div class="ds-grid ds-grid--4">
          <figure class="ds-fig"><div class="ds-tile ds-tile--dark">${MARK(14)}</div><figcaption>Primary · on dark</figcaption></figure>
          <figure class="ds-fig"><div class="ds-tile ds-tile--light">${MARK(14, '#111', '#111')}</div><figcaption>On light · bar turns ink</figcaption></figure>
          <figure class="ds-fig"><div class="ds-tile ds-tile--dark"><div class="ds-clear">${MARK(14)}</div></div><figcaption>Clear space = bowl radius</figcaption></figure>
          <figure class="ds-fig"><div class="ds-tile ds-tile--dark ds-sizes">${[48, 32, 16].map((s, i) => `<span style="width:${s}px;height:${s}px">${MARK([16, 18, 24][i])}</span>`).join('')}</div><figcaption>Small sizes thicken</figcaption></figure>
        </div>
        <div class="ds-lockups"><div class="ds-tile ds-tile--dark"><img src="${ROOT}lockup-for-dark-bg.svg" alt="Lockup for dark backgrounds"></div><div class="ds-tile ds-tile--light"><img src="${ROOT}lockup-for-light-bg.svg" alt="Lockup for light backgrounds"></div></div>
        <div class="ds-rules"><div><span class="label">Minimum size</span><p>Mark 24 px (8 mm print). Below that, use the favicon. Lockup 240 px wide (50 mm print).</p></div>
          <div><span class="label">Don’t</span><p>Put the yellow bar on a light ground · recolour the loop · stretch, rotate, outline or add effects · close the gap or remove the stem.</p></div></div>`)}

        ${sec('colour', 'Colour', `<p class="ds-note">Dark-first, like the portfolio. Yellow is a signal, not a fill: one yellow element per screen, never yellow text on light.</p>
          <div class="ds-grid ds-grid--colors">${COLORS.map(c => `<div class="ds-color"><div class="ds-swatch"><span style="background:${c[1]}"></span><span style="background:${c[2]}"></span></div>
          <div class="ds-color__meta"><b>${c[0]}</b><code>${c[1]}</code><code class="muted">${c[2]} light</code><small>${c[3]}</small></div></div>`).join('')}</div>`)}

        ${sec('type', 'Typography', `<p class="ds-note"><b>Gilda Display</b> for the name, headlines and pull quotes. <b>Marcellus</b> for body, navigation and labels. One Gilda element per block.</p>
          <div class="ds-type">${TYPE.map(t => `<div class="ds-type__row"><span class="ds-type__meta"><b>${t[0]}</b><small>${t[1]} · ${t[2]}/${t[3]}</small></span>
          <span class="ds-type__sample" style="font-family:${t[1] === 'Marcellus' ? 'var(--sans)' : 'var(--serif)'};font-size:${Math.min(t[2], 56)}px;line-height:${t[3] / t[2]}${t[0] === 'label' ? ';letter-spacing:.16em;text-transform:uppercase;color:var(--muted)' : ''}">${t[0] === 'label' ? 'UX Designer' : t[0] === 'body' || t[0] === 'lead' ? 'I step into problems and design my way out of them.' : 'Prayag Gangadharan'}</span></div>`).join('')}</div>`)}

        ${sec('spacing', 'Spacing', `<div class="ds-list">${SPACE.map(s => `<div class="ds-list__row"><b>${s[0]}</b><code>${s[1]}px</code><span class="ds-bar" style="width:${s[1] * 2}px"></span><small>${s[2]}</small></div>`).join('')}</div>`)}

        ${sec('corners', 'Corner radius', `<div class="ds-grid ds-grid--4">${RADIUS.map(r => `<figure class="ds-fig"><div class="ds-radius" style="border-radius:${r[0] === 'radius-pill' ? '999px' : r[1]}${r[0] === 'radius-pill' ? ';height:56px' : ''}"></div><figcaption><b>${r[0]}</b> · ${r[1]}<br><small>${r[2]}</small></figcaption></figure>`).join('')}</div>`)}

        ${sec('stroke', 'Stroke', `<p class="ds-note">The Loop is drawn on a 170-unit grid. Its stroke thickens as the mark gets smaller so it stays crisp.</p>
          <div class="ds-grid ds-grid--4">${STROKE.map(s => `<figure class="ds-fig"><div class="ds-tile ds-tile--dark">${MARK(s[1])}</div><figcaption><b>${s[0]}</b> · ${s[1]}<br><small>${s[2]}</small></figcaption></figure>`).join('')}</div>`)}

        ${sec('motion', 'Motion — the splash screen', `<div class="ds-split"><div class="ds-loaderbox">${LOADER}<span class="label ds-loader__cap" id="ds-cap"></span>
          <div class="ds-loader__btns"><button type="button" class="btn" id="ds-fast">Fast load</button><button type="button" class="btn" id="ds-slow">Slow load</button></div></div>
          <div class="ds-copy"><ol><li><b>The bowl forms.</b> A yellow light leads the pen around the bowl, then glides into the centre and becomes a yellow dot (≈1.3 s).</li>
          <li><b>Still loading? The dot waits.</b> It pulses inside the open bowl; the G isn’t completed until the page is ready (8 s at most).</li>
          <li><b>Loaded: the G completes, then the p.</b> The dot stretches out into the bar, the p tail grows from the bowl’s edge, and the splash fades.</li></ol>
          <p class="ds-note">Plays on every page load and refresh. Reduced motion: the still mark, then a fade. Code: <code>assets/brand/loader.css</code> + <code>loader.js</code>.</p></div></div>`)}

        ${sec('assets', 'Assets', `<div class="ds-grid ds-grid--assets">${ASSETS.map(a => `<a class="ds-asset" href="${ROOT}${a[1]}" download="${a[1]}"><span class="ds-tile ds-tile--${a[2]}"><img src="${ROOT}${a[1]}" alt=""></span><span><b>${a[0]}</b><small>${a[1]} · SVG</small></span></a>`).join('')}
          <a class="ds-asset" href="${ROOT}icon-dark-1024.png" download="pg-icon-dark-1024.png"><span class="ds-tile ds-tile--plain"><img src="${ROOT}icon-dark-1024.png" alt=""></span><span><b>Avatar · PNG 1024</b><small>icon-dark-1024.png</small></span></a></div>`)}
      </div>`;
      main.querySelectorAll('.ds-toc a').forEach(a => a.onclick = e => { e.preventDefault(); const t = $('#ds-' + a.dataset.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      $('#ds-fast').onclick = () => View.play(0);
      $('#ds-slow').onclick = () => View.play(2600);
      View.play(2600);
      window.addEventListener('hashchange', View.stop, { once: true });
    },
    stop() { View.timers.forEach(clearTimeout); View.timers = []; },
    play(wait) {
      View.stop();
      const l = $('#ds-loader'), cap = $('#ds-cap'); if (!l) return;
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { l.className = 'pg-loader is-still'; cap.textContent = 'Reduced motion: still mark'; return; }
      const t = (ms, f) => View.timers.push(setTimeout(f, ms));
      l.className = 'pg-loader'; void l.offsetWidth;
      l.classList.add('is-forming'); cap.textContent = '1 · The bowl forms';
      t(1300, () => { if (wait) { l.classList.add('is-waiting'); cap.textContent = '2 · Still loading: the dot waits'; } });
      t(1300 + wait, () => { l.classList.remove('is-waiting'); l.classList.add('is-finishing'); cap.textContent = (wait ? '3' : '2') + ' · Loaded: G completes, then the p'; });
      t(1300 + wait + 1700, () => View.play(wait));
    },
  };

  App.views['design-system'] = View;
})();
