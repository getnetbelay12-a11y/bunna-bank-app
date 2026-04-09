type KpiCardProps = {
  title: string;
  value: string;
  caption: string;
  trend?: string;
  trendTone?: 'positive' | 'neutral' | 'warning';
  sparkline?: number[];
};

export function KpiCard({
  title,
  value,
  caption,
  trend,
  trendTone = 'positive',
  sparkline,
}: KpiCardProps) {
  const variantClass =
    title === 'Customers'
      ? 'kpi-card-customers'
      : title === 'Savings'
        ? 'kpi-card-savings'
        : title === 'Active loans'
          ? 'kpi-card-loans'
          : title === 'Pending approvals'
            ? 'kpi-card-approvals'
            : '';
  const bars = sparkline?.length
    ? sparkline
    : [3, 5, 4, 6, 7, 5, 8];

  const maxValue = Math.max(...bars, 1);

  return (
    <article className={`panel kpi-card ${variantClass}`.trim()}>
      <div className="kpi-card-header">
        <p className="eyebrow">{title}</p>
        {trend ? <span className={`kpi-trend ${trendTone}`}>{trend}</span> : null}
      </div>
      <h3>{value}</h3>
      <p className="muted">{caption}</p>
      <div className="kpi-sparkline" aria-hidden="true">
        {bars.map((bar, index) => (
          <span
            key={`${title}-${index}`}
            className="kpi-sparkline-bar"
            style={{ height: `${Math.max((bar / maxValue) * 100, 20)}%` }}
          />
        ))}
      </div>
    </article>
  );
}
