#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"
MOBILE_DIR="$ROOT_DIR/mobile"

BACKEND_PORT="${BACKEND_PORT:-4000}"
WEB_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${BACKEND_PORT}}"
MOBILE_API_BASE_URL="${API_BASE_URL:-$WEB_API_BASE_URL}"

cat <<EOF
CBE Bank PoC local demo commands

1. Start MongoDB
   Ensure MongoDB is running for:
   ${BACKEND_PORT:+MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/cbe_bank_app}}

2. Seed demo data
   cd "$BACKEND_DIR"
   npm run seed:demo

3. Start backend
   cd "$BACKEND_DIR"
   npm run start:dev

4. Start web in real API mode
   cd "$WEB_DIR"
   VITE_API_BASE_URL="$WEB_API_BASE_URL" npm run dev

5. Start mobile in real API mode
   cd "$MOBILE_DIR"
   flutter run --dart-define=API_BASE_URL="$MOBILE_API_BASE_URL"

Demo credentials
  Member shareholder: 0911000001 / demo-pass
  Member regular:     0911000002 / demo-pass
  Staff admin:        admin.demo / demo-pass
  Staff district:     district.demo / demo-pass
  Staff branch:       branch.demo / demo-pass
EOF
