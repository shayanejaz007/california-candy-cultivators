import { addStrainMedia, deleteStrainMedia, setCoverStrainMedia } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { verifyMediaBytes } from '@/lib/verify-media';

export const dynamic = 'force-dynamic';
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']);
const MAX_IMAGE = 12 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export async function POST(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  let form;
  try { form = await request.formData(); } catch { return Response.json({ error: 'Invalid upload' }, { status: 400 }); }
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return Response.json({ error: 'Choose an image or video' }, { status: 422 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: 'Unsupported file type' }, { status: 415 });
  const max = file.type.startsWith('video/') ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) return Response.json({ error: `File is too large. Maximum ${Math.round(max / 1024 / 1024)}MB.` }, { status: 413 });
  const buffer = Buffer.from(await file.arrayBuffer());

  // file.type is a client-supplied claim. Check the actual bytes before we
  // store something that will later be served from our own origin.
  const verified = verifyMediaBytes(buffer, file.type);
  if (!verified.ok) return Response.json({ error: verified.error }, { status: 415 });

  try {
    const media = await addStrainMedia(slug, {
      type: file.type,
      buffer,
      alt: String(form.get('alt') || ''),
      caption: String(form.get('caption') || '')
    });
    if (!media) return Response.json({ error: 'Strain not found' }, { status: 404 });
    return Response.json(media, { status: 201 });
  } catch (err) {
    console.error('[media upload]', err);
    return Response.json({ error: 'Could not upload media' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.id) return Response.json({ error: 'Media id is required' }, { status: 422 });
  const ok = await deleteStrainMedia(slug, String(body.id));
  return ok ? new Response(null, { status: 204 }) : Response.json({ error: 'Media not found' }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.id || body.action !== 'cover') return Response.json({ error: 'Invalid media action' }, { status: 422 });
  const ok = await setCoverStrainMedia(slug, String(body.id));
  return ok ? Response.json({ ok: true }) : Response.json({ error: 'Media not found' }, { status: 404 });
}
