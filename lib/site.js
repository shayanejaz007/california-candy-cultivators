/**
 * Return a safe canonical origin.
 *
 * Vercel environment variables are often entered as a bare hostname. `new URL()`
 * rejects that shape, which can crash metadata rendering before the page itself
 * gets a chance to render. Normalize it here and always retain a safe fallback.
 */
export function siteUrl() {
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '';

  let raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000');

  raw = String(raw || '').trim().replace(/\/+$/, '');

  if (raw && !/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  try {
    return new URL(raw).origin;
  } catch (error) {
    console.error('[siteUrl] Invalid NEXT_PUBLIC_SITE_URL; using platform fallback.', {
      message: error instanceof Error ? error.message : String(error)
    });

    if (vercelHost) return `https://${vercelHost}`;
    return 'http://localhost:3000';
  }
}

export const SITE_NAME = 'California Candy Cultivators';
