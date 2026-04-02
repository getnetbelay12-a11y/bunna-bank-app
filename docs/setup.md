# Setup

## Backend

```bash
cd backend
npm install
cp .env.development.example .env
npm run build
npm run seed
npm run start:dev
```

Default backend URL:
- `http://localhost:4000`

Default MongoDB:
- `mongodb://localhost:27017/cbe_bank_app`

Default storage:
- `STORAGE_PROVIDER=local`
- `FILE_UPLOAD_PATH=uploads/`

## Web

```bash
cd web
npm install
VITE_API_BASE_URL=http://localhost:4000 npm run dev
```

## Mobile

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4000
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
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cbe_bank_app
```

Do not commit Atlas credentials.
