import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {validateTelemetry, freshness, integrateEnergy, carbonKg} from '../lib/core.mjs'
const fx = JSON.parse(readFileSync(new URL('./fixtures/telemetry-valid.json', import.meta.url)))
const at = Date.parse(fx.ts)

test('accepts the contract fixture', () => { const r = validateTelemetry(fx, at); assert.equal(r.ok, true); assert.equal(r.value.environment.co2Ppm, 642); assert.equal(r.value.flags.clockSkew, false) })
test('rejects out-of-range CO2 and bad version', () => {
  assert.equal(validateTelemetry({...fx, environment: {...fx.environment, co2Ppm: 9000}}, at).ok, false)
  assert.equal(validateTelemetry({...fx, version: 2}, at).ok, false)
})
test('rejects negative power, bad nodeId, non-boolean motion', () => {
  assert.equal(validateTelemetry({...fx, energy: {...fx.energy, powerW: -1}}, at).ok, false)
  assert.equal(validateTelemetry({...fx, nodeId: 'X'}, at).ok, false)
  assert.equal(validateTelemetry({...fx, occupancy: {motion: 'yes'}}, at).ok, false)
})
test('null sensor values are allowed (unavailable), empty payload is not', () => {
  assert.equal(validateTelemetry({...fx, environment: {co2Ppm: null, temperatureC: 24, humidityPct: null}}, at).ok, true)
  assert.equal(validateTelemetry({version: 1, nodeId: 'room-node-01', ts: fx.ts}, at).ok, false)
})
test('flags clock skew over 5 minutes and power mismatch', () => {
  assert.equal(validateTelemetry(fx, at + 6 * 60000).value.flags.clockSkew, true)
  assert.equal(validateTelemetry({...fx, energy: {voltageV: 5, currentA: 1, powerW: 20}}, at).value.flags.powerMismatch, true)
})
test('freshness never reports old data as live', () => {
  assert.equal(freshness(5), 'live'); assert.equal(freshness(31), 'stale'); assert.equal(freshness(121), 'offline')
  assert.equal(freshness(11, 'power'), 'stale'); assert.equal(freshness(null), 'unavailable')
})
test('energy: constant 10 W for 1 h is 10 Wh', () => {
  const s = Array.from({length: 721}, (_, i) => ({ts: i * 5000, powerW: 10}))
  const r = integrateEnergy(s, {intervalS: 5}); assert.ok(Math.abs(r.wh - 10) < 1e-9); assert.equal(r.gaps.length, 0)
})
test('energy: long gap is skipped and reported, duplicates and out-of-order handled', () => {
  const r = integrateEnergy([{ts: 20000, powerW: 10}, {ts: 0, powerW: 10}, {ts: 5000, powerW: 10}, {ts: 5000, powerW: 10}, {ts: 10000, powerW: 10}, {ts: 60000, powerW: 10}, {ts: 65000, powerW: 10}, {ts: 70000, powerW: -4}], {intervalS: 5})
  assert.equal(r.duplicates, 1); assert.equal(r.dropped, 1); assert.equal(r.gaps.length, 1); assert.equal(r.gaps[0].seconds, 40)
  assert.ok(Math.abs(r.wh - 10 * 25 / 3600) < 1e-9)
})
test('carbon = kWh x factor, rejects bad input', () => { assert.equal(carbonKg(2, 0.5), 1); assert.throws(() => carbonKg(-1, 0.5)) })
