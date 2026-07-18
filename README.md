# Music Release Artists

App multi-utente per tracciare le uscite musicali degli artisti seguiti su Spotify e ricevere notifiche email.

Stack: **TypeScript backend** (Hono + moduli `sync`/`notifications`/`db`, cron con `node-cron`), **Angular**, **PostgreSQL** e **Brevo**, orchestrati con **Docker Compose**.

> Adattamento rispetto al piano iniziale (Encore.ts): con Postgres gestito da Compose serve un runtime che usi `DATABASE_URL` esterno; Hono espone le stesse API previste (auth Spotify, sync, feed, profilo, notifiche).

## Avvio rapido

### Prerequisiti

- Docker Desktop / Docker Compose
- App Spotify su [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
  - Redirect URI: `http://127.0.0.1:4200/api/auth/spotify/callback`
  - Scopes usati: `user-follow-read`, `user-read-email`
- Account Brevo con un mittente verificato

### Config

```bash
cp .env.example .env
# Imposta le credenziali Spotify e Brevo
```

Configura l'API transazionale Brevo:

```dotenv
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=notifications@example.com
BREVO_SENDER_NAME=Uscite
```

L'indirizzo mittente o il relativo dominio deve essere verificato nel pannello Brevo prima dell'invio.

### Run

```bash
docker compose up --build
```

| Servizio | URL |
|----------|-----|
| App | http://127.0.0.1:4200 |
| API (via proxy) | http://127.0.0.1:4200/api |
| API diretta | http://127.0.0.1:4000 |
| Postgres | 127.0.0.1:5432 |

## Funzionalità MVP

- Login/logout Spotify con sessione cookie
- Sync artisti seguiti + uscite (album/single/EP, ultimi 90 giorni)
- Refresh on-demand e sync periodica (ogni 8 ore)
- Feed e calendario con filtri
- Notifiche email opt-in (per uscita o digest giornaliero) + unsubscribe
- Isolamento dati per utente; token Spotify cifrati a riposo

## Sviluppo locale (senza rebuild frontend)

```bash
docker compose up postgres backend -d
cd frontend && npm ci && npx ng serve --proxy-config proxy.conf.json
```

## Struttura

```
backend/     API, sync, email, migrations
frontend/    Angular SPA
docker-compose.yml
```
