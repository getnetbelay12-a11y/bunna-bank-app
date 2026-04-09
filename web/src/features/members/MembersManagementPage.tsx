import { useState } from 'react';

import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { RecommendationPanel } from '../recommendations/RecommendationPanel';

const memberRows = [
  {
    memberId: 'abebe-kebede',
    customerId: 'AMB-000001',
    memberName: 'Abebe Kebede',
    verification: 'Verified',
    savings: 'ETB 186,400',
    status: 'Active',
  },
  {
    memberId: 'meseret-alemu',
    customerId: 'AMB-000009',
    memberName: 'Meseret Alemu',
    verification: 'Manual Review',
    savings: 'ETB 74,250',
    status: 'Pending',
  },
] as const;

export function MembersManagementPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    memberRows[1].memberId,
  );

  return (
    <div className="page-stack">
      <RecommendationPanel
        memberId={selectedMemberId}
        title="Customer Detail Recommendations"
        description="Eligibility hints, service completion prompts, and follow-up actions for a selected customer."
      />
      <Panel
        title="Members"
        description="Branch-level member list, onboarding status, verification follow-up, and relationship monitoring."
      >
        <div className="recommendation-selector-row">
          {memberRows.map((member) => (
            <button
              key={member.memberId}
              type="button"
              className={
                selectedMemberId === member.memberId
                  ? 'recommendation-selector active'
                  : 'recommendation-selector'
              }
              onClick={() => setSelectedMemberId(member.memberId)}
            >
              {member.memberName}
            </button>
          ))}
        </div>
        <SimpleTable
          headers={['Customer ID', 'Member', 'Verification', 'Savings', 'Status']}
          rows={memberRows.map((member) => [
            member.customerId,
            member.memberName,
            member.verification,
            member.savings,
            member.status,
          ])}
        />
      </Panel>
    </div>
  );
}
