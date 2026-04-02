export interface FaydaVerificationProvider {
  readonly mode: 'official' | 'manual';

  start(input: {
    memberId: string;
    phoneNumber: string;
    consentAccepted: boolean;
  }): Promise<{
    verificationMethod: string;
    verificationStatus: string;
    verificationReference: string;
    failureReason?: string;
  }>;

  submitFin(input: {
    memberId: string;
    phoneNumber: string;
    faydaFin: string;
    faydaAlias?: string;
  }): Promise<{
    verificationMethod: string;
    verificationStatus: string;
    verificationReference: string;
    failureReason?: string;
  }>;

  uploadQr(input: {
    memberId: string;
    phoneNumber: string;
    qrDataRaw?: string;
    faydaAlias?: string;
  }): Promise<{
    verificationMethod: string;
    verificationStatus: string;
    verificationReference: string;
    failureReason?: string;
  }>;

  verify(input: {
    memberId: string;
    phoneNumber: string;
  }): Promise<{
    verificationMethod: string;
    verificationStatus: string;
    verificationReference: string;
    verifiedAt?: Date;
    failureReason?: string;
  }>;
}
