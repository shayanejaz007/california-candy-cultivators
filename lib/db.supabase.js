import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { secretKey, serverUrl } from './supabase-env.js';

let client;
const BUCKET = 'strain-media';
const STRAIN_SELECT = '*, strain_media(*)';

function conn() {
  if (client) return client;
  const url = serverUrl();
  const key = secretKey();
  if (!url || !key) {
    const missing = [];
    if (!url) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');
    const error = new Error('Supabase server configuration is incomplete: ' + missing.join(', '));
    error.code = 'SUPABASE_ENV_MISSING';
    throw error;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return client;
}

function sanitisePricing(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((x) => ({
    label: String(x?.label ?? '').trim().slice(0, 80),
    price: String(x?.price ?? '').trim().slice(0, 80)
  })).filter((x) => x.label || x.price);
}

function mediaToApp(r) {
  return {
    id: r.id,
    url: r.public_url,
    type: r.media_type,
    mimeType: r.mime_type,
    alt: r.alt_text,
    caption: r.caption,
    sort: r.sort,
    isCover: r.is_cover
  };
}

function toApp(r) {
  const media = (r.strain_media || []).map(mediaToApp).sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return (a.sort ?? 0) - (b.sort ?? 0);
  });
  return {
    slug: r.slug,
    name: r.name,
    parentA: r.parent_a,
    parentB: r.parent_b,
    flavor: r.flavor || [],
    status: r.status,
    qty: r.qty,
    visible: r.visible,
    featured: r.featured,
    sort: r.sort,
    batchName: r.batch_name,
    batchNo: r.batch_no,
    harvest: r.harvest,
    release: r.release_label,
    teaser: r.teaser,
    aroma: r.aroma,
    appearance: r.appearance,
    cultivation: r.cultivation,
    description: r.description,
    pricing: sanitisePricing(r.pricing),
    media
  };
}

const COLUMN = {
  name: 'name', parentA: 'parent_a', parentB: 'parent_b', flavor: 'flavor',
  status: 'status', qty: 'qty', visible: 'visible', featured: 'featured', sort: 'sort',
  batchName: 'batch_name', batchNo: 'batch_no', harvest: 'harvest', release: 'release_label',
  teaser: 'teaser', aroma: 'aroma', appearance: 'appearance', cultivation: 'cultivation',
  description: 'description', pricing: 'pricing'
};

function toRow(input) {
  const row = {};
  for (const [appKey, column] of Object.entries(COLUMN)) {
    if (!(appKey in input)) continue;
    let v = input[appKey];
    if (appKey === 'qty' || appKey === 'sort') {
      const n = Number.parseInt(v, 10);
      v = Number.isFinite(n) ? Math.max(0, n) : 0;
    } else if (appKey === 'visible' || appKey === 'featured') {
      v = Boolean(v);
    } else if (appKey === 'flavor') {
      v = Array.isArray(v) ? v.map(String).slice(0, 12) : String(v).split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);
    } else if (appKey === 'pricing') {
      v = sanitisePricing(v);
    } else {
      v = String(v ?? '').slice(0, 4000);
    }
    row[column] = v;
  }
  return row;
}

const inquiryToApp = (r) => ({
  id: r.id, name: r.name, phone: r.phone, strain: r.strain,
  message: r.message, status: r.status, sourcePage: r.source_page,
  createdAt: r.created_at
});

function slugify(name) {
  return String(name || 'strain').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'strain';
}

async function audit(action, entityType, entityId, metadata = {}) {
  const { error } = await conn().from('audit_logs').insert({
    action, entity_type: entityType, entity_id: String(entityId || ''), metadata
  });
  if (error) console.error('[audit]', error.message);
}

export async function allStrains() {
  const { data, error } = await conn().from('strains').select(STRAIN_SELECT).order('sort');
  if (error) throw error;
  return data.map(toApp);
}

