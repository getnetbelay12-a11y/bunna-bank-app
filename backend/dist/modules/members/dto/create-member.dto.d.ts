import { MemberType, UserRole } from '../../../common/enums';
export declare class CreateMemberDto {
    memberNumber: string;
    memberType: MemberType;
    role: UserRole;
    fullName: string;
    phone: string;
    email?: string;
    branchId: string;
    districtId: string;
    shareBalance: number;
    password: string;
}
