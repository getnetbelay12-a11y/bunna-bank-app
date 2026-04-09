# Product Overview

## Product goal
Build a mobile and web banking platform for Bunna Bank members, including shareholders and regular members, with strong loan workflow support, school payments, notifications, and staff performance tracking.

## Primary users
### Shareholder member
Can:
- Log in
- View profile
- View shareholder information
- View savings/account summary
- Participate in annual shareholder voting
- View vote results and vote history
- Apply for loan
- Track loan progress
- Receive notifications
- Pay school fees

### Regular member
Can:
- Log in
- View profile
- View savings/account summary
- Apply for loan
- Track loan progress
- Receive notifications
- Pay school fees

Cannot:
- access voting
- submit shareholder vote
- see restricted shareholder governance actions

### Staff users
- Loan officer
- Branch manager
- District manager
- Head office approver
- Operations/admin

### Governance users
- Admin / head office governance officer can create vote events
- Head office and managers can monitor participation and results

## Core app areas
1. Login and onboarding
2. Home dashboard
3. Accounts and savings
4. Voting and governance
5. School payment
6. Loan center
7. Notifications
8. Profile and support
9. Staff dashboard (web)
10. Performance reports (web)

## Governance rules
- Only members with `memberType = shareholder` can vote
- A shareholder can cast only one response per vote event
- Voting events have start and end dates, and only accept responses while open
- Voting can require OTP confirmation before final submission
- Vote actions should be encrypted at rest and logged for audit
