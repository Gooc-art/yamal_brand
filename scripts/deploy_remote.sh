#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/sergey/yamal_brand}"
DEPLOY_SERVICE="${DEPLOY_SERVICE:-max_yamal_bot.service}"
BOT_DIR="${BOT_DIR:-${DEPLOY_DIR}/max_bot_sqlite}"
ENV_FILE="${ENV_FILE:-${BOT_DIR}/.env}"
CATALOG_SOURCE_DIR="${CATALOG_SOURCE_DIR:-${DEPLOY_DIR}/input/Макеты1}"
CATALOG_DB_PATH="${CATALOG_DB_PATH:-${DEPLOY_DIR}/max_catalog.db}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
LEGACY_DEPLOY_DIR="${LEGACY_DEPLOY_DIR:-/root/projects/yamal_brand}"
LEGACY_ENV_FILE="${LEGACY_ENV_FILE:-${LEGACY_DEPLOY_DIR}/max_bot_sqlite/.env}"
LEGACY_CATALOG_SOURCE_DIR="${LEGACY_CATALOG_SOURCE_DIR:-${LEGACY_DEPLOY_DIR}/input/Макеты1}"

run_systemctl() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n "$@"
  else
    echo "[deploy] ERROR: privileged command failed and sudo is unavailable: $*" >&2
    exit 1
  fi
}

echo "[deploy] host=$(hostname) dir=${DEPLOY_DIR} service=${DEPLOY_SERVICE}"

if [ ! -d "${DEPLOY_DIR}" ]; then
  echo "[deploy] ERROR: deploy dir not found: ${DEPLOY_DIR}" >&2
  exit 1
fi
if [ ! -d "${BOT_DIR}" ]; then
  echo "[deploy] ERROR: bot dir not found: ${BOT_DIR}" >&2
  exit 1
fi
if [ ! -d "${CATALOG_SOURCE_DIR}" ]; then
  echo "[deploy] source folder missing, trying legacy path"
  mkdir -p "$(dirname "${CATALOG_SOURCE_DIR}")"
  if run_systemctl cp -R "${LEGACY_CATALOG_SOURCE_DIR}" "$(dirname "${CATALOG_SOURCE_DIR}")/" 2>/dev/null; then
    echo "[deploy] source folder copied from legacy path"
  fi
fi
if [ ! -d "${CATALOG_SOURCE_DIR}" ]; then
  echo "[deploy] ERROR: source folder not found: ${CATALOG_SOURCE_DIR}" >&2
  exit 1
fi
if [ ! -f "${DEPLOY_DIR}/scripts/build_sqlite_catalog.py" ]; then
  echo "[deploy] ERROR: build_sqlite_catalog.py not found" >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "[deploy] .env missing, trying legacy path"
  mkdir -p "$(dirname "${ENV_FILE}")"
  if run_systemctl cp "${LEGACY_ENV_FILE}" "${ENV_FILE}" 2>/dev/null; then
    echo "[deploy] .env copied from legacy path"
  fi
fi

if [ ! -f "${ENV_FILE}" ]; then
  if [ -f "${BOT_DIR}/.env.example" ]; then
    cp "${BOT_DIR}/.env.example" "${ENV_FILE}"
  fi
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "[deploy] ERROR: .env missing at ${ENV_FILE}. Fill MAX_BOT_TOKEN and rerun." >&2
  exit 1
fi

if ! grep -q '^MAX_BOT_TOKEN=' "${ENV_FILE}"; then
  echo "[deploy] ERROR: MAX_BOT_TOKEN is missing in ${ENV_FILE}" >&2
  exit 1
fi
if grep -Eq '^MAX_BOT_TOKEN=(\s*|put_your_token_here)$' "${ENV_FILE}"; then
  echo "[deploy] ERROR: MAX_BOT_TOKEN is empty/placeholder in ${ENV_FILE}" >&2
  exit 1
fi

echo "[deploy] install dependencies"
cd "${BOT_DIR}"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo "[deploy] rebuild SQLite catalog"
"${PYTHON_BIN}" "${DEPLOY_DIR}/scripts/build_sqlite_catalog.py" \
  --source "${CATALOG_SOURCE_DIR}" \
  --db "${CATALOG_DB_PATH}"

echo "[deploy] install/update systemd unit"
if [ -f "${BOT_DIR}/systemd/max_yamal_bot.service" ]; then
  if [ "$(id -u)" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "[deploy] ERROR: passwordless sudo is required for systemctl/cp on runner host" >&2
    exit 1
  fi
  run_systemctl cp "${BOT_DIR}/systemd/max_yamal_bot.service" "/etc/systemd/system/max_yamal_bot.service"
fi

echo "[deploy] restart service"
run_systemctl systemctl daemon-reload
run_systemctl systemctl enable --now "${DEPLOY_SERVICE}"
run_systemctl systemctl restart "${DEPLOY_SERVICE}"
run_systemctl systemctl --no-pager --full status "${DEPLOY_SERVICE}" -n 40

echo "[deploy] recent logs"
run_systemctl journalctl -u "${DEPLOY_SERVICE}" -S '10 minutes ago' --no-pager -l | tail -n 120 || true

echo "[deploy] done"
