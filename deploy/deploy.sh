#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/music-release-artists}"
DEPLOY_ENV="${DEPLOY_ENV:-/etc/music-release-artists/deploy.env}"
MIGRATION_ENV="${MIGRATION_ENV:-/etc/music-release-artists/migration.env}"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
PREVIOUS_FILE="${APP_DIR}/.deploy-previous"
LOCK_FILE="/var/lock/music-release-artists-deploy.lock"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 2
fi

sha="${1#sha-}"
if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid git SHA: $1" >&2
  exit 2
fi
new_tag="sha-${sha}"

for required_file in "$DEPLOY_ENV" "$MIGRATION_ENV" "$COMPOSE_FILE"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing required file: $required_file" >&2
    exit 1
  fi
done

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$DEPLOY_ENV"
set +a

: "${IMAGE_REGISTRY:?IMAGE_REGISTRY is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${PUBLIC_DOMAIN:?PUBLIC_DOMAIN is required}"
: "${ACME_EMAIL:?ACME_EMAIL is required}"
: "${GHCR_USERNAME:?GHCR_USERNAME is required}"
: "${GHCR_TOKEN_FILE:?GHCR_TOKEN_FILE is required}"
: "${APP_ENV_FILE:?APP_ENV_FILE is required}"
: "${DATABASE_CA_FILE:?DATABASE_CA_FILE is required}"

for protected_file in "$GHCR_TOKEN_FILE" "$APP_ENV_FILE" "$DATABASE_CA_FILE"; do
  if [[ ! -r "$protected_file" ]]; then
    echo "Required file is not readable: $protected_file" >&2
    exit 1
  fi
done

compose() {
  docker compose --env-file "$DEPLOY_ENV" -f "$COMPOSE_FILE" "$@"
}

update_image_tag() {
  local tag="$1"
  local temp_file
  temp_file="$(mktemp "${DEPLOY_ENV}.XXXXXX")"
  awk -v tag="$tag" '
    BEGIN { found = 0 }
    /^IMAGE_TAG=/ { print "IMAGE_TAG=" tag; found = 1; next }
    { print }
    END { if (!found) print "IMAGE_TAG=" tag }
  ' "$DEPLOY_ENV" >"$temp_file"
  chmod --reference="$DEPLOY_ENV" "$temp_file"
  chown --reference="$DEPLOY_ENV" "$temp_file"
  mv "$temp_file" "$DEPLOY_ENV"
  export IMAGE_TAG="$tag"
}

wait_for_ready() {
  local url="https://${PUBLIC_DOMAIN}/api/health/ready"
  for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error --max-time 10 "$url" >/dev/null; then
      return 0
    fi
    echo "Waiting for readiness (${attempt}/30)..."
    sleep 5
  done
  return 1
}

rollback() {
  local previous_tag="$1"
  if [[ ! "$previous_tag" =~ ^sha-[0-9a-f]{40}$ ]]; then
    echo "No valid previous release exists; stopping failed first deploy." >&2
    compose down
    return
  fi
  echo "Rolling back to ${previous_tag}" >&2
  update_image_tag "$previous_tag"
  compose up -d --remove-orphans
  wait_for_ready || echo "Rollback started, but readiness is still failing." >&2
}

previous_tag="$IMAGE_TAG"
if [[ "$previous_tag" == "$new_tag" ]]; then
  echo "Release ${new_tag} is already deployed."
  exit 0
fi

echo "Authenticating to GHCR..."
docker login ghcr.io --username "$GHCR_USERNAME" --password-stdin <"$GHCR_TOKEN_FILE"

echo "Pulling release ${new_tag}..."
IMAGE_TAG="$new_tag" compose pull backend frontend

echo "Applying database migrations..."
IMAGE_TAG="$new_tag" compose run --rm --no-deps \
  --env-from-file "$MIGRATION_ENV" backend npm run migrate

printf '%s\n' "$previous_tag" >"$PREVIOUS_FILE"
update_image_tag "$new_tag"

echo "Starting release ${new_tag}..."
if ! compose up -d --remove-orphans; then
  rollback "$previous_tag"
  exit 1
fi

if ! wait_for_ready; then
  rollback "$previous_tag"
  exit 1
fi

docker image prune -f --filter "until=168h" >/dev/null
echo "Release ${new_tag} deployed successfully."
