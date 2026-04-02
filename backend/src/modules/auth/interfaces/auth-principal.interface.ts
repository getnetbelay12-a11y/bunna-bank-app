import { MemberType, UserRole } from '../../../common/enums';

export interface AuthPrincipal {
  id: string;
  role: UserRole;
  passwordHash: string;
  identifier?: string;
  email?: string;
  customerId?: string;
  memberType?: MemberType;
  fullName?: string;
  memberNumber?: string;
  staffNumber?: string;
  phone?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  districtName?: string;
}
