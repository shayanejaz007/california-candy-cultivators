# Inquiry system

Visitors provide name and phone; email is optional. The form includes a hidden honeypot and API rate limits. The source page is stored with the inquiry.

`INQUIRY_WEBHOOK_URL` can forward new inquiries to an automation/notification service. Webhook failure never causes the visitor submission itself to fail.
