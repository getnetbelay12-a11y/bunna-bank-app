import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';
import { MemberListResult, MemberProfile } from './interfaces';
import { MembersRepository } from './members.repository';
export declare class MembersService {
    private readonly membersRepository;
    private readonly auditService;
    private readonly memberProfilesService;
    constructor(membersRepository: MembersRepository, auditService: AuditService, memberProfilesService: MemberProfilesService);
    getMyProfile(currentUser: AuthenticatedUser): Promise<MemberProfile>;
    updateMyProfile(currentUser: AuthenticatedUser, dto: UpdateMyProfileDto): Promise<MemberProfile>;
    getMemberById(currentUser: AuthenticatedUser, memberId: string): Promise<MemberProfile>;
    createMember(currentUser: AuthenticatedUser, dto: CreateMemberDto): Promise<MemberProfile>;
    listMembers(currentUser: AuthenticatedUser, query: ListMembersQueryDto): Promise<MemberListResult>;
    private ensureMemberPrincipal;
    private ensureStaffAccess;
}
