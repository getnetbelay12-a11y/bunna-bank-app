import { Injectable } from '@nestjs/common';

import { VoteOtpVerificationPort } from './vote-otp.port';

@Injectable()
export class VoteOtpService implements VoteOtpVerificationPort {
  async verify(_memberId: string, _otpCode?: string): Promise<Date> {
    return new Date();
  }
}
