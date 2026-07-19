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
backend/     API, sync, email, migrations
frontend/    Angular SPA
docker-compose.yml
```

## Deploy production su DigitalOcean

Il target production è un Droplet Ubuntu 24.04 con Docker Compose e un cluster
DigitalOcean Managed PostgreSQL. Caddy espone soltanto le porte 80/443 e gestisce
automaticamente HTTPS; frontend e backend restano sulla rete Docker privata.

### 1. Risorse DigitalOcean

1. Crea un progetto e una VPC nella regione scelta.
2. Crea un Droplet Ubuntu 24.04 nella stessa VPC, assegna un Reserved IP e abilita
   Monitoring e backup.
3. Crea un cluster Managed PostgreSQL 16 nella stessa VPC.
4. Aggiungi il Droplet come unica trusted source del database e scarica il
   certificato CA.
5. Applica un Cloud Firewall:
   - TCP 80/443 da Internet;
   - TCP 22 solo dall'IP amministrativo;
   - nessuna esposizione pubblica di 4000, 4200 o 5432.

Sul Droplet installa Docker Engine con il plugin Compose e crea l'utente `deploy`
con accesso SSH a chiave. La pipeline richiede che questo utente possa eseguire
senza password i comandi di deploy con `sudo`.

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

### 3. File protetti sul Droplet

```bash
sudo install -d -m 0750 -o root -g deploy /etc/music-release-artists
sudo install -d -m 0755 /opt/music-release-artists/deploy
```

Copia e compila i template:

- [`deploy/env.production.example`](deploy/env.production.example) →
  `/etc/music-release-artists/deploy.env`
- [`deploy/app.env.example`](deploy/app.env.example) →
  `/etc/music-release-artists/app.env`
- [`deploy/migration.env.example`](deploy/migration.env.example) →
  `/etc/music-release-artists/migration.env`
- CA DigitalOcean → `/etc/music-release-artists/ca-certificate.crt`
- PAT GitHub con solo `read:packages` →
  `/etc/music-release-artists/ghcr-token`

Proteggi tutti i file:

```bash
sudo chown root:deploy /etc/music-release-artists/*
sudo chmod 0640 /etc/music-release-artists/*
```

Il runtime usa `mra_app`; soltanto [`deploy/deploy.sh`](deploy/deploy.sh) legge
`migration.env` per applicare le migration con `mra_migrator`. La credenziale
non viene aggiunta all'ambiente del container backend in esecuzione.

### 4. Dominio e OAuth

Il repository usa `music.example.com` come placeholder. Prima del go-live:

1. sostituiscilo in `deploy.env` e `app.env`;
2. punta il record A/AAAA al Reserved IP;
3. imposta nel pannello Spotify l'URI esatta:
   `https://tuo-dominio/api/auth/spotify/callback`;
4. imposta `APP_BASE_URL=https://tuo-dominio/api` e
   `FRONTEND_ORIGIN=https://tuo-dominio`.

Spotify OAuth remoto richiede HTTPS; il deploy non viene eseguito finché la
variabile GitHub `DEPLOY_ENABLED` non vale `true`.

### 5. GitHub Actions

Crea l'environment GitHub `production`, abilita l'approvazione manuale e aggiungi:

- variable: `DEPLOY_ENABLED=true` solo quando DNS e server sono pronti;
- secrets: `DO_HOST`, `DO_USER`, `DO_SSH_PRIVATE_KEY`, `DO_SSH_HOST_KEY`,
  `PUBLIC_DOMAIN`.

La pipeline [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. esegue test/typecheck backend e build Angular;
2. pubblica immagini GHCR `backend` e `frontend` con tag `sha-<commit>`;
3. carica la configurazione sul Droplet;
4. applica migration one-shot, avvia la release e controlla
   `/api/health/ready`;
5. ripristina automaticamente il tag precedente se la readiness fallisce.

Il token GHCR presente sul Droplet deve appartenere all'utente indicato da
`GHCR_USERNAME` in `deploy.env`. Le migration production devono essere additive
e retrocompatibili: il rollback cambia le immagini, non esegue migration `down`.

### 6. Avvio al reboot e monitoraggio

Installa l'unità systemd dopo il primo upload della pipeline:

```bash
sudo cp /opt/music-release-artists/deploy/music-release-artists.service \
  /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now music-release-artists
```

Configura un DigitalOcean Uptime Check su:

```text
https://tuo-dominio/api/health/ready
```

`/api/health/live` verifica il processo, mentre `/api/health/ready` verifica
anche la connessione PostgreSQL. Il backend deve restare a una replica perché
esegue internamente i job periodici di sync e invio email.
