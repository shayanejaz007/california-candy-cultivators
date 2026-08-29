import { createStrainMediaUpload, DRIVER } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']);
const MAX_IMAGE = 12 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export async function POST(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (DRIVER !== 'supabase') return Response.json({ error: 'Direct upload is only used with Supabase' }, { status: 409 });
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (!ALLOWED.has(body.type)) return Response.json({ error: 'Unsupported file type' }, { status: 415 });
  const max = body.type.startsWith('video/') ? MAX_VIDEO : MAX_IMAGE;
  if (!Number.isFinite(body.size) || body.size <= 0 || body.size > max) return Response.json({ error: `File must be under ${Math.round(max/1024/1024)}MB` }, { status: 413 });
  const signed = await createStrainMediaUpload(slug, { type: body.type });
  return signed ? Response.json(signed) : Response.json({ error: 'Strain not found' }, { status: 404 });
}
