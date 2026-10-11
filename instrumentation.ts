export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  ;(await import('./lib/env')).assertEnv()
  ;(await import('./lib/retention')).startRetention()
  const sim = process.env.CARBONSENSE_SIMULATOR ?? (process.env.NODE_ENV === 'production' ? 'off' : 'on')
  if (sim !== 'off') (await import('./lib/simulator')).startSimulator()
}
