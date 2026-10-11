import {requireAccess} from '@/lib/access'
import {recent} from '@/lib/ingest'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const denied = await requireAccess(req); if (denied) return denied
  const u = new URL(req.url), n = Math.min(500, Math.max(1, +(u.searchParams.get('limit') || 50)))
  return Response.json({rows: await recent(n, u.searchParams.get('node'))})
}
