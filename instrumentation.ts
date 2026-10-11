export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  ;(await import('./lib/env')).assertEnv()
  // Vercel functions do not provide durable local SQLite storage. Keep auth
  // and public pages bootable without a database; enable retention only when
  // an external LibSQL/Turso URL is explicitly configured.
  if (process.env.CARBONSENSE_DB_URL) (await import('./lib/retention')).startRetention()
  const sim = process.env.CARBONSENSE_SIMULATOR ?? (process.env.NODE_ENV === 'production' ? 'off' : 'on')
  if (sim !== 'off') (await import('./lib/simulator')).startSimulator()
}
