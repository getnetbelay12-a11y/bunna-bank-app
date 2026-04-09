import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { SupportChatSummaryItem } from '../../core/api/contracts';
import { isSupportAttention } from '../shared-layout/attentionRules';
import { formatPanelLabel, renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type SupportWatchlistPanelProps = {
  title: string;
  description: string;
  onOpenChat?: (conversationId: string) => void;
};

export function SupportWatchlistPanel({
  title,
  description,
  onOpenChat,
}: SupportWatchlistPanelProps) {
  const { supportApi } = useAppClient();
  const [items, setItems] = useState<SupportChatSummaryItem[]>([]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      supportApi.getOpenChats(),
      supportApi.getAssignedChats(),
      supportApi.getResolvedChats(),
    ])
      .then(([open, assigned, resolved]) => {
        if (!active) {
          return;
        }

        const nextItems = [...open, ...assigned, ...resolved]
          .sort(compareSupportRisk)
          .slice(0, 4);
        setItems(nextItems);
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [supportApi]);

  const unreadCount = useMemo(
    () => items.filter((item) => ['open', 'assigned', 'waiting_agent'].includes(item.status)).length,
    [items],
  );
  const escalatedCount = useMemo(
    () => items.filter((item) => item.escalationFlag).length,
    [items],
  );
  const highPriorityCount = useMemo(
    () => items.filter((item) => item.priority === 'high').length,
    [items],
  );
  const oldestWaitingAge = useMemo(() => resolveOldestSupportAge(items), [items]);
  const needsAttentionItems = useMemo(
    () => items.filter(isSupportAttention),
    [items],
  );
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems } =
    useAttentionView(items, needsAttentionItems);

  return (
    <WatchlistPanelFrame
      title={title}
      description={description}
      filterRow={
        <div className="loan-filter-row">
          {filterOptions.map((view) => (
            <button
              key={view.id}
              type="button"
              className={activeView === view.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>
      }
      summaryChips={[
        { label: 'Current focus', value: activeViewLabel },
        {
          label: 'Unread / Escalated',
          value: `${unreadCount.toLocaleString()} / ${escalatedCount.toLocaleString()}`,
        },
        { label: 'High Priority', value: highPriorityCount.toLocaleString() },
        { label: 'Tracked chats', value: items.length.toLocaleString() },
        { label: 'Oldest waiting', value: oldestWaitingAge },
      ]}
      tableHeaders={['Customer', 'Status', 'Priority', 'Recommended next step', 'Open workspace']}
      tableRows={visibleItems.map((item) => [
        item.memberName ?? item.customerId,
        formatPanelLabel(item.status),
        formatPanelLabel(item.priority ?? 'normal'),
        buildSupportCue(item),
        renderPanelAction(
          'Open chat',
          onOpenChat ? () => onOpenChat(item.conversationId) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No support conversations in this view',
        description: 'This support filter has no visible customer conversations right now.',
      }}
    />
  );
}

function buildSupportCue(item: SupportChatSummaryItem) {
  if (item.escalationFlag) {
    return 'Escalated';
  }

  if (item.priority === 'high') {
    return 'High priority';
  }

  if (['open', 'assigned', 'waiting_agent'].includes(item.status)) {
    return 'Unread / waiting';
  }

  return 'Monitor';
}

function compareSupportRisk(left: SupportChatSummaryItem, right: SupportChatSummaryItem) {
  const priorityRank = {
    high: 0,
    normal: 1,
    low: 2,
    undefined: 3,
  } as const;

  const leftPriority = priorityRank[left.priority as keyof typeof priorityRank] ?? priorityRank.undefined;
  const rightPriority =
    priorityRank[right.priority as keyof typeof priorityRank] ?? priorityRank.undefined;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  if (left.escalationFlag !== right.escalationFlag) {
    return left.escalationFlag ? -1 : 1;
  }

  return hoursSince(right.updatedAt) - hoursSince(left.updatedAt);
}

function resolveOldestSupportAge(items: SupportChatSummaryItem[]) {
  if (items.length === 0) {
    return 'Not available';
  }

  const oldestHours = Math.max(...items.map((item) => hoursSince(item.updatedAt)));

  if (oldestHours < 24) {
    return `${oldestHours}h`;
  }

  return `${Math.round(oldestHours / 24)}d`;
}

function hoursSince(value?: string) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
}
