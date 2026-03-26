# Fase 4 — Dashboard UI (Release Grid + Filtri + Infinite Scroll)

## Obiettivo
Implementare la dashboard principale con griglia di release musicali, filtri, ordinamento e infinite scroll.

## Prerequisiti
- Fase 3 completata (frontend foundation con routing e auth)
- Fase 2 completata (API releases e artisti funzionanti)

## Cosa si fa

### 1. ReleaseCard (`src/components/releases/release-card.tsx`)
- Immagine copertina album/singolo
- Titolo della release
- Nome artista
- Data di uscita (formattata)
- Badge tipo (Album / Single / EP / Compilation)
- Link diretto a Spotify (icona/bottone)
- Hover effect, aspect ratio cover 1:1

### 2. ReleaseGrid (`src/components/releases/release-grid.tsx`)
- Griglia CSS responsive:
  - Mobile (< 640px): 1 colonna
  - Tablet (640-1024px): 2 colonne
  - Desktop (1024-1440px): 3 colonne
  - Large (> 1440px): 4 colonne
- Infinite scroll con `react-intersection-observer`:
  - Sentinel element alla fine della griglia
  - Quando visibile, carica la pagina successiva
  - Usa `useInfiniteQuery` di TanStack Query

### 3. FilterBar (`src/components/releases/filter-bar.tsx`)
- **Filtro tipo:** Select con opzioni: Tutti, Album, Single, EP, Compilation
- **Filtro artista:** Select/autocomplete con lista artisti seguiti
- **Ricerca testo:** Input con debounce (300ms) per cercare per titolo o artista
- **Ordinamento:** Select: "Più recenti" / "Meno recenti"
- I filtri aggiornano i query params nell'URL (persistenza tramite URL)
- Ogni cambio filtro resetta l'infinite scroll alla pagina 1

### 4. Skeleton Loader (`src/components/releases/release-skeleton.tsx`)
- Card placeholder animata durante il caricamento
- Griglia di 8-12 skeleton cards al primo load
- Skeleton cards aggiuntive durante il caricamento di pagine successive

### 5. Empty States
- **Nessuna release trovata** (filtri attivi) → messaggio + suggerimento di rimuovere filtri
- **Nessuna release** (primo utilizzo) → CTA per sincronizzare ("Sincronizza le tue uscite da Spotify")
- **Spotify non collegato** → CTA per collegare account Spotify

### 6. Bottone Sync
- Bottone "Aggiorna" nella toolbar della dashboard
- Chiama `POST /api/v1/releases/sync` e poi `POST /api/v1/artists/sync`
- Stato loading durante la sync
- Invalida le query TanStack dopo la sync per refresh automatico

### 7. Hooks
- `useReleases()` — wrappa `useInfiniteQuery` per GET /releases con filtri
- `useArtists()` — wrappa `useQuery` per GET /artists (per il filtro dropdown)
- `useDebounce(value, delay)` — debounce del valore di ricerca

### 8. Types (`src/types/index.ts`)
- `Release` — tipo TypeScript per una release
- `Artist` — tipo TypeScript per un artista
- `PaginatedResponse<T>` — tipo per risposte paginate `{ data: T[], meta: {...} }`

## File da creare
- `frontend/src/pages/dashboard.tsx` (implementazione completa)
- `frontend/src/components/releases/release-card.tsx`
- `frontend/src/components/releases/release-grid.tsx`
- `frontend/src/components/releases/filter-bar.tsx`
- `frontend/src/components/releases/release-skeleton.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/hooks/use-releases.ts`
- `frontend/src/hooks/use-artists.ts`
- `frontend/src/hooks/use-debounce.ts`
- `frontend/src/types/index.ts`

## Pacchetti
```bash
cd frontend && npm i react-intersection-observer
```

## Verifica
1. Dopo aver sincronizzato (bottone Sync), la griglia si popola con release cards
2. Scrollare verso il basso carica automaticamente la pagina successiva (verificare nel network tab)
3. Selezionare "Album" nel filtro tipo mostra solo album
4. Selezionare un artista nel filtro mostra solo le sue release
5. Digitare nel campo ricerca filtra dopo debounce
6. Cambiare ordinamento riordina la griglia
7. Su viewport mobile: 1 colonna. Tablet: 2 colonne. Desktop: 3-4 colonne
8. Durante il caricamento: skeleton cards visibili
9. Con filtri che non matchano nulla: empty state con suggerimento
10. Senza Spotify collegato: CTA per collegare
