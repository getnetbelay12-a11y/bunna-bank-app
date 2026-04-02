import { AuthenticatedUser } from '../auth/interfaces';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateAtmCardRequestDto } from './dto/create-atm-card-request.dto';
import { CreateAutopayDto } from './dto/create-autopay.dto';
import { SelfieVerifyDto } from './dto/selfie-verify.dto';
import { UpdateAccountLockDto } from './dto/update-account-lock.dto';
import { UpdateAutopayStatusDto } from './dto/update-autopay-status.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ServicePlaceholdersService } from './service-placeholders.service';
export declare class ServicePlaceholdersController {
    private readonly servicePlaceholdersService;
    constructor(servicePlaceholdersService: ServicePlaceholdersService);
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
}
