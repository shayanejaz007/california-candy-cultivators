# Media management

Supported formats: JPEG, PNG, WebP, AVIF, MP4 and WebM.

Recommended images: 1600–2400 px on the long edge, WebP/AVIF where practical. Keep images under 12 MB. Videos should be H.264 MP4 or WebM and under 50 MB.

With Supabase, the admin requests a short-lived signed upload and sends the file directly to Storage, avoiding serverless request-body limits. The server then records the uploaded object in `strain_media`.
