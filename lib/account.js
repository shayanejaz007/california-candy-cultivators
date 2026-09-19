import { getCustomerById } from './db';
import { customerIdFromCookie } from './customer-auth';

/**
 * Resolves the signed-in customer for the current request.
 *
 * The cookie only proves authenticity; approval is re-read from the database
 * every time. An admin who suspends an account must have that take effect on
 * the customer's very next request, not whenever their 30-day cookie happens
 * to expire.
 *
 * Never throws — a database outage must not turn into a 500 on a public page.
 *
 * @returns {Promise<{ customer: object|null, approved: boolean }>}
 */
export async function currentCustomer() {
  try {
    const id = await customerIdFromCookie();
    if (!id) return { customer: null, approved: false };

    const customer = await getCustomerById(id);
    if (!customer) return { customer: null, approved: false };

    return { customer, approved: customer.status === 'APPROVED' };
  } catch (err) {
    console.error('[account] lookup failed:', err?.message || err);
    return { customer: null, approved: false };
  }
}

/**
 * Teaser-safe projection of an upcoming drop.
 *
 * "Coming soon" stays public — it is what persuades people to request access —
 * but the full strain object was being serialised into the page payload, which
 * handed anonymous visitors the quantity, pricing, batch and SKU of unreleased
 * product. Only the marketing fields survive this.
 */
export function toTeaser(strain) {
  if (!strain) return null;
  return {
    slug: strain.slug,
    name: strain.name,
    parentA: strain.parentA,
    parentB: strain.parentB,
    teaser: strain.teaser,
    release: strain.release,
    status: strain.status,
    // Cover media only — never the full gallery.
    media: (strain.media || []).filter((m) => m.isCover).slice(0, 1)
  };
}
