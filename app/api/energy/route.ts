import {client, ready} from '@/lib/db'
import {requireAccess} from '@/lib/access'
import {integrateEnergy, carbonKg, dayStartMs} from '@/lib/core.mjs'
import {emissionFactor, homeTz, sampleIntervalS, retentionDays} from '@/lib/config'
export const dynamic = 'force-dynamic'
const SPAN: Record<string, number> = {hour: 36e5, week: 7 * 864e5, month: 30 * 864e5}
// Energy and carbon from METERED power only. Estimated devices are excluded, gaps are reported, and carbon needs a configured, documented factor.
export async function GET(req: Request) {
  const denied = await requireAccess(req); if (denied) return denied
  const u = new URL(req.url), room = u.searchParams.get('room') || 'room-204', range = u.searchParams.get('range') || 'day', now = Date.now(), tz = homeTz()
  const from = range === 'day' ? dayStartMs(tz, now) : SPAN[range] ? now - SPAN[range] : NaN
  if (!Number.isFinite(from)) return Response.json({error: 'range must be hour, day, week or month'}, {status: 400})
  await ready
  const r = await client.execute({sql: "SELECT node_id, observed_at, power_w FROM telemetry WHERE room_id=? AND source='measured' AND power_w IS NOT NULL AND observed_at>=? ORDER BY node_id, observed_at", args: [room, new Date(from).toISOString()]})
  const by = new Map<string, {ts: number; powerW: number}[]>()
  for (const x of r.rows as any[]) { const a = by.get(x.node_id) || []; a.push({ts: Date.parse(x.observed_at), powerW: x.power_w}); by.set(x.node_id, a) }
  let kWh = 0, covered = 0, samples = 0; const gaps: any[] = []
  for (const [node, s] of by) { const e = integrateEnergy(s, {intervalS: sampleIntervalS()}); kWh += e.kWh; covered += e.coveredSeconds; samples += s.length; gaps.push(...e.gaps.map(g => ({node, ...g}))) }
  const ef = emissionFactor()
  return Response.json({
    room, range, tz, from: new Date(from).toISOString(), to: new Date(now).toISOString(), retentionDays: retentionDays(),
    measured: {kWh, coveredSeconds: covered, samples, gapCount: gaps.length, gaps: gaps.slice(0, 20)}, estimated: null,
    carbon: ef ? {factorKgPerKWh: ef.factor, source: ef.source, validFrom: ef.validFrom, kgCO2e: carbonKg(kWh, ef.factor)} : null,
    notes: ['Metered power only; estimated devices are not included.', 'Raw telemetry is retained for retentionDays; longer ranges are partial until rollups exist.', ef ? 'Emission factor from configuration.' : 'No emission factor configured, so carbon is not calculated.'],
  })
}
