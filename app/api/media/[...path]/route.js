import fs from 'node:fs/promises';
import path from 'node:path';
import { MEDIA_ROOT } from '@/lib/db.file';

/**
 * Serves locally-stored uploads (DATA_DRIVER=file).
 *
 * Uploads cannot live in public/ — Next resolves that directory from the build
 * manifest, so anything written there at runtime 404s under `next start`.
 *
 * On DATA_DRIVER=supabase this route is unused: media is served straight from
 * the Storage bucket's own public URL.
 */
export const dynamic = 'force-dynamic';

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm'
};

// Generated names only: <timestamp>-<uuid>.<ext>. Anything else is refused
// before it reaches the filesystem.
const SEGMENT = /^[A-Za-z0-9._-]+$/;
const FILENAME = /^\d+-[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif|mp4|webm)$/i;

export async function GET(_request, { params }) {
  const { path: segments } = await params;

  if (!Array.isArray(segments) || segments.length < 2 || segments.length > 4) {
    return new Response('Not found', { status: 404 });
  }
  // Reject traversal, separators and encoded variants outright.
  if (!segments.every((s) => SEGMENT.test(s) && s !== '.' && s !== '..')) {
    return new Response('Not found', { status: 404 });
  }
  if (!FILENAME.test(segments[segments.length - 1])) {
    return new Response('Not found', { status: 404 });
  }

  const root = MEDIA_ROOT();
  const target = path.join(root, ...segments);

  // Defence in depth: after normalisation the path must still sit under root.
  if (!target.startsWith(root + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  let bytes;
  try {
    bytes = await fs.readFile(target);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const ext = segments[segments.length - 1].split('.').pop().toLowerCase();

  return new Response(bytes, {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': String(bytes.length),
      // Filenames are unique per upload and never reused.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline'
    }
  });
}
