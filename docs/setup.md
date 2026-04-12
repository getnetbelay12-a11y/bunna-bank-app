# Setup

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm run seed:demo
npm run start:dev
```

Default backend URL:
- `http://127.0.0.1:4000`

Default MongoDB:
- `mongodb://localhost:27017/bunna_bank_app`

Default storage:
- `STORAGE_PROVIDER=local`
- `FILE_UPLOAD_PATH=uploads/`

Default onboarding review policy:
- `ONBOARDING_REVIEW_POLICY_VERSION=v1`
- `ONBOARDING_BLOCKING_MISMATCH_FIELDS=fullName,firstName,lastName,dateOfBirth,phoneNumber,faydaFin`
- `ONBOARDING_BLOCKING_MISMATCH_APPROVAL_ROLES=head_office_manager,admin`
- `ONBOARDING_BLOCKING_MISMATCH_APPROVAL_REASON_CODES=official_source_verified,manual_document_review,customer_profile_corrected`
- `ONBOARDING_REQUIRE_APPROVAL_JUSTIFICATION=true`

Default security-review reporting materialization:
- `REPORTING_SNAPSHOT_LOOKBACK_DAYS=14`
- `REPORTING_SNAPSHOT_LOCK_MINUTES=10`
- Daily snapshot job runs at `00:15 UTC` with a Mongo-backed shared lock so only one backend instance materializes snapshots at a time

## Web

Supported Node runtime:
- `22` LTS is the standard local/runtime target for the web workspace
- `web/package.json` declares `^22.12.0 || ^24.0.0`
- `web/.nvmrc` pins the expected major version
- avoid Node `23`; the current `vite`/`vitest` stack does not declare support for it

```bash
cd web
nvm use
npm install
VITE_API_BASE_URL=http://127.0.0.1:4000 npm run dev -- --host 127.0.0.1 --port 5173
```

Default web URL:
- `http://127.0.0.1:5173`

Audit drill-down and scoped audit routing:
- use `web/src/features/audit/auditNavigation.ts` as the canonical import surface
- see `docs/audit-navigation.md` before adding new audit-linked navigation or action rendering

## Mobile

```bash
cd mobile
flutter pub get
flutter run -d macos --dart-define=API_BASE_URL=http://127.0.0.1:4000
```

For iOS Simulator instead of macOS desktop:

```bash
flutter run -d "iPhone 17 Pro" --dart-define=API_BASE_URL=http://127.0.0.1:4000
```

## Local Helper

To start backend and web together:

```bash
./infrastructure/start-local-stack.sh --seed
```

To print the equivalent manual commands:

```bash
./infrastructure/run-local-demo.sh
```

## Atlas

Update `backend/.env` with:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bunna_bank_app
```

Do not commit Atlas credentials.

## Smoke Check

After the backend is seeded and running, verify the local stack:

```bash
curl http://127.0.0.1:4000/health
curl -X POST http://127.0.0.1:4000/auth/staff/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin.head-office@bunnabank.com","password":"demo-pass"}'
```

Expected seeded staff account:
- `admin.head-office@bunnabank.com`
- `demo-pass`
