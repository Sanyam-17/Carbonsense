import {hasAccess} from '@/lib/access'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return Response.json({authenticated: await hasAccess(req)}, {
    headers: {'cache-control': 'private, no-store'},
  })
}
