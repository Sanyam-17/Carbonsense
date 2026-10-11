import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {verifySession} from '@/lib/session.mjs'
const PROTECTED = ['/rooms', '/room', '/device', '/house', '/analytics', '/env', '/scan', '/processing']
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  if (!PROTECTED.some(x => p === x || p.startsWith(x + '/'))) return NextResponse.next()
  const t = req.cookies.get('cs_session')?.value, s = process.env.CARBONSENSE_SESSION_SECRET
  if (t && s && (await verifySession(t, s, Date.now()))) return NextResponse.next()
  const u = req.nextUrl.clone(); u.pathname = '/login'; u.search = '?next=' + encodeURIComponent(p)
  return NextResponse.redirect(u)
}
export const config = {matcher: ['/((?!api|_next|favicon.ico).*)']}
