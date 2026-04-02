import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberDocument } from '../members/schemas/member.schema';
import { ShareholderEligibility, ShareholderProfile } from './interfaces';
export declare class ShareholdersService {
    private readonly memberModel;
    constructor(memberModel: Model<MemberDocument>);
    getMyShareholderProfile(currentUser: AuthenticatedUser): Promise<ShareholderProfile>;
    getMyVotingEligibility(currentUser: AuthenticatedUser): Promise<ShareholderEligibility>;
    getShareholderById(currentUser: AuthenticatedUser, memberId: string): Promise<ShareholderProfile>;
    getVotingEligibilityByMemberId(currentUser: AuthenticatedUser, memberId: string): Promise<ShareholderEligibility>;
    private findShareholderById;
    private buildEligibility;
    private ensureShareholderPrincipal;
    private ensureStaffAccess;
}
