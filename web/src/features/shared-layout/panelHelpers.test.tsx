import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { formatPanelLabel, renderPanelAction } from './panelHelpers';

describe('panelHelpers', () => {
  it('formats underscore labels into title case', () => {
    expect(formatPanelLabel('review_in_progress')).toBe('Review In Progress');
  });

  it('renders an action button when a callback is provided', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<>{renderPanelAction('Open loans', onClick)}</>);

    await user.click(screen.getByRole('button', { name: 'Open loans' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('returns plain text when no callback is provided', () => {
    render(<>{renderPanelAction('Open audit')}</>);

    expect(screen.getByText('Open audit')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open audit' })).toBeNull();
  });
});
