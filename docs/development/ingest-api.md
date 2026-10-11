# Ingest, stream and test (Phase 2 + first part of Phase 3)

Setup: `cp .env.local.example .env.local`, `npm install`, `npm run dev`. The built-in simulator (`sim-node-01`) starts automatically and is always labelled **Simulated**.

| Endpoint | Purpose |
|---|---|
| `POST /api/ingest` | Header `x-node-key`, JSON body per the v1 contract (`test/fixtures/telemetry-valid.json`). 200 ok, 400 invalid, 401 unauthorized, 413 too large, 429 rate limited. Rejections are stored in `rejections` and logged. |
| `GET /api/stream` | SSE. Sends the latest row per node on connect, then every new row. Each message carries `source`, `observedAt` and server `receivedAt`. |
| `GET /api/telemetry?limit=50&node=room-node-01` | Recent rows. |

Both GET routes are **unauthenticated** until Phase 8; keep this on localhost.

Rules implemented: per-node keys (hashed compare), range validation (whole payload rejected if any value is out of range, null = sensor unavailable), duplicate `(node, observedAt)` ignored, one `ingest()` for HTTP and simulator, clock skew > 5 min flagged, UI states live / stale / offline from server receipt time.

Bench test: `npm run send:sample -- --co2 900` (node `sim-bench-01`, shows as simulated). Posting as `room-node-01` shows as **measured**; do that only to bench-test and delete `local.db` before any demo or report.
Mapping: the INA219 power reading drives the "Smart plug" device; AC, TV and lamp remain estimated. Total power still sums measured and estimated values; labelling that split is Phase 6/7 work.
Tests: `npm test` (pure telemetry logic, Node 18+).
