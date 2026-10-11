import {ingest} from './ingest'
// Development simulator. Uses node id "sim-node-01", so the UI always labels it "Simulated", never "measured".
export function startSimulator() {
  const g = globalThis as any
  if (g.__csSim) return
  g.__csSim = setInterval(() => {
    const t = Date.now() / 1000
    ingest({version: 1, nodeId: 'sim-node-01', ts: new Date().toISOString(),
      environment: {co2Ppm: Math.round(640 + 90 * Math.sin(t / 40)), temperatureC: +(24 + Math.sin(t / 60)).toFixed(1), humidityPct: +(56 + 3 * Math.sin(t / 50)).toFixed(1)},
      occupancy: {motion: Math.sin(t / 30) > 0}, energy: {voltageV: 5, currentA: 0.2, powerW: 1}, flags: {co2Warmup: false}}).catch(e => console.error('simulator', e))
  }, 3000)
}
