import test from 'node:test'
import assert from 'node:assert/strict'
import {dayStartMs, occupancyState} from '../lib/core.mjs'
import {signSession, verifySession, safeEqual} from '../lib/session.mjs'
import {inspectGlb, normalizeRoom} from '../lib/glb.mjs'

const glb = (json, patch) => {
  const j = new TextEncoder().encode(JSON.stringify(json) + ' '.repeat(3)); const pad = new Uint8Array(Math.ceil(j.length / 4) * 4).fill(32); pad.set(j)
  const b = new Uint8Array(20 + pad.length), dv = new DataView(b.buffer)
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, b.length, true); dv.setUint32(12, pad.length, true); dv.setUint32(16, 0x4e4f534a, true); b.set(pad, 20)
  return patch ? patch(b, dv) : b
}
const scene = {asset: {version: '2.0'}, scene: 0, scenes: [{nodes: [0]}], nodes: [{mesh: 0, translation: [10, 0, 0]}], meshes: [{primitives: [{attributes: {POSITION: 0}}]}], accessors: [{min: [-4, 0, -3], max: [4, 3, 3]}]}

test('day start uses the home timezone, not the server', () => {
  const now = Date.parse('2026-10-07T20:00:00Z')
  assert.equal(new Date(dayStartMs('Asia/Kolkata', now)).toISOString(), '2026-10-07T18:30:00.000Z')
  assert.equal(new Date(dayStartMs('UTC', now)).toISOString(), '2026-10-07T00:00:00.000Z')
})
test('occupancy hold: motion is not a head count', () => {
  const t = 1e9
  assert.equal(occupancyState(0, t), 'no motion seen'); assert.equal(occupancyState(t - 60000, t), 'recent motion'); assert.equal(occupancyState(t - 400000, t), 'no recent motion')
})
test('session tokens verify, expire and reject tampering', async () => {
  const tok = await signSession({exp: 2000}, 's'.repeat(32))
  assert.equal(await verifySession(tok, 's'.repeat(32), 1000), true)
  assert.equal(await verifySession(tok, 's'.repeat(32), 3000), false)
  assert.equal(await verifySession(tok, 'x'.repeat(32), 1000), false)
  assert.equal(await verifySession(tok.replace(/.$/, c => c === 'A' ? 'B' : 'A'), 's'.repeat(32), 1000), false)
  assert.equal(await safeEqual('abc', 'abc'), true); assert.equal(await safeEqual('abc', 'abd'), false)
})
test('GLB: measures a translated mesh and normalises to a room', () => {
  const r = inspectGlb(glb(scene)); assert.equal(r.ok, true); assert.deepEqual(r.size, [8, 3, 6]); assert.equal(r.min[0], 6)
  const room = normalizeRoom(r, {units: 'm'}); assert.equal(room.derived.area, 48); assert.equal(room.derived.length, 8); assert.equal(room.walls.length, 4)
})
test('GLB: unit conversion and implausible sizes', () => {
  const big = {...scene, accessors: [{min: [-400, 0, -300], max: [400, 300, 300]}], nodes: [{mesh: 0}]}
  assert.equal(normalizeRoom(inspectGlb(glb(big)), {units: 'cm'}).derived.area, 48)
  assert.throws(() => normalizeRoom(inspectGlb(glb(big)), {units: 'm'}), /implausible/)
})
test('GLB: rejects bad magic, truncation, missing bounds, unsupported units', () => {
  assert.match(inspectGlb(glb(scene, b => { b[0] = 0; return b })).error, /magic/)
  assert.match(inspectGlb(glb(scene).slice(0, -8)).error, /header length/)
  assert.match(inspectGlb(glb({...scene, accessors: [{}]})).error, /no measurable/)
  assert.throws(() => normalizeRoom({size: [1, 1, 1]}, {units: 'ft'}), /unsupported/)
})
