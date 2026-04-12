import { describe, expect, it } from 'vitest';

import {
  applyAuditScopeToSearch,
  createAuditScopeForAction,
  createAuditScopeForEntity,
  createAuditScopeForEntityReference,
  readAuditScopeFromSearch,
} from './auditNavigation';

describe('auditRouteState', () => {
  it('reads full audit scope from search params', () => {
    const result = readAuditScopeFromSearch(
      '?auditAction=unsupported_security_review_metrics_contract_detected&auditEntityType=staff&auditEntityId=staff_31&auditEntity=staff:staff_31',
    );

    expect(result).toEqual({
      action: 'unsupported_security_review_metrics_contract_detected',
      entityType: 'staff',
      entityId: 'staff_31',
      entity: 'staff:staff_31',
    });
  });

  it('derives the entity label from type and id when auditEntity is absent', () => {
    const result = readAuditScopeFromSearch(
      '?auditEntityType=member&auditEntityId=member_1001',
    );

    expect(result).toEqual({
      action: undefined,
      entityType: 'member',
      entityId: 'member_1001',
      entity: 'member:member_1001',
    });
  });

  it('applies audit scope params onto an empty search string', () => {
    const result = applyAuditScopeToSearch('', {
      action: 'unsupported_security_review_metrics_contract_detected',
      entityType: 'staff',
      entityId: 'staff_31',
      entity: 'staff:staff_31',
    });

    expect(result).toBe(
      '?auditAction=unsupported_security_review_metrics_contract_detected&auditEntityType=staff&auditEntityId=staff_31&auditEntity=staff%3Astaff_31',
    );
  });

  it('removes audit scope params while preserving unrelated params', () => {
    const result = applyAuditScopeToSearch('?preview=admin&auditAction=legacy', {
      action: undefined,
      entityType: undefined,
      entityId: undefined,
      entity: undefined,
    });

    expect(result).toBe('?preview=admin');
  });

  it('creates a normalized action-only audit scope', () => {
    expect(
      createAuditScopeForAction('unsupported_security_review_metrics_contract_detected'),
    ).toEqual({
      action: 'unsupported_security_review_metrics_contract_detected',
    });
  });

  it('creates a normalized entity audit scope from a combined entity key', () => {
    expect(createAuditScopeForEntity('staff:staff_31')).toEqual({
      entity: 'staff:staff_31',
      entityType: 'staff',
      entityId: 'staff_31',
    });
  });

  it('creates a normalized entity scope from explicit type and id', () => {
    expect(createAuditScopeForEntityReference('member', 'member_77')).toEqual({
      entity: 'member:member_77',
      entityType: 'member',
      entityId: 'member_77',
    });
  });
});
