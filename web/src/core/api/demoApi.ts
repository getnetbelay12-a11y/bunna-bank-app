import {
  type AuditApi,
  type AuditLogItem,
  type AuditLogVerificationResult,
  type AuthApi,
  type BranchCommandCenterSummary,
  type BulkInvoiceReminderResult,
  type CardOperationItem,
  type CardOperationDetail,
  type CardOperationUpdateResult,
  type CardOperationsApi,
  type CardStatus,
  type CreateVotePayload,
  type CreateManagerNotificationCampaignPayload,
  type DashboardApi,
  type DistrictCommandCenterSummary,
  type FeePlanItem,
  type FeePlanRecord,
  type InvoiceBatchPreviewResult,
  type GuardianRecord,
  type GuardianStudentLinkItem,
  type AutopayOperationItem,
  type HeadOfficeCommandCenterSummary,
  type InsuranceAlertItem,
  type LoanMonitoringApi,
  type LoanQueueAction,
  type LoanQueueDetail,
  type LoanQueueItem,
  type ManagerDashboardSummary,
  type NotificationApi,
  type PaymentOperationsApi,
  type ParentPortalApi,
  type ParentPortalSession,
  type ParentPortalPaymentResult,
  type ParentStudentAccount,
  type ParentStudentLookupItem,
  type PaymentReceiptItem,
  type RecommendationApi,
  type RecommendationCollection,
  type RecommendationDashboardSummary,
  type NotificationCampaignItem,
  type NotificationCenterItem,
  type NotificationLogItem,
  type NotificationTemplateItem,
  type OnboardingEvidenceDetail,
  type OnboardingReviewItem,
  type PerformancePeriod,
  type PerformanceSummaryItem,
  type RolePerformanceItem,
  type RolePerformanceOverview,
  type SchoolCollectionItem,
  type SchoolConsoleApi,
  type SchoolConsoleOverview,
  type SecurityReviewMetrics,
  type InvoiceBatchGenerationResult,
  type InvoiceReminderResult,
  type SchoolInvoiceItem,
  type SchoolPortfolioItem,
  type StudentImportResult,
  type StudentImportRowInput,
  type StudentRegistryFilter,
  type StudentDetail,
  type StudentRegistryItem,
  type ServiceRequestApi,
  type ServiceRequestDetail,
  type ServiceRequestItem,
  type SupportApi,
  type SupportChatDetail,
  type SupportChatSummaryItem,
  type StaffRankingItem,
  type StaffLoginPayload,
  type VoteAdminItem,
  type VoteResultItem,
  type VotingApi,
  type VotingSummaryItem,
} from './contracts';
import {
  AdminRole,
  applyLocalDemoDirectorRole,
  DEMO_DIRECTOR_IDENTIFIER,
  type AppSession,
} from '../session';

const abebeMemberId = 'abebe-kebede';
const meseretMemberId = 'meseret-alemu';
const mekdesMemberId = 'mekdes-ali';

const demoRecommendationCollections: Record<string, RecommendationCollection> = {
  [abebeMemberId]: {
    title: 'Smart Recommendations',
    recommendations: [
      {
        id: 'staff-high-value-1',
        customerId: 'BUN-100001',
        audienceType: 'staff',
        type: 'customer_followup',
        title: 'High-Value Relationship Follow-Up',
        description: 'Customer balance and shareholder profile suggest premium servicing potential.',
        reason: 'High average balances and strong product engagement.',
        actionLabel: 'Open relationship follow-up',
        actionRoute: '/admin/relationships',
        score: 0.78,
        priority: 73,
        badge: 'High relevance',
        status: 'new',
      },
      {
        id: 'staff-loan-1',
        customerId: 'BUN-100001',
        audienceType: 'staff',
        type: 'customer_followup',
        title: 'Review for Loan Top-Up Opportunity',
        description: 'Customer shows strong repayment behavior and may suit a pre-approved review.',
        reason: 'Repayment pattern is healthy with no overdue signal.',
        actionLabel: 'Open loan workflow',
        actionRoute: '/admin/loans',
        score: 0.85,
        priority: 81,
        badge: 'Opportunity',
        status: 'viewed',
      },
    ],
  },
  [meseretMemberId]: {
    title: 'Smart Recommendations',
    recommendations: [
      {
        id: 'staff-kyc-1',
        customerId: 'BUN-100003',
        audienceType: 'staff',
        type: 'service_completion',
        title: 'Follow Up on KYC Completion',
        description: 'Customer access can improve after Fayda and profile verification are completed.',
        reason: 'KYC remains incomplete and may block additional services.',
        actionLabel: 'Review customer profile',
        actionRoute: '/admin/customers',
        score: 0.94,
        priority: 94,
        badge: 'Action needed',
        status: 'new',
      },
      {
        id: 'staff-autopay-1',
        customerId: 'BUN-100003',
        audienceType: 'staff',
        type: 'autopay_recommendation',
        title: 'Offer AutoPay Enrollment',
        description: 'Customer is still making repeated manual payments that could move to AutoPay.',
        reason: 'Repeated branch payment behavior indicates automation opportunity.',
        actionLabel: 'Open support guidance',
        actionRoute: '/admin/support',
        score: 0.86,
        priority: 82,
        badge: 'Opportunity',
        status: 'new',
      },
    ],
  },
  [mekdesMemberId]: {
    title: 'Smart Recommendations',
    recommendations: [
      {
        id: 'staff-repayment-1',
        customerId: 'BUN-100004',
        audienceType: 'staff',
        type: 'repayment_support',
        title: 'Offer Repayment Support Setup',
        description: 'Customer has loan repayment activity without payment automation.',
        reason: 'Autopay or reminders could reduce repayment friction.',
        actionLabel: 'Contact customer',
        actionRoute: '/admin/relationships',
        score: 0.8,
        priority: 77,
        badge: 'Recommended',
        status: 'new',
      },
    ],
  },
};

export class DemoAuthApi implements AuthApi {
  async login(payload: StaffLoginPayload): Promise<AppSession> {
    await wait(250);

    const normalized = payload.identifier.trim().toLowerCase();

    if (normalized.includes('school')) {
      return {
        sessionType: 'school',
        userId: 'school_admin_1',
        fullName: 'Meron Fenta',
        schoolId: 'school_blue_nile',
        schoolName: 'Blue Nile Academy',
        roleLabel: 'School Administrator',
        identifier: payload.identifier,
        email: 'admin@bluenileacademy.school',
        branchName: 'Bahir Dar Branch',
        permissions: ['school.console'],
      };
    }

    if (normalized.includes('head') || normalized.includes('admin')) {
      return applyLocalDemoDirectorRole(
        {
          sessionType: 'admin',
          userId: 'staff_admin_1',
          fullName: 'Selamawit Assefa',
          role: AdminRole.HEAD_OFFICE_MANAGER,
          identifier: payload.identifier,
          email: 'admin.head-office@bunnabank.com',
          branchName: 'Head Office',
          permissions: ['dashboard.institution', 'analytics.district', 'risk.monitor'],
        },
        normalized === DEMO_DIRECTOR_IDENTIFIER ? normalized : payload.identifier,
      );
    }

    if (normalized.includes('district')) {
      return {
        sessionType: 'admin',
        userId: 'staff_district_1',
        fullName: 'Mulugeta Tadesse',
        role: AdminRole.DISTRICT_MANAGER,
        identifier: payload.identifier,
        email: 'manager.north-district@bunnabank.com',
        districtId: 'district_bahir_dar',
        districtName: 'Bahir Dar District',
        permissions: ['dashboard.district', 'analytics.branch', 'loans.district'],
      };
    }

    if (normalized.includes('support')) {
      return {
        sessionType: 'admin',
        userId: 'staff_support_1',
        fullName: 'Rahel Desta',
        role: AdminRole.SUPPORT_AGENT,
        identifier: payload.identifier,
        email: 'agent.support@bunnabank.com',
        branchId: 'branch_bahir_dar',
        branchName: 'Bahir Dar Branch',
        districtId: 'district_bahir_dar',
        districtName: 'Bahir Dar District',
        permissions: ['support.assigned'],
      };
    }

    return {
      sessionType: 'admin',
      userId: 'staff_branch_1',
      fullName: 'Hana Worku',
      role: AdminRole.BRANCH_MANAGER,
      identifier: payload.identifier,
      email: 'manager.bahirdar-branch@bunnabank.com',
      branchId: 'branch_bahir_dar',
      branchName: 'Bahir Dar Branch',
      districtId: 'district_bahir_dar',
      districtName: 'Bahir Dar District',
      permissions: ['dashboard.branch', 'employees.branch', 'loans.branch'],
    };
  }

  async checkExistingAccount(payload: {
    phoneNumber?: string;
    faydaFin?: string;
    email?: string;
  }) {
    await wait(80);

    const normalizedPhone = payload.phoneNumber?.trim();
    const customerIdByPhone = new Map([
      ['0911000001', 'BUN-100001'],
      ['0911000002', 'BUN-100003'],
      ['0911000003', 'BUN-100004'],
    ]);

    const resolvedCustomerId = normalizedPhone
      ? customerIdByPhone.get(normalizedPhone)
      : undefined;

    if (resolvedCustomerId) {
      return {
        exists: true,
        matchType: 'phone' as const,
        message: 'An account already exists for this phone number.',
        customerId: resolvedCustomerId,
      };
    }

    return {
      exists: false,
      message: 'No existing account was found. You can continue onboarding.',
    };
  }

  async verifyStaffStepUp(payload: { password: string; memberId: string }) {
    await wait(80);

    if (payload.password !== 'demo-pass') {
      throw new Error('Invalid credentials.');
    }

    return {
      stepUpToken: 'demo-step-up-token',
      verifiedAt: '2026-03-18T12:00:00.000Z',
      expiresInSeconds: 300,
      method: 'password_recheck',
    };
  }
}

export class DemoSupportApi implements SupportApi {
  async getOpenChats(): Promise<SupportChatSummaryItem[]> {
    await wait(160);

    return [
      {
        conversationId: 'chat_open_1',
        memberId: abebeMemberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phoneNumber: '0911000001',
        branchName: 'Bahir Dar Branch',
        status: 'waiting_agent',
        issueCategory: 'loan_issue',
        memberType: 'shareholder',
        priority: 'high',
        escalationFlag: true,
        responseDueAt: '2026-03-11T09:30:00.000Z',
        slaState: 'breached',
        lastMessage: 'I need an update on my loan.',
        updatedAt: '2026-03-11T09:12:00.000Z',
      },
    ];
  }

  async getAssignedChats(): Promise<SupportChatSummaryItem[]> {
    await wait(160);

    return [
      {
        conversationId: 'chat_assigned_1',
        memberId: meseretMemberId,
        customerId: 'BUN-100003',
        memberName: 'Meseret Alemu',
        phoneNumber: '0911000002',
        branchName: 'Gondar Branch',
        status: 'waiting_customer',
        issueCategory: 'payment_issue',
        memberType: 'member',
        priority: 'normal',
        escalationFlag: false,
        responseDueAt: '2026-03-11T11:05:00.000Z',
        slaState: 'attention',
        lastMessage: 'Your payment confirmation is being reviewed.',
        updatedAt: '2026-03-11T10:20:00.000Z',
      },
    ];
  }

  async getResolvedChats(): Promise<SupportChatSummaryItem[]> {
    await wait(120);

    return [
      {
        conversationId: 'chat_resolved_1',
        memberId: mekdesMemberId,
        customerId: 'BUN-100004',
        memberName: 'Tigist Bekele',
        phoneNumber: '0911000003',
        branchName: 'Debre Markos Branch',
        status: 'resolved',
        issueCategory: 'kyc_issue',
        memberType: 'member',
        priority: 'low',
        escalationFlag: false,
        responseDueAt: '2026-03-10T17:40:00.000Z',
        slaState: 'on_track',
        lastMessage: 'Your account access issue was resolved.',
        updatedAt: '2026-03-10T16:40:00.000Z',
      },
    ];
  }

  async getChat(chatId: string): Promise<SupportChatDetail> {
    await wait(140);

    return {
      conversationId: chatId,
      memberId:
        chatId === 'chat_open_1'
          ? abebeMemberId
          : chatId === 'chat_assigned_1'
            ? meseretMemberId
            : mekdesMemberId,
      customerId:
        chatId === 'chat_open_1'
          ? 'BUN-100001'
          : chatId === 'chat_assigned_1'
            ? 'BUN-100003'
            : 'BUN-100004',
      memberName:
        chatId === 'chat_open_1'
          ? 'Abebe Kebede'
          : chatId === 'chat_assigned_1'
            ? 'Meseret Alemu'
            : 'Tigist Bekele',
      phoneNumber:
        chatId === 'chat_open_1'
          ? '0911000001'
          : chatId === 'chat_assigned_1'
            ? '0911000002'
            : '0911000003',
      branchName:
        chatId === 'chat_open_1'
          ? 'Bahir Dar Branch'
          : chatId === 'chat_assigned_1'
            ? 'Gondar Branch'
            : 'Debre Markos Branch',
      status:
        chatId === 'chat_open_1'
          ? 'waiting_agent'
          : chatId === 'chat_assigned_1'
            ? 'waiting_customer'
            : 'resolved',
      issueCategory:
        chatId === 'chat_open_1'
          ? 'loan_issue'
          : chatId === 'chat_assigned_1'
            ? 'payment_issue'
            : 'kyc_issue',
      memberType: chatId === 'chat_open_1' ? 'shareholder' : 'member',
      priority: chatId === 'chat_open_1' ? 'high' : 'normal',
      responseDueAt:
        chatId === 'chat_open_1'
          ? '2026-03-11T09:30:00.000Z'
          : '2026-03-11T11:05:00.000Z',
      slaState: chatId === 'chat_open_1' ? 'breached' : 'attention',
      assignedAgentId: chatId === 'chat_open_1' ? undefined : 'support_1',
      assignedToStaffName: chatId === 'chat_open_1' ? undefined : 'Rahel Desta',
      messages: [
        {
          id: 'msg_1',
          senderType: 'customer',
          senderName:
            chatId === 'chat_open_1'
              ? 'Abebe Kebede'
              : chatId === 'chat_assigned_1'
                ? 'Meseret Alemu'
                : 'Tigist Bekele',
          message: 'I need help with this issue.',
          createdAt: '2026-03-11T09:00:00.000Z',
        },
        {
          id: 'msg_2',
          senderType: chatId === 'chat_open_1' ? 'system' : 'agent',
          senderName: chatId === 'chat_open_1' ? 'Bunna Bank Assistant' : 'Rahel Desta',
          message:
              chatId === 'chat_open_1'
                ? 'An agent can join if you need more help.'
                : 'Your request is being handled now.',
          createdAt: '2026-03-11T09:05:00.000Z',
        },
      ],
    };
  }

  async assignChat(chatId: string): Promise<SupportChatDetail> {
    return this.getChat(chatId);
  }

  async reply(chatId: string, _message: string): Promise<SupportChatDetail> {
    return this.getChat(chatId);
  }

  async resolve(chatId: string): Promise<SupportChatDetail> {
    return this.getChat(chatId);
  }

  async close(chatId: string): Promise<SupportChatDetail> {
    return this.getChat(chatId);
  }

  async updateStatus(chatId: string, _status: string): Promise<SupportChatDetail> {
    return this.getChat(chatId);
  }
}

