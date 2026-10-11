// GLB inspection and normalisation. Pure JS, no dependencies. Never claims semantic recognition: it only measures geometry.
export const GLB_MAX_BYTES = 50 * 1024 * 1024
const fail = error => ({ok: false, error})
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o }
function compose(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q, xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z
  return [(1 - 2 * (yy + zz)) * s[0], (2 * (xy + wz)) * s[0], (2 * (xz - wy)) * s[0], 0, (2 * (xy - wz)) * s[1], (1 - 2 * (xx + zz)) * s[1], (2 * (yz + wx)) * s[1], 0, (2 * (xz + wy)) * s[2], (2 * (yz - wx)) * s[2], (1 - 2 * (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1]
}
const apply = (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]

export function inspectGlb(buf) {
  if (buf.byteLength > GLB_MAX_BYTES) return fail('file exceeds the 50 MB limit')
  if (buf.byteLength < 20) return fail('file too small to be a GLB')
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  if (dv.getUint32(0, true) !== 0x46546c67) return fail('not a GLB file (bad magic bytes)')
  if (dv.getUint32(4, true) !== 2) return fail('unsupported glTF version (need 2)')
  if (dv.getUint32(8, true) !== buf.byteLength) return fail('header length does not match file size (truncated or corrupt)')
  const jl = dv.getUint32(12, true)
  if (dv.getUint32(16, true) !== 0x4e4f534a || 20 + jl > buf.byteLength) return fail('missing JSON chunk')
  let g; try { g = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jl))) } catch { return fail('invalid JSON chunk') }
  const nodes = g.nodes || [], meshes = g.meshes || [], acc = g.accessors || []
  if (nodes.length > 20000 || meshes.length > 5000) return fail('model too complex (limit 20000 nodes / 5000 meshes)')
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  let visits = 0, prims = 0
  const walk = (i, parent, depth) => {
    const n = nodes[i]; if (!n || depth > 64 || ++visits > 40000) return
    const m = mul(parent, n.matrix && n.matrix.length === 16 ? n.matrix : compose(n.translation, n.rotation, n.scale))
    for (const p of (n.mesh != null ? meshes[n.mesh]?.primitives || [] : [])) {
      const a = acc[p.attributes?.POSITION]; if (!a?.min || !a?.max) continue
      prims++
      for (let c = 0; c < 8; c++) { const v = apply(m, [c & 1 ? a.max[0] : a.min[0], c & 2 ? a.max[1] : a.min[1], c & 4 ? a.max[2] : a.min[2]]); for (let k = 0; k < 3; k++) { if (v[k] < min[k]) min[k] = v[k]; if (v[k] > max[k]) max[k] = v[k] } }
    }
    for (const c of n.children || []) walk(c, m, depth + 1)
  }
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  for (const r of (g.scenes?.[g.scene ?? 0]?.nodes) || []) walk(r, I, 0)
  if (!prims || min.some(v => !Number.isFinite(v))) return fail('no measurable geometry (POSITION accessors need min/max)')
  return {ok: true, min, max, size: max.map((v, i) => v - min[i]), meshCount: meshes.length, nodeCount: nodes.length, primitiveCount: prims}
}

// Returns a NormalizedRoom (metres, Y-up, origin at the min corner). Floor is a bounding rectangle, CCW = positive signed area in the (x,z) plane.
export function normalizeRoom(info, {id = 'room-204', name = 'Room', units = 'm'} = {}) {
  const s = {m: 1, cm: 0.01, mm: 0.001}[units]; if (!s) throw new Error('unsupported units')
  const [sx, sy, sz] = info.size.map(v => v * s)
  if ([sx, sz].some(v => v < 0.5 || v > 100) || sy < 0.5 || sy > 20) throw new Error(`implausible size ${sx.toFixed(2)} x ${sy.toFixed(2)} x ${sz.toFixed(2)} m after unit conversion; check the units`)
  const floor = [{x: 0, z: 0}, {x: sx, z: 0}, {x: sx, z: sz}, {x: 0, z: sz}]
  const walls = floor.map((a, i) => ({id: `wall-${i + 1}`, a, b: floor[(i + 1) % 4], thickness: 0.1, height: sy}))
  return {schemaVersion: 1, id, name, units: 'm', version: 1, height: sy, floor, walls, openings: [], objects: [], provenance: {source: 'glb', editedByUser: false}, derived: {area: sx * sz, length: Math.max(sx, sz), width: Math.min(sx, sz)}}
}
