import type { ReactNode } from 'react';

import {
  DashboardCard,
  DashboardDataTable,
} from '../../shared/components/BankingDashboard';

type WatchlistPanelFrameProps = {
  title: string;
  description: string;
  filterRow?: ReactNode;
  summaryChips: Array<{ label: string; value: ReactNode }>;
  tableHeaders: string[];
  tableRows: ReactNode[][];
  emptyState?: {
    title: string;
    description: string;
  };
};

export function WatchlistPanelFrame({
  title,
  description,
  filterRow,
  summaryChips,
  tableHeaders,
  tableRows,
  emptyState,
}: WatchlistPanelFrameProps) {
  return (
    <DashboardCard
      title={title}
      description={description}
      className="watchlist-panel-frame"
    >
      {filterRow}
      <div className="watchlist-summary-grid">
        {summaryChips.map((chip) => (
          <div key={chip.label} className="watchlist-summary-chip">
            <span className="dashboard-summary-label">{chip.label}</span>
            <strong>{chip.value}</strong>
          </div>
        ))}
      </div>
      <DashboardDataTable
        headers={tableHeaders}
        rows={
          tableRows.length > 0
            ? tableRows
            : [[
                emptyState?.title ?? 'Nothing to review right now',
                emptyState?.description ?? 'This view is clear for the current scope and filter.',
                '-',
                '-',
                '-',
              ].slice(0, tableHeaders.length)]
        }
      />
    </DashboardCard>
  );
}
