export interface ManagerDashboardSummary {
    customersServed: number;
    transactionsCount: number;
    schoolPaymentsCount: number;
    pendingLoansByLevel: Array<{
        level: string;
        count: number;
    }>;
}
export interface PerformanceSummaryItem {
    scopeId: string;
    customersServed: number;
    transactionsCount: number;
    loanApprovedCount: number;
    loanRejectedCount: number;
    schoolPaymentsCount: number;
    totalTransactionAmount: number;
}
export interface StaffRankingItem {
    staffId: string;
    branchId: string;
    districtId: string;
    score: number;
    customersServed: number;
    transactionsCount: number;
    loanApprovedCount: number;
    schoolPaymentsCount: number;
}
export interface VotingSummaryItem {
    voteId: string;
    title: string;
    totalResponses: number;
    eligibleShareholders: number;
    participationRate: number;
}
export interface OnboardingReviewItem {
    memberId: string;
    customerId: string;
    memberName: string;
    phoneNumber?: string;
    branchId?: string;
    districtId?: string;
    branchName?: string;
    onboardingReviewStatus: string;
    membershipStatus: string;
    identityVerificationStatus: string;
    kycStatus: string;
    requiredAction: string;
    submittedAt?: string;
    updatedAt?: string;
    reviewNote?: string;
    onboardingEvidence?: {
        hasFaydaFrontImage: boolean;
        hasFaydaBackImage: boolean;
        hasSelfieImage: boolean;
        extractedFullName?: string;
        extractedPhoneNumber?: string;
        extractedCity?: string;
        extractedFaydaFinMasked?: string;
        dateOfBirthCandidates: string[];
        reviewRequiredFields: string[];
        extractionMethod?: string;
    };
}
export interface OnboardingEvidenceDetail {
    memberId: string;
    customerId: string;
    memberName: string;
    phoneNumber?: string;
    branchName?: string;
    onboardingReviewStatus: string;
    identityVerificationStatus: string;
    reviewNote?: string;
    documents: {
        faydaFront?: {
            storageKey: string;
            originalFileName?: string;
            mimeType?: string;
            sizeBytes?: number;
        };
        faydaBack?: {
            storageKey: string;
            originalFileName?: string;
            mimeType?: string;
            sizeBytes?: number;
        };
        selfie?: {
            storageKey: string;
            originalFileName?: string;
            mimeType?: string;
            sizeBytes?: number;
        };
    };
    submittedProfile: {
        fullName?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        phoneNumber?: string;
        region?: string;
        city?: string;
        branchName?: string;
        faydaFinMasked?: string;
    };
    reviewPolicy: {
        policyVersion: string;
        blockingMismatchFields: string[];
        blockingMismatchApprovalRoles: string[];
        blockingMismatchApprovalReasonCodes: string[];
        requireApprovalJustification: boolean;
    };
    extractedFaydaData?: {
        fullName?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        sex?: string;
        phoneNumber?: string;
        nationality?: string;
        region?: string;
        city?: string;
        subCity?: string;
        woreda?: string;
        faydaFinMasked?: string;
        serialNumber?: string;
        cardNumber?: string;
        dateOfBirthCandidates: string[];
        expiryDateCandidates: string[];
        reviewRequiredFields: string[];
        extractionMethod?: string;
    };
    mismatches: Array<{
        field: string;
        submittedValue?: string;
        extractedValue?: string;
    }>;
}
export interface AutopayOperationItem {
    id: string;
    memberId: string;
    customerId: string;
    memberName: string;
    branchId?: string;
    districtId?: string;
    branchName?: string;
    serviceType: string;
    accountId: string;
    schedule: string;
    enabled: boolean;
    operationalStatus: 'active' | 'paused';
    actionRequired: string;
    updatedAt?: string;
}
