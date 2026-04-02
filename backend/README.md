# Backend

NestJS API workspace for the Bunna Bank PoC.

## Implemented Modules
- `auth`
- `members`
- `payments`
- `loans`
- `loan-workflow`
- `notifications`
- `voting`
- `staff-activity`
- `dashboard`
- `reports`
- `audit`

## Commands
```bash
npm install
npm run build
npm test -- --runInBand
npm run seed:demo
npm run start:dev
```

## Demo Seed
`npm run seed:demo` populates a usable PoC dataset for:
- member logins: `0911000001` and `0911000002`
- staff logins: `admin.demo`, `district.demo`, and `branch.demo`
- savings accounts, transactions, school payments, loans, notifications, and an active shareholder vote

## Environment
Use [infrastructure/backend.env.example](/Users/getnetbelay/Documents/bunna_bank_ap/infrastructure/backend.env.example) as the sanitized starting point for local and production configuration.

## Storage

- `STORAGE_PROVIDER=local` is the only production-ready storage mode in this repo today.
- `STORAGE_PROVIDER=s3` is intentionally blocked in production until an actual S3 upload client is implemented.

## Notifications

- `SMS_PROVIDER=log`, `EMAIL_PROVIDER=log`, and `PUSH_PROVIDER=log` are the safe defaults.
- `generic_http` providers require their corresponding endpoint env vars.
- `EMAIL_PROVIDER=smtp` is supported when `EMAIL_SENDER`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, and `EMAIL_SMTP_PASS` are configured.
- Bunna can reuse only the mail keys from `/Users/getnetbelay/Documents/Ethiopia insurance app/apps/backend/.env` by leaving `BUNNA_LOAD_INSURANCE_MAIL_ENV=true`.
- `TEST_EMAIL_RECIPIENT=write2get@gmail.com` is the local reminder-campaign override used when the Email channel is selected.
- Campaign SMS delivery only reports success when `SMS_PROVIDER=generic_http` is configured.
- Telegram campaign delivery is not implemented and fails closed.

## Notes
- Uses MongoDB via Mongoose for the PoC
- Keeps workflow history, audit logs, vote responses, and notifications in separate append-friendly collections
- Designed to stay migration-friendly for a future PostgreSQL move
