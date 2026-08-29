#!/usr/bin/env node
/**
 * Automated production test matrix.
 *
 * Exercises real HTTP against a running server: public pages, auth, strain
 * CRUD, pricing, inventory, media upload/display/delete, inquiries, and
 * failure paths. Nothing is asserted from reading source — every row is the
 * result of an actual request.
 *
 *   node scripts/test-matrix.mjs http://localhost:3400 <admin-password>
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const PASSWORD = process.argv[3] || 'test-password-123';

const results = [];
let cookie = '';

const g = (s) => '\x1b[32m' + s + '\x1b[0m';
const r = (s) => '\x1b[31m' + s + '\x1b[0m';

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log('  ' + (pass ? g('PASS') : r('FAIL')) + '  ' + name + (detail ? '  ' + '\x1b[2m' + detail + '\x1b[0m' : ''));
}

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (cookie) headers.cookie = (headers.cookie ? headers.cookie + '; ' : '') + cookie;
  const res = await fetch(BASE + path, { ...opts, headers, redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie && /ccc_admin/.test(setCookie)) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, text, json, headers: res.headers };
}

const jsonReq = (path, method, body) =>
  req(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/* --------------------------------------------------------- public pages --- */

console.log('\nPUBLIC PAGES\n');

for (const [name, path, expect] of [
  ['HOME PAGE', '/', 200],
  ['404 HANDLING', '/strains/does-not-exist-xyz', 404],
  ['PRIVACY', '/privacy', 200],
  ['TERMS', '/terms', 200],
  ['ROBOTS', '/robots.txt', 200],
  ['SITEMAP', '/sitemap.xml', 200],
  ['FAVICON', '/favicon.ico', 200],
  ['ICON PNG', '/icon.png', 200],
  ['APPLE ICON', '/apple-icon.png', 200],
  ['OG CARD', '/brand/og-card.jpg', 200]
]) {
  const res = await req(path, { headers: { cookie: 'ccc_age_ok=1' } });
  record(name, res.status === expect, res.status + ' (expected ' + expect + ')');
}

const menuProbe = await req('/sitemap.xml');
const firstSlug = (menuProbe.text.match(/\/strains\/([a-z0-9-]+)</) || [])[1];
if (firstSlug) {
  const detail = await req('/strains/' + firstSlug, { headers: { cookie: 'ccc_age_ok=1' } });
  record('STRAIN DETAIL', detail.status === 200, '/strains/' + firstSlug);
} else {
  record('STRAIN DETAIL', false, 'no published strain found in sitemap');
}

const home = await req('/', { headers: { cookie: 'ccc_age_ok=1' } });
record('AGE GATE (cookie set → hidden)', !home.text.includes('aria-modal'));
const gated = await req('/');
record('AGE GATE (no cookie → shown)', gated.text.includes('aria-modal'));
record('AGE GATE ANIMATION MARKUP', gated.text.includes('cc-age-curtain') && gated.text.includes('cc-age-seam'));
record('CURRENT MENU RENDERS', home.text.includes('AVAILABLE') || home.text.includes('SOLD OUT'));
record('MOBILE NAV PRESENT', home.text.includes('cc-skip'));

/* ---------------------------------------------------------------- health --- */

console.log('\nDIAGNOSTICS\n');
const health = await req('/api/health');
record('API HEALTH', health.status === 200 && health.json?.ok === true,
  'driver=' + health.json?.driver + ' database=' + health.json?.database + ' storage=' + health.json?.storage);
record('HEALTH REPORTS STORAGE', typeof health.json?.storage === 'string');
record('HEALTH LEAKS NO SECRETS',
  !/sb_secret|service_role|SESSION_SECRET|ADMIN_PASSWORD/i.test(health.text));

/* ------------------------------------------------------------------ auth --- */

console.log('\nAUTH\n');
record('ADMIN BLOCKED WHEN LOGGED OUT', (await req('/admin')).status === 307);
record('ADMIN API BLOCKED', (await req('/api/strains')).status === 401);
record('WRONG PASSWORD REJECTED', (await jsonReq('/api/auth', 'POST', { password: 'wrong-' + Date.now() })).status === 401);

