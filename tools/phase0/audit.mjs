#!/usr/bin/env node
// CarbonSense Phase 0 audit. Read-only: inspects the repo and writes docs. No dependencies, Node >= 18.
// Usage: node tools/phase0/audit.mjs [--root .] [--out .] [--run] [--probe http://localhost:3000/,http://localhost:3000/api/rooms/1/stream]
import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

const A = process.argv.slice(2)
const arg = (k, d) => { const i = A.indexOf(k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true) }
const ROOT = path.resolve(arg('--root', process.cwd())), OUT = path.resolve(arg('--out', ROOT)), RUN = A.includes('--run'), PROBE = arg('--probe', null)
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage', '.vercel', '.pio'])
const files = []
;(function walk(d) { for (const e of fs.readdirSync(d, {withFileTypes: true})) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (path.relative(ROOT, p).split(path.sep).join('/') === 'tools/phase0') continue; e.isDirectory() ? walk(p) : files.push(p) } })(ROOT)
const rel = p => path.relative(ROOT, p).split(path.sep).join('/')
const read = f => { try { return fs.readFileSync(f, 'utf8') } catch { return '' } }
const code = files.filter(f => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f))
const grep = (re, list = code) => list.flatMap(f => read(f).split('\n').map((l, i) => re.test(l) ? `${rel(f)}:${i + 1}: ${l.trim().slice(0, 100)}` : null).filter(Boolean))
const has = (re, list = code) => list.some(f => re.test(read(f)))
const exists = p => fs.existsSync(path.join(ROOT, p))
const pj = (() => { try { return JSON.parse(read(path.join(ROOT, 'package.json'))) } catch { return null } })()
const deps = {...pj?.dependencies, ...pj?.devDependencies}, v = n => deps[n] || null

