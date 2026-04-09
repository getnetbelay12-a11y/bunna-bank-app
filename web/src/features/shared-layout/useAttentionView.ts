import { useMemo, useState } from 'react';

export type AttentionView = 'all' | 'needs_attention';

export function useAttentionView<T>(
  items: T[],
  needsAttentionItems: T[],
) {
  const [activeView, setActiveView] = useState<AttentionView>('all');

  const visibleItems = activeView === 'needs_attention' ? needsAttentionItems : items;
  const filterOptions = useMemo(
    () => [
      { id: 'all' as const, label: `All (${items.length})` },
      {
        id: 'needs_attention' as const,
        label: `Needs Attention (${needsAttentionItems.length})`,
      },
    ],
    [items.length, needsAttentionItems.length],
  );

  const activeViewLabel =
    activeView === 'all'
      ? `All (${visibleItems.length})`
      : `Needs attention (${visibleItems.length})`;

  return {
    activeView,
    setActiveView,
    visibleItems,
    filterOptions,
    activeViewLabel,
  };
}
