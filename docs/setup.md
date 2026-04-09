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

## Web

```bash
cd web
npm install
VITE_API_BASE_URL=http://127.0.0.1:4000 npm run dev -- --host 127.0.0.1 --port 5173
```

Default web URL:
- `http://127.0.0.1:5173`

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
