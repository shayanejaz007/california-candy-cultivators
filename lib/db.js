/**
 * Data-driver selector.
 *
 *   supabase  (default)  Production. Postgres + Storage.
 *   file                 Local development only. JSON on disk under DATA_DIR.
 *                        Refused on serverless hosts, where the filesystem is
 *                        ephemeral and every edit would be lost on redeploy.
 *
 * Demo mode has been removed. It defaulted on whenever DATA_DRIVER was unset,
 * so a single missing environment variable in production served a fabricated
 * catalogue to real customers while the admin reported that edits had saved.
 * There is no silent fallback any more: if the database is unreachable the
 * error propagates to the route's error boundary and the operator sees a
 * failure, rather than a plausible-looking fake menu.
 *
 * Drivers are imported lazily. A static import here could throw during module
 * evaluation on Vercel — before any route's own error handling ran — which
 * surfaced as the opaque "Server Components render" error.
 */

const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const requested = String(process.env.DATA_DRIVER || 'supabase').trim().toLowerCase();

if (!['supabase', 'file'].includes(requested)) {
  throw new Error(
    `DATA_DRIVER must be "supabase" or "file" (received "${requested}"). ` +
      'Demo mode no longer exists.'
  );
}

if (requested === 'file' && serverless) {
  throw new Error(
    'DATA_DRIVER=file cannot be used on a serverless host: the filesystem is ' +
      'ephemeral, so every strain, price, inquiry and upload would be lost on ' +
      'redeploy. Set DATA_DRIVER=supabase.'
  );
}

export const DRIVER = requested;

let driverPromise;

function loadDriver() {
  driverPromise ||=
    DRIVER === 'supabase' ? import('./db.supabase.js') : import('./db.file.js');
  return driverPromise;
}

async function call(method, args) {
  const driver = await loadDriver();
  return driver[method](...args);
}

export const allStrains = (...a) => call('allStrains', a);
export const publicMenu = (...a) => call('publicMenu', a);
export const comingSoon = (...a) => call('comingSoon', a);
export const getStrain = (...a) => call('getStrain', a);
export const allInquiries = (...a) => call('allInquiries', a);

export const createStrain = (...a) => call('createStrain', a);
export const updateStrain = (...a) => call('updateStrain', a);
export const deleteStrain = (...a) => call('deleteStrain', a);
export const reorderStrains = (...a) => call('reorderStrains', a);
export const createInquiry = (...a) => call('createInquiry', a);
export const updateInquiry = (...a) => call('updateInquiry', a);
export const addStrainMedia = (...a) => call('addStrainMedia', a);
export const deleteStrainMedia = (...a) => call('deleteStrainMedia', a);
export const setCoverStrainMedia = (...a) => call('setCoverStrainMedia', a);
export const createStrainMediaUpload = (...a) => call('createStrainMediaUpload', a);
export const completeStrainMediaUpload = (...a) => call('completeStrainMediaUpload', a);

export const healthCheck = (...a) => call('healthCheck', a);
