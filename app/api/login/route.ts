import {signSession, safeEqual} from '@/lib/session.mjs'
export const runtime = 'nodejs'
const tries: Map<string, number[]> = ((globalThis as any).__csLogin ??= new Map())
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim(), now = Date.now()
  const a = (tries.get(ip) || []).filter(t => now - t < 60000); a.push(now); tries.set(ip, a)
  if (a.length > 5) return Response.json({error: 'too many attempts, wait a minute'}, {status: 429})
  const pw = process.env.CARBONSENSE_ACCESS_PASSWORD, secret = process.env.CARBONSENSE_SESSION_SECRET
  if (!pw || !secret) return Response.json({error: 'server not configured'}, {status: 503})
  let body: any; try { body = await req.json() } catch { return Response.json({error: 'bad request'}, {status: 400}) }
  if (typeof body?.password !== 'string' || !(await safeEqual(body.password, pw))) return Response.json({error: 'invalid password'}, {status: 401})
  const token = await signSession({exp: now + 7 * 864e5}, secret)
  const secure = process.env.NODE_ENV === 'production'
  // Secure HTTPS previews are embedded cross-site; local HTTP keeps Lax so the
  // cookie remains usable without Secure on a developer machine.
  const sameSite = secure ? 'None' : 'Lax'
  return new Response(JSON.stringify({ok: true}), {headers: {'content-type': 'application/json', 'set-cookie': `cs_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=604800${secure ? '; Secure' : ''}`}})
}
export async function DELETE() { return new Response(null, {status: 204, headers: {'set-cookie': 'cs_session=; Path=/; HttpOnly; Max-Age=0'}}) }
