# Fase 6 — Newsletter Email e Cron Job

## Obiettivo
Implementare l'invio automatico di email digest con le nuove uscite musicali, con cron job schedulato e storico notifiche.

## Prerequisiti
- Fase 5 completata (preferenze notifiche)
- Fase 2 completata (release sincronizzate nel DB)

## Cosa si fa

### 1. Configurare Mailtrap come provider email
- Installare `@adonisjs/mail`
- Configurare il transport per Mailtrap REST API (non SMTP)
- Variabili ambiente: `MAILTRAP_API_TOKEN`, `MAIL_FROM`

### 2. Ace Command: `sync:releases`
- Comando: `node ace sync:releases`
- Per ogni utente con Spotify collegato:
  1. Verifica/refresh access token Spotify
  2. Recupera artisti seguiti e aggiorna pivot
  3. Per ogni artista, recupera uscite recenti
  4. Upsert release nel DB (`first_seen_at` solo al primo insert)
- Gestione errori per utente singolo (non blocca gli altri)
- Logging strutturato per ogni operazione

### 3. Ace Command: `send:release_digest`
- Comando: `node ace send:release_digest`
- Logica:
  1. Fetch utenti con `notifications_enabled = true` e Spotify collegato
  2. Per ogni utente, controlla la frequenza:
     - `daily`: ultimo invio > 24h fa (o mai inviato)
     - `weekly`: ultimo invio > 7 giorni fa (o mai inviato)
  3. Query release dove `first_seen_at` > data ultimo invio (da `notification_logs`)
  4. Filtra per `notification_types` dell'utente
  5. Se nuove release > 0: componi e invia email
  6. Logga in `notification_logs` con status sent/failed
- **Idempotenza:** controlla `notification_logs` per evitare doppi invii nello stesso periodo

### 4. Template Email (Edge)
- `resources/views/emails/release-digest.edge`
- Contenuto:
  - Intestazione personalizzata: "Ciao {displayName || fullName}!"
  - Lista release con: copertina (img), titolo, artista, data, tipo, link Spotify
  - Link per aprire la dashboard
  - Link unsubscribe (con token HMAC firmato)
- Stile inline CSS per compatibilità email client

### 5. Mail Class
- `app/mails/release_digest.ts`
- Configura: from, to, subject, template, dati

### 6. NotificationHistoryController
- `index` — GET /api/v1/notifications/history
  - Lista paginata dei log notifiche dell'utente corrente
  - Campi: sent_at, releases_count, status

### 7. Frontend: Storico Notifiche
- Sezione nella pagina Settings sotto le preferenze
- Tabella/lista con: data invio, numero release, stato (inviata/fallita)
- Paginazione semplice

## File da creare
- `backend/config/mail.ts`
- `backend/commands/send_release_digest.ts`
- `backend/commands/sync_releases.ts`
- `backend/app/mails/release_digest.ts`
- `backend/resources/views/emails/release-digest.edge`
- `backend/app/controllers/notification_history_controller.ts`
- `backend/app/transformers/notification_log_transformer.ts`
- `frontend/src/components/settings/notification-history.tsx`
- `frontend/src/hooks/use-notification-history.ts`

## File da modificare
- `backend/adonisrc.ts` — aggiungere mail provider
- `backend/start/routes.ts` — aggiungere route notification history
- `backend/start/env.ts` — aggiungere MAILTRAP_API_TOKEN, MAIL_FROM
- `frontend/src/pages/settings.tsx` — aggiungere sezione storico

## Pacchetti
```bash
cd backend && npm i @adonisjs/mail
```

## Variabili ambiente (.env)
```
MAILTRAP_API_TOKEN=
MAIL_FROM=noreply@tuodominio.com
```

## Route
```
GET /api/v1/notifications/history → NotificationHistoryController.index (auth)
```

## Verifica
1. `node ace sync:releases` sincronizza tutte le release per tutti gli utenti
2. `node ace send:release_digest` invia email solo a utenti con notifiche attive e novità
3. Verificare ricezione email su Mailtrap con contenuto corretto (release, link, unsubscribe)
4. Rieseguire immediatamente `send:release_digest` → nessuna email inviata (idempotente)
5. `GET /api/v1/notifications/history` restituisce i log
6. Nella pagina Settings, la sezione storico mostra le email inviate
7. Cron di sistema per schedulazione:
   ```
   0 6 * * * cd /path/to/backend && node ace sync:releases
   0 8 * * * cd /path/to/backend && node ace send:release_digest
   ```
