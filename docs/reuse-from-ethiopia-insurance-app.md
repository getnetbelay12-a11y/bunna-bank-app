# Reuse From Ethiopia Insurance App

## Files Reviewed
- `/Users/getnetbelay/Documents/Ethiopia insurance app/README.md`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env.example`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/README.md`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/src/config/env.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/src/config/db.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/src/controllers/health.controller.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/src/services/notification-dispatcher.service.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/src/services/storage.service.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/admin/.env`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/admin/.env.local`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/admin/vite.config.js`
- `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/mobile/lib/src/config/app_config.dart`

## Reusable Configs Found
- `MONGODB_URI` as the primary Mongo connection variable
- `PORT` for backend port selection
- JWT secret and TTL env structure
- provider-based notification toggles for SMS, email, and log-mode local delivery
- storage provider separation between local uploads and S3-style object storage
- env validation at startup instead of scattered `process.env` reads
- health endpoint pattern for quick runtime verification
- mobile `API_BASE_URL` pattern via `--dart-define`
- web `VITE_API_BASE_URL` pattern for frontend HTTP clients

## Variable Names Reused
- `PORT`
- `MONGODB_URI`
- `SMS_PROVIDER`
- `SMS_ENABLED`
- `EMAIL_PROVIDER`
- `EMAIL_ENABLED`
- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT`
- `EMAIL_SMTP_SECURE`
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `FILE_UPLOAD_PATH`
- `STORAGE_PROVIDER`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `API_BASE_URL`
- `VITE_API_BASE_URL`

## Renamed Variables
- `JWT_ACCESS_SECRET` -> `JWT_SECRET`
  Simpler fit for the current bank PoC auth shape.
- `JWT_ACCESS_TTL` -> `JWT_EXPIRES_IN`
  Matches the existing NestJS auth usage more directly.
- `OTP_SIGNING_SECRET` kept as-is for vote/auth OTP placeholder support.
- `MONGO_URI` alias from the source app was not carried over.
  The bank project uses `MONGODB_URI` only to avoid ambiguity.
- `MAIL_*` aliases were added alongside the reused `EMAIL_SMTP_*` names.
  This keeps local SMTP setup readable while preserving compatibility with the reused provider config pattern.

## Ignored Files And Modules
- insurance quote, claim, payment gateway, renewal, KYC, and policy modules
- insurer branding, partner portal wording, and insurer asset paths
- Telegram and WhatsApp provider details
- payment-specific merchant and webhook variables
- PII crypto helpers tied to the insurance domain
- uploaded JSON artifacts and generated uploads
- real `.env` values from the source project

## Security Notes
- Real credentials from the source app were not copied into this repo.
- Example env files in this repo use sanitized placeholders only.
- `FIREBASE_PRIVATE_KEY` remains example-only and must stay in local private env files.
- SMTP passwords, JWT secrets, OTP secrets, and any Atlas credentials must stay only in private `.env` files.

## Reminder Email Reuse
- Bunna reminder emails reuse only the SMTP-related keys from `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env`.
- The Bunna backend loads those keys at startup from `backend/src/config/external-mail-env.ts`.
- Existing Bunna env vars still win if they are already set, so the insurance file acts as a fallback source rather than the primary config surface.
- The forced local reminder recipient is controlled separately by `TEST_EMAIL_RECIPIENT`; that override is not read from the insurance app.

## Assumptions
- The bank PoC currently needs local/dev-safe provider toggles more than production delivery integrations.
- MongoDB remains the current system of record, but config and schema choices should not block a later PostgreSQL move.
- File upload/storage is still a placeholder concern in this repo, so only the config surface was standardized now.
- Notification providers stay abstract; actual SMS/email/push implementations can be filled in later behind the same config names.
