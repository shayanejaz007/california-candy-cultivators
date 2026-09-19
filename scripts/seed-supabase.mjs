#!/usr/bin/env node
/**
 * Demo data seeder and end-to-end connection test.
 *
 *   node --env-file=.env.local scripts/seed-supabase.mjs
 *   node --env-file=.env.local scripts/seed-supabase.mjs --verify https://yoursite.com
 *   node --env-file=.env.local scripts/seed-supabase.mjs --clean
 *   node scripts/seed-supabase.mjs --sql > supabase/demo-seed.sql
 *
 * --verify is the one that answers "is the database actually wired to the
 * site?". It inserts a strain with a unique name, asks the LIVE site for its
 * pages, checks the name and its price are in the returned HTML, then deletes
 * it. If that passes, the site is reading from this database — there is no way
 * to fake it, because the name did not exist anywhere until a second ago.
 */

// NOTE: this seeds clearly-marked DEMO rows for testing a fresh database.
// It is a development tool, not part of the running application — the app no
// longer has a demo mode. Remove the rows with --clean before launch.

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valueOf = (f) => {
  const i = args.indexOf(f);
  return i === -1 ? null : args[i + 1];
};

const g = (s) => '\x1b[32m' + s + '\x1b[0m';
const r = (s) => '\x1b[31m' + s + '\x1b[0m';
const dim = (s) => '\x1b[2m' + s + '\x1b[0m';
const ok = (m) => console.log('  ' + g('PASS') + ' ' + m);
const bad = (m) => console.log('  ' + r('FAIL') + ' ' + m);
const note = (m) => console.log('  ' + dim(m));

/* ---------------------------------------------------------------- data --- */

/**
 * Every row is prefixed DEMO so it is obvious in the admin panel and
 * impossible to mistake for real inventory. `--clean` removes exactly these.
 */
const DEMO_PREFIX = 'demo-';

const STRAINS = [
  {
    slug: 'demo-gelato-41', name: 'DEMO Gelato 41',
    parent_a: 'Sunset Sherbet', parent_b: 'Thin Mint GSC',
    flavor: ['Sweet', 'Creamy', 'Gas'],
    status: 'AVAILABLE', qty: 42, visible: true, featured: true, sort: 0,
    batch_name: 'Candy Room 04', batch_no: 'DEMO-G41-0426', harvest: 'Apr 2026',
    aroma: 'Sherbet, cold cream, faint diesel',
    appearance: 'Dense, purple-shot, heavy frost',
    cultivation: 'Indoor, 9-week flower, hand-trimmed, 14-day slow cure',
    description: 'DEMO DATA — sample listing to confirm the database is connected. Not real inventory.',
    pricing: [
      { label: 'Eighth', price: '$45' },
      { label: 'Quarter', price: '$85' },
      { label: 'Ounce', price: '$280' },
      { label: 'Pound', price: 'Contact for wholesale' }
    ]
  },
  {
    slug: 'demo-candy-paint', name: 'DEMO Candy Paint',
    parent_a: 'Zkittlez', parent_b: 'Grape Gas',
    flavor: ['Berry', 'Sugar', 'Fuel'],
    status: 'AVAILABLE', qty: 28, visible: true, featured: false, sort: 1,
    batch_name: 'Candy Room 05', batch_no: 'DEMO-CDP-0426', harvest: 'Apr 2026',
    aroma: 'Crushed berry, solvent, violet',
    appearance: 'Glossy, deep violet bracts',
    cultivation: 'Indoor, 10-week flower, single-plant selection',
    description: 'DEMO DATA — sample listing to confirm the database is connected. Not real inventory.',
    pricing: [
      { label: 'Eighth', price: '$50' },
      { label: 'Ounce', price: '$320' }
    ]
  },
  {
    slug: 'demo-sherbhead', name: 'DEMO Sherbhead',
    parent_a: "Sherbinski's Mint", parent_b: 'Headband',
    flavor: ['Citrus', 'Mint', 'Pine'],
    status: 'LOW STOCK', qty: 6, visible: true, featured: false, sort: 2,
    batch_name: 'Candy Room 03', batch_no: 'DEMO-SHB-0326', harvest: 'Mar 2026',
    aroma: 'Lime peel, mint, resin',
    appearance: 'Spear-shaped, pale green, long pistils',
    cultivation: 'Indoor, 9-week flower, low-stress trained',
    description: 'DEMO DATA — tests the LOW STOCK badge. Not real inventory.',
    pricing: [{ label: 'Eighth', price: '$40' }, { label: 'Ounce', price: '$250' }]
  },
  {
    slug: 'demo-peach-ringz', name: 'DEMO Peach Ringz',
    parent_a: 'Peach Ozz', parent_b: 'Runtz',
    flavor: ['Stonefruit', 'Sugar', 'Cream'],
    status: 'SOLD OUT', qty: 0, visible: true, featured: false, sort: 3,
    batch_name: 'Candy Room 02', batch_no: 'DEMO-PRZ-0226', harvest: 'Feb 2026',
    aroma: 'Peach skin, sugar, whipped cream',
    appearance: 'Round, orange-haired, sticky',
    cultivation: 'Indoor, 9-week flower, small 12-plant run',
    description: 'DEMO DATA — tests the SOLD OUT state. Not real inventory.',
    pricing: []
  },
  {
    slug: 'demo-sunset-rntz', name: 'DEMO Sunset Rntz',
    parent_a: 'Runtz', parent_b: 'Sunset Sherbet',
    flavor: ['Tropical', 'Gas', 'Vanilla'],
    status: 'COMING SOON', qty: 0, visible: true, featured: false, sort: 4,
    batch_name: 'Candy Room 06', batch_no: 'DEMO-SRZ-0526', harvest: 'May 2026',
    release_label: 'May 2026',
    teaser: 'DEMO DATA — tests the upcoming drops section.',
    aroma: 'Mango, vanilla bean, faint gas',
    appearance: 'Chunky, cream-coloured trichome cover',
    cultivation: 'Indoor, 10-week flower, currently in cure',
    description: 'DEMO DATA — tests the COMING SOON state. Not real inventory.',
    pricing: []
  }
];

