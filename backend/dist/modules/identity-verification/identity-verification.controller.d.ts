import { AuthenticatedUser } from '../auth/interfaces';
import { StartFaydaVerificationDto, SubmitFaydaFinDto, UploadFaydaQrDto } from './dto';
import { IdentityVerificationService } from './identity-verification.service';
export declare class IdentityVerificationController {
    private readonly identityVerificationService;
    constructor(identityVerificationService: IdentityVerificationService);
    start(currentUser: AuthenticatedUser, dto: StartFaydaVerificationDto): Promise<{
        id: any;
        memberId: string;
        phoneNumber: string;
        faydaFin: string | undefined;
        faydaAlias: string | undefined;
        qrDataRaw: string | undefined;
        verificationMethod: string;
        verificationStatus: string;
        verifiedAt: Date | undefined;
        verificationReference: string | undefined;
        failureReason: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    }>;
    submitFin(currentUser: AuthenticatedUser, dto: SubmitFaydaFinDto): Promise<{
        id: any;
        memberId: string;
        phoneNumber: string;
        faydaFin: string | undefined;
        faydaAlias: string | undefined;
        qrDataRaw: string | undefined;
        verificationMethod: string;
        verificationStatus: string;
        verifiedAt: Date | undefined;
        verificationReference: string | undefined;
        failureReason: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    }>;
    uploadQr(currentUser: AuthenticatedUser, dto: UploadFaydaQrDto): Promise<{
        id: any;
        memberId: string;
        phoneNumber: string;
        faydaFin: string | undefined;
        faydaAlias: string | undefined;
        qrDataRaw: string | undefined;
        verificationMethod: string;
        verificationStatus: string;
        verifiedAt: Date | undefined;
        verificationReference: string | undefined;
        failureReason: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    }>;
    verify(currentUser: AuthenticatedUser): Promise<{
        id: any;
        memberId: string;
        phoneNumber: string;
        faydaFin: string | undefined;
        faydaAlias: string | undefined;
        qrDataRaw: string | undefined;
        verificationMethod: string;
        verificationStatus: string;
        verifiedAt: Date | undefined;
        verificationReference: string | undefined;
        failureReason: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    }>;
    getStatus(currentUser: AuthenticatedUser): Promise<{
        id: any;
        memberId: string;
        phoneNumber: string;
        faydaFin: string | undefined;
        faydaAlias: string | undefined;
        qrDataRaw: string | undefined;
        verificationMethod: string;
        verificationStatus: string;
        verifiedAt: Date | undefined;
        verificationReference: string | undefined;
        failureReason: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
    } | {
        memberId: string;
        phoneNumber: string;
        verificationStatus: string;
        verificationMethod: string;
    }>;
}
