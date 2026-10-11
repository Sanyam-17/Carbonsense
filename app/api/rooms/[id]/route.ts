import {client, ready} from '@/lib/db'
import {requireAccess} from '@/lib/access'
export const dynamic = 'force-dynamic'
export async function GET(req: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await requireAccess(req); if (denied) return denied
  await ready
  const r = (await client.execute({sql: 'SELECT id,name,version,normalized,updated_at FROM rooms WHERE id=?', args: [(await params).id]})).rows[0] as any
  if (!r) return Response.json({error: 'not found'}, {status: 404})
  return Response.json({id: r.id, name: r.name, version: r.version, updatedAt: r.updated_at, room: r.normalized ? JSON.parse(r.normalized) : null})
}
