# Performance

Hero videos honor reduced motion and Save-Data logic in the supplied design. Strain images lazy-load where appropriate. Production media should be compressed before upload.

Direct-to-Supabase uploads keep large media out of Next.js serverless request bodies. Use a CDN-backed public Storage bucket and immutable caching for versioned media filenames.
