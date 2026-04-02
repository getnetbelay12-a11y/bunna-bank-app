import { DistrictAnalyticsPage } from '../district-analytics/DistrictAnalyticsPage';
import type { AdminSession } from '../../core/session';

type DistrictPerformancePageProps = {
  session: AdminSession;
};

export function DistrictPerformancePage({ session }: DistrictPerformancePageProps) {
  return <DistrictAnalyticsPage session={session} />;
}
