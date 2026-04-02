import { BranchAnalyticsPage } from '../branch-analytics/BranchAnalyticsPage';
import type { AdminSession } from '../../core/session';

type BranchOverviewPageProps = {
  session: AdminSession;
};

export function BranchOverviewPage({ session }: BranchOverviewPageProps) {
  return <BranchAnalyticsPage session={session} />;
}
