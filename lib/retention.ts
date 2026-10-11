import {client, ready} from './db'
import {retentionDays} from './config'
export function startRetention() {
  const g = globalThis as any; if (g.__csRet) return
  const run = async () => {
    try {
      await ready
      const r = await client.execute({sql: 'DELETE FROM telemetry WHERE received_at < ?', args: [new Date(Date.now() - retentionDays() * 864e5).toISOString()]})
      await client.execute({sql: 'DELETE FROM rejections WHERE received_at < ?', args: [new Date(Date.now() - 30 * 864e5).toISOString()]})
      if (r.rowsAffected) console.log(JSON.stringify({evt: 'retention', deleted: r.rowsAffected}))
    } catch (e) { console.error('retention failed', e) }
  }
  g.__csRet = setInterval(run, 36e5); run()
}
