# Requisiti — Music Release Artists

App multi-utente per tracciare le uscite musicali degli artisti seguiti su Spotify e ricevere notifiche email quando esce qualcosa di nuovo.

---

## 1. Visione e problema

Chi segue molti artisti su Spotify spesso perde album, single ed EP nuovi: non esiste un feed unico e affidabile delle uscite “dei miei artisti”, né un alert tempestivo.

**Obiettivo MVP:** dopo il login con Spotify, l’utente vede un feed personale delle uscite recenti degli artisti che segue e, se ha attivato le notifiche, riceve un’email quando il sistema rileva una nuova uscita.

---

## 2. Attori

| Attore | Descrizione |
|--------|-------------|
| **Utente** | Persona autenticata con Spotify; vede solo i propri artisti, uscite e preferenze. |
| **Sistema** | Job di sincronizzazione Spotify, persistenza dati, invio email. |

Nell’MVP **non** è previsto un pannello di amministrazione.

---

## 3. Stack di riferimento (implementazione)

Vincoli di progetto (non requisiti di prodotto per l’utente finale):

| Layer | Tecnologia |
|-------|------------|
| Backend | Encore.ts (TypeScript) |
| Frontend | Angular |
| Database | PostgreSQL (gestito / integrato via Encore) |
| Sync / email | Cron o pub/sub job su Encore |

---

## 4. Requisiti funzionali (MVP)

### RF-01 — Autenticazione Spotify

- L’utente può effettuare **login** e **logout** tramite Spotify OAuth.
- La sessione è persistente (rimane autenticato tra visite, finché valida).
- In caso di token revocato o scaduto e non rinnovabile, l’utente viene portato a rifare il login.
- Ogni utente vede **solo** i propri dati (isolamento per account).

### RF-02 — Sincronizzazione artisti seguiti

- Fonte unica degli artisti: **Spotify followed artists** (nessun follow manuale nell’MVP).
- All’accesso (o subito dopo il primo login) parte una sync degli artisti seguiti.
- L’utente può richiedere un **refresh on-demand**.
- Il sistema esegue anche una sync **periodica** (ogni 6–12 ore).

### RF-03 — Sincronizzazione uscite

- Per ogni artista seguito, il sistema recupera le uscite di tipo **album**, **single**, **EP**.
- Escluse dall’MVP le release in cui l’artista compare solo come *appears_on* / compilation non primaria, salvo dove l’API le esponga come album/single/EP dell’artista.
- Le uscite sono deduplicate e associate correttamente all’utente (via artisti seguiti).
- Finestra temporale di riferimento del feed: uscite degli **ultimi 90 giorni** (configurabile in implementazione, ma questo è il default MVP).

### RF-04 — Feed uscite

- Vista principale: elenco uscite ordinate per **data di rilascio** (più recenti prima).
- Vista secondaria MVP: **calendario** (o raggruppamento per giorno/settimana) delle stesse uscite.
- Filtro per tipo: album / single / EP (anche combinabili).
- Ogni item mostra almeno: titolo, artista/i, tipo, data, artwork (se disponibile), **link a Spotify**.
- Stati di caricamento, vuoto (“nessuna uscita”) e errore di sync sono gestiti in UI.

### RF-05 — Notifiche email

- Canale MVP: **solo email** (niente push).
- Opt-in: le notifiche sono disattivate di default o richiedono conferma esplicita in profilo (preferenza salvata).
- Modalità supportate:
  - **Per nuova uscita** (default quando le notifiche sono attive): email quando viene rilevata una uscita non ancora notificata.
  - **Digest giornaliero**: una email al giorno con le nuove uscite accumulate.
- L’utente può disattivare le notifiche e/o cambiare modalità.
- Ogni email include un modo per **disiscriversi** / spegnere le notifiche.
- L’invio è idempotente: la stessa uscita non genera email duplicate per lo stesso utente.

### RF-06 — Profilo e preferenze

L’utente può vedere/modificare:

- Email usata per le notifiche (presa da Spotify se disponibile; altrimenti impostabile).
- Toggle notifiche on/off.
- Modalità notifica (per uscita / digest giornaliero).
- Timestamp dell’**ultima sincronizzazione** riuscita (artisti e/o uscite).

---

## 5. Fuori scope (MVP)

Esplicitamente **non** inclusi nella prima versione:

