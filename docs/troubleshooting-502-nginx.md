# 502 Bad Gateway (nginx) al login o sulle API

In produzione lo static frontend è servito da nginx, che fa proxy di `/api` verso l’upstream configurato (`BACKEND_UPSTREAM`, default `backend:3333` in Docker Compose).

## Verifiche rapide

1. **Stack completo**: frontend e backend devono stare sulla **stessa rete Docker** e il backend deve essere raggiungibile con il nome host usato in `BACKEND_UPSTREAM` (in Compose di solito `backend`).
2. **Stato servizi**: `docker compose ps` — il backend dovrebbe risultare `healthy` se è configurato l’healthcheck.
3. **Log backend**: `docker compose logs backend --tail 100` (errori di boot, database, variabili d’ambiente).
4. **Rete dal container frontend**:
   ```bash
   docker compose exec frontend wget -qO- http://backend:3333/ || echo FAIL
   ```
   Se fallisce, nginx restituirà 502 alle richieste `/api/...`.

## Cause frequenti

- **`APP_KEY` / Spotify vuoti nel container**: in Compose, `environment: APP_KEY=${APP_KEY}` sostituisce con stringa vuota se la variabile non è nel processo che lancia `docker compose` (Compose non legge `backend/.env` da solo). Quelle chiavi hanno priorità su `env_file` e possono far fallire l’avvio di Adonis. Il servizio `backend` usa `env_file: ./backend/.env` e imposta solo le variabili necessarie al Docker (es. `DB_HOST=postgres`).
- Solo il container frontend avviato, senza backend o con hostname errato.
- Backend ancora in avvio (`npm ci`, migrazioni): con `depends_on: condition: service_healthy` il frontend parte dopo che l’healthcheck del backend ha successo.
- Upstream personalizzato: imposta `BACKEND_UPSTREAM` (es. `host.docker.internal:3333`) nel servizio frontend in compose o nell’ambiente del container. L’immagine nginx usa `NGINX_ENVSUBST_FILTER=BACKEND_UPSTREAM` così solo quella variabile viene espansa e le direttive nginx (`$host`, `$uri`, …) restano intatte.
