import { AuthenticatedUser } from '../auth/interfaces';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';
import { MembersService } from './members.service';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    getMyProfile(currentUser: AuthenticatedUser): Promise<import("./interfaces").MemberProfile>;
    updateMyProfile(currentUser: AuthenticatedUser, dto: UpdateMyProfileDto): Promise<import("./interfaces").MemberProfile>;
    getMemberById(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").MemberProfile>;
    createMember(currentUser: AuthenticatedUser, dto: CreateMemberDto): Promise<import("./interfaces").MemberProfile>;
    listMembers(currentUser: AuthenticatedUser, query: ListMembersQueryDto): Promise<import("./interfaces").MemberListResult>;
}
