import {requireAccess} from '@/lib/access'
import {bus, latestAll} from '@/lib/ingest'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const denied = await requireAccess(req); if (denied) return denied
  const enc = new TextEncoder()
  let off = () => {}, hb: any
  const stream = new ReadableStream({
    async start(c) {
      const send = (m: object) => c.enqueue(enc.encode(`event: telemetry\ndata: ${JSON.stringify(m)}\n\n`))
      for (const m of await latestAll()) send(m) // snapshot: latest row per node, with server receipt time so the client can judge freshness
      bus.on('t', send); off = () => bus.off('t', send)
      hb = setInterval(() => c.enqueue(enc.encode(': hb\n\n')), 15000)
      req.signal.addEventListener('abort', () => { off(); clearInterval(hb); try { c.close() } catch {} })
    },
    cancel() { off(); clearInterval(hb) },
  })
  return new Response(stream, {headers: {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive'}})
}
