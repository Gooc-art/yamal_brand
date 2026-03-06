#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/sergey/yamal_brand}"
BOT_DIR="${BOT_DIR:-${DEPLOY_DIR}/max_bot_sqlite}"
NODE_BIN="${NODE_BIN:-${DEPLOY_DIR}/.runtime/node/bin/node}"
RUN_DIR="${RUN_DIR:-${DEPLOY_DIR}/run}"
LOG_DIR="${LOG_DIR:-${DEPLOY_DIR}/logs}"
PID_FILE="${PID_FILE:-${RUN_DIR}/max_bot.pid}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/max_bot.log}"

mkdir -p "${RUN_DIR}" "${LOG_DIR}"

is_running() {
  [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null
}

start_bot() {
  if is_running; then
    echo "[user-bot] already running pid=$(cat "${PID_FILE}")"
    return 0
  fi

  cd "${BOT_DIR}"
  env -u RUNNER_TRACKING_ID nohup "${NODE_BIN}" src/bot.js >> "${LOG_FILE}" 2>&1 < /dev/null &
  echo $! > "${PID_FILE}"
  sleep 2

  if ! is_running; then
    echo "[user-bot] failed to start" >&2
    tail -n 80 "${LOG_FILE}" || true
    exit 1
  fi

  echo "[user-bot] started pid=$(cat "${PID_FILE}")"
}

stop_bot() {
  if ! is_running; then
    rm -f "${PID_FILE}"
    echo "[user-bot] not running"
    return 0
  fi

  local pid
  pid="$(cat "${PID_FILE}")"
  kill "${pid}" 2>/dev/null || true

  for _ in $(seq 1 20); do
    if ! kill -0 "${pid}" 2>/dev/null; then
      rm -f "${PID_FILE}"
      echo "[user-bot] stopped"
      return 0
    fi
    sleep 1
  done

  echo "[user-bot] stop timeout for pid=${pid}" >&2
  exit 1
}

status_bot() {
  if is_running; then
    echo "[user-bot] running pid=$(cat "${PID_FILE}")"
    return 0
  fi

  echo "[user-bot] not running"
  return 1
}

install_reboot_job() {
  local current
  local tmp
  local entry

  entry="@reboot DEPLOY_DIR='${DEPLOY_DIR}' BOT_DIR='${BOT_DIR}' NODE_BIN='${NODE_BIN}' bash '${DEPLOY_DIR}/scripts/manage_user_bot.sh' start"
  current="$(crontab -l 2>/dev/null || true)"
  tmp="$(mktemp)"
  printf '%s\n' "${current}" | grep -Fv "scripts/manage_user_bot.sh' start" > "${tmp}" || true
  printf '%s\n' "${entry}" >> "${tmp}"
  crontab "${tmp}"
  rm -f "${tmp}"
  echo "[user-bot] ensured @reboot crontab entry"
}

tail_logs() {
  tail -n 120 "${LOG_FILE}" 2>/dev/null || true
}

case "${1:-}" in
  start)
    start_bot
    ;;
  stop)
    stop_bot
    ;;
  restart)
    stop_bot || true
    start_bot
    ;;
  status)
    status_bot
    ;;
  deploy)
    install_reboot_job
    stop_bot || true
    start_bot
    status_bot
    tail_logs
    ;;
  logs)
    tail_logs
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|deploy|logs}" >&2
    exit 1
    ;;
esac
