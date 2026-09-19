/**
 * Age-gate cookie name.
 *
 * This lives in a plain module, not in AgeGate.js, on purpose. Exporting it
 * from a 'use client' file and importing it into a server component gives the
 * server a client-reference proxy rather than the string, so `cookies().get()`
 * silently looked up `undefined` and the gate reappeared on every page for
 * visitors who had already passed it.
 */
export const AGE_COOKIE = 'ccc_age_ok';
export const AGE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Whether this request may skip the age gate.
 *
 * Shared by the homepage and the strain pages. They previously disagreed: the
 * homepage forced the gate in development and honoured AGE_GATE_ALWAYS_SHOW,
 * while strain pages read only the cookie — so the gate appeared on one and not
 * the other in the same session.
 *
 * @param {{ get: (name: string) => { value?: string } | undefined } | null} jar
 */
export function isAgeVerified(jar) {
  const alwaysShow =
    process.env.NODE_ENV !== 'production' ||
    process.env.AGE_GATE_ALWAYS_SHOW === 'true';
  if (alwaysShow) return false;
  return jar?.get(AGE_COOKIE)?.value === '1';
}