const R = {}
R.stack = {next: v('next'), react: v('react'), typescript: v('typescript'), three: v('three'), r3f: v('@react-three/fiber'), drei: v('@react-three/drei'), zustand: v('zustand'), drizzle: v('drizzle-orm'), sqliteClient: v('@libsql/client') || v('better-sqlite3'), zod: v('zod'), auth: v('better-auth') || v('next-auth'), tailwind: v('tailwindcss'), prisma: v('prisma') || v('@prisma/client'), playwright: v('@playwright/test'), vitest: v('vitest'), jest: v('jest'), mqtt: v('mqtt')}
R.layout = ['apps/web', 'services/iot', 'packages/shared', 'firmware/esp32', 'ios/RoomPlan'].map(d => [d, exists(d)])
const app = files.map(rel).filter(f => /(^|\/)app\/.*\b(route|page)\.(t|j)sx?$/.test(f))
R.api = app.filter(f => /route\./.test(f)); R.pages = app.filter(f => /page\./.test(f))
R.tables = code.flatMap(f => [...read(f).matchAll(/(sqliteTable|pgTable)\(\s*['"`](\w+)['"`]/g)].map(m => ({table: m[2], file: rel(f), dialect: m[1]})))
R.instrumentation = ['instrumentation.ts', 'src/instrumentation.ts'].filter(exists)
R.simulator = code.filter(f => /simulat/i.test(rel(f)) || /simulat/i.test(read(f))).map(rel).slice(0, 8)
const ing = code.filter(f => /ingest/i.test(rel(f)) && /route\./.test(rel(f)))
R.ingest = {files: ing.map(rel), apiKeyHeader: has(/x-api-key/i, ing), zod: has(/from ['"]zod['"]/, ing), ranges: has(/co2|ppm/i, ing) && has(/\b(min|max|gte|lte)\b/i, ing), nodeId: has(/nodeId/, ing)}
const sse = code.filter(f => /text\/event-stream/.test(read(f)))
R.sse = {files: sse.map(rel), authCheck: has(/requireHomeAccess|getSession|getServerSession|auth\(/, sse)}
R.zustand = code.filter(f => /from ['"]zustand/.test(read(f))).map(rel)
const th = code.filter(f => /Room3D|RoomScene/.test(rel(f)) || /<Canvas|WebGLRenderer/.test(read(f)))
R.three = {files: th.map(rel), tuples: grep(/\[\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\]/, th), dims: grep(/(width|depth|height|ROOM_\w*)\s*[:=]\s*\d+(\.\d+)?|\b2\.6\b/i, th), demand: has(/frameloop\s*=\s*\{?\s*["']demand/, th), gltf: has(/useGLTF|GLTFLoader/, th), webglGuard: has(/getContext\(\s*['"]webgl|WebGLRenderingContext|isWebGLAvailable|webglcontextlost/i, th), dispose: has(/\.dispose\(/, th)}
R.tz = {midnight: grep(/setHours\(\s*0|startOfDay|toISOString\(\)\.slice\(0,\s*10\)/), timezone: has(/timeZone|timezone/)}
R.auth = {lib: R.stack.auth, middleware: ['middleware.ts', 'src/middleware.ts'].filter(exists), home: has(/requireHomeAccess/)}
const testFiles = files.map(rel).filter(f => /\.(test|spec)\.(t|j)sx?$/.test(f))
R.tests = {files: testFiles, script: pj?.scripts?.test || null, configs: files.map(rel).filter(f => /(playwright|vitest|jest)\.config\./.test(f))}
let tracked = []
if (exists('.git')) { const g = spawnSync('git', ['ls-files', '.env*', '**/.env*'], {cwd: ROOT, encoding: 'utf8'}); tracked = (g.stdout || '').split('\n').filter(Boolean) }
R.secrets = {gitignoreHasEnv: /^\.env/m.test(read(path.join(ROOT, '.gitignore'))), trackedEnvFiles: tracked, publicSecretNames: grep(/NEXT_PUBLIC_\w*(KEY|SECRET|TOKEN|PASSWORD)/i)}
R.glb = files.filter(f => /\.(glb|gltf)$/i.test(f)).map(f => {
  const st = fs.statSync(f), o = {file: rel(f), mb: +(st.size / 1048576).toFixed(2), over50MB: st.size > 50 * 1048576}
  if (/\.glb$/i.test(f) && st.size >= 12) { const fd = fs.openSync(f, 'r'), b = Buffer.alloc(12); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd); o.magicOk = b.toString('ascii', 0, 4) === 'glTF'; o.version = b.readUInt32LE(4); o.lengthMatches = b.readUInt32LE(8) === st.size }
  return o
})
R.firmware = {dir: exists('firmware/esp32'), platformio: files.some(f => f.endsWith('platformio.ini'))}

const sh = (args, ms) => {
  const r = spawnSync('npm', args, {cwd: ROOT, encoding: 'utf8', timeout: ms, shell: process.platform === 'win32', env: {...process.env, CI: 'true'}})
  return {status: r.error ? 'Failed' : r.status === 0 ? 'Passed' : 'Failed', exitCode: r.status, tail: ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-12).join('\n')}
}
R.cmd = {build: {status: 'Not run'}, test: {status: 'Not run'}}
if (RUN) {
  R.cmd.build = pj?.scripts?.build ? sh(['run', 'build'], 900000) : {status: 'Not run', tail: 'no "build" script'}
  R.cmd.test = pj?.scripts?.test ? sh(['test'], 600000) : {status: 'Not run', tail: 'no "test" script'}
}
R.probe = []
if (PROBE) for (const u of String(PROBE).split(',')) {
  try { const r = await fetch(u, {signal: AbortSignal.timeout(5000)}); R.probe.push({url: u, status: r.status}); r.body?.cancel() } catch (e) { R.probe.push({url: u, status: 'Failed: ' + (e.cause?.code || e.message)}) }
}

// ---- findings: only what the static scan actually evidences ----
const F = [], add = (sev, t, ev) => F.push({sev, t, ev})
if (!pj) add('blocker', 'No package.json at --root', 'Run from the repository root')
if (R.stack.prisma) add('violation', 'Prisma detected; Drizzle is the approved ORM', 'package.json')
if (R.stack.tailwind) add('review', 'Tailwind detected; spec says keep plain CSS unless a real requirement exists', 'package.json')
if (pj && !R.stack.zod) add('gap', 'zod not found as a dependency; boundary validation cannot use the shared schema yet', 'package.json')
if (R.ingest.files.length && R.ingest.apiKeyHeader && !R.ingest.nodeId) add('gap', 'Ingest uses an API key header with no nodeId handling (per-node identity missing)', R.ingest.files.join(', '))
if (R.ingest.files.length && !R.ingest.ranges) add('gap', 'No range checks detected in the ingest route', R.ingest.files.join(', '))
if (!R.ingest.files.length) add('gap', 'No ingest route found by path', 'looked for app/**/ingest*/route.*')
if (R.sse.files.length && !R.sse.authCheck) add('gap', 'SSE route shows no authorization check', R.sse.files.join(', '))
if (R.three.dims.length || R.three.tuples.length) add('gap', `Hard-coded geometry/positions in 3D code (${R.three.dims.length} dimension hits, ${R.three.tuples.length} vector literals)`, R.three.files.join(', '))
if (R.three.files.length && !R.three.demand) add('review', 'frameloop="demand" not detected', R.three.files.join(', '))
if (R.three.files.length && !R.three.webglGuard) add('gap', 'No WebGL-unavailable handling detected', R.three.files.join(', '))
if (R.tz.midnight.length && !R.tz.timezone) add('gap', 'Day boundaries appear to use server time; no timezone handling detected', R.tz.midnight[0])
else if (R.tz.midnight.length) add('review', 'Day-boundary code found; confirm it uses the home timezone', R.tz.midnight[0])
if (!R.tests.files.length) add('gap', 'No test files found', 'looked for *.test.* and *.spec.*')
if (!R.tests.script) add('gap', 'No "test" script in package.json', 'package.json')
if (!R.auth.lib && !R.auth.middleware.length) add('gap', 'No auth library or middleware detected', 'package.json')
if (R.secrets.trackedEnvFiles.length) add('risk', 'Env files tracked by git', R.secrets.trackedEnvFiles.join(', '))
if (!R.secrets.gitignoreHasEnv) add('risk', '.gitignore does not appear to ignore .env files', '.gitignore')
if (R.secrets.publicSecretNames.length) add('risk', 'NEXT_PUBLIC_ variable name suggests a secret exposed to the browser', R.secrets.publicSecretNames[0])
for (const g of R.glb) { if (g.over50MB) add('gap', `GLB exceeds the 50 MB cap: ${g.file}`, `${g.mb} MB`); if (g.magicOk === false) add('gap', `Not a valid GLB header: ${g.file}`, 'magic bytes != glTF'); if (g.lengthMatches === false) add('gap', `GLB header length does not match file size: ${g.file}`, 'possibly truncated') }
if (R.cmd.build.status === 'Failed') add('blocker', 'Build failed', R.cmd.build.tail.split('\n').slice(-3).join(' | '))
if (R.cmd.test.status === 'Failed') add('gap', 'Tests failed', R.cmd.test.tail.split('\n').slice(-3).join(' | '))
for (const p of R.probe) if (typeof p.status !== 'number' || p.status >= 400) add('gap', `Probe not OK: ${p.url}`, String(p.status))

// ---- docs ----
const tbl = (h, rows) => rows.length ? [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n') : '_none detected_'
const list = a => a.length ? a.map(x => `- ${x}`).join('\n') : '- _none detected_'
const yn = b => b ? 'detected' : 'not detected'
const ts = new Date().toISOString()
const st = R.stack
const cur = `# Current state (generated)

Generated ${ts} by \`tools/phase0/audit.mjs\` from a static scan of \`${path.basename(ROOT)}\`. Nothing here is hand-written. "Not detected" means the scan did not find it, not that it is proven absent. Browser behaviour and hardware are **not** covered by this scan.

## Stack
${tbl(['Item', 'Version / value'], Object.entries(st).map(([k, x]) => [k, x || '_not in package.json_']))}

Monorepo layout: ${R.layout.map(([d, e]) => `${d} ${e ? 'present' : 'absent'}`).join(', ')}

## Routes
API routes (${R.api.length}):
${list(R.api)}

Pages (${R.pages.length}):
${list(R.pages)}

## Database (Drizzle tables found)
${tbl(['Table', 'Dialect', 'File'], R.tables.map(t => [t.table, t.dialect, t.file]))}

## Telemetry path
- instrumentation file: ${R.instrumentation.join(', ') || 'not detected'}
- simulator-related files: ${R.simulator.join(', ') || 'not detected'}
- ingest route(s): ${R.ingest.files.join(', ') || 'not detected'}; x-api-key header ${yn(R.ingest.apiKeyHeader)}; zod ${yn(R.ingest.zod)}; range checks ${yn(R.ingest.ranges)}; nodeId handling ${yn(R.ingest.nodeId)}
- SSE route(s): ${R.sse.files.join(', ') || 'not detected'}; authorization check ${yn(R.sse.authCheck)}
- Zustand stores: ${R.zustand.join(', ') || 'not detected'}

## 3D scene
Files: ${R.three.files.join(', ') || 'not detected'}. frameloop="demand" ${yn(R.three.demand)}; GLTF loading ${yn(R.three.gltf)}; WebGL guard ${yn(R.three.webglGuard)}; dispose() ${yn(R.three.dispose)}.

Hard-coded dimension hits (first 8 of ${R.three.dims.length}):
${list(R.three.dims.slice(0, 8))}

Vector literals (first 8 of ${R.three.tuples.length}):
${list(R.three.tuples.slice(0, 8))}

## Time, auth, tests, secrets
- Day-boundary code: ${R.tz.midnight.length} hit(s); timezone handling ${yn(R.tz.timezone)}
- Auth: library ${R.auth.lib || 'none'}; middleware ${R.auth.middleware.join(', ') || 'none'}; requireHomeAccess ${yn(R.auth.home)}
- Tests: ${R.tests.files.length} file(s); test script ${R.tests.script || 'none'}; configs ${R.tests.configs.join(', ') || 'none'}
- .gitignore ignores .env: ${R.secrets.gitignoreHasEnv ? 'yes' : 'no'}; tracked env files: ${R.secrets.trackedEnvFiles.join(', ') || 'none'}

## GLB assets
${tbl(['File', 'MB', 'Header OK', 'Version', 'Length matches', '>50 MB'], R.glb.map(g => [g.file, g.mb, g.magicOk ?? 'n/a', g.version ?? 'n/a', g.lengthMatches ?? 'n/a', g.over50MB]))}

## Commands
${tbl(['Check', 'Result', 'Detail'], [['npm run build', R.cmd.build.status, (R.cmd.build.tail || '').split('\n').pop() || ''], ['npm test', R.cmd.test.status, (R.cmd.test.tail || '').split('\n').pop() || ''], ...R.probe.map(p => ['GET ' + p.url, String(p.status), ''])])}

Not run: dev server in a browser, 3D scene in a real browser, ESP32 hardware.

## Findings (${F.length})
${tbl(['Severity', 'Finding', 'Evidence'], F.map(f => [f.sev, f.t, '`' + String(f.ev).replace(/\|/g, '/') + '`']))}
`
const W = (p, t, keep) => { const f = path.join(OUT, p); if (keep && fs.existsSync(f)) return false; fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, t); return true }
const runnable = R.cmd.build.status === 'Passed' && R.probe.length > 0 && R.probe.every(p => typeof p.status === 'number' && p.status < 400)
W('docs/architecture/current-state.md', cur)
W('docs/phase0/audit.json', JSON.stringify({generated: ts, root: path.basename(ROOT), ...R, findings: F}, null, 2))
W('docs/development/phase-status.md', `# Phase status

| Phase | Status |
|---|---|
| 0 Audit and hardware readiness | In progress: awaiting review and approval |
| 1 ESP32 and physical sensors | Not started |
| 2 Ingestion and persistence | Not started |
| 3 Live hardware-to-3D integration | Not started |
| 4 GLB import and normalization | Not started |
| 5 Data-driven 2D/3D twin | Not started |
| 6 Energy, carbon, occupancy | Not started |
| 7 Analytics | Not started |
| 8 Auth and authorization | Not started |
| 9 MQTT and IoT service | Not started |
| 10 Multi-room, quality, deployment | Not started |

## Phase 0 gate
- [${R.cmd.build.status === 'Passed' ? 'x' : ' '}] \`npm run build\` passes (${R.cmd.build.status})
- [${R.tests.script ? (R.cmd.test.status === 'Passed' ? 'x' : ' ') : ' '}] existing tests pass (${R.cmd.test.status}${R.tests.script ? '' : ', no test script'})
- [${runnable ? 'x' : ' '}] dev server answered the probes without error
- [ ] 3D scene opened in a real browser and checked by a person
- [ ] \`docs/hardware/readiness-checklist.md\` completed by a person
- [ ] \`docs/development/phase-0-plan.md\` approved
`, true)
W('docs/development/phase-0-report.md', `# Phase 0 completion report (generated ${ts})

1. **Phase / objective:** 0, establish the real baseline and hardware readiness.
2. **Work completed:** static audit of the repository; docs generated. No source code changed.
3. **Files created:** \`docs/architecture/current-state.md\`, \`docs/phase0/audit.json\`, this report (plus kit docs).
4. **Decisions:** none beyond documenting the baseline.
5. **DB / API changes:** none.
6. **Dependencies:** none added or removed.
7. **Commands:** build ${R.cmd.build.status}; test ${R.cmd.test.status}; probes ${R.probe.map(p => p.status).join(', ') || 'Not run'}.
8. **Tests:** ${R.tests.files.length} test file(s) found; result ${R.cmd.test.status}.
9. **Still manual:** browser check of the 3D scene; hardware inventory and wiring review.
10. **Known limitations:** ${F.length} finding(s) in current-state.md; static scan only.
11. **Acceptance criteria:** see the gate in \`phase-status.md\`. Items marked [x] are evidenced above; the rest are not verified.
12. **App runnable:** ${runnable ? 'build passed and probes answered' : 'not established by this run'}.
13. **Next:** Phase 1 (ESP32 and physical sensors). Prerequisites: approved plan, completed hardware checklist, exact module models confirmed.
`)
console.log(`Phase 0 audit of ${ROOT}\n  findings: ${F.length}  (${F.map(f => f.sev).join(', ') || 'none'})\n  build: ${R.cmd.build.status}  test: ${R.cmd.test.status}  probes: ${R.probe.length}\n  wrote docs/architecture/current-state.md, docs/phase0/audit.json, docs/development/phase-0-report.md`)
