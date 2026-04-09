type TrendBarsProps = {
  items: Array<{
    label: string;
    value: number;
  }>;
  emptyState?: {
    title: string;
    description: string;
  };
};

export function TrendBars({ items, emptyState }: TrendBarsProps) {
  if (items.length === 0) {
    return (
      <div className="simple-table-empty-state">
        <strong>{emptyState?.title ?? 'No trend data yet'}</strong>
        <span>{emptyState?.description ?? 'Trend data will appear here when activity is available.'}</span>
      </div>
    );
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="trend-bars">
      {items.map((item) => (
        <div key={item.label} className="trend-row">
          <div className="trend-meta">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="trend-track">
            <div
              className="trend-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
