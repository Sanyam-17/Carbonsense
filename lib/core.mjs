// Pure, dependency-free telemetry logic shared by ingest, simulator and browser. Unit-tested in test/.
export const LIMITS = {co2Ppm: [300, 5000], temperatureC: [-20, 60], humidityPct: [0, 100], voltageV: [0, 30], currentA: [0, 3.2], powerW: [0, 96]}
export const FRESH = {environment: 30, power: 10} // seconds; adjust with the publishing interval
const isNum = v => typeof v === 'number' && Number.isFinite(v)

// Returns {ok:true,value} or {ok:false,errors}. Out-of-range values reject the whole payload; null/missing means "sensor unavailable".
export function validateTelemetry(b, nowMs = Date.now()) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return {ok: false, errors: ['body must be an object']}
  const errors = [], flags = {co2Warmup: false, clockSkew: false, powerMismatch: false}
  if (b.version !== 1) errors.push('version must be 1')
  if (typeof b.nodeId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,39}$/.test(b.nodeId)) errors.push('nodeId invalid')
  const t = typeof b.ts === 'string' ? Date.parse(b.ts) : NaN
  if (!Number.isFinite(t)) errors.push('ts must be ISO-8601')
  else if (Math.abs(nowMs - t) > 300000) flags.clockSkew = true
  const section = (name, keys) => {
    const s = b[name]; if (s == null) return null
    if (typeof s !== 'object' || Array.isArray(s)) { errors.push(name + ' must be an object'); return null }
    const out = {}
    for (const k of keys) { const x = s[k]; if (x == null) continue; const [lo, hi] = LIMITS[k]; if (!isNum(x) || x < lo || x > hi) errors.push(`${name}.${k} out of range [${lo},${hi}]`); else out[k] = x }
    return out
  }
  const environment = section('environment', ['co2Ppm', 'temperatureC', 'humidityPct'])
  const energy = section('energy', ['voltageV', 'currentA', 'powerW'])
  let occupancy = null
  if (b.occupancy != null) { if (typeof b.occupancy?.motion === 'boolean') occupancy = {motion: b.occupancy.motion}; else if (b.occupancy.motion != null) errors.push('occupancy.motion must be boolean') }
  if (b.flags?.co2Warmup != null) { if (typeof b.flags.co2Warmup === 'boolean') flags.co2Warmup = b.flags.co2Warmup; else errors.push('flags.co2Warmup must be boolean') }
  const count = o => o ? Object.keys(o).length : 0
  if (!errors.length && count(environment) + count(energy) + (occupancy ? 1 : 0) === 0) errors.push('no measurements present')
  if (energy && isNum(energy.voltageV) && isNum(energy.currentA) && isNum(energy.powerW)) {
    const p = energy.voltageV * energy.currentA
    if (Math.abs(energy.powerW - p) > Math.max(0.5, 0.25 * p)) flags.powerMismatch = true
  }
  if (errors.length) return {ok: false, errors}
  return {ok: true, value: {version: 1, nodeId: b.nodeId, ts: new Date(t).toISOString(), environment: count(environment) ? environment : null, occupancy, energy: count(energy) ? energy : null, flags}}
}

// 'live' within the threshold, 'stale' up to 4x, then 'offline'. Never show stale as live.
export function freshness(ageS, kind = 'environment') {
  if (!isNum(ageS) || ageS < 0) return 'unavailable'
  const th = FRESH[kind]
  return ageS <= th ? 'live' : ageS <= th * 4 ? 'stale' : 'offline'
}

// Trapezoidal energy. Gaps longer than 3x the sampling interval are NOT interpolated; they are reported.
export function integrateEnergy(samples, {intervalS = 5} = {}) {
  const ok = samples.filter(s => isNum(s.ts) && isNum(s.powerW) && s.powerW >= 0)
  const dropped = samples.length - ok.length
  ok.sort((a, b) => a.ts - b.ts)
  const u = []; let duplicates = 0
  for (const s of ok) { if (u.length && u[u.length - 1].ts === s.ts) { duplicates++; continue } u.push(s) }
  let wh = 0, coveredSeconds = 0; const gaps = []
  for (let i = 1; i < u.length; i++) {
    const dt = (u[i].ts - u[i - 1].ts) / 1000
    if (dt > 3 * intervalS) { gaps.push({from: u[i - 1].ts, to: u[i].ts, seconds: dt}); continue }
    wh += (u[i].powerW + u[i - 1].powerW) / 2 * dt / 3600; coveredSeconds += dt
  }
  return {wh, kWh: wh / 1000, coveredSeconds, gaps, dropped, duplicates}
}

export function carbonKg(kWh, factorKgPerKWh) {
  if (!isNum(kWh) || !isNum(factorKgPerKWh) || kWh < 0 || factorKgPerKWh < 0) throw new Error('invalid energy or emission factor')
  return kWh * factorKgPerKWh
}

// Start of "today" in the home's timezone (UTC ms). Edge case: a DST change inside the day can shift this by an hour.
export function dayStartMs(tz, nowMs = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'}).formatToParts(new Date(nowMs)).reduce((o, x) => (o[x.type] = x.value, o), {})
  const offset = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(nowMs / 1000) * 1000
  return Date.UTC(+p.year, +p.month - 1, +p.day) - offset
}
// PIR = motion only, never a head count. Holds "recent motion" for holdS seconds after the last motion sample.
export function occupancyState(lastMotionMs, nowMs, holdS = 300) {
  if (!lastMotionMs) return 'no motion seen'
  return (nowMs - lastMotionMs) / 1000 <= holdS ? 'recent motion' : 'no recent motion'
}
