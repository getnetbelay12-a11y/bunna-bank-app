export type AuditScope = {
  entity?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
};

export function createAuditScopeForAction(action?: string): AuditScope {
  return { action };
}

export function createAuditScopeForEntity(entity: string): AuditScope {
  const separatorIndex = entity.indexOf(':');
  if (separatorIndex === -1) {
    return { entity };
  }

  const entityType = entity.slice(0, separatorIndex);
  const entityId = entity.slice(separatorIndex + 1);

  return {
    entity,
    entityType: entityType || undefined,
    entityId: entityId || undefined,
  };
}

export function createAuditScopeForEntityReference(
  entityType: string,
  entityId: string,
): AuditScope {
  return {
    entity: `${entityType}:${entityId}`,
    entityType,
    entityId,
  };
}

export function readAuditScopeFromSearch(search: string): AuditScope {
  const params = new URLSearchParams(search);
  const entityType = params.get('auditEntityType') ?? undefined;
  const entityId = params.get('auditEntityId') ?? undefined;
  const entity =
    params.get('auditEntity') ?? (entityType && entityId ? `${entityType}:${entityId}` : undefined);

  return {
    entity,
    entityType,
    entityId,
    action: params.get('auditAction') ?? undefined,
  };
}

export function applyAuditScopeToSearch(
  search: string,
  auditScope?: AuditScope,
): string {
  const params = new URLSearchParams(search);

  if (auditScope?.action) {
    params.set('auditAction', auditScope.action);
  } else {
    params.delete('auditAction');
  }

  if (auditScope?.entityType) {
    params.set('auditEntityType', auditScope.entityType);
  } else {
    params.delete('auditEntityType');
  }

  if (auditScope?.entityId) {
    params.set('auditEntityId', auditScope.entityId);
  } else {
    params.delete('auditEntityId');
  }

  if (auditScope?.entity) {
    params.set('auditEntity', auditScope.entity);
  } else {
    params.delete('auditEntity');
  }

  const next = params.toString();
  return next ? `?${next}` : '';
}