const demoServiceRequests: ServiceRequestDetail[] = [
  {
    id: 'svc_1',
    memberId: abebeMemberId,
    customerId: 'BUN-100001',
    memberName: 'Abebe Kebede',
    phoneNumber: '0911000001',
    branchId: 'branch_bahir_dar',
    districtId: 'district_bahir_dar',
    branchName: 'Bahir Dar Branch',
    type: 'failed_transfer',
    title: 'Interbank transfer failed',
    description: 'A transfer to another bank was debited but did not arrive.',
    status: 'under_review',
    latestNote: 'Operations team is validating the transfer reference.',
    createdAt: '2026-03-10T09:20:00.000Z',
    updatedAt: '2026-03-11T10:00:00.000Z',
    payload: {
      amount: 12000,
      referenceNumber: 'TRX-2026-001',
    },
    attachments: ['transfer_receipt.png'],
    assignedToStaffId: 'staff_support_1',
    assignedToStaffName: 'Rahel Desta',
    timeline: [
      {
        id: 'svc_1_evt_1',
        actorType: 'member',
        actorName: 'Abebe Kebede',
        eventType: 'created',
        toStatus: 'submitted',
        note: 'Customer submitted the transfer complaint.',
        createdAt: '2026-03-10T09:20:00.000Z',
      },
      {
        id: 'svc_1_evt_2',
        actorType: 'staff',
        actorName: 'Rahel Desta',
        eventType: 'status_updated',
        fromStatus: 'submitted',
        toStatus: 'under_review',
        note: 'Operations team is validating the transfer reference.',
        createdAt: '2026-03-10T11:10:00.000Z',
      },
    ],
  },
  {
    id: 'svc_2',
    memberId: meseretMemberId,
    customerId: 'BUN-100003',
    memberName: 'Meseret Alemu',
    phoneNumber: '0911000002',
    branchId: 'branch_gondar',
    districtId: 'district_gondar',
    branchName: 'Gondar Branch',
    type: 'phone_update',
    title: 'Phone number update request',
    description: 'Customer requested to replace the number linked to the account.',
    status: 'awaiting_customer',
    latestNote: 'Please upload a clearer selfie verification image.',
    createdAt: '2026-03-09T14:20:00.000Z',
    updatedAt: '2026-03-11T08:30:00.000Z',
    payload: {
      requestedPhoneNumber: '0911000099',
    },
    attachments: ['fayda-front.jpg', 'selfie.jpg'],
    assignedToStaffId: 'staff_district_1',
    assignedToStaffName: 'Mulugeta Tadesse',
    timeline: [
      {
        id: 'svc_2_evt_1',
        actorType: 'member',
        actorName: 'Meseret Alemu',
        eventType: 'created',
        toStatus: 'submitted',
        note: 'Customer submitted the phone update request.',
        createdAt: '2026-03-09T14:20:00.000Z',
      },
      {
        id: 'svc_2_evt_2',
        actorType: 'staff',
        actorName: 'Mulugeta Tadesse',
        eventType: 'status_updated',
        fromStatus: 'submitted',
        toStatus: 'awaiting_customer',
        note: 'Please upload a clearer selfie verification image.',
        createdAt: '2026-03-11T08:30:00.000Z',
      },
    ],
  },
  {
    id: 'svc_3',
    memberId: mekdesMemberId,
    customerId: 'BUN-100004',
    memberName: 'Mekdes Ali',
    phoneNumber: '0911000004',
    branchId: 'branch_addis_ababa_main',
    districtId: 'district_addis_ababa',
    branchName: 'Addis Ababa Main Branch',
    type: 'account_relationship',
    title: 'Joint account relationship request',
    description: 'Customer requested to add a spouse relationship for joint account servicing.',
    status: 'under_review',
    latestNote: 'Relationship evidence is under branch review.',
    createdAt: '2026-03-08T10:05:00.000Z',
    updatedAt: '2026-03-10T16:10:00.000Z',
    payload: {
      relationshipType: 'spouse',
      relatedMemberNumber: 'BUN-100112',
      relatedCustomerId: 'BUN-100112',
    },
    attachments: ['marriage-certificate.pdf'],
    assignedToStaffId: 'staff_branch_2',
    assignedToStaffName: 'Hanna Bekele',
    timeline: [
      {
        id: 'svc_3_evt_1',
        actorType: 'member',
        actorName: 'Mekdes Ali',
        eventType: 'created',
        toStatus: 'submitted',
        note: 'Customer submitted the account relationship request.',
        createdAt: '2026-03-08T10:05:00.000Z',
      },
      {
        id: 'svc_3_evt_2',
        actorType: 'staff',
        actorName: 'Hanna Bekele',
        eventType: 'status_updated',
        fromStatus: 'submitted',
        toStatus: 'under_review',
        note: 'Relationship evidence is under branch review.',
        createdAt: '2026-03-10T16:10:00.000Z',
      },
    ],
  },
  {
    id: 'svc_4',
    memberId: abebeMemberId,
    customerId: 'BUN-100001',
    memberName: 'Abebe Kebede',
    phoneNumber: '0911000001',
    branchId: 'branch_bahir_dar',
    districtId: 'district_bahir_dar',
    branchName: 'Bahir Dar Branch',
    type: 'atm_card_request',
    title: 'ATM card issuance request',
    description: 'Customer requested debit card issuance with branch pickup.',
    status: 'under_review',
    latestNote: 'Branch team confirmed the request and is preparing card production.',
    createdAt: '2026-03-09T08:40:00.000Z',
    updatedAt: '2026-03-09T09:15:00.000Z',
    payload: {
      preferredBranch: 'Bahir Dar Branch',
      cardType: 'debit',
      reason: 'New card issuance for active savings account.',
    },
    attachments: ['front-1001.png', 'back-1001.png'],
    assignedToStaffId: 'staff_support_1',
    assignedToStaffName: 'Rahel Desta',
    timeline: [
      {
        id: 'svc_4_evt_1',
        actorType: 'member',
        actorName: 'Abebe Kebede',
        eventType: 'created',
        toStatus: 'submitted',
        note: 'Customer submitted the ATM card request.',
        createdAt: '2026-03-09T08:40:00.000Z',
      },
      {
        id: 'svc_4_evt_2',
        actorType: 'staff',
        actorName: 'Rahel Desta',
        eventType: 'status_updated',
        fromStatus: 'submitted',
        toStatus: 'under_review',
        note: 'Branch team confirmed the request and is preparing card production.',
        createdAt: '2026-03-09T09:15:00.000Z',
      },
    ],
  },
];

const demoCardOperations: CardOperationItem[] = [
  {
    id: 'card_req_1',
    memberId: 'abebe-kebede',
    cardId: 'card_1',
    requestType: 'new_issue',
    status: 'under_review',
    preferredBranch: 'Bahir Dar Branch',
    reason: 'New ATM card issuance for a newly approved member account.',
    createdAt: '2026-03-10T09:00:00.000Z',
    updatedAt: '2026-03-12T11:15:00.000Z',
  },
  {
    id: 'card_req_2',
    memberId: 'meseret-alemu',
    cardId: 'card_2',
    requestType: 'replacement',
    status: 'submitted',
    preferredBranch: 'Gondar Branch',
    reason: 'Customer reported a damaged card and requested replacement.',
    createdAt: '2026-03-11T13:40:00.000Z',
    updatedAt: '2026-03-11T13:40:00.000Z',
  },
  {
    id: 'card_req_3',
    memberId: 'mekdes-ali',
    cardId: 'card_3',
    requestType: 'replacement',
    status: 'completed',
    preferredBranch: 'Addis Ababa Main Branch',
    reason: 'Replacement card was issued and collected.',
    createdAt: '2026-03-06T08:20:00.000Z',
    updatedAt: '2026-03-09T15:05:00.000Z',
  },
];

export class DemoServiceRequestApi implements ServiceRequestApi {
  async getRequests() {
    await wait(120);

    const items: ServiceRequestItem[] = demoServiceRequests.map((item) => ({
      id: item.id,
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      phoneNumber: item.phoneNumber,
      branchId: item.branchId,
      districtId: item.districtId,
      branchName: item.branchName,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status,
      payload: item.payload,
      dueAt: item.dueAt,
      slaState: item.slaState,
      latestNote: item.latestNote,
      assignedToStaffId: item.assignedToStaffId,
      assignedToStaffName: item.assignedToStaffName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      items,
      total: items.length,
      page: 1,
      limit: 20,
    };
  }

  async getRequest(requestId: string) {
    await wait(120);
    return (
      demoServiceRequests.find((item) => item.id === requestId) ??
      demoServiceRequests[0]
    );
  }

  async getSecurityReviewMetrics(): Promise<SecurityReviewMetrics> {
    await wait(60);
    return buildDemoSecurityReviewMetrics(demoServiceRequests);
  }

  async reportSecurityReviewMetricsContractIssue(): Promise<{ ok: true }> {
    await wait(40);
    return { ok: true };
  }

  async createSecurityReview(payload: {
    memberId: string;
    memberLabel: string;
    reviewerLabel: string;
    failureCount: number;
    escalationThreshold: number;
    latestFailureAt: string;
    reasonCodes?: string[];
    auditIds?: string[];
  }) {
    await wait(120);

    const existing = demoServiceRequests.find(
      (item) =>
        item.memberId === payload.memberId &&
        item.type === 'security_review' &&
        !['completed', 'rejected', 'cancelled'].includes(item.status),
    );

    if (existing) {
      throw new Error(`An active security review already exists for ${payload.memberLabel}.`);
    }

    const created: ServiceRequestDetail = {
      id: `svc_security_${demoServiceRequests.length + 1}`,
      memberId: payload.memberId,
      customerId: `BUN-${payload.memberId.slice(-6).padStart(6, '0')}`,
      memberName: payload.memberLabel,
      branchName: 'Head Office Review',
      type: 'security_review',
      title: `Security review: repeated step-up failures for ${payload.memberLabel}`,
      description: `${payload.failureCount} failed high-risk step-up attempts were observed in the last 7 days.`,
      status: 'submitted',
      dueAt: '2026-03-13T11:15:00.000Z',
      slaState: 'on_track',
      investigationStartedAt: undefined,
      investigationStartedBy: undefined,
      investigationStalledAt: undefined,
      escalatedAt: undefined,
      escalatedBy: undefined,
      followUpState: 'not_breached',
      breachAcknowledgedAt: undefined,
      breachAcknowledgedBy: undefined,
      latestNote: 'Flagged from the audit step-up failure watchlist.',
      createdAt: '2026-03-12T11:15:00.000Z',
      updatedAt: '2026-03-12T11:15:00.000Z',
      payload: {
        source: 'audit_step_up_failure_watchlist',
        queue: 'security_review',
        slaHours: 24,
        dueAt: '2026-03-13T11:15:00.000Z',
        escalationRole: 'head_office_manager',
        failureCount7d: payload.failureCount,
        escalationThreshold: payload.escalationThreshold,
        latestFailureAt: payload.latestFailureAt,
        reviewerLabel: payload.reviewerLabel,
        memberLabel: payload.memberLabel,
        reasonCodes: payload.reasonCodes ?? [],
        relatedAuditIds: payload.auditIds ?? [],
      },
      attachments: [],
      assignedToStaffId: 'staff_head_office_1',
      assignedToStaffName: 'Demo Head Office Reviewer',
      timeline: [
        {
          id: `svc_security_evt_${demoServiceRequests.length + 1}`,
          actorType: 'staff',
          actorName: 'Demo Head Office Reviewer',
          eventType: 'security_review_created',
          toStatus: 'submitted',
          note: 'Created from repeated step-up failure watchlist.',
          createdAt: '2026-03-12T11:15:00.000Z',
        },
      ],
    };

    demoServiceRequests.unshift(created);
    return created;
  }

  async assignToCurrentReviewer(requestId: string) {
    await wait(120);
    const current =
      demoServiceRequests.find((item) => item.id === requestId) ?? demoServiceRequests[0];

    const updated: ServiceRequestDetail = {
      ...current,
      latestNote: 'Assigned to Demo Head Office Reviewer for active investigation.',
      assignedToStaffId: 'staff_head_office_1',
      assignedToStaffName: 'Demo Head Office Reviewer',
      slaState: current.slaState ?? 'on_track',
      investigationStartedAt:
        current.investigationStartedAt ?? '2026-03-12T12:05:00.000Z',
      investigationStartedBy:
        current.investigationStartedBy ?? 'Demo Head Office Reviewer',
      updatedAt: '2026-03-12T12:05:00.000Z',
      timeline: [
        ...(current.timeline ?? []),
        {
          id: `${current.id}_evt_assign_${(current.timeline?.length ?? 0) + 1}`,
          actorType: 'staff',
          actorName: 'Demo Head Office Reviewer',
          eventType: 'assigned',
          fromStatus: current.status,
          toStatus: current.status,
          note: 'Assigned to Demo Head Office Reviewer for active investigation.',
          createdAt: '2026-03-12T12:05:00.000Z',
        },
      ],
    };

    const index = demoServiceRequests.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      demoServiceRequests[index] = updated;
    }

    return updated;
  }

  async acknowledgeBreach(requestId: string) {
    await wait(120);
    const current =
      demoServiceRequests.find((item) => item.id === requestId) ?? demoServiceRequests[0];

    const updated: ServiceRequestDetail = {
      ...current,
      breachAcknowledgedAt:
        current.breachAcknowledgedAt ?? '2026-03-12T12:10:00.000Z',
      breachAcknowledgedBy:
        current.breachAcknowledgedBy ?? 'Demo Head Office Reviewer',
      followUpState:
        current.investigationStartedAt != null
          ? 'investigation_started'
          : 'awaiting_investigation',
      latestNote: 'SLA breach acknowledged by Demo Head Office Reviewer.',
      updatedAt: '2026-03-12T12:10:00.000Z',
      timeline: [
        ...(current.timeline ?? []),
        {
          id: `${current.id}_evt_ack_${(current.timeline?.length ?? 0) + 1}`,
          actorType: 'staff',
          actorName: 'Demo Head Office Reviewer',
          eventType: 'status_updated',
          fromStatus: current.status,
          toStatus: current.status,
          note: 'SLA breach acknowledged by Demo Head Office Reviewer.',
          createdAt: '2026-03-12T12:10:00.000Z',
        },
      ],
    };

    const index = demoServiceRequests.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      demoServiceRequests[index] = updated;
    }

    return updated;
  }

  async escalateStalled(requestId: string) {
    await wait(120);
    const current =
      demoServiceRequests.find((item) => item.id === requestId) ?? demoServiceRequests[0];

    const updated: ServiceRequestDetail = {
      ...current,
      assignedToStaffId: 'staff_head_office_manager_1',
      assignedToStaffName: 'Demo Head Office Manager',
      escalatedAt: '2026-03-12T14:20:00.000Z',
      escalatedBy: 'Demo Head Office Manager',
      investigationStartedAt:
        current.investigationStartedAt ?? '2026-03-12T14:20:00.000Z',
      investigationStartedBy:
        current.investigationStartedBy ?? 'Demo Head Office Manager',
      followUpState: 'investigation_started',
      latestNote: 'Stalled investigation escalated to Demo Head Office Manager.',
      updatedAt: '2026-03-12T14:20:00.000Z',
      timeline: [
        ...(current.timeline ?? []),
        {
          id: `${current.id}_evt_escalate_${(current.timeline?.length ?? 0) + 1}`,
          actorType: 'staff',
          actorName: 'Demo Head Office Manager',
          eventType: 'assigned',
          fromStatus: current.status,
          toStatus: current.status,
          note: 'Stalled investigation escalated to Demo Head Office Manager.',
          createdAt: '2026-03-12T14:20:00.000Z',
        },
      ],
    };

    const index = demoServiceRequests.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      demoServiceRequests[index] = updated;
    }

    return updated;
  }

  async downloadAttachment(storageKey: string): Promise<Blob> {
    await wait(80);
    return new Blob([`Demo attachment for ${storageKey}`], {
      type: inferDemoMimeType(storageKey),
    });
  }

  async getAttachmentMetadata(storageKey: string) {
    await wait(40);
    return {
      provider: 'local' as const,
      storageKey,
      originalFileName: formatDemoAttachmentName(storageKey),
      mimeType: inferDemoMimeType(storageKey),
      sizeBytes: 24_576,
    };
  }

  async updateStatus(requestId: string, payload: { status: any; note?: string }) {
    await wait(120);
    const current =
      demoServiceRequests.find((item) => item.id === requestId) ?? demoServiceRequests[0];

    return {
      ...current,
      status: payload.status,
      latestNote: payload.note ?? current.latestNote,
      updatedAt: '2026-03-12T09:45:00.000Z',
      timeline: [
        ...(current.timeline ?? []),
        {
          id: `${current.id}_evt_${(current.timeline?.length ?? 0) + 1}`,
          actorType: 'staff',
          actorName: 'Demo Operator',
          eventType: 'status_updated',
          fromStatus: current.status,
          toStatus: payload.status,
          note: payload.note,
          createdAt: '2026-03-12T09:45:00.000Z',
        },
      ],
    };
  }
}

function buildDemoSecurityReviewMetrics(items: ServiceRequestDetail[]): SecurityReviewMetrics {
  const securityReviewItems = items.filter((item) => item.type === 'security_review');
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const currentWindowStart = now - sevenDaysMs;
  const previousWindowStart = now - 2 * sevenDaysMs;
  const parseTimestamp = (value?: string) => {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  };
  const countWithinWindow = (
    selector: (item: ServiceRequestDetail) => string | undefined,
    start: number,
    end?: number,
  ) =>
    securityReviewItems.filter((item) => {
      const timestamp = parseTimestamp(selector(item));
      return timestamp != null && timestamp >= start && (end == null || timestamp < end);
    }).length;

  return {
    metadata: {
      contractVersion: 'security_review_metrics.v2',
      currentStateBasis: 'live_service_request_state',
      historyBasis: 'retained_daily_aggregates_with_event_fallback',
      historyEventTypes: ['investigation_stalled', 'stalled_case_escalated'],
      retentionWindowDays: 14,
    },
    currentState: {
      openCount: securityReviewItems.filter(
        (item) => !['completed', 'rejected', 'cancelled'].includes(item.status),
      ).length,
      breachedCount: securityReviewItems.filter((item) => item.slaState === 'overdue').length,
      dueSoonCount: securityReviewItems.filter((item) => item.slaState === 'due_soon').length,
      stalledCount: securityReviewItems.filter(
        (item) => item.followUpState === 'investigation_stalled',
      ).length,
      takeoverCount: securityReviewItems.filter(
        (item) => typeof item.escalatedAt === 'string' && item.escalatedAt.trim().length > 0,
      ).length,
    },
    history: {
      stalledLast7Days: countWithinWindow(
        (item) => item.investigationStalledAt,
        currentWindowStart,
      ),
      stalledPrevious7Days: countWithinWindow(
        (item) => item.investigationStalledAt,
        previousWindowStart,
        currentWindowStart,
      ),
      takeoversLast7Days: countWithinWindow((item) => item.escalatedAt, currentWindowStart),
      takeoversPrevious7Days: countWithinWindow(
        (item) => item.escalatedAt,
        previousWindowStart,
        currentWindowStart,
      ),
    },
  };
}

