# Loan Workflow

## Customer View

The customer should see:

- draft
- submitted
- branch_review
- district_review
- head_office_review
- need_more_documents
- approved
- rejected
- disbursed
- closed

## Placement

- My Bank
- Loan Tracker

## Customer APIs

- `GET /loans/my-loans`
- `GET /loans/:id`
- `GET /loans/:id/activity`
- `POST /loans/:id/documents`

## Console APIs

- `PATCH /staff/loans/:id/status`
- `POST /staff/loans/:id/request-documents`
- `POST /staff/loans/:id/escalate`
