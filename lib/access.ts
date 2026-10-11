import {verifySession} from './session.mjs'
export const COOKIE = 'cs_session'
export async function hasAccess(req: Request) {
  const c = (req.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))
  const secret = process.env.CARBONSENSE_SESSION_SECRET
  return !!c && !!secret && verifySession(decodeURIComponent(c.slice(COOKIE.length + 1)), secret, Date.now())
}
// Single-owner access check (stand-in for requireHomeAccess until multi-user auth in Phase 8). Fails closed.
export async function requireAccess(req: Request) { return (await hasAccess(req)) ? null : Response.json({error: 'unauthorized'}, {status: 401}) }
