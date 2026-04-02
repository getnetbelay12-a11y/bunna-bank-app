import { Injectable } from '@nestjs/common';

import { FaydaVerificationProvider } from '../interfaces/fayda-verification-provider.interface';

@Injectable()
export class OfficialFaydaVerificationProvider
  implements FaydaVerificationProvider
{
  readonly mode = 'official' as const;

  async start() {
    return {
      verificationMethod: 'official_online_ekyc',
      verificationStatus: 'pending_verification',
      verificationReference: `OFFICIAL-START-${Date.now()}`,
    };
  }

  async submitFin() {
    return {
      verificationMethod: 'official_online_ekyc',
      verificationStatus: 'pending_verification',
      verificationReference: `OFFICIAL-FIN-${Date.now()}`,
    };
  }

  async uploadQr() {
    return {
      verificationMethod: 'official_offline_qr',
      verificationStatus: 'pending_verification',
      verificationReference: `OFFICIAL-QR-${Date.now()}`,
    };
  }

  async verify() {
    return {
      verificationMethod: 'official_online_ekyc',
      verificationStatus: 'failed',
      verificationReference: `OFFICIAL-VERIFY-${Date.now()}`,
      failureReason:
        'Official Fayda integration is not configured in this environment.',
    };
  }
}