const INQUIRIES = [
  {
    name: 'DEMO — R. Alvarez', phone: '+1 (415) 555-0114',
    email: 'demo@example.com', strain: 'DEMO Gelato 41',
    message: 'DEMO DATA — sample inquiry to confirm the inquiries table works.',
    status: 'NEW', source_page: '/strains/demo-gelato-41'
  },
  {
    name: 'DEMO — Sunset Collective', phone: '+1 (707) 555-0188',
    email: 'demo2@example.com', strain: 'DEMO Candy Paint',
    message: 'DEMO DATA — second sample inquiry, marked replied.',
    status: 'REPLIED', source_page: '/strains/demo-candy-paint'
  }
];

/* ----------------------------------------------------------- sql output --- */

const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const arr = (a) => 'array[' + a.map(q).join(',') + ']::text[]';

if (has('--sql')) {
  console.log('-- DEMO DATA. Every row is prefixed DEMO and slugged demo-*.');
  console.log('-- Remove with:  delete from public.strains where slug like \'demo-%\';');
  console.log();
  for (const s of STRAINS) {
    const cols = ['slug', 'name', 'parent_a', 'parent_b', 'flavor', 'status', 'qty',
      'visible', 'featured', 'sort', 'batch_name', 'batch_no', 'harvest',
      'release_label', 'teaser', 'aroma', 'appearance', 'cultivation',
      'description', 'pricing'];
    const vals = [
      q(s.slug), q(s.name), q(s.parent_a), q(s.parent_b), arr(s.flavor),
      q(s.status), s.qty, s.visible, s.featured, s.sort, q(s.batch_name),
      q(s.batch_no), q(s.harvest), q(s.release_label || ''), q(s.teaser || ''),
      q(s.aroma), q(s.appearance), q(s.cultivation), q(s.description),
      q(JSON.stringify(s.pricing)) + '::jsonb'
    ];
    console.log(
      'insert into public.strains (' + cols.join(',') + ') values (' +
      vals.join(',') + ') on conflict (slug) do nothing;'
    );
  }
  console.log();
  for (const i of INQUIRIES) {
    console.log(
      'insert into public.inquiries (name,phone,email,strain,message,status,source_page) values (' +
      [q(i.name), q(i.phone), q(i.email), q(i.strain), q(i.message), q(i.status), q(i.source_page)].join(',') +
      ');'
    );
  }
  process.exit(0);
}