export class DemoCardOperationsApi implements CardOperationsApi {
  async getRequests() {
    await wait(120);
    return demoCardOperations;
  }

  async getRequest(requestId: string): Promise<CardOperationDetail> {
    await wait(120);
    const current =
      demoCardOperations.find((item) => item.id === requestId) ?? demoCardOperations[0];

    return {
      ...current,
      memberName:
        current.memberId === 'abebe-kebede'
          ? 'Abebe Kebede'
          : current.memberId === 'meseret-alemu'
            ? 'Meseret Alemu'
            : 'Mekdes Ali',
      customerId:
        current.memberId === 'abebe-kebede'
          ? 'BUN-100001'
          : current.memberId === 'meseret-alemu'
            ? 'BUN-100003'
            : 'BUN-100004',
      phoneNumber:
        current.memberId === 'abebe-kebede'
          ? '0911000001'
          : current.memberId === 'meseret-alemu'
            ? '0911000002'
            : '0911000004',
      card: {
        id: current.cardId ?? 'card_demo',
        memberId: current.memberId,
        cardType: current.requestType === 'replacement' ? 'Debit Card' : 'ATM Card',
        last4: current.status === 'completed' ? '4821' : undefined,
        status:
          current.status === 'completed'
            ? 'active'
            : current.requestType === 'replacement'
              ? 'replacement_requested'
              : 'pending_issue',
        preferredBranch: current.preferredBranch,
        updatedAt: current.updatedAt,
      },
      timeline: [
        {
          id: `${current.id}_evt_1`,
          actorType: 'member',
          actorName:
            current.memberId === 'abebe-kebede'
              ? 'Abebe Kebede'
              : current.memberId === 'meseret-alemu'
                ? 'Meseret Alemu'
                : 'Mekdes Ali',
          eventType:
            current.requestType === 'replacement' ? 'replacement_requested' : 'requested',
          note: current.reason,
          createdAt: current.createdAt,
        },
      ],
    };
  }

  async updateStatus(
    requestId: string,
    payload: { status: CardOperationItem['status']; note?: string },
  ): Promise<CardOperationUpdateResult> {
    await wait(120);
    const current =
      demoCardOperations.find((item) => item.id === requestId) ?? demoCardOperations[0];
    const nextCardStatus: CardStatus =
      payload.status === 'completed'
        ? 'active'
        : payload.status === 'rejected'
          ? 'blocked'
          : current.requestType === 'replacement'
            ? 'replacement_requested'
            : 'pending_issue';

    return {
      card: {
        id: current.cardId ?? 'card_demo',
        memberId: current.memberId,
        cardType: current.requestType === 'replacement' ? 'Debit Card' : 'ATM Card',
        last4:
          current.status === 'completed' || payload.status === 'completed' ? '4821' : undefined,
        status: nextCardStatus,
        preferredBranch: current.preferredBranch,
        createdAt: current.createdAt,
        updatedAt: '2026-03-13T10:30:00.000Z',
      },
      request: {
        ...current,
        status: payload.status,
        reason: payload.note ?? current.reason,
        updatedAt: '2026-03-13T10:30:00.000Z',
      },
    };
  }
}

export class DemoPaymentOperationsApi implements PaymentOperationsApi {
  async getActivity() {
    await wait(120);

    return [
      {
        memberId: 'member_2',
        customerId: 'BUN-100002',
        memberName: 'Meseret Alemu',
        phone: '0911000002',
        branchName: 'Gondar Branch',
        openCases: 1,
        totalReceipts: 1,
        qrPayments: 0,
        schoolPayments: 1,
        disputeReceipts: 1,
        latestActivityAt: '2026-03-12T09:00:00.000Z',
      },
      {
        memberId: 'member_1',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phone: '0911000001',
        branchName: 'Bahir Dar Branch',
        openCases: 1,
        totalReceipts: 2,
        qrPayments: 1,
        schoolPayments: 0,
        disputeReceipts: 1,
        latestActivityAt: '2026-03-10T09:00:00.000Z',
      },
    ];
  }

  async getMemberReceipts(memberId: string): Promise<PaymentReceiptItem[]> {
    await wait(120);

    if (memberId === 'member_1') {
      return [
        {
          receiptId: 'receipt_qr_1',
          receiptType: 'qr_payment',
          sourceId: 'txn_qr_1',
          title: 'ABa Cafe',
          description: 'QR payment to ABa Cafe',
          status: 'successful',
          amount: 275,
          currency: 'ETB',
          transactionReference: 'QRP-2026-001',
          counterparty: 'ABa Cafe',
          channel: 'mobile',
          attachments: [],
          recordedAt: '2026-03-11T08:40:00.000Z',
          metadata: {
            qrPayload: 'merchant:aba-cafe',
          },
        },
        {
          receiptId: 'receipt_dispute_1',
          receiptType: 'payment_dispute',
          sourceId: 'svc_pay_1',
          title: 'Merchant charge dispute',
          description: 'Awaiting review.',
          status: 'submitted',
          amount: 12000,
          currency: 'ETB',
          transactionReference: 'TXN-2026-001',
          counterparty: 'Dashen Bank',
          attachments: ['receipt.png'],
          recordedAt: '2026-03-10T09:00:00.000Z',
          metadata: {
            occurredAt: '2026-03-09T14:30:00.000Z',
          },
        },
        {
          receiptId: 'receipt_school_1',
          receiptType: 'school_payment',
          sourceId: 'school_payment_1',
          title: 'Blue Nile Academy',
          description: 'School payment for Blue Nile Academy.',
          status: 'successful',
          amount: 1500,
          currency: 'ETB',
          channel: 'mobile',
          attachments: [],
          recordedAt: '2026-03-08T10:15:00.000Z',
          metadata: {
            studentId: 'ST-1001',
          },
        },
      ];
    }

    return [];
  }

  async downloadAttachment(storageKey: string): Promise<Blob> {
    await wait(80);
    return new Blob([`Demo attachment for ${storageKey}`], {
      type: inferDemoMimeType(storageKey),
    });
  }

  async getAttachmentMetadata(storageKey: string) {
    await wait(40);
    return {
      provider: 'local' as const,
      storageKey,
      originalFileName: formatDemoAttachmentName(storageKey),
      mimeType: inferDemoMimeType(storageKey),
      sizeBytes: 24_576,
    };
  }
}

const demoSchoolPortfolio: SchoolPortfolioItem[] = [
  {
    id: 'school_blue_nile',
    code: 'SCH-1001',
    name: 'Blue Nile Academy',
    branchName: 'Bahir Dar Branch',
    city: 'Bahir Dar',
    region: 'Bunna',
    status: 'active',
    students: 1240,
    openInvoices: 318,
    todayCollections: 184500,
  },
  {
    id: 'school_tana',
    code: 'SCH-1002',
    name: 'Lake Tana Preparatory School',
    branchName: 'Gondar Branch',
    city: 'Gondar',
    region: 'Bunna',
    status: 'onboarding',
    students: 860,
    openInvoices: 207,
    todayCollections: 93200,
  },
];

const demoSchoolInvoices: SchoolInvoiceItem[] = [
  {
    invoiceNo: 'INV-2026-0001',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1001',
    studentName: 'Bethel Alemu',
    total: 9500,
    paid: 3500,
    balance: 6000,
    status: 'partially_paid',
    dueDate: '2026-09-05',
  },
  {
    invoiceNo: 'INV-2026-0002',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1002',
    studentName: 'Mahlet Tadesse',
    total: 9500,
    paid: 9500,
    balance: 0,
    status: 'paid',
    dueDate: '2026-09-05',
  },
  {
    invoiceNo: 'INV-2026-0101',
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    studentId: 'ST-2001',
    studentName: 'Yohannes Kassahun',
    total: 7200,
    paid: 0,
    balance: 7200,
    status: 'open',
    dueDate: '2026-09-12',
  },
];

const demoSchoolCollections: SchoolCollectionItem[] = [
  {
    receiptNo: 'RCP-2026-0001',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1001',
    amount: 1500,
    channel: 'mobile',
    status: 'successful',
    reconciliationStatus: 'matched',
    recordedAt: '2026-03-08T10:15:00.000Z',
  },
  {
    receiptNo: 'RCP-2026-0002',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1002',
    amount: 9500,
    channel: 'branch',
    status: 'successful',
    reconciliationStatus: 'matched',
    recordedAt: '2026-03-09T08:25:00.000Z',
  },
  {
    receiptNo: 'RCP-2026-0101',
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    studentId: 'ST-2001',
    amount: 1200,
    channel: 'mobile',
    status: 'pending',
    reconciliationStatus: 'awaiting_settlement',
    recordedAt: '2026-03-10T11:05:00.000Z',
  },
];

const demoStudentRegistry: StudentRegistryItem[] = [
  {
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1001',
    fullName: 'Bethel Alemu',
    grade: 'Grade 7',
    section: 'A',
    guardianName: 'Alemu Bekele',
    guardianPhone: '0911000001',
    parentAccountNumber: 'BUN-100001',
    guardianStatus: 'linked',
    enrollmentStatus: 'active',
    academicYear: '2026',
    rollNumber: '07-001',
    status: 'active',
    paymentSummary: {
      totalInvoiced: 9500,
      totalPaid: 3500,
      outstandingBalance: 6000,
      paymentStatus: 'partially_paid',
      latestInvoiceNo: 'INV-2026-0001',
      latestInvoiceStatus: 'partially_paid',
      latestReceiptNo: 'RCP-2026-0001',
      latestPaymentAt: '2026-03-08T10:15:00.000Z',
      nextDueDate: '2026-09-05',
      monthlyFee: 1500,
    },
    performanceSummary: {
      studentId: 'ST-1001',
      latestReportPeriod: 'Term 2',
      latestAverage: 91,
      attendanceRate: 97,
      classRank: 3,
      behavior: 'excellent',
      teacherRemark: 'Consistently strong performance with excellent homework completion.',
      strengths: ['Mathematics', 'Reading comprehension'],
      improvementAreas: ['Keep practicing laboratory reports'],
      updatedAt: '2026-03-08T09:30:00.000Z',
    },
    parentUpdateSummary: 'Grade 7 · Term 2 average 91% · attendance 97%',
  },
  {
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1002',
    fullName: 'Mahlet Tadesse',
    grade: 'Grade 9',
    section: 'B',
    guardianName: 'Tadesse Worku',
    guardianPhone: '0911000007',
    parentAccountNumber: 'BUN-100007',
    guardianStatus: 'linked',
    enrollmentStatus: 'active',
    academicYear: '2026',
    rollNumber: '09-014',
    status: 'active',
    paymentSummary: {
      totalInvoiced: 9500,
      totalPaid: 9500,
      outstandingBalance: 0,
      paymentStatus: 'paid',
      latestInvoiceNo: 'INV-2026-0002',
      latestInvoiceStatus: 'paid',
      latestReceiptNo: 'RCP-2026-0002',
      latestPaymentAt: '2026-03-09T08:25:00.000Z',
      nextDueDate: '2026-09-05',
      monthlyFee: 1500,
    },
    performanceSummary: {
      studentId: 'ST-1002',
      latestReportPeriod: 'Term 2',
      latestAverage: 88,
      attendanceRate: 94,
      classRank: 6,
      behavior: 'good',
      teacherRemark: 'Steady progress across core subjects and active class participation.',
      strengths: ['Biology', 'English'],
      improvementAreas: ['Weekly revision discipline'],
      updatedAt: '2026-03-09T10:15:00.000Z',
    },
    parentUpdateSummary: 'Grade 9 · Term 2 average 88% · attendance 94%',
  },
  {
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    studentId: 'ST-2001',
    fullName: 'Yohannes Kassahun',
    grade: 'Grade 5',
    section: 'C',
    guardianName: 'Kassahun Molla',
    guardianPhone: '0911000008',
    parentAccountNumber: 'BUN-100008',
    guardianStatus: 'pending_verification',
    enrollmentStatus: 'awaiting_fee_assignment',
    academicYear: '2026',
    rollNumber: '05-022',
    status: 'pending_billing',
    paymentSummary: {
      totalInvoiced: 7200,
      totalPaid: 0,
      outstandingBalance: 7200,
      paymentStatus: 'unpaid',
      latestInvoiceNo: 'INV-2026-0101',
      latestInvoiceStatus: 'open',
      latestReceiptNo: 'RCP-2026-0101',
      latestPaymentAt: '2026-03-10T11:05:00.000Z',
      nextDueDate: '2026-09-12',
      monthlyFee: 1200,
    },
    performanceSummary: {
      studentId: 'ST-2001',
      latestReportPeriod: 'Term 2',
      latestAverage: 79,
      attendanceRate: 90,
      classRank: 12,
      behavior: 'watch',
      teacherRemark: 'Needs closer follow-up on assignments to improve term results.',
      strengths: ['Social studies', 'Class participation'],
      improvementAreas: ['Mathematics practice', 'Assignment completion'],
      updatedAt: '2026-03-10T11:20:00.000Z',
    },
    parentUpdateSummary: 'Grade 5 · Term 2 average 79% · attendance 90%',
  },
];

const demoParentStudentLinks = [
  {
    customerId: 'BUN-100001',
    studentId: 'ST-1001',
    status: 'active',
  },
];

const demoGuardianRecords: GuardianRecord[] = [
  {
    guardianId: 'GDN-1001',
    studentId: 'ST-1001',
    fullName: 'Alemu Bekele',
    phone: '0911000001',
    relationship: 'father',
    status: 'linked',
  },
  {
    guardianId: 'GDN-1002',
    studentId: 'ST-1002',
    fullName: 'Tadesse Worku',
    phone: '0911000007',
    relationship: 'mother',
    status: 'linked',
  },
];

const demoGuardianStudentLinks: GuardianStudentLinkItem[] = [
  {
    linkId: 'GSL-1001',
    studentId: 'ST-1001',
    guardianId: 'GDN-1001',
    memberCustomerId: 'BUN-100001',
    relationship: 'father',
    status: 'active',
  },
];

const demoFeePlans: FeePlanRecord[] = [
  {
    id: 'fp_2026_blue_nile_g7',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    academicYear: '2026',
    term: 'Term 1',
    grade: 'Grade 7',
    name: 'Grade 7 Standard Plan',
    status: 'active',
    items: [
      { label: 'Tuition', amount: 8000 },
      { label: 'Transport', amount: 1500 },
    ],
    total: 9500,
  },
];

export class DemoSchoolConsoleApi implements SchoolConsoleApi {
  private readonly schools = demoSchoolPortfolio.map((item) => ({ ...item }));
  private readonly registry = demoStudentRegistry.map((item) => ({ ...item }));
  private readonly invoices = demoSchoolInvoices.map((item) => ({ ...item }));
  private readonly collections = demoSchoolCollections.map((item) => ({ ...item }));
  private readonly feePlans = demoFeePlans.map((item) => ({ ...item }));
  private readonly guardians = demoGuardianRecords.map((item) => ({ ...item }));
  private readonly guardianLinks = demoGuardianStudentLinks.map((item) => ({ ...item }));

  async getFeePlans(schoolId?: string): Promise<FeePlanRecord[]> {
    await wait(60);
    return this.feePlans.filter((item) => !schoolId || item.schoolId === schoolId);
  }

  async createFeePlan(payload: {
    schoolId: string;
    schoolName: string;
    academicYear: string;
    term: string;
    grade: string;
    name: string;
    status: string;
    items: FeePlanItem[];
  }): Promise<FeePlanRecord> {
    await wait(60);
    const created = {
      id: `fp_demo_${String(this.feePlans.length + 1).padStart(4, '0')}`,
      ...payload,
      total: payload.items.reduce((sum, item) => sum + item.amount, 0),
    };
    this.feePlans.unshift(created);
    return created;
  }

