import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * File-backed data store.
 *
 * This is deliberately dependency-free so `npm install && npm run dev` works
 * with no database to provision. It persists to JSON on disk and serialises
 * writes through an in-process queue.
 *
 * It requires a writable filesystem and a single instance, which is fine for a
 * VPS, a container, or a small managed Node host. If you deploy to a serverless
 * platform or scale past one instance, swap the four exported read/write
 * primitives below for Postgres queries. Nothing else in the app touches disk.
 */

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const STORE = path.join(DATA_DIR, 'store.json');
const SEED = path.join(DATA_DIR, 'seed.json');

let chain = Promise.resolve();
let cache = null;

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(STORE, 'utf8'));
  } catch {
    const seed = JSON.parse(await fs.readFile(SEED, 'utf8'));
    cache = seed;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE, JSON.stringify(seed, null, 2));
  }
  cache.strains ||= [];
  cache.inquiries ||= [];
  cache.strains = cache.strains.map((s) => ({ pricing: [], media: [], ...s }));
  return cache;
}

async function persist(data) {
  cache = data;
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = STORE + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, STORE);
}

/** Run a mutation with exclusive access to the store. */
function transaction(fn) {
  const run = chain.then(async () => {
    const data = await load();
    const next = structuredClone(data);
    const result = await fn(next);
    await persist(next);
    return result;
  });
  chain = run.catch(() => {});
  return run;
}

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0);

/* ---------- reads ---------- */

export async function allStrains() {
  const d = await load();
  return structuredClone(d.strains).sort(bySort);
}

export async function publicMenu() {
  const all = await allStrains();
  return all.filter((s) => s.visible && s.status !== 'COMING SOON');
}

export async function comingSoon() {
  const all = await allStrains();
  return all.filter((s) => s.visible && s.status === 'COMING SOON');
}

export async function getStrain(slug) {
  const all = await allStrains();
  return all.find((s) => s.slug === slug) || null;
}

export async function allInquiries() {
  const d = await load();
  return structuredClone(d.inquiries).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/* ---------- writes ---------- */

const FIELDS = [
  'name', 'parentA', 'parentB', 'flavor', 'status', 'qty', 'visible',
  'featured', 'sort', 'batchName', 'batchNo', 'harvest', 'release', 'teaser',
  'aroma', 'appearance', 'cultivation', 'description', 'pricing'
];

function sanitise(input, base = {}) {
  const out = { ...base };
  for (const k of FIELDS) {
    if (!(k in input)) continue;
    let v = input[k];
    if (k === 'qty' || k === 'sort') {
      v = Number.parseInt(v, 10);
      v = Number.isFinite(v) ? Math.max(0, v) : 0;
    } else if (k === 'visible' || k === 'featured') {
      v = Boolean(v);
    } else if (k === 'flavor') {
      v = Array.isArray(v)
        ? v.map(String).slice(0, 12)
        : String(v).split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);
    } else if (k === 'pricing') {
      v = Array.isArray(v) ? v.slice(0, 12).map((x) => ({
        label: String(x?.label ?? '').trim().slice(0, 80),
        price: String(x?.price ?? '').trim().slice(0, 80)
      })).filter((x) => x.label || x.price) : [];
    } else {
      v = String(v ?? '').slice(0, 2000);
    }
    out[k] = v;
  }
  if (out.status && !['AVAILABLE', 'LOW STOCK', 'COMING SOON', 'SOLD OUT'].includes(out.status)) {
    out.status = 'AVAILABLE';
  }
  // Business rules the UI relies on.
  if (out.status === 'SOLD OUT' || out.status === 'COMING SOON') out.qty = 0;
  if (out.status === 'COMING SOON') out.featured = false;
  return out;
}

function slugify(name, taken) {
  const base = String(name || 'strain')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'strain';
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = base + '-' + n++;
  return slug;
}

export function createStrain(input) {
  return transaction((d) => {
    const taken = new Set(d.strains.map((s) => s.slug));
    const strain = sanitise(input, {
      slug: slugify(input.name, taken),
      flavor: [],
      status: 'COMING SOON',
      qty: 0,
      visible: true,
      featured: false,
      sort: d.strains.length,
      createdAt: new Date().toISOString(),
      pricing: [],
      media: []
    });
    d.strains.push(strain);
    return strain;
  });
}

export function updateStrain(slug, patch) {
  return transaction((d) => {
    const i = d.strains.findIndex((s) => s.slug === slug);
    if (i === -1) return null;
    d.strains[i] = sanitise(patch, d.strains[i]);
    // Only one strain can be featured.
    if (d.strains[i].featured) {
      d.strains = d.strains.map((s, j) => (j === i ? s : { ...s, featured: false }));
    }
    return d.strains[i];
  });
}

