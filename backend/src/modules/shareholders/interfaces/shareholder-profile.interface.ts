export interface ShareholderProfile {
  _id: string;
  memberNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  branchId: string;
  districtId: string;
  shareBalance: number;
  isActive: boolean;
  memberType: 'shareholder';
  role: 'shareholder_member';
  createdAt?: Date;
  updatedAt?: Date;
}
