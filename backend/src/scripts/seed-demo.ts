import 'reflect-metadata';

import 'dotenv/config';
import { createHash } from 'crypto';
import mongoose, { Model, Types } from 'mongoose';

import {
  LoanStatus,
  LoanWorkflowLevel,
  MemberType,
  NotificationStatus,
  NotificationType,
  PaymentType,
  UserRole,
  VoteStatus,
} from '../common/enums';
import {
  IdentityVerification,
  IdentityVerificationSchema,
} from '../modules/identity-verification/schemas/identity-verification.schema';
import {
  InsurancePolicy,
  InsurancePolicySchema,
} from '../modules/insurance/schemas/insurance-policy.schema';
import {
  MemberProfileEntity,
  MemberProfileSchema,
} from '../modules/member-profiles/schemas/member-profile.schema';
import { District, DistrictSchema } from '../modules/members/schemas/district.schema';
import { Branch, BranchSchema } from '../modules/members/schemas/branch.schema';
import { Member, MemberSchema } from '../modules/members/schemas/member.schema';
import { Staff, StaffSchema } from '../modules/staff/schemas/staff.schema';
import { deriveStaffPermissions } from '../modules/staff/staff-permissions';
import {
  SavingsAccount,
  SavingsAccountSchema,
} from '../modules/savings/schemas/savings-account.schema';
import {
  Transaction,
  TransactionSchema,
} from '../modules/payments/schemas/transaction.schema';
import {
  SchoolPayment,
  SchoolPaymentSchema,
} from '../modules/payments/schemas/school-payment.schema';
import { Loan, LoanSchema } from '../modules/loans/schemas/loan.schema';
import {
  Notification,
  NotificationSchema,
} from '../modules/notifications/schemas/notification.schema';
import {
  NotificationCampaign,
  NotificationCampaignSchema,
} from '../modules/notifications/schemas/notification-campaign.schema';
import {
  NotificationLog,
  NotificationLogSchema,
} from '../modules/notifications/schemas/notification-log.schema';
import { Vote, VoteSchema } from '../modules/voting/schemas/vote.schema';
import {
  VoteOption,
  VoteOptionSchema,
} from '../modules/voting/schemas/vote-option.schema';
import {
  VoteResponse,
  VoteResponseSchema,
} from '../modules/voting/schemas/vote-response.schema';
import {
  ChatConversation,
  ChatConversationSchema,
} from '../modules/chat/schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageSchema } from '../modules/chat/schemas/chat-message.schema';
import {
  ChatAssignment,
  ChatAssignmentSchema,
} from '../modules/chat/schemas/chat-assignment.schema';
import {
  Recommendation,
  RecommendationSchema,
} from '../modules/recommendations/schemas/recommendation.schema';
import {
  RecommendationEvent,
  RecommendationEventSchema,
} from '../modules/recommendations/schemas/recommendation-event.schema';
import {
  AtmCardRequest,
  AtmCardRequestSchema,
} from '../modules/service-placeholders/schemas/atm-card-request.schema';
import {
  AutopaySetting,
  AutopaySettingSchema,
} from '../modules/service-placeholders/schemas/autopay-setting.schema';
import {
  ServiceRequest,
  ServiceRequestSchema,
} from '../modules/service-requests/schemas/service-request.schema';
import {
  ServiceRequestEvent,
  ServiceRequestEventSchema,
} from '../modules/service-requests/schemas/service-request-event.schema';
import {
  ServiceRequestStatus,
  ServiceRequestType,
} from '../modules/service-requests/service-request.types';
import {
  Card,
  CardSchema,
} from '../modules/card-management/schemas/card.schema';
import {
  CardRequest,
  CardRequestSchema,
} from '../modules/card-management/schemas/card-request.schema';
import {
  CardEvent,
  CardEventSchema,
} from '../modules/card-management/schemas/card-event.schema';
import {
  CardRequestStatus,
  CardRequestType,
  CardStatus,
} from '../modules/card-management/card-management.types';
import {
  BranchPerformanceDaily,
  BranchPerformanceDailySchema,
} from '../modules/staff-activity/schemas/branch-performance-daily.schema';
import {
  DistrictPerformanceDaily,
  DistrictPerformanceDailySchema,
} from '../modules/staff-activity/schemas/district-performance-daily.schema';
import {
  StaffPerformanceDaily,
  StaffPerformanceDailySchema,
} from '../modules/staff-activity/schemas/staff-performance-daily.schema';
import {
  StaffPerformanceWeekly,
  StaffPerformanceWeeklySchema,
} from '../modules/staff-activity/schemas/staff-performance-weekly.schema';
import {
  StaffPerformanceMonthly,
  StaffPerformanceMonthlySchema,
} from '../modules/staff-activity/schemas/staff-performance-monthly.schema';
import {
  StaffPerformanceYearly,
  StaffPerformanceYearlySchema,
} from '../modules/staff-activity/schemas/staff-performance-yearly.schema';
import { AuditLog, AuditLogSchema } from '../modules/audit/schemas/audit-log.schema';

