import {createHash, randomUUID} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {client, ready} from '@/lib/db'
import {requireAccess} from '@/lib/access'
import {inspectGlb, normalizeRoom, GLB_MAX_BYTES} from '@/lib/glb.mjs'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const err = (status: number, error: string) => Response.json({error}, {status})

// Upload a GLB. Only steps that actually ran are reported. The result is "awaiting_review": no semantic recognition is performed.
export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await requireAccess(req); if (denied) return denied
  const roomId = (await params).id
  if (!/^[a-z0-9-]{3,40}$/.test(roomId)) return err(400, 'invalid room id')
  if (+(req.headers.get('content-length') || 0) > GLB_MAX_BYTES + 65536) return err(413, 'file exceeds the 50 MB limit')
  let form: FormData; try { form = await req.formData() } catch { return err(400, 'expected multipart form data') }
  const file = form.get('file'), units = String(form.get('units') || 'm')
  if (!(file instanceof File)) return err(400, 'file field missing')
  if (file.size > GLB_MAX_BYTES) return err(413, 'file exceeds the 50 MB limit')
  const buf = Buffer.from(await file.arrayBuffer()), steps = ['uploaded']
  const info = inspectGlb(buf); if (!info.ok) return err(400, info.error)
  steps.push('validated', 'parsed')
  let room; try { room = normalizeRoom(info, {id: roomId, units}) } catch (e: any) { return err(400, e.message) }
  steps.push('dimensions extracted')
  await ready
  const sha = createHash('sha256').update(buf).digest('hex'), dir = path.join(process.env.CARBONSENSE_DATA_DIR || 'data', 'models', roomId)
  await mkdir(dir, {recursive: true}); await writeFile(path.join(dir, `${sha}.glb`), buf) // original preserved on disk, not in the database
  const now = new Date().toISOString(), modelId = randomUUID()
  const cur = (await client.execute({sql: 'SELECT version FROM rooms WHERE id=?', args: [roomId]})).rows[0] as any
  room.version = (cur?.version ?? 0) + 1
  await client.execute({sql: 'INSERT INTO rooms(id,name,version,normalized,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version, normalized=excluded.normalized, updated_at=excluded.updated_at', args: [roomId, room.name, room.version, JSON.stringify(room), now]})
  await client.execute({sql: 'INSERT INTO room_models(id,room_id,sha256,bytes,source,status,meta,created_at) VALUES(?,?,?,?,?,?,?,?)', args: [modelId, roomId, sha, buf.length, 'glb', 'awaiting_review', JSON.stringify({units, meshCount: info.meshCount, primitiveCount: info.primitiveCount}), now]})
  return Response.json({status: 'awaiting_review', steps, modelId, dimensions: {length: room.derived.length, width: room.derived.width, height: room.height}, room})
}
