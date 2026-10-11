// Bench utility: POST one telemetry sample. Defaults to node "sim-bench-01" so it shows as SIMULATED.
// Using a real node id (e.g. room-node-01) will show as "measured", so only do that for pipeline bench tests and delete local.db afterwards.
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1] }
const body = {version: 1, nodeId: get('node', 'sim-bench-01'), ts: new Date().toISOString(),
  environment: {co2Ppm: +get('co2', 650), temperatureC: +get('temp', 24.2), humidityPct: +get('hum', 56)},
  occupancy: {motion: get('motion', 'true') === 'true'}, energy: {voltageV: +get('v', 5), currentA: +get('a', 0.2), powerW: +get('w', 1)}, flags: {co2Warmup: get('warmup', 'false') === 'true'}}
const r = await fetch(get('url', 'http://localhost:3000/api/ingest'), {method: 'POST', headers: {'content-type': 'application/json', 'x-node-key': get('key', 'bench-dev-key')}, body: JSON.stringify(body)})
console.log(r.status, await r.text())
