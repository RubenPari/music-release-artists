# Fase 5 — Settings e Preferenze Notifiche

## Obiettivo
Implementare la pagina impostazioni con gestione delle preferenze di notifica email e endpoint di unsubscribe.

## Prerequisiti
- Fase 3 completata (frontend con routing e pagina settings placeholder)
- Fase 1 completata (colonne notifica nel modello User)

## Cosa si fa

### 1. Backend: NotificationSettingsController

**`show`** — GET /api/v1/settings/notifications
- Restituisce le preferenze notifiche dell'utente corrente:
  - `notifications_enabled` (boolean)
  - `notification_frequency` (string: 'daily' | 'weekly')
  - `notification_types` (array: ['album', 'single', 'ep', 'compilation'])

**`update`** — PATCH /api/v1/settings/notifications
- Aggiorna le preferenze con validazione VineJS:
  - `enabled` (boolean, opzionale)
  - `frequency` (string enum: daily/weekly, opzionale)
  - `types` (array di stringhe, opzionale)

**`unsubscribe`** — POST /api/v1/notifications/unsubscribe
- Accetta un token HMAC firmato (non richiede auth)
- Il token contiene l'user_id firmato con APP_KEY
- Disabilita le notifiche per quell'utente
- Genera il token con: `encryption.encrypt({ userId, purpose: 'unsubscribe' })`
- Verifica con: `encryption.decrypt(token)` + controllo purpose

### 2. Backend: Validatore
- `notificationSettingsValidator` — valida il body della PATCH:
  - `enabled`: vine.boolean().optional()
  - `frequency`: vine.string().in(['daily', 'weekly']).optional()
  - `types`: vine.array(vine.string().in(['album', 'single', 'ep', 'compilation'])).optional()

### 3. Frontend: Pagina Settings (`src/pages/settings.tsx`)
- Sezione "Profilo" — info utente, stato Spotify (collegato/non collegato), bottone collega/scollega
- Sezione "Notifiche Email" — form con:
  - Toggle on/off notifiche
  - Select frequenza (Giornaliera / Settimanale) — visibile solo se notifiche attive
  - Checkbox tipi release (Album, Single, EP, Compilation) — visibili solo se notifiche attive
  - Bottone "Salva"
- Feedback visivo: toast di conferma al salvataggio

### 4. Frontend: Hook `useNotificationSettings()`
- `useQuery` per GET /settings/notifications
- `useMutation` per PATCH /settings/notifications con invalidazione della query

## File da creare
- `backend/app/controllers/notification_settings_controller.ts`
- `backend/app/validators/notification_settings.ts`
- `frontend/src/pages/settings.tsx` (implementazione completa)
- `frontend/src/components/settings/notification-form.tsx`
- `frontend/src/hooks/use-notification-settings.ts`

## File da modificare
- `backend/start/routes.ts` — aggiungere route settings e unsubscribe

## Route
```
GET   /api/v1/settings/notifications      → NotificationSettingsController.show       (auth)
PATCH /api/v1/settings/notifications      → NotificationSettingsController.update     (auth)
POST  /api/v1/notifications/unsubscribe   → NotificationSettingsController.unsubscribe (no auth, token)
```

## Verifica
1. `GET /api/v1/settings/notifications` restituisce le preferenze correnti (default: disabled, daily, tutti i tipi)
2. `PATCH /api/v1/settings/notifications` con `{ "enabled": true, "frequency": "weekly" }` aggiorna il DB
3. La pagina `/settings` carica le preferenze e le mostra nel form
4. Modificare le preferenze e salvare → toast di conferma, DB aggiornato
5. Generare un token unsubscribe → `POST /notifications/unsubscribe` con quel token → notifiche disabilitate
6. Token invalido → errore 400
7. Toggle notifiche off → campi frequenza e tipi nascosti
