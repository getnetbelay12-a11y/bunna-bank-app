import type { NotificationCategory } from '../../core/api/contracts';

export type AuditCategory =
  | 'loan'
  | 'kyc'
  | 'support'
  | 'notification'
  | 'autopay'
  | 'security';

export type AuditTarget =
  | { kind: 'loan'; id: string }
  | { kind: 'kyc'; id: string }
  | { kind: 'security'; id: string }
  | { kind: 'support'; id: string }
  | { kind: 'notification'; category: NotificationCategory }
  | { kind: 'autopay'; id: string }
  | { kind: 'none' };

export type AuditTargetHandlers = {
  onOpenLoan?: (loanId: string) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
};

export type AuditTargetActionDescriptor =
  | {
      label: string;
      onClick: () => void;
    }
  | null;

export function getAuditCategory(item: {
  entity: string;
  action: string;
}): AuditCategory {
  const entity = item.entity.toLowerCase();
  const action = item.action.toLowerCase();

  if (action.includes('step_up') || action.includes('security')) {
    return 'security';
  }

  if (entity.includes('autopay') || action.includes('autopay')) {
    return 'autopay';
  }

  if (
    entity.includes('notification') ||
    entity.includes('campaign') ||
    entity.includes('insurance') ||
    action.includes('notification') ||
    action.includes('reminder')
  ) {
    return 'notification';
  }

  if (
    entity.includes('support') ||
    entity.includes('chat') ||
    entity.includes('conversation') ||
    action.includes('support') ||
    action.includes('chat')
  ) {
    return 'support';
  }

  if (
    entity.includes('kyc') ||
    entity.includes('member_profile') ||
    entity.includes('identity') ||
    action.includes('kyc') ||
    action.includes('fayda') ||
    action.includes('member_profile')
  ) {
    return 'kyc';
  }

  return 'loan';
}

export function getAuditTarget(item: {
  entity: string;
  action: string;
}): AuditTarget {
  const category = getAuditCategory(item);
  const parsed = parseAuditEntity(item.entity);
  const action = item.action.toLowerCase();

  if (category === 'loan') {
    return { kind: 'loan', id: parsed?.id ?? item.entity };
  }

  if (category === 'kyc' && parsed?.id) {
    return { kind: 'kyc', id: parsed.id };
  }

  if (category === 'security' && parsed?.id) {
    return { kind: 'security', id: parsed.id };
  }

  if (category === 'support' && parsed?.id) {
    return { kind: 'support', id: parsed.id };
  }

  if (category === 'autopay' && parsed?.id) {
    return { kind: 'autopay', id: parsed.id };
  }

  if (category === 'notification') {
    if (action.includes('autopay') || item.entity.toLowerCase().includes('autopay')) {
      return { kind: 'notification', category: 'autopay' };
    }

    if (action.includes('kyc') || item.entity.toLowerCase().includes('kyc')) {
      return { kind: 'notification', category: 'kyc' };
    }

    if (action.includes('insurance') || item.entity.toLowerCase().includes('insurance')) {
      return { kind: 'notification', category: 'insurance' };
    }

    return { kind: 'notification', category: 'loan' };
  }

  return { kind: 'none' };
}

export function openAuditTarget(
  item: { entity: string; action: string },
  handlers: AuditTargetHandlers,
) {
  const target = getAuditTarget(item);

  if (target.kind === 'loan') {
    handlers.onOpenLoan?.(target.id);
    return;
  }

  if (target.kind === 'kyc' || target.kind === 'security') {
    handlers.onOpenKycMember?.(target.id);
    return;
  }

  if (target.kind === 'support') {
    handlers.onOpenSupportChat?.(target.id);
    return;
  }

  if (target.kind === 'notification') {
    handlers.onOpenNotificationCategory?.(target.category);
    return;
  }

  if (target.kind === 'autopay') {
    handlers.onOpenAutopayOperation?.(target.id);
  }
}

export function getAuditTargetActionDescriptor(
  item: { entity: string; action: string },
  handlers: AuditTargetHandlers,
): AuditTargetActionDescriptor {
  const target = getAuditTarget(item);

  if (target.kind === 'loan' && handlers.onOpenLoan) {
    return {
      label: 'Open loan',
      onClick: () => handlers.onOpenLoan?.(target.id),
    };
  }

  if ((target.kind === 'kyc' || target.kind === 'security') && handlers.onOpenKycMember) {
    return {
      label: 'Open KYC',
      onClick: () => handlers.onOpenKycMember?.(target.id),
    };
  }

  if (target.kind === 'support' && handlers.onOpenSupportChat) {
    return {
      label: 'Open support chat',
      onClick: () => handlers.onOpenSupportChat?.(target.id),
    };
  }

  if (target.kind === 'notification' && handlers.onOpenNotificationCategory) {
    return {
      label: 'Open notification center',
      onClick: () => handlers.onOpenNotificationCategory?.(target.category),
    };
  }

  if (target.kind === 'autopay' && handlers.onOpenAutopayOperation) {
    return {
      label: 'Open AutoPay workspace',
      onClick: () => handlers.onOpenAutopayOperation?.(target.id),
    };
  }

  return null;
}

function parseAuditEntity(entity: string): { type: string; id: string } | null {
  if (entity.includes(':')) {
    const [type, ...rest] = entity.split(':');
    return { type, id: rest.join(':') };
  }

  const separatorIndex = entity.indexOf('_');

  if (separatorIndex > 0) {
    return {
      type: entity.slice(0, separatorIndex),
      id: entity,
    };
  }

  return null;
}
