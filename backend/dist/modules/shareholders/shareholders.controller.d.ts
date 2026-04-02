import { AuthenticatedUser } from '../auth/interfaces';
import { ShareholdersService } from './shareholders.service';
export declare class ShareholdersController {
    private readonly shareholdersService;
    constructor(shareholdersService: ShareholdersService);
    getMyShareholderProfile(currentUser: AuthenticatedUser): Promise<import("./interfaces").ShareholderProfile>;
    getMyVotingEligibility(currentUser: AuthenticatedUser): Promise<import("./interfaces").ShareholderEligibility>;
    getShareholderById(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").ShareholderProfile>;
    getVotingEligibilityByMemberId(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").ShareholderEligibility>;
}
