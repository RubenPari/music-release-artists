# Fase 2 — Sync Artisti e Release (Backend)

## Obiettivo
Creare gli endpoint API per sincronizzare gli artisti seguiti e le loro uscite musicali da Spotify, con filtri, paginazione e rate limiting.

## Prerequisiti
- Fase 1 completata (schema DB, modelli, SpotifyService)

## Cosa si fa

### 1. ArtistsController
- `index` — Lista artisti seguiti dall'utente corrente (con paginazione)
  - Query dalla pivot `user_artists` con preload dell'artista
- `sync` — Sincronizza artisti da Spotify:
  1. Chiama `SpotifyService.getFollowedArtists()` (gestendo cursor pagination)
  2. Per ogni artista: upsert nella tabella `artists` (by `spotify_artist_id`)
  3. Aggiorna la pivot `user_artists`: aggiungi nuovi, rimuovi non più seguiti
  4. Aggiorna `last_synced_at` sugli artisti

### 2. ReleasesController
- `index` — Lista release paginata con filtri:
  - `page` (default 1), `limit` (default 20, max 50)
  - `type` — filtra per tipo (album, single, ep, compilation)
  - `artist_id` — filtra per artista specifico
  - `sort` — `release_date_desc` (default) o `release_date_asc`
  - `q` — ricerca testo su titolo release e nome artista
  - Solo release di artisti seguiti dall'utente corrente
- `latest` — Release degli ultimi N giorni (param `days`, default 30)
- `sync` — Sincronizza release da Spotify:
  1. Per ogni artista seguito dall'utente, chiama `SpotifyService.getArtistAlbums()`
  2. Upsert nella tabella `releases` (by `spotify_release_id`)
  3. `first_seen_at` viene settato solo al primo insert (mai aggiornato)

### 3. Validatori VineJS
- `releaseIndexValidator` — valida query params (page, limit, type, artist_id, sort, q)
- `releaseLatestValidator` — valida param `days`

### 4. Transformers
- `ArtistTransformer` — espone: id, spotifyArtistId, name, imageUrl, genres, followers, lastSyncedAt
- `ReleaseTransformer` — espone: id, spotifyReleaseId, title, type, coverUrl, releaseDate, spotifyUrl, firstSeenAt, artist (nested)

### 5. Rate Limiting
- Installare `@adonisjs/limiter`
- Configurare limite sugli endpoint sync: max 5 richieste per minuto per utente
- Middleware throttle registrato nel kernel

## File da creare
- `backend/app/controllers/artists_controller.ts`
- `backend/app/controllers/releases_controller.ts`
- `backend/app/validators/release.ts`
- `backend/app/transformers/artist_transformer.ts`
- `backend/app/transformers/release_transformer.ts`
- `backend/config/limiter.ts`

## File da modificare
- `backend/app/services/spotify_service.ts` — completare metodi se necessario
- `backend/start/routes.ts` — aggiungere route artisti e release
- `backend/adonisrc.ts` — aggiungere limiter provider
- `backend/start/kernel.ts` — registrare middleware throttle

## Pacchetti
```bash
cd backend && npm i @adonisjs/limiter
```

## Route
```
GET  /api/v1/artists              → ArtistsController.index   (auth)
POST /api/v1/artists/sync         → ArtistsController.sync    (auth, rate limited)
GET  /api/v1/releases             → ReleasesController.index  (auth)
GET  /api/v1/releases/latest      → ReleasesController.latest (auth)
POST /api/v1/releases/sync        → ReleasesController.sync   (auth, rate limited)
```

## Verifica
1. Login → collega Spotify → `POST /api/v1/artists/sync` → artisti nel DB e nella pivot
2. `GET /api/v1/artists` → lista artisti con transformer
3. `POST /api/v1/releases/sync` → release importate per ogni artista seguito
4. `GET /api/v1/releases?type=album&sort=release_date_desc&page=1&limit=20` → risposta paginata
5. `GET /api/v1/releases?q=nome_artista` → filtro ricerca funzionante
6. `GET /api/v1/releases/latest?days=7` → solo release recenti
7. Ripetere sync velocemente → 429 Too Many Requests dopo 5 tentativi
