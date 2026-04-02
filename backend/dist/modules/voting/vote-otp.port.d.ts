export interface VoteOtpVerificationPort {
    verify(memberId: string, otpCode?: string): Promise<Date>;
}
export declare const VOTE_OTP_PORT: unique symbol;