  async getOverview(): Promise<SchoolConsoleOverview> {
    await wait(100);

    return {
      summary: {
        schools: this.schools.length,
        students: this.schools.reduce((sum, item) => sum + item.students, 0),
        openInvoices: this.schools.reduce(
          (sum, item) => sum + item.openInvoices,
          0,
        ),
        todayCollections: this.schools.reduce(
          (sum, item) => sum + item.todayCollections,
          0,
        ),
      },
      schools: this.schools,
      invoices: this.invoices,
      collections: this.collections,
      collectionSummary: {
        generatedAt: (() => {
          const recordedDates = this.collections.map((item) => item.recordedAt).sort();
          return recordedDates[recordedDates.length - 1] ?? new Date().toISOString();
        })(),
        receipts: this.collections.length,
        successful: this.collections.filter((item) => item.status === 'successful').length,
        pendingSettlement: this.collections.filter(
          (item) => item.reconciliationStatus === 'awaiting_settlement',
        ).length,
        totalAmount: this.collections.reduce((sum, item) => sum + item.amount, 0),
        matchedAmount: this.collections
          .filter((item) => item.reconciliationStatus === 'matched')
          .reduce((sum, item) => sum + item.amount, 0),
        awaitingSettlementAmount: this.collections
          .filter((item) => item.reconciliationStatus === 'awaiting_settlement')
          .reduce((sum, item) => sum + item.amount, 0),
        aging: buildDemoCollectionAging(this.collections),
      },
      schoolSettlements: buildDemoSchoolSettlements(this.collections),
    };
  }

  async getRegistry(filters: StudentRegistryFilter = {}): Promise<StudentRegistryItem[]> {
    await wait(80);

    const search = filters.search?.trim().toLowerCase();

    return this.registry.filter((item) => {
      if (filters.schoolId && item.schoolId !== filters.schoolId) {
        return false;
      }
      if (filters.grade && item.grade !== filters.grade) {
        return false;
      }
      if (filters.section && item.section !== filters.section) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      if (
        search &&
        ![
          item.studentId,
          item.fullName,
          item.guardianName,
          item.guardianPhone,
          item.parentAccountNumber,
          item.schoolName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }
      return true;
    });
  }

  async getStudentDetail(studentId: string): Promise<StudentDetail | null> {
    await wait(60);

    const student = this.registry.find((item) => item.studentId === studentId);
    if (!student) {
      return null;
    }

    return {
      student,
      guardians: this.guardians.filter((item) => item.studentId === studentId),
      guardianLinks: this.guardianLinks.filter((item) => item.studentId === studentId),
      invoices: this.invoices.filter((item) => item.studentId === studentId),
      collections: this.collections.filter((item) => item.studentId === studentId),
    };
  }

  async createGuardian(payload: {
    studentId: string;
    fullName: string;
    phone: string;
    relationship: string;
    status: string;
  }): Promise<GuardianRecord> {
    await wait(60);

    const created = {
      guardianId: `GDN-DEMO-${String(this.guardians.length + 1).padStart(4, '0')}`,
      ...payload,
    };
    this.guardians.unshift(created);
    return created;
  }

  async updateGuardian(
    guardianId: string,
    payload: {
      fullName?: string;
      phone?: string;
      relationship?: string;
      status?: string;
    },
  ): Promise<GuardianRecord> {
    await wait(60);

    const guardian = this.guardians.find((item) => item.guardianId === guardianId);
    if (!guardian) {
      throw new Error(`Guardian ${guardianId} not found.`);
    }

    Object.assign(guardian, payload);
    return guardian;
  }

  async createGuardianStudentLink(payload: {
    studentId: string;
    guardianId: string;
    memberCustomerId: string;
    relationship: string;
    status: string;
  }): Promise<GuardianStudentLinkItem> {
    await wait(60);

    const created = {
      linkId: `GSL-DEMO-${String(this.guardianLinks.length + 1).padStart(4, '0')}`,
      ...payload,
    };
    this.guardianLinks.unshift(created);
    return created;
  }

  async updateGuardianStudentLink(
    linkId: string,
    payload: {
      relationship?: string;
      status?: string;
    },
  ): Promise<GuardianStudentLinkItem> {
    await wait(60);

    const link = this.guardianLinks.find((item) => item.linkId === linkId);
    if (!link) {
      throw new Error(`Guardian-student link ${linkId} not found.`);
    }

    Object.assign(link, payload);
    return link;
  }

  async previewInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchPreviewResult> {
    await wait(60);

    const relevantStudents = this.registry.filter(
      (item) =>
        item.schoolId === payload.schoolId &&
        (!payload.grade || item.grade === payload.grade),
    );
    const grades = Array.from(new Set(relevantStudents.map((item) => item.grade)))
      .sort()
      .map((grade) => {
        const feePlan = this.feePlans.find(
          (item) =>
            item.schoolId === payload.schoolId &&
            item.grade === grade &&
            item.academicYear === (payload.academicYear ?? '2026') &&
            item.term === (payload.term ?? 'Term 1') &&
            item.status === 'active',
        );
        const totalStudents = relevantStudents.filter((item) => item.grade === grade).length;

        return {
          grade,
          totalStudents,
          activePlan: Boolean(feePlan),
          feePlanName: feePlan?.name,
          invoiceTotal: feePlan?.total ?? 0,
          canGenerate: Boolean(feePlan),
        };
      });

    return {
      schoolId: payload.schoolId,
      academicYear: payload.academicYear ?? '2026',
      term: payload.term ?? 'Term 1',
      totalStudents: relevantStudents.length,
      previewCount: grades
        .filter((item) => item.canGenerate)
        .reduce((sum, item) => sum + item.totalStudents, 0),
      missingGrades: grades.filter((item) => !item.activePlan).map((item) => item.grade),
      grades,
    };
  }

  async sendInvoiceReminder(invoiceNo: string): Promise<InvoiceReminderResult> {
    await wait(50);

    return {
      invoiceNo,
      status: 'queued',
      message: `Reminder queued for invoice ${invoiceNo}.`,
    };
  }

  async sendInvoiceReminders(invoiceNos: string[]): Promise<BulkInvoiceReminderResult> {
    await wait(70);
    return {
      invoiceNos,
      queued: invoiceNos.length,
      missing: 0,
      results: invoiceNos.map((invoiceNo) => ({
        invoiceNo,
        status: 'queued',
        message: `Reminder queued for invoice ${invoiceNo}.`,
      })),
      message: `Queued ${invoiceNos.length} invoice reminder${invoiceNos.length === 1 ? '' : 's'}.`,
    };
  }

  async generateInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchGenerationResult> {
    await wait(70);

    const generatedInvoices = this.registry.filter(
      (item) =>
        item.schoolId === payload.schoolId &&
        (!payload.grade || item.grade === payload.grade),
    ).length;

    return {
      schoolId: payload.schoolId,
      academicYear: payload.academicYear ?? '2026',
      term: payload.term ?? 'Term 1',
      generatedInvoices,
      message: `Generated ${generatedInvoices} invoice records for ${payload.schoolId}.`,
    };
  }

  async createSchool(payload: {
    name: string;
    code: string;
    branchName?: string;
    city?: string;
    region?: string;
  }): Promise<SchoolPortfolioItem> {
    await wait(80);

    const created = {
      id: `school_${payload.code.toLowerCase()}`,
      code: payload.code,
      name: payload.name,
      branchName: payload.branchName ?? 'Unassigned Branch',
      city: payload.city ?? 'Bahir Dar',
      region: payload.region ?? 'Bunna',
      status: 'onboarding',
      students: 0,
      openInvoices: 0,
      todayCollections: 0,
    };
    this.schools.unshift(created);
    return created;
  }

  async importStudents(payload: {
    schoolId: string;
    students: StudentImportRowInput[];
  }): Promise<StudentImportResult> {
    await wait(90);

    const school = this.schools.find((item) => item.id === payload.schoolId);
    const schoolName = school?.name ?? payload.schoolId;

    const items = payload.students.map((item) => ({
      schoolId: payload.schoolId,
      schoolName,
      studentId: this.resolveStudentId(item.studentId),
      fullName: item.fullName,
      grade: item.grade ?? 'Unassigned',
      section: item.section ?? 'Unassigned',
      guardianName: item.guardianName ?? 'Pending guardian',
      guardianPhone: item.guardianPhone ?? '',
      parentAccountNumber: item.parentAccountNumber ?? '',
      guardianStatus: item.guardianPhone ? 'linked' : 'pending_verification',
      enrollmentStatus: 'active',
      academicYear: '2026',
      rollNumber: undefined,
      status: 'active',
    }));

    this.registry.unshift(...items);
    if (school) {
      school.students += items.length;
    }

    return {
      schoolId: payload.schoolId,
      importedCount: payload.students.length,
      message: `Imported ${payload.students.length} students into ${payload.schoolId}.`,
      items,
    };
  }

  private resolveStudentId(requestedStudentId?: string) {
    const trimmedStudentId = requestedStudentId?.trim();
    if (trimmedStudentId) {
      return trimmedStudentId;
    }

    const highestSequence = this.registry.reduce((highest, item) => {
      const match = /^ST-(\d+)$/.exec(item.studentId.trim().toUpperCase());
      if (!match) {
        return highest;
      }

      return Math.max(highest, Number(match[1]));
    }, 0);

    return `ST-${String(highestSequence + 1).padStart(4, '0')}`;
  }
}

export class DemoParentPortalApi implements ParentPortalApi {
  private readonly invoices = demoSchoolInvoices.map((item) => ({ ...item }));
  private readonly collections = demoSchoolCollections.map((item) => ({ ...item }));
  private currentCustomerId = 'BUN-100001';

  async login(payload: {
    customerId: string;
    password: string;
  }): Promise<ParentPortalSession> {
    await wait(120);

    this.currentCustomerId = payload.customerId;

    return {
      userId: 'member_demo_parent',
      customerId: payload.customerId,
      fullName: 'Selamawit Molla',
      phone: '0911000001',
    };
  }

  async getLinkedStudents(): Promise<ParentStudentLookupItem[]> {
    await wait(70);

    const linkedStudentIds = new Set(
      demoParentStudentLinks
        .filter(
          (item) =>
            item.customerId === this.currentCustomerId && item.status === 'active',
        )
        .map((item) => item.studentId),
    );

    return demoStudentRegistry
      .filter((item) => linkedStudentIds.has(item.studentId))
      .map((item) => ({
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        studentId: item.studentId,
        fullName: item.fullName,
        grade: item.grade,
        section: item.section,
        guardianName: item.guardianName,
        guardianPhone: item.guardianPhone,
        parentAccountNumber: item.parentAccountNumber,
        status: item.status,
        paymentSummary: item.paymentSummary,
        performanceSummary: item.performanceSummary,
        parentUpdateSummary: item.parentUpdateSummary,
      }));
  }

