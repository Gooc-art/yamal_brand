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
  -p ActiveEnterTimestamp || true

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
