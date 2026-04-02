import {
  type AuditApi,
  type AuditLogItem,
  type AuthApi,
  type CreateManagerNotificationCampaignPayload,
  type DashboardApi,
  type InsuranceAlertItem,
  type ManagerDashboardSummary,
  type NotificationApi,
  type NotificationCampaignItem,
  type NotificationCenterItem,
  type NotificationLogItem,
  type NotificationTemplateItem,
  type PerformancePeriod,
  type PerformanceSummaryItem,
  type RolePerformanceItem,
  type RolePerformanceOverview,
  type SupportApi,
  type SupportChatDetail,
  type SupportChatSummaryItem,
  type StaffRankingItem,
  type StaffLoginPayload,
  type VoteAdminItem,
  type VotingApi,
  type VotingSummaryItem,
} from './contracts';
import {
  AdminRole,
  isHeadOfficeConsoleRole,
  type AdminSession,
} from '../session';

export class DemoAuthApi implements AuthApi {
  async login(payload: StaffLoginPayload): Promise<AdminSession> {
    await wait(250);

    const normalized = payload.identifier.trim().toLowerCase();

    const session = normalized.includes('zelalem') || normalized.includes('admin')
      ? {
          userId: 'staff_admin_1',
          fullName: 'Zelalem Bemintu',
          role: AdminRole.ADMIN,
          branchName: 'Head Office',
        }
      : normalized.includes('head') || normalized === 'admin@bunna.local'
        ? {
            userId: 'staff_head_office_1',
            fullName: 'Aster Mengistu',
            role: AdminRole.HEAD_OFFICE_MANAGER,
            branchName: 'Head Office',
          }
        : {
            userId: 'staff_head_office_1',
            fullName: 'Aster Mengistu',
            role: AdminRole.HEAD_OFFICE_MANAGER,
            branchName: 'Head Office',
          };

    if (!isHeadOfficeConsoleRole(session.role)) {
      throw new Error(
        'This Bunna manager console is restricted to Head Office staff only.',
      );
    }

    return session;
  }
}

export class DemoSupportApi implements SupportApi {
  async getOpenChats(): Promise<SupportChatSummaryItem[]> {
    await wait(160);

    return [
      {
        conversationId: 'chat_open_1',
        customerId: 'MBR-1001',
        memberName: 'Abebe Kebede',
        phoneNumber: '0911000001',
        branchName: 'Bahir Dar Branch',
        status: 'waiting_agent',
        issueCategory: 'loan_issue',
        memberType: 'shareholder',
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
        customerId: 'MBR-1002',
        memberName: 'Meseret Alemu',
        phoneNumber: '0911000002',
        branchName: 'Gondar Branch',
        status: 'waiting_customer',
        issueCategory: 'payment_issue',
        memberType: 'member',
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
        customerId: 'MBR-1003',
        memberName: 'Tigist Bekele',
        phoneNumber: '0911000003',
        branchName: 'Debre Markos Branch',
        status: 'resolved',
        issueCategory: 'kyc_issue',
        memberType: 'member',
        lastMessage: 'Your account access issue was resolved.',
        updatedAt: '2026-03-10T16:40:00.000Z',
      },
    ];
  }