  async searchStudents(query: string): Promise<ParentStudentLookupItem[]> {
    await wait(70);

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return demoStudentRegistry
      .filter((item) =>
        [
          item.studentId,
          item.fullName,
          item.guardianName,
          item.guardianPhone,
          item.parentAccountNumber,
          item.schoolName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map((item) => ({
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        studentId: item.studentId,
        fullName: item.fullName,
        grade: item.grade,
        section: item.section,
        guardianName: item.guardianName,
        guardianPhone: item.guardianPhone,
        parentAccountNumber: item.parentAccountNumber,
        status: item.status,
        paymentSummary: item.paymentSummary,
        performanceSummary: item.performanceSummary,
        parentUpdateSummary: item.parentUpdateSummary,
      }));
  }

  async getStudentAccount(studentId: string): Promise<ParentStudentAccount | null> {
    await wait(60);

    const linkedStudentIds = new Set(
      demoParentStudentLinks
        .filter(
          (item) =>
            item.customerId === this.currentCustomerId && item.status === 'active',
        )
        .map((item) => item.studentId),
    );
    const student = demoStudentRegistry.find(
      (item) => item.studentId === studentId && linkedStudentIds.has(item.studentId),
    );
    if (!student) {
      return null;
    }

    const invoices = this.invoices.filter((item) => item.studentId === studentId);
    const collections = this.collections.filter((item) => item.studentId === studentId);

    return {
      student: {
        schoolId: student.schoolId,
        schoolName: student.schoolName,
        studentId: student.studentId,
        fullName: student.fullName,
        grade: student.grade,
        section: student.section,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        status: student.status,
        paymentSummary: student.paymentSummary,
        performanceSummary: student.performanceSummary,
        parentUpdateSummary: student.parentUpdateSummary,
      },
      invoices,
      collections,
      outstandingBalance: invoices.reduce((sum, item) => sum + item.balance, 0),
      paymentSummary: student.paymentSummary,
      performanceSummary: student.performanceSummary,
      parentUpdateSummary: student.parentUpdateSummary,
    };
  }

  async submitPayment(payload: {
    invoiceNo: string;
    amount: number;
    channel?: string;
    payerName?: string;
    payerPhone?: string;
  }): Promise<ParentPortalPaymentResult> {
    await wait(80);

    const invoice = this.invoices.find((item) => item.invoiceNo === payload.invoiceNo);
    if (!invoice) {
      return {
        status: 'missing_invoice',
        message: `Invoice ${payload.invoiceNo} was not found.`,
      };
    }

    const appliedAmount = Math.min(invoice.balance, Math.max(0, payload.amount));
    invoice.paid += appliedAmount;
    invoice.balance = Math.max(0, invoice.total - invoice.paid);
    invoice.status =
      invoice.balance === 0 ? 'paid' : invoice.paid > 0 ? 'partially_paid' : 'open';

    const receiptNo = `RCP-DEMO-${String(this.collections.length + 1).padStart(4, '0')}`;
    this.collections.unshift({
      receiptNo,
      schoolId: invoice.schoolId,
      schoolName: invoice.schoolName,
      studentId: invoice.studentId,
      amount: appliedAmount,
      channel: payload.channel ?? 'mobile',
      status: 'successful',
      reconciliationStatus:
        (payload.channel ?? 'mobile') === 'branch' ? 'matched' : 'awaiting_settlement',
      recordedAt: new Date().toISOString(),
    });

    return {
      status: 'successful',
      message: `Payment of ETB ${appliedAmount.toLocaleString()} recorded successfully.`,
      receiptNo,
      invoiceNo: invoice.invoiceNo,
      studentId: invoice.studentId,
      amount: appliedAmount,
      remainingBalance: invoice.balance,
    };
  }
}

function inferDemoMimeType(storageKey: string) {
  if (storageKey.endsWith('.png')) {
    return 'image/png';
  }
  if (storageKey.endsWith('.jpg') || storageKey.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (storageKey.endsWith('.pdf')) {
    return 'application/pdf';
  }

  return 'application/octet-stream';
}

function formatDemoAttachmentName(storageKey: string) {
  const fileName = storageKey.split('/').pop() ?? storageKey;
  return fileName.replace(/^\d+-/, '');
}

export class DemoLoanMonitoringApi implements LoanMonitoringApi {
  async getPendingLoans(): Promise<LoanQueueItem[]> {
    await wait(180);

    return [
      {
        loanId: 'loan_1',
        memberId: abebeMemberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        amount: 500000,
        level: 'branch',
        status: 'branch_review',
        deficiencyReasons: ['Income proof missing', 'Fayda back image unclear'],
        availableActions: ['review', 'forward', 'return_for_correction', 'approve'],
        updatedAt: '2026-03-17T14:30:00.000Z',
      },
      {
        loanId: 'loan_2',
        memberId: mekdesMemberId,
        customerId: 'BUN-100004',
        memberName: 'Mekdes Ali',
        amount: 24000000,
        level: 'district',
        status: 'district_review',
        deficiencyReasons: ['Collateral valuation update requested'],
        availableActions: ['review', 'forward', 'return_for_correction'],
        updatedAt: '2026-03-16T11:10:00.000Z',
      },
      {
        loanId: 'loan_3',
        memberId: meseretMemberId,
        customerId: 'BUN-100003',
        memberName: 'Meseret Alemu',
        amount: 32000000,
        level: 'head_office',
        status: 'head_office_review',
        deficiencyReasons: [],
        availableActions: ['review', 'return_for_correction', 'approve'],
        updatedAt: '2026-03-15T09:20:00.000Z',
      },
    ];
  }

  async getLoanDetail(loanId: string): Promise<LoanQueueDetail | null> {
    const items = await this.getPendingLoans();
    const item = items.find((entry) => entry.loanId === loanId);

    if (!item) {
      return null;
    }

    return {
      ...item,
      nextAction:
        item.deficiencyReasons.length > 0
          ? 'Return for correction with the listed document requirements, then resume review when the customer re-submits.'
          : item.level === 'branch'
            ? 'Complete branch verification and forward if the file is ready for district review.'
            : item.level === 'district'
              ? 'Validate escalated approval conditions and forward only if district review is complete.'
              : 'Confirm final compliance and approval readiness before head office sign-off.',
      availableActions: buildDemoAvailableActions(item),
      history: [
        {
          action: 'review',
          level: item.level,
          fromStatus: 'submitted',
          toStatus: item.status,
          actorRole:
            item.level === 'branch'
              ? 'branch_manager'
              : item.level === 'district'
                ? 'district_manager'
                : 'head_office_manager',
          comment: 'Application entered the active review queue.',
          createdAt: item.updatedAt,
        },
        ...(item.deficiencyReasons.length > 0
          ? [
              {
                action: 'return_for_correction',
                level: item.level,
                fromStatus: item.status,
                toStatus: 'submitted',
                actorRole:
                  item.level === 'branch'
                    ? 'branch_manager'
                    : item.level === 'district'
                      ? 'district_manager'
                      : 'head_office_manager',
                comment: item.deficiencyReasons.join(', '),
                createdAt: item.updatedAt,
              },
            ]
          : []),
      ],
    };
  }

  async getCustomerProfile(loanId: string) {
    const items = await this.getPendingLoans();
    const item = items.find((entry) => entry.loanId === loanId);

    if (!item) {
      return null;
    }

    if (loanId === 'loan_1') {
      return {
        memberId: item.memberId,
        customerId: item.customerId,
        memberName: item.memberName,
        branchId: 'branch_debre_markos',
        districtId: 'district_bunna_north',
        activeLoans: 1,
        closedLoans: 2,
        rejectedLoans: 0,
        totalLoanCount: 3,
        totalBorrowedAmount: 980000,
        totalClosedAmount: 480000,
        repaymentCount90d: 4,
        lastRepaymentAt: '2026-03-10T08:30:00.000Z',
        autopayEnabled: true,
        autopayServices: ['school_payment', 'rent'],
        repaymentSignal: 'strong' as const,
        loyaltyTier: 'gold' as const,
        nextBestAction: 'Offer loyalty review for top-up or pre-approved follow-up',
        offerCue:
          'Customer has closed loans, recent repayments, and active digital habits. Suitable for a loyalty offer or top-up review.',
        openSupportCases: 0,
        activeLoanStatuses: ['branch_review'],
      };
    }

    if (loanId === 'loan_2') {
      return {
        memberId: item.memberId,
        customerId: item.customerId,
        memberName: item.memberName,
        branchId: 'branch_bahir_dar',
        districtId: 'district_bahir_dar',
        activeLoans: 1,
        closedLoans: 1,
        rejectedLoans: 0,
        totalLoanCount: 2,
        totalBorrowedAmount: 24600000,
        totalClosedAmount: 600000,
        repaymentCount90d: 1,
        lastRepaymentAt: '2026-02-28T09:10:00.000Z',
        autopayEnabled: false,
        autopayServices: [],
        repaymentSignal: 'steady' as const,
        loyaltyTier: 'silver' as const,
        nextBestAction: 'Offer loan repayment AutoPay or reminder support',
        offerCue:
          'Customer is repay­ing manually and may respond well to AutoPay enrollment or repayment reminders before any new credit offer.',
        openSupportCases: 1,
        activeLoanStatuses: ['district_review'],
      };
    }

    return {
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      branchId: 'branch_addis_central',
      districtId: 'district_addis_central',
      activeLoans: 1,
      closedLoans: 0,
      rejectedLoans: 1,
      totalLoanCount: 2,
      totalBorrowedAmount: 32000000,
      totalClosedAmount: 0,
      repaymentCount90d: 0,
      autopayEnabled: false,
      autopayServices: [],
      repaymentSignal: 'watch' as const,
      loyaltyTier: 'watch' as const,
      nextBestAction: 'Resolve open support issues before sending a new offer',
      offerCue:
        'Customer should stay on workflow and support watch until repayment and servicing signals improve.',
      openSupportCases: 1,
      activeLoanStatuses: ['head_office_review'],
    };
  }

  async processAction(
    loanId: string,
    payload: {
      action:
        | 'review'
        | 'approve'
        | 'reject'
        | 'forward'
        | 'return_for_correction'
        | 'disburse'
        | 'close';
      comment?: string;
      deficiencyReasons?: string[];
    },
  ) {
    await wait(150);

    return {
      loanId,
      previousStatus: 'branch_review',
      status:
        payload.action === 'forward'
          ? 'district_review'
          : payload.action === 'return_for_correction'
            ? 'submitted'
            : payload.action,
      currentLevel:
        payload.action === 'forward'
          ? 'district'
          : payload.action === 'approve'
            ? 'branch'
            : 'branch',
    };
  }
}

export class DemoDashboardApi implements DashboardApi {
  async getSummary(role: AdminRole): Promise<ManagerDashboardSummary> {
    await wait(220);

    if (role === AdminRole.BRANCH_MANAGER) {
      return {
        customersServed: 328,
        transactionsCount: 1842,
        schoolPaymentsCount: 126,
        pendingLoansByLevel: [
          { level: 'branch_review', count: 41 },
          { level: 'district_review', count: 0 },
          { level: 'head_office_review', count: 0 },
        ],
      };
    }

    if (role === AdminRole.DISTRICT_MANAGER) {
      return {
        customersServed: 842,
        transactionsCount: 5140,
        schoolPaymentsCount: 364,
        pendingLoansByLevel: [
          { level: 'branch_review', count: 67 },
          { level: 'district_review', count: 38 },
          { level: 'head_office_review', count: 0 },
        ],
      };
    }

    return {
      customersServed: 1284,
      transactionsCount: 8420,
      schoolPaymentsCount: 528,
      pendingLoansByLevel: [
        { level: 'branch_review', count: 96 },
        { level: 'district_review', count: 71 },
        { level: 'head_office_review', count: 47 },
      ],
    };
  }

  async getBranchPerformance(role: AdminRole): Promise<PerformanceSummaryItem[]> {
    await wait(180);

    if (role === AdminRole.BRANCH_MANAGER) {
      return [
        {
          scopeId: 'bahir_dar_branch',
          customersServed: 328,
          transactionsCount: 1842,
          loanApprovedCount: 18,
          loanRejectedCount: 7,
          schoolPaymentsCount: 126,
          totalTransactionAmount: 4820000,
        },
      ];
    }

    return [
      {
        scopeId: 'bahir_dar_branch',
        customersServed: 560,
        transactionsCount: 3120,
        loanApprovedCount: 41,
        loanRejectedCount: 11,
        schoolPaymentsCount: 212,
        totalTransactionAmount: 8650000,
      },
      {
        scopeId: 'gondar_branch',
        customersServed: 410,
        transactionsCount: 2680,
        loanApprovedCount: 33,
        loanRejectedCount: 9,
        schoolPaymentsCount: 188,
        totalTransactionAmount: 6940000,
      },
      {
        scopeId: 'debre_markos_branch',
        customersServed: 380,
        transactionsCount: 2410,
        loanApprovedCount: 29,
        loanRejectedCount: 8,
        schoolPaymentsCount: 161,
        totalTransactionAmount: 6210000,
      },
      {
        scopeId: 'jimma_branch',
        customersServed: 438,
        transactionsCount: 2575,
        loanApprovedCount: 31,
        loanRejectedCount: 10,
        schoolPaymentsCount: 174,
        totalTransactionAmount: 6720000,
      },
      {
        scopeId: 'mekele_branch',
        customersServed: 396,
        transactionsCount: 2294,
        loanApprovedCount: 27,
        loanRejectedCount: 14,
        schoolPaymentsCount: 149,
        totalTransactionAmount: 5980000,
      },
    ];
  }

  async getDistrictPerformance(
    role: AdminRole,
  ): Promise<PerformanceSummaryItem[]> {
    await wait(180);

    if (role === AdminRole.DISTRICT_MANAGER) {
      return [
        {
          scopeId: 'gondar_district',
          customersServed: 842,
          transactionsCount: 5140,
          loanApprovedCount: 66,
          loanRejectedCount: 19,
          schoolPaymentsCount: 364,
          totalTransactionAmount: 14800000,
        },
      ];
    }

    return demoHeadOfficeDistricts().map((item) => ({
      scopeId: item.entityId,
      customersServed: item.membersServed,
      transactionsCount: item.transactionsProcessed,
      loanApprovedCount: item.loansApproved,
      loanRejectedCount: Math.max(item.loansHandled - item.loansApproved, 0),
      schoolPaymentsCount: Math.round(item.customersHelped * 0.24),
      totalTransactionAmount: item.transactionsProcessed * 4820,
    }));
  }

  async getStaffRanking(role: AdminRole): Promise<StaffRankingItem[]> {
    await wait(160);

    if (role === AdminRole.BRANCH_MANAGER) {
      return [
        {
          staffId: 'staff_loan_1',
          branchId: 'bahir_dar_branch',
          customersServed: 132,
          transactionsCount: 480,
          loanApprovedCount: 12,
          schoolPaymentsCount: 36,
          score: 684,
        },
        {
          staffId: 'staff_cashier_2',
          branchId: 'bahir_dar_branch',
          customersServed: 118,
          transactionsCount: 452,
          loanApprovedCount: 4,
          schoolPaymentsCount: 41,
          score: 623,
        },
      ];
    }

    return [
      {
        staffId: 'selamawit_a',
        branchId: 'head_office',
        customersServed: 210,
        transactionsCount: 640,
        loanApprovedCount: 28,
        schoolPaymentsCount: 18,
        score: 952,
      },
      {
        staffId: 'elias_m',
        branchId: 'gondar_branch',
        customersServed: 184,
        transactionsCount: 588,
        loanApprovedCount: 21,
        schoolPaymentsCount: 24,
        score: 859,
      },
      {
        staffId: 'rahel_g',
        branchId: 'bahir_dar_branch',
        customersServed: 172,
        transactionsCount: 534,
        loanApprovedCount: 20,
        schoolPaymentsCount: 19,
        score: 785,
      },
    ];
  }

  async getVotingSummary(): Promise<VotingSummaryItem[]> {
    await wait(200);

    return [
      {
        voteId: 'vote_2026',
        title: 'Board Election 2026',
        totalResponses: 78200,
        eligibleShareholders: 180000,
        participationRate: 43.44,
      },
    ];
  }

  async getOnboardingReviewQueue(_role: AdminRole): Promise<OnboardingReviewItem[]> {
    await wait(180);

    return [
      {
        memberId: abebeMemberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phoneNumber: '0911000001',
        branchId: 'branch_bahir_dar_main',
        districtId: 'district_gondar',
        branchName: 'Bahir Dar Main Branch',
        onboardingReviewStatus: 'submitted',
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'qr_uploaded',
        kycStatus: 'pending',
        requiredAction: 'Validate Fayda QR evidence',
        submittedAt: '2026-03-12T10:15:00.000Z',
        updatedAt: '2026-03-12T10:15:00.000Z',
        onboardingEvidence: {
          hasFaydaFrontImage: true,
          hasFaydaBackImage: true,
          hasSelfieImage: true,
          extractedFullName: 'Abebe Kebede',
          extractedPhoneNumber: '0911000001',
          extractedCity: 'Bahir Dar',
          extractedFaydaFinMasked: '********9012',
          dateOfBirthCandidates: ['1988-04-12'],
          reviewRequiredFields: [],
          extractionMethod: 'sample_fayda_prefill',
        },
      },
      {
        memberId: meseretMemberId,
        customerId: 'BUN-100003',
        memberName: 'Meseret Alemu',
        phoneNumber: '0911000002',
        branchId: 'branch_gondar_main',
        districtId: 'district_gondar',
        branchName: 'Gondar Main Branch',
        onboardingReviewStatus: 'review_in_progress',
        membershipStatus: 'pending_review',
        identityVerificationStatus: 'pending_review',
        kycStatus: 'pending',
        requiredAction: 'Move case into active review',
        submittedAt: '2026-03-11T08:20:00.000Z',
        updatedAt: '2026-03-13T09:10:00.000Z',
        reviewNote: 'Branch officer is validating the selfie and branch selection.',
        onboardingEvidence: {
          hasFaydaFrontImage: true,
          hasFaydaBackImage: true,
          hasSelfieImage: true,
          extractedFullName: 'Meseret Alemu',
          extractedPhoneNumber: '0911000002',
          extractedCity: 'Gondar',
          extractedFaydaFinMasked: '********4817',
          dateOfBirthCandidates: ['1992-08-14'],
          reviewRequiredFields: [],
          extractionMethod: 'sample_fayda_prefill',
        },
      },
      {
        memberId: mekdesMemberId,
        customerId: 'BUN-100004',
        memberName: 'Mekdes Ali',
        phoneNumber: '0911000003',
        branchId: 'branch_debre_markos_main',
        districtId: 'district_debre_markos',
        branchName: 'Debre Markos Main Branch',
        onboardingReviewStatus: 'needs_action',
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'needs_action',
        kycStatus: 'pending',
        requiredAction: 'Collect missing evidence',
        submittedAt: '2026-03-10T07:40:00.000Z',
        updatedAt: '2026-03-14T11:25:00.000Z',
        reviewNote: 'Back-side Fayda upload is blurred and must be resubmitted.',
        onboardingEvidence: {
          hasFaydaFrontImage: true,
          hasFaydaBackImage: false,
          hasSelfieImage: true,
          extractedFullName: 'Mekdes Ali',
          extractedPhoneNumber: '0911000003',
          extractedCity: 'Debre Markos',
          extractedFaydaFinMasked: '********3028',
          dateOfBirthCandidates: ['1982-05-25', '1990-02-02'],
          reviewRequiredFields: ['dateOfBirth', 'expiryDate', 'faydaBackImage'],
          extractionMethod: 'sample_fayda_prefill',
        },
      },
    ];
  }

  async getOnboardingEvidenceDetail(memberId: string): Promise<OnboardingEvidenceDetail> {
    await wait(120);

    if (memberId === mekdesMemberId) {
      return {
        memberId,
        customerId: 'BUN-100004',
        memberName: 'Mekdes Ali',
        phoneNumber: '0911000003',
        branchName: 'Debre Markos Main Branch',
        onboardingReviewStatus: 'needs_action',
        identityVerificationStatus: 'needs_action',
        reviewNote: 'Back-side Fayda upload is blurred and must be resubmitted.',
        documents: {
          faydaFront: {
            storageKey: 'demo/fayda-front-mekdes',
            originalFileName: 'fayda-front.png',
            mimeType: 'image/png',
            sizeBytes: 245120,
          },
          selfie: {
            storageKey: 'demo/selfie-mekdes',
            originalFileName: 'selfie.png',
            mimeType: 'image/png',
            sizeBytes: 198320,
          },
        },
        submittedProfile: {
          fullName: 'Mekdes Ali',
          firstName: 'Mekdes',
          lastName: 'Ali',
          dateOfBirth: '1988-01-13',
          phoneNumber: '0911000003',
          region: 'Amhara',
          city: 'Debre Markos',
          branchName: 'Debre Markos Main Branch',
          faydaFinMasked: '********3028',
        },
        reviewPolicy: {
          policyVersion: 'v1',
          blockingMismatchFields: [
            'fullName',
            'firstName',
            'lastName',
            'dateOfBirth',
            'phoneNumber',
            'faydaFin',
          ],
          blockingMismatchApprovalRoles: ['head_office_manager', 'admin'],
          blockingMismatchApprovalReasonCodes: [
            'official_source_verified',
            'manual_document_review',
            'customer_profile_corrected',
          ],
          requireApprovalJustification: true,
        },
        extractedFaydaData: {
          fullName: 'Mekdes Ali',
          phoneNumber: '0911000003',
          city: 'Debre Markos',
          faydaFinMasked: '********3028',
          dateOfBirthCandidates: ['1982-05-25', '1990-02-02'],
          expiryDateCandidates: ['2025-06-30', '2033-03-09'],
          reviewRequiredFields: ['dateOfBirth', 'expiryDate', 'faydaBackImage'],
          extractionMethod: 'sample_fayda_prefill',
        },
        mismatches: [
          {
            field: 'dateOfBirth',
            submittedValue: '1988-01-13',
            extractedValue: '1982-05-25 or 1990-02-02',
          },
        ],
      };
    }

    return {
      memberId,
      customerId: memberId === abebeMemberId ? 'BUN-100001' : 'BUN-100003',
      memberName: memberId === abebeMemberId ? 'Abebe Kebede' : 'Meseret Alemu',
      phoneNumber: memberId === abebeMemberId ? '0911000001' : '0911000002',
      branchName: 'Bahir Dar Main Branch',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      reviewNote: 'Branch officer is validating the selfie and branch selection.',
      documents: {
        faydaFront: {
          storageKey: 'demo/fayda-front',
          originalFileName: 'fayda-front.png',
          mimeType: 'image/png',
          sizeBytes: 245120,
        },
        faydaBack: {
          storageKey: 'demo/fayda-back',
          originalFileName: 'fayda-back.png',
          mimeType: 'image/png',
          sizeBytes: 221140,
        },
        selfie: {
          storageKey: 'demo/selfie',
          originalFileName: 'selfie.png',
          mimeType: 'image/png',
          sizeBytes: 198320,
        },
      },
      submittedProfile: {
        fullName: memberId === abebeMemberId ? 'Abebe Kebede' : 'Meseret Alemu',
        firstName: memberId === abebeMemberId ? 'Abebe' : 'Meseret',
        lastName: memberId === abebeMemberId ? 'Kebede' : 'Alemu',
        dateOfBirth: memberId === abebeMemberId ? '1988-04-12' : '1992-08-14',
        phoneNumber: memberId === abebeMemberId ? '0911000001' : '0911000002',
        region: 'Amhara',
        city: 'Bahir Dar',
        branchName: 'Bahir Dar Main Branch',
        faydaFinMasked: '********9012',
      },
      reviewPolicy: {
        policyVersion: 'v1',
        blockingMismatchFields: [
          'fullName',
          'firstName',
          'lastName',
          'dateOfBirth',
          'phoneNumber',
          'faydaFin',
        ],
        blockingMismatchApprovalRoles: ['head_office_manager', 'admin'],
        blockingMismatchApprovalReasonCodes: [
          'official_source_verified',
          'manual_document_review',
          'customer_profile_corrected',
        ],
        requireApprovalJustification: true,
      },
      extractedFaydaData: {
        fullName: memberId === abebeMemberId ? 'Abebe Kebede' : 'Meseret Alemu',
        phoneNumber: memberId === abebeMemberId ? '0911000001' : '0911000002',
        city: 'Bahir Dar',
        faydaFinMasked: '********9012',
        dateOfBirthCandidates: ['1988-04-12'],
        expiryDateCandidates: ['2032-04-11'],
        reviewRequiredFields: [],
        extractionMethod: 'sample_fayda_prefill',
      },
      mismatches: [],
    };
  }

  async getProtectedDocumentBlob(_storageKey: string): Promise<Blob> {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="100%" height="100%" fill="#f8fafc"/><rect x="32" y="32" width="576" height="336" rx="24" fill="#e2e8f0"/><text x="50%" y="48%" text-anchor="middle" font-family="Arial" font-size="28" fill="#334155">Demo protected document</text><text x="50%" y="58%" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748b">Authenticated preview placeholder</text></svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  async updateOnboardingReview(
    memberId: string,
    payload: {
      status: 'submitted' | 'review_in_progress' | 'needs_action' | 'approved';
      note?: string;
      approvalReasonCode?: string;
      supersessionReasonCode?: string;
      stepUpToken?: string;
      approvalJustification?: string;
      acknowledgedMismatchFields?: string[];
      acknowledgedSupersessionFields?: string[];
    },
  ): Promise<OnboardingReviewItem> {
    await wait(120);

    return {
      memberId,
      customerId: memberId === abebeMemberId ? 'BUN-100001' : 'BUN-100003',
      memberName: memberId === abebeMemberId ? 'Abebe Kebede' : 'Meseret Alemu',
      phoneNumber: memberId === abebeMemberId ? '0911000001' : '0911000002',
      branchId: 'branch_bahir_dar_main',
      districtId: 'district_gondar',
      branchName: 'Bahir Dar Main Branch',
      onboardingReviewStatus: payload.status,
      membershipStatus: payload.status === 'approved' ? 'active' : 'pending_review',
      identityVerificationStatus:
        payload.status === 'approved'
          ? 'verified'
          : payload.status === 'needs_action'
            ? 'needs_action'
            : 'pending_review',
      kycStatus: payload.status === 'approved' ? 'verified' : 'pending',
      requiredAction:
        payload.status === 'approved'
          ? 'Customer can access verified services'
          : 'Continue onboarding review',
      submittedAt: '2026-03-12T10:15:00.000Z',
      updatedAt: '2026-03-17T14:00:00.000Z',
      reviewNote: payload.note,
      onboardingEvidence: {
        hasFaydaFrontImage: true,
        hasFaydaBackImage: true,
        hasSelfieImage: true,
        extractedFullName: memberId === abebeMemberId ? 'Abebe Kebede' : 'Meseret Alemu',
        extractedPhoneNumber: memberId === abebeMemberId ? '0911000001' : '0911000002',
        extractedCity: 'Bahir Dar',
        extractedFaydaFinMasked: '********9012',
        dateOfBirthCandidates: ['1988-04-12'],
        reviewRequiredFields: [],
        extractionMethod: 'sample_fayda_prefill',
      },
    };
  }

  async getAutopayOperations(_role: AdminRole): Promise<AutopayOperationItem[]> {
    await wait(120);

    return [
      {
        id: 'autopay_1',
        memberId: abebeMemberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId: 'branch_bahir_dar_main',
        districtId: 'district_gondar',
        branchName: 'Bahir Dar Main Branch',
        serviceType: 'school_payment',
        accountId: 'SAV-100001',
        schedule: 'monthly',
        enabled: true,
        operationalStatus: 'active',
        actionRequired:
          'Monitor recurring school fee deductions and exception reminders closely.',
        updatedAt: '2026-03-17T09:00:00.000Z',
      },
      {
        id: 'autopay_2',
        memberId: meseretMemberId,
        customerId: 'BUN-100003',
        memberName: 'Meseret Alemu',
        branchId: 'branch_gondar_main',
        districtId: 'district_gondar',
        branchName: 'Gondar Main Branch',
        serviceType: 'rent',
        accountId: 'SAV-100003',
        schedule: 'monthly',
        enabled: false,
        operationalStatus: 'paused',
        actionRequired:
          'Review paused standing instruction and contact the member if retries are needed.',
        updatedAt: '2026-03-16T07:30:00.000Z',
      },
      {
        id: 'autopay_3',
        memberId: mekdesMemberId,
        customerId: 'BUN-100004',
        memberName: 'Mekdes Ali',
        branchId: 'branch_debre_markos_main',
        districtId: 'district_debre_markos',
        branchName: 'Debre Markos Main Branch',
        serviceType: 'transfer_to_savings',
        accountId: 'SAV-100004',
        schedule: 'weekly',
        enabled: true,
        operationalStatus: 'active',
        actionRequired: 'Track recurring payment health and follow up on any failed reminders.',
        updatedAt: '2026-03-15T08:45:00.000Z',
      },
    ];
  }

  async updateAutopayOperation(
    id: string,
    payload: {
      enabled: boolean;
      note?: string;
    },
  ): Promise<AutopayOperationItem> {
    await wait(120);

    const items = await this.getAutopayOperations(AdminRole.ADMIN);
    const item = items.find((entry) => entry.id === id) ?? items[0];

    return {
      ...item,
      enabled: payload.enabled,
      operationalStatus: payload.enabled ? 'active' : 'paused',
      actionRequired: payload.enabled
        ? 'Track recurring payment health and follow up on any failed reminders.'
        : 'Review paused standing instruction and contact the member if retries are needed.',
      updatedAt: '2026-03-18T15:00:00.000Z',
    };
  }

  async getHeadOfficeDistrictSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    await wait(150);
    return buildDemoOverview('district', period, demoHeadOfficeDistricts(period));
  }

  async getHeadOfficeTopDistricts(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return [...demoHeadOfficeDistricts(_period)].sort((left, right) => right.score - left.score).slice(0, 5);
  }

  async getHeadOfficeDistrictWatchlist(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return [...demoHeadOfficeDistricts(_period)]
      .sort((left, right) => left.score - right.score)
      .slice(0, 5);
  }

  async getDistrictBranchSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    await wait(150);
    return buildDemoOverview('branch', period, demoDistrictBranches());
  }

  async getDistrictTopBranches(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return demoDistrictBranches().slice(0, 2);
  }

  async getDistrictBranchWatchlist(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return [...demoDistrictBranches()]
      .sort((left, right) => left.score - right.score)
      .slice(0, 2);
  }

  async getBranchEmployeeSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    await wait(150);
    return buildDemoOverview('employee', period, demoBranchEmployees());
  }

