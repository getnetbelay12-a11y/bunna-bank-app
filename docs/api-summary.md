# API Summary

## Auth
- `POST /auth/member/login`
- `POST /auth/staff/login`
- `POST /auth/refresh`

## Health
- `GET /health`

## Members
- `GET /members/me`
- `PATCH /members/me`
- `POST /members`
- `GET /members`
- `GET /members/:memberId`

## Savings
- `GET /savings/accounts/my`
- `GET /savings/accounts/:accountId`
- `GET /savings/accounts/:accountId/transactions`
- `GET /savings/accounts/member/:memberId`

## Payments
- `POST /payments/school`
- `GET /payments/school/my`
- `GET /payments/school/summary`

## Loans
- `POST /loans`
- `POST /loans/:loanId/documents`
- `GET /loans/my`
- `GET /loans/:loanId`

## Loan Workflow
- `PATCH /loan-workflow/:loanId/action`

## Notifications
- `POST /notifications`
- `GET /notifications`
- `GET /notifications/me`
- `PATCH /notifications/:notificationId/read`

## Voting
- `GET /votes/active`
- `GET /votes/:id`
- `POST /votes/:id/respond`
- `GET /votes/:id/results`
- `POST /admin/votes`
- `GET /admin/votes`
- `POST /admin/votes/:id/options`
- `POST /admin/votes/:id/open`
- `POST /admin/votes/:id/close`
- `GET /admin/votes/:id/participation`

## Staff Activity
- `POST /staff-activity`
- `GET /staff-activity/performance`

## Dashboard And Reports
- `GET /manager/dashboard/summary`
- `GET /manager/dashboard/branch-performance`
- `GET /manager/dashboard/district-performance`
- `GET /manager/dashboard/staff-ranking`
- `GET /manager/dashboard/voting-summary`
- `GET /reports/manager-snapshot`

## Audit
- `GET /audit`
- `GET /audit/entity/:entityType/:entityId`
- `GET /audit/actor/:actorId`
