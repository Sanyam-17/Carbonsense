// Signed, expiring session tokens (HMAC-SHA-256 via Web Crypto; works in Node 20+ and the Edge runtime).
const enc = new TextEncoder()
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const key = s => crypto.subtle.importKey('raw', enc.encode(s), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify'])
export async function signSession(payload, secret) { const body = b64(enc.encode(JSON.stringify(payload))); return body + '.' + b64(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body))) }
export async function verifySession(token, secret, nowMs = Date.now()) {
  try {
    const [body, sig] = String(token).split('.'); if (!body || !sig) return false
    if (!(await crypto.subtle.verify('HMAC', await key(secret), unb64(sig), enc.encode(body)))) return false
    const p = JSON.parse(new TextDecoder().decode(unb64(body))); return typeof p.exp === 'number' && p.exp > nowMs
  } catch { return false }
}
export async function safeEqual(a, b) {
  const [x, y] = await Promise.all([a, b].map(async s => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(s))))))
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]; return d === 0
}
