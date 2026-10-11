# Deployment notes

Requires Node 20+. Set every variable in `.env.local.example` (production refuses to start without the security ones, or with placeholder node keys). The simulator is off by default in production.

Docker: `docker build -t carbonsense .` then `docker run -p 3000:3000 -v carbonsense-data:/app/data --env-file .env.production carbonsense`. Not built or run in this environment.
Put it behind HTTPS (reverse proxy); the session cookie is `Secure` in production. Health: `GET /api/health`.
Backups: copy `data/` (SQLite file and original GLBs) while the app is idle, or use `sqlite3 .backup`. Raw telemetry is deleted after `CARBONSENSE_RETENTION_DAYS` (default 7); there are no rollups yet, so month ranges are partial.
Limits: single-owner password login (not multi-user), in-memory rate limits (reset on restart, per instance), SQLite (single instance).
