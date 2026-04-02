# Bunna Bank App PoC

Documentation-first modular monorepo for a Bunna Bank digital platform covering:
- shareholder members
- regular members
- branch, district, and head office staff
- managers
- admins

## Workspaces
- `backend/` NestJS API with MongoDB via Mongoose
- `mobile/` Flutter member application
- `web/` React manager/admin dashboard
- `docs/` product, API, and screen design
- `flows/` user and operational workflows
- `database/` schema notes and starter models
- `infrastructure/` environment examples and deployment notes

## Implemented Backend Modules
- `auth`
- `members`
- `savings`
- `shareholders`
- `payments`
- `loans`
- `loan-workflow`
- `notifications`
- `voting`
- `staff`
- `staff-activity`
- `dashboard`
- `reports`
- `audit`

## Core Business Rules
- Member types are `shareholder` and `member`
- Only shareholder members can vote
- One vote is allowed per member per vote event
- Loan amount `<= 20,000,000 ETB` stays at branch level
- Loan amount `> 20,000,000 ETB` moves branch -> district -> head office
- Important actions create audit logs, workflow history, notifications, and staff activity where relevant

## Run The Backend
```bash
cd backend
npm install
npm run build
npm test -- --runInBand
npm run seed:demo
npm run start:dev
```

Required environment values are listed in [backend/.env.example](/Users/getnetbelay/Documents/bunna_bank_ap/backend/.env.example).
Database details are documented in [docs/database.md](/Users/getnetbelay/Documents/bunna_bank_ap/docs/database.md).

Demo dataset:
- run `npm run seed:demo` in `backend/`
- member logins: `0911000001` and `0911000002`
- staff logins: `admin.demo`, `district.demo`, `branch.demo`
- helper: `./infrastructure/run-local-demo.sh`
- stack runner: `./infrastructure/start-local-stack.sh --seed`

## Run The Web App
```bash
cd web
npm install
npm run dev
```

Real API mode:
- set `VITE_API_BASE_URL` from [web/.env.example](/Users/getnetbelay/Documents/bunna_bank_ap/web/.env.example)
- web will use HTTP-first clients for auth, dashboard, notifications, voting, and audit
- quick start: `./infrastructure/start-local-stack.sh`

Fallback mode:
- if `VITE_API_BASE_URL` is unset or requests fail, the app falls back to demo adapters

## Run The Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

Real API mode:
- run with `flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4000`
- mobile will use HTTP-first clients for member auth, profile, and savings
- if backend/web are already running: `./infrastructure/start-local-stack.sh --seed` then launch Flutter separately

Fallback mode:
- if `API_BASE_URL` is not provided or requests fail, the app falls back to demo adapters

## Current Verification Status
- Backend TypeScript build passes
- Backend Jest suite passes
- Web production build passes
- Mobile `flutter analyze` passes

## Smoke Paths
1. Staff web: log in with `admin.demo` or `district.demo`, then review dashboard summary, branch/district analytics, staff ranking, voting, notifications, and audit.
2. Member mobile: sign in with a phone ending in `1` for shareholder demo access, then open Home and Savings to load member profile, account balances, and recent transactions.

## Local Stack Helper
- `./infrastructure/start-local-stack.sh` starts backend and web together
- `./infrastructure/start-local-stack.sh --seed` seeds demo data first
- `./infrastructure/run-local-demo.sh` prints the equivalent manual commands

## Config Reuse Notes
- selective reuse decisions are documented in [docs/reuse-from-ethiopia-insurance-app.md](/Users/getnetbelay/Documents/bunna_bank_ap/docs/reuse-from-ethiopia-insurance-app.md)

## Recommended Next Steps
1. Run `npm run seed:demo` and use the seeded accounts for real API smoke testing across web and mobile
2. Add only targeted tests when new behavior is introduced
3. If needed, extend the seed flow with workflow history, vote responses, and reporting-heavy sample volumes