export async function publicMenu() {
  const { data, error } = await conn().from('strains').select(STRAIN_SELECT)
    .eq('visible', true).neq('status', 'COMING SOON').order('sort');
  if (error) throw error;
  return data.map(toApp);
}

export async function comingSoon() {
  const { data, error } = await conn().from('strains').select(STRAIN_SELECT)
    .eq('visible', true).eq('status', 'COMING SOON').order('sort');
  if (error) throw error;
  return data.map(toApp);
}

export async function getStrain(slug) {
  const { data, error } = await conn().from('strains').select(STRAIN_SELECT).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? toApp(data) : null;
}

export async function allInquiries() {
  const { data, error } = await conn().from('inquiries').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(inquiryToApp);
}

export async function createStrain(input) {
  const { count } = await conn().from('strains').select('*', { count: 'exact', head: true });
  const row = { ...toRow(input), slug: slugify(input.name), sort: count ?? 0 };
  let result = await conn().from('strains').insert(row).select('*').single();
  if (result.error?.code === '23505') {
    row.slug += '-' + Date.now().toString().slice(-5);
    result = await conn().from('strains').insert(row).select('*').single();
  }
  if (result.error) throw result.error;
  await audit('create', 'strain', result.data.id, { slug: result.data.slug });
  return toApp(result.data);
}

export async function updateStrain(slug, patch) {
  const row = toRow(patch);
  if (!Object.keys(row).length) return getStrain(slug);
  const { data, error } = await conn().from('strains').update(row).eq('slug', slug).select('id').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  await audit('update', 'strain', data.id, { slug, fields: Object.keys(row) });
  return getStrain(slug);
}

export async function deleteStrain(slug) {
  const { data: row } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (!row) return false;
  const { data: media } = await conn().from('strain_media').select('storage_path').eq('strain_id', row.id);
  const { error } = await conn().from('strains').delete().eq('id', row.id);
  if (error) throw error;
  if (media?.length) {
    const cleanup = await conn().storage.from(BUCKET).remove(media.map((m) => m.storage_path));
    if (cleanup.error) console.error('[media cleanup]', cleanup.error.message);
  }
  await audit('delete', 'strain', row.id, { slug });
  return true;
}

export async function reorderStrains(slugs) {
  const { error } = await conn().rpc('reorder_strains', { slugs });
  if (error) throw error;
  await audit('reorder', 'strain', '', { slugs });
  return true;
}

export async function createInquiry(input) {
  if (!String(input.phone || '').trim()) throw new Error('A phone number is required on every inquiry.');
  const { data, error } = await conn().from('inquiries').insert({
    name: String(input.name || '').slice(0, 120),
    phone: String(input.phone || '').slice(0, 60),
    strain: String(input.strain || 'General inquiry').slice(0, 120),
    message: String(input.message || '').slice(0, 4000),
    source_page: String(input.sourcePage || '').slice(0, 500)
  }).select().single();
  if (error) throw error;
  return inquiryToApp(data);
}

export async function updateInquiry(id, status) {
  if (!['NEW', 'REPLIED', 'CLOSED'].includes(status)) return null;
  const { data, error } = await conn().from('inquiries').update({ status }).eq('id', id).select().maybeSingle();
  if (error) throw error;
  if (data) await audit('status', 'inquiry', id, { status });
  return data ? inquiryToApp(data) : null;
}

const MIME_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
  'video/mp4': 'mp4', 'video/webm': 'webm'
};


