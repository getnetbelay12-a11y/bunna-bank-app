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
  telegramChatId?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramSubscribed?: boolean;
  telegramLinkedAt?: Date;
  telegramLastMessageAt?: Date;
  optInLoanReminders?: boolean;
  optInInsuranceReminders?: boolean;
  branchId: string;
  branchName?: string;
  districtId: string;
  districtName?: string;
  shareBalance: number;
  membershipStatus?: string;
  identityVerificationStatus?: string;
  onboardingReviewStatus?: string;
  onboardingReviewNote?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
