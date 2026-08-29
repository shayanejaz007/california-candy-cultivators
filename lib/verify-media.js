/**
 * Magic-byte validation for uploads.
 *
 * The upload route previously trusted `file.type`, which is the browser-
 * supplied Content-Type on a multipart part. It is entirely attacker-
 * controlled: any file can be posted with `image/jpeg` attached to it. Since
 * the stored object is then served back from our own origin, that is a stored
 * content-injection vector.
 *
 * The declared type is now treated as a claim and checked against the bytes.
 */

const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png':  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  'image/avif': (b) => ascii(b, 4, 8) === 'ftyp' && ascii(b, 8, 12).startsWith('avi'),
  'video/mp4':  (b) => ascii(b, 4, 8) === 'ftyp',
  'video/webm': (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3
};

function ascii(buf, start, end) {
  let out = '';
  for (let i = start; i < end && i < buf.length; i += 1) out += String.fromCharCode(buf[i]);
  return out;
}

export const ACCEPTED_MIME = Object.keys(SIGNATURES);

/**
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function verifyMediaBytes(buffer, declaredType) {
  if (!buffer || buffer.length < 12) {
    return { ok: false, error: 'That file is empty or truncated' };
  }
  const check = SIGNATURES[declaredType];
  if (!check) return { ok: false, error: 'Unsupported file type' };

  if (!check(buffer)) {
    return {
      ok: false,
      error: 'That file is not a real ' + declaredType.split('/')[1] + ' file'
    };
  }
  return { ok: true };
}
