# Audit Navigation

Use the shared audit navigation contract in:

- `web/src/features/audit/auditNavigation.ts`

Do not import these directly in new feature code unless you are changing the shared contract itself:

- `web/src/features/audit/auditRouteState.ts`
- `web/src/features/audit/auditTargets.ts`
- `web/src/features/audit/AuditTargetActionLink.tsx`

## What the shared module owns

- audit URL scope parsing and serialization
- normalized audit scope builders
- audit event category and target resolution
- audit target action descriptors and dispatch
- reusable audit target action link rendering

## When to use it

Use `auditNavigation.ts` when a page needs to:

- open the audit workspace with a scoped entity or action
- restore audit scope from the URL
- decide which workspace an audit event should open
- render a standard action for an audit-linked item

## Why this matters

If pages reimplement audit drill-down logic locally, routing and action semantics drift. The shared module exists to keep:

- URL shape consistent
- workspace targeting consistent
- action labels consistent
- tests focused on one contract instead of many copies
