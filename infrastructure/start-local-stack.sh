#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"

BACKEND_PORT="${BACKEND_PORT:-4008}"
WEB_PORT="${WEB_PORT:-5175}"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/bunna_bank_app}"
WEB_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${BACKEND_PORT}}"

SEED_DATA="false"

print_usage() {
  cat <<EOF
Usage: ./infrastructure/start-local-stack.sh [--seed] [--help]

Starts the backend and web apps together for local PoC work.

Options:
  --seed   Seed demo data before starting services
  --help   Show this help message

Environment:
  BACKEND_PORT       Backend port (default: 4008)
  WEB_PORT           Web port (default: 5175)
  MONGODB_URI        MongoDB connection string
  VITE_API_BASE_URL  Web API base URL (default: http://localhost:\${BACKEND_PORT})

Mobile still runs separately:
  cd "$ROOT_DIR/mobile"
  flutter run --dart-define=API_BASE_URL="$WEB_API_BASE_URL"
EOF
}

while (($# > 0)); do
  case "$1" in
    --seed)
      SEED_DATA="true"
      shift
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

if [[ "$SEED_DATA" == "true" ]]; then
  echo "Seeding demo data with MONGODB_URI=$MONGODB_URI"
  (
    cd "$BACKEND_DIR"
    MONGODB_URI="$MONGODB_URI" npm run seed:demo
  )
fi

BACKEND_LOG="$(mktemp -t amhara-backend.XXXXXX.log)"
WEB_LOG="$(mktemp -t amhara-web.XXXXXX.log)"
BACKEND_PID=""
WEB_PID=""

cleanup() {
  local exit_code=$?

  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ $exit_code -ne 0 ]]; then
    echo
    echo "Stack stopped with an error."
  else
    echo
    echo "Stack stopped."
  fi

  echo "Backend log: $BACKEND_LOG"
  echo "Web log: $WEB_LOG"

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Starting backend on port $BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  PORT="$BACKEND_PORT" MONGODB_URI="$MONGODB_URI" npm run start:dev
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo "Starting web on port $WEB_PORT with API $WEB_API_BASE_URL"
(
  cd "$WEB_DIR"
  PORT="$WEB_PORT" VITE_API_BASE_URL="$WEB_API_BASE_URL" npm run dev -- --host 0.0.0.0 --port "$WEB_PORT"
) >"$WEB_LOG" 2>&1 &
WEB_PID=$!

echo
echo "Local stack running"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Web:     http://localhost:$WEB_PORT"
echo "Mobile:  flutter run --dart-define=API_BASE_URL=$WEB_API_BASE_URL"
echo
echo "Demo credentials"
echo "  Member shareholder: 0911000001 / demo-pass"
echo "  Member regular:     0911000002 / demo-pass"
echo "  Staff admin:        admin.demo / demo-pass"
echo "  Staff district:     district.demo / demo-pass"
echo "  Staff branch:       branch.demo / demo-pass"
echo
echo "Logs"
echo "  Backend: $BACKEND_LOG"
echo "  Web:     $WEB_LOG"
echo
echo "Press Ctrl+C to stop both services."

wait "$BACKEND_PID" "$WEB_PID"
