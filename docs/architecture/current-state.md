# Current state (generated)

Generated 2026-10-11T11:47:41.445Z by `tools/phase0/audit.mjs` from a static scan of `v0-project`. Nothing here is hand-written. "Not detected" means the scan did not find it, not that it is proven absent. Browser behaviour and hardware are **not** covered by this scan.

## Stack
| Item | Version / value |
|---|---|
| next | ^15.1.0 |
| react | ^19.0.0 |
| typescript | ^5.6.0 |
| three | ^0.170.0 |
| r3f | _not in package.json_ |
| drei | _not in package.json_ |
| zustand | _not in package.json_ |
| drizzle | ^0.38.0 |
| sqliteClient | ^0.14.0 |
| zod | _not in package.json_ |
| auth | _not in package.json_ |
| tailwind | _not in package.json_ |
| prisma | _not in package.json_ |
| playwright | _not in package.json_ |
| vitest | _not in package.json_ |
| jest | _not in package.json_ |
| mqtt | _not in package.json_ |

Monorepo layout: apps/web absent, services/iot absent, packages/shared absent, firmware/esp32 present, ios/RoomPlan absent

## Routes
API routes (10):
- app/api/devices/[id]/route.ts
- app/api/energy/route.ts
- app/api/health/route.ts
- app/api/ingest/route.ts
- app/api/login/route.ts
- app/api/rooms/[id]/devices/route.ts
- app/api/rooms/[id]/model/route.ts
- app/api/rooms/[id]/route.ts
- app/api/stream/route.ts
- app/api/telemetry/route.ts

Pages (12):
- app/analytics/page.tsx
- app/device/[id]/page.tsx
- app/device/page.tsx
- app/env/page.tsx
- app/house/page.tsx
- app/login/page.tsx
- app/page.tsx
- app/processing/page.tsx
- app/room/page.tsx
- app/rooms/import/page.tsx
- app/rooms/page.tsx
- app/scan/page.tsx

## Database (Drizzle tables found)
| Table | Dialect | File |
|---|---|---|
| telemetry | sqliteTable | lib/schema.ts |
| nodes | sqliteTable | lib/schema.ts |
| rejections | sqliteTable | lib/schema.ts |
| devices | sqliteTable | lib/schema.ts |

## Telemetry path
- instrumentation file: instrumentation.ts
- simulator-related files: app/api/devices/[id]/route.ts, app/page.tsx, instrumentation.ts, lib/config.ts, lib/core.mjs, lib/engine.js, lib/ingest.ts, lib/simulator.ts
- ingest route(s): app/api/ingest/route.ts; x-api-key header not detected; zod not detected; range checks not detected; nodeId handling detected
- SSE route(s): app/api/stream/route.ts; authorization check not detected
- Zustand stores: not detected

## 3D scene
Files: lib/engine.js. frameloop="demand" not detected; GLTF loading not detected; WebGL guard not detected; dispose() detected.

Hard-coded dimension hits (first 8 of 5):
- lib/engine.js:25: [[-3.5,.3],[3.6,-2.5],[3.3,2.6],[-3.3,-2.4]].forEach(([x,z])=>{const geo=new THREE.ConeGeometry(.34,
- lib/engine.js:26: const gt=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d
- lib/engine.js:40: const HL=[['Bedroom',-8.2,2.6,-.3,'210'],['Kitchen',8.2,2.6,.3,'420'],['Living room',0,3.5,0,'']].ma
- lib/engine.js:65: const c=(t*(.3+pw)+d.ph)%1;d.ring.scale.setScalar(.25+c*2.6);d.ring.material.opacity=(1-c)*(.15+.55*
- lib/engine.js:90: return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block">`+[0,1,2,3].map(i=>`<line x1="

Vector literals (first 8 of 6):
- lib/engine.js:8: const DV={ac:{n:'AC unit',p:[-1.9,2.45,-2.85],g:[1.9,.5,.3]},light:{n:'Ceiling lamp',p:[0,2.3,0]},tv
- lib/engine.js:42: function snap(){R.setSize(520,320,false);cam.aspect=520/320;cam.clearViewOffset();cam.updateProjecti
- lib/engine.js:45: const W=[{p:[13,8.5,13],t:[0,1,0],o:.2},{p:[5.5,4.4,7.5],t:[-1,2,-2],o:.18},{p:[-10,5,6],t:[0,1.5,0]
- lib/engine.js:52: tp=[0,1,2].map(n=>L(a.p[n],b.p[n],u));tt=[0,1,2].map(n=>L(a.t[n],b.t[n],u));to=L(a.o,b.o,u);lt=[wx(.
- lib/engine.js:55: if(RT=='room'){lt=[S.l.e?1:.08,S.l.a?1:.08,S.l.c?1:.08];if(S.v2){tp=[0,19,1.4];tt=[0,0,0]}}}
- lib/engine.js:83: const VW={login:{p:[12,7,12],t:[0,1,0],o:0,l:[.2,.45,.2]},scan:{p:[9,6.5,10],t:[0,1,0],o:0,l:[0,0,.0

## Time, auth, tests, secrets
- Day-boundary code: 0 hit(s); timezone handling detected
- Auth: library none; middleware middleware.ts; requireHomeAccess detected
- Tests: 0 file(s); test script node --test; configs none
- .gitignore ignores .env: yes; tracked env files: .env.local.example

## GLB assets
_none detected_

## Commands
| Check | Result | Detail |
|---|---|---|
| npm run build | Passed | ƒ  (Dynamic)  server-rendered on demand |
| npm test | Passed | ℹ duration_ms 148.866766 |
| GET http://localhost:3000/api/health | 200 |  |

Not run: dev server in a browser, 3D scene in a real browser, ESP32 hardware.

## Findings (8)
| Severity | Finding | Evidence |
|---|---|---|
| gap | zod not found as a dependency; boundary validation cannot use the shared schema yet | `package.json` |
| gap | No range checks detected in the ingest route | `app/api/ingest/route.ts` |
| gap | SSE route shows no authorization check | `app/api/stream/route.ts` |
| gap | Hard-coded geometry/positions in 3D code (5 dimension hits, 6 vector literals) | `lib/engine.js` |
| review | frameloop="demand" not detected | `lib/engine.js` |
| gap | No WebGL-unavailable handling detected | `lib/engine.js` |
| gap | No test files found | `looked for *.test.* and *.spec.*` |
| risk | Env files tracked by git | `.env.local.example` |
