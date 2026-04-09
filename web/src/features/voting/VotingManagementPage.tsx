import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { CreateVotePayload, VoteAdminItem, VoteResultItem, VotingSummaryItem } from '../../core/api/contracts';
import { AdminRole, type AdminSession } from '../../core/session';
import { ConsoleKpiStrip } from '../../shared/components/ConsoleKpiStrip';
import { CriticalActionStrip } from '../../shared/components/CriticalActionStrip';
import {
  DashboardGrid,
  DashboardMiniBars,
  DashboardMetricRow,
  DashboardPage,
  DashboardSectionCard,
  DashboardTableCard,
  QuickActionChip,
} from '../../shared/components/BankingDashboard';

type VotingManagementPageProps = {
  session: AdminSession;
  initialVoteId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
};

const defaultForm = {
  title: '',
  description: '',
  type: 'shareholder_vote',
  startDate: '',
  endDate: '',
  optionA: '',
  optionB: '',
};

export function VotingManagementPage({
  session,
  initialVoteId,
  returnContextLabel,
  onReturnToContext,
}: VotingManagementPageProps) {
  const { votingApi } = useAppClient();
  const [votes, setVotes] = useState<VoteAdminItem[]>([]);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(initialVoteId ?? null);
  const [participation, setParticipation] = useState<VotingSummaryItem | null>(null);
  const [results, setResults] = useState<VoteResultItem[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = headOfficeRoles.has(session.role);

  useEffect(() => {
    let cancelled = false;

    void votingApi.getVotes(session.role).then((result) => {
      if (!cancelled) {
        setVotes(result);
        setSelectedVoteId((current) => current ?? result[0]?.voteId ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session.role, votingApi]);

  useEffect(() => {
    if (!selectedVoteId) {
      setParticipation(null);
      setResults([]);
      return;
    }

    let cancelled = false;
    void Promise.all([
      votingApi.getParticipation(selectedVoteId),
      votingApi.getResults ? votingApi.getResults(selectedVoteId) : Promise.resolve([]),
    ]).then(([participationResult, resultsResult]) => {
      if (!cancelled) {
        setParticipation(participationResult);
        setResults(resultsResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVoteId, votingApi]);

  const selectedVote = useMemo(
    () => votes.find((vote) => vote.voteId === selectedVoteId) ?? votes[0] ?? null,
    [selectedVoteId, votes],
  );

  const activeVotingCount = votes.filter((vote) => vote.status === 'open').length;
  const totalShareholders = Math.max(...votes.map((vote) => vote.eligibleShareholders), 0);
  const votesCast = votes.reduce((sum, vote) => sum + vote.totalResponses, 0);
  const participationRate =
    totalShareholders === 0 || votes.length === 0
      ? 0
      : Number((votes.reduce((sum, vote) => sum + vote.participationRate, 0) / votes.length).toFixed(2));
  const maxBranchResponses = Math.max(...(participation?.branchParticipation ?? []).map((item) => item.totalResponses), 1);
  const maxDistrictResponses = Math.max(...(participation?.districtParticipation ?? []).map((item) => item.totalResponses), 1);

  async function refreshVotes(nextSelectedVoteId?: string) {
    const nextVotes = await votingApi.getVotes(session.role);
    setVotes(nextVotes);
    if (nextSelectedVoteId) {
      setSelectedVoteId(nextSelectedVoteId);
      return;
    }

    setSelectedVoteId((current) => current ?? nextVotes[0]?.voteId ?? null);
  }

  async function handleCreateVote() {
    if (!canManage) {
      return;
    }

    const payload: CreateVotePayload = {
      title: form.title,
      description: form.description,
      type: form.type,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      options: [
        { name: form.optionA, displayOrder: 1 },
        { name: form.optionB, displayOrder: 2 },
      ],
    };

    const created = await votingApi.createVote(payload);
    setForm(defaultForm);
    setMessage(`Vote ${created.title} created in draft.`);
    await refreshVotes(created.voteId);
  }

  async function handleStatusChange(action: 'open' | 'close') {
    if (!selectedVote || !canManage) {
      return;
    }

    const updated =
      action === 'open'
        ? await votingApi.openVote?.(selectedVote.voteId)
        : await votingApi.closeVote?.(selectedVote.voteId);
    if (!updated) {
      return;
    }
    setMessage(`${updated.title} is now ${updated.status}.`);
    await refreshVotes(updated.voteId);
  }

  return (
    <DashboardPage>
      <div className="console-focus-page governance-page">
        {returnContextLabel && onReturnToContext ? (
          <div className="loan-return-banner">
            <div>
              <p className="eyebrow">Dashboard Context</p>
              <strong>Opened from {returnContextLabel}</strong>
            </div>
            <button type="button" className="loan-return-button" onClick={onReturnToContext}>
              Back to {returnContextLabel}
            </button>
          </div>
        ) : null}

        <section className="console-command-grid">
          <article className="console-command-card console-command-card-primary">
            <div className="console-command-copy">
              <span className="eyebrow">Governance command</span>
              <h3>Keep shareholder voting compact, visible, and easy to operate without letting governance overwhelm the console.</h3>
              <p>Start with turnout, active votes, and quick status control, then drop into detailed result tables only when they matter.</p>
            </div>
            <div className="console-command-stats">
              <div>
                <span>Shareholders</span>
                <strong>{totalShareholders.toLocaleString()}</strong>
              </div>
              <div>
                <span>Active votes</span>
                <strong>{activeVotingCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Votes cast</span>
                <strong>{votesCast.toLocaleString()}</strong>
              </div>
              <div>
                <span>Participation</span>
                <strong>{participationRate.toFixed(0)}%</strong>
              </div>
            </div>
          </article>

          <article className="console-command-card console-command-card-warning">
            <span className="eyebrow">Priority signals</span>
            <h3>Governance posture</h3>
            <ul className="console-priority-list">
              <li>
                <span>Active voting</span>
                <strong>{activeVotingCount.toLocaleString()} votes are currently open and need participation monitoring.</strong>
              </li>
              <li>
                <span>Drafts</span>
                <strong>{votes.filter((vote) => vote.status === 'draft').length.toLocaleString()} governance items are staged but not yet opened.</strong>
              </li>
              <li>
                <span>Turnout</span>
                <strong>{participationRate >= 50 ? 'Participation is healthy.' : 'Participation is below the ideal threshold and needs reminders.'}</strong>
              </li>
            </ul>
          </article>

          <article className="console-command-card console-command-card-secondary">
            <span className="eyebrow">Execution snapshot</span>
            <h3>What managers should do</h3>
            <ol className="console-action-ladder">
              <li>
                <div>
                  <strong>{selectedVote ? capitalize(selectedVote.status) : 'No vote selected'}</strong>
                  <p>Use the active vote status control to move drafts into open circulation or close completed ballots.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{results.length.toLocaleString()} result lines</strong>
                  <p>Review result percentages only after turnout posture is acceptable.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{participation?.uniqueDistricts?.toLocaleString() ?? '0'} districts engaged</strong>
                  <p>Use turnout by district and branch to direct announcement follow-up.</p>
                </div>
              </li>
            </ol>
          </article>
        </section>

        <ConsoleKpiStrip
        items={[
          { icon: 'CU', label: 'Customers', value: totalShareholders.toLocaleString(), trend: 'Eligible shareholders', trendDirection: 'neutral' },
          { icon: 'LN', label: 'Loans', value: votesCast.toLocaleString(), trend: 'Votes cast', trendDirection: 'up' },
          { icon: 'SV', label: 'Savings', value: activeVotingCount.toLocaleString(), trend: 'Active votes', trendDirection: 'neutral' },
          { icon: 'AP', label: 'Approvals', value: votes.filter((vote) => vote.status === 'draft').length.toLocaleString(), trend: 'Draft votes', trendDirection: 'neutral' },
          { icon: 'AL', label: 'Alerts', value: `${participationRate.toFixed(0)}%`, trend: 'Participation', trendDirection: participationRate >= 50 ? 'up' : 'down' },
        ]}
      />
      <CriticalActionStrip
        items={[
          { label: 'Overdue Loans', value: '0', tone: 'red' },
          { label: 'Missing Documents', value: '0', tone: 'orange' },
          { label: 'Support Backlog', value: activeVotingCount.toLocaleString(), tone: 'red' },
          { label: 'Expiring Insurance', value: votes.filter((vote) => vote.status === 'draft').length.toLocaleString(), tone: 'amber' },
        ]}
      />

      <DashboardSectionCard
        title="Voting & Governance"
        description="Head office governance console for shareholder voting, turnout tracking, and result review."
        action={<QuickActionChip label={selectedVote ? capitalize(selectedVote.status) : 'No active vote'} />}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricRow label="Active Voting" value={activeVotingCount.toLocaleString()} />
          <DashboardMetricRow label="Total shareholders" value={totalShareholders.toLocaleString()} />
          <DashboardMetricRow label="Votes Cast" value={votesCast.toLocaleString()} />
          <DashboardMetricRow label="Participation" value={`${participationRate.toFixed(0)}%`} />
        </div>
      </DashboardSectionCard>

      <DashboardGrid>
      <DashboardSectionCard title="Create Voting Event" description="Create a vote with schedule and options in one head-office workflow.">
        <div className="support-detail-grid">
          <label>
            <span>Title</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Type</span>
            <input value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} />
          </label>
          <label>
            <span>Start date</span>
            <input type="datetime-local" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
          </label>
          <label>
            <span>End date</span>
            <input type="datetime-local" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} />
          </label>
          <label>
            <span>Option 1</span>
            <input value={form.optionA} onChange={(event) => setForm((current) => ({ ...current, optionA: event.target.value }))} />
          </label>
          <label>
            <span>Option 2</span>
            <input value={form.optionB} onChange={(event) => setForm((current) => ({ ...current, optionB: event.target.value }))} />
          </label>
        </div>
        <div className="page-actions">
          <button type="button" className="primary-button" disabled={!canManage} onClick={() => void handleCreateVote()}>
            Create voting
          </button>
          {message ? <span className="muted">{message}</span> : null}
        </div>
      </DashboardSectionCard>

        <DashboardSectionCard title="Voting Control" description="Open, close, and review governance events with head-office access controls.">
        <DashboardTableCard
          title="Vote Queue"
          description="Governance items in scope."
          headers={['Vote', 'Status', 'Votes Cast', 'Participation', 'Action']}
          rows={votes.map((vote) => [
            <button key={`${vote.voteId}-link`} type="button" className="ghost-button" onClick={() => setSelectedVoteId(vote.voteId)}>
              {vote.title}
            </button>,
            <span
              className={`table-status-badge ${
                vote.status === 'open'
                  ? 'positive'
                  : vote.status === 'draft'
                    ? 'warning'
                    : 'neutral'
              }`}
            >
              {capitalize(vote.status)}
            </span>,
            vote.totalResponses.toLocaleString(),
            <div className="table-inline-progress">
              <span>{vote.participationRate.toFixed(0)}%</span>
              <div className="table-progress-track">
                <div
                  className={`table-progress-fill ${
                    vote.participationRate >= 50 ? 'success' : vote.participationRate >= 30 ? 'warning' : 'accent'
                  }`}
                  style={{ width: `${Math.min(Math.max(vote.participationRate, 0), 100)}%` }}
                />
              </div>
            </div>,
            <span className="table-status-badge neutral">
              {vote.status === 'draft'
                ? 'Ready to open'
                : vote.status === 'open'
                  ? 'Monitor or close'
                  : 'View final results'}
            </span>,
          ])}
        />
        {selectedVote ? (
          <div className="page-actions">
            <button
              type="button"
              className="primary-button"
              disabled={!canManage || selectedVote.status !== 'draft'}
              onClick={() => void handleStatusChange('open')}
            >
              Open voting
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!canManage || selectedVote.status !== 'open'}
              onClick={() => void handleStatusChange('close')}
            >
              Close voting
            </button>
          </div>
        ) : null}
      </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardSectionCard title="Participation Tracking" description="Branch and district turnout for the selected voting event.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DashboardMetricRow label="Responses" value={participation?.totalResponses?.toLocaleString() ?? '0'} />
            <DashboardMetricRow label="Branches" value={participation?.uniqueBranches?.toLocaleString() ?? '0'} />
            <DashboardMetricRow label="Districts" value={participation?.uniqueDistricts?.toLocaleString() ?? '0'} />
          </div>
          <DashboardMiniBars
            items={(participation?.branchParticipation ?? []).slice(0, 5).map((item) => ({
              label: item.name.split(' ')[0] ?? item.name,
              value: item.totalResponses,
              tone: 'blue',
            }))}
          />
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DashboardTableCard
              title="Branch Turnout"
              headers={['Branch', 'Votes']}
              rows={(participation?.branchParticipation ?? []).map((item) => [
                item.name,
                <div className="table-inline-progress">
                  <span>{item.totalResponses.toLocaleString()}</span>
                  <div className="table-progress-track">
                    <div
                      className="table-progress-fill blue"
                      style={{
                        width: `${Math.min(
                          Math.round((item.totalResponses / Math.max(maxBranchResponses, 1)) * 100),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>,
              ])}
            />
            <DashboardTableCard
              title="District Turnout"
              headers={['District', 'Votes']}
              rows={(participation?.districtParticipation ?? []).map((item) => [
                item.name,
                <div className="table-inline-progress">
                  <span>{item.totalResponses.toLocaleString()}</span>
                  <div className="table-progress-track">
                    <div
                      className="table-progress-fill teal"
                      style={{
                        width: `${Math.min(
                          Math.round((item.totalResponses / Math.max(maxDistrictResponses, 1)) * 100),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>,
              ])}
            />
          </div>
        </DashboardSectionCard>

        <DashboardTableCard
          title="Results View"
          description="Votes per option and result percentages for the selected event."
          headers={['Option', 'Votes', 'Percentage']}
          rows={results.map((item) => [
            item.optionName,
            item.votes.toLocaleString(),
            <div className="table-inline-progress">
              <span>{item.percentage.toFixed(2)}%</span>
              <div className="table-progress-track">
                <div
                  className="table-progress-fill success"
                  style={{ width: `${Math.min(Math.max(item.percentage, 0), 100)}%` }}
                />
              </div>
            </div>,
          ])}
        />
      </DashboardGrid>
      </div>
    </DashboardPage>
  );
}

const headOfficeRoles = new Set<AdminRole>([
  AdminRole.HEAD_OFFICE_OFFICER,
  AdminRole.HEAD_OFFICE_MANAGER,
  AdminRole.HEAD_OFFICE_DIRECTOR,
  AdminRole.ADMIN,
]);

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