const login = await jsonReq('/api/auth', 'POST', { password: PASSWORD });
record('ADMIN LOGIN', login.status === 200 && !!cookie);
record('SESSION COOKIE HTTPONLY', /HttpOnly/i.test(String(login.headers.get('set-cookie'))));
record('SESSION COOKIE SAMESITE', /SameSite/i.test(String(login.headers.get('set-cookie'))));
record('ADMIN PAGE LOADS', (await req('/admin')).status === 200);

/* -------------------------------------------------------------- CRUD --- */

console.log('\nSTRAIN CRUD\n');
const created = await jsonReq('/api/strains', 'POST', { name: 'QA Test Strain ' + Date.now() });
const slug = created.json?.slug;
record('CREATE STRAIN', created.status === 201 && !!slug, slug || '');

if (slug) {
  const edited = await jsonReq('/api/strains/' + slug, 'PATCH', {
    parentA: 'Alpha', parentB: 'Beta', status: 'AVAILABLE', qty: 25, visible: true,
    description: 'QA description', aroma: 'QA aroma'
  });
  record('EDIT STRAIN', edited.status === 200 && edited.json?.parentA === 'Alpha');

  const priced = await jsonReq('/api/strains/' + slug, 'PATCH', {
    pricing: [{ label: 'Eighth', price: '$45' }, { label: 'Ounce', price: '$280' }]
  });
  record('PRICING UPDATE', priced.status === 200 && priced.json?.pricing?.length === 2);

  const reordered = await jsonReq('/api/strains/' + slug, 'PATCH', {
    pricing: [{ label: 'Ounce', price: '$280' }, { label: 'Eighth', price: '$45' }]
  });
  record('PRICING REORDER', reordered.json?.pricing?.[0]?.label === 'Ounce');

  for (const [qty, expected] of [[25, 'AVAILABLE'], [3, 'LOW STOCK'], [0, 'SOLD OUT']]) {
    const inv = await jsonReq('/api/strains/' + slug, 'PATCH', { qty, status: expected });
    record('INVENTORY ' + qty + ' → ' + expected, inv.json?.status === expected, 'qty=' + inv.json?.qty);
  }

  await jsonReq('/api/strains/' + slug, 'PATCH', { qty: 25, status: 'AVAILABLE', visible: true });

  const pub = await req('/strains/' + slug, { headers: { cookie: 'ccc_age_ok=1' } });
  record('PUBLIC PAGE REFLECTS EDITS', pub.status === 200 && pub.text.includes('$45'));

  const unpub = await jsonReq('/api/strains/' + slug, 'PATCH', { visible: false });
  record('UNPUBLISH', unpub.status === 200);
  record('UNPUBLISHED IS 404 PUBLICLY',
    (await req('/strains/' + slug, { headers: { cookie: 'ccc_age_ok=1' } })).status === 404);
  await jsonReq('/api/strains/' + slug, 'PATCH', { visible: true });

  /* ------------------------------------------------------------- media --- */

  console.log('\nMEDIA\n');

  // Minimal but structurally valid PNG and MP4.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const mp4 = Buffer.concat([
    Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'),
    Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2'), Buffer.alloc(64)
  ]);

  const upload = async (bytes, type, filename) => {
    const fd = new FormData();
    fd.append('file', new Blob([bytes], { type }), filename);
    return req('/api/strains/' + slug + '/media', { method: 'POST', body: fd });
  };

  const img = await upload(png, 'image/png', 'qa.png');
  record('IMAGE UPLOAD', img.status === 201 && !!img.json?.url, img.json?.url || img.json?.error || '');

  const vid = await upload(mp4, 'video/mp4', 'qa.mp4');
  record('VIDEO UPLOAD', vid.status === 201 && !!vid.json?.url, vid.json?.url || vid.json?.error || '');

  const evil = await upload(Buffer.from('<html><script>alert(1)</script></html>'), 'image/jpeg', 'evil.jpg');
  record('DISGUISED FILE REJECTED', evil.status === 415, 'status ' + evil.status);

  const huge = await upload(Buffer.alloc(13 * 1024 * 1024, 1), 'image/png', 'huge.png');
  record('OVERSIZED FILE REJECTED', huge.status === 413 || huge.status === 415, 'status ' + huge.status);

  if (img.json?.url) {
    const served = await req(img.json.url);
    record('IMAGE DISPLAY (served back)', served.status === 200,
      served.headers.get('content-type') || '');
  }

  const afterUpload = await req('/api/strains');
  const mine = afterUpload.json?.find?.((x) => x.slug === slug);
  record('MEDIA ATTACHED TO STRAIN', (mine?.media?.length || 0) >= 2, (mine?.media?.length || 0) + ' items');
  record('COVER AUTO-ASSIGNED', !!mine?.media?.some?.((m) => m.isCover));

  if (mine?.media?.length) {
    const last = mine.media[mine.media.length - 1];
    const cover = await jsonReq('/api/strains/' + slug + '/media', 'PATCH', { id: last.id, action: 'cover' });
    record('SET COVER MEDIA', cover.status === 200, 'status ' + cover.status);

    const del = await jsonReq('/api/strains/' + slug + '/media', 'DELETE', { id: last.id });
    record('MEDIA DELETE', del.status === 204, 'status ' + del.status);
  }

  /* ------------------------------------------------------------ delete --- */

  console.log('\nCLEANUP\n');
  const removed = await req('/api/strains/' + slug, { method: 'DELETE' });
  record('DELETE STRAIN', removed.status === 200 || removed.status === 204);
  record('DELETED STRAIN IS 404',
    (await req('/strains/' + slug, { headers: { cookie: 'ccc_age_ok=1' } })).status === 404);
}