async function run() {
  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/bunna_bank_app';
  const demoNow = new Date();
  const schoolPaymentDueAnchor = new Date(
    demoNow.getTime() - 29 * 24 * 60 * 60 * 1000,
  );

  await mongoose.connect(mongoUri);

  const DistrictModel = createModel(District.name, DistrictSchema);
  const BranchModel = createModel(Branch.name, BranchSchema);
  const MemberModel = createModel(Member.name, MemberSchema);
  const MemberProfileModel = createModel(
    MemberProfileEntity.name,
    MemberProfileSchema,
  );
  const IdentityVerificationModel = createModel(
    IdentityVerification.name,
    IdentityVerificationSchema,
  );
  const StaffModel = createModel(Staff.name, StaffSchema);
  const SavingsAccountModel = createModel(SavingsAccount.name, SavingsAccountSchema);
  const TransactionModel = createModel(Transaction.name, TransactionSchema);
  const SchoolPaymentModel = createModel(SchoolPayment.name, SchoolPaymentSchema);
  const LoanModel = createModel(Loan.name, LoanSchema);
  const InsurancePolicyModel = createModel(
    InsurancePolicy.name,
    InsurancePolicySchema,
  );
  const AutopaySettingModel = createModel(
    AutopaySetting.name,
    AutopaySettingSchema,
  );
  const AtmCardRequestModel = createModel(
    AtmCardRequest.name,
    AtmCardRequestSchema,
  );
  const ServiceRequestModel = createModel(
    ServiceRequest.name,
    ServiceRequestSchema,
  );
  const ServiceRequestEventModel = createModel(
    ServiceRequestEvent.name,
    ServiceRequestEventSchema,
  );
  const CardModel = createModel(Card.name, CardSchema);
  const CardRequestModel = createModel(CardRequest.name, CardRequestSchema);
  const CardEventModel = createModel(CardEvent.name, CardEventSchema);
  const NotificationModel = createModel(Notification.name, NotificationSchema);
  const NotificationCampaignModel = createModel(
    NotificationCampaign.name,
    NotificationCampaignSchema,
  );
  const NotificationLogModel = createModel(
    NotificationLog.name,
    NotificationLogSchema,
  );
  const VoteModel = createModel(Vote.name, VoteSchema);
  const VoteOptionModel = createModel(VoteOption.name, VoteOptionSchema);
  const VoteResponseModel = createModel(VoteResponse.name, VoteResponseSchema);
  const ChatConversationModel = createModel(
    ChatConversation.name,
    ChatConversationSchema,
  );
  const ChatMessageModel = createModel(ChatMessage.name, ChatMessageSchema);
  const ChatAssignmentModel = createModel(
    ChatAssignment.name,
    ChatAssignmentSchema,
  );
  const StaffPerformanceDailyModel = createModel(
    StaffPerformanceDaily.name,
    StaffPerformanceDailySchema,
  );
  const StaffPerformanceWeeklyModel = createModel(
    StaffPerformanceWeekly.name,
    StaffPerformanceWeeklySchema,
  );
  const StaffPerformanceMonthlyModel = createModel(
    StaffPerformanceMonthly.name,
    StaffPerformanceMonthlySchema,
  );
  const StaffPerformanceYearlyModel = createModel(
    StaffPerformanceYearly.name,
    StaffPerformanceYearlySchema,
  );
  const BranchPerformanceDailyModel = createModel(
    BranchPerformanceDaily.name,
    BranchPerformanceDailySchema,
  );
  const DistrictPerformanceDailyModel = createModel(
    DistrictPerformanceDaily.name,
    DistrictPerformanceDailySchema,
  );
  const RecommendationModel = createModel(
    Recommendation.name,
    RecommendationSchema,
  );
  const RecommendationEventModel = createModel(
    RecommendationEvent.name,
    RecommendationEventSchema,
  );
  const AuditLogModel = createModel(AuditLog.name, AuditLogSchema);

  await Promise.all([
    RecommendationEventModel.deleteMany({}),
    RecommendationModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    DistrictPerformanceDailyModel.deleteMany({}),
    BranchPerformanceDailyModel.deleteMany({}),
    StaffPerformanceYearlyModel.deleteMany({}),
    StaffPerformanceMonthlyModel.deleteMany({}),
    StaffPerformanceWeeklyModel.deleteMany({}),
    StaffPerformanceDailyModel.deleteMany({}),
    ChatAssignmentModel.deleteMany({}),
    ChatMessageModel.deleteMany({}),
    ChatConversationModel.deleteMany({}),
    CardEventModel.deleteMany({}),
    CardRequestModel.deleteMany({}),
    CardModel.deleteMany({}),
    ServiceRequestEventModel.deleteMany({}),
    ServiceRequestModel.deleteMany({}),
    VoteOptionModel.deleteMany({}),
    VoteModel.deleteMany({}),
    VoteResponseModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    NotificationLogModel.deleteMany({}),
    NotificationCampaignModel.deleteMany({}),
    AtmCardRequestModel.deleteMany({}),
    AutopaySettingModel.deleteMany({}),
    InsurancePolicyModel.deleteMany({}),
    SchoolPaymentModel.deleteMany({}),
    TransactionModel.deleteMany({}),
    SavingsAccountModel.deleteMany({}),
    IdentityVerificationModel.deleteMany({}),
    MemberProfileModel.deleteMany({}),
    LoanModel.deleteMany({}),
    StaffModel.deleteMany({}),
    MemberModel.deleteMany({}),
    BranchModel.deleteMany({}),
    DistrictModel.deleteMany({}),
  ]);

  const bahirDarDistrictId = new Types.ObjectId();
  const gondarDistrictId = new Types.ObjectId();
  const woldiaDistrictId = new Types.ObjectId();
  const jimmaDistrictId = new Types.ObjectId();
  const mekeleDistrictId = new Types.ObjectId();

  await DistrictModel.insertMany([
    {
      _id: bahirDarDistrictId,
      code: 'DIST-BDR',
      name: 'Bahir Dar District',
      isActive: true,
    },
    {
      _id: gondarDistrictId,
      code: 'DIST-GDR',
      name: 'Gondar District',
      isActive: true,
    },
    {
      _id: woldiaDistrictId,
      code: 'DIST-WLD',
      name: 'Woldia District',
      isActive: true,
    },
    {
      _id: jimmaDistrictId,
      code: 'DIST-JIM',
      name: 'Jimma District',
      isActive: true,
    },
    {
      _id: mekeleDistrictId,
      code: 'DIST-MEK',
      name: 'Mekele District',
      isActive: true,
    },
  ]);

  const bahirDarBranchId = new Types.ObjectId();
  const gondarBranchId = new Types.ObjectId();
  const debreMarkosBranchId = new Types.ObjectId();
  const dessieBranchId = new Types.ObjectId();
  const jimmaBranchId = new Types.ObjectId();
  const mekeleBranchId = new Types.ObjectId();

  await BranchModel.insertMany([
    {
      _id: bahirDarBranchId,
      code: 'BR-BDR-01',
      name: 'Bahir Dar Branch',
      districtId: bahirDarDistrictId,
      city: 'Bahir Dar',
      isActive: true,
    },
    {
      _id: gondarBranchId,
      code: 'BR-GDR-01',
      name: 'Gondar Branch',
      districtId: gondarDistrictId,
      city: 'Gondar',
      isActive: true,
    },
    {
      _id: debreMarkosBranchId,
      code: 'BR-DMK-01',
      name: 'Debre Markos Branch',
      districtId: bahirDarDistrictId,
      city: 'Debre Markos',
      isActive: true,
    },
    {
      _id: dessieBranchId,
      code: 'BR-DS-01',
      name: 'Dessie Branch',
      districtId: woldiaDistrictId,
      city: 'Dessie',
      isActive: true,
    },
    {
      _id: jimmaBranchId,
      code: 'BR-JIM-01',
      name: 'Jimma Branch',
      districtId: jimmaDistrictId,
      city: 'Jimma',
      isActive: true,
    },
    {
      _id: mekeleBranchId,
      code: 'BR-MEK-01',
      name: 'Mekele Branch',
      districtId: mekeleDistrictId,
      city: 'Mekele',
      isActive: true,
    },
  ]);

  const adminStaffId = new Types.ObjectId();
  const headOfficeManagerId = new Types.ObjectId();
  const branchLoanOfficerId = new Types.ObjectId();
  const districtLoanOfficerId = new Types.ObjectId();
  const districtStaffId = new Types.ObjectId();
  const branchStaffId = new Types.ObjectId();
  const supportAgentId = new Types.ObjectId();
  const branchOperationsOfficerId = new Types.ObjectId();
  const branchKycOfficerId = new Types.ObjectId();
  const debreMarkosOfficerId = new Types.ObjectId();
  const dessieOfficerId = new Types.ObjectId();

  await StaffModel.insertMany([
    {
      _id: adminStaffId,
      staffNumber: 'STF-2001',
      fullName: 'Lulit Mekonnen',
      identifier: 'admin.head-office@bunnabank.com',
      phone: '0911001001',
      email: 'admin.head-office@bunnabank.com',
      role: UserRole.ADMIN,
      permissions: deriveStaffPermissions(UserRole.ADMIN),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: headOfficeManagerId,
      staffNumber: 'STF-2007',
      fullName: 'Aster Mengistu',
      identifier: 'manager.head-office@bunnabank.com',
      phone: '0911001007',
      email: 'manager.head-office@bunnabank.com',
      role: UserRole.HEAD_OFFICE_MANAGER,
      permissions: deriveStaffPermissions(UserRole.HEAD_OFFICE_MANAGER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: districtStaffId,
      staffNumber: 'STF-2004',
      fullName: 'Mulugeta Tadesse',
      identifier: 'manager.north-district@bunnabank.com',
      phone: '0911001002',
      email: 'manager.north-district@bunnabank.com',
      role: UserRole.DISTRICT_MANAGER,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.DISTRICT_MANAGER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: branchStaffId,
      staffNumber: 'STF-2005',
      fullName: 'Hana Worku',
      identifier: 'manager.bahirdar-branch@bunnabank.com',
      phone: '0911001003',
      email: 'manager.bahirdar-branch@bunnabank.com',
      role: UserRole.BRANCH_MANAGER,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.BRANCH_MANAGER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: supportAgentId,
      staffNumber: 'STF-2006',
      fullName: 'Rahel Desta',
      identifier: 'agent.support@bunnabank.com',
      phone: '0911001006',
      email: 'agent.support@bunnabank.com',
      role: UserRole.SUPPORT_AGENT,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.SUPPORT_AGENT),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: branchLoanOfficerId,
      staffNumber: 'STF-2002',
      fullName: 'Getachew Molla',
      identifier: 'getachew.loan',
      phone: '0911001004',
      email: 'getachew@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: branchOperationsOfficerId,
      staffNumber: 'STF-2008',
      fullName: 'Saron Tefera',
      identifier: 'saron.operations',
      phone: '0911001008',
      email: 'saron@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: branchKycOfficerId,
      staffNumber: 'STF-2009',
      fullName: 'Selam Fekadu',
      identifier: 'selam.kyc',
      phone: '0911001009',
      email: 'selam@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: districtLoanOfficerId,
      staffNumber: 'STF-2003',
      fullName: 'Tigist Yimer',
      identifier: 'tigist.loan',
      phone: '0911001005',
      email: 'tigist@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: gondarBranchId,
      districtId: gondarDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: debreMarkosOfficerId,
      staffNumber: 'STF-2010',
      fullName: 'Bereket Alemayehu',
      identifier: 'bereket.operations',
      phone: '0911001010',
      email: 'bereket@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
    {
      _id: dessieOfficerId,
      staffNumber: 'STF-2011',
      fullName: 'Fitsum Mebrahtu',
      identifier: 'fitsum.dessie',
      phone: '0911001011',
      email: 'fitsum@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      permissions: deriveStaffPermissions(UserRole.LOAN_OFFICER),
      passwordHash: 'demo-pass',
      isActive: true,
    },
  ]);

  const shareholderMemberId = new Types.ObjectId();
  const secondShareholderMemberId = new Types.ObjectId();
  const regularMemberId = new Types.ObjectId();
  const secondRegularMemberId = new Types.ObjectId();
  const thirdRegularMemberId = new Types.ObjectId();
  const fourthRegularMemberId = new Types.ObjectId();
  const fifthRegularMemberId = new Types.ObjectId();
  const sixthRegularMemberId = new Types.ObjectId();
  const regularMemberProfileId = new Types.ObjectId();
  const fifthRegularMemberProfileId = new Types.ObjectId();

  await MemberModel.insertMany([
    {
      _id: shareholderMemberId,
      customerId: 'BUN-100001',
      memberNumber: 'BUN-100001',
      memberType: MemberType.SHAREHOLDER,
      role: UserRole.SHAREHOLDER_MEMBER,
      fullName: 'Getnet Belay',
      firstName: 'Getnet',
      lastName: 'Belay',
      phone: '0911000001',
      email: 'getnet@bunna-bank.local',
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 250000,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: secondShareholderMemberId,
      customerId: 'BUN-100002',
      memberNumber: 'BUN-100002',
      memberType: MemberType.SHAREHOLDER,
      role: UserRole.SHAREHOLDER_MEMBER,
      fullName: 'Tirunesh Bekele',
      firstName: 'Tirunesh',
      lastName: 'Bekele',
      phone: '0911000002',
      email: 'tirunesh@bunna-bank.local',
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 180000,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: regularMemberId,
      customerId: 'BUN-100003',
      memberNumber: 'BUN-100003',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Meseret Alemu',
      firstName: 'Meseret',
      lastName: 'Alemu',
      phone: '0911000003',
      email: 'meseret@bunna-bank.local',
      branchId: gondarBranchId,
      districtId: gondarDistrictId,
      shareBalance: 0,
      kycStatus: 'pending_review',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: secondRegularMemberId,
      customerId: 'BUN-100004',
      memberNumber: 'BUN-100004',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Yohannes Worku',
      firstName: 'Yohannes',
      lastName: 'Worku',
      phone: '0911000004',
      email: 'yohannes@bunna-bank.local',
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 0,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: thirdRegularMemberId,
      customerId: 'BUN-100005',
      memberNumber: 'BUN-100005',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Lulit Haile',
      firstName: 'Lulit',
      lastName: 'Haile',
      phone: '0911000005',
      email: 'lulit@bunna-bank.local',
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 0,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: fourthRegularMemberId,
      customerId: 'BUN-100006',
      memberNumber: 'BUN-100006',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Martha Teshome',
      firstName: 'Martha',
      lastName: 'Teshome',
      phone: '0911000006',
      email: 'martha@bunna-bank.local',
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 0,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: fifthRegularMemberId,
      customerId: 'BUN-100007',
      memberNumber: 'BUN-100007',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Biniam Asmare',
      firstName: 'Biniam',
      lastName: 'Asmare',
      phone: '0911000007',
      email: 'biniam@bunna-bank.local',
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      shareBalance: 0,
      kycStatus: 'needs_action',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
    {
      _id: sixthRegularMemberId,
      customerId: 'BUN-100008',
      memberNumber: 'BUN-100008',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'Hiwot Assefa',
      firstName: 'Hiwot',
      lastName: 'Assefa',
      phone: '0911000008',
      email: 'hiwot@bunna-bank.local',
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      shareBalance: 0,
      kycStatus: 'verified',
      passwordHash: 'demo-pass',
      pinHash: hashSecret('1234'),
      isActive: true,
    },
  ]);

  await MemberProfileModel.insertMany([
    {
      _id: new Types.ObjectId(),
      memberId: shareholderMemberId,
      dateOfBirth: new Date('1985-08-10T00:00:00.000Z'),
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondShareholderMemberId,
      dateOfBirth: new Date('1988-06-04T00:00:00.000Z'),
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
    {
      _id: regularMemberProfileId,
      memberId: regularMemberId,
      dateOfBirth: new Date('1992-02-14T00:00:00.000Z'),
      branchId: gondarBranchId,
      districtId: gondarDistrictId,
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'pending_review',
      onboardingReviewStatus: 'review_in_progress',
      onboardingReviewNote: 'District reviewer is validating Fayda back image before approval.',
      consentAccepted: true,
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondRegularMemberId,
      dateOfBirth: new Date('1990-10-11T00:00:00.000Z'),
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
    {
      _id: new Types.ObjectId(),
      memberId: thirdRegularMemberId,
      dateOfBirth: new Date('1996-01-29T00:00:00.000Z'),
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
    {
      _id: new Types.ObjectId(),
      memberId: fourthRegularMemberId,
      dateOfBirth: new Date('1994-11-08T00:00:00.000Z'),
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
    {
      _id: fifthRegularMemberProfileId,
      memberId: fifthRegularMemberId,
      dateOfBirth: new Date('1998-07-03T00:00:00.000Z'),
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'needs_action',
      onboardingReviewStatus: 'needs_action',
      onboardingReviewNote: 'Re-upload clearer Fayda front image and latest branch reference letter.',
      consentAccepted: true,
    },
    {
      _id: new Types.ObjectId(),
      memberId: sixthRegularMemberId,
      dateOfBirth: new Date('1993-04-19T00:00:00.000Z'),
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      consentAccepted: true,
    },
  ]);

  await IdentityVerificationModel.insertMany([
    {
      _id: new Types.ObjectId(),
      memberId: shareholderMemberId,
      phoneNumber: '0911000001',
      faydaFin: 'FIN-1001',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-01-09T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondShareholderMemberId,
      phoneNumber: '0911000002',
      faydaFin: 'FIN-1002',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-01-15T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: regularMemberId,
      phoneNumber: '0911000003',
      verificationMethod: 'fayda',
      verificationStatus: 'pending_review',
      failureReason: 'Document mismatch under review',
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondRegularMemberId,
      phoneNumber: '0911000004',
      faydaFin: 'FIN-1004',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-02-05T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: thirdRegularMemberId,
      phoneNumber: '0911000005',
      faydaFin: 'FIN-1005',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-02-20T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: fourthRegularMemberId,
      phoneNumber: '0911000006',
      faydaFin: 'FIN-1006',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-02-22T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: fifthRegularMemberId,
      phoneNumber: '0911000007',
      verificationMethod: 'fayda',
      verificationStatus: 'pending_review',
      failureReason: 'Front image blur detected and branch reference is still pending.',
    },
    {
      _id: new Types.ObjectId(),
      memberId: sixthRegularMemberId,
      phoneNumber: '0911000008',
      faydaFin: 'FIN-1008',
      verificationMethod: 'fayda',
      verificationStatus: 'verified',
      verifiedAt: new Date('2026-02-24T10:00:00.000Z'),
    },
  ]);

  const shareholderSavingsId = new Types.ObjectId();
  const secondShareholderSavingsId = new Types.ObjectId();
  const regularSavingsId = new Types.ObjectId();
  const secondRegularSavingsId = new Types.ObjectId();
  const thirdRegularSavingsId = new Types.ObjectId();
  const fourthRegularSavingsId = new Types.ObjectId();
  const fifthRegularSavingsId = new Types.ObjectId();
  const sixthRegularSavingsId = new Types.ObjectId();

  await SavingsAccountModel.insertMany([
    {
      _id: shareholderSavingsId,
      accountNumber: '10023489',
      memberId: shareholderMemberId,
      branchId: bahirDarBranchId,
      balance: 186400,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: secondShareholderSavingsId,
      accountNumber: '10023999',
      memberId: secondShareholderMemberId,
      branchId: debreMarkosBranchId,
      balance: 143500,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: regularSavingsId,
      accountNumber: '10024567',
      memberId: regularMemberId,
      branchId: gondarBranchId,
      balance: 74250,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: secondRegularSavingsId,
      accountNumber: '10026789',
      memberId: secondRegularMemberId,
      branchId: bahirDarBranchId,
      balance: 22500,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: thirdRegularSavingsId,
      accountNumber: '10027890',
      memberId: thirdRegularMemberId,
      branchId: debreMarkosBranchId,
      balance: 51800,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: fourthRegularSavingsId,
      accountNumber: '10028880',
      memberId: fourthRegularMemberId,
      branchId: bahirDarBranchId,
      balance: 118300,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: fifthRegularSavingsId,
      accountNumber: '10029990',
      memberId: fifthRegularMemberId,
      branchId: debreMarkosBranchId,
      balance: 36100,
      currency: 'ETB',
      isActive: true,
    },
    {
      _id: sixthRegularSavingsId,
      accountNumber: '10030008',
      memberId: sixthRegularMemberId,
      branchId: dessieBranchId,
      balance: 88400,
      currency: 'ETB',
      isActive: true,
    },
  ]);

  const schoolPaymentTransactionId = new Types.ObjectId();
  const branchBusinessLoanId = new Types.ObjectId();

  await TransactionModel.insertMany([
    {
      _id: schoolPaymentTransactionId,
      transactionReference: 'TXN-BUN-2026-001',
      memberId: shareholderMemberId,
      accountId: shareholderSavingsId,
      branchId: bahirDarBranchId,
      type: PaymentType.SCHOOL_PAYMENT,
      channel: 'mobile',
      amount: 1500,
      currency: 'ETB',
      narration: 'Term payment',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      updatedAt: new Date('2026-03-01T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-002',
      memberId: shareholderMemberId,
      accountId: shareholderSavingsId,
      branchId: bahirDarBranchId,
      type: PaymentType.DEPOSIT,
      channel: 'branch',
      amount: 12000,
      currency: 'ETB',
      narration: 'Cash deposit',
      createdAt: new Date('2026-02-24T09:00:00.000Z'),
      updatedAt: new Date('2026-02-24T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-003',
      memberId: shareholderMemberId,
      accountId: shareholderSavingsId,
      branchId: bahirDarBranchId,
      type: PaymentType.TRANSFER,
      channel: 'mobile',
      amount: 2450,
      currency: 'ETB',
      narration: 'Internal transfer',
      createdAt: new Date('2026-02-20T09:00:00.000Z'),
      updatedAt: new Date('2026-02-20T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-004',
      memberId: secondShareholderMemberId,
      accountId: secondShareholderSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.DEPOSIT,
      channel: 'mobile',
      amount: 18000,
      currency: 'ETB',
      narration: 'Salary deposit',
      createdAt: new Date('2025-12-28T09:00:00.000Z'),
      updatedAt: new Date('2025-12-28T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-005',
      memberId: secondShareholderMemberId,
      accountId: secondShareholderSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.DEPOSIT,
      channel: 'mobile',
      amount: 18000,
      currency: 'ETB',
      narration: 'Salary deposit',
      createdAt: new Date('2026-01-28T09:00:00.000Z'),
      updatedAt: new Date('2026-01-28T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-006',
      memberId: secondShareholderMemberId,
      accountId: secondShareholderSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.DEPOSIT,
      channel: 'mobile',
      amount: 17500,
      currency: 'ETB',
      narration: 'Salary deposit',
      createdAt: new Date('2026-02-28T09:00:00.000Z'),
      updatedAt: new Date('2026-02-28T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-007',
      memberId: regularMemberId,
      accountId: regularSavingsId,
      branchId: gondarBranchId,
      type: PaymentType.SCHOOL_PAYMENT,
      channel: 'branch',
      amount: 2100,
      currency: 'ETB',
      narration: 'Manual school payment',
      createdAt: new Date('2026-02-05T09:00:00.000Z'),
      updatedAt: new Date('2026-02-05T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-008',
      memberId: regularMemberId,
      accountId: regularSavingsId,
      branchId: gondarBranchId,
      type: PaymentType.SCHOOL_PAYMENT,
      channel: 'branch',
      amount: 2100,
      currency: 'ETB',
      narration: 'Manual school payment',
      createdAt: new Date('2026-03-05T09:00:00.000Z'),
      updatedAt: new Date('2026-03-05T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-009',
      memberId: secondRegularMemberId,
      accountId: secondRegularSavingsId,
      branchId: bahirDarBranchId,
      type: PaymentType.LOAN_REPAYMENT,
      channel: 'mobile',
      amount: 4200,
      currency: 'ETB',
      narration: 'Loan installment',
      createdAt: new Date('2026-01-18T09:00:00.000Z'),
      updatedAt: new Date('2026-01-18T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-010',
      memberId: secondRegularMemberId,
      accountId: secondRegularSavingsId,
      branchId: bahirDarBranchId,
      type: PaymentType.LOAN_REPAYMENT,
      channel: 'mobile',
      amount: 4200,
      currency: 'ETB',
      narration: 'Loan installment',
      createdAt: new Date('2026-02-18T09:00:00.000Z'),
      updatedAt: new Date('2026-02-18T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-011',
      memberId: thirdRegularMemberId,
      accountId: thirdRegularSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.TRANSFER,
      channel: 'branch',
      amount: 1800,
      currency: 'ETB',
      narration: 'Manual transfer',
      createdAt: new Date('2026-02-01T09:00:00.000Z'),
      updatedAt: new Date('2026-02-01T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-012',
      memberId: thirdRegularMemberId,
      accountId: thirdRegularSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.TRANSFER,
      channel: 'branch',
      amount: 2400,
      currency: 'ETB',
      narration: 'Manual transfer',
      createdAt: new Date('2026-02-14T09:00:00.000Z'),
      updatedAt: new Date('2026-02-14T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      transactionReference: 'TXN-BUN-2026-013',
      memberId: thirdRegularMemberId,
      accountId: thirdRegularSavingsId,
      branchId: debreMarkosBranchId,
      type: PaymentType.SCHOOL_PAYMENT,
      channel: 'branch',
      amount: 1500,
      currency: 'ETB',
      narration: 'Manual service payment',
      createdAt: new Date('2026-03-03T09:00:00.000Z'),
      updatedAt: new Date('2026-03-03T09:00:00.000Z'),
    },
  ]);

  await SchoolPaymentModel.create({
    transactionId: schoolPaymentTransactionId,
    memberId: shareholderMemberId,
    accountId: shareholderSavingsId,
    branchId: bahirDarBranchId,
    studentId: 'school_profile_001',
    schoolName: 'Bright Future School',
    amount: 5000,
    channel: 'mobile',
    status: 'successful',
    createdAt: schoolPaymentDueAnchor,
    updatedAt: schoolPaymentDueAnchor,
  });

  const sixthRegularLoanId = new Types.ObjectId();
  const bahirDarEscalatedConversationId = new Types.ObjectId();

  await LoanModel.insertMany([
    {
      _id: branchBusinessLoanId,
      memberId: shareholderMemberId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Business Loan',
      amount: 500000,
      interestRate: 13,
      termMonths: 24,
      purpose: 'Working capital',
      status: LoanStatus.DISTRICT_REVIEW,
      currentLevel: LoanWorkflowLevel.DISTRICT,
      assignedToStaffId: districtLoanOfficerId,
      createdAt: new Date('2026-03-02T09:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: regularMemberId,
      branchId: gondarBranchId,
      districtId: gondarDistrictId,
      loanType: 'School Expansion Loan',
      amount: 1200000,
      interestRate: 12,
      termMonths: 36,
      purpose: 'Expansion',
      status: LoanStatus.APPROVED,
      currentLevel: LoanWorkflowLevel.HEAD_OFFICE,
      assignedToStaffId: districtLoanOfficerId,
      createdAt: new Date('2026-02-10T09:00:00.000Z'),
      updatedAt: new Date('2026-02-15T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondShareholderMemberId,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Agriculture Loan',
      amount: 24000000,
      interestRate: 11,
      termMonths: 48,
      purpose: 'Farm equipment',
      status: LoanStatus.DISTRICT_REVIEW,
      currentLevel: LoanWorkflowLevel.DISTRICT,
      assignedToStaffId: districtLoanOfficerId,
      createdAt: new Date('2026-02-18T09:00:00.000Z'),
      updatedAt: new Date('2026-02-22T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondRegularMemberId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Home Improvement Loan',
      amount: 180000,
      interestRate: 12,
      termMonths: 24,
      purpose: 'Renovation',
      status: LoanStatus.CLOSED,
      currentLevel: LoanWorkflowLevel.HEAD_OFFICE,
      assignedToStaffId: branchLoanOfficerId,
      createdAt: new Date('2025-05-10T09:00:00.000Z'),
      updatedAt: new Date('2026-01-20T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: fourthRegularMemberId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Micro Business Loan',
      amount: 320000,
      interestRate: 14,
      termMonths: 18,
      purpose: 'Retail inventory',
      status: LoanStatus.DISTRICT_REVIEW,
      currentLevel: LoanWorkflowLevel.DISTRICT,
      assignedToStaffId: branchOperationsOfficerId,
      deficiencyReasons: [
        'Business license renewal receipt needs upload.',
        'Recent six-month cash-flow statement is missing.',
      ],
      createdAt: new Date('2026-03-04T09:00:00.000Z'),
      updatedAt: new Date('2026-03-06T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: thirdRegularMemberId,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Education Support Loan',
      amount: 95000,
      interestRate: 12,
      termMonths: 12,
      purpose: 'Tuition support',
      status: LoanStatus.BRANCH_REVIEW,
      currentLevel: LoanWorkflowLevel.BRANCH,
      assignedToStaffId: debreMarkosOfficerId,
      createdAt: new Date('2026-03-05T09:00:00.000Z'),
      updatedAt: new Date('2026-03-07T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondShareholderMemberId,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Commercial Expansion Loan',
      amount: 8200000,
      interestRate: 12,
      termMonths: 30,
      purpose: 'Warehouse expansion',
      status: LoanStatus.HEAD_OFFICE_REVIEW,
      currentLevel: LoanWorkflowLevel.HEAD_OFFICE,
      assignedToStaffId: headOfficeManagerId,
      deficiencyReasons: [
        'Updated collateral valuation memo is needed before final approval.',
      ],
      createdAt: new Date('2026-03-08T09:00:00.000Z'),
      updatedAt: new Date('2026-03-10T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      memberId: fifthRegularMemberId,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      loanType: 'Small Trader Loan',
      amount: 145000,
      interestRate: 13,
      termMonths: 15,
      purpose: 'Inventory bridge financing',
      status: LoanStatus.NEEDS_MORE_INFO,
      currentLevel: LoanWorkflowLevel.BRANCH,
      assignedToStaffId: debreMarkosOfficerId,
      deficiencyReasons: [
        'Upload a corrected trade license copy.',
        'Add the missing guarantor phone number.',
      ],
      createdAt: new Date('2026-03-09T09:00:00.000Z'),
      updatedAt: new Date('2026-03-11T09:00:00.000Z'),
    },
    {
      _id: sixthRegularLoanId,
      memberId: sixthRegularMemberId,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      loanType: 'Women Enterprise Loan',
      amount: 680000,
      interestRate: 12,
      termMonths: 24,
      purpose: 'Textile equipment and shop fit-out',
      status: LoanStatus.BRANCH_REVIEW,
      currentLevel: LoanWorkflowLevel.BRANCH,
      assignedToStaffId: dessieOfficerId,
      createdAt: new Date('2026-03-10T09:00:00.000Z'),
      updatedAt: new Date('2026-03-12T09:00:00.000Z'),
    },
  ]);

  await InsurancePolicyModel.insertMany([
    {
      _id: new Types.ObjectId(),
      memberId: thirdRegularMemberId,
      policyNumber: 'POL-2026-1005',
      providerName: 'Bunna Insurance',
      insuranceType: 'Motor',
      startDate: new Date('2025-03-25T00:00:00.000Z'),
      endDate: new Date('2026-03-25T00:00:00.000Z'),
      status: 'active',
      renewalReminderSent: false,
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondRegularMemberId,
      policyNumber: 'POL-2026-1004',
      providerName: 'Bunna Insurance',
      insuranceType: 'Life',
      startDate: new Date('2025-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-01T00:00:00.000Z'),
      status: 'active',
      renewalReminderSent: false,
    },
    {
      _id: new Types.ObjectId(),
      memberId: sixthRegularMemberId,
      policyNumber: 'POL-2026-1008',
      providerName: 'Bunna Insurance',
      insuranceType: 'Property',
      startDate: new Date('2025-04-18T00:00:00.000Z'),
      endDate: new Date('2026-04-18T00:00:00.000Z'),
      status: 'active',
      renewalReminderSent: false,
    },
  ]);

  const schoolAutopayId = new Types.ObjectId();
  const rentAutopayId = new Types.ObjectId();
  const electricityAutopayId = new Types.ObjectId();
  const waterAutopayId = new Types.ObjectId();

  await AutopaySettingModel.insertMany([
    {
      _id: schoolAutopayId,
      memberId: shareholderMemberId,
      serviceType: 'school_payment',
      accountId: shareholderSavingsId.toString(),
      schedule: 'monthly',
      enabled: true,
    },
    {
      _id: rentAutopayId,
      memberId: sixthRegularMemberId,
      serviceType: 'rent',
      accountId: sixthRegularSavingsId.toString(),
      schedule: 'monthly',
      enabled: false,
    },
    {
      _id: electricityAutopayId,
      memberId: thirdRegularMemberId,
      serviceType: 'electricity',
      accountId: thirdRegularSavingsId.toString(),
      schedule: 'monthly',
      enabled: false,
    },
    {
      _id: waterAutopayId,
      memberId: fourthRegularMemberId,
      serviceType: 'water',
      accountId: fourthRegularSavingsId.toString(),
      schedule: 'biweekly',
      enabled: true,
    },
  ]);

  await AtmCardRequestModel.insertMany([
    {
      _id: new Types.ObjectId(),
      memberId: shareholderMemberId,
      firstName: 'Abebe',
      lastName: 'Kebede',
      phoneNumber: '0911000001',
      region: 'National',
      city: 'Bahir Dar',
      preferredBranch: 'Bahir Dar Branch',
      faydaFrontImageUrl: 'https://example.com/front-1001.png',
      faydaBackImageUrl: 'https://example.com/back-1001.png',
      pinHash: hashSecret('1234'),
      status: 'approved',
    },
    {
      _id: new Types.ObjectId(),
      memberId: secondRegularMemberId,
      firstName: 'Yohannes',
      lastName: 'Worku',
      phoneNumber: '0911000004',
      region: 'National',
      city: 'Bahir Dar',
      preferredBranch: 'Bahir Dar Branch',
      faydaFrontImageUrl: 'https://example.com/front-1004.png',
      faydaBackImageUrl: 'https://example.com/back-1004.png',
      pinHash: hashSecret('1234'),
      status: 'submitted',
    },
  ]);

  const atmCardServiceRequestId = new Types.ObjectId();
  const phoneUpdateServiceRequestId = new Types.ObjectId();
  const accountRelationshipServiceRequestId = new Types.ObjectId();
  const paymentDisputeServiceRequestId = new Types.ObjectId();
  const shareholderCardId = new Types.ObjectId();
  const shareholderReplacementRequestId = new Types.ObjectId();
  const fifthMemberCardId = new Types.ObjectId();
  const fifthMemberCardRequestId = new Types.ObjectId();

  await ServiceRequestModel.insertMany([
    {
      _id: atmCardServiceRequestId,
      memberId: shareholderMemberId,
      customerId: 'BUN-100001',
      memberName: 'Getnet Belay',
      phoneNumber: '0911000001',
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      branchName: 'Bahir Dar Branch',
      type: ServiceRequestType.ATM_CARD_REQUEST,
      title: 'ATM card request',
      description:
        'Request for ATM card issuance with branch pickup and verified identity documents.',
      payload: {
        preferredBranch: 'Bahir Dar Branch',
        cardType: 'debit',
        reason: 'New card issuance for active savings account.',
      },
      attachments: [
        'https://example.com/front-1001.png',
        'https://example.com/back-1001.png',
      ],
      status: ServiceRequestStatus.UNDER_REVIEW,
      latestNote: 'Branch team confirmed the request and is preparing card production.',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      createdAt: new Date('2026-03-09T08:40:00.000Z'),
      updatedAt: new Date('2026-03-09T09:15:00.000Z'),
    },
    {
      _id: phoneUpdateServiceRequestId,
      memberId: regularMemberId,
      customerId: 'BUN-100003',
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000003',
      branchId: gondarBranchId,
      districtId: gondarDistrictId,
      branchName: 'Gondar Branch',
      type: ServiceRequestType.PHONE_UPDATE,
      title: 'Phone number update request',
      description:
        'Member requested to replace the phone number linked to the account.',
      payload: {
        requestedPhoneNumber: '0911000099',
      },
      attachments: [
        'https://example.com/fayda-front-1003.png',
        'https://example.com/selfie-1003.png',
      ],
      status: ServiceRequestStatus.AWAITING_CUSTOMER,
      latestNote: 'Please upload a clearer selfie verification image.',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      createdAt: new Date('2026-03-09T14:20:00.000Z'),
      updatedAt: new Date('2026-03-11T08:30:00.000Z'),
    },
    {
      _id: accountRelationshipServiceRequestId,
      memberId: fourthRegularMemberId,
      customerId: 'BUN-100006',
      memberName: 'Martha Teshome',
      phoneNumber: '0911000006',
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      branchName: 'Bahir Dar Branch',
      type: ServiceRequestType.ACCOUNT_RELATIONSHIP,
      title: 'Joint account relationship request',
      description:
        'Member requested to add a spouse relationship for joint account servicing.',
      payload: {
        relationshipType: 'spouse',
        relatedMemberNumber: 'BUN-100005',
        relatedCustomerId: 'BUN-100005',
      },
      attachments: ['https://example.com/marriage-certificate-1006.pdf'],
      status: ServiceRequestStatus.UNDER_REVIEW,
      latestNote: 'Relationship evidence is under branch review.',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      createdAt: new Date('2026-03-08T10:05:00.000Z'),
      updatedAt: new Date('2026-03-10T16:10:00.000Z'),
    },
    {
      _id: paymentDisputeServiceRequestId,
      memberId: sixthRegularMemberId,
      customerId: 'BUN-100008',
      memberName: 'Mekdes Alemu',
      phoneNumber: '0911000008',
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      branchName: 'Dessie Branch',
      type: ServiceRequestType.PAYMENT_DISPUTE,
      title: 'Payment dispute for SCH-2026-014',
      description:
        'Member reported a duplicated school fee payment and requested reversal review.',
      payload: {
        transactionReference: 'SCH-2026-014',
        amount: 3500,
        counterparty: 'Bahir Dar Academy',
        occurredAt: '2026-03-12 10:55',
      },
      attachments: [],
      status: ServiceRequestStatus.AWAITING_CUSTOMER,
      latestNote: 'Please upload the payment receipt screenshot to continue the review.',
      assignedToStaffId: dessieOfficerId,
      assignedToStaffName: 'Fitsum Mebrahtu',
      createdAt: new Date('2026-03-12T10:55:00.000Z'),
      updatedAt: new Date('2026-03-12T11:20:00.000Z'),
    },
  ]);

  await ServiceRequestEventModel.insertMany([
    {
      _id: new Types.ObjectId(),
      serviceRequestId: atmCardServiceRequestId,
      actorType: 'member',
      actorId: shareholderMemberId.toString(),
      actorName: 'Getnet Belay',
      eventType: 'created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Request submitted by customer.',
      createdAt: new Date('2026-03-09T08:40:00.000Z'),
      updatedAt: new Date('2026-03-09T08:40:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: atmCardServiceRequestId,
      actorType: 'staff',
      actorId: supportAgentId.toString(),
      actorName: 'Rahel Desta',
      eventType: 'status_updated',
      fromStatus: ServiceRequestStatus.SUBMITTED,
      toStatus: ServiceRequestStatus.UNDER_REVIEW,
      note: 'Branch team confirmed the request and is preparing card production.',
      createdAt: new Date('2026-03-09T09:15:00.000Z'),
      updatedAt: new Date('2026-03-09T09:15:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: phoneUpdateServiceRequestId,
      actorType: 'member',
      actorId: regularMemberId.toString(),
      actorName: 'Meseret Alemu',
      eventType: 'created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Request submitted by customer.',
      createdAt: new Date('2026-03-09T14:20:00.000Z'),
      updatedAt: new Date('2026-03-09T14:20:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: phoneUpdateServiceRequestId,
      actorType: 'staff',
      actorId: supportAgentId.toString(),
      actorName: 'Rahel Desta',
      eventType: 'status_updated',
      fromStatus: ServiceRequestStatus.SUBMITTED,
      toStatus: ServiceRequestStatus.AWAITING_CUSTOMER,
      note: 'Please upload a clearer selfie verification image.',
      createdAt: new Date('2026-03-11T08:30:00.000Z'),
      updatedAt: new Date('2026-03-11T08:30:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: accountRelationshipServiceRequestId,
      actorType: 'member',
      actorId: fourthRegularMemberId.toString(),
      actorName: 'Martha Teshome',
      eventType: 'created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Request submitted by customer.',
      createdAt: new Date('2026-03-08T10:05:00.000Z'),
      updatedAt: new Date('2026-03-08T10:05:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: accountRelationshipServiceRequestId,
      actorType: 'staff',
      actorId: supportAgentId.toString(),
      actorName: 'Rahel Desta',
      eventType: 'status_updated',
      fromStatus: ServiceRequestStatus.SUBMITTED,
      toStatus: ServiceRequestStatus.UNDER_REVIEW,
      note: 'Relationship evidence is under branch review.',
      createdAt: new Date('2026-03-10T16:10:00.000Z'),
      updatedAt: new Date('2026-03-10T16:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: paymentDisputeServiceRequestId,
      actorType: 'member',
      actorId: sixthRegularMemberId.toString(),
      actorName: 'Mekdes Alemu',
      eventType: 'created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Request submitted by customer.',
      createdAt: new Date('2026-03-12T10:55:00.000Z'),
      updatedAt: new Date('2026-03-12T10:55:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      serviceRequestId: paymentDisputeServiceRequestId,
      actorType: 'staff',
      actorId: dessieOfficerId.toString(),
      actorName: 'Fitsum Mebrahtu',
      eventType: 'status_updated',
      fromStatus: ServiceRequestStatus.SUBMITTED,
      toStatus: ServiceRequestStatus.AWAITING_CUSTOMER,
      note: 'Please upload the payment receipt screenshot to continue the review.',
      createdAt: new Date('2026-03-12T11:20:00.000Z'),
      updatedAt: new Date('2026-03-12T11:20:00.000Z'),
    },
  ]);

  await CardModel.insertMany([
    {
      _id: shareholderCardId,
      memberId: shareholderMemberId,
      cardType: 'Debit Card',
      last4: '4821',
      status: CardStatus.ACTIVE,
      preferredBranch: 'Bahir Dar Branch',
      channelControls: {
        atm: true,
        pos: true,
        ecommerce: false,
      },
      issuedAt: new Date('2026-03-01T09:00:00.000Z'),
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      updatedAt: new Date('2026-03-12T12:10:00.000Z'),
    },
    {
      _id: fifthMemberCardId,
      memberId: fifthRegularMemberId,
      cardType: 'ATM Card',
      status: CardStatus.PENDING_ISSUE,
      preferredBranch: 'Dessie Branch',
      channelControls: {
        atm: true,
        pos: false,
        ecommerce: false,
      },
      createdAt: new Date('2026-03-12T08:55:00.000Z'),
      updatedAt: new Date('2026-03-12T09:40:00.000Z'),
    },
  ]);

  await CardRequestModel.insertMany([
    {
      _id: shareholderReplacementRequestId,
      memberId: shareholderMemberId,
      cardId: shareholderCardId,
      requestType: CardRequestType.REPLACEMENT,
      status: CardRequestStatus.COMPLETED,
      preferredBranch: 'Bahir Dar Branch',
      reason: 'Replacement card was issued and collected successfully.',
      createdAt: new Date('2026-03-10T09:00:00.000Z'),
      updatedAt: new Date('2026-03-12T12:10:00.000Z'),
    },
    {
      _id: fifthMemberCardRequestId,
      memberId: fifthRegularMemberId,
      cardId: fifthMemberCardId,
      requestType: CardRequestType.NEW_ISSUE,
      status: CardRequestStatus.UNDER_REVIEW,
      preferredBranch: 'Dessie Branch',
      reason: 'Card operations team is reviewing the new card issuance request.',
      createdAt: new Date('2026-03-12T08:55:00.000Z'),
      updatedAt: new Date('2026-03-12T09:40:00.000Z'),
    },
  ]);

  await CardEventModel.insertMany([
    {
      _id: new Types.ObjectId(),
      cardId: shareholderCardId,
      actorType: 'member',
      actorId: shareholderMemberId.toString(),
      actorName: 'Getnet Belay',
      eventType: 'replacement_requested',
      note: 'Card damaged and replacement requested by the member.',
      createdAt: new Date('2026-03-10T09:00:00.000Z'),
      updatedAt: new Date('2026-03-10T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      cardId: shareholderCardId,
      actorType: 'staff',
      actorId: supportAgentId.toString(),
      actorName: 'Rahel Desta',
      eventType: 'request_status_updated',
      note: 'Replacement card has been issued and is ready for use.',
      createdAt: new Date('2026-03-12T12:10:00.000Z'),
      updatedAt: new Date('2026-03-12T12:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      cardId: fifthMemberCardId,
      actorType: 'member',
      actorId: fifthRegularMemberId.toString(),
      actorName: 'Selamawit Molla',
      eventType: 'requested',
      note: 'New ATM card requested after onboarding approval.',
      createdAt: new Date('2026-03-12T08:55:00.000Z'),
      updatedAt: new Date('2026-03-12T08:55:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      cardId: fifthMemberCardId,
      actorType: 'staff',
      actorId: dessieOfficerId.toString(),
      actorName: 'Fitsum Mebrahtu',
      eventType: 'request_status_updated',
      note: 'Card operations team is reviewing the issuance checklist.',
      createdAt: new Date('2026-03-12T09:40:00.000Z'),
      updatedAt: new Date('2026-03-12T09:40:00.000Z'),
    },
  ]);

  await NotificationModel.insertMany([
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: shareholderMemberId,
      userRole: UserRole.SHAREHOLDER_MEMBER,
      type: NotificationType.LOAN_STATUS,
      status: NotificationStatus.SENT,
      title: 'Loan Update',
      message: 'Your business loan is under branch review.',
      entityType: 'loan',
      entityId: branchBusinessLoanId,
      actionLabel: 'Open loan',
      priority: 'normal',
      deepLink: `/loans/${branchBusinessLoanId.toString()}`,
      createdAt: new Date('2026-03-09T10:30:00.000Z'),
      updatedAt: new Date('2026-03-09T10:30:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: shareholderMemberId,
      userRole: UserRole.SHAREHOLDER_MEMBER,
      type: NotificationType.SERVICE_REQUEST,
      status: NotificationStatus.SENT,
      title: 'ATM Card Request Updated',
      message:
        'Your ATM card request is under review. Tap to open the request timeline.',
      entityType: 'service_request',
      entityId: atmCardServiceRequestId,
      actionLabel: 'Open request',
      priority: 'normal',
      deepLink: `/service-requests/${atmCardServiceRequestId.toString()}`,
      createdAt: new Date('2026-03-09T09:15:00.000Z'),
      updatedAt: new Date('2026-03-09T09:15:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: fifthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.SYSTEM,
      status: NotificationStatus.SENT,
      title: 'KYC Action Required',
      message: 'Please upload a clearer Fayda front image and latest branch reference letter.',
      entityType: 'kyc',
      entityId: fifthRegularMemberId,
      actionLabel: 'Review KYC',
      priority: 'high',
      deepLink: '/fayda-verification',
      createdAt: new Date('2026-03-12T09:05:00.000Z'),
      updatedAt: new Date('2026-03-12T09:05:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: sixthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.LOAN_STATUS,
      status: NotificationStatus.SENT,
      title: 'Loan Review Started',
      message: 'Your women enterprise loan is now under Dessie branch review.',
      entityType: 'loan',
      entityId: sixthRegularLoanId,
      actionLabel: 'Open loan',
      priority: 'normal',
      deepLink: `/loans/${sixthRegularLoanId.toString()}`,
      createdAt: new Date('2026-03-12T10:20:00.000Z'),
      updatedAt: new Date('2026-03-12T10:20:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: fourthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.CHAT,
      status: NotificationStatus.SENT,
      title: 'Support Reply',
      message: 'A support agent replied to your payment issue. Open the conversation to continue.',
      entityType: 'ChatConversation',
      entityId: bahirDarEscalatedConversationId,
      actionLabel: 'Open support',
      priority: 'high',
      deepLink: `/support/${bahirDarEscalatedConversationId.toString()}`,
      createdAt: new Date('2026-03-12T11:32:00.000Z'),
      updatedAt: new Date('2026-03-12T11:32:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: fifthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.SERVICE_REQUEST,
      status: NotificationStatus.SENT,
      title: 'Card Request Under Review',
      message: 'Your new card request is now under review by branch operations.',
      entityType: 'card',
      entityId: fifthMemberCardId,
      actionLabel: 'Open card',
      priority: 'normal',
      deepLink: `/cards/${fifthMemberCardId.toString()}`,
      createdAt: new Date('2026-03-12T09:40:00.000Z'),
      updatedAt: new Date('2026-03-12T09:40:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: fourthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.PAYMENT,
      status: NotificationStatus.SENT,
      title: 'QR Receipt Ready',
      message: 'Your latest QR payment receipt is available in confirmed payments.',
      entityType: 'payment_receipts',
      actionLabel: 'Open receipts',
      priority: 'normal',
      deepLink: '/payments/receipts?filter=qr',
      createdAt: new Date('2026-03-12T10:10:00.000Z'),
      updatedAt: new Date('2026-03-12T10:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: thirdRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.INSURANCE,
      status: NotificationStatus.FAILED,
      title: 'Insurance Reminder Delivery Failed',
      message: 'We could not deliver your renewal reminder. Please review your preferred notification channel.',
      entityType: 'insurance',
      createdAt: new Date('2026-03-12T11:05:00.000Z'),
      updatedAt: new Date('2026-03-12T11:05:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: sixthRegularMemberId,
      userRole: UserRole.MEMBER,
      type: NotificationType.SERVICE_REQUEST,
      status: NotificationStatus.SENT,
      title: 'Payment Dispute Needs Action',
      message:
        'Your payment dispute needs a receipt upload before review can continue.',
      entityType: 'service_request',
      entityId: paymentDisputeServiceRequestId,
      actionLabel: 'Open receipts',
      priority: 'high',
      deepLink: '/payments/receipts?filter=disputes',
      createdAt: new Date('2026-03-12T11:20:00.000Z'),
      updatedAt: new Date('2026-03-12T11:20:00.000Z'),
    },
  ]);

  const loanReminderCampaignId = new Types.ObjectId();
  const insuranceCampaignId = new Types.ObjectId();

  await NotificationCampaignModel.insertMany([
    {
      _id: loanReminderCampaignId,
      category: 'loan',
      templateType: 'loan_due_soon',
      channels: ['sms', 'telegram', 'in_app'],
      targetType: 'filtered_customers',
      targetIds: [],
      filters: { districtId: bahirDarDistrictId.toString(), status: ['branch_review', 'district_review'] },
      messageSubject: 'Loan review reminder queue',
      messageBody: 'Follow up on loans needing action before escalation deadlines.',
      status: 'failed',
      createdBy: adminStaffId,
      scheduledAt: new Date('2026-03-12T08:00:00.000Z'),
      sentAt: new Date('2026-03-12T08:05:00.000Z'),
      createdAt: new Date('2026-03-12T07:50:00.000Z'),
    },
    {
      _id: insuranceCampaignId,
      category: 'insurance',
      templateType: 'insurance_expiring_7_days',
      channels: ['email', 'sms'],
      targetType: 'selected_customers',
      targetIds: [thirdRegularMemberId, sixthRegularMemberId],
      messageSubject: 'Insurance renewal reminder',
      messageBody: 'Your insurance policy is nearing expiry. Renew soon to avoid service interruption.',
      status: 'completed',
      createdBy: headOfficeManagerId,
      scheduledAt: new Date('2026-03-11T07:00:00.000Z'),
      sentAt: new Date('2026-03-11T07:05:00.000Z'),
      createdAt: new Date('2026-03-11T06:50:00.000Z'),
    },
  ]);

  await NotificationLogModel.insertMany([
    {
      _id: new Types.ObjectId(),
      campaignId: loanReminderCampaignId,
      memberId: fourthRegularMemberId,
      category: 'loan',
      channel: 'telegram',
      recipient: 'tg://martha-teshome',
      status: 'failed',
      messageBody: 'Your loan file needs action before the next district review window.',
      errorMessage: 'Telegram delivery timeout',
      sentAt: new Date('2026-03-12T08:06:00.000Z'),
      createdAt: new Date('2026-03-12T08:06:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      campaignId: loanReminderCampaignId,
      memberId: thirdRegularMemberId,
      category: 'loan',
      channel: 'sms',
      recipient: '0911000005',
      status: 'sent',
      providerMessageId: 'sms-loan-100005',
      messageBody: 'Your loan review is still active. Please monitor updates in the app.',
      sentAt: new Date('2026-03-12T08:05:30.000Z'),
      createdAt: new Date('2026-03-12T08:05:30.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      campaignId: insuranceCampaignId,
      memberId: thirdRegularMemberId,
      category: 'insurance',
      channel: 'email',
      recipient: 'lulit@bunna-bank.local',
      status: 'delivered',
      providerMessageId: 'email-ins-100005',
      messageSubject: 'Insurance renewal reminder',
      messageBody: 'Your policy is nearing expiry. Renew this week to stay covered.',
      sentAt: new Date('2026-03-11T07:05:30.000Z'),
      deliveredAt: new Date('2026-03-11T07:06:10.000Z'),
      createdAt: new Date('2026-03-11T07:05:30.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      campaignId: insuranceCampaignId,
      memberId: sixthRegularMemberId,
      category: 'insurance',
      channel: 'sms',
      recipient: '0911000008',
      status: 'failed',
      messageBody: 'Your property insurance will expire soon. Please renew.',
      errorMessage: 'Recipient handset unreachable',
      sentAt: new Date('2026-03-11T07:05:45.000Z'),
      createdAt: new Date('2026-03-11T07:05:45.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      campaignId: loanReminderCampaignId,
      memberId: shareholderMemberId,
      category: 'loan',
      channel: 'in_app',
      recipient: shareholderMemberId.toString(),
      status: 'delivered',
      providerMessageId: 'inapp-loan-100001',
      messageBody: 'Your branch-reviewed loan remains active in the queue.',
      sentAt: new Date('2026-03-10T08:04:15.000Z'),
      deliveredAt: new Date('2026-03-10T08:04:15.000Z'),
      createdAt: new Date('2026-03-10T08:04:15.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      campaignId: insuranceCampaignId,
      memberId: secondRegularMemberId,
      category: 'insurance',
      channel: 'sms',
      recipient: '0911000004',
      status: 'pending',
      messageBody: 'Your life policy renewal reminder is queued for retry.',
      createdAt: new Date('2026-03-09T07:05:45.000Z'),
    },
  ]);

  const voteId = new Types.ObjectId();
  const draftVoteId = new Types.ObjectId();
  const publishedVoteId = new Types.ObjectId();
  const candidateAOptionId = new Types.ObjectId();
  const candidateBOptionId = new Types.ObjectId();
  const candidateCOptionId = new Types.ObjectId();
  const draftApproveOptionId = new Types.ObjectId();
  const draftHoldOptionId = new Types.ObjectId();
  const publishedRatifiedOptionId = new Types.ObjectId();

  await VoteModel.insertMany([
    {
      _id: voteId,
      title: 'Board Election 2026',
      description: 'Annual shareholder election',
      type: 'election',
      status: VoteStatus.OPEN,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      createdBy: adminStaffId,
    },
    {
      _id: draftVoteId,
      title: 'Dividend Policy Amendment 2026',
      description: 'Draft governance motion awaiting opening approval.',
      type: 'governance',
      status: VoteStatus.DRAFT,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-10T23:59:59.000Z'),
      createdBy: headOfficeManagerId,
    },
    {
      _id: publishedVoteId,
      title: 'Audit Committee Ratification 2025',
      description: 'Published governance decision from the prior AGM.',
      type: 'governance',
      status: VoteStatus.PUBLISHED,
      startDate: new Date('2025-11-01T00:00:00.000Z'),
      endDate: new Date('2025-11-10T23:59:59.000Z'),
      createdBy: adminStaffId,
      resultsPublishedAt: new Date('2025-11-12T09:00:00.000Z'),
    },
  ]);

  await VoteOptionModel.insertMany([
    {
      _id: candidateAOptionId,
      voteId,
      name: 'Candidate A',
      description: 'Finance expert',
      displayOrder: 1,
    },
    {
      _id: candidateBOptionId,
      voteId,
      name: 'Candidate B',
      description: 'Operations specialist',
      displayOrder: 2,
    },
    {
      _id: candidateCOptionId,
      voteId,
      name: 'Candidate C',
      description: 'Technology leader',
      displayOrder: 3,
    },
    {
      _id: draftApproveOptionId,
      voteId: draftVoteId,
      name: 'Approve Draft Amendment',
      description: 'Move the draft governance change into the AGM vote pack.',
      displayOrder: 1,
    },
    {
      _id: draftHoldOptionId,
      voteId: draftVoteId,
      name: 'Hold for Revision',
      description: 'Send the draft back for further review before opening.',
      displayOrder: 2,
    },
    {
      _id: publishedRatifiedOptionId,
      voteId: publishedVoteId,
      name: 'Ratified',
      description: 'Published result placeholder for governance reporting.',
      displayOrder: 1,
    },
  ]);

  await VoteResponseModel.insertMany([
    {
      _id: new Types.ObjectId(),
      voteId,
      memberId: shareholderMemberId,
      optionId: candidateAOptionId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      encryptedBallot: 'enc-ballot-100001',
      otpVerifiedAt: new Date('2026-03-01T09:20:00.000Z'),
      createdAt: new Date('2026-03-01T09:20:00.000Z'),
      updatedAt: new Date('2026-03-01T09:20:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      voteId,
      memberId: secondShareholderMemberId,
      optionId: candidateBOptionId,
      branchId: debreMarkosBranchId,
      districtId: bahirDarDistrictId,
      encryptedBallot: 'enc-ballot-100002',
      otpVerifiedAt: new Date('2026-03-02T14:15:00.000Z'),
      createdAt: new Date('2026-03-02T14:15:00.000Z'),
      updatedAt: new Date('2026-03-02T14:15:00.000Z'),
    },
  ]);

  const dashboardToday = toUtcDay(new Date());
  const dashboardWeekStart = startOfUtcWeek(dashboardToday);
  const dashboardMonthStart = startOfUtcMonth(dashboardToday);
  const dashboardYearStart = startOfUtcYear(dashboardToday);

  await StaffPerformanceDailyModel.insertMany([
    buildStaffPerformanceRecord({
      staffId: branchLoanOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardToday,
      membersServed: 34,
      customersHelped: 31,
      loansHandled: 12,
      loanApplicationsCount: 12,
      loanApprovedCount: 6,
      loanRejectedCount: 1,
      loansEscalated: 2,
      kycCompleted: 9,
      supportResolved: 4,
      tasksCompleted: 28,
      transactionsCount: 42,
      schoolPaymentsCount: 5,
      totalTransactionAmount: 186000,
      avgHandlingTime: 17,
      responseTimeMinutes: 11,
      pendingTasks: 5,
      score: 92,
    }),
    buildStaffPerformanceRecord({
      staffId: supportAgentId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardToday,
      membersServed: 21,
      customersHelped: 24,
      loansHandled: 3,
      loanApplicationsCount: 3,
      loanApprovedCount: 1,
      loanRejectedCount: 0,
      loansEscalated: 1,
      kycCompleted: 5,
      supportResolved: 13,
      tasksCompleted: 19,
      transactionsCount: 18,
      schoolPaymentsCount: 2,
      totalTransactionAmount: 64000,
      avgHandlingTime: 21,
      responseTimeMinutes: 8,
      pendingTasks: 4,
      score: 84,
    }),
    buildStaffPerformanceRecord({
      staffId: branchOperationsOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardToday,
      membersServed: 13,
      customersHelped: 16,
      loansHandled: 4,
      loanApplicationsCount: 4,
      loanApprovedCount: 1,
      loanRejectedCount: 1,
      loansEscalated: 2,
      kycCompleted: 3,
      supportResolved: 2,
      tasksCompleted: 11,
      transactionsCount: 14,
      schoolPaymentsCount: 1,
      totalTransactionAmount: 28000,
      avgHandlingTime: 33,
      responseTimeMinutes: 22,
      pendingTasks: 9,
      score: 57,
    }),
    buildStaffPerformanceRecord({
      staffId: branchKycOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardToday,
      membersServed: 18,
      customersHelped: 20,
      loansHandled: 2,
      loanApplicationsCount: 2,
      loanApprovedCount: 0,
      loanRejectedCount: 0,
      loansEscalated: 1,
      kycCompleted: 12,
      supportResolved: 3,
      tasksCompleted: 17,
      transactionsCount: 9,
      schoolPaymentsCount: 1,
      totalTransactionAmount: 19000,
      avgHandlingTime: 16,
      responseTimeMinutes: 7,
      pendingTasks: 3,
      score: 88,
    }),
    buildStaffPerformanceRecord({
      staffId: dessieOfficerId,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      periodStart: dashboardToday,
      membersServed: 29,
      customersHelped: 32,
      loansHandled: 7,
      loanApplicationsCount: 7,
      loanApprovedCount: 2,
      loanRejectedCount: 1,
      loansEscalated: 2,
      kycCompleted: 6,
      supportResolved: 4,
      tasksCompleted: 24,
      transactionsCount: 27,
      schoolPaymentsCount: 2,
      totalTransactionAmount: 117000,
      avgHandlingTime: 20,
      responseTimeMinutes: 12,
      pendingTasks: 6,
      score: 78,
    }),
  ]);

  await StaffPerformanceWeeklyModel.insertMany([
    buildStaffPerformanceRecord({
      staffId: branchLoanOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardWeekStart,
      membersServed: 188,
      customersHelped: 176,
      loansHandled: 48,
      loanApplicationsCount: 48,
      loanApprovedCount: 24,
      loanRejectedCount: 4,
      loansEscalated: 8,
      kycCompleted: 41,
      supportResolved: 20,
      tasksCompleted: 131,
      transactionsCount: 242,
      schoolPaymentsCount: 18,
      totalTransactionAmount: 1024000,
      avgHandlingTime: 18,
      responseTimeMinutes: 12,
      pendingTasks: 6,
      score: 91,
    }),
    buildStaffPerformanceRecord({
      staffId: supportAgentId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardWeekStart,
      membersServed: 124,
      customersHelped: 136,
      loansHandled: 14,
      loanApplicationsCount: 14,
      loanApprovedCount: 5,
      loanRejectedCount: 1,
      loansEscalated: 3,
      kycCompleted: 22,
      supportResolved: 67,
      tasksCompleted: 104,
      transactionsCount: 97,
      schoolPaymentsCount: 6,
      totalTransactionAmount: 324000,
      avgHandlingTime: 19,
      responseTimeMinutes: 9,
      pendingTasks: 5,
      score: 86,
    }),
    buildStaffPerformanceRecord({
      staffId: branchOperationsOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardWeekStart,
      membersServed: 79,
      customersHelped: 85,
      loansHandled: 19,
      loanApplicationsCount: 19,
      loanApprovedCount: 6,
      loanRejectedCount: 5,
      loansEscalated: 7,
      kycCompleted: 14,
      supportResolved: 11,
      tasksCompleted: 58,
      transactionsCount: 82,
      schoolPaymentsCount: 4,
      totalTransactionAmount: 208000,
      avgHandlingTime: 28,
      responseTimeMinutes: 19,
      pendingTasks: 10,
      score: 61,
    }),
    buildStaffPerformanceRecord({
      staffId: branchKycOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardWeekStart,
      membersServed: 109,
      customersHelped: 118,
      loansHandled: 11,
      loanApplicationsCount: 11,
      loanApprovedCount: 2,
      loanRejectedCount: 1,
      loansEscalated: 3,
      kycCompleted: 58,
      supportResolved: 16,
      tasksCompleted: 87,
      transactionsCount: 41,
      schoolPaymentsCount: 4,
      totalTransactionAmount: 126000,
      avgHandlingTime: 15,
      responseTimeMinutes: 8,
      pendingTasks: 4,
      score: 87,
    }),
    buildStaffPerformanceRecord({
      staffId: dessieOfficerId,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      periodStart: dashboardWeekStart,
      membersServed: 147,
      customersHelped: 159,
      loansHandled: 31,
      loanApplicationsCount: 31,
      loanApprovedCount: 10,
      loanRejectedCount: 3,
      loansEscalated: 6,
      kycCompleted: 28,
      supportResolved: 18,
      tasksCompleted: 112,
      transactionsCount: 129,
      schoolPaymentsCount: 8,
      totalTransactionAmount: 456000,
      avgHandlingTime: 19,
      responseTimeMinutes: 11,
      pendingTasks: 7,
      score: 79,
    }),
  ]);

  await StaffPerformanceMonthlyModel.insertMany([
    buildStaffPerformanceRecord({
      staffId: branchLoanOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardMonthStart,
      membersServed: 724,
      customersHelped: 703,
      loansHandled: 173,
      loanApplicationsCount: 173,
      loanApprovedCount: 88,
      loanRejectedCount: 13,
      loansEscalated: 24,
      kycCompleted: 162,
      supportResolved: 79,
      tasksCompleted: 511,
      transactionsCount: 956,
      schoolPaymentsCount: 64,
      totalTransactionAmount: 4184000,
      avgHandlingTime: 18,
      responseTimeMinutes: 13,
      pendingTasks: 7,
      score: 90,
    }),
    buildStaffPerformanceRecord({
      staffId: supportAgentId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardMonthStart,
      membersServed: 506,
      customersHelped: 548,
      loansHandled: 43,
      loanApplicationsCount: 43,
      loanApprovedCount: 15,
      loanRejectedCount: 4,
      loansEscalated: 8,
      kycCompleted: 93,
      supportResolved: 254,
      tasksCompleted: 407,
      transactionsCount: 385,
      schoolPaymentsCount: 22,
      totalTransactionAmount: 1422000,
      avgHandlingTime: 20,
      responseTimeMinutes: 9,
      pendingTasks: 6,
      score: 85,
    }),
    buildStaffPerformanceRecord({
      staffId: branchOperationsOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardMonthStart,
      membersServed: 303,
      customersHelped: 321,
      loansHandled: 68,
      loanApplicationsCount: 68,
      loanApprovedCount: 20,
      loanRejectedCount: 17,
      loansEscalated: 22,
      kycCompleted: 57,
      supportResolved: 41,
      tasksCompleted: 219,
      transactionsCount: 314,
      schoolPaymentsCount: 17,
      totalTransactionAmount: 866000,
      avgHandlingTime: 29,
      responseTimeMinutes: 18,
      pendingTasks: 11,
      score: 60,
    }),
    buildStaffPerformanceRecord({
      staffId: branchKycOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardMonthStart,
      membersServed: 432,
      customersHelped: 468,
      loansHandled: 35,
      loanApplicationsCount: 35,
      loanApprovedCount: 7,
      loanRejectedCount: 3,
      loansEscalated: 9,
      kycCompleted: 241,
      supportResolved: 63,
      tasksCompleted: 331,
      transactionsCount: 188,
      schoolPaymentsCount: 13,
      totalTransactionAmount: 694000,
      avgHandlingTime: 15,
      responseTimeMinutes: 8,
      pendingTasks: 5,
      score: 88,
    }),
    buildStaffPerformanceRecord({
      staffId: dessieOfficerId,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      periodStart: dashboardMonthStart,
      membersServed: 248,
      customersHelped: 266,
      loansHandled: 54,
      loanApplicationsCount: 54,
      loanApprovedCount: 18,
      loanRejectedCount: 5,
      loansEscalated: 11,
      kycCompleted: 47,
      supportResolved: 26,
      tasksCompleted: 191,
      transactionsCount: 228,
      schoolPaymentsCount: 12,
      totalTransactionAmount: 918000,
      avgHandlingTime: 19,
      responseTimeMinutes: 11,
      pendingTasks: 8,
      score: 79,
    }),
  ]);

  await StaffPerformanceYearlyModel.insertMany([
    buildStaffPerformanceRecord({
      staffId: branchLoanOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardYearStart,
      membersServed: 2146,
      customersHelped: 2088,
      loansHandled: 511,
      loanApplicationsCount: 511,
      loanApprovedCount: 262,
      loanRejectedCount: 41,
      loansEscalated: 77,
      kycCompleted: 471,
      supportResolved: 236,
      tasksCompleted: 1544,
      transactionsCount: 2824,
      schoolPaymentsCount: 181,
      totalTransactionAmount: 12230000,
      avgHandlingTime: 18,
      responseTimeMinutes: 13,
      pendingTasks: 7,
      score: 89,
    }),
    buildStaffPerformanceRecord({
      staffId: supportAgentId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardYearStart,
      membersServed: 1487,
      customersHelped: 1568,
      loansHandled: 131,
      loanApplicationsCount: 131,
      loanApprovedCount: 46,
      loanRejectedCount: 11,
      loansEscalated: 28,
      kycCompleted: 281,
      supportResolved: 771,
      tasksCompleted: 1187,
      transactionsCount: 1114,
      schoolPaymentsCount: 73,
      totalTransactionAmount: 4312000,
      avgHandlingTime: 19,
      responseTimeMinutes: 10,
      pendingTasks: 6,
      score: 84,
    }),
    buildStaffPerformanceRecord({
      staffId: branchOperationsOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardYearStart,
      membersServed: 931,
      customersHelped: 988,
      loansHandled: 209,
      loanApplicationsCount: 209,
      loanApprovedCount: 61,
      loanRejectedCount: 44,
      loansEscalated: 66,
      kycCompleted: 182,
      supportResolved: 137,
      tasksCompleted: 699,
      transactionsCount: 972,
      schoolPaymentsCount: 47,
      totalTransactionAmount: 2527000,
      avgHandlingTime: 27,
      responseTimeMinutes: 18,
      pendingTasks: 12,
      score: 59,
    }),
    buildStaffPerformanceRecord({
      staffId: branchKycOfficerId,
      branchId: bahirDarBranchId,
      districtId: bahirDarDistrictId,
      periodStart: dashboardYearStart,
      membersServed: 1277,
      customersHelped: 1368,
      loansHandled: 94,
      loanApplicationsCount: 94,
      loanApprovedCount: 21,
      loanRejectedCount: 7,
      loansEscalated: 24,
      kycCompleted: 716,
      supportResolved: 193,
      tasksCompleted: 1018,
      transactionsCount: 592,
      schoolPaymentsCount: 41,
      totalTransactionAmount: 2291000,
      avgHandlingTime: 15,
      responseTimeMinutes: 9,
      pendingTasks: 6,
      score: 87,
    }),
    buildStaffPerformanceRecord({
      staffId: dessieOfficerId,
      branchId: dessieBranchId,
      districtId: woldiaDistrictId,
      periodStart: dashboardYearStart,
      membersServed: 876,
      customersHelped: 928,
      loansHandled: 186,
      loanApplicationsCount: 186,
      loanApprovedCount: 63,
      loanRejectedCount: 17,
      loansEscalated: 39,
      kycCompleted: 171,
      supportResolved: 101,
      tasksCompleted: 702,
      transactionsCount: 811,
      schoolPaymentsCount: 44,
      totalTransactionAmount: 3618000,
      avgHandlingTime: 20,
      responseTimeMinutes: 12,
      pendingTasks: 9,
      score: 78,
    }),
  ]);

  await BranchPerformanceDailyModel.insertMany(
    buildDailyPerformanceSeries([
      {
        branchId: bahirDarBranchId,
        branchName: 'Bahir Dar Branch',
        districtId: bahirDarDistrictId,
        districtName: 'Bahir Dar District',
        seed: {
          membersServed: 72,
          customersHelped: 68,
          loansHandled: 18,
          loansApproved: 9,
          loansEscalated: 3,
          kycCompleted: 15,
          supportResolved: 19,
          transactionsProcessed: 88,
          avgHandlingTime: 18,
          pendingTasks: 8,
          pendingApprovals: 6,
          responseTimeMinutes: 12,
          score: 91,
        },
      },
      {
        branchId: debreMarkosBranchId,
        branchName: 'Debre Markos Branch',
        districtId: bahirDarDistrictId,
        districtName: 'Bahir Dar District',
        seed: {
          membersServed: 46,
          customersHelped: 42,
          loansHandled: 11,
          loansApproved: 5,
          loansEscalated: 4,
          kycCompleted: 10,
          supportResolved: 11,
          transactionsProcessed: 61,
          avgHandlingTime: 24,
          pendingTasks: 11,
          pendingApprovals: 8,
          responseTimeMinutes: 17,
          score: 68,
        },
      },
      {
        branchId: gondarBranchId,
        branchName: 'Gondar Branch',
        districtId: gondarDistrictId,
        districtName: 'Gondar District',
        seed: {
          membersServed: 38,
          customersHelped: 35,
          loansHandled: 9,
          loansApproved: 3,
          loansEscalated: 5,
          kycCompleted: 7,
          supportResolved: 8,
          transactionsProcessed: 48,
          avgHandlingTime: 29,
          pendingTasks: 13,
          pendingApprovals: 10,
          responseTimeMinutes: 21,
          score: 56,
        },
      },
      {
        branchId: dessieBranchId,
        branchName: 'Dessie Branch',
        districtId: woldiaDistrictId,
        districtName: 'Woldia District',
        seed: {
          membersServed: 41,
          customersHelped: 39,
          loansHandled: 12,
          loansApproved: 4,
          loansEscalated: 3,
          kycCompleted: 9,
          supportResolved: 10,
          transactionsProcessed: 53,
          avgHandlingTime: 23,
          pendingTasks: 9,
          pendingApprovals: 7,
          responseTimeMinutes: 16,
          score: 74,
        },
      },
      {
        branchId: jimmaBranchId,
        branchName: 'Jimma Branch',
        districtId: jimmaDistrictId,
        districtName: 'Jimma District',
        seed: {
          membersServed: 49,
          customersHelped: 45,
          loansHandled: 13,
          loansApproved: 6,
          loansEscalated: 3,
          kycCompleted: 11,
          supportResolved: 12,
          transactionsProcessed: 66,
          avgHandlingTime: 21,
          pendingTasks: 10,
          pendingApprovals: 6,
          responseTimeMinutes: 15,
          score: 79,
        },
      },
      {
        branchId: mekeleBranchId,
        branchName: 'Mekele Branch',
        districtId: mekeleDistrictId,
        districtName: 'Mekele District',
        seed: {
          membersServed: 43,
          customersHelped: 40,
          loansHandled: 10,
          loansApproved: 4,
          loansEscalated: 4,
          kycCompleted: 8,
          supportResolved: 9,
          transactionsProcessed: 57,
          avgHandlingTime: 24,
          pendingTasks: 12,
          pendingApprovals: 8,
          responseTimeMinutes: 18,
          score: 71,
        },
      },
    ], dashboardToday),
  );

  await DistrictPerformanceDailyModel.insertMany(
    buildDailyPerformanceSeries([
      {
        districtId: bahirDarDistrictId,
        districtName: 'Bahir Dar District',
        seed: {
          membersServed: 118,
          customersHelped: 110,
          loansHandled: 29,
          loansApproved: 14,
          loansEscalated: 7,
          kycCompleted: 25,
          supportResolved: 30,
          transactionsProcessed: 149,
          avgHandlingTime: 20,
          pendingTasks: 18,
          pendingApprovals: 14,
          responseTimeMinutes: 14,
          score: 82,
        },
      },
      {
        districtId: gondarDistrictId,
        districtName: 'Gondar District',
        seed: {
          membersServed: 38,
          customersHelped: 35,
          loansHandled: 9,
          loansApproved: 3,
          loansEscalated: 5,
          kycCompleted: 7,
          supportResolved: 8,
          transactionsProcessed: 48,
          avgHandlingTime: 29,
          pendingTasks: 13,
          pendingApprovals: 10,
          responseTimeMinutes: 21,
          score: 56,
        },
      },
      {
        districtId: woldiaDistrictId,
        districtName: 'Woldia District',
        seed: {
          membersServed: 41,
          customersHelped: 39,
          loansHandled: 12,
          loansApproved: 4,
          loansEscalated: 3,
          kycCompleted: 9,
          supportResolved: 10,
          transactionsProcessed: 53,
          avgHandlingTime: 23,
          pendingTasks: 9,
          pendingApprovals: 7,
          responseTimeMinutes: 16,
          score: 74,
        },
      },
      {
        districtId: jimmaDistrictId,
        districtName: 'Jimma District',
        seed: {
          membersServed: 49,
          customersHelped: 45,
          loansHandled: 13,
          loansApproved: 6,
          loansEscalated: 3,
          kycCompleted: 11,
          supportResolved: 12,
          transactionsProcessed: 66,
          avgHandlingTime: 21,
          pendingTasks: 10,
          pendingApprovals: 6,
          responseTimeMinutes: 15,
          score: 79,
        },
      },
      {
        districtId: mekeleDistrictId,
        districtName: 'Mekele District',
        seed: {
          membersServed: 43,
          customersHelped: 40,
          loansHandled: 10,
          loansApproved: 4,
          loansEscalated: 4,
          kycCompleted: 8,
          supportResolved: 9,
          transactionsProcessed: 57,
          avgHandlingTime: 24,
          pendingTasks: 12,
          pendingApprovals: 8,
          responseTimeMinutes: 18,
          score: 71,
        },
      },
    ], dashboardToday),
  );

  const openConversationId = new Types.ObjectId();
  const assignedConversationId = new Types.ObjectId();
  const resolvedConversationId = new Types.ObjectId();
  const debreMarkosOpenConversationId = new Types.ObjectId();
  const debreMarkosKycConversationId = new Types.ObjectId();

  await ChatConversationModel.insertMany([
    {
      _id: openConversationId,
      memberId: regularMemberId,
      memberName: 'Tigist Bekele',
      phoneNumber: '0911000003',
      memberType: MemberType.MEMBER,
      branchId: bahirDarBranchId,
      branchName: 'Bahir Dar Branch',
      districtId: bahirDarDistrictId,
      districtName: 'Bahir Dar District',
      category: 'loan_issue',
      status: 'waiting_agent',
      priority: 'high',
      channel: 'mobile',
      escalationFlag: false,
      lastMessageAt: new Date('2026-03-11T11:20:00.000Z'),
      createdAt: new Date('2026-03-11T11:10:00.000Z'),
      updatedAt: new Date('2026-03-11T11:20:00.000Z'),
    },
    {
      _id: assignedConversationId,
      memberId: shareholderMemberId,
      memberName: 'Getnet Belay',
      phoneNumber: '0911000001',
      memberType: MemberType.SHAREHOLDER,
      branchId: bahirDarBranchId,
      branchName: 'Bahir Dar Branch',
      districtId: bahirDarDistrictId,
      districtName: 'Bahir Dar District',
      category: 'payment_issue',
      status: 'waiting_customer',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      priority: 'normal',
      channel: 'mobile',
      escalationFlag: false,
      lastMessageAt: new Date('2026-03-11T10:55:00.000Z'),
      createdAt: new Date('2026-03-11T10:10:00.000Z'),
      updatedAt: new Date('2026-03-11T10:55:00.000Z'),
    },
    {
      _id: resolvedConversationId,
      memberId: secondRegularMemberId,
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000004',
      memberType: MemberType.MEMBER,
      branchId: gondarBranchId,
      branchName: 'Gondar Branch',
      districtId: gondarDistrictId,
      districtName: 'Gondar District',
      category: 'kyc_issue',
      status: 'resolved',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      priority: 'low',
      channel: 'mobile',
      escalationFlag: false,
      lastMessageAt: new Date('2026-03-10T16:35:00.000Z'),
      createdAt: new Date('2026-03-10T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:35:00.000Z'),
    },
    {
      _id: debreMarkosOpenConversationId,
      memberId: thirdRegularMemberId,
      memberName: 'Lulit Haile',
      phoneNumber: '0911000005',
      memberType: MemberType.MEMBER,
      branchId: debreMarkosBranchId,
      branchName: 'Debre Markos Branch',
      districtId: bahirDarDistrictId,
      districtName: 'Bahir Dar District',
      category: 'general_help',
      status: 'waiting_agent',
      priority: 'normal',
      channel: 'mobile',
      escalationFlag: false,
      lastMessageAt: new Date('2026-03-12T08:45:00.000Z'),
      createdAt: new Date('2026-03-12T08:32:00.000Z'),
      updatedAt: new Date('2026-03-12T08:45:00.000Z'),
    },
    {
      _id: bahirDarEscalatedConversationId,
      memberId: fourthRegularMemberId,
      memberName: 'Martha Teshome',
      phoneNumber: '0911000006',
      memberType: MemberType.MEMBER,
      branchId: bahirDarBranchId,
      branchName: 'Bahir Dar Branch',
      districtId: bahirDarDistrictId,
      districtName: 'Bahir Dar District',
      category: 'payment_issue',
      status: 'assigned',
      assignedToStaffId: supportAgentId,
      assignedToStaffName: 'Rahel Desta',
      priority: 'high',
      channel: 'mobile',
      escalationFlag: true,
      lastMessageAt: new Date('2026-03-12T09:10:00.000Z'),
      createdAt: new Date('2026-03-12T08:55:00.000Z'),
      updatedAt: new Date('2026-03-12T09:10:00.000Z'),
    },
    {
      _id: debreMarkosKycConversationId,
      memberId: fifthRegularMemberId,
      memberName: 'Biniam Asmare',
      phoneNumber: '0911000007',
      memberType: MemberType.MEMBER,
      branchId: debreMarkosBranchId,
      branchName: 'Debre Markos Branch',
      districtId: bahirDarDistrictId,
      districtName: 'Bahir Dar District',
      category: 'kyc_issue',
      status: 'waiting_agent',
      priority: 'high',
      channel: 'mobile',
      escalationFlag: true,
      lastMessageAt: new Date('2026-03-12T09:40:00.000Z'),
      createdAt: new Date('2026-03-12T09:18:00.000Z'),
      updatedAt: new Date('2026-03-12T09:40:00.000Z'),
    },
  ]);

  await ChatMessageModel.insertMany([
    {
      _id: new Types.ObjectId(),
      conversationId: openConversationId,
      senderType: 'customer',
      senderId: regularMemberId.toString(),
      senderName: 'Tigist Bekele',
      message: 'I submitted my loan documents but I need an update on the next review step.',
      messageType: 'text',
      createdAt: new Date('2026-03-11T11:20:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: assignedConversationId,
      senderType: 'customer',
      senderId: shareholderMemberId.toString(),
      senderName: 'Getnet Belay',
      message: 'My payment confirmation is delayed. Can you check it?',
      messageType: 'text',
      createdAt: new Date('2026-03-11T10:15:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: assignedConversationId,
      senderType: 'agent',
      senderId: supportAgentId.toString(),
      senderName: 'Rahel Desta',
      message: 'I am reviewing the payment reference now. Please keep this chat open for the update.',
      messageType: 'text',
      createdAt: new Date('2026-03-11T10:55:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: resolvedConversationId,
      senderType: 'customer',
      senderId: secondRegularMemberId.toString(),
      senderName: 'Meseret Alemu',
      message: 'My KYC review is still pending.',
      messageType: 'text',
      createdAt: new Date('2026-03-10T16:02:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: resolvedConversationId,
      senderType: 'agent',
      senderId: supportAgentId.toString(),
      senderName: 'Rahel Desta',
      message: 'Your KYC record has been reviewed and the case is now resolved.',
      messageType: 'text',
      createdAt: new Date('2026-03-10T16:35:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: debreMarkosOpenConversationId,
      senderType: 'customer',
      senderId: thirdRegularMemberId.toString(),
      senderName: 'Lulit Haile',
      message: 'My account statement request is still pending in the app. Please help.',
      messageType: 'text',
      createdAt: new Date('2026-03-12T08:45:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: bahirDarEscalatedConversationId,
      senderType: 'customer',
      senderId: fourthRegularMemberId.toString(),
      senderName: 'Martha Teshome',
      message: 'My new ATM card request has not moved for several days.',
      messageType: 'text',
      createdAt: new Date('2026-03-12T08:57:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: bahirDarEscalatedConversationId,
      senderType: 'agent',
      senderId: supportAgentId.toString(),
      senderName: 'Rahel Desta',
      message: 'I have escalated this card request to branch operations for immediate review.',
      messageType: 'text',
      createdAt: new Date('2026-03-12T09:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: debreMarkosKycConversationId,
      senderType: 'customer',
      senderId: fifthRegularMemberId.toString(),
      senderName: 'Biniam Asmare',
      message: 'The app says my KYC needs action. Please tell me exactly what to resubmit.',
      messageType: 'text',
      createdAt: new Date('2026-03-12T09:40:00.000Z'),
    },
  ]);

  await ChatAssignmentModel.insertMany([
    {
      _id: new Types.ObjectId(),
      conversationId: assignedConversationId,
      assignedToStaffId: supportAgentId,
      assignedBy: adminStaffId,
      createdAt: new Date('2026-03-11T10:30:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: resolvedConversationId,
      assignedToStaffId: supportAgentId,
      assignedBy: adminStaffId,
      createdAt: new Date('2026-03-10T16:05:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      conversationId: bahirDarEscalatedConversationId,
      assignedToStaffId: supportAgentId,
      assignedBy: adminStaffId,
      createdAt: new Date('2026-03-12T09:00:00.000Z'),
    },
  ]);

  await AuditLogModel.insertMany([
    {
      _id: new Types.ObjectId(),
      actorId: adminStaffId,
      actorRole: UserRole.ADMIN,
      actionType: 'autopay_paused',
      entityType: 'autopay_setting',
      entityId: rentAutopayId,
      before: { enabled: true, serviceType: 'rent' },
      after: { enabled: false, serviceType: 'rent' },
      createdAt: new Date('2026-03-12T11:25:00.000Z'),
      updatedAt: new Date('2026-03-12T11:25:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: headOfficeManagerId,
      actorRole: UserRole.HEAD_OFFICE_MANAGER,
      actionType: 'campaign_failed',
      entityType: 'notification_campaign',
      entityId: loanReminderCampaignId,
      before: { status: 'sending', category: 'loan' },
      after: { status: 'failed', category: 'loan' },
      createdAt: new Date('2026-03-12T08:10:00.000Z'),
      updatedAt: new Date('2026-03-12T08:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: adminStaffId,
      actorRole: UserRole.ADMIN,
      actionType: 'vote_opened',
      entityType: 'vote',
      entityId: voteId,
      before: { status: 'draft' },
      after: { status: 'open' },
      createdAt: new Date('2026-03-01T08:55:00.000Z'),
      updatedAt: new Date('2026-03-01T08:55:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: branchStaffId,
      actorRole: UserRole.BRANCH_MANAGER,
      actionType: 'onboarding_needs_action',
      entityType: 'member_profile',
      entityId: fifthRegularMemberProfileId,
      before: { onboardingReviewStatus: 'review_in_progress' },
      after: { onboardingReviewStatus: 'needs_action' },
      createdAt: new Date('2026-03-12T09:00:00.000Z'),
      updatedAt: new Date('2026-03-12T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: supportAgentId,
      actorRole: UserRole.SUPPORT_AGENT,
      actionType: 'chat_escalated',
      entityType: 'chat',
      entityId: bahirDarEscalatedConversationId,
      before: { escalationFlag: false, status: 'assigned' },
      after: { escalationFlag: true, status: 'assigned' },
      createdAt: new Date('2026-03-12T09:10:00.000Z'),
      updatedAt: new Date('2026-03-12T09:10:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: districtStaffId,
      actorRole: UserRole.DISTRICT_MANAGER,
      actionType: 'loan_forwarded',
      entityType: 'loan',
      entityId: branchBusinessLoanId,
      before: { status: 'branch_review', currentLevel: 'branch' },
      after: { status: 'district_review', currentLevel: 'district' },
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId(),
      actorId: headOfficeManagerId,
      actorRole: UserRole.HEAD_OFFICE_MANAGER,
      actionType: 'risk_watchlist_reviewed',
      entityType: 'district',
      entityId: woldiaDistrictId,
      before: { score: 71 },
      after: { score: 74, reviewStatus: 'monitored' },
      createdAt: new Date('2026-03-08T15:30:00.000Z'),
      updatedAt: new Date('2026-03-08T15:30:00.000Z'),
    },
  ]);

  console.log(
    JSON.stringify(
      {
        seeded: true,
        mongoUri,
        memberLogins: [
          { phone: '0911000001', password: 'demo-pass', type: 'shareholder' },
          { phone: '0911000002', password: 'demo-pass', type: 'shareholder' },
          { phone: '0911000003', password: 'demo-pass', type: 'member' },
          { phone: '0911000004', password: 'demo-pass', type: 'member' },
          { phone: '0911000005', password: 'demo-pass', type: 'member' },
          { phone: '0911000006', password: 'demo-pass', type: 'member' },
          { phone: '0911000007', password: 'demo-pass', type: 'member' },
          { phone: '0911000008', password: 'demo-pass', type: 'member' },
        ],
        staffLogins: [
          { identifier: 'admin.head-office@bunnabank.com', password: 'demo-pass', role: 'admin' },
          {
            identifier: 'manager.head-office@bunnabank.com',
            password: 'demo-pass',
            role: 'head_office_manager',
          },
          {
            identifier: 'getachew.loan',
            password: 'demo-pass',
            role: 'loan_officer',
          },
          {
            identifier: 'tigist.loan',
            password: 'demo-pass',
            role: 'loan_officer',
          },
          {
            identifier: 'manager.north-district@bunnabank.com',
            password: 'demo-pass',
            role: 'district_manager',
          },
          {
            identifier: 'manager.bahirdar-branch@bunnabank.com',
            password: 'demo-pass',
            role: 'branch_manager',
          },
          {
            identifier: 'agent.support@bunnabank.com',
            password: 'demo-pass',
            role: 'support_agent',
          },
          {
            identifier: 'saron.operations',
            password: 'demo-pass',
            role: 'loan_officer',
          },
          {
            identifier: 'selam.kyc',
            password: 'demo-pass',
            role: 'loan_officer',
          },
          {
            identifier: 'bereket.operations',
            password: 'demo-pass',
            role: 'loan_officer',
          },
          {
            identifier: 'fitsum.dessie',
            password: 'demo-pass',
            role: 'loan_officer',
          },
        ],
        summary: {
          districts: 3,
          branches: 4,
          staff: 11,
          regularMembers: 6,
          shareholderMembers: 2,
          activeVotes: 1,
          supportConversations: 6,
        },
      },
      null,
      2,
    ),
  );
}

function createModel<T>(name: string, schema: mongoose.Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

type SeedPerformanceMetrics = {
  membersServed: number;
  customersHelped: number;
  loansHandled: number;
  loansApproved: number;
  loansEscalated: number;
  kycCompleted: number;
  supportResolved: number;
  transactionsProcessed: number;
  avgHandlingTime: number;
  pendingTasks: number;
  pendingApprovals: number;
  responseTimeMinutes: number;
  score: number;
};

function buildStaffPerformanceRecord(input: {
  staffId: Types.ObjectId;
  branchId: Types.ObjectId;
  districtId: Types.ObjectId;
  periodStart: Date;
  membersServed: number;
  customersHelped: number;
  loansHandled: number;
  loanApplicationsCount: number;
  loanApprovedCount: number;
  loanRejectedCount: number;
  loansEscalated: number;
  kycCompleted: number;
  supportResolved: number;
  tasksCompleted: number;
  transactionsCount: number;
  schoolPaymentsCount: number;
  totalTransactionAmount: number;
  avgHandlingTime: number;
  responseTimeMinutes: number;
  pendingTasks: number;
  score: number;
}) {
  return {
    ...input,
    status: resolvePerformanceStatus(input.score),
  };
}

function buildDailyPerformanceSeries(
  configs: Array<
    | {
        branchId: Types.ObjectId;
        branchName: string;
        districtId: Types.ObjectId;
        districtName: string;
        seed: SeedPerformanceMetrics;
      }
    | {
        districtId: Types.ObjectId;
        districtName: string;
        seed: SeedPerformanceMetrics;
      }
  >,
  referenceDate: Date,
) {
  const rows: Array<Record<string, unknown>> = [];

  for (let dayOffset = 0; dayOffset < 35; dayOffset += 1) {
    const date = new Date(referenceDate);
    date.setUTCDate(referenceDate.getUTCDate() - dayOffset);
    const variance = dayOffset % 5;

    for (const config of configs) {
      const multiplier = dayOffset < 7 ? 1 : dayOffset < 31 ? 0.92 : 0.87;
      const adjustment = variance === 0 ? 0 : variance === 1 ? 2 : variance === 2 ? -1 : 1;
      const score = Math.max(
        45,
        Math.round(config.seed.score * multiplier + adjustment),
      );

      rows.push({
        ...('branchId' in config
          ? {
              branchId: config.branchId,
              branchName: config.branchName,
              districtId: config.districtId,
              districtName: config.districtName,
            }
          : {
              districtId: config.districtId,
              districtName: config.districtName,
            }),
        date,
        membersServed: Math.max(
          8,
          Math.round(config.seed.membersServed * multiplier + adjustment),
        ),
        customersHelped: Math.max(
          8,
          Math.round(config.seed.customersHelped * multiplier + adjustment),
        ),
        loansHandled: Math.max(
          1,
          Math.round(config.seed.loansHandled * multiplier),
        ),
        loansApproved: Math.max(
          0,
          Math.round(config.seed.loansApproved * multiplier),
        ),
        loansEscalated: Math.max(
          0,
          Math.round(config.seed.loansEscalated * multiplier),
        ),
        kycCompleted: Math.max(
          0,
          Math.round(config.seed.kycCompleted * multiplier),
        ),
        supportResolved: Math.max(
          0,
          Math.round(config.seed.supportResolved * multiplier),
        ),
        transactionsProcessed: Math.max(
          6,
          Math.round(config.seed.transactionsProcessed * multiplier + adjustment),
        ),
        avgHandlingTime: Number(
          (config.seed.avgHandlingTime + variance * 0.8).toFixed(1),
        ),
        pendingTasks: Math.max(
          1,
          Math.round(config.seed.pendingTasks * multiplier + variance),
        ),
        pendingApprovals: Math.max(
          1,
          Math.round(config.seed.pendingApprovals * multiplier + (variance - 1)),
        ),
        responseTimeMinutes: Number(
          (config.seed.responseTimeMinutes + variance * 0.6).toFixed(1),
        ),
        score,
        status: resolvePerformanceStatus(score),
      });
    }
  }

  return rows;
}

function resolvePerformanceStatus(score: number) {
  if (score >= 88) {
    return 'excellent';
  }
  if (score >= 72) {
    return 'good';
  }
  if (score >= 58) {
    return 'watch';
  }
  return 'needs_support';
}

function hashSecret(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function toUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function startOfUtcWeek(date: Date) {
  const value = new Date(date);
  const day = value.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + diff);
  return value;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

void run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
