import { FaydaExtractionDto } from './fayda-extraction.dto';
export declare class RegisterMemberDto {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    region?: string;
    city?: string;
    preferredBranchId?: string;
    preferredBranchName?: string;
    password: string;
    confirmPassword: string;
    faydaFin?: string;
    faydaAlias?: string;
    faydaQrData?: string;
    faydaFrontImage?: string;
    faydaBackImage?: string;
    consentAccepted?: boolean;
    extractedFaydaData?: FaydaExtractionDto;
}
