# Loan Workflow

## Business rule
- Less than 20,000,000 ETB -> branch-driven approval
- More than 20,000,000 ETB -> branch -> district -> head office approval

## Status list
- draft
- submitted
- branch_review
- district_review
- head_office_review
- approved
- rejected
- disbursed
- closed
- needs_more_info

## Detailed flow
### Step 1: Member submits application
Member submits from mobile app
-> system validates data
-> system creates loan record
-> status = submitted
-> currentLevel = branch
-> notification to member
-> task created for loan officer

### Step 2: Branch review
Loan officer reviews documents and basic eligibility
Possible outcomes:
1. needs_more_info
2. rejected
3. approved at branch (if amount < 20M and rules pass)
4. escalated to district (if amount >= 20M or special case)

### Step 3: District review
District manager/officer reviews
Possible outcomes:
1. needs_more_info
2. rejected
3. approved
4. forwarded to head office

### Step 4: Head office review
Head office reviews high-value loans
Possible outcomes:
1. approved
2. rejected
3. needs_more_info

### Step 5: Disbursement
If approved
-> create disbursement task
-> release funds
-> status = disbursed
-> send notification to member

## Notifications during workflow
### To member
- Loan submitted successfully
- Loan under branch review
- Loan moved to district review
- Loan moved to head office review
- Additional documents requested
- Loan approved
- Loan rejected
- Loan disbursed
- Repayment due reminder

### To staff
- New application assigned
- Application aging reminder
- Approval pending
- Missing document alert
- Disbursement pending

## SLA tracking ideas
- branch first response within X hours
- district response within Y hours
- head office response within Z hours
- overdue workflow alerts to managers
