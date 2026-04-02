export interface VoteOtpVerificationPort {
  verify(memberId: string, otpCode?: string): Promise<Date>;
}

export const VOTE_OTP_PORT = Symbol('VOTE_OTP_PORT');
