# Release Notes: `8a55d621`

## Scope

This release delivers the Bunna onboarding audit and secure review workflow hardening, plus repository hygiene fixes for generated artifacts.

Included commits:

- `1c80c6c6` `Stop tracking generated artifacts`
- `bd70f2d8` `Stop tracking TypeScript build info`
- `8a55d621` `Implement onboarding audit and secure review workflow`

## Major changes

### Onboarding and KYC review

- Fayda-first onboarding now supports extracted-data capture and review-aware registration flow
- onboarding evidence is persisted and linked to member review records
- KYC review now supports:
  - evidence inspection
  - extracted-vs-submitted mismatch comparison
  - blocking mismatch policy
  - approval reason codes
  - reviewer justification
  - mismatch acknowledgment
  - supersession reasoning and diff acknowledgment
  - step-up confirmation for high-risk approvals

### Audit and governance

- onboarding review decisions are versioned and cryptographically anchored
- audit digest verification is available
- onboarding-review audit querying and CSV export are available
- printable onboarding audit summaries now include evidence references and hashes
- unsupported reporting-contract detection is audited and visible in head-office views
- audit drill-down routing is now centralized through:
  - `web/src/features/audit/auditNavigation.ts`

### Security-review operations

- repeated step-up failures can create `security_review` cases
- security-review cases now support:
  - assignment
  - SLA state
  - breach acknowledgment
  - stalled-investigation escalation
  - higher-authority takeover
  - retained daily metrics materialization
- head-office dashboard exposes:
  - security breach counts
  - stalled/takeover trend
  - reporting-contract alerts

### Frontend engineering hygiene

- shared audit route state, target resolution, and action rendering are covered by focused tests
- audit internals are protected by an import-guard test so new code must use the shared audit navigation entry point
- web toolchain upgraded to Vite 8 / Vitest 4 line
- web runtime standardized on Node 22 LTS via `.nvmrc` and `package.json` engines

### Repository hygiene

- generated trees are no longer tracked:
  - `backend/node_modules`
  - `backend/dist`
  - `web/node_modules`
  - `web/dist`
  - `web/tsconfig.tsbuildinfo`

## Smoke checklist

### Backend

1. `cd backend`
2. `npm install`
3. `cp .env.example .env`
4. `npm run build`
5. `npm run seed:demo`
6. `npm run start:dev`
7. Verify:
   - `curl http://127.0.0.1:4000/health`
   - staff login with `admin.head-office@bunnabank.com / demo-pass`

### Web

1. `cd web`
2. `nvm use`
3. `npm install`
4. `VITE_API_BASE_URL=http://127.0.0.1:4000 npm run dev -- --host 127.0.0.1 --port 5173`
5. Verify:
   - head-office dashboard loads
   - `Reporting Contract Alerts` drill-down reaches filtered audit view
   - KYC review queue opens evidence and mismatch details
   - service-request security-review queue loads

### Mobile

1. `cd mobile`
2. `flutter pub get`
3. `flutter run -d macos --dart-define=API_BASE_URL=http://127.0.0.1:4000`
4. Verify:
   - account creation starts with Fayda upload
   - extracted Fayda fields prefill the onboarding flow
   - conflict fields require review

## Known local-only files not pushed

- `backend/.env`
- `backend/.env.local`

## Remaining operational caveat

The web toolchain now has zero `npm audit` vulnerabilities, but local development should use Node `22` LTS or `24`. Node `23` is not a supported target for the current `vite` / `vitest` stack.
