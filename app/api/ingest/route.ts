import {authOk} from '@/lib/node-auth'
import {ingest, reject} from '@/lib/ingest'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const MAX = 8192
const hits: Map<string, number[]> = ((globalThis as any).__csRl ??= new Map())
const limited = (id: string) => { const now = Date.now(), a = (hits.get(id) || []).filter(t => now - t < 10000); a.push(now); hits.set(id, a); return a.length > 20 }
const json = (status: number, body: object) => Response.json(body, {status})

export async function POST(req: Request) {
  if (+(req.headers.get('content-length') || 0) > MAX) return json(413, {error: 'payload too large'})
  const text = await req.text()
  if (text.length > MAX) return json(413, {error: 'payload too large'})
  let body: any
  try { body = JSON.parse(text) } catch { await reject(null, 'bad_json'); return json(400, {error: 'bad_json'}) }
  const nodeId = typeof body?.nodeId === 'string' ? body.nodeId : null
  if (!authOk(nodeId, req.headers.get('x-node-key'))) { await reject(nodeId, 'unauthorized'); return json(401, {error: 'unauthorized'}) }
  if (limited(nodeId as string)) return json(429, {error: 'rate limited'})
  const r = await ingest(body)
  if (!r.ok) { await reject(nodeId, 'invalid: ' + r.errors.join('; ')); return json(400, {error: 'invalid', details: r.errors}) }
  return json(200, {ok: true, stored: r.stored, duplicate: r.duplicate})
}
