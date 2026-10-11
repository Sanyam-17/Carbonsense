import {eq} from 'drizzle-orm'
import {db, ready} from '@/lib/db'
import {devices} from '@/lib/schema'
import {requireAccess} from '@/lib/access'
const MODES = ['metered', 'estimated', 'simulated', 'unavailable'], CHANNELS = ['power', 'environment']
// Persistent device <-> telemetry mapping. Metered devices must name a node and a channel.
export async function PATCH(req: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await requireAccess(req); if (denied) return denied
  let b: any; try { b = await req.json() } catch { return Response.json({error: 'bad json'}, {status: 400}) }
  const set: Record<string, unknown> = {}
  if ('meteringMode' in b) { if (!MODES.includes(b.meteringMode)) return Response.json({error: 'meteringMode invalid'}, {status: 400}); set.meteringMode = b.meteringMode }
  if ('channel' in b) { if (b.channel !== null && !CHANNELS.includes(b.channel)) return Response.json({error: 'channel invalid'}, {status: 400}); set.channel = b.channel }
  if ('nodeId' in b) { if (b.nodeId !== null && !/^[a-z0-9][a-z0-9-]{2,39}$/.test(String(b.nodeId))) return Response.json({error: 'nodeId invalid'}, {status: 400}); set.nodeId = b.nodeId }
  if ('ratedPowerW' in b) { if (b.ratedPowerW !== null && !(typeof b.ratedPowerW === 'number' && b.ratedPowerW >= 0 && b.ratedPowerW <= 10000)) return Response.json({error: 'ratedPowerW invalid'}, {status: 400}); set.ratedPowerW = b.ratedPowerW }
  if (!Object.keys(set).length) return Response.json({error: 'nothing to update'}, {status: 400})
  await ready
  const id = (await params).id, [cur] = await db.select().from(devices).where(eq(devices.id, id))
  if (!cur) return Response.json({error: 'not found'}, {status: 404})
  const next: any = {...cur, ...set}
  if (next.meteringMode === 'metered' && (!next.nodeId || !next.channel)) return Response.json({error: 'metered devices need nodeId and channel'}, {status: 400})
  await db.update(devices).set(set).where(eq(devices.id, id))
  return Response.json({device: next})
}
