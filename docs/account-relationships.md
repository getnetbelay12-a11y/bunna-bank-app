# Account Relationships

## Goal

Allow a customer to request a related member relationship where business rules permit it.

## Relationship Types

- joint_holder
- nominee
- authorized_user
- family_member

## Required Verification

- related member details
- Fayda identity details
- selfie verification when policy requires it

## Planned Backend

- `account_relationships`
- `related_member_requests`

## Planned APIs

- `GET /accounts/:id/relationships`
- `POST /accounts/:id/relationships`
- `PATCH /accounts/:id/relationships/:relationshipId`
