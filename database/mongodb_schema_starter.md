# MongoDB Schema Starter

## collections
- members
- staff
- branches
- districts
- accounts
- transactions
- votes
- vote_options
- vote_responses
- vote_audit_logs
- loans
- loan_documents
- loan_comments
- loan_notifications
- school_payments
- notifications
- staff_activity_logs
- staff_performance_daily
- staff_performance_weekly
- staff_performance_monthly
- staff_performance_yearly

## members
```json
{
  "_id": "ObjectId",
  "memberNumber": "MBR-10001",
  "memberType": "shareholder",
  "fullName": "Abebe Kebede",
  "phone": "09xxxxxxxx",
  "email": "abebe@example.com",
  "branchId": "ObjectId",
  "districtId": "ObjectId",
  "shareBalance": 250000,
  "status": "active",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## votes
```json
{
  "_id": "ObjectId",
  "title": "Board Election 2026",
  "description": "Annual shareholder election",
  "type": "election",
  "status": "open",
  "startDate": "ISODate",
  "endDate": "ISODate",
  "resultsPublishedAt": "ISODate",
  "createdBy": "ObjectId",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## vote_options
```json
{
  "_id": "ObjectId",
  "voteId": "ObjectId",
  "name": "Candidate A",
  "description": "Finance expert",
  "displayOrder": 1,
  "createdAt": "ISODate"
}
```

## vote_responses
```json
{
  "_id": "ObjectId",
  "voteId": "ObjectId",
  "memberId": "ObjectId",
  "optionId": "ObjectId",
  "branchId": "ObjectId",
  "districtId": "ObjectId",
  "encryptedBallot": "base64_or_ciphertext",
  "otpVerifiedAt": "ISODate",
  "createdAt": "ISODate"
}
```

## vote_audit_logs
```json
{
  "_id": "ObjectId",
  "voteId": "ObjectId",
  "memberId": "ObjectId",
  "action": "vote_submitted",
  "metadata": {
    "optionId": "ObjectId",
    "ipAddress": "string",
    "deviceId": "string"
  },
  "createdAt": "ISODate"
}
```

## loans
```json
{
  "_id": "ObjectId",
  "memberId": "ObjectId",
  "memberType": "shareholder",
  "branchId": "ObjectId",
  "districtId": "ObjectId",
  "loanType": "business",
  "amount": 12000000,
  "currency": "ETB",
  "purpose": "Working capital",
  "status": "branch_review",
  "currentLevel": "branch",
  "assignedToStaffId": "ObjectId",
  "workflowHistory": [
    {
      "level": "member",
      "action": "submitted",
      "byUserId": "ObjectId",
      "comment": "Loan submitted",
      "at": "ISODate"
    }
  ],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## notifications
```json
{
  "_id": "ObjectId",
  "userType": "member",
  "userId": "ObjectId",
  "category": "voting",
  "title": "Voting Open",
  "message": "Annual shareholder voting has started.",
  "channel": "push",
  "status": "sent",
  "createdAt": "ISODate"
}
```

## staff_activity_logs
```json
{
  "_id": "ObjectId",
  "staffId": "ObjectId",
  "branchId": "ObjectId",
  "districtId": "ObjectId",
  "memberId": "ObjectId",
  "activityType": "loan_reviewed",
  "referenceType": "loan",
  "referenceId": "ObjectId",
  "amount": 12000000,
  "createdAt": "ISODate"
}
```

## starter indexes
### members
- memberNumber unique
- phone unique
- branchId
- districtId
- memberType

### votes
- status
- type
- startDate
- endDate
- createdAt

### vote_options
- voteId
- displayOrder

### vote_responses
- voteId
- memberId
- optionId
- branchId
- districtId
- createdAt
- unique compound index: voteId + memberId

### vote_audit_logs
- voteId
- memberId
- action
- createdAt

### loans
- memberId
- status
- currentLevel
- branchId
- districtId
- assignedToStaffId
- createdAt

### notifications
- userId
- userType
- status
- createdAt

### staff_activity_logs
- staffId
- branchId
- districtId
- activityType
- createdAt
