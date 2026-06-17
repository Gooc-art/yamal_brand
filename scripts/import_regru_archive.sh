#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST is required}"
REMOTE_USER="${REMOTE_USER:?REMOTE_USER is required}"
REMOTE_DIR="${REMOTE_DIR:?REMOTE_DIR is required}"
REMOTE_SITE_URL="${REMOTE_SITE_URL:?REMOTE_SITE_URL is required}"
ARCHIVE_URL="${ARCHIVE_URL:-}"
ARCHIVE_PATH="${ARCHIVE_PATH:-}"
ARCHIVE_SUBDIR="${ARCHIVE_SUBDIR:-}"
REMOTE_SYNC_SUBDIR="${REMOTE_SYNC_SUBDIR:-}"
REMOTE_LAYOUT_ROOT_NAME="${REMOTE_LAYOUT_ROOT_NAME:-Макеты1}"
EXCLUDE_TIFF="${EXCLUDE_TIFF:-0}"
SYNC_WEB_FORMATS="${SYNC_WEB_FORMATS:-0}"
WARMUP_TIMEOUT_SECONDS="${WARMUP_TIMEOUT_SECONDS:-60}"
SSH_PASSWORD="${SSH_PASSWORD:?SSH_PASSWORD is required}"
SSH_PORT="${SSH_PORT:-22}"
WORK_DIR="${WORK_DIR:-$(mktemp -d)}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
IMPORT_LABEL="${IMPORT_LABEL:-import-${TIMESTAMP}}"
SSH_OPTS=( -o StrictHostKeyChecking=no -o ConnectTimeout=20 )
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HELPER_PY="${SCRIPT_DIR}/import_regru_archive_paths.py"

SSH_CMD=()
RSYNC_RSH=""
RSYNC_ARGS=( -azs --delete )
export SSHPASS="${SSH_PASSWORD}"
export SSH_ASKPASS_HELPER=""

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh is required" >&2
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

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

if [ ! -f "${HELPER_PY}" ]; then
  echo "helper script not found: ${HELPER_PY}" >&2
  exit 1
fi

if [ -z "${ARCHIVE_URL}" ] && [ -z "${ARCHIVE_PATH}" ]; then
  echo "either ARCHIVE_URL or ARCHIVE_PATH is required" >&2
  exit 1
fi

if [ -n "${ARCHIVE_URL}" ] && [ -n "${ARCHIVE_PATH}" ]; then
  echo "use only one archive source: ARCHIVE_URL or ARCHIVE_PATH" >&2
  exit 1
fi

if command -v sshpass >/dev/null 2>&1; then
  SSH_CMD=(sshpass -e ssh -p "${SSH_PORT}" "${SSH_OPTS[@]}")
  RSYNC_RSH="sshpass -e ssh -p ${SSH_PORT} ${SSH_OPTS[*]}"
else
  if ! command -v setsid >/dev/null 2>&1; then
    echo "setsid is required when sshpass is unavailable" >&2
    exit 1
  fi

  askpass_script="${WORK_DIR}/ssh_askpass.sh"
  ssh_wrapper="${WORK_DIR}/ssh_wrapper.sh"

  cat > "${askpass_script}" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "${SSH_PASSWORD:?SSH_PASSWORD is required}"
EOF
  chmod 700 "${askpass_script}"

  cat > "${ssh_wrapper}" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
export SSH_ASKPASS="${SSH_ASKPASS_HELPER:?SSH_ASKPASS_HELPER is required}"
export SSH_ASKPASS_REQUIRE=force
export DISPLAY="${DISPLAY:-:0}"
exec setsid -w ssh "$@"
EOF
  chmod 700 "${ssh_wrapper}"

  export SSH_ASKPASS_HELPER="${askpass_script}"
  SSH_CMD=("${ssh_wrapper}" -p "${SSH_PORT}" "${SSH_OPTS[@]}")
  RSYNC_RSH="${ssh_wrapper} -p ${SSH_PORT} ${SSH_OPTS[*]}"
fi

if [ "${SYNC_WEB_FORMATS}" = "1" ]; then
  RSYNC_ARGS+=(
    --delete-excluded
    --include '*/'
    --include '*.png' --include '*.PNG'
    --include '*.jpg' --include '*.JPG'
    --include '*.jpeg' --include '*.JPEG'
    --include '*.pdf' --include '*.PDF'
    --include '*.svg' --include '*.SVG'
    --exclude '*'
  )
elif [ "${EXCLUDE_TIFF}" = "1" ]; then
  RSYNC_ARGS+=( --exclude '*.tif' --exclude '*.tiff' --exclude '*.TIF' --exclude '*.TIFF' )
fi

mkdir -p "${WORK_DIR}/download" "${WORK_DIR}/extract"

archive_source="${ARCHIVE_URL}"
source_root="${WORK_DIR}/extract"
if [ -n "${ARCHIVE_PATH}" ]; then
  if [ ! -f "${ARCHIVE_PATH}" ] && [ ! -d "${ARCHIVE_PATH}" ]; then
    echo "archive path not found: ${ARCHIVE_PATH}" >&2
    exit 1
  fi
  archive_source="${ARCHIVE_PATH}"
