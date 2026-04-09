import { DashboardKpiCard } from './BankingDashboard';

type ConsoleKpiItem = {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendDirection?: 'up' | 'down' | 'neutral';
};

export function ConsoleKpiStrip({ items }: { items: ConsoleKpiItem[] }) {
  return (
    <section className="console-kpi-strip dashboard-kpi-strip">
      {items.map((item) => (
        <DashboardKpiCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          trend={item.trend}
          trendDirection={item.trendDirection}
        />
      ))}
    </section>
  );
}
