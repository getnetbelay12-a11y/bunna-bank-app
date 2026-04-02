import { AuthPrincipal } from './interfaces';
export interface MemberAuthRepository {
    findByCustomerId(customerId: string): Promise<AuthPrincipal | null>;
}
export interface StaffAuthRepository {
    findByIdentifier(identifier: string): Promise<AuthPrincipal | null>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface StartLoginResult {
    challengeId: string;
    expiresAt: string;
}
export interface CheckExistingAccountResult {
    exists: boolean;
    matchType?: 'phone' | 'fayda_fin' | 'national_id_data' | 'email';
    message: string;
}
export interface LoginResult extends AuthTokens {
    user: {
        id: string;
        role: string;
        customerId?: string;
        memberType?: string;
        fullName?: string;
        memberNumber?: string;
        staffNumber?: string;
        branchId?: string;
        districtId?: string;
        branchName?: string;
        districtName?: string;
        phone?: string;
        membershipStatus?: string;
        identityVerificationStatus?: string;
        featureFlags?: {
            voting: boolean;
            schoolPayment: boolean;
            loans: boolean;
            savings: boolean;
            liveChat: boolean;
        };
    };
}
