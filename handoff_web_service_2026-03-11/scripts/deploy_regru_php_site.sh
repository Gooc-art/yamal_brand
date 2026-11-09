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
CONSULTANT_LLM_ENABLED="${CONSULTANT_LLM_ENABLED:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
OPENAI_MODEL="${OPENAI_MODEL:-}"
OPENAI_REASONING_EFFORT="${OPENAI_REASONING_EFFORT:-}"
OPENAI_MAX_OUTPUT_TOKENS="${OPENAI_MAX_OUTPUT_TOKENS:-}"
OPENAI_TIMEOUT_SECONDS="${OPENAI_TIMEOUT_SECONDS:-}"
OPENAI_BASE_URL="${OPENAI_BASE_URL:-}"
OPENAI_ORG_ID="${OPENAI_ORG_ID:-}"
OPENAI_PROJECT_ID="${OPENAI_PROJECT_ID:-}"

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

remote_quote() {
  printf "%s" "$1" | sed "s/'/'\\\\''/g"
}

upsert_remote_env() {
  local key="$1"
  local value="$2"
  if [[ -z "${value}" ]]; then
    return 0
  fi
  local quoted
  quoted="$(remote_quote "${value}")"
  "${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
    "ENV_FILE='${REMOTE_DIR}/.env'; TMP_FILE=\"\$ENV_FILE.tmp\"; grep -v '^${key}=' \"\$ENV_FILE\" > \"\$TMP_FILE\" 2>/dev/null || true; printf '%s=%s\n' '${key}' '${quoted}' >> \"\$TMP_FILE\"; mv \"\$TMP_FILE\" \"\$ENV_FILE\""
}

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
CONSULTANT_LLM_ENABLED=0
EOF
fi"

upsert_remote_env "SITE_TITLE" "${SITE_TITLE}"
upsert_remote_env "CONSULTANT_LLM_ENABLED" "${CONSULTANT_LLM_ENABLED}"
upsert_remote_env "OPENAI_API_KEY" "${OPENAI_API_KEY}"
upsert_remote_env "OPENAI_MODEL" "${OPENAI_MODEL}"
upsert_remote_env "OPENAI_REASONING_EFFORT" "${OPENAI_REASONING_EFFORT}"
upsert_remote_env "OPENAI_MAX_OUTPUT_TOKENS" "${OPENAI_MAX_OUTPUT_TOKENS}"
upsert_remote_env "OPENAI_TIMEOUT_SECONDS" "${OPENAI_TIMEOUT_SECONDS}"
upsert_remote_env "OPENAI_BASE_URL" "${OPENAI_BASE_URL}"
upsert_remote_env "OPENAI_ORG_ID" "${OPENAI_ORG_ID}"
upsert_remote_env "OPENAI_PROJECT_ID" "${OPENAI_PROJECT_ID}"

echo "Deployed to ${REMOTE_HOST}:${REMOTE_DIR}"