  async getChat(chatId: string): Promise<SupportChatDetail> {
    await wait(140);

    return {
      conversationId: chatId,
      customerId: chatId === 'chat_open_1' ? 'MBR-1001' : 'MBR-1002',
      memberName: chatId === 'chat_open_1' ? 'Abebe Kebede' : 'Meseret Alemu',
      phoneNumber: chatId === 'chat_open_1' ? '0911000001' : '0911000002',
      branchName: chatId === 'chat_open_1' ? 'Bahir Dar Branch' : 'Gondar Branch',
      status: chatId === 'chat_open_1' ? 'waiting_agent' : 'waiting_customer',
      issueCategory: chatId === 'chat_open_1' ? 'loan_issue' : 'payment_issue',
      memberType: chatId === 'chat_open_1' ? 'shareholder' : 'member',
      priority: chatId === 'chat_open_1' ? 'high' : 'normal',
      assignedAgentId: chatId === 'chat_open_1' ? undefined : 'support_1',
      assignedToStaffName: chatId === 'chat_open_1' ? undefined : 'Rahel Desta',
      messages: [
        {
          id: 'msg_1',
          senderType: 'customer',
          senderName: chatId === 'chat_open_1' ? 'Abebe Kebede' : 'Meseret Alemu',
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

    return [
      {
        scopeId: 'north_district',
        customersServed: 720,
        transactionsCount: 4200,
        loanApprovedCount: 58,
        loanRejectedCount: 16,
        schoolPaymentsCount: 290,
        totalTransactionAmount: 12800000,
      },
      {
        scopeId: 'central_district',
        customersServed: 655,
        transactionsCount: 3960,
        loanApprovedCount: 49,
        loanRejectedCount: 14,
        schoolPaymentsCount: 254,
        totalTransactionAmount: 11700000,
      },
      {
        scopeId: 'west_district',
        customersServed: 590,
        transactionsCount: 3610,
        loanApprovedCount: 44,
        loanRejectedCount: 12,
        schoolPaymentsCount: 231,
        totalTransactionAmount: 10900000,
      },
    ];
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

  async getHeadOfficeDistrictSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    await wait(150);
    return buildDemoOverview('district', period, demoHeadOfficeDistricts());
  }

  async getHeadOfficeTopDistricts(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return demoHeadOfficeDistricts().slice(0, 2);
  }

  async getHeadOfficeDistrictWatchlist(
    _role: AdminRole,
    _period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    await wait(120);
    return [...demoHeadOfficeDistricts()]
      .sort((left, right) => left.score - right.score)
      .slice(0, 2);
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

function demoHeadOfficeDistricts(): RolePerformanceItem[] {
  return [
    createDemoPerformanceItem('district', 'Addis Abeba District', 94, {
      membersServed: 4520,
      customersHelped: 4385,
      loansHandled: 1108,
      loansApproved: 586,
      loansEscalated: 82,
      kycCompleted: 912,
      supportResolved: 1094,
      transactionsProcessed: 5980,
      avgHandlingTime: 11,
      pendingTasks: 14,
      pendingApprovals: 11,
      responseTimeMinutes: 9,
      districtName: 'Addis Abeba District',
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
      avgHandlingTime: 18,
      pendingTasks: 21,
      pendingApprovals: 16,
      responseTimeMinutes: 13,
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
      avgHandlingTime: 19,
      pendingTasks: 28,
      pendingApprovals: 22,
      responseTimeMinutes: 17,
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
      avgHandlingTime: 23,
      pendingTasks: 34,
      pendingApprovals: 27,
      responseTimeMinutes: 21,
      districtName: 'Mekele District',
    }),
    createDemoPerformanceItem('district', 'Gondar District', 61, {
      membersServed: 2018,
      customersHelped: 1940,
      loansHandled: 514,
      loansApproved: 201,
      loansEscalated: 122,
      kycCompleted: 388,
      supportResolved: 476,
      transactionsProcessed: 2685,
      avgHandlingTime: 25,
      pendingTasks: 29,
      pendingApprovals: 23,
      responseTimeMinutes: 19,
      districtName: 'Gondar District',
    }),
  ];
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
      },
      {
        voteId: 'vote_2025_dividend',
        title: 'Dividend Approval 2025',
        status: 'published',
        totalResponses: 92100,
        participationRate: 51.17,
      },
    ];

    if (
      role === AdminRole.HEAD_OFFICE_OFFICER ||
      role === AdminRole.HEAD_OFFICE_MANAGER ||
      role === AdminRole.ADMIN
    ) {
      return votes;
    }

    return votes.slice(0, 1);
  }

  async createVote(): Promise<void> {
    await wait(120);
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
        userLabel: 'Member 1001',
        status: 'sent',
        sentAt: '2026-03-09 10:30',
      },
      {
        notificationId: 'notif_2',
        type: 'voting',
        userLabel: 'Shareholder 2044',
        status: 'pending',
        sentAt: '2026-03-09 11:05',
      },
      {
        notificationId: 'notif_3',
        type: 'payment',
        userLabel: 'Member 1333',
        status: 'read',
        sentAt: '2026-03-09 11:12',
      },
    ];

    if (role === AdminRole.BRANCH_MANAGER) {
      return items.slice(0, 2);
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
        channelDefaults: ['email', 'sms', 'in_app'],
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
        channelDefaults: ['email', 'sms', 'in_app'],
        isActive: true,
      },
      {
        id: 'tpl_payment_confirmation',
        category: 'loan',
        templateType: 'payment_confirmation',
        title: 'Payment confirmation',
        subject: 'Payment Confirmation',
        messageBody:
          'We have successfully received your payment. Review the payment summary below.',
        channelDefaults: ['email', 'in_app'],
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
        channelDefaults: ['email', 'sms', 'telegram', 'in_app'],
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
        targetIds: ['MBR-1001', 'MBR-1002'],
        messageSubject: 'Insurance renewal reminder',
        messageBody: 'Your insurance policy is due for renewal soon.',
        status: 'completed',
        sentAt: '2026-03-11T11:00:00.000Z',
      },
      {
        id: 'camp_2',
        category: 'loan',
        templateType: 'payment_confirmation',
        channels: ['email', 'in_app'],
        targetType: 'selected_customers',
        targetIds: ['MBR-1010'],
        messageSubject: 'Payment Confirmation',
        messageBody: 'We have successfully received your payment.',
        status: 'draft',
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
      targetIds: ['MBR-1001'],
      messageSubject: 'Insurance renewal reminder',
      messageBody: 'Your insurance policy is due for renewal soon.',
      status: 'completed',
      sentAt: new Date().toISOString(),
    };
  }

  async getLogs(): Promise<NotificationLogItem[]> {
    await wait(120);

    return [
      {
        id: 'log_1',
        campaignId: 'camp_1',
        memberId: 'MBR-1001',
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
        memberId: 'MBR-1002',
        category: 'insurance',
        channel: 'telegram',
        recipient: '@member1002',
        status: 'failed',
        messageSubject: 'Insurance renewal reminder',
        messageBody: 'Your insurance policy is due for renewal soon.',
        errorMessage: 'Telegram chat is not linked.',
      },
    ];
  }

  async getInsuranceAlerts(): Promise<InsuranceAlertItem[]> {
    await wait(120);

    return [
      {
        loanId: 'LN-1001',
        memberId: 'MBR-1001',
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
        memberId: 'MBR-1008',
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
        actor: 'admin_01',
        action: 'vote_submitted',
        entity: 'vote_2026',
        timestamp: '2026-03-09 10:12',
      },
      {
        auditId: 'audit_2',
        actor: 'staff_21',
        action: 'loan_approve',
        entity: 'loan_1004',
        timestamp: '2026-03-09 09:44',
      },
      {
        auditId: 'audit_3',
        actor: 'member_88',
        action: 'member_profile_updated',
        entity: 'member_88',
        timestamp: '2026-03-09 08:18',
      },
    ];

    if (role === AdminRole.ADMIN || role === AdminRole.HEAD_OFFICE_MANAGER) {
      return items;
    }

    return items.slice(0, 2);
  }

  async getByActor(role: AdminRole): Promise<AuditLogItem[]> {
    return this.getByEntity(role);
  }
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}
