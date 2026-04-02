import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

export function AlertsPage() {
  return (
    <div className="page-stack">
      <Panel
        title="District Alerts"
        description="Escalations, low-performing branches, and unresolved district risks."
      >
        <SimpleTable
          headers={['Alert', 'Scope', 'Priority', 'Status']}
          rows={[
            ['Low branch throughput', 'Debre Markos Branch', 'High', 'Open'],
            ['Escalated loan backlog', 'Gondar District', 'Medium', 'Monitoring'],
          ]}
        />
      </Panel>
    </div>
  );
}