/* ------------------------------------------------------------- inquiries --- */

console.log('\nINQUIRIES\n');
const badInq = await jsonReq('/api/inquiries', 'POST', { name: 'QA' });
record('INQUIRY VALIDATION (no phone)', badInq.status === 422);

const noName = await jsonReq('/api/inquiries', 'POST', { phone: '5105551234' });
record('INQUIRY VALIDATION (no name)', noName.status === 422);

// Notes are optional: name + phone alone must be accepted.
const minimal = await jsonReq('/api/inquiries', 'POST', { name: 'QA Minimal', phone: '5105550000' });
record('INQUIRY ACCEPTS NAME + PHONE ONLY', minimal.status === 201, 'status ' + minimal.status);

const goodInq = await jsonReq('/api/inquiries', 'POST', {
  name: 'QA Buyer', phone: '(510) 555-1234', strain: 'QA', message: 'QA notes'
});
record('INQUIRY STORAGE', goodInq.status === 201 && !!goodInq.json?.id);

const inqList = await req('/api/inquiries');
const stored = inqList.json?.find?.((x) => x.name === 'QA Buyer');
record('INQUIRY RETRIEVAL', !!stored);
record('INQUIRY KEEPS NOTES', stored?.message === 'QA notes');

if (stored) {
  const upd = await jsonReq('/api/inquiries/' + stored.id, 'PATCH', { status: 'REPLIED' });
  record('INQUIRY STATUS UPDATE', upd.status === 200);
}

const honey = await jsonReq('/api/inquiries', 'POST', {
  name: 'Bot', phone: '5105551234', company: 'spam'
});
const afterHoney = await req('/api/inquiries');
record('HONEYPOT DISCARDS BOT', honey.status === 201 && !afterHoney.json?.some?.((x) => x.name === 'Bot'));

/* ---------------------------------------------------------- resilience --- */

console.log('\nRESILIENCE\n');
const badJson = await req('/api/inquiries', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' }, body: 'not json'
});
record('MALFORMED JSON → 400 NOT 500', badJson.status === 400, 'status ' + badJson.status);
record('PATH TRAVERSAL IN SLUG → 404',
  (await jsonReq('/api/strains/..%2F..%2Fetc%2Fpasswd', 'PATCH', { name: 'x' })).status === 404);

const logout = await req('/api/auth', { method: 'DELETE' });
record('ADMIN LOGOUT', logout.status === 200);

/* -------------------------------------------------------------- summary --- */

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass);

console.log('\n' + '─'.repeat(56));
console.log('  ' + passed + '/' + results.length + ' passed');
if (failed.length) {
  console.log('\n  ' + r('FAILURES:'));
  for (const f of failed) console.log('    - ' + f.name + '  ' + f.detail);
}
console.log('─'.repeat(56) + '\n');

process.exit(failed.length ? 1 : 0);
