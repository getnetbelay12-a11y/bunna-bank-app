#!/bin/bash

echo "Starting Bunna Bank App..."

(cd /Users/getnetbelay/Documents/bunna_bank_ap/web && VITE_API_BASE_URL=http://127.0.0.1:4008 npm run dev -- --host 0.0.0.0 --port 5175) &

(cd /Users/getnetbelay/Documents/bunna_bank_ap/backend && HOST=0.0.0.0 PORT=4008 npm run seed:demo && HOST=0.0.0.0 PORT=4008 npm run start:dev) &

(cd /Users/getnetbelay/Documents/bunna_bank_ap/mobile && flutter run -d 0580DD06-7073-4FC6-AD41-B5860BFEDA62 --dart-define=API_BASE_URL=http://127.0.0.1:4008)

wait
