import { MemberType, UserRole } from '../../../common/enums';

export interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  customerId?: string;
  identifier?: string;
  email?: string;
  memberType?: MemberType;
  fullName?: string;
  phone?: string;
  staffId?: string;
  memberId?: string;
  branchId?: string;
  branchName?: string;
  districtId?: string;
  districtName?: string;
  schoolId?: string;
  schoolName?: string;
  permissions?: string[];
}
