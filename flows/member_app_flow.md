# Member App Flow

## 1. App entry flow
Open app
-> Splash screen
-> Language selection
-> Login / Register
-> OTP verification
-> PIN / biometric setup
-> Home dashboard

## 2. Member type flow
After login:
-> system checks member type
-> if shareholder: show shareholder card/info block and voting tab
-> if member: show normal member dashboard without voting tab

## 3. Home dashboard flow
Home dashboard shows:
- member name
- member type
- branch
- savings/account summary
- active loans summary
- quick actions
  - voting
  - apply loan
  - pay school
  - notifications
  - transaction history

## 4. Voting flow
Home
-> Voting
-> Active Votes
-> Select vote event
-> View title, description, candidates/options, closing date
-> Select candidate/option
-> Submit Vote
-> OTP verification
-> system checks vote window is open
-> system checks memberType = shareholder
-> system checks member has not already voted
-> vote stored
-> audit log stored
-> success confirmation
-> My Votes updated

If member already voted:
-> reject submission
-> show already voted message

## 5. School payment flow
Home
-> Pay School
-> Search/select school
-> Enter student ID
-> Fetch student profile and due amount
-> Select payment source account
-> Confirm payment
-> OTP/PIN confirmation
-> Payment success screen
-> Receipt download/share
-> Notification sent to member
-> Activity logged for reporting

## 6. Loan application flow
Home
-> Loan Center
-> Apply Loan
-> Choose loan type
-> Enter amount
-> Enter purpose
-> Upload required documents
-> Select branch
-> Submit
-> Application received screen
-> Notification: loan submitted
-> Loan officer notified

## 7. Loan tracking flow
Loan Center
-> My Loans
-> Select loan
-> View:
  - amount
  - stage
  - branch officer
  - submitted date
  - current status
  - comments/history

## 8. Notification flow
Member receives:
- voting open
- voting reminder before closing
- voting results published
- application received
- moved to branch review
- moved to district review
- moved to head office review
- approved
- rejected
- more documents requested
- repayment reminder
- school payment success

## 9. Profile flow
Profile
-> personal info
-> member type
-> linked accounts
-> security settings
-> notification preferences
-> support/help
