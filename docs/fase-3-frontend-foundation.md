# Fase 3 — Frontend Foundation (Routing, Auth, API Client)

## Obiettivo
Costruire la struttura frontend con routing, autenticazione email/password, collegamento account Spotify, e client API tipizzato.

## Prerequisiti
- Fase 1 e 2 completate (backend API funzionante)

## Cosa si fa

### 1. Installare dipendenze
- `react-router-dom` — routing client-side
- `@tanstack/react-query` — data fetching, caching, state management
- `@tuyau/client` — client API tipizzato (si collega al registry generato dal backend)
- `tailwindcss` + `@tailwindcss/vite` — Tailwind CSS v4 (plugin Vite, no config file)

### 2. Configurazione Vite
- Aggiungere proxy: `/api` → `http://127.0.0.1:3333` (evita problemi CORS in dev)
- Aggiungere plugin Tailwind CSS

### 3. API Client (`src/lib/api.ts`)
- Istanza Tuyau client configurata con base URL
- Oppure un semplice wrapper `fetch` con gestione errori e header auth (Bearer token)

### 4. Query Client (`src/lib/query-client.ts`)
- Configurazione TanStack Query con defaults sensati (staleTime, retry)

### 5. Hook `useAuth()` (`src/hooks/use-auth.ts`)
- `login(email, password)` — POST /api/v1/auth/login → salva token
- `signup(fullName, email, password, passwordConfirmation)` — POST /api/v1/auth/signup
- `logout()` — POST /api/v1/auth/logout
- `user` — dati utente corrente (GET /api/v1/account/profile)
- `isAuthenticated` — boolean
- `isSpotifyConnected` — boolean

### 6. Layout Components
- `RootLayout` — wrapper con QueryClientProvider, outlet
- `AppLayout` — navbar (logo, nome utente, avatar, stato Spotify, logout), sidebar opzionale, contenuto principale
- `AuthLayout` — layout centrato per login/signup

### 7. Protected Route (`src/components/protected-route.tsx`)
- Controlla `isAuthenticated`
- Se non autenticato, redirect a `/login`
- Mostra loading durante il check iniziale

### 8. Pagine
- `/login` — form email + password, link a signup
- `/signup` — form fullName, email, password, conferma password
- `/callback` — handler redirect Spotify OAuth (riceve il redirect dal backend callback)
- `/dashboard` — placeholder ("Dashboard — Coming in Fase 4")
- `/settings` — placeholder ("Settings — Coming in Fase 5")

### 9. Collegamento Spotify
- Nel profilo/navbar: indicatore stato Spotify (collegato / non collegato)
- Bottone "Collega Spotify" → redirige a `GET /api/v1/spotify/redirect`
- Dopo callback Spotify, l'utente torna al frontend con account collegato

### 10. Styling base
- Reset CSS con Tailwind
- Sistema colori/tema base
- Componenti UI minimi: Button, Input, Card

## File da creare
- `frontend/src/lib/api.ts`
- `frontend/src/lib/query-client.ts`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/components/layouts/root-layout.tsx`
- `frontend/src/components/layouts/app-layout.tsx`
- `frontend/src/components/layouts/auth-layout.tsx`
- `frontend/src/components/protected-route.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/pages/login.tsx`
- `frontend/src/pages/signup.tsx`
- `frontend/src/pages/callback.tsx`
- `frontend/src/pages/dashboard.tsx` (placeholder)
- `frontend/src/pages/settings.tsx` (placeholder)

## File da modificare/riscrivere
- `frontend/src/main.tsx` — BrowserRouter + QueryClientProvider
- `frontend/src/App.tsx` — definizione route
- `frontend/src/index.css` — direttive Tailwind (`@import "tailwindcss"`)
- `frontend/vite.config.ts` — proxy + plugin Tailwind
- Eliminare `frontend/src/App.css` (sostituito da Tailwind)

## Pacchetti
```bash
cd frontend && npm i react-router-dom @tanstack/react-query @tuyau/client tailwindcss @tailwindcss/vite
```

## Verifica
1. `npm run dev` avvia il frontend su `127.0.0.1:5173`
2. Visitare `/dashboard` senza login → redirect a `/login`
3. Registrarsi su `/signup` → redirect a `/dashboard`
4. Login su `/login` con credenziali → redirect a `/dashboard`
5. Navbar mostra nome utente e "Spotify non collegato"
6. Click "Collega Spotify" → OAuth flow → torna al frontend con "Spotify collegato"
7. Click "Logout" → redirect a `/login`
8. Refresh della pagina mantiene la sessione (token persistito)
