import type { PropsWithChildren, ReactNode } from 'react';

export function DashboardPage({ children }: PropsWithChildren) {
  return <div className="page-stack console-card-page">{children}</div>;
}

export function DashboardGrid({
  children,
  cols = 2,
}: PropsWithChildren<{ cols?: 1 | 2 }>) {
  return <div className={cols === 2 ? 'bank-dashboard-grid' : 'dashboard-single-grid'}>{children}</div>;
}

export function DashboardCard({
  title,
  description,
  action,
  className,
  children,
}: PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={className ? `dashboard-card ${className}` : 'dashboard-card'}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="dashboard-card-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardDataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="dashboard-data-table">
      <div className="dashboard-data-table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DashboardKpiCard({
  icon,
  label,
  value,
  trend,
  trendDirection = 'neutral',
}: {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}) {
  return (
    <article className="console-kpi-card kpi-card">
      <div className="console-kpi-card-top">
        <span className="console-kpi-icon">{icon}</span>
        {trend ? (
          <span className={`console-kpi-trend ${trendDirection}`}>
            {trendDirection === 'down' ? 'v' : trendDirection === 'up' ? '^' : '-'} {trend}
          </span>
        ) : null}
      </div>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function DashboardAlertCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  tone: 'red' | 'orange' | 'amber' | 'blue';
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`critical-alert-chip ${tone}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

export function DashboardSectionCard(props: PropsWithChildren<{ title: string; description?: string; action?: ReactNode; className?: string }>) {
  return <DashboardCard {...props} />;
}

export function DashboardMetricRow({
  label,
  value,
  note,
  onClick,
}: {
  label: string;
  value: string;
  note?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="dashboard-metric-row">
      <div>
        <span className="dashboard-metric-label">{label}</span>
        {note ? <span className="dashboard-metric-note">{note}</span> : null}
      </div>
      <strong className="dashboard-metric-value">{value}</strong>
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  );
}

export function DashboardProgressRow({
  label,
  value,
  progress,
  tone = 'blue',
}: {
  label: string;
  value: string;
  progress: number;
  tone?: 'blue' | 'teal' | 'amber' | 'red' | 'green';
}) {
  const toneClass =
    tone === 'teal'
      ? 'from-cyan-500 to-teal-500'
      : tone === 'amber'
        ? 'from-amber-400 to-orange-500'
        : tone === 'red'
          ? 'from-red-500 to-red-600'
          : tone === 'green'
            ? 'from-emerald-500 to-green-500'
            : 'from-blue-500 to-blue-700';

  return (
    <div className="dashboard-progress-row">
      <div className="dashboard-progress-meta">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="dashboard-progress-track">
        <div className={`dashboard-progress-fill ${tone}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
      </div>
    </div>
  );
}

export function DashboardMiniBars({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
    tone?: 'blue' | 'teal' | 'amber' | 'red' | 'green';
  }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="dashboard-mini-bars">
      {items.map((item) => (
        <div key={item.label} className="dashboard-mini-bar-item">
          <div className="dashboard-mini-bar-track">
            <div
              className={`dashboard-mini-bar-fill ${item.tone ?? 'blue'}`}
              style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
          <strong>{item.value.toLocaleString()}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPipelineCard({
  title,
  description,
  stages,
}: {
  title: string;
  description?: string;
  stages: Array<{ label: string; value: string; progress: number; tone?: 'blue' | 'teal' | 'amber' | 'red' | 'green' }>;
}) {
  return (
    <DashboardCard title={title} description={description}>
      <div className="dashboard-stack">
        {stages.map((stage) => (
          <DashboardProgressRow
            key={stage.label}
            label={stage.label}
            value={stage.value}
            progress={stage.progress}
            tone={stage.tone}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

export function DashboardTableCard({
  title,
  description,
  className,
  headers,
  rows,
}: {
  title: string;
  description?: string;
  className?: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <DashboardCard title={title} description={description} className={className}>
      <DashboardDataTable headers={headers} rows={rows} />
    </DashboardCard>
  );
}

export function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="dashboard-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function QuickActionChip({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-quick-chip"
    >
      {label}
    </button>
  );
}

export function FloatingChatButton({
  unreadCount,
  isOpen,
  onClick,
}: {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-expanded={isOpen}
      aria-label="Open support chat panel"
      className="floating-chat-button"
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">Chat</span>
      {unreadCount ? (
        <span className="floating-chat-count">{unreadCount}</span>
      ) : null}
    </button>
  );
}
