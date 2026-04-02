import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

export function MembersManagementPage() {
  return (
    <div className="page-stack">
      <Panel
        title="Members"
        description="Branch-level member list, onboarding status, verification follow-up, and relationship monitoring."
      >
        <SimpleTable
          headers={['Customer ID', 'Member', 'Verification', 'Savings', 'Status']}
          rows={[
            ['AMB-000001', 'Abebe Kebede', 'Verified', 'ETB 186,400', 'Active'],
            ['AMB-000009', 'Meseret Alemu', 'Manual Review', 'ETB 74,250', 'Pending'],
          ]}
        />
      </Panel>
    </div>
  );
}