export function deleteStrain(slug) {
  return transaction((d) => {
    const before = d.strains.length;
    d.strains = d.strains.filter((s) => s.slug !== slug);
    return d.strains.length < before;
  });
}

export function reorderStrains(slugs) {
  return transaction((d) => {
    const order = new Map(slugs.map((s, i) => [s, i]));
    d.strains = d.strains.map((s) =>
      order.has(s.slug) ? { ...s, sort: order.get(s.slug) } : s
    );
    return true;
  });
}

export function createInquiry(input) {
  // Callers validate; this is the storage-level guarantee.
  if (!String(input.phone || '').trim()) {
    throw new Error('A phone number is required on every inquiry.');
  }
  return transaction((d) => {
    const inquiry = {
      id: 'inq-' + crypto.randomUUID(),
      name: String(input.name || '').slice(0, 120),
      phone: String(input.phone || '').slice(0, 60),
      strain: String(input.strain || 'General inquiry').slice(0, 120),
      message: String(input.message || '').slice(0, 4000),
      sourcePage: String(input.sourcePage || '').slice(0, 500),
      status: 'NEW',
      createdAt: new Date().toISOString()
    };
    d.inquiries.unshift(inquiry);
    return inquiry;
  });
}

export function updateInquiry(id, status) {
  return transaction((d) => {
    const i = d.inquiries.findIndex((x) => x.id === id);
    if (i === -1) return null;
    if (!['NEW', 'REPLIED', 'CLOSED'].includes(status)) return null;
    d.inquiries[i] = { ...d.inquiries[i], status };
    return d.inquiries[i];
  });
}


/**
 * Uploads are stored under DATA_DIR, never inside public/.
 *
 * Next resolves public/ from the build manifest, so a file written there at
 * runtime is served in `next dev` but silently 404s under `next start` — the
 * upload appeared to succeed and the image was then invisible on the site.
 * They are served through /api/media/[...path] instead.
 */
export const MEDIA_ROOT = () =>
  path.join(path.resolve(process.env.DATA_DIR || './data'), 'uploads');

const MEDIA_TYPES = new Set(['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']);
const MEDIA_EXT = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','video/mp4':'mp4','video/webm':'webm'};

export async function addStrainMedia(slug, input) {
  if (!MEDIA_TYPES.has(input.type)) throw new Error('Unsupported media type.');
  const filename = Date.now() + '-' + crypto.randomUUID() + '.' + MEDIA_EXT[input.type];
  const rel = path.join('strains', slug, filename);
  const disk = path.join(MEDIA_ROOT(), rel);
  await fs.mkdir(path.dirname(disk), { recursive: true });
  await fs.writeFile(disk, input.buffer);
  return transaction((d) => {
    const strain = d.strains.find((x) => x.slug === slug);
    if (!strain) return null;
    strain.media ||= [];
    const item = {
      id: 'media-' + crypto.randomUUID(),
      url: '/api/media/' + rel.split(path.sep).join('/'),
      type: input.type.startsWith('video/') ? 'video' : 'image',
      mimeType: input.type,
      alt: String(input.alt || '').slice(0, 200),
      caption: String(input.caption || '').slice(0, 500),
      sort: strain.media.length,
      isCover: strain.media.length === 0
    };
    strain.media.push(item);
    return item;
  });
}

export async function deleteStrainMedia(slug, mediaId) {
  let fileToDelete = null;
  const ok = await transaction((d) => {
    const strain = d.strains.find((x) => x.slug === slug);
    if (!strain) return false;
    strain.media ||= [];
    const item = strain.media.find((x) => x.id === mediaId);
    if (!item) return false;
    fileToDelete = item.url;
    const wasCover = item.isCover;
    strain.media = strain.media.filter((x) => x.id !== mediaId);
    if (wasCover && strain.media[0]) strain.media[0].isCover = true;
    return true;
  });
  if (ok && fileToDelete?.startsWith('/api/media/')) {
    const disk = path.join(MEDIA_ROOT(), fileToDelete.slice('/api/media/'.length));
    await fs.unlink(disk).catch(() => {});
  }
  return ok;
}

export function setCoverStrainMedia(slug, mediaId) {
  return transaction((d) => {
    const strain = d.strains.find((x) => x.slug === slug);
    if (!strain) return false;
    strain.media ||= [];
    if (!strain.media.some((x) => x.id === mediaId)) return false;
    strain.media = strain.media.map((x) => ({ ...x, isCover: x.id === mediaId }));
    return true;
  });
}

export async function createStrainMediaUpload() { return null; }
export async function completeStrainMediaUpload() { return null; }


/** Development/local-driver health check. */
export async function healthCheck() {
  const data = await load();
  return { ok: true, strainCount: data.strains?.length || 0 };
}
