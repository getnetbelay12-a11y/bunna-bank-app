# Backend Architecture

## Stack
- NestJS
- Mongoose
- MongoDB database: `cbe_bank_app`
- JWT authentication
- DTO validation with `class-validator`

## Architecture Shape

The backend is organized by business module under `backend/src/modules`.

Each module follows the same high-level structure:
- controller for HTTP entrypoints
- service for business logic
- DTOs for request validation
- Mongoose schemas for persistence
- tests for critical behaviors

Shared concerns live in:
- `backend/src/common/enums`
- `backend/src/common/constants`
- `backend/src/common/guards`
- `backend/src/common/decorators`
- `backend/src/config`

## Migration-Friendly Decisions
- normalized collections instead of large embedded documents
- workflow history separated from primary loan records
- audit logs separated from business entities
- vote responses and vote audit trails separated from vote definitions
- append-friendly transaction and activity records

## Main Backend Modules
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

## Config

Centralized config is under `backend/src/config`:
- `app.config.ts`
- `database.config.ts`
- `auth.config.ts`
- `notification.config.ts`
- `notifications.config.ts`
- `storage.config.ts`
- `logging.config.ts`

Environment validation is handled in:
- `backend/src/config/environment.validation.ts`

## Health

`GET /health` returns:

```json
{
  "status": "ok",
  "database": "connected",
  "databaseName": "cbe_bank_app"
}
```
