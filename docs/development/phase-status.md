# Phase status

| Phase | Status |
|---|---|
| 0 Audit and hardware readiness | Audit done (static); build and tests verified; browser check and hardware checklist pending |
| 1 ESP32 and physical sensors | Firmware written; not compiled or run on hardware |
| 2 Ingestion and persistence | Implemented; core logic unit-tested, routes not yet run on your machine |
| 3 Live hardware-to-3D integration | Mostly implemented: SSE, badge, DB device mappings, metering labels. Per-marker 3D states and browser check pending |
| 4 GLB import and normalization | Backend and upload page done (inspect, normalise, store). Manual classification UI not done; scene does not use it yet |
| 5 Data-driven 2D/3D twin | Not started |
| 6 Energy, carbon, occupancy | Logic tested; /api/energy done (metered only, no default emission factor). Estimated-device energy not done |
| 7 Analytics | Not started |
| 8 Auth and authorization | Single-owner session login + route protection; multi-user and ownership checks not done |
| 9 MQTT and IoT service | Not started |
| 10 Multi-room, quality, deployment | Not started |

## Phase 0 gate
- [x] `npm run build` passes locally after the telemetry insert-type fix
- [x] existing tests pass: 15/15 (`npm test`)
- [ ] dev server answered the probes without error
- [ ] 3D scene opened in a real browser and checked by a person
- [ ] `docs/hardware/readiness-checklist.md` completed by a person
- [ ] `docs/development/phase-0-plan.md` approved
