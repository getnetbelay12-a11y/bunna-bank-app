import { Injectable } from '@nestjs/common';

import { FaydaVerificationProvider } from '../interfaces/fayda-verification-provider.interface';

@Injectable()
export class ManualReviewFaydaVerificationProvider
  implements FaydaVerificationProvider
{
  readonly mode = 'manual' as const;

  async start() {
    return {
      verificationMethod: 'fin_plus_manual_review',
      verificationStatus: 'pending_verification',
      verificationReference: `MANUAL-START-${Date.now()}`,
    };
  }

  async submitFin() {
    return {
      verificationMethod: 'fin_plus_manual_review',
      verificationStatus: 'pending_verification',
      verificationReference: `MANUAL-FIN-${Date.now()}`,
    };
  }

  async uploadQr() {
    return {
      verificationMethod: 'app_qr_capture_manual_review',
      verificationStatus: 'qr_uploaded',
      verificationReference: `MANUAL-QR-${Date.now()}`,
    };
  }

  async verify() {
    return {
      verificationMethod: 'fin_plus_manual_review',
      verificationStatus: 'manual_review_required',
      verificationReference: `MANUAL-VERIFY-${Date.now()}`,
      failureReason:
        'Submitted for manual verification. Do not treat this as official Fayda validation.',
    };
  }
}
