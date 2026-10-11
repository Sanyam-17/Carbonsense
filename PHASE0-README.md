# CarbonSense Phase 0 kit

Read-only audit tooling plus the Phase 0 documents. It changes no source code and adds no dependencies.

1. Unzip into the **root of your CarbonSense repository** (adds `tools/phase0/` and `docs/`).
2. Start your dev server in one terminal (`npm run dev`).
3. In another terminal, from the repo root:
   `node tools/phase0/audit.mjs --run --probe http://localhost:3000/`
   Add more URLs after a comma, e.g. your SSE route. `--run` also executes `npm run build` and `npm test`. Drop it for a quick static-only scan.
4. Read `docs/architecture/current-state.md` (generated, evidence-based) and complete `docs/hardware/readiness-checklist.md`.
5. Approve `docs/development/phase-0-plan.md`, then move to Phase 1.

Options: `--root <dir>` repo to scan, `--out <dir>` where docs are written.
