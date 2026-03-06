#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/sergey/yamal_brand}"
DEPLOY_SERVICE="${DEPLOY_SERVICE:-max_yamal_bot.service}"
BOT_DIR="${BOT_DIR:-${DEPLOY_DIR}/max_bot_sqlite}"
ENV_FILE="${ENV_FILE:-${BOT_DIR}/.env}"
CATALOG_SOURCE_DIR="${CATALOG_SOURCE_DIR:-${DEPLOY_DIR}/input/Макеты1}"
CATALOG_DB_PATH="${CATALOG_DB_PATH:-${DEPLOY_DIR}/max_catalog.db}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
NODE_VERSION="${NODE_VERSION:-20.11.1}"
NODE_RUNTIME_LINK="${NODE_RUNTIME_LINK:-${DEPLOY_DIR}/.runtime/node}"
LEGACY_DEPLOY_DIR="${LEGACY_DEPLOY_DIR:-/root/projects/yamal_brand}"
LEGACY_ENV_FILE="${LEGACY_ENV_FILE:-${LEGACY_DEPLOY_DIR}/max_bot_sqlite/.env}"
LEGACY_CATALOG_SOURCE_DIR="${LEGACY_CATALOG_SOURCE_DIR:-${LEGACY_DEPLOY_DIR}/input/Макеты1}"

NODE_BIN=""
NPM_BIN=""

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

ensure_node_runtime() {
  if [ -x "${NODE_RUNTIME_LINK}/bin/node" ] && [ -x "${NODE_RUNTIME_LINK}/bin/npm" ]; then
    NODE_BIN="${NODE_RUNTIME_LINK}/bin/node"
    NPM_BIN="${NODE_RUNTIME_LINK}/bin/npm"
    export PATH="${NODE_RUNTIME_LINK}/bin:${PATH}"
    return
  fi

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
    NPM_BIN="$(command -v npm)"
    export PATH="$(dirname "${NODE_BIN}"):${PATH}"
    return
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "[deploy] ERROR: curl is required to bootstrap Node.js runtime" >&2
    exit 1
  fi
  if ! command -v tar >/dev/null 2>&1; then
    echo "[deploy] ERROR: tar is required to bootstrap Node.js runtime" >&2
    exit 1
  fi

  local arch
  case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "[deploy] ERROR: unsupported CPU architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac

  local runtime_root
  local node_dist
  local archive_name
  local download_url
  local tmp_dir

  runtime_root="${DEPLOY_DIR}/.runtime"
  node_dist="node-v${NODE_VERSION}-linux-${arch}"
  archive_name="${node_dist}.tar.xz"
  download_url="https://nodejs.org/dist/v${NODE_VERSION}/${archive_name}"

  mkdir -p "${runtime_root}"
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "${tmp_dir}"' RETURN

  echo "[deploy] bootstrap local Node.js runtime ${NODE_VERSION} (${arch})"
  curl -fsSL "${download_url}" -o "${tmp_dir}/${archive_name}"
  tar -xf "${tmp_dir}/${archive_name}" -C "${tmp_dir}"
  rm -rf "${runtime_root}/${node_dist}"
  mv "${tmp_dir}/${node_dist}" "${runtime_root}/${node_dist}"
  ln -sfn "${runtime_root}/${node_dist}" "${NODE_RUNTIME_LINK}"

  NODE_BIN="${NODE_RUNTIME_LINK}/bin/node"
  NPM_BIN="${NODE_RUNTIME_LINK}/bin/npm"
  export PATH="${NODE_RUNTIME_LINK}/bin:${PATH}"
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
ensure_node_runtime
cd "${BOT_DIR}"
if [ -f package-lock.json ]; then
  "${NPM_BIN}" ci --no-audit --no-fund
else
  "${NPM_BIN}" install --no-audit --no-fund
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
