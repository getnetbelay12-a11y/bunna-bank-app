import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

export function SavingsManagementPage() {
  return (
    <div className="page-stack">
      <Panel
        title="Savings"
        description="Savings balances, activity monitoring, and account-level operational follow-up."
      >
        <SimpleTable
          headers={['Account', 'Member', 'Balance', 'Last Activity', 'Flag']}
          rows={[
            ['10023489', 'Abebe Kebede', 'ETB 186,400', 'Today', 'Healthy'],
            ['10024567', 'Meseret Alemu', 'ETB 74,250', 'Yesterday', 'Review'],
          ]}
        />
      </Panel>
    </div>
  );
}
