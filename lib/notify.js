/**
 * Outbound notification for new inquiries.
 *
 * Without this, an inquiry lands in the database and nobody is told. That is
 * the most expensive failure mode this site has: the entire public funnel ends
 * in a form, and a missed lead is a lost sale.
 *
 * Set INQUIRY_WEBHOOK_URL to a Zapier / Make / Slack / custom endpoint. If it
 * is unset the call is a no-op, so local development stays quiet.
 */
export async function notifyInquiry(inquiry) {
  const url = process.env.INQUIRY_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text:
          'New inquiry from ' + inquiry.name +
          ' about ' + inquiry.strain +
          ' — ' + inquiry.phone,
        inquiry: {
          id: inquiry.id,
          name: inquiry.name,
          phone: inquiry.phone,
          strain: inquiry.strain,
          message: inquiry.message,
          createdAt: inquiry.createdAt
        }
      })
    });
  } finally {
    clearTimeout(timeout);
  }
}
