import { completeStrainMediaUpload, DRIVER } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Direct-to-storage uploads bypass our byte check, so the bucket's own
// allowed_mime_types (set in schema.sql) is the enforcement point. This list
// must stay in step with it.
const ALLOWED_COMPLETE = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'
]);

export async function POST(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (DRIVER !== 'supabase') return Response.json({ error: 'Not available for this data driver' }, { status: 409 });
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.path || !body.type) return Response.json({ error: 'Upload metadata is incomplete' }, { status: 422 });
  if (!ALLOWED_COMPLETE.has(body.type)) return Response.json({ error: 'Unsupported file type' }, { status: 415 });
  try {
    const media = await completeStrainMediaUpload(slug, body);
    return media ? Response.json(media, { status: 201 }) : Response.json({ error: 'Strain not found' }, { status: 404 });
  } catch (err) {
    console.error('[media complete]', err);
    return Response.json({ error: 'Could not attach uploaded media' }, { status: 500 });
  }
}