  async getBranchTopEmployees(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return demoBranchEmployees().slice(0, 2);
  }

  async getBranchEmployeeWatchlist(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return [...demoBranchEmployees()]
      .sort((left, right) => left.score - right.score)
      .slice(0, 2);
  }

  async getHeadOfficeCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<HeadOfficeCommandCenterSummary> {
    await wait(120);
    const districtPerformance = buildDemoOverview(
      'district',
      period,
      demoHeadOfficeDistricts(period),
    );

    return {
      totalCustomers: 184520,
      totalShareholders: 12840,
      totalSavings: 4876500000,
      totalLoans: districtPerformance.kpis.loansHandled,
      pendingApprovals: districtPerformance.kpis.pendingApprovals,
      riskAlerts: {
        totalAlerts: 42,
        loanAlerts: 11,
        kycAlerts: 9,
        supportAlerts: 13,
        notificationAlerts: 9,
      },
      districtPerformance,
      supportOverview: {
        openChats: 26,
        assignedChats: 11,
        resolvedChats: 108,
        escalatedChats: 7,
      },
      governanceStatus: {
        activeVotes: 1,
        draftVotes: 1,
        publishedVotes: 1,
        shareholderAnnouncements: 4,
      },
    };
  }

  async getDistrictCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<DistrictCommandCenterSummary> {
    await wait(120);
    const branchList = buildDemoOverview('branch', period, demoDistrictBranches()).items;
    const branchRanking = [...branchList].sort((left, right) => right.score - left.score);

    return {
      branchList,
      branchRanking,
      loanApprovalsPerBranch: branchRanking.map((item) => ({
        branchId: item.entityId,
        branchName: item.name,
        approvedCount: item.loansApproved,
      })),
      kycCompletion: {
        completed: branchList.reduce((sum, item) => sum + item.kycCompleted, 0),
        pendingReview: 38,
        needsAction: 12,
        completionRate: 82.4,
      },
      supportMetrics: {
        openChats: 8,
        assignedChats: 4,
        resolvedChats: 31,
        escalatedChats: 2,
      },
    };
  }

  async getBranchCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<BranchCommandCenterSummary> {
    await wait(120);
    const employeePerformance = buildDemoOverview('employee', period, demoBranchEmployees());

    return {
      employeePerformance,
      loansHandled: employeePerformance.kpis.loansHandled,
      kycCompleted: employeePerformance.kpis.kycCompleted,
      supportHandled: employeePerformance.kpis.supportResolved,
      pendingTasks: employeePerformance.kpis.pendingTasks,
    };
  }
}

function buildDemoAvailableActions(item: LoanQueueItem): LoanQueueAction[] {
  const actions: LoanQueueAction[] = [];

  if (
    ['submitted', 'branch_review', 'district_review', 'head_office_review'].includes(
      item.status,
    )
  ) {
    actions.push('review', 'return_for_correction');
  }

  if (
    ['branch', 'district'].includes(item.level) &&
    ['submitted', 'branch_review', 'district_review'].includes(item.status)
  ) {
    actions.push('forward');
  }

  if (
    ['submitted', 'branch_review', 'district_review', 'head_office_review'].includes(
      item.status,
    ) &&
    (item.level === 'head_office' || item.amount <= 20_000_000)
  ) {
    actions.push('approve');
  }

  return actions;
}

export class DemoRecommendationApi implements RecommendationApi {
  async getDashboardSummary(): Promise<RecommendationDashboardSummary> {
    await wait(140);

    return {
      recommendationsGeneratedToday: 46,
      topRecommendationType: 'customer_followup',
      completionRate: 41.2,
      dismissedRate: 13.6,
      highOpportunityCustomers: 18,
      customersMissingKyc: 12,
      customersSuitableForAutopay: 21,
    };
  }

  async getCustomerRecommendations(
    memberId: string,
  ): Promise<RecommendationCollection> {
    await wait(120);
    return (
      demoRecommendationCollections[memberId] ??
      demoRecommendationCollections[meseretMemberId]
    );
  }

