## Learned User Preferences

- Prefers product and UI copy in Italian; often communicates in Italian.
- Chose multi-user Spotify login with a personal release feed plus email notifications for the MVP (not personal-only, not feed-only).
- Stack preference: Encore.ts (TypeScript) backend and Angular frontend; local runtime should use Docker Compose.
- When committing, wants granular commits with English messages; do not commit `.env` or Cursor hook state files.

## Learned Workspace Facts

- Product scope is in `REQUISITI.md`: track releases from Spotify followed artists, feed/calendar UI, email alerts (per-release or daily digest).
- Local Compose stack: `postgres`, `backend` (`:4000`), `frontend` (`:4200` with `/api` proxy); transactional email delivery uses the Brevo HTTP API.
- Compose runtime serves the API with Hono and `DATABASE_URL` to Compose Postgres; Encore-managed Postgres is not used for that path.
- Production target is DigitalOcean App Platform (`.do/app.yaml`: frontend + backend Dockerfiles, ingress `/api` → backend) with an existing Managed PostgreSQL cluster attached; keep one backend replica because cron jobs run in-process; prefer `sslmode=require` (no CA file mount).
- Spotify OAuth redirect URI expected by the app: `http://127.0.0.1:4200/api/auth/spotify/callback` (must match the Spotify Developer Dashboard exactly; prefer `127.0.0.1` over `localhost`).
- Layout is `backend/` + `frontend/` with root `docker-compose.yml` and `.env.example`.
