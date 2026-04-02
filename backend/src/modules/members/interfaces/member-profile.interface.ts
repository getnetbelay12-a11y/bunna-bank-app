import { MemberType, UserRole } from '../../../common/enums';

export interface MemberProfile {
  id: string;
  customerId?: string;
  memberNumber: string;
  memberType: MemberType;
  role: UserRole;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  branchId: string;
  branchName?: string;
  districtId: string;
  districtName?: string;
  shareBalance: number;
  membershipStatus?: string;
  identityVerificationStatus?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
