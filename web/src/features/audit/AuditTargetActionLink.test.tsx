import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AuditTargetActionLink } from './auditNavigation';

describe('AuditTargetActionLink', () => {
  it('renders a clickable shared action for actionable audit items', async () => {
    const user = userEvent.setup();
    const handlers = {
      onOpenLoan: vi.fn(),
      onOpenKycMember: vi.fn(),
      onOpenSupportChat: vi.fn(),
      onOpenNotificationCategory: vi.fn(),
      onOpenAutopayOperation: vi.fn(),
    };

    render(
      <AuditTargetActionLink
        item={{ entity: 'support_chat:chat_19', action: 'support_chat_escalated' }}
        handlers={handlers}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open support chat' }));

    expect(handlers.onOpenSupportChat).toHaveBeenCalledWith('chat_19');
  });

  it('renders the empty label for non-actionable audit items', () => {
    render(
      <AuditTargetActionLink
        item={{ entity: 'general_notice', action: 'dashboard_viewed' }}
        handlers={{}}
      />,
    );

    expect(screen.getByText('No linked workspace')).toBeInTheDocument();
  });
});
