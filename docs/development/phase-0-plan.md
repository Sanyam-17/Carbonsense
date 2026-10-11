# Phase 0 plan (awaiting approval)

**Scope:** establish the real baseline. No feature work, no source edits.

**Current implementation:** unknown until `tools/phase0/audit.mjs` is run on the real repo. `current-state.md` is generated from that run.

**Changes:** add `tools/phase0/audit.mjs` and the `docs/` files in this kit. Nothing else.

**Files:** create only `tools/phase0/*`, `docs/**`. Modify none.

**Dependencies:** none (Node 18+ built-ins only).

**API / schema impact:** none.

**Risks:** the scan is static and regex-based, so it can miss code or flag harmless matches. Findings carry file and line evidence so a person can confirm each one. `--run` executes `npm run build` and `npm test`, which can take minutes.

**Verification:** run `node tools/phase0/audit.mjs --run --probe <urls>` with the dev server up. Then a person opens the dashboard in a browser and completes `docs/hardware/readiness-checklist.md`.

**Stop point:** Phase 1 does not start until this plan and the report are approved.
