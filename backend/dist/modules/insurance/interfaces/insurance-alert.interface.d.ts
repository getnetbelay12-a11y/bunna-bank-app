export interface InsuranceAlertItem {
    loanId: string;
    memberId: string;
    customerId: string;
    memberName: string;
    branchId: string;
    districtId: string;
    policyId?: string;
    policyNumber?: string;
    providerName?: string;
    insuranceType?: string;
    alertType: 'expiring_30_days' | 'expiring_7_days' | 'expired' | 'loan_without_valid_insurance' | 'loan_without_linked_insurance';
    endDate?: Date;
    daysUntilExpiry?: number;
    requiresManagerAction: boolean;
}