  async generateForCustomer(_memberId: string): Promise<void> {
    await wait(120);
  }
}

function buildDemoOverview(
  scope: RolePerformanceOverview['scope'],
  period: PerformancePeriod,
  items: RolePerformanceItem[],
): RolePerformanceOverview {
  const totals = items.reduce(
    (accumulator, item) => ({
      membersServed: accumulator.membersServed + item.membersServed,
      customersHelped: accumulator.customersHelped + item.customersHelped,
      loansHandled: accumulator.loansHandled + item.loansHandled,
      loansApproved: accumulator.loansApproved + item.loansApproved,
      loansEscalated: accumulator.loansEscalated + item.loansEscalated,
      kycCompleted: accumulator.kycCompleted + item.kycCompleted,
      supportResolved: accumulator.supportResolved + item.supportResolved,
      transactionsProcessed:
        accumulator.transactionsProcessed + item.transactionsProcessed,
      avgHandlingTime: accumulator.avgHandlingTime + item.avgHandlingTime,
      pendingTasks: accumulator.pendingTasks + item.pendingTasks,
      pendingApprovals: accumulator.pendingApprovals + item.pendingApprovals,
      responseTimeMinutes:
        accumulator.responseTimeMinutes + item.responseTimeMinutes,
      score: accumulator.score + item.score,
    }),
    {
      membersServed: 0,
      customersHelped: 0,
      loansHandled: 0,
      loansApproved: 0,
      loansEscalated: 0,
      kycCompleted: 0,
      supportResolved: 0,
      transactionsProcessed: 0,
      avgHandlingTime: 0,
      pendingTasks: 0,
      pendingApprovals: 0,
      responseTimeMinutes: 0,
      score: 0,
    },
  );

  const divisor = items.length || 1;
  const score = Number((totals.score / divisor).toFixed(1));

  return {
    scope,
    period,
    generatedAt: new Date('2026-03-12T00:00:00.000Z').toISOString(),
    kpis: {
      ...totals,
      avgHandlingTime: Number((totals.avgHandlingTime / divisor).toFixed(1)),
      pendingTasks: Math.round(totals.pendingTasks / divisor),
      pendingApprovals: Math.round(totals.pendingApprovals / divisor),
      responseTimeMinutes: Number(
        (totals.responseTimeMinutes / divisor).toFixed(1),
      ),
      score,
      status:
        score >= 88 ? 'excellent' : score >= 72 ? 'good' : score >= 58 ? 'watch' : 'needs_support',
    },
    items,
  };
}

function demoHeadOfficeDistricts(period: PerformancePeriod = 'week'): RolePerformanceItem[] {
  const baseItems = [
    createDemoPerformanceItem('district', 'Addis Ababa District', 94, {
      membersServed: 4520,
      customersHelped: 4385,
      loansHandled: 1108,
      loansApproved: 586,
      loansEscalated: 82,
      kycCompleted: 912,
      supportResolved: 1094,
      transactionsProcessed: 5980,
      avgHandlingTime: 11.2,
      pendingTasks: 14,
      pendingApprovals: 11,
      responseTimeMinutes: 9.1,
      districtName: 'Addis Ababa District',
    }),
    createDemoPerformanceItem('district', 'Bahir Dar District', 89, {
      membersServed: 3210,
      customersHelped: 2984,
      loansHandled: 812,
      loansApproved: 394,
      loansEscalated: 104,
      kycCompleted: 670,
      supportResolved: 845,
      transactionsProcessed: 4120,
      avgHandlingTime: 13.8,
      pendingTasks: 21,
      pendingApprovals: 16,
      responseTimeMinutes: 13.0,
      districtName: 'Bahir Dar District',
    }),
    createDemoPerformanceItem('district', 'Jimma District', 76, {
      membersServed: 2684,
      customersHelped: 2510,
      loansHandled: 704,
      loansApproved: 332,
      loansEscalated: 118,
      kycCompleted: 562,
      supportResolved: 688,
      transactionsProcessed: 3715,
      avgHandlingTime: 17.6,
      pendingTasks: 28,
      pendingApprovals: 22,
      responseTimeMinutes: 17.0,
      districtName: 'Jimma District',
    }),
    createDemoPerformanceItem('district', 'Mekele District', 69, {
      membersServed: 2336,
      customersHelped: 2208,
      loansHandled: 648,
      loansApproved: 291,
      loansEscalated: 136,
      kycCompleted: 514,
      supportResolved: 602,
      transactionsProcessed: 3290,
      avgHandlingTime: 21.4,
      pendingTasks: 34,
      pendingApprovals: 27,
      responseTimeMinutes: 21.0,
      districtName: 'Mekele District',
    }),
    createDemoPerformanceItem('district', 'Gondar District', 61, {
      membersServed: 1972,
      customersHelped: 1940,
      loansHandled: 514,
      loansApproved: 201,
      loansEscalated: 122,
      kycCompleted: 388,
      supportResolved: 472,
      transactionsProcessed: 2685,
      avgHandlingTime: 29.2,
      pendingTasks: 29,
      pendingApprovals: 23,
      responseTimeMinutes: 29.0,
      districtName: 'Gondar District',
    }),
    createDemoPerformanceItem('district', 'Hawassa District', 83, {
      membersServed: 2890,
      customersHelped: 2716,
      loansHandled: 738,
      loansApproved: 351,
      loansEscalated: 95,
      kycCompleted: 604,
      supportResolved: 721,
      transactionsProcessed: 3895,
      avgHandlingTime: 14.9,
      pendingTasks: 19,
      pendingApprovals: 17,
      responseTimeMinutes: 14.0,
      districtName: 'Hawassa District',
    }),
    createDemoPerformanceItem('district', 'Adama District', 81, {
      membersServed: 2744,
      customersHelped: 2586,
      loansHandled: 721,
      loansApproved: 338,
      loansEscalated: 101,
      kycCompleted: 587,
      supportResolved: 705,
      transactionsProcessed: 3770,
      avgHandlingTime: 15.4,
      pendingTasks: 22,
      pendingApprovals: 18,
      responseTimeMinutes: 15.0,
      districtName: 'Adama District',
    }),
    createDemoPerformanceItem('district', 'Dessie District', 73, {
      membersServed: 2486,
      customersHelped: 2328,
      loansHandled: 662,
      loansApproved: 304,
      loansEscalated: 112,
      kycCompleted: 536,
      supportResolved: 648,
      transactionsProcessed: 3410,
      avgHandlingTime: 17.9,
      pendingTasks: 26,
      pendingApprovals: 21,
      responseTimeMinutes: 18.0,
      districtName: 'Dessie District',
    }),
    createDemoPerformanceItem('district', 'Dire Dawa District', 78, {
      membersServed: 2594,
      customersHelped: 2442,
      loansHandled: 689,
      loansApproved: 319,
      loansEscalated: 108,
      kycCompleted: 548,
      supportResolved: 664,
      transactionsProcessed: 3520,
      avgHandlingTime: 16.7,
      pendingTasks: 24,
      pendingApprovals: 19,
      responseTimeMinutes: 16.0,
      districtName: 'Dire Dawa District',
    }),
    createDemoPerformanceItem('district', 'Bishoftu District', 74, {
      membersServed: 2418,
      customersHelped: 2264,
      loansHandled: 641,
      loansApproved: 296,
      loansEscalated: 109,
      kycCompleted: 521,
      supportResolved: 629,
      transactionsProcessed: 3360,
      avgHandlingTime: 17.2,
      pendingTasks: 27,
      pendingApprovals: 20,
      responseTimeMinutes: 17.0,
      districtName: 'Bishoftu District',
    }),
    createDemoPerformanceItem('district', 'Kombolcha District', 66, {
      membersServed: 2196,
      customersHelped: 2051,
      loansHandled: 598,
      loansApproved: 262,
      loansEscalated: 127,
      kycCompleted: 479,
      supportResolved: 581,
      transactionsProcessed: 3085,
      avgHandlingTime: 20.8,
      pendingTasks: 31,
      pendingApprovals: 24,
      responseTimeMinutes: 22.0,
      districtName: 'Kombolcha District',
    }),
    createDemoPerformanceItem('district', 'Debre Markos District', 71, {
      membersServed: 2298,
      customersHelped: 2146,
      loansHandled: 617,
      loansApproved: 283,
      loansEscalated: 116,
      kycCompleted: 496,
      supportResolved: 603,
      transactionsProcessed: 3190,
      avgHandlingTime: 18.6,
      pendingTasks: 28,
      pendingApprovals: 22,
      responseTimeMinutes: 19.0,
      districtName: 'Debre Markos District',
    }),
  ];

  return scaleRolePerformanceItems(baseItems, period);
}


function scaleRolePerformanceItems(
  items: RolePerformanceItem[],
  period: PerformancePeriod,
): RolePerformanceItem[] {
  const factor = period === 'today' ? 0.22 : period === 'month' ? 1.34 : period === 'year' ? 3.85 : 1;
  const pendingFactor = period === 'today' ? 0.72 : period === 'month' ? 1.12 : period === 'year' ? 1.4 : 1;
  const responseAdjustment =
    period === 'today' ? -1.4 : period === 'month' ? 1.1 : period === 'year' ? 2.8 : 0;

  return items.map((item) => ({
    ...item,
    membersServed: Math.round(item.membersServed * factor),
    customersHelped: Math.round(item.customersHelped * factor),
    loansHandled: Math.round(item.loansHandled * factor),
    loansApproved: Math.round(item.loansApproved * factor),
    loansEscalated: Math.max(Math.round(item.loansEscalated * pendingFactor), 1),
    kycCompleted: Math.round(item.kycCompleted * factor),
    supportResolved: Math.round(item.supportResolved * factor),
    transactionsProcessed: Math.round(item.transactionsProcessed * factor),
    pendingTasks: Math.max(Math.round(item.pendingTasks * pendingFactor), 1),
    pendingApprovals: Math.max(Math.round(item.pendingApprovals * pendingFactor), 1),
    avgHandlingTime: Number(Math.max(item.avgHandlingTime + responseAdjustment, 6).toFixed(1)),
    responseTimeMinutes: Number(
      Math.max(item.responseTimeMinutes + responseAdjustment, 6).toFixed(1),
    ),
  }));
}

function demoDistrictBranches(): RolePerformanceItem[] {
  return [
    createDemoPerformanceItem('branch', 'Bahir Dar Branch', 91, {
      membersServed: 1684,
      customersHelped: 1602,
      loansHandled: 420,
      loansApproved: 212,
      loansEscalated: 44,
      kycCompleted: 355,
      supportResolved: 401,
      transactionsProcessed: 2201,
      avgHandlingTime: 17,
      pendingTasks: 11,
      pendingApprovals: 8,
      responseTimeMinutes: 11,
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    }),
    createDemoPerformanceItem('branch', 'Debre Markos Branch', 64, {
      membersServed: 952,
      customersHelped: 904,
      loansHandled: 233,
      loansApproved: 98,
      loansEscalated: 61,
      kycCompleted: 188,
      supportResolved: 214,
      transactionsProcessed: 1316,
      avgHandlingTime: 25,
      pendingTasks: 18,
      pendingApprovals: 14,
      responseTimeMinutes: 18,
      branchName: 'Debre Markos Branch',
      districtName: 'Bahir Dar District',
    }),
  ];
}

function demoBranchEmployees(): RolePerformanceItem[] {
  return [
    createDemoPerformanceItem('employee', 'Getachew Molla', 90, {
      membersServed: 724,
      customersHelped: 703,
      loansHandled: 173,
      loansApproved: 88,
      loansEscalated: 24,
      kycCompleted: 162,
      supportResolved: 79,
      transactionsProcessed: 956,
      avgHandlingTime: 18,
      pendingTasks: 7,
      pendingApprovals: 6,
      responseTimeMinutes: 13,
      role: 'loan_officer',
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    }),
    createDemoPerformanceItem('employee', 'Rahel Desta', 85, {
      membersServed: 506,
      customersHelped: 548,
      loansHandled: 43,
      loansApproved: 15,
      loansEscalated: 8,
      kycCompleted: 93,
      supportResolved: 254,
      transactionsProcessed: 385,
      avgHandlingTime: 20,
      pendingTasks: 6,
      pendingApprovals: 4,
      responseTimeMinutes: 9,
      role: 'support_agent',
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    }),
    createDemoPerformanceItem('employee', 'Saron Tefera', 60, {
      membersServed: 303,
      customersHelped: 321,
      loansHandled: 68,
      loansApproved: 20,
      loansEscalated: 22,
      kycCompleted: 57,
      supportResolved: 41,
      transactionsProcessed: 314,
      avgHandlingTime: 29,
      pendingTasks: 11,
      pendingApprovals: 9,
      responseTimeMinutes: 18,
      role: 'loan_officer',
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    }),
  ];
}

function createDemoPerformanceItem(
  entityType: RolePerformanceItem['entityType'],
  name: string,
  score: number,
  values: Omit<RolePerformanceItem, 'entityId' | 'entityType' | 'name' | 'score' | 'status'>,
): RolePerformanceItem {
  return {
    entityId: name.toLowerCase().replace(/\s+/g, '-'),
    entityType,
    name,
    ...values,
    score,
    status:
      score >= 88 ? 'excellent' : score >= 72 ? 'good' : score >= 58 ? 'watch' : 'needs_support',
  };
}

export class DemoVotingApi implements VotingApi {
  async getVotes(role: AdminRole): Promise<VoteAdminItem[]> {
    await wait(180);

    const votes: VoteAdminItem[] = [
      {
        voteId: 'vote_2026',
        title: 'Board Election 2026',
        status: 'open',
        totalResponses: 78200,
        participationRate: 43.44,
        eligibleShareholders: 180000,
        startDate: '2026-05-01T08:00:00.000Z',
        endDate: '2026-05-07T17:00:00.000Z',
      },
      {
        voteId: 'vote_2025_dividend',
        title: 'Dividend Approval 2025',
        status: 'published',
        totalResponses: 92100,
        participationRate: 51.17,
        eligibleShareholders: 180000,
        startDate: '2025-03-01T08:00:00.000Z',
        endDate: '2025-03-08T17:00:00.000Z',
      },
    ];

    if (
      role === AdminRole.HEAD_OFFICE_OFFICER ||
      role === AdminRole.HEAD_OFFICE_MANAGER ||
      role === AdminRole.HEAD_OFFICE_DIRECTOR ||
      role === AdminRole.ADMIN
    ) {
      return votes;
    }

    return votes.slice(0, 1);
  }

  async createVote(payload: CreateVotePayload): Promise<VoteAdminItem> {
    await wait(120);
    return {
      voteId: 'vote_new_demo',
      title: payload.title,
      status: 'draft',
      totalResponses: 0,
      participationRate: 0,
      eligibleShareholders: 180000,
      startDate: payload.startDate,
      endDate: payload.endDate,
    };
  }

  async openVote(voteId: string): Promise<VoteAdminItem> {
    await wait(120);
    return {
      voteId,
      title: 'Board Election 2026',
      status: 'open',
      totalResponses: 78200,
      participationRate: 43.44,
      eligibleShareholders: 180000,
      startDate: '2026-05-01T08:00:00.000Z',
      endDate: '2026-05-07T17:00:00.000Z',
    };
  }

  async closeVote(voteId: string): Promise<VoteAdminItem> {
    await wait(120);
    return {
      voteId,
      title: 'Board Election 2026',
      status: 'closed',
      totalResponses: 78200,
      participationRate: 43.44,
      eligibleShareholders: 180000,
      startDate: '2026-05-01T08:00:00.000Z',
      endDate: '2026-05-07T17:00:00.000Z',
    };
  }

  async getResults(voteId: string): Promise<VoteResultItem[]> {
    await wait(120);
    if (voteId !== 'vote_2026') {
      return [];
    }

    return [
      { optionId: 'option_1', optionName: 'Candidate A', votes: 42100, percentage: 53.84 },
      { optionId: 'option_2', optionName: 'Candidate B', votes: 36100, percentage: 46.16 },
    ];
  }

  async getParticipation(voteId: string): Promise<VotingSummaryItem | null> {
    await wait(120);

    if (voteId !== 'vote_2026') {
      return null;
    }

    return {
      voteId: 'vote_2026',
      title: 'Board Election 2026',
      totalResponses: 78200,
      eligibleShareholders: 180000,
      participationRate: 43.44,
      uniqueBranches: 24,
      uniqueDistricts: 7,
      branchParticipation: [
        { id: 'branch_1', name: 'Bahir Dar Branch', totalResponses: 9200 },
        { id: 'branch_2', name: 'Gondar Branch', totalResponses: 7700 },
      ],
      districtParticipation: [
        { id: 'district_1', name: 'Bahir Dar District', totalResponses: 22800 },
        { id: 'district_2', name: 'North Gonder District', totalResponses: 19100 },
      ],
    };
  }
}

export class DemoNotificationApi implements NotificationApi {
  async getNotifications(role: AdminRole): Promise<NotificationCenterItem[]> {
    await wait(150);

    const items: NotificationCenterItem[] = [
      {
        notificationId: 'notif_1',
        type: 'loan_status',
        userId: 'member_1001',
        userLabel: 'Member 1001',
        status: 'sent',
        sentAt: '2026-03-09 10:30',
      },
      {
        notificationId: 'notif_2',
        type: 'voting',
        userId: 'member_2044',
        userLabel: 'Shareholder 2044',
        status: 'pending',
        sentAt: '2026-03-09 11:05',
      },
      {
        notificationId: 'notif_3',
        type: 'payment',
        userId: 'member_1333',
        userLabel: 'Member 1333',
        status: 'read',
        sentAt: '2026-03-09 11:12',
        actionLabel: 'Open receipts',
        deepLink: '/payments/receipts?filter=qr',
        priority: 'normal',
      },
      {
        notificationId: 'notif_4',
        type: 'service_request',
        userId: 'member_1444',
        userLabel: 'Member 1444',
        status: 'sent',
        sentAt: '2026-03-12 11:20',
        actionLabel: 'Open receipts',
        deepLink: '/payments/receipts?filter=disputes',
        priority: 'high',
      },
    ];

    if (role === AdminRole.BRANCH_MANAGER) {
      return items.slice(0, 3);
    }

    return items;
  }

  async getTemplates(): Promise<NotificationTemplateItem[]> {
    await wait(120);

    return [
      {
        id: 'tpl_loan_due_soon',
        category: 'loan',
        templateType: 'loan_due_soon',
        title: 'Loan due soon reminder',
        subject: 'Your Loan Payment Reminder',
        messageBody:
          'Your loan payment details are ready. Review the amount and due date below.',
        channelDefaults: ['mobile_push', 'email', 'sms'],
        isActive: true,
      },
      {
        id: 'tpl_loan_payment_reminder',
        category: 'loan',
        templateType: 'loan_payment_reminder',
        title: 'Loan payment reminder',
        subject: 'Your Loan Payment Reminder',
        messageBody:
          'Your loan payment details are ready. Review the amount and due date below.',
        channelDefaults: ['mobile_push', 'email', 'sms'],
        isActive: true,
      },
      {
        id: 'tpl_school_payment_due',
        category: 'payment',
        templateType: 'school_payment_due',
        title: 'School payment due reminder',
        subject: 'School Fee Reminder',
        messageBody:
          'Your school fee is due soon. Open the Bunna Bank app to review the student profile and complete payment.',
        channelDefaults: ['mobile_push', 'email', 'sms'],
        isActive: true,
      },
      {
        id: 'tpl_payment_confirmation',
        category: 'payment',
        templateType: 'payment_confirmation',
        title: 'Payment confirmation',
        subject: 'Payment Confirmation',
        messageBody:
          'We have successfully received your payment. Review the payment summary below.',
        channelDefaults: ['mobile_push', 'email'],
        isActive: true,
      },
      {
        id: 'tpl_insurance_renewal',
        category: 'insurance',
        templateType: 'insurance_renewal_reminder',
        title: 'Insurance renewal reminder',
        subject: 'Insurance Renewal Reminder',
        messageBody:
          'Your insurance policy is due for renewal soon. Review the policy details and renew on time.',
        channelDefaults: ['mobile_push', 'email', 'sms', 'telegram'],
        isActive: true,
      },
      {
        id: 'tpl_kyc_pending',
        category: 'kyc',
        templateType: 'kyc_pending_reminder',
        title: 'KYC pending reminder',
        subject: 'Complete Your KYC Review',
        messageBody:
          'Your onboarding review needs additional action. Complete the missing KYC steps to unlock services.',
        channelDefaults: ['mobile_push', 'email', 'sms'],
        isActive: true,
      },
      {
        id: 'tpl_autopay_failure',
        category: 'autopay',
        templateType: 'autopay_failure_reminder',
        title: 'Autopay failure reminder',
        subject: 'AutoPay Action Needed',
        messageBody:
          'Your scheduled AutoPay did not complete. Review the payment source and retry before the next due date.',
        channelDefaults: ['mobile_push', 'email', 'sms'],
        isActive: true,
      },
    ];
  }

