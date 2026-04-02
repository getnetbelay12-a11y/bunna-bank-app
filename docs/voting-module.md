# Voting Module

## Scope

Annual shareholder governance for:
- board elections
- shareholder decisions
- policy votes
- dividend or meeting approvals

## Core Rules
- only shareholder members can vote
- regular members cannot vote
- one vote per member per vote event
- vote responses are accepted only between `startDate` and `endDate`
- closed votes reject new responses

## Collections
- `votes`
- `vote_options`
- `vote_responses`
- `vote_audit_logs`

## Integrity Rules
- unique compound index on `voteId + memberId`
- invalid options are rejected
- OTP verification hook exists before final submission

## Member APIs
- `GET /votes/active`
- `GET /votes/:id`
- `POST /votes/:id/respond`
- `GET /votes/:id/results`

## Admin And Head Office APIs
- `POST /admin/votes`
- `POST /admin/votes/:id/options`
- `POST /admin/votes/:id/open`
- `POST /admin/votes/:id/close`
- `GET /admin/votes/:id/participation`
