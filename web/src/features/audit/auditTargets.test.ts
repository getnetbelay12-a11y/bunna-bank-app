import { describe, expect, it, vi } from 'vitest';

import {
  getAuditTargetActionDescriptor,
  getAuditCategory,
  getAuditTarget,
  openAuditTarget,
} from './auditNavigation';

describe('auditTargets', () => {
  it('classifies unsupported metrics contract events as security', () => {
    expect(
      getAuditCategory({
        entity: 'staff:staff_31',
        action: 'unsupported_security_review_metrics_contract_detected',
      }),
    ).toBe('security');
  });

  it('maps member security events to the KYC workspace target', () => {
    expect(
      getAuditTarget({
        entity: 'member:member_77',
        action: 'staff_step_up_verification_failed',
      }),
    ).toEqual({
      kind: 'security',
      id: 'member_77',
    });
  });

  it('maps insurance notification events to the notification center category', () => {
    expect(
      getAuditTarget({
        entity: 'notification_campaign:insurance_digest',
        action: 'insurance_reminder_sent',
      }),
    ).toEqual({
      kind: 'notification',
      category: 'insurance',
    });
  });

  it('dispatches security targets to the KYC handler', () => {
    const handlers = {
      onOpenLoan: vi.fn(),
      onOpenKycMember: vi.fn(),
      onOpenSupportChat: vi.fn(),
      onOpenNotificationCategory: vi.fn(),
      onOpenAutopayOperation: vi.fn(),
    };

    openAuditTarget(
      {
        entity: 'member:member_77',
        action: 'staff_step_up_verification_failed',
      },
      handlers,
    );

    expect(handlers.onOpenKycMember).toHaveBeenCalledWith('member_77');
    expect(handlers.onOpenLoan).not.toHaveBeenCalled();
    expect(handlers.onOpenSupportChat).not.toHaveBeenCalled();
    expect(handlers.onOpenNotificationCategory).not.toHaveBeenCalled();
    expect(handlers.onOpenAutopayOperation).not.toHaveBeenCalled();
  });

  it('describes the UI action for support audit targets', () => {
    const handlers = {
      onOpenLoan: vi.fn(),
      onOpenKycMember: vi.fn(),
      onOpenSupportChat: vi.fn(),
      onOpenNotificationCategory: vi.fn(),
      onOpenAutopayOperation: vi.fn(),
    };

    const action = getAuditTargetActionDescriptor(
      {
        entity: 'support_chat:chat_19',
        action: 'support_chat_escalated',
      },
      handlers,
    );

    expect(action?.label).toBe('Open support chat');
    action?.onClick();
    expect(handlers.onOpenSupportChat).toHaveBeenCalledWith('chat_19');
  });
});
