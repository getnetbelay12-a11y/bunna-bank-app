#!/bin/bash

echo "Starting Bunna Bank App..."

(cd /Users/getnetbelay/Documents/bunna_bank_ap/web && npm run dev) &

(cd /Users/getnetbelay/Documents/bunna_bank_ap/backend && HOST=0.0.0.0 npm run seed:demo && HOST=0.0.0.0 npm run start:dev) &

(cd /Users/getnetbelay/Documents/bunna_bank_ap/mobile && flutter run -d 0580DD06-7073-4FC6-AD41-B5860BFEDA62 --dart-define=API_BASE_URL=http://127.0.0.1:4000)

wait
