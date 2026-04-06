# Fase 1 — Database Schema + Spotify Account Linking (Backend)

## Obiettivo
Creare lo schema DB completo e il flusso per collegare l'account Spotify all'utente già autenticato con email/password.

## Cosa si fa

### 1. Nuova migration: aggiungere colonne Spotify alla tabella `users`
| Colonna | Tipo | Note |
|---------|------|------|
| `spotify_id` | string, nullable, unique | ID Spotify dell'utente |
| `display_name` | string, nullable | Nome visualizzato da Spotify |
| `avatar_url` | string, nullable | URL immagine profilo Spotify |
| `access_token_enc` | text, nullable | Access token criptato AES-256 |
| `refresh_token_enc` | text, nullable | Refresh token criptato AES-256 |
| `token_expires_at` | datetime, nullable | Scadenza access token |
| `notifications_enabled` | boolean, default false | Notifiche email attive |
| `notification_frequency` | string, default 'daily' | Frequenza: daily/weekly |
| `notification_types` | text, nullable | JSON array dei tipi release da notificare |
| `country` | string, nullable | Country Spotify per market filter |

### 2. Nuove migration per tabelle dominio

**`artists`**
- `id` (PK, autoincrement)
- `spotify_artist_id` (string, unique)
- `name` (string)
- `image_url` (string, nullable)
- `genres` (text, nullable) — JSON array
- `followers` (integer, default 0)
- `last_synced_at` (datetime, nullable)
- `created_at`, `updated_at`

**`user_artists`** (pivot)
- `user_id` (FK → users)
- `artist_id` (FK → artists)
- `followed_at` (datetime)

**`releases`**
- `id` (PK, autoincrement)
- `spotify_release_id` (string, unique)
- `artist_id` (FK → artists)
- `title` (string)
- `type` (string) — album/single/ep/compilation
- `cover_url` (string, nullable)
- `release_date` (string) — formato YYYY-MM-DD o YYYY
- `spotify_url` (string)
- `first_seen_at` (datetime)
- `created_at`, `updated_at`

**`notification_logs`**
- `id` (PK, autoincrement)
- `user_id` (FK → users)
- `sent_at` (datetime)
- `releases_count` (integer)
- `status` (string) — sent/failed
- `error_message` (text, nullable)
- `created_at`, `updated_at`

### 3. Modelli Lucid

**`Artist`** — relazioni: `manyToMany(User)`, `hasMany(Release)`
**`Release`** — relazioni: `belongsTo(Artist)`
**`NotificationLog`** — relazioni: `belongsTo(User)`
**`User`** (aggiornare) — aggiungere: colonne Spotify, `manyToMany(Artist)`, `hasMany(NotificationLog)`, proprietà computed `isSpotifyConnected`

### 4. Installare e configurare `@adonisjs/ally`
- `npm i @adonisjs/ally`
- `node ace configure @adonisjs/ally`
- Creare `config/ally.ts` con driver Spotify
- Scopes: `user-read-private`, `user-read-email`, `user-follow-read`

### 5. SpotifyAuthController
- `redirect` — redirige a Spotify OAuth (richiede utente autenticato)
- `callback` — riceve authorization code, scambia per token, salva token criptati + profilo Spotify nell'utente corrente
- `disconnect` — rimuove spotify_id e token dall'utente

### 6. SpotifyService
Classe wrapper per Spotify Web API:
- `getProfile(accessToken)` — GET /me
- `getFollowedArtists(accessToken, after?)` — GET /me/following?type=artist (cursor-based pagination)
- `getArtistAlbums(accessToken, artistId, market?)` — GET /artists/{id}/albums
- `refreshAccessToken(refreshToken)` — POST https://accounts.spotify.com/api/token
- Retry con exponential backoff (3 tentativi, delay: 1s, 2s, 4s)

### 7. Crittografia token
Usare `encryption.encrypt()` / `encryption.decrypt()` di AdonisJS (AES-256-GCM con APP_KEY) per salvare/leggere i token Spotify nel DB.

## File da creare
- `backend/config/ally.ts`
- `backend/app/controllers/spotify_auth_controller.ts`
- `backend/app/services/spotify_service.ts`
- `backend/app/models/artist.ts`
- `backend/app/models/release.ts`
- `backend/app/models/notification_log.ts`
- `backend/database/migrations/*_add_spotify_columns_to_users.ts`
- `backend/database/migrations/*_create_artists_table.ts`
- `backend/database/migrations/*_create_user_artists_table.ts`
- `backend/database/migrations/*_create_releases_table.ts`
- `backend/database/migrations/*_create_notification_logs_table.ts`

## File da modificare
- `backend/app/models/user.ts` — aggiungere colonne Spotify + relazioni
- `backend/adonisrc.ts` — aggiungere ally provider
- `backend/start/routes.ts` — aggiungere route Spotify
- `backend/start/env.ts` — aggiungere SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
- `backend/app/transformers/user_transformer.ts` — esporre campi Spotify

## Pacchetti
```bash
cd backend && npm i @adonisjs/ally
```

## Variabili ambiente (.env)
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3333/api/v1/spotify/callback
```

## Route
```
GET  /api/v1/spotify/redirect     → SpotifyAuthController.redirect   (auth required)
GET  /api/v1/spotify/callback     → SpotifyAuthController.callback   (auth required)
POST /api/v1/spotify/disconnect   → SpotifyAuthController.disconnect (auth required)
```

## Verifica
1. `node ace migration:run` crea tutte le tabelle con colonne corrette
2. Signup con email/password → login → `GET /api/v1/spotify/redirect` → redirect a Spotify
3. Dopo consenso Spotify, callback salva token criptati e spotify_id nell'utente
4. `GET /api/v1/account/profile` mostra i nuovi campi Spotify (display_name, avatar_url, spotify_id, isSpotifyConnected)
5. Verificare nel DB che `access_token_enc` e `refresh_token_enc` non sono in chiaro
6. `POST /api/v1/spotify/disconnect` rimuove i dati Spotify dall'utente
