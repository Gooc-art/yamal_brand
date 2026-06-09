#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-max_yamal_bot.service}"
LOOKBACK_HOURS="${LOOKBACK_HOURS:-12}"
JOURNAL_LINES="${JOURNAL_LINES:-120}"

SUDO=()
if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
  SUDO=(sudo -n)
fi

echo "[diag] service=${SERVICE_NAME}"
echo "[diag] lookback_hours=${LOOKBACK_HOURS}"
echo "[diag] journal_lines=${JOURNAL_LINES}"
echo "[diag] now_utc=$(date -u '+%Y-%m-%d %H:%M:%S')"

echo
echo "[diag] systemctl status"
"${SUDO[@]}" systemctl status "${SERVICE_NAME}" --no-pager -n 40 || true

echo
echo "[diag] systemctl show"
"${SUDO[@]}" systemctl show "${SERVICE_NAME}" \
  -p ActiveState \
  -p SubState \
  -p Result \
  -p MainPID \
  -p ExecMainStatus \
  -p NRestarts \
  -p EnvironmentFiles \
  -p ActiveEnterTimestamp || true

env_file=""
environment_files="$("${SUDO[@]}" systemctl show "${SERVICE_NAME}" -p EnvironmentFiles --value 2>/dev/null || true)"
if [ -n "${environment_files}" ] && [ "${environment_files}" != "n/a" ]; then
  env_file="$(printf '%s\n' "${environment_files}" | awk '{print $1}' | sed 's/^-//')"
fi
if [ -z "${env_file}" ] && [ -f "./max_bot_sqlite/.env" ]; then
  env_file="./max_bot_sqlite/.env"
fi

read_env_value() {
  local name="$1"
  local file="$2"
  awk -F= -v key="${name}" '$1 == key {print substr($0, length(key) + 2); exit}' "${file}" 2>/dev/null
}

resolve_env_path() {
  local value="$1"
  local base_dir="$2"
  if [ -z "${value}" ]; then
    printf ''
    return
  fi
  case "${value}" in
    /*) printf '%s' "${value}" ;;
    *) printf '%s/%s' "${base_dir}" "${value}" ;;
  esac
}

echo
echo "[diag] env path checks"
if [ -n "${env_file}" ] && [ -f "${env_file}" ]; then
  env_dir="$(cd "$(dirname "${env_file}")" && pwd)"
  catalog_db="$(resolve_env_path "$(read_env_value CATALOG_DB_PATH "${env_file}")" "${env_dir}")"
  runtime_db="$(resolve_env_path "$(read_env_value RUNTIME_DB_PATH "${env_file}")" "${env_dir}")"
  catalog_root="$(resolve_env_path "$(read_env_value CATALOG_ROOT_PATH "${env_file}")" "${env_dir}")"
  echo "env_file=${env_file}"
  echo "CATALOG_DB_PATH=${catalog_db:-<default>}"
  echo "RUNTIME_DB_PATH=${runtime_db:-<default>}"
  echo "CATALOG_ROOT_PATH=${catalog_root:-<default>}"
  [ -z "${catalog_db}" ] || [ -f "${catalog_db}" ] && echo "catalog_db=ok" || echo "catalog_db=missing"
  [ -z "${runtime_db}" ] || [ -d "$(dirname "${runtime_db}")" ] && echo "runtime_dir=ok" || echo "runtime_dir=missing"
  [ -z "${catalog_root}" ] || [ -d "${catalog_root}" ] && echo "catalog_root=ok" || echo "catalog_root=missing"
else
  echo "env_file=missing"
fi

journal_file="$(mktemp)"
trap 'rm -f "${journal_file}"' EXIT

"${SUDO[@]}" journalctl -u "${SERVICE_NAME}" --since "-${LOOKBACK_HOURS} hours" --no-pager > "${journal_file}" || true

echo
echo "[diag] recent journal tail"
tail -n "${JOURNAL_LINES}" "${journal_file}" || true

echo
echo "[diag] recent restart lines"
rg -n 'Started |Scheduled restart job|Stopping |Stopped |Deactivated successfully' "${journal_file}" || true

echo
echo "[diag] recent error lines"
rg -n 'Attachment not ready|fetch failed|UND_ERR_|Headers Timeout Error|\[handler\] error|upload failed|fallback reply failed|Invalid access_token|TypeError|ReferenceError|SyntaxError' "${journal_file}" || true

echo
echo "[diag] recent boot/update lines"
rg -n '\[boot\]|\[update\]' "${journal_file}" || true

echo
echo "[diag] error counters"
for pattern in \
  'Attachment not ready' \
  'fetch failed' \
  'UND_ERR_HEADERS_TIMEOUT' \
  'UND_ERR_CONNECT_TIMEOUT' \
  '\[handler\] error' \
  'upload failed' \
  'fallback reply failed' \
  'Invalid access_token'
do
  if rg -q "${pattern}" "${journal_file}"; then
    count="$(rg -c "${pattern}" "${journal_file}")"
  else
    count="0"
  fi
  echo "${pattern}: ${count}"
done

echo
echo "[diag] bot processes"
pgrep -af 'src/bot.js' || true
