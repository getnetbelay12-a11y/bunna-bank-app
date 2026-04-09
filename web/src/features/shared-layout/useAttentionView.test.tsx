import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAttentionView } from './useAttentionView';

describe('useAttentionView', () => {
  it('defaults to all items and switches to needs-attention items', () => {
    const { result } = renderHook(() =>
      useAttentionView(
        ['loan', 'support', 'kyc'],
        ['loan', 'kyc'],
      ),
    );

    expect(result.current.activeView).toBe('all');
    expect(result.current.visibleItems).toEqual(['loan', 'support', 'kyc']);
    expect(result.current.activeViewLabel).toBe('All (3)');
    expect(result.current.filterOptions).toEqual([
      { id: 'all', label: 'All (3)' },
      { id: 'needs_attention', label: 'Needs Attention (2)' },
    ]);

    act(() => {
      result.current.setActiveView('needs_attention');
    });

    expect(result.current.activeView).toBe('needs_attention');
    expect(result.current.visibleItems).toEqual(['loan', 'kyc']);
    expect(result.current.activeViewLabel).toBe('Needs attention (2)');
  });
});
