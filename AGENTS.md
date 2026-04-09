## Project Rules

Build and maintain the Bunna Bank app PoC as a modular full-stack project with:
- NestJS backend
- MongoDB via Mongoose
- Flutter mobile app
- React web dashboard

Keep the architecture migration-friendly for a future PostgreSQL move.

## Persistent Reuse Policy

When helpful, inspect and selectively reuse config and structure from:
`/Users/getnetbelay/Documents/Ethiopia insurance app/`

Allowed reuse:
- `.env` variable names and config structure
- MongoDB setup patterns
- JWT/auth setup patterns
- notification abstraction
- upload/storage config
- validation and module patterns
- logging/audit patterns

Do not reuse blindly:
- product-specific wording
- insurance business logic
- branding
- irrelevant APIs
- real credentials or secrets

Always:
- keep secrets out of committed files
- create sanitized `.env.example` files
- document reuse decisions in `docs/reuse-from-ethiopia-insurance-app.md`

## Database Rule

The backend must use MongoDB with the database name:
`bunna_bank_app`

Defaults:
- local: `mongodb://localhost:27017/bunna_bank_app`
- Atlas: `mongodb+srv://<username>:<password>@cluster.mongodb.net/bunna_bank_app`

Do not manually create the database with shell scripts. Let MongoDB create it automatically when the first collections are written.
