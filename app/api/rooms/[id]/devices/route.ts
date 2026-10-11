import {eq} from 'drizzle-orm'
import {db, ready} from '@/lib/db'
import {devices} from '@/lib/schema'
import {requireAccess} from '@/lib/access'
export const dynamic = 'force-dynamic'
export async function GET(req: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await requireAccess(req); if (denied) return denied
  await ready
  return Response.json({devices: await db.select().from(devices).where(eq(devices.roomId, (await params).id))})
}
