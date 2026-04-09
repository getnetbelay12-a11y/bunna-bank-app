# Deployment Notes

## Backend
- Set `MONGODB_URI`, `JWT_SECRET`, and `PORT`
- Keep `SMS_PROVIDER`, `EMAIL_PROVIDER`, and `PUSH_PROVIDER` on `log` unless you have configured supported provider settings
- Run `npm install`
- Run `npm run build`
- Optional for local PoC data: `npm run seed:demo`
- Run `npm start`
- Default local database: `mongodb://localhost:27017/bunna_bank_app`
- Default production-safe storage mode: `STORAGE_PROVIDER=local`
- Do not set `STORAGE_PROVIDER=s3` in production until the S3 upload client is implemented
- Do not set `EMAIL_PROVIDER=smtp` or `PUSH_PROVIDER=firebase` in production until those providers are implemented end to end

## Local Demo Helper
- `./infrastructure/run-local-demo.sh` prints the real-API startup commands for backend, web, and mobile using the seeded demo credentials
- `./infrastructure/start-local-stack.sh` starts backend and web together for local PoC work
- `./infrastructure/start-local-stack.sh --seed` seeds demo data first, then starts the stack

## Web
- Set `VITE_API_BASE_URL`
- Run `npm install`
- Run `npm run build`
- For production-like runs, do not enable demo mode or API fallback

## Mobile
- Set `API_BASE_URL` with `--dart-define`, for example:
  `flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4008`
- Run `flutter pub get`
- Run `flutter run`
- Release builds should set `API_BASE_URL`
