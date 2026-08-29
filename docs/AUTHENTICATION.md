# Authentication

Admin access uses a long `ADMIN_PASSWORD` and an HMAC-signed, HttpOnly session cookie. Sessions expire after 12 hours and are bound to a fingerprint of the current password, so rotating the password invalidates existing sessions.

Production requires a strong password and a random `SESSION_SECRET` of at least 32 characters. Generate one with `npm run secret`.