export async function createStrainMediaUpload(slug, input) {
  const ext = MIME_EXT[input.type];
  if (!ext) throw new Error('Unsupported media type.');
  const { data: strain, error } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!strain) return null;
  const path = `${slug}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { data, error: signError } = await conn().storage.from(BUCKET).createSignedUploadUrl(path);
  if (signError) throw signError;
  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function completeStrainMediaUpload(slug, input) {
  if (!MIME_EXT[input.type]) throw new Error('Unsupported media type.');
  if (!String(input.path || '').startsWith(slug + '/')) throw new Error('Invalid media path.');
  const { data: strain, error } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!strain) return null;
  const { data: existing, error: existingError } = await conn().from('strain_media').select('id').eq('strain_id', strain.id);
  if (existingError) throw existingError;
  const { data: publicData } = conn().storage.from(BUCKET).getPublicUrl(input.path);
  const { data, error: insertError } = await conn().from('strain_media').insert({
    strain_id: strain.id,
    storage_path: input.path,
    public_url: publicData.publicUrl,
    media_type: input.type.startsWith('video/') ? 'video' : 'image',
    mime_type: input.type,
    alt_text: String(input.alt || '').slice(0, 200),
    caption: String(input.caption || '').slice(0, 500),
    sort: existing?.length || 0,
    is_cover: !existing?.length
  }).select().single();
  if (insertError) throw insertError;
  await audit('media_add', 'strain', strain.id, { mediaId: data.id });
  return mediaToApp(data);
}

export async function addStrainMedia(slug, input) {
  const ext = MIME_EXT[input.type];
  if (!ext) throw new Error('Unsupported media type.');
  const { data: strain, error: strainError } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (strainError) throw strainError;
  if (!strain) return null;

  const storagePath = `${slug}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await conn().storage.from(BUCKET).upload(storagePath, input.buffer, {
    contentType: input.type, cacheControl: '31536000', upsert: false
  });
  if (uploadError) throw uploadError;

  const { data: existing } = await conn().from('strain_media').select('id').eq('strain_id', strain.id);
  const isCover = !existing?.length;
  const { data: publicData } = conn().storage.from(BUCKET).getPublicUrl(storagePath);
  const { data, error } = await conn().from('strain_media').insert({
    strain_id: strain.id,
    storage_path: storagePath,
    public_url: publicData.publicUrl,
    media_type: input.type.startsWith('video/') ? 'video' : 'image',
    mime_type: input.type,
    alt_text: String(input.alt || '').slice(0, 200),
    caption: String(input.caption || '').slice(0, 500),
    sort: existing?.length || 0,
    is_cover: isCover
  }).select().single();
  if (error) {
    await conn().storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  await audit('media_add', 'strain', strain.id, { mediaId: data.id });
  return mediaToApp(data);
}

export async function deleteStrainMedia(slug, mediaId) {
  const { data: strain } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (!strain) return false;
  const { data: media, error } = await conn().from('strain_media').select('*')
    .eq('id', mediaId).eq('strain_id', strain.id).maybeSingle();
  if (error) throw error;
  if (!media) return false;
  await conn().storage.from(BUCKET).remove([media.storage_path]);
  const { error: delError } = await conn().from('strain_media').delete().eq('id', media.id);
  if (delError) throw delError;
  if (media.is_cover) {
    const { data: next } = await conn().from('strain_media').select('id').eq('strain_id', strain.id).order('sort').limit(1).maybeSingle();
    if (next) await conn().from('strain_media').update({ is_cover: true }).eq('id', next.id);
  }
  await audit('media_delete', 'strain', strain.id, { mediaId });
  return true;
}

export async function setCoverStrainMedia(slug, mediaId) {
  const { data: strain } = await conn().from('strains').select('id').eq('slug', slug).maybeSingle();
  if (!strain) return false;
  const { data: media } = await conn().from('strain_media').select('id').eq('id', mediaId).eq('strain_id', strain.id).maybeSingle();
  if (!media) return false;
  await conn().from('strain_media').update({ is_cover: false }).eq('strain_id', strain.id);
  const { error } = await conn().from('strain_media').update({ is_cover: true }).eq('id', mediaId);
  if (error) throw error;
  return true;
}


/** Lightweight server-side connectivity check used by /api/health. */
export async function healthCheck() {
  const { count, error } = await conn()
    .from('strains')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return { ok: true, strainCount: count ?? 0 };
}
