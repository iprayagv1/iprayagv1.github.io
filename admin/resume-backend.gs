/**
 * Resume requests — private backend for Prayag's portfolio.
 * Runs as a Google Apps Script web app on your own Google account (free).
 *
 *  • Visitors ask for your resume  → saved in a private Google Sheet + you get an email
 *  • You approve in /admin         → they get an email with a private link (7 days, 5 downloads)
 *  • The link opens /resume.html   → the PDF is fetched from your private Google Drive
 *
 * SETUP (once):
 *  1. Paste your admin key (from Admin → Resume requests) into ADMIN_KEY below.
 *  2. Run the function "setup" once (top toolbar ▶) and allow the permissions.
 *  3. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone → copy the URL.
 */

const ADMIN_KEY = 'PASTE-YOUR-ADMIN-KEY-HERE';
const SITE_URL = 'https://iprayagv1.github.io';
const OWNER_NAME = 'Prayag Gangadharan';
const LINK_DAYS = 7;          // how long a download link works
const MAX_DOWNLOADS = 5;      // downloads allowed per approved request

const HEAD = ['id', 'created', 'name', 'organisation', 'email', 'message', 'status', 'token', 'expires', 'downloads', 'decided'];
const props = () => PropertiesService.getScriptProperties();

// ---------- One-time setup: creates the private sheet and asks for permissions ----------
function setup() {
  sheet_();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder();
  Logger.log('Ready. Requests sheet: ' + SpreadsheetApp.openById(props().getProperty('SHEET_ID')).getUrl());
}

function sheet_() {
  let id = props().getProperty('SHEET_ID'), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('Portfolio — resume requests'); props().setProperty('SHEET_ID', ss.getId()); }
  const sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function rows_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, HEAD.length).getValues().map((r, i) => {
    const o = { _row: i + 2 }; HEAD.forEach((h, j) => { o[h] = r[j]; }); return o;
  });
}
function save_(o) { sheet_().getRange(o._row, 1, 1, HEAD.length).setValues([HEAD.map(h => (o[h] === undefined ? '' : o[h]))]); }
const out_ = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const clean_ = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const okEmail_ = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const iso_ = d => (d instanceof Date ? d.toISOString() : String(d || ''));

// ---------- Web app ----------
function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'file') return out_(file_(p.t));
  return out_({ ok: true, service: 'resume-requests' });
}

function doPost(e) {
  let b = {};
  try { b = JSON.parse(e.postData.contents || '{}'); } catch (x) { return out_({ ok: false, error: 'Bad request' }); }
  try {
    if (b.action === 'request') return out_(request_(b));
    // Everything below is for you only
    if (!ADMIN_KEY || ADMIN_KEY.indexOf('PASTE') === 0 || b.key !== ADMIN_KEY) return out_({ ok: false, error: 'Not allowed' });
    if (b.action === 'list') return out_({ ok: true, requests: rows_().map(r => ({ id: r.id, created: iso_(r.created), name: r.name, organisation: r.organisation, email: r.email, message: r.message, status: r.status, expires: iso_(r.expires), downloads: r.downloads || 0, decided: iso_(r.decided) })).reverse(), config: config_() });
    if (b.action === 'approve') return out_(decide_(b.id, 'approved', b.notify !== false));
    if (b.action === 'decline') return out_(decide_(b.id, 'declined', !!b.notify));
    if (b.action === 'delete') { const r = rows_().find(x => x.id === b.id); if (r) sheet_().deleteRow(r._row); return out_({ ok: true }); }
    if (b.action === 'config') { if (b.fileId !== undefined) props().setProperty('FILE_ID', clean_(b.fileId, 200)); return out_({ ok: true, config: config_() }); }
    return out_({ ok: false, error: 'Unknown action' });
  } catch (x) { return out_({ ok: false, error: String(x.message || x) }); }
}

