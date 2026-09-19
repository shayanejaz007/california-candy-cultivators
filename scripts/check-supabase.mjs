#!/usr/bin/env node
/**
 * Supabase preflight.
 *
 * Run this BEFORE deploying: it catches the four things that actually go wrong
 * — missing vars, wrong key, schema not applied, bucket not created — and tells
 * you which one, instead of leaving you staring at demo data in production.
 *
 *   node --env-file=.env.local scripts/check-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ok = (m) => console.log('  \x1b[32mPASS\x1b[0m ' + m);

/**
 * Supabase errors are plain objects, so String(err) renders "[object Object]"
 * and hides the only useful information. Pull the fields out explicitly.
 */
function describe(e) {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  const parts = [];
  if (e.message) parts.push(e.message);
  if (e.code) parts.push('code=' + e.code);
  if (e.details) parts.push('details=' + e.details);
  if (e.hint) parts.push('hint=' + e.hint);
  if (!parts.length) {
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return parts.join(' | ');
}

/** Maps a Postgres/PostgREST error to the action that actually fixes it. */
function diagnose(e, table) {
  const msg = describe(e);
  const code = String(e?.code || '');

  if (code === '42501' || /permission denied/i.test(msg)) {
    return {
      why: 'permission denied on ' + table + ' — the API role has no GRANT',
      fix: 'Run supabase/fix-permissions.sql in the SQL Editor.'
    };
  }
  if (code === 'PGRST205' || code === '42P01' || /does not exist|schema cache/i.test(msg)) {
    return {
      why: table + ' does not exist',
      fix: 'Run supabase/schema.sql in the SQL Editor.'
    };
  }
  if (/JWT|api key|Unauthorized|401/i.test(msg)) {
    return {
      why: 'the key was rejected',
      fix: 'Copy the service_role / sb_secret key from Project Settings → API.'
    };
  }
  if (/fetch failed|network|ENOTFOUND|ETIMEDOUT/i.test(msg)) {
    return { why: 'could not reach the project', fix: 'Check SUPABASE_URL and your connection.' };
  }
  return { why: msg, fix: null };
}
const bad = (m) => console.log('  \x1b[31mFAIL\x1b[0m ' + m);
const info = (m) => console.log('  \x1b[2m' + m + '\x1b[0m');

let failed = false;
const fail = (m) => { bad(m); failed = true; };

console.log('\nSupabase preflight\n');

console.log('1. Environment');
if (url) ok('URL  ' + url); else fail('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL is not set');
if (secret) ok('secret key present (' + secret.slice(0, 12) + '…)');
else fail('SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY is not set — admin writes cannot work');
if (publicKey) ok('public key present (' + publicKey.slice(0, 16) + '…)');
else info('no public key — browser media uploads will be unavailable');

if (secret && /^(sb_publishable_|eyJ.*anon)/.test(secret)) {
  fail('the secret key looks like a PUBLIC key — writes will be blocked by RLS');
}
if (publicKey && publicKey.startsWith('sb_secret_')) {
  fail('a SECRET key is in a NEXT_PUBLIC_ variable — it would ship to every browser. Rotate it now.');
}

if (!url || !secret) {
  console.log('\nStopping: cannot connect without a URL and a secret key.\n');
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false } });

console.log('\n2. Identity');
try {
  const { data, error } = await db.rpc('whoami');
  if (error) throw error;
  if (data?.current_user === 'service_role') {
    ok('key maps to database role: service_role');
  } else {
    fail('key maps to role "' + data?.current_user + '", expected service_role');
    info('→ SUPABASE_SECRET_KEY is not a secret key. Project Settings → API.');
  }
  if (data && data.can_insert_strains === false) {
    fail('this role cannot INSERT into strains');
    info('→ Run supabase/fix-permissions.sql in the SQL Editor.');
  }
} catch (e) {
  const msg = describe(e);
  if (/whoami|PGRST202|does not exist/i.test(msg)) {
    info('role check skipped — run supabase/fix-permissions.sql to enable it');
  } else {
    info('role check unavailable: ' + msg);
  }
}

console.log('\n3. Database');
try {
  const { error, count } = await db.from('strains').select('*', { count: 'exact', head: true });
  if (error) throw error;
  ok('strains table reachable (' + count + ' rows)');
  if (count === 0) info('empty — run supabase/seed.sql for starter strains');
} catch (e) {
  const d = diagnose(e, 'strains');
  fail(d.why);
  if (d.fix) info('→ ' + d.fix);
}

try {
  const { error } = await db.from('strain_media').select('id', { head: true, count: 'exact' });
  if (error) throw error;
  ok('strain_media table reachable');
} catch (e) {
  const d = diagnose(e, 'strain_media');
  fail(d.why);
  if (d.fix) info('→ ' + d.fix);
}

console.log('\n4. Storage');
try {
  const { data, error } = await db.storage.listBuckets();
  if (error) throw error;
  if (data.some((b) => b.name === 'strain-media')) ok('strain-media bucket exists');
  else fail('strain-media bucket missing — run supabase/schema.sql (it creates the bucket)');
} catch (e) {
  fail('could not list buckets: ' + describe(e));
}

console.log('\n5. Write test');
try {
  const slug = 'preflight-' + Date.now();
  const { error: insErr } = await db.from('strains').insert({ slug, name: 'Preflight', visible: false });
  if (insErr) throw insErr;
  await db.from('strains').delete().eq('slug', slug);
  ok('insert + delete succeeded — the admin can save prices');
} catch (e) {
  const d = diagnose(e, 'strains');
  fail('write failed — ' + d.why);
  if (d.fix) info('→ ' + d.fix);
}

console.log(
  failed
    ? '\n\x1b[31mNot ready.\x1b[0m Fix the failures above, then re-run.\n'
    : '\n\x1b[32mReady.\x1b[0m Set DATA_DRIVER=supabase and deploy.\n'
);
process.exit(failed ? 1 : 0);