- Notifiche push (mobile/web) o Telegram
- Follow / unfollow artisti in app oltre a Spotify
- “Già ascoltato” / mark as seen avanzato in UI (oltre al tracking interno “notificato”)
- Social, condivisione, feed pubblici
- Raccomandazioni o discovery di nuovi artisti
- Creazione automatica di playlist
- Admin panel, analytics prodotto, multi-provider (Apple Music, ecc.)

---

## 6. Flusso dati (alto livello)

```text
Utente --OAuth--> App --token--> Spotify API
                      |
                 Job di sync
                      |
                      v
                   PostgreSQL ----> Feed UI
                      |
                 Nuove uscite
                      v
               Email notifier --> Utente
```

1. Login OAuth → salvataggio utente e token.
2. Sync artisti followed → sync album/single/EP.
3. Persistenza e confronto con uscite già note.
4. Aggiornamento feed; eventuale coda email per uscite nuove (se opt-in).

---

## 7. Modello dati di dominio (minimo)

Entità concettuali richieste dall’MVP:

| Entità | Ruolo |
|--------|--------|
| **User** | Account app legato a Spotify (id Spotify, email, token, ecc.). |
| **Artist** | Artista Spotify (anagrafica condivisa tra utenti). |
| **UserArtist** | Relazione “utente segue artista” (da sync followed). |
| **Release** | Uscita (album/single/EP) con metadati e id Spotify. |
| **UserRelease** | Stato per utente (es. notificata / vista internamente). |
| **NotificationPreference** | Opt-in, modalità, email di destinazione. |
| **SyncRun** | Storico/esito delle sincronizzazioni (debug e “ultima sync”). |

I dettagli di schema (colonne, indici, cifratura token) sono demandati all’implementazione, nel rispetto dei RNF sotto.

---

## 8. Requisiti non funzionali

### RNF-01 — Privacy e sicurezza

- Token Spotify memorizzati in modo sicuro a riposo (cifratura o vault; mai esposti al frontend in chiaro).
- Isolamento dati per utente su tutte le API.
- Segreti (client Spotify, SMTP, chiavi) solo in variabili d’ambiente.

### RNF-02 — Spotify rate limit e sync

- Sync a batch con rispetto dei rate limit Spotify.
- Backoff su errori 429 / transient.
- Evitare richieste ridondanti (cache / “già syncato di recente” dove sensato).

### RNF-03 — Affidabilità

- Job di sync e invio email **idempotenti**.
- Retry controllato per invio email fallito.
- Fallimenti di sync non devono corrompere i dati già presenti; errori osservabili (log / SyncRun).

### RNF-04 — UX

- Interfaccia **mobile-friendly**.
- Lingua UI MVP: **italiano**.
- Tempi di risposta accettabili per navigazione feed (sync pesante in background, non blocco indefinito della UI).

### RNF-05 — Deploy

Deploy tipico: backend Encore.ts + frontend Angular + PostgreSQL + cron/job Encore per sync e email.

---

## 9. Criteri di accettazione MVP

Checklist verificabile per considerare l’MVP completo:

1. Un utente nuovo completa il login Spotify e, entro una sync riuscita, vede i propri artisti seguiti.
2. Nel feed compaiono le uscite (album/single/EP) degli artisti seguiti nella finestra temporale MVP (default 90 giorni).
3. Filtri per tipo uscita funzionano; ogni item ha link apribile a Spotify.
4. Con notifiche attive in modalità “per nuova uscita”, alla prima detection di un’uscita nuova l’utente riceve un’email (senza duplicati a sync successive).
5. Con modalità digest, le nuove uscite della giornata sono riassunte in un’unica email.
6. Disattivazione notifiche / unsubscribe interrompe nuovi invii.
7. Logout invalida la sessione; un altro account non può accedere ai dati del precedente.
8. Refresh on-demand e sync periodica aggiornano artisti/uscite senza duplicare release in feed.

---

## 10. Roadmap post-MVP

Ordine indicativo, non vincolante:

1. Notifiche push e/o Telegram.
2. Follow/unfollow locale (oltre o in aggiunta a Spotify).
3. Filtri avanzati e “mark as seen” in UI.
4. Digest settimanale e preferenze di orario/fuso orario.
5. Estensioni multi-provider o export.

---

## 11. Glossario

| Termine | Significato |
|---------|-------------|
| **Followed artist** | Artista che l’utente segue sul proprio account Spotify. |
| **Release / uscita** | Album, single o EP pubblicato su Spotify. |
| **Sync** | Processo che allinea artisti e uscite da Spotify al database locale. |
| **Detection** | Prima volta in cui il sistema associa una release a un utente come nuova. |
| **Opt-in** | Scelta esplicita di ricevere email di notifica. |
