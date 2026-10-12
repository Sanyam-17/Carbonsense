import {EventEmitter} from 'node:events'
import {client, db, ready} from './db'
import {nodes, rejections, telemetry} from './schema'
import {roomFor, isSim} from './config'
import {validateTelemetry} from './core.mjs'

export const bus: EventEmitter = ((globalThis as any).__csBus ??= new EventEmitter())
const pick = (o: any, keys: string[]) => (o ? Object.fromEntries(keys.map(k => [k, o[k] ?? null])) : null)

export function rowToMsg(r: any) {
  const has = (...v: any[]) => v.some(x => x != null)
  return {
    nodeId: r.node_id, roomId: r.room_id, source: r.source, observedAt: r.observed_at, receivedAt: r.received_at,
    environment: has(r.co2_ppm, r.temperature_c, r.humidity_pct) ? {co2Ppm: r.co2_ppm, temperatureC: r.temperature_c, humidityPct: r.humidity_pct} : null,
    occupancy: r.motion == null ? null : {motion: !!r.motion},
    energy: has(r.voltage_v, r.current_a, r.power_w) ? {voltageV: r.voltage_v, currentA: r.current_a, powerW: r.power_w} : null,
    flags: JSON.parse(r.flags),
  }
}

// The single business-logic entry point. HTTP, the simulator and (later) MQTT all call this.
export async function ingest(raw: unknown, now = new Date()) {
  const v = validateTelemetry(raw, now.getTime())
  if (!v.ok) return {ok: false as const, errors: v.errors}
  await ready
  const t = v.value, receivedAt = now.toISOString(), roomId = roomFor(t.nodeId), source = isSim(t.nodeId) ? 'simulated' : 'measured'
  if (!roomId) return {ok: false as const, errors: ['node is not mapped to an authorized room']}
  // Drizzle 0.38 omits nullable SQLite columns from the inferred insert type;
  // the database schema and runtime contract intentionally preserve nulls.
  const row = {
    nodeId: t.nodeId, roomId, observedAt: t.ts, receivedAt, source,
    co2Ppm: t.environment?.co2Ppm ?? null, temperatureC: t.environment?.temperatureC ?? null, humidityPct: t.environment?.humidityPct ?? null,
    motion: t.occupancy?.motion ?? null, voltageV: t.energy?.voltageV ?? null, currentA: t.energy?.currentA ?? null, powerW: t.energy?.powerW ?? null,
    flags: JSON.stringify(t.flags),
  }
  const previous = await client.execute({sql: 'SELECT MAX(observed_at) AS observed_at FROM telemetry WHERE node_id=?', args: [t.nodeId]})
  const previousObserved = previous.rows[0]?.observed_at as string | null | undefined
  const res: any = await db.insert(telemetry).values(row as any).onConflictDoNothing()
  const stored = res.rowsAffected > 0
  if (stored) {
    // History is retained, but the node health snapshot advances only when
    // this sample is newer than the latest observed measurement.
    if (!previousObserved || t.ts > previousObserved) {
      await db.insert(nodes).values({id: t.nodeId, roomId, lastSeen: receivedAt}).onConflictDoUpdate({target: nodes.id, set: {roomId, lastSeen: receivedAt}})
    }
    bus.emit('t', {nodeId: t.nodeId, roomId, source, observedAt: t.ts, receivedAt, environment: pick(t.environment, ['co2Ppm', 'temperatureC', 'humidityPct']), occupancy: t.occupancy, energy: pick(t.energy, ['voltageV', 'currentA', 'powerW']), flags: t.flags})
  }
  return {ok: true as const, stored, duplicate: !stored}
}

export async function reject(nodeId: string | null, reason: string) {
  await ready
  await db.insert(rejections).values({nodeId, reason: reason.slice(0, 200), receivedAt: new Date().toISOString()} as any)
  console.warn(JSON.stringify({evt: 'ingest_rejected', nodeId, reason: reason.slice(0, 200)}))
}
export async function latestAll() { await ready; return (await client.execute('SELECT t.* FROM telemetry t JOIN (SELECT node_id, MAX(observed_at) AS observed_at FROM telemetry GROUP BY node_id) x ON x.node_id=t.node_id AND x.observed_at=t.observed_at')).rows.map(rowToMsg) }
export async function recent(limit: number, nodeId?: string | null) {
  await ready
  const r = nodeId ? await client.execute({sql: 'SELECT * FROM telemetry WHERE node_id=? ORDER BY id DESC LIMIT ?', args: [nodeId, limit]}) : await client.execute({sql: 'SELECT * FROM telemetry ORDER BY id DESC LIMIT ?', args: [limit]})
  return r.rows.map(rowToMsg)
}
