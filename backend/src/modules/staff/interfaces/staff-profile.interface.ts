import { UserRole } from '../../../common/enums';

export interface StaffProfile {
  _id: string;
  staffNumber: string;
  fullName: string;
  identifier: string;
  phone: string;
  email?: string;
  role: UserRole;
  branchId?: string;
  districtId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