/* -------------------------------------------------------------- connect --- */

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.log('\n' + r('Missing credentials.') + '\n');
  console.log('  Needs SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
  console.log('  Run with:  node --env-file=.env.local scripts/seed-supabase.mjs\n');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const db = createClient(url, secret, { auth: { persistSession: false } });

let failed = false;
const fail = (m) => { bad(m); failed = true; };

/* ---------------------------------------------------------------- clean --- */

if (has('--clean')) {
  console.log('\nRemoving demo data\n');
  const { error: e1, count: c1 } = await db
    .from('strains').delete({ count: 'exact' }).like('slug', DEMO_PREFIX + '%');
  if (e1) fail('strains: ' + e1.message); else ok('removed ' + (c1 ?? 0) + ' demo strains');

  const { error: e2, count: c2 } = await db
    .from('inquiries').delete({ count: 'exact' }).like('name', 'DEMO —%');
  if (e2) fail('inquiries: ' + e2.message); else ok('removed ' + (c2 ?? 0) + ' demo inquiries');

  console.log(failed ? '\n' + r('Some rows could not be removed.') + '\n' : '\n' + g('Clean.') + '\n');
  process.exit(failed ? 1 : 0);
}

/* ----------------------------------------------------------------- seed --- */

console.log('\nSeeding demo data\n');

const { error: strainErr } = await db
  .from('strains')
  .upsert(STRAINS, { onConflict: 'slug' });

if (strainErr) {
  fail('strains: ' + strainErr.message);
  if (/does not exist|schema cache/i.test(strainErr.message)) {
    note('The strains table is missing — run supabase/schema.sql first.');
  }
} else {
  ok(STRAINS.length + ' demo strains inserted');
  note('AVAILABLE ×2, LOW STOCK ×1, SOLD OUT ×1, COMING SOON ×1 — one of each state');
  note('DEMO Gelato 41 carries four pricing tiers, including a wholesale line');
}

const { data: existingInq } = await db
  .from('inquiries').select('id').like('name', 'DEMO —%').limit(1);

if (existingInq?.length) {
  ok('demo inquiries already present, skipped');
} else {
  const { error: inqErr } = await db.from('inquiries').insert(INQUIRIES);
  if (inqErr) fail('inquiries: ' + inqErr.message);
  else ok(INQUIRIES.length + ' demo inquiries inserted');
}

const { count } = await db.from('strains').select('*', { count: 'exact', head: true });
note('strains table now holds ' + count + ' rows total');

/* --------------------------------------------------------------- verify --- */

const target = valueOf('--verify');

if (target) {
  const base = target.replace(/\/+$/, '');
  console.log('\nEnd-to-end check against ' + base + '\n');

  // A name that cannot possibly be cached, hardcoded, or coincidental.
  const stamp = Date.now().toString(36).toUpperCase();
  const probeSlug = 'demo-probe-' + stamp.toLowerCase();
  const probeName = 'DEMO PROBE ' + stamp;
  const probePrice = '$' + (100 + (Date.now() % 800));

  const { error: probeErr } = await db.from('strains').insert({
    slug: probeSlug,
    name: probeName,
    parent_a: 'Connection', parent_b: 'Test',
    flavor: ['Probe'],
    status: 'AVAILABLE', qty: 1, visible: true, featured: false, sort: 999,
    description: 'Temporary row written by seed-supabase.mjs. Deleted automatically.',
    pricing: [{ label: 'Probe tier', price: probePrice }]
  });

  if (probeErr) {
    fail('could not write probe row: ' + probeErr.message);
  } else {
    ok('wrote probe strain "' + probeName + '" with price ' + probePrice);

    const get = async (path) => {
      try {
        const res = await fetch(base + path, {
          headers: { cookie: 'ccc_age_ok=1' },
          cache: 'no-store'
        });
        return { status: res.status, body: await res.text() };
      } catch (e) {
        return { status: 0, body: '', error: e.message };
      }
    };

    // 1. health
    const health = await get('/api/health');
    if (health.status !== 200) {
      fail('/api/health returned ' + (health.status || health.error));
    } else {
      let h = {};
      try { h = JSON.parse(health.body); } catch { /* ignore */ }
      if (h.driver === 'supabase' && h.database === 'ready' && h.demo === false) {
        ok('/api/health reports driver=supabase, database=ready, demo=false');
      } else {
        fail('/api/health says driver=' + h.driver + ', database=' + h.database + ', demo=' + h.demo);
        note('The site is not using this database. Check DATA_DRIVER and redeploy.');
      }
    }

    // 2. homepage carries the probe
    const home = await get('/');
    if (home.status !== 200) fail('homepage returned ' + (home.status || home.error));
    else if (home.body.includes(probeName)) ok('homepage menu shows the probe strain');
    else fail('homepage did NOT show the probe strain — site is not reading this database');

    // 3. detail page carries the probe price
    const detail = await get('/strains/' + probeSlug);
    if (detail.status !== 200) {
      fail('/strains/' + probeSlug + ' returned ' + (detail.status || detail.error));
    } else {
      if (detail.body.includes(probeName)) ok('strain detail page renders');
      else fail('strain detail page did not contain the probe name');

      if (detail.body.includes(probePrice)) ok('admin-set price ' + probePrice + ' is live on the page');
      else fail('price ' + probePrice + ' did not appear — pricing is not reaching the page');
    }

    // 4. always clean up the probe
    const { error: delErr } = await db.from('strains').delete().eq('slug', probeSlug);
    if (delErr) note('could not delete probe row ' + probeSlug + ' — remove it manually');
    else ok('probe row deleted');
  }
}

/* --------------------------------------------------------------- report --- */

if (failed) {
  console.log('\n' + r('Something is wrong.') + ' See the failures above.\n');
  process.exit(1);
}

console.log('\n' + g('Done.') + '\n');
if (!target) {
  console.log('  Open your site — you should see DEMO strains with prices on the menu.');
  console.log('  Prove the site is really reading the database:');
  console.log(dim('    node --env-file=.env.local scripts/seed-supabase.mjs --verify https://yoursite.com'));
}
console.log('  Remove all demo rows when finished:');
console.log(dim('    node --env-file=.env.local scripts/seed-supabase.mjs --clean') + '\n');
