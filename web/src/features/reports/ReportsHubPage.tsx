import { Panel } from '../../shared/components/Panel';

type ReportsHubPageProps = {
  title: string;
  description: string;
};

export function ReportsHubPage({ title, description }: ReportsHubPageProps) {
  return (
    <div className="page-stack">
      <Panel title={title} description={description}>
        <div className="summary-note">
          Downloadable reports, operational exports, and scheduled summary jobs
          should be managed from this hub.
        </div>
      </Panel>
    </div>
  );
}
