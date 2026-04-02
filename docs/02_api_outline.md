# API Outline

## Auth
- POST /auth/login
- POST /auth/verify-otp
- POST /auth/set-pin
- POST /auth/refresh-token

## Members
- GET /members/me
- GET /members/me/accounts
- GET /members/me/summary

## Voting (member)
- GET /votes/active
- GET /votes/history
- GET /votes/:id
- GET /votes/:id/results
- GET /votes/my-responses
- POST /votes/:id/verify-otp
- POST /votes/:id/respond

## Loans
- POST /loans
- GET /loans/my
- GET /loans/:id
- POST /loans/:id/upload-document
- POST /loans/:id/request-status

## Loan workflow (staff)
- GET /staff/loans/assigned
- GET /staff/loans/pending
- POST /staff/loans/:id/review
- POST /staff/loans/:id/request-more-info
- POST /staff/loans/:id/approve
- POST /staff/loans/:id/reject
- POST /staff/loans/:id/escalate-district
- POST /staff/loans/:id/escalate-head-office
- POST /staff/loans/:id/disburse

## School payments
- POST /school-payments/validate-student
- POST /school-payments/pay
- GET /school-payments/history

## Notifications
- GET /notifications
- PATCH /notifications/:id/read

## Voting administration
- POST /admin/votes
- POST /admin/votes/:id/options
- PATCH /admin/votes/:id/open
- PATCH /admin/votes/:id/close
- PATCH /admin/votes/:id/publish-results
- GET /admin/votes/:id/participation
- GET /admin/votes/:id/results
- GET /admin/votes/:id/branches

## Staff performance
- GET /reports/staff/daily
- GET /reports/staff/weekly
- GET /reports/staff/monthly
- GET /reports/staff/yearly

## Manager dashboard
- GET /dashboard/branch
- GET /dashboard/district
- GET /dashboard/head-office

## Governance dashboard
- GET /dashboard/voting/summary
- GET /dashboard/voting/:id/participation
- GET /dashboard/voting/:id/live-results