function config_() {
  const id = props().getProperty('FILE_ID') || '';
  let name = '';
  if (id) { try { name = DriveApp.getFileById(id).getName(); } catch (e) { name = '(can’t open this file)'; } }
  return { fileId: id, fileName: name, sheetUrl: props().getProperty('SHEET_ID') ? 'https://docs.google.com/spreadsheets/d/' + props().getProperty('SHEET_ID') : '', quota: MailApp.getRemainingDailyQuota() };
}

// ---------- A visitor asks ----------
function request_(b) {
  if (b.website) return { ok: true }; // honeypot: bots fill hidden fields
  const name = clean_(b.name, 80), org = clean_(b.organisation, 120), email = clean_(b.email, 120).toLowerCase(), msg = clean_(b.message, 600);
  if (!name || !org || !okEmail_(email)) return { ok: false, error: 'Please fill in your name, organisation and a valid email.' };
  const cache = CacheService.getScriptCache();
  if (cache.get('rq:' + email)) return { ok: true, duplicate: true };
  cache.put('rq:' + email, '1', 600);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const open = rows_().find(r => r.email === email && r.status === 'pending');
    if (open) return { ok: true, duplicate: true };
    const id = Utilities.getUuid().slice(0, 8);
    sheet_().appendRow([id, new Date(), name, org, email, msg, 'pending', '', '', 0, '']);
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: `Resume request: ${name} (${org})`,
        htmlBody: `<p><b>${name}</b> from <b>${org}</b> asked for your resume.</p><p>Email: ${email}${msg ? `<br>Message: ${msg}` : ''}</p><p><a href="${SITE_URL}/admin/#/resume">Review in your admin →</a></p>`,
      });
    } catch (e) { /* the request is saved even if this email fails */ }
    return { ok: true };
  } finally { lock.releaseLock(); }
}

// ---------- You decide ----------
function decide_(id, status, notify) {
  const r = rows_().find(x => x.id === id);
  if (!r) return { ok: false, error: 'Request not found' };
  r.status = status; r.decided = new Date();
  let link = '';
  if (status === 'approved') {
    if (!props().getProperty('FILE_ID')) return { ok: false, error: 'Add your resume file first (Admin → Resume requests → Settings).' };
    r.token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    r.expires = new Date(Date.now() + LINK_DAYS * 864e5);
    r.downloads = 0;
    link = `${SITE_URL}/resume.html?t=${r.token}`;
    if (notify) MailApp.sendEmail({
      to: r.email, name: OWNER_NAME,
      subject: `${OWNER_NAME} — my resume`,
      htmlBody: `<p>Hi ${r.name},</p><p>Thanks for your interest. Here’s a private link to download my resume:</p><p><a href="${link}">${link}</a></p><p>The link works for ${LINK_DAYS} days.</p><p>Best,<br>${OWNER_NAME}<br><a href="${SITE_URL}">${SITE_URL.replace('https://', '')}</a></p>`,
    });
  } else { r.token = ''; r.expires = ''; if (notify) MailApp.sendEmail({ to: r.email, name: OWNER_NAME, subject: `${OWNER_NAME} — your resume request`, htmlBody: `<p>Hi ${r.name},</p><p>Thanks for your interest. I’m not able to share my resume for this request, but you’re welcome to reach out through LinkedIn.</p><p>Best,<br>${OWNER_NAME}</p>` }); }
  save_(r);
  return { ok: true, link };
}

// ---------- The download ----------
function file_(token) {
  token = String(token || '');
  if (token.length < 20) return { ok: false, error: 'invalid' };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const r = rows_().find(x => x.token === token && x.status === 'approved');
    if (!r) return { ok: false, error: 'invalid' };
    if (new Date(r.expires) < new Date()) return { ok: false, error: 'expired', name: r.name };
    if (Number(r.downloads || 0) >= MAX_DOWNLOADS) return { ok: false, error: 'limit', name: r.name };
    const f = DriveApp.getFileById(props().getProperty('FILE_ID'));
    const blob = f.getBlob();
    r.downloads = Number(r.downloads || 0) + 1; save_(r);
    return { ok: true, name: r.name, fileName: f.getName(), type: blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
  } finally { lock.releaseLock(); }
}
