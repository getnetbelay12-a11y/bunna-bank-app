# Database

## Database Name

The backend uses MongoDB with the database name:

`bunna_bank_app`

Local default:

`mongodb://localhost:27017/bunna_bank_app`

Atlas example:

`mongodb+srv://<username>:<password>@cluster.mongodb.net/bunna_bank_app`

## Local Run

1. Copy `backend/.env.development.example` to `backend/.env`.
2. Ensure `MONGODB_URI` points to `bunna_bank_app`.
3. Start MongoDB locally.
4. Run the backend:

```bash
cd backend
npm install
npm run start:dev
```

Optional demo seed:

```bash
cd backend
npm run seed:demo
```

## MongoDB Atlas

Set `MONGODB_URI` to an Atlas URI that ends with `/bunna_bank_app`.

Example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bunna_bank_app
```

Keep Atlas usernames, passwords, and connection options only in private `.env` files.

## Collection Creation

MongoDB creates the `bunna_bank_app` database and its collections automatically when the application first inserts documents.

You do not need to manually create the database in the Mongo shell.

## Expected Collections

- `members`
- `staff`
- `branches`
- `districts`
- `savings_accounts`
- `transactions`
- `loans`
- `loan_workflow_history`
- `loan_documents`
- `notifications`
- `staff_activity_logs`
- `staff_performance_daily`
- `staff_performance_weekly`
- `staff_performance_monthly`
- `staff_performance_yearly`
- `votes`
- `vote_options`
- `vote_responses`
- `vote_audit_logs`
- `audit_logs`

## Connection Logging

At startup, the backend logs:

- `Connected to MongoDB database: bunna_bank_app`
- `Mongo host: <hostname>`
