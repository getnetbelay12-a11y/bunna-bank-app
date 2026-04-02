import { MemberType, UserRole } from '../../../common/enums';
export interface AuthenticatedUser {
    sub: string;
    role: UserRole;
    memberType?: MemberType;
    fullName?: string;
    phone?: string;
    staffId?: string;
    memberId?: string;
    branchId?: string;
    branchName?: string;
    districtId?: string;
    districtName?: string;
}