fi

if [ -n "${ARCHIVE_PATH}" ] && [ -d "${ARCHIVE_PATH}" ]; then
  echo "[import] using local catalog directory"
  source_root="${ARCHIVE_PATH%/}"
else
  archive_name="$(basename "${archive_source%%\?*}")"
  archive_path="${WORK_DIR}/download/${archive_name:-catalog-archive}"

  if [ -n "${ARCHIVE_URL}" ]; then
    echo "[import] downloading archive"
    curl -fL --retry 3 --retry-delay 2 --output "${archive_path}" "${ARCHIVE_URL}"
  else
    echo "[import] copying local archive"
    cp -a "${ARCHIVE_PATH}" "${archive_path}"
  fi

  echo "[import] extracting archive"
  case "${archive_path,,}" in
    *.zip)
      unzip -q "${archive_path}" -d "${WORK_DIR}/extract"
      ;;
    *.tar.gz|*.tgz)
      tar -xzf "${archive_path}" -C "${WORK_DIR}/extract"
      ;;
    *.tar.xz|*.txz)
      tar -xJf "${archive_path}" -C "${WORK_DIR}/extract"
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
fi

if ! find "${source_root}" -mindepth 1 -maxdepth 1 | grep -q .; then
  echo "archive extracted empty payload" >&2
  exit 1
fi

backup_dir="${REMOTE_DIR}/_backup/${IMPORT_LABEL}"

if [ -n "${ARCHIVE_SUBDIR}" ]; then
  source_dir="$(python3 "${HELPER_PY}" locate-subdir --extract-root "${source_root}" --subdir "${ARCHIVE_SUBDIR}")"
  if [ -z "${REMOTE_SYNC_SUBDIR}" ]; then
    REMOTE_SYNC_SUBDIR="$(basename "${source_dir}")"
  fi

  remote_catalog_root="$("${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
    if [ -d '${REMOTE_DIR}/data/files/${REMOTE_LAYOUT_ROOT_NAME}' ]; then
      printf '%s' '${REMOTE_DIR}/data/files/${REMOTE_LAYOUT_ROOT_NAME}';
    else
      printf '%s' '${REMOTE_DIR}/data/files';
    fi
  ")"
  remote_target_dir="${remote_catalog_root%/}/${REMOTE_SYNC_SUBDIR}"
  remote_target_parent="$(dirname "${remote_target_dir}")"
  remote_target_backup="${backup_dir}/$(basename "${remote_target_dir}")"
  remote_incoming_dir="${REMOTE_DIR}/_incoming/${IMPORT_LABEL}"

  echo "[import] staging extracted subtree"
  "${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
    mkdir -p '${REMOTE_DIR}/_incoming' '${backup_dir}';
    rm -rf '${remote_incoming_dir}';
  "

  rsync "${RSYNC_ARGS[@]}" \
    -e "${RSYNC_RSH}" \
    "${source_dir}/" "${REMOTE_USER}@${REMOTE_HOST}:${remote_incoming_dir}/"

  echo "[import] swapping remote subtree ${REMOTE_SYNC_SUBDIR}"
  "${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
    set -euo pipefail
    mkdir -p '${backup_dir}' '${remote_target_parent}'
    if [ -f '${REMOTE_DIR}/data/max_catalog.db' ]; then
      cp -a '${REMOTE_DIR}/data/max_catalog.db' '${backup_dir}/max_catalog.db'
    fi
    if [ -d '${remote_target_dir}' ]; then
      mv '${remote_target_dir}' '${remote_target_backup}'
    fi
    mv '${remote_incoming_dir}' '${remote_target_dir}'
    rm -f '${REMOTE_DIR}/data/max_catalog.db'
  "
else
  echo "[import] backing up remote data"
  "${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
    mkdir -p '${backup_dir}' '${REMOTE_DIR}/data/files';
    if [ -d '${REMOTE_DIR}/data/files' ]; then
      cp -a '${REMOTE_DIR}/data/files' '${backup_dir}/files';
    fi
    if [ -f '${REMOTE_DIR}/data/max_catalog.db' ]; then
      cp -a '${REMOTE_DIR}/data/max_catalog.db' '${backup_dir}/max_catalog.db';
    fi
    if [ -f '${REMOTE_DIR}/data/max_bot_runtime.db' ]; then
      cp -a '${REMOTE_DIR}/data/max_bot_runtime.db' '${backup_dir}/max_bot_runtime.db';
    fi
  "

  echo "[import] syncing extracted files to remote data/files"
  rsync "${RSYNC_ARGS[@]}" \
    -e "${RSYNC_RSH}" \
    "${source_root}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/data/files/"

  echo "[import] forcing catalog rebuild on next request"
  "${SSH_CMD[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "
    rm -f '${REMOTE_DIR}/data/max_catalog.db'
  "
fi

echo "[import] warming up public site"
bootstrap_json="$(curl -fsSL --retry 3 --retry-delay 2 --max-time "${WARMUP_TIMEOUT_SECONDS}" "${REMOTE_SITE_URL%/}/api.php?action=bootstrap")"
echo "${bootstrap_json}"
