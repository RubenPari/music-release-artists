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
- Account Brevo con un mittente verificato, solo se abiliti le notifiche email

### Config

```bash
cp .env.example .env
# Imposta le credenziali Spotify e Brevo
```

Le notifiche email sono disabilitate di default. Per abilitarle configura l'API
transazionale Brevo:

```dotenv
EMAIL_ENABLED=true
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
- Notifiche email opt-in (per uscita o digest giornaliero) + unsubscribe, se abilitate
- Isolamento dati per utente; token Spotify cifrati a riposo

## Sviluppo locale (senza rebuild frontend)

```bash
docker compose up postgres backend -d
cd frontend && npm ci && npx ng serve --proxy-config proxy.conf.json
```

## Struttura

```
backend/              API, sync, email, migrations
frontend/             Angular SPA
.do/app.yaml          DigitalOcean App Platform spec
deploy/               template env production (riferimento)
docker-compose.yml    stack locale
```

## Deploy production su DigitalOcean App Platform

Il target production è **App Platform** (frontend + backend da Dockerfile) con un
cluster **Managed PostgreSQL** già esistente. HTTPS e routing sono gestiti dalla
piattaforma: `/api` → backend (prefix rimosso), `/` → frontend. Il backend resta
a **una sola replica** perché i cron (`node-cron`) girano in-process.

### 1. Risorse DigitalOcean

1. Crea (o riusa) un cluster Managed PostgreSQL 16 nella regione scelta.
2. Compila [`.do/app.yaml`](.do/app.yaml): `region`, `databases[].cluster_name`,
   dominio (`domains`) e, se necessario, `github.repo`.
3. Al primo deploy, App Platform si attacca al cluster (`production: true` +
   `cluster_name`) e viene aggiunta come trusted source. Verifica in
   **Databases → Network Access**.
4. Collega il repository GitHub all’account DigitalOcean (App Platform → GitHub).

Non serve Droplet, Caddy né registry GHCR: App Platform builda dai Dockerfile
nel repo.

### 2. Utenti PostgreSQL

Usa `doadmin` soltanto per il bootstrap:

```sql
CREATE DATABASE music;
CREATE ROLE mra_migrator LOGIN PASSWORD 'replace-me';
CREATE ROLE mra_app LOGIN PASSWORD 'replace-me';
ALTER DATABASE music OWNER TO mra_migrator;
GRANT CONNECT ON DATABASE music TO mra_app;
```

Poi collegati al database `music`, crea l'estensione e configura i privilegi:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT USAGE ON SCHEMA public TO mra_app;
ALTER DEFAULT PRIVILEGES FOR ROLE mra_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mra_app;
ALTER DEFAULT PRIVILEGES FOR ROLE mra_migrator IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO mra_app;
```

Il runtime usa `mra_app` tramite `${db.DATABASE_URL}`. Il job `PRE_DEPLOY`
`migrate` usa il secret `MIGRATION_DATABASE_URL` con ruolo `mra_migrator`.
Su App Platform preferisci `sslmode=require` (niente file CA montato). Vedi
[`deploy/app.env.example`](deploy/app.env.example) e
[`deploy/migration.env.example`](deploy/migration.env.example).

### 3. Dominio e OAuth

Il repository usa `music.example.com` come placeholder in `.do/app.yaml`. Prima
del go-live:

1. sostituisci dominio/zone nello spec;
2. punta DNS al CNAME / record indicato da App Platform;
3. imposta nel pannello Spotify l'URI esatta:
   `https://tuo-dominio/api/auth/spotify/callback`.

`APP_BASE_URL` e `FRONTEND_ORIGIN` derivano da `${APP_URL}` nello spec.
Spotify OAuth remoto richiede HTTPS; il deploy non parte finché
`DEPLOY_ENABLED` non vale `true`.

### 4. GitHub Actions

Crea l'environment GitHub `production`, abilita l'approvazione manuale e
configura:

**Variables**

| Nome | Note |
|------|------|
| `DEPLOY_ENABLED` | `true` solo quando DNS/DB/spec sono pronti |
| `PUBLIC_DOMAIN` | es. `music.example.com` (readiness check post-deploy) |
| `EMAIL_ENABLED` | default `false` |
| `BREVO_SENDER_EMAIL` | solo se email abilitate |
| `BREVO_SENDER_NAME` | opzionale, default `Uscite` |

**Secrets**

| Nome | Note |
|------|------|
| `DIGITALOCEAN_ACCESS_TOKEN` | PAT DigitalOcean con scope Apps |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | |
| `SESSION_SECRET` / `TOKEN_ENCRYPTION_KEY` | |
| `MIGRATION_DATABASE_URL` | URL `mra_migrator` con `sslmode=require` |
| `BREVO_API_KEY` | richiesto se `EMAIL_ENABLED=true` |

La pipeline [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. esegue test/typecheck backend e build Angular;
2. aggiorna/deploya l’app con [`digitalocean/app_action/deploy@v2`](https://github.com/digitalocean/app_action) da `.do/app.yaml`;
3. il job App Platform `migrate` (`PRE_DEPLOY`) applica le migration;
4. opzionalmente verifica `https://$PUBLIC_DOMAIN/api/health/ready`.

Le migration production devono essere additive e retrocompatibili: un rollback
di App Platform non esegue migration `down`.

### 5. Monitoraggio

Configura un DigitalOcean Uptime Check su:

```text
https://tuo-dominio/api/health/ready
```

`/api/health/live` verifica il processo; `/api/health/ready` verifica anche
PostgreSQL. Non scalare il backend oltre una istanza.