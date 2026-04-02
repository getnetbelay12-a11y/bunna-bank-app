import { AuthService } from './auth.service';
import { CheckExistingAccountDto, MemberLoginDto, RefreshTokenDto, RegisterMemberDto, RequestOtpDto, StartLoginDto, StaffLoginDto, VerifyPinLoginDto, VerifyOtpDto } from './dto';
import { AuthenticatedUser } from './interfaces';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
        deliveryChannel: string;
        status: string;
        reference: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        phoneNumber: string;
        verified: boolean;
        status: string;
    }>;
    logout(currentUser: AuthenticatedUser): Promise<{
        success: boolean;
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
            schoolPayment: boolean;
            loans: boolean;
            savings: boolean;
            liveChat: boolean;
        };
    }>;
    refreshTokens(currentUser: AuthenticatedUser, dto: RefreshTokenDto): Promise<import("./auth.types").AuthTokens>;
}