  async getCampaigns(): Promise<NotificationCampaignItem[]> {
    await wait(120);

    return [
      {
        id: 'camp_1',
        category: 'insurance',
        templateType: 'insurance_renewal_reminder',
        channels: ['email', 'telegram'],
        targetType: 'filtered_customers',
        targetIds: ['BUN-100001', 'BUN-100003'],
        messageSubject: 'Insurance renewal reminder',
        messageBody: 'Your insurance policy is due for renewal soon.',
        status: 'completed',
        sentAt: '2026-03-11T11:00:00.000Z',
      },
      {
        id: 'camp_2',
        category: 'loan',
        templateType: 'payment_confirmation',
        channels: ['mobile_push', 'email'],
        targetType: 'selected_customers',
        targetIds: ['BUN-101000'],
        messageSubject: 'Payment Confirmation',
        messageBody: 'We have successfully received your payment.',
        status: 'draft',
      },
      {
        id: 'camp_3',
        category: 'kyc',
        templateType: 'kyc_pending_reminder',
        channels: ['mobile_push', 'sms'],
        targetType: 'selected_customers',
        targetIds: ['BUN-100004'],
        messageSubject: 'Complete Your KYC Review',
        messageBody: 'Your onboarding review needs action before secure services can be enabled.',
        status: 'failed',
        sentAt: '2026-03-15T09:15:00.000Z',
      },
      {
        id: 'camp_4',
        category: 'autopay',
        templateType: 'autopay_failure_reminder',
        channels: ['mobile_push', 'email'],
        targetType: 'selected_customers',
        targetIds: ['BUN-100001'],
        messageSubject: 'AutoPay Action Needed',
        messageBody: 'Your scheduled AutoPay did not complete. Review the payment source and retry.',
        status: 'failed',
        sentAt: '2026-03-16T06:45:00.000Z',
      },
    ];
  }

  async createCampaign(
    payload: CreateManagerNotificationCampaignPayload,
  ): Promise<NotificationCampaignItem> {
    await wait(120);

    return {
      id: `camp_${Date.now()}`,
      category: payload.category,
      templateType: payload.templateType,
      channels: payload.channels,
      targetType: payload.targetType,
      targetIds: payload.targetIds ?? [],
      messageSubject: payload.messageSubject,
      messageBody: payload.messageBody ?? 'Preview message',
      status: 'draft',
    };
  }

  async sendCampaign(campaignId: string): Promise<NotificationCampaignItem> {
    await wait(100);

    return {
      id: campaignId,
      category: 'insurance',
      templateType: 'insurance_renewal_reminder',
      channels: ['email', 'telegram'],
      targetType: 'filtered_customers',
      targetIds: ['BUN-100001'],
      messageSubject: 'Insurance renewal reminder',
      messageBody: 'Your insurance policy is due for renewal soon.',
      status: 'completed',
      sentAt: new Date().toISOString(),
      deliverySummary: {
        totalTargets: 1,
        totalChannels: 2,
        totalAttempts: 2,
        channels: {
          email: { sent: 1, delivered: 1, failed: 0, skipped: 0 },
          telegram: { sent: 1, delivered: 0, failed: 1, skipped: 0 },
        },
        perRecipientResults: [
          {
            customerId: 'BUN-100001',
            memberId: 'BUN-100001',
            channels: {
              email: { status: 'delivered', recipient: 'write2get@gmail.com' },
              telegram: {
                status: 'failed',
                recipient: '@member1001',
                errorMessage: 'Telegram chat is not linked.',
              },
            },
          },
        ],
      },
    };
  }

  async getLogs(): Promise<NotificationLogItem[]> {
    await wait(120);

    return [
      {
        id: 'log_1',
        campaignId: 'camp_1',
        memberId: 'BUN-100001',
        category: 'insurance',
        channel: 'email',
        recipient: 'write2get@gmail.com',
        status: 'sent',
        messageSubject: 'Insurance renewal reminder',
        messageBody: 'Your insurance policy is due for renewal soon.',
        sentAt: '2026-03-11T11:05:00.000Z',
      },
      {
        id: 'log_2',
        campaignId: 'camp_1',
        memberId: 'BUN-100003',
        category: 'insurance',
        channel: 'telegram',
        recipient: '@member1002',
        status: 'failed',
        messageSubject: 'Insurance renewal reminder',
        messageBody: 'Your insurance policy is due for renewal soon.',
        errorMessage: 'Telegram chat is not linked.',
      },
      {
        id: 'log_3',
        campaignId: 'camp_3',
        memberId: 'BUN-100004',
        category: 'kyc',
        channel: 'sms',
        recipient: '0911000003',
        status: 'failed',
        messageSubject: 'Complete Your KYC Review',
        messageBody: 'Your onboarding review needs action before secure services can be enabled.',
        errorMessage: 'Recipient handset is unreachable.',
        sentAt: '2026-03-15T09:16:00.000Z',
      },
      {
        id: 'log_4',
        campaignId: 'camp_4',
        memberId: 'BUN-100001',
        category: 'autopay',
        channel: 'email',
        recipient: 'abebe.kebede@example.com',
        status: 'failed',
        messageSubject: 'AutoPay Action Needed',
        messageBody: 'Your scheduled AutoPay did not complete. Review the payment source and retry.',
        errorMessage: 'Mailbox rejected the reminder message.',
        sentAt: '2026-03-16T06:46:00.000Z',
      },
    ];
  }

  async getInsuranceAlerts(): Promise<InsuranceAlertItem[]> {
    await wait(120);

    return [
      {
        loanId: 'LN-1001',
        memberId: 'BUN-100001',
        customerId: 'AMB-000001',
        memberName: 'Abebe Kebede',
        policyNumber: 'POL-2026-1001',
        providerName: 'Nyala Insurance',
        insuranceType: 'collateral',
        alertType: 'expiring_7_days',
        endDate: '2026-03-18T00:00:00.000Z',
        daysUntilExpiry: 7,
        requiresManagerAction: true,
      },
      {
        loanId: 'LN-2002',
        memberId: 'BUN-100008',
        customerId: 'AMB-000008',
        memberName: 'Mekdes Ali',
        alertType: 'loan_without_valid_insurance',
        requiresManagerAction: true,
      },
    ];
  }
}

export class DemoAuditApi implements AuditApi {
  async getByEntity(role: AdminRole): Promise<AuditLogItem[]> {
    await wait(160);

    const items: AuditLogItem[] = [
      {
        auditId: 'audit_1',
        auditDigest: 'digest-audit-1',
        actor: 'admin_01',
        actorRole: 'admin',
        action: 'vote_submitted',
        entity: 'vote:vote_2026',
        entityType: 'vote',
        entityId: 'vote_2026',
        timestamp: '2026-03-09 10:12',
      },
      {
        auditId: 'audit_2',
        auditDigest: 'digest-audit-2',
        actor: 'staff_21',
        actorRole: 'head_office_manager',
        action: 'loan_approve',
        entity: 'loan:loan_1004',
        entityType: 'loan',
        entityId: 'loan_1004',
        timestamp: '2026-03-09 09:44',
      },
      {
        auditId: 'audit_3',
        auditDigest: 'digest-audit-3',
        actor: 'member_88',
        actorRole: 'member',
        action: 'member_profile_updated',
        entity: 'member:member_88',
        entityType: 'member',
        entityId: 'member_88',
        timestamp: '2026-03-09 08:18',
      },
      {
        auditId: 'audit_security_contract_1',
        auditDigest: 'digest-security-contract-1',
        actor: 'staff_31',
        actorRole: 'head_office_manager',
        action: 'unsupported_security_review_metrics_contract_detected',
        entity: 'staff:staff_31',
        entityType: 'staff',
        entityId: 'staff_31',
        timestamp: '2026-03-18T12:40:00.000Z',
        after: {
          detectedContractVersion: 'security_review_metrics.v99',
          supportedContractVersion: 'security_review_metrics.v2',
          source: 'head_office_dashboard',
        },
      },
      {
        auditId: 'audit_kyc_0',
        auditDigest: 'digest-audit-kyc-0',
        decisionVersion: 1,
        isCurrentDecision: false,
        supersededByAuditId: 'audit_kyc_1',
        actor: 'staff_22',
        actorRole: 'head_office_manager',
        action: 'onboarding_review_updated',
        entity: 'member:meseret-alemu',
        entityType: 'member',
        entityId: 'meseret-alemu',
        timestamp: '2026-03-15T09:10:00.000Z',
        before: {
          onboardingReviewStatus: 'submitted',
          identityVerificationStatus: 'qr_uploaded',
        },
        after: {
          status: 'needs_action',
          note: 'Initial review requested correction on submitted profile values.',
        },
      },
      {
        auditId: 'audit_kyc_1',
        auditDigest: 'digest-audit-kyc-1',
        decisionVersion: 2,
        isCurrentDecision: true,
        supersedesAuditId: 'audit_kyc_0',
        actor: 'staff_31',
        actorRole: 'head_office_manager',
        action: 'onboarding_review_updated',
        entity: 'member:meseret-alemu',
        entityType: 'member',
        entityId: 'meseret-alemu',
        timestamp: '2026-03-18T11:25:00.000Z',
        before: {
          onboardingReviewStatus: 'review_in_progress',
          identityVerificationStatus: 'pending_review',
        },
        after: {
          status: 'approved',
          note: 'Approved after source verification and document review.',
          approvalReasonCode: 'official_source_verified',
          supersession: {
            reasonCode: 'approval_recorded',
            previousAuditId: 'audit_kyc_0',
            previousDecisionVersion: 1,
            changedFields: [
              {
                field: 'status',
                previousValue: 'needs_action',
                nextValue: 'approved',
              },
              {
                field: 'note',
                previousValue: 'Initial review requested correction on submitted profile values.',
                nextValue: 'Approved after source verification and document review.',
              },
            ],
          },
          approvalJustification:
            'Verified the Fayda mismatch against the official branch-captured evidence and approved.',
          acknowledgedMismatchFields: ['dateOfBirth', 'phoneNumber'],
          blockingMismatchFields: ['dateOfBirth', 'phoneNumber'],
          reviewPolicySnapshot: {
            policyVersion: 'v1',
            blockingMismatchFields: ['dateOfBirth', 'phoneNumber'],
            blockingMismatchApprovalRoles: ['head_office_manager', 'admin'],
            blockingMismatchApprovalReasonCodes: [
              'official_source_verified',
              'manual_document_review',
              'customer_profile_corrected',
            ],
            requireApprovalJustification: true,
          },
        },
      },
    ];

    if (
      role === AdminRole.ADMIN ||
      role === AdminRole.HEAD_OFFICE_MANAGER ||
      role === AdminRole.HEAD_OFFICE_DIRECTOR
    ) {
      return items;
    }

    return items.slice(0, 2);
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLogItem[]> {
    await wait(120);

    if (entityType === 'autopay_setting') {
      return [
        {
          auditId: 'audit_autopay_1',
          auditDigest: 'digest-audit-autopay-1',
          actor: 'staff_21',
          actorRole: 'branch_manager',
          action: 'autopay_paused_by_manager',
          entity: `${entityType}:${entityId}`,
          entityType,
          entityId,
          timestamp: '2026-03-18T14:10:00.000Z',
        },
        {
          auditId: 'audit_autopay_2',
          auditDigest: 'digest-audit-autopay-2',
          actor: 'staff_21',
          actorRole: 'branch_manager',
          action: 'autopay_reenabled_by_manager',
          entity: `${entityType}:${entityId}`,
          entityType,
          entityId,
          timestamp: '2026-03-18T15:40:00.000Z',
        },
      ];
    }

    return [
      {
        auditId: 'audit_generic_1',
        auditDigest: 'digest-audit-generic-1',
        actor: 'admin_01',
        actorRole: 'admin',
        action: 'entity_reviewed',
        entity: `${entityType}:${entityId}`,
        entityType,
        entityId,
        timestamp: '2026-03-18T10:00:00.000Z',
      },
    ];
  }

  async getByActor(role: AdminRole): Promise<AuditLogItem[]> {
    return this.getByEntity(role);
  }

  async verifyAuditLog(auditId: string): Promise<AuditLogVerificationResult> {
    return {
      auditId,
      auditDigest: `digest-${auditId}`,
      recomputedDigest: `digest-${auditId}`,
      isValid: true,
    };
  }

  async getOnboardingReviewDecisions(query?: {
    actorId?: string;
    memberId?: string;
    status?: string;
    approvalReasonCode?: string;
    dateFrom?: string;
    dateTo?: string;
    currentOnly?: boolean;
  }): Promise<AuditLogItem[]> {
    const items = (await this.getByEntity(AdminRole.ADMIN)).filter(
      (item) => item.action === 'onboarding_review_updated',
    );

    return items.filter((item) => {
      if (query?.actorId && item.actor !== query.actorId) {
        return false;
      }
      if (query?.memberId && item.entityId !== query.memberId) {
        return false;
      }
      if (
        query?.status &&
        (typeof item.after?.status !== 'string' || item.after.status !== query.status)
      ) {
        return false;
      }
      if (
        query?.approvalReasonCode &&
        (typeof item.after?.approvalReasonCode !== 'string' ||
          item.after.approvalReasonCode !== query.approvalReasonCode)
      ) {
        return false;
      }
      if (query?.dateFrom && new Date(item.timestamp).getTime() < new Date(query.dateFrom).getTime()) {
        return false;
      }
      if (query?.dateTo && new Date(item.timestamp).getTime() > new Date(query.dateTo).getTime()) {
        return false;
      }
      if (query?.currentOnly && item.isCurrentDecision !== true) {
        return false;
      }
      return true;
    });
  }

  async exportOnboardingReviewDecisions(query?: {
    actorId?: string;
    memberId?: string;
    status?: string;
    approvalReasonCode?: string;
    dateFrom?: string;
    dateTo?: string;
    currentOnly?: boolean;
  }): Promise<Blob> {
    const items = await this.getOnboardingReviewDecisions(query);
    const csv = [
      ['auditId', 'timestamp', 'actor', 'actorRole', 'entity', 'status', 'approvalReasonCode', 'supersessionReasonCode', 'decisionVersion', 'isCurrentDecision'],
      ...items.map((item) => [
        item.auditId,
        item.timestamp,
        item.actor,
        item.actorRole ?? '',
        item.entity,
        typeof item.after?.status === 'string' ? item.after.status : '',
        typeof item.after?.approvalReasonCode === 'string'
          ? item.after.approvalReasonCode
          : '',
        item.after != null &&
        typeof item.after === 'object' &&
        !Array.isArray(item.after) &&
        typeof (item.after as { supersession?: { reasonCode?: unknown } }).supersession?.reasonCode === 'string'
          ? ((item.after as { supersession?: { reasonCode?: string } }).supersession?.reasonCode ?? '')
          : '',
        item.decisionVersion ?? '',
        item.isCurrentDecision == null ? '' : String(item.isCurrentDecision),
      ]),
    ]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }
}

function buildDemoCollectionAging(items: SchoolCollectionItem[]) {
  const recordedDates = items.map((item) => item.recordedAt).sort();
  const generatedAt = recordedDates[recordedDates.length - 1] ?? new Date().toISOString();
  const anchor = new Date(generatedAt).getTime();
  const ranges = [
    { label: '0-1 days', min: 0, max: 1 },
    { label: '2-3 days', min: 2, max: 3 },
    { label: '4+ days', min: 4, max: Number.POSITIVE_INFINITY },
  ];

  return ranges.map((range) => {
    const matchingItems = items.filter((item) => {
      if (item.reconciliationStatus !== 'awaiting_settlement') {
        return false;
      }

      const ageInDays = Math.max(
        0,
        Math.floor((anchor - new Date(item.recordedAt).getTime()) / (1000 * 60 * 60 * 24)),
      );

      return ageInDays >= range.min && ageInDays <= range.max;
    });

    return {
      label: range.label,
      count: matchingItems.length,
      amount: matchingItems.reduce((sum, item) => sum + item.amount, 0),
    };
  });
}

function buildDemoSchoolSettlements(items: SchoolCollectionItem[]) {
  return Array.from(
    items.reduce<
      Map<
        string,
        {
          schoolId: string;
          schoolName: string;
          receipts: number;
          totalAmount: number;
          matchedAmount: number;
          awaitingSettlementAmount: number;
          pendingSettlement: number;
          lastRecordedAt?: string;
        }
      >
    >((accumulator, item) => {
      const current = accumulator.get(item.schoolId) ?? {
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        receipts: 0,
        totalAmount: 0,
        matchedAmount: 0,
        awaitingSettlementAmount: 0,
        pendingSettlement: 0,
        lastRecordedAt: item.recordedAt,
      };

      current.receipts += 1;
      current.totalAmount += item.amount;
      current.lastRecordedAt =
        !current.lastRecordedAt || current.lastRecordedAt < item.recordedAt
          ? item.recordedAt
          : current.lastRecordedAt;

      if (item.reconciliationStatus === 'matched') {
        current.matchedAmount += item.amount;
      } else if (item.reconciliationStatus === 'awaiting_settlement') {
        current.awaitingSettlementAmount += item.amount;
        current.pendingSettlement += 1;
      }

      accumulator.set(item.schoolId, current);
      return accumulator;
    }, new Map())
      .values(),
  ).sort((left, right) => right.awaitingSettlementAmount - left.awaitingSettlementAmount);
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}
