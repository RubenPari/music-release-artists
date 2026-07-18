# Music Release Artists

App multi-utente per tracciare le uscite musicali degli artisti seguiti su Spotify e ricevere notifiche email.

Stack: **TypeScript backend** (Hono + moduli `sync`/`notifications`/`db`, cron con `node-cron`), **Angular**, **PostgreSQL**, **Mailpit** (SMTP locale), orchestrati con **Docker Compose**.

> Adattamento rispetto al piano iniziale (Encore.ts): con Postgres gestito da Compose serve un runtime che usi `DATABASE_URL` esterno; Hono espone le stesse API previste (auth Spotify, sync, feed, profilo, notifiche).

## Avvio rapido

### Prerequisiti

- Docker Desktop / Docker Compose
- App Spotify su [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
  - Redirect URI: `http://localhost:4200/api/auth/spotify/callback`
  - Scopes usati: `user-follow-read`, `user-read-email`

### Config

```bash
cp .env.example .env
# Imposta SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET
```

### Run

```bash
docker compose up --build
```

| Servizio | URL |
|----------|-----|
| App | http://localhost:4200 |
| API (via proxy) | http://localhost:4200/api |
| API diretta | http://localhost:4000 |
| Mailpit (email) | http://localhost:8025 |
| Postgres | localhost:5432 |

## Funzionalità MVP

- Login/logout Spotify con sessione cookie
- Sync artisti seguiti + uscite (album/single/EP, ultimi 90 giorni)
- Refresh on-demand e sync periodica (ogni 8 ore)
- Feed e calendario con filtri
- Notifiche email opt-in (per uscita o digest giornaliero) + unsubscribe
- Isolamento dati per utente; token Spotify cifrati a riposo

## Sviluppo locale (senza rebuild frontend)

```bash
docker compose up postgres mailpit backend -d
cd frontend && npm ci && npx ng serve --proxy-config proxy.conf.json
```

## Struttura

```
backend/     API, sync, email, migrations
frontend/    Angular SPA
docker-compose.yml
```
