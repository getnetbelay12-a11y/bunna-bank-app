import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { VoteAdminItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type VotingManagementPageProps = {
  session: AdminSession;
};

export function VotingManagementPage({ session }: VotingManagementPageProps) {
  const { votingApi } = useAppClient();
  const [votes, setVotes] = useState<VoteAdminItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void votingApi.getVotes(session.role).then((result) => {
      if (!cancelled) {
        setVotes(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session.role, votingApi]);

  return (
    <div className="page-stack">
      <Panel
        title="Voting Management"
        description="Create vote events, track turnout, and review live result summaries."
      >
        <SimpleTable
          headers={['Vote', 'Status', 'Responses', 'Participation']}
          rows={
            votes.length > 0
              ? votes.map((vote) => [
                  vote.title,
                  capitalize(vote.status),
                  vote.totalResponses.toLocaleString(),
                  `${vote.participationRate.toFixed(0)}%`,
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
