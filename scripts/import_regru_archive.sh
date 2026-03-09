#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST is required}"
REMOTE_USER="${REMOTE_USER:?REMOTE_USER is required}"
REMOTE_DIR="${REMOTE_DIR:?REMOTE_DIR is required}"
REMOTE_SITE_URL="${REMOTE_SITE_URL:?REMOTE_SITE_URL is required}"
ARCHIVE_URL="${ARCHIVE_URL:?ARCHIVE_URL is required}"
SSH_PASSWORD="${SSH_PASSWORD:?SSH_PASSWORD is required}"
SSH_PORT="${SSH_PORT:-22}"
WORK_DIR="${WORK_DIR:-$(mktemp -d)}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SSH_OPTS=( -o StrictHostKeyChecking=no -o ConnectTimeout=20 )
SSH_CMD=(sshpass -e ssh -p "${SSH_PORT}" "${SSH_OPTS[@]}")
RSYNC_RSH="sshpass -e ssh -p ${SSH_PORT} ${SSH_OPTS[*]}"

export SSHPASS="${SSH_PASSWORD}"

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

if ! command -v sshpass >/dev/null 2>&1; then
  echo "sshpass is required" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

mkdir -p "${WORK_DIR}/download" "${WORK_DIR}/extract"

archive_name="$(basename "${ARCHIVE_URL%%\?*}")"
archive_path="${WORK_DIR}/download/${archive_name:-catalog-archive}"

echo "[import] downloading archive"
curl -fL --retry 3 --retry-delay 2 --output "${archive_path}" "${ARCHIVE_URL}"

echo "[import] extracting archive"
case "${archive_path,,}" in
  *.zip)
    unzip -q "${archive_path}" -d "${WORK_DIR}/extract"
    ;;
  *.tar.gz|*.tgz)
    tar -xzf "${archive_path}" -C "${WORK_DIR}/extract"
    ;;
  *.tar)
    tar -xf "${archive_path}" -C "${WORK_DIR}/extract"
    ;;
  *)
    if ! tar -xf "${archive_path}" -C "${WORK_DIR}/extract" 2>/dev/null; then
      echo "unsupported archive format: ${archive_name}" >&2
      exit 1
    fi
    ;;
esac

if ! find "${WORK_DIR}/extract" -mindepth 1 -maxdepth 1 | grep -q .; then
  echo "archive extracted empty payload" >&2
  exit 1
fi

echo "[import] backing up remote data"
"${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
  mkdir -p '${REMOTE_DIR}/_backup/import-${TIMESTAMP}' '${REMOTE_DIR}/data/files';
  if [ -d '${REMOTE_DIR}/data/files' ]; then
    cp -a '${REMOTE_DIR}/data/files' '${REMOTE_DIR}/_backup/import-${TIMESTAMP}/files';
  fi
  if [ -f '${REMOTE_DIR}/data/max_catalog.db' ]; then
    cp -a '${REMOTE_DIR}/data/max_catalog.db' '${REMOTE_DIR}/_backup/import-${TIMESTAMP}/max_catalog.db';
  fi
  if [ -f '${REMOTE_DIR}/data/max_bot_runtime.db' ]; then
    cp -a '${REMOTE_DIR}/data/max_bot_runtime.db' '${REMOTE_DIR}/_backup/import-${TIMESTAMP}/max_bot_runtime.db';
  fi
"

echo "[import] syncing extracted files to remote data/files"
rsync -az --delete \
  -e "${RSYNC_RSH}" \
  "${WORK_DIR}/extract/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/data/files/"

echo "[import] forcing catalog rebuild on next request"
"${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
  rm -f '${REMOTE_DIR}/data/max_catalog.db'
"

echo "[import] warming up public site"
bootstrap_json="$(curl -fsSL --retry 3 --retry-delay 2 "${REMOTE_SITE_URL%/}/api.php?action=bootstrap")"
echo "${bootstrap_json}"

