#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SITE_DIR="${SITE_DIR:-${ROOT_DIR}/yamal_catalog_site_php}"
REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST is required}"
REMOTE_USER="${REMOTE_USER:?REMOTE_USER is required}"
REMOTE_DIR="${REMOTE_DIR:?REMOTE_DIR is required}"
SSH_PORT="${SSH_PORT:-22}"
SSH_OPTS=( -o StrictHostKeyChecking=no -o ConnectTimeout=15 )
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SITE_TITLE="${SITE_TITLE:-Бренд Ямал}"
SSH_PASSWORD="${SSH_PASSWORD:-}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required" >&2
  exit 1
fi

SSH_CMD=(ssh -p "${SSH_PORT}" "${SSH_OPTS[@]}")
RSYNC_RSH="ssh -p ${SSH_PORT} ${SSH_OPTS[*]}"
if [[ -n "${SSH_PASSWORD}" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "sshpass is required when SSH_PASSWORD is set" >&2
    exit 1
  fi
  export SSHPASS="${SSH_PASSWORD}"
  SSH_CMD=(sshpass -e ssh -p "${SSH_PORT}" "${SSH_OPTS[@]}")
  RSYNC_RSH="sshpass -e ssh -p ${SSH_PORT} ${SSH_OPTS[*]}"
fi

REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

"${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
  "mkdir -p '${REMOTE_DIR}/_backup/${TIMESTAMP}' '${REMOTE_DIR}/data/files'; for item in index.html index.php api.php download.php .env assets src; do if [ -e '${REMOTE_DIR}/'\$item ]; then cp -a '${REMOTE_DIR}/'\$item '${REMOTE_DIR}/_backup/${TIMESTAMP}/'; fi; done"

rsync -az --delete \
  -e "${RSYNC_RSH}" \
  --exclude '.env' \
  --exclude 'data/' \
  --exclude '_backup/' \
  --exclude 'test/' \
  --exclude 'tools/' \
  --exclude 'README.md' \
  "${SITE_DIR}/" "${REMOTE_TARGET}"

"${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
  "if [ ! -f '${REMOTE_DIR}/.env' ]; then cat > '${REMOTE_DIR}/.env' <<'EOF'
SITE_TITLE=${SITE_TITLE}
CATALOG_DB_PATH=${REMOTE_DIR}/data/max_catalog.db
RUNTIME_DB_PATH=${REMOTE_DIR}/data/max_bot_runtime.db
CATALOG_ROOT_PATH=${REMOTE_DIR}/data/files
PAGE_SIZE=18
FAVORITES_LIMIT=8
PUBLIC_BASE=
EOF
fi"

echo "Deployed to ${REMOTE_HOST}:${REMOTE_DIR}"
