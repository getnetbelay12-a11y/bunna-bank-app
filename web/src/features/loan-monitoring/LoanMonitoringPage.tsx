import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

export function LoanMonitoringPage() {
  return (
    <div className="page-stack">
      <Panel
        title="Loan Monitoring"
        description="Filterable operational loan queue for branch, district, and head office staff."
      >
        <SimpleTable
          headers={['Loan ID', 'Member', 'Amount', 'Level', 'Status']}
          rows={[
            ['LN-1001', 'Abebe Kebede', 'ETB 500,000', 'Branch', 'Submitted'],
            ['LN-1002', 'Mekdes Ali', 'ETB 24,000,000', 'District', 'Forwarded'],
            ['LN-1003', 'Yonas Taye', 'ETB 32,000,000', 'Head Office', 'Review'],
          ]}
        />
      </Panel>
    </div>
  );
}
