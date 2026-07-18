# Backend

API TypeScript (Hono) con moduli `sync/`, `notifications/`, `db/`, `lib/`.

```bash
npm ci
export DATABASE_URL=postgres://music:music@localhost:5432/music
# + Spotify / session env (vedi ../.env.example)
npm run migrate
npm run dev
```

In Docker Compose il servizio `backend` avvia `tsx server/index.ts`.
