import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateAtmCardRequestDto } from './dto/create-atm-card-request.dto';
import { CreateAutopayDto } from './dto/create-autopay.dto';
import { SelfieVerifyDto } from './dto/selfie-verify.dto';
import { UpdateAccountLockDto } from './dto/update-account-lock.dto';
import { UpdateAutopayStatusDto } from './dto/update-autopay-status.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { AccountMemberRequestDocument } from './schemas/account-member-request.schema';
import { AtmCardRequestDocument } from './schemas/atm-card-request.schema';
import { AutopaySettingDocument } from './schemas/autopay-setting.schema';
import { MemberSecuritySettingDocument } from './schemas/member-security-setting.schema';
import { PhoneUpdateRequestDocument } from './schemas/phone-update-request.schema';
import { SelfieVerificationDocument } from './schemas/selfie-verification.schema';
export declare class ServicePlaceholdersService {
    private readonly autopayModel;
    private readonly memberModel;
    private readonly securityModel;
    private readonly atmCardRequestModel;
    private readonly phoneUpdateRequestModel;
    private readonly accountMemberRequestModel;
    private readonly selfieVerificationModel;
    private readonly auditService;
    private readonly notificationsService;
    constructor(autopayModel: Model<AutopaySettingDocument>, memberModel: Model<MemberDocument>, securityModel: Model<MemberSecuritySettingDocument>, atmCardRequestModel: Model<AtmCardRequestDocument>, phoneUpdateRequestModel: Model<PhoneUpdateRequestDocument>, accountMemberRequestModel: Model<AccountMemberRequestDocument>, selfieVerificationModel: Model<SelfieVerificationDocument>, auditService: AuditService, notificationsService: NotificationsService);
    createAutopay(currentUser: AuthenticatedUser, dto: CreateAutopayDto): Promise<{
        feature: string;
        status: string;
        item: {
            id: string | undefined;
            provider: string;
            serviceType: string;
            accountId: string;
            schedule: string;
            enabled: boolean;
        };
    }>;
    listAutopay(currentUser: AuthenticatedUser): Promise<{
        feature: string;
        status: string;
        items: {
            id: string | undefined;
            provider: string;
            serviceType: string;
            accountId: string;
            schedule: string;
            enabled: boolean;
        }[];
    }>;
    updateAutopayStatus(currentUser: AuthenticatedUser, dto: UpdateAutopayStatusDto): Promise<{
        feature: string;
        status: string;
        item: {
            id: string | undefined;
            provider: string;
            serviceType: string;
            accountId: string;
            schedule: string;
            enabled: boolean;
        };
    }>;
    updateAccountLock(currentUser: AuthenticatedUser, dto: UpdateAccountLockDto): Promise<{
        feature: string;
        status: string;
        memberId: string;
        accountLockEnabled: boolean;
    }>;
    getAccountLock(currentUser: AuthenticatedUser): Promise<{
        feature: string;
        status: string;
        memberId: string;
        accountLockEnabled: boolean;
    }>;
    createAtmCardRequest(currentUser: AuthenticatedUser, dto: CreateAtmCardRequestDto): Promise<{
        feature: string;
        status: string;
        workflow: string[];
        requestId: string;
    }>;
    updatePhone(currentUser: AuthenticatedUser, dto: UpdatePhoneDto): Promise<{
        feature: string;
        status: string;
        requestId: string;
        memberId: string;
        selfieVerificationRequired: boolean;
    }>;
    addMember(currentUser: AuthenticatedUser, dto: AddMemberDto): Promise<{
        feature: string;
        status: string;
        requestId: string;
        memberId: string;
        selfieVerificationRequired: boolean;
    }>;
    selfieVerify(currentUser: AuthenticatedUser, dto: SelfieVerifyDto): Promise<{
        feature: string;
        status: string;
        requestId: string;
        memberId: string;
        payload: SelfieVerifyDto;
    }>;
    private toAutopayItem;
    private toObjectId;
    private loadEligibleMember;
    private ensureProfileMatchesMember;
    private ensureStrongCardPin;
    private hashSecret;
}
