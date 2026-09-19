import { NextResponse } from 'next/server';
import { DRIVER, healthCheck } from '@/lib/db';
import { inspectEnv } from '@/lib/env';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function classify(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();

  if (code === 'SUPABASE_ENV_MISSING' || message.includes('configuration is incomplete')) {
    return 'configuration_missing';
  }
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  ) {
    return 'schema_missing';
  }
  if (
    code === '401' ||
    message.includes('invalid api key') ||
    message.includes('jwt') ||
    message.includes('unauthorized')
  ) {
    return 'authentication_failed';
  }
  if (message.includes('fetch failed') || message.includes('network')) {
    return 'connection_failed';
  }
  return 'database_unavailable';
}

export async function GET() {
  const env = inspectEnv();

  /*
   * Detailed diagnostics are admin-only.
   *
   * This endpoint is unauthenticated by design — uptime monitors need it — but
   * the config block names which environment variables are missing, and
   * strainCount discloses catalogue size while the menu itself is gated.
   * Neither is dangerous on its own; neither is anyone else's business.
   */
  let detailed = false;
  try {
    detailed = await isAuthed();
  } catch {
    detailed = false;
  }

  try {
    const result = await healthCheck();
    return NextResponse.json(
      {
        ok: true,
        app: 'California Candy Cultivators',
        driver: DRIVER,
        database: 'ready',
        // The local file driver stores uploads on disk; Supabase uses a bucket.
        storage: DRIVER === 'file' ? 'local-disk' : (env.browserUploadsConfigured ? 'ready' : 'server-only'),
        adminReady: env.adminReady,
        // Names of misconfigured variables only — never their values, and
        // only for a signed-in admin.
        ...(detailed
          ? {
            strainCount: result.strainCount,
            config: { problems: env.problems, warnings: env.warnings }
          }
          : { configOk: env.problems.length === 0 }),
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  } catch (error) {
    const problem = classify(error);
    console.error('[health] database check failed', {
      problem,
      code: error?.code || error?.status || error?.name,
      message: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        ok: false,
        app: 'California Candy Cultivators',
        driver: DRIVER,
        database: 'unavailable',
        storage: 'unknown',
        adminReady: env.adminReady,
        problem,
        ...(detailed
          ? { config: { problems: env.problems, warnings: env.warnings } }
          : { configOk: env.problems.length === 0 }),
        timestamp: new Date().toISOString()
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}
