import { FaydaVerificationProvider } from '../interfaces/fayda-verification-provider.interface';
export declare class ManualReviewFaydaVerificationProvider implements FaydaVerificationProvider {
    readonly mode: "manual";
    start(): Promise<{
        verificationMethod: string;
        verificationStatus: string;
        verificationReference: string;
    }>;
    submitFin(): Promise<{
        verificationMethod: string;
        verificationStatus: string;
        verificationReference: string;
    }>;
    uploadQr(): Promise<{
        verificationMethod: string;
        verificationStatus: string;
        verificationReference: string;
    }>;
    verify(): Promise<{
        verificationMethod: string;
        verificationStatus: string;
        verificationReference: string;
        failureReason: string;
    }>;
}
