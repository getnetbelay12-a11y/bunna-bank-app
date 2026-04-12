// Canonical import surface for audit drill-down routing and action handling.
// New audit-linked pages should import from this module instead of reaching into
// auditRouteState, auditTargets, or AuditTargetActionLink directly.
export { AuditTargetActionLink } from './AuditTargetActionLink';
export type {
  AuditScope,
} from './auditRouteState';
export {
  applyAuditScopeToSearch,
  createAuditScopeForAction,
  createAuditScopeForEntity,
  createAuditScopeForEntityReference,
  readAuditScopeFromSearch,
} from './auditRouteState';
export type {
  AuditCategory,
  AuditTarget,
  AuditTargetActionDescriptor,
  AuditTargetHandlers,
} from './auditTargets';
export {
  getAuditCategory,
  getAuditTarget,
  getAuditTargetActionDescriptor,
  openAuditTarget,
} from './auditTargets';
