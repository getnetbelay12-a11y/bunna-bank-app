import { AuthSecurityService } from './auth-security.service';
import { AuthService } from './auth.service';
import { CheckExistingAccountDto, LookupOnboardingStatusDto, MemberLoginDto, RefreshTokenDto, RecoveryOptionsDto, RegisterMemberDto, RequestOtpDto, ResetPinDto, StartLoginDto, StaffLoginDto, VerifyStaffStepUpDto, VerifyPinLoginDto, VerifyOtpDto } from './dto';
import { AuthenticatedUser } from './interfaces';
export declare class AuthController {
    private readonly authService;
    private readonly authSecurityService;
    constructor(authService: AuthService, authSecurityService: AuthSecurityService);
    checkExistingAccount(dto: CheckExistingAccountDto): Promise<import("./auth.types").CheckExistingAccountResult>;
    register(dto: RegisterMemberDto): Promise<{
        customerId: string;
        memberId: string;
        message: string;
    }>;
    startLogin(dto: StartLoginDto): Promise<import("./auth.types").StartLoginResult>;
    verifyPinLogin(dto: VerifyPinLoginDto): Promise<import("./auth.types").LoginResult>;
    login(dto: MemberLoginDto): Promise<import("./auth.types").LoginResult>;
    loginMember(dto: MemberLoginDto): Promise<import("./auth.types").LoginResult>;
    loginStaff(dto: StaffLoginDto): Promise<import("./auth.types").LoginResult>;
    requestOtp(dto: RequestOtpDto): Promise<{
        phoneNumber: string;
        email: string | undefined;
        purpose: string;
        deliveryChannel: import("../../common/enums").NotificationChannel;
        maskedDestination: string;
        status: string;
        reference: string;
        providerStatus: "failed" | "sent" | "delivered";
    }>;
    getRecoveryOptions(dto: RecoveryOptionsDto): Promise<{
        phoneNumber: string;
        channels: {
            channel: string;
            maskedDestination: string;
        }[];
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        phoneNumber: string;
        verified: boolean;
        status: string;
    }>;
    getOnboardingStatus(dto: LookupOnboardingStatusDto): Promise<{
        customerId: string;
        phoneNumber: string;
        branchName: string | undefined;
        onboardingReviewStatus: string;
        membershipStatus: string;
        identityVerificationStatus: string;
        reviewNote: string | undefined;
        requiredAction: string;
        statusMessage: string;
        lastUpdatedAt: string | undefined;
    }>;
    resetPin(dto: ResetPinDto): Promise<{
        status: string;
        phoneNumber: string;
        message: string;
    }>;
    logout(currentUser: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    verifyStaffStepUp(currentUser: AuthenticatedUser, dto: VerifyStaffStepUpDto): Promise<{
        stepUpToken: string;
        verifiedAt: string;
        expiresInSeconds: number;
        method: string;
    }>;
    getCurrentSession(currentUser: AuthenticatedUser): Promise<{
        id: string;
        role: import("../../common/enums").UserRole.MEMBER | import("../../common/enums").UserRole.SHAREHOLDER_MEMBER;
        customerId: string;
        memberType: import("../../common/enums").MemberType;
        fullName: string;
        memberNumber: string;
        branchId: string;
        districtId: string;
        branchName: string | undefined;
        districtName: string | undefined;
        phone: string;
        membershipStatus: string;
        identityVerificationStatus: string;
        featureFlags: {
            voting: boolean;
            announcements: boolean;
            dividends: boolean;
            schoolPayment: boolean;
            loans: boolean;
            savings: boolean;
            liveChat: boolean;
        };
    }>;
    getSecurityOverview(currentUser: AuthenticatedUser): Promise<{
        accountLockEnabled: boolean;
        highRiskActionVerification: boolean;
        sessions: {
            challengeId: string;
            deviceId: string | undefined;
            loginIdentifier: string;
            status: "verified" | "pending" | "expired" | "logged_out";
            expiresAt: string;
            verifiedAt: string | undefined;
            loggedOutAt: string | undefined;
            createdAt: string | undefined;
            updatedAt: string | undefined;
            isCurrent: boolean;
        }[];
        devices: {
            deviceId: string;
            rememberDevice: boolean;
            biometricEnabled: boolean;
            lastLoginAt: string | undefined;
            createdAt: string | undefined;
            updatedAt: string | undefined;
            isCurrent: boolean;
        }[];
    }>;
    revokeSession(currentUser: AuthenticatedUser, challengeId: string): Promise<{
        challengeId: string;
        status: "verified" | "pending" | "expired" | "logged_out";
        loggedOutAt: string | undefined;
    }>;
    refreshTokens(currentUser: AuthenticatedUser, dto: RefreshTokenDto): Promise<import("./auth.types").AuthTokens>;
}
