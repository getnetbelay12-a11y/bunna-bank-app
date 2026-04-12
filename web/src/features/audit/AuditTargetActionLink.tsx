import type { NotificationCategory } from '../../core/api/contracts';
import {
  getAuditTargetActionDescriptor,
  type AuditTargetHandlers,
} from './auditTargets';

type AuditTargetActionLinkProps = {
  item: { entity: string; action: string };
  handlers: AuditTargetHandlers;
  emptyLabel?: string;
  className?: string;
};

export function AuditTargetActionLink({
  item,
  handlers,
  emptyLabel = 'No linked workspace',
  className = 'loan-watchlist-link',
}: AuditTargetActionLinkProps) {
  const action = getAuditTargetActionDescriptor(item, handlers);

  if (!action) {
    return <>{emptyLabel}</>;
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

export type { AuditTargetHandlers, NotificationCategory };
