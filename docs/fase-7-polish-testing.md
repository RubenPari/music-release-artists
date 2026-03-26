# Fase 7 — Polish, Error Handling e Testing

## Obiettivo
Rendere l'applicazione robusta con gestione errori completa, UX rifinita e test automatizzati.

## Prerequisiti
- Tutte le fasi precedenti completate

## Cosa si fa

### 1. Token Refresh Trasparente
- In `SpotifyService`: prima di ogni chiamata API, controllare `token_expires_at`
- Se scaduto o in scadenza entro 5 minuti: refresh automatico via Spotify
- Aggiornare i token criptati nel DB dopo il refresh
- Se il refresh fallisce (token revocato): segnare `spotify_id = null` e notificare l'utente

### 2. Gestione Errori Spotify API
- **429 Too Many Requests:** leggere header `Retry-After`, attendere e riprovare
- **401 Unauthorized:** tentare refresh token, se fallisce scollegare Spotify
- **500/503 Server Error:** retry con exponential backoff (max 3 tentativi)
- **Network Error:** graceful degradation, mostrare dati cached dal DB
- Logging strutturato di tutti gli errori API

### 3. Error Handling Backend
- Exception handler personalizzato per:
  - Spotify API errors → risposte JSON strutturate
  - Validation errors → formato consistente
  - Auth errors → 401 con messaggio chiaro
- Rate limiting errors → 429 con `Retry-After` header

### 4. Toast Notification System (Frontend)
- Componente `Toast` con varianti: success, error, warning, info
- Hook `useToast()` per trigger da qualsiasi componente
- Auto-dismiss dopo 5 secondi
- Posizionamento: top-right
- Usato per: sync completata, errori, salvataggio settings, etc.

### 5. Pagina 404
- Componente `NotFound` per route non esistenti
- Link per tornare alla dashboard

### 6. Test Funzionali Backend
- **Auth flow:** signup, login, logout, profilo
- **Spotify linking:** mock del driver Ally per simulare OAuth
- **Artists API:** sync (con Spotify API mockato), index
- **Releases API:** sync, index con filtri, latest
- **Settings:** show, update, unsubscribe
- Usare Japa test runner con `@japa/api-client`

### 7. Test Unitari Backend
- **SpotifyService:** mock delle chiamate HTTP, test retry logic
- **Encryption:** verifica encrypt/decrypt token
- **Validators:** test casi validi e invalidi

### 8. Responsive Polish
- Verificare tutti i breakpoint: mobile (375px), tablet (768px), desktop (1440px+)
- FilterBar: collassabile su mobile
- Navbar: menu hamburger su mobile
- Release cards: dimensioni appropriate per ogni viewport

### 9. Performance
- Verificare query N+1 nei controller (usare preload/eager loading)
- Indici DB sulle colonne usate nei filtri (spotify_artist_id, spotify_release_id, release_date, type)
- Ottimizzare le query di ricerca testo

## File da creare
- `frontend/src/components/ui/toast.tsx`
- `frontend/src/hooks/use-toast.ts`
- `frontend/src/pages/not-found.tsx`
- `backend/tests/functional/auth.spec.ts`
- `backend/tests/functional/artists.spec.ts`
- `backend/tests/functional/releases.spec.ts`
- `backend/tests/functional/settings.spec.ts`
- `backend/tests/unit/spotify_service.spec.ts`

## File da modificare
- `backend/app/services/spotify_service.ts` — migliorare error handling e token refresh
- `backend/app/exceptions/handler.ts` — handler errori personalizzato
- `frontend/src/App.tsx` — aggiungere route 404
- `frontend/src/pages/dashboard.tsx` — aggiungere toast per sync
- `frontend/src/components/layouts/app-layout.tsx` — menu mobile responsive

## Verifica
1. Con token Spotify scaduto: il sistema lo rinnova automaticamente senza errori
2. Con token Spotify revocato: l'utente riceve messaggio per ricollegare
3. Errori Spotify API 429: il sistema attende e riprova
4. Toast appare dopo sync completata / errore / salvataggio settings
5. Route inesistente → pagina 404
6. `node ace test --suite functional` → tutti i test passano
7. `node ace test --suite unit` → tutti i test passano
8. UI responsive su mobile, tablet, desktop (testare con DevTools)
9. Nessuna query N+1 (verificare con logging SQL in dev)
