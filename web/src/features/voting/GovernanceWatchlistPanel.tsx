import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { VoteAdminItem } from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import { isGovernanceAttention } from '../shared-layout/attentionRules';
import { formatPanelLabel, renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type GovernanceWatchlistPanelProps = {
  role: AdminRole;
  onOpenVote?: (voteId: string) => void;
};

export function GovernanceWatchlistPanel({
  role,
  onOpenVote,
}: GovernanceWatchlistPanelProps) {
  const { votingApi } = useAppClient();
  const [votes, setVotes] = useState<VoteAdminItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void votingApi.getVotes(role).then((result) => {
      if (!cancelled) {
        setVotes(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [role, votingApi]);

  const prioritizedVotes = useMemo(
    () => [...votes].sort((left, right) => compareGovernancePriority(left, right)),
    [votes],
  );
  const openVotes = prioritizedVotes.filter((vote) => vote.status === 'open').length;
  const draftVotes = prioritizedVotes.filter((vote) => vote.status === 'draft').length;
  const lowTurnoutVotes = prioritizedVotes.filter((vote) => vote.participationRate < 50).length;
  const latestParticipation =
    prioritizedVotes.length > 0
      ? `${prioritizedVotes[0].participationRate.toFixed(0)}%`
      : '...';
  const needsAttentionVotes = prioritizedVotes.filter(isGovernanceAttention);
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems: visibleVotes } =
    useAttentionView(prioritizedVotes, needsAttentionVotes);

  return (
    <WatchlistPanelFrame
      title="Governance Watchlist"
      description="Head-office governance events that need schedule validation, turnout monitoring, or final result review."
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
        { label: 'Open votes', value: openVotes.toLocaleString() },
        { label: 'Draft validation', value: draftVotes.toLocaleString() },
        { label: 'Low turnout risk', value: lowTurnoutVotes.toLocaleString() },
        { label: 'Top priority turnout', value: latestParticipation },
      ]}
      tableHeaders={['Vote', 'Status', 'Participation', 'Responses', 'Open workspace']}
      tableRows={visibleVotes.slice(0, 4).map((vote) => [
        vote.title,
        formatPanelLabel(vote.status),
        `${vote.participationRate.toFixed(0)}%`,
        vote.totalResponses.toLocaleString(),
        renderPanelAction(
          resolveGovernanceAction(vote),
          onOpenVote ? () => onOpenVote(vote.voteId) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No governance items in this view',
        description: 'This governance filter has no active votes or validation work right now.',
      }}
    />
  );
}

function compareGovernancePriority(left: VoteAdminItem, right: VoteAdminItem) {
  return (
    statusPriority(left.status) - statusPriority(right.status) ||
    left.participationRate - right.participationRate ||
    right.totalResponses - left.totalResponses
  );
}

function statusPriority(status: string) {
  if (status === 'open') {
    return 0;
  }

  if (status === 'draft') {
    return 1;
  }

  return 2;
}

function resolveGovernanceAction(vote: VoteAdminItem) {
  if (vote.status === 'draft') {
    return 'Open review queue';
  }

  if (vote.status === 'open' && vote.participationRate < 50) {
    return 'Monitor turnout';
  }

  if (vote.status === 'open') {
    return 'Review live status';
  }

  return 'Review final pack';
}
