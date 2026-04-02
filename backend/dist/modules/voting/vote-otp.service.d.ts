import { VoteOtpVerificationPort } from './vote-otp.port';
export declare class VoteOtpService implements VoteOtpVerificationPort {
    verify(_memberId: string, _otpCode?: string): Promise<Date>;
}
