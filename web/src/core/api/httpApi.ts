import {
  type AttachmentMetadata,
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
  type LoanCustomerProfile,
  type LoanMonitoringApi,
  type LoanQueueDetail,
  type LoanQueueItem,
  type ManagerDashboardSummary,
  type NotificationApi,
  type PaymentOperationsApi,
  type PaymentActivityItem,
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
  type ParentPortalApi,
  type ParentPortalSession,
  type ParentPortalPaymentResult,
  type ParentStudentAccount,
  type ParentStudentLookupItem,
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
  type ServiceRequestListResult,
  type SupportApi,
  type SupportChatDetail,
  type SupportChatSummaryItem,
  type StaffLoginPayload,
  type StaffRankingItem,
  type VoteAdminItem,
  type VoteResultItem,
  type VotingApi,
  type VotingSummaryItem,
} from './contracts';
import {
  applyLocalDemoDirectorRole,
  type AppSession,
  type AdminRole,
} from '../session';
import { HttpClient } from './httpClient';

const ACCESS_TOKEN_KEY = 'bunna_access_token';
const REFRESH_TOKEN_KEY = 'bunna_refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'bunna_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'bunna_refresh_token';

type StaffLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: AdminRole | 'school_admin';
    fullName?: string;
    identifier?: string;
    email?: string;
    staffNumber?: string;
    branchId?: string;
    districtId?: string;
    branchName?: string;
    districtName?: string;
    schoolId?: string;
    schoolName?: string;
    permissions?: string[];
  };
};

export class HttpAuthApi implements AuthApi {
  constructor(private readonly httpClient: HttpClient) {}

  async login(payload: StaffLoginPayload): Promise<AppSession> {
    const response = await this.httpClient.request<StaffLoginResponse>(
      '/auth/staff/login',
      {
        method: 'POST',
        body: payload,
      },
    );

    window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

    if (response.user.schoolId && response.user.schoolName) {
      return {
        sessionType: 'school',
        userId: response.user.id,
        fullName:
          response.user.fullName ?? formatIdentifierLabel(payload.identifier),
        schoolId: response.user.schoolId,
        schoolName: response.user.schoolName,
        roleLabel: 'School Administrator',
        identifier: response.user.identifier ?? payload.identifier,
        email: response.user.email,
        branchName: response.user.branchName,
        permissions: response.user.permissions ?? [],
      };
    }

    return applyLocalDemoDirectorRole({
      sessionType: 'admin',
      userId: response.user.id,
      fullName:
        response.user.fullName ?? formatIdentifierLabel(payload.identifier),
      role: response.user.role as AdminRole,
      identifier: response.user.identifier ?? payload.identifier,
      email: response.user.email,
      branchId: response.user.branchId,
      districtId: response.user.districtId,
      branchName: response.user.branchName,
      districtName: response.user.districtName,
      permissions: response.user.permissions ?? [],
    }, payload.identifier);
  }

  async checkExistingAccount(payload: {
    phoneNumber?: string;
    faydaFin?: string;
    email?: string;
  }) {
    return this.httpClient.request<{
      exists: boolean;
      matchType?: 'phone' | 'fayda_fin' | 'national_id_data' | 'email';
      message: string;
      customerId?: string;
    }>('/auth/check-existing-account', {
      method: 'POST',
      body: payload,
    });
  }

  async verifyStaffStepUp(payload: { password: string; memberId: string }) {
    return this.httpClient.request<{
      stepUpToken: string;
      verifiedAt: string;
      expiresInSeconds: number;
      method: string;
    }>('/auth/staff/verify-step-up', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }
}

export class HttpDashboardApi implements DashboardApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getSummary(_role: AdminRole): Promise<ManagerDashboardSummary> {
    return this.httpClient.request<ManagerDashboardSummary>(
      '/manager/dashboard/summary',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getBranchPerformance(
    _role: AdminRole,
  ): Promise<PerformanceSummaryItem[]> {
    return this.httpClient.request<PerformanceSummaryItem[]>(
      '/manager/dashboard/branch-performance',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getDistrictPerformance(
    _role: AdminRole,
  ): Promise<PerformanceSummaryItem[]> {
    return this.httpClient.request<PerformanceSummaryItem[]>(
      '/manager/dashboard/district-performance',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getStaffRanking(_role: AdminRole): Promise<StaffRankingItem[]> {
    return this.httpClient.request<StaffRankingItem[]>(
      '/manager/dashboard/staff-ranking',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getVotingSummary(): Promise<VotingSummaryItem[]> {
    return this.httpClient.request<VotingSummaryItem[]>(
      '/manager/dashboard/voting-summary',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getOnboardingReviewQueue(
    _role: AdminRole,
  ): Promise<OnboardingReviewItem[]> {
    return this.httpClient.request<OnboardingReviewItem[]>(
      '/manager/dashboard/onboarding-review',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getOnboardingEvidenceDetail(
    memberId: string,
  ): Promise<OnboardingEvidenceDetail> {
    return this.httpClient.request<OnboardingEvidenceDetail>(
      `/manager/dashboard/onboarding-review/${memberId}/evidence`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getProtectedDocumentBlob(storageKey: string): Promise<Blob> {
    return this.httpClient.requestBlob(
      `/uploads/documents?storageKey=${encodeURIComponent(storageKey)}`,
      {
        accessToken: getAccessToken(),
      },
    );
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
    return this.httpClient.request<OnboardingReviewItem>(
      `/manager/dashboard/onboarding-review/${memberId}`,
      {
        method: 'PATCH',
        accessToken: getAccessToken(),
        body: payload,
      },
    );
  }

  async getAutopayOperations(_role: AdminRole): Promise<AutopayOperationItem[]> {
    return this.httpClient.request<AutopayOperationItem[]>(
      '/manager/dashboard/autopay-operations',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async updateAutopayOperation(
    id: string,
    payload: {
      enabled: boolean;
      note?: string;
    },
  ): Promise<AutopayOperationItem> {
    return this.httpClient.request<AutopayOperationItem>(
      `/manager/dashboard/autopay-operations/${id}`,
      {
        method: 'PATCH',
        accessToken: getAccessToken(),
        body: payload,
      },
    );
  }

  async getHeadOfficeDistrictSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    return this.requestPerformanceOverview(
      `/manager/head-office/performance/districts/summary?period=${period}`,
    );
  }

  async getHeadOfficeTopDistricts(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/head-office/performance/districts/top?period=${period}`,
    );
  }

  async getHeadOfficeDistrictWatchlist(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/head-office/performance/districts/watchlist?period=${period}`,
    );
  }

  async getDistrictBranchSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    return this.requestPerformanceOverview(
      `/manager/district/performance/branches/summary?period=${period}`,
    );
  }

  async getDistrictTopBranches(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/district/performance/branches/top?period=${period}`,
    );
  }

  async getDistrictBranchWatchlist(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/district/performance/branches/watchlist?period=${period}`,
    );
  }

  async getBranchEmployeeSummary(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceOverview> {
    return this.requestPerformanceOverview(
      `/manager/branch/performance/employees/summary?period=${period}`,
    );
  }

  async getBranchTopEmployees(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/branch/performance/employees/top?period=${period}`,
    );
  }

  async getBranchEmployeeWatchlist(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<RolePerformanceItem[]> {
    return this.requestPerformanceItems(
      `/manager/branch/performance/employees/watchlist?period=${period}`,
    );
  }

  async getHeadOfficeCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<HeadOfficeCommandCenterSummary> {
    return this.httpClient.request<HeadOfficeCommandCenterSummary>(
      `/manager/command-center/head-office?period=${period}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getDistrictCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<DistrictCommandCenterSummary> {
    return this.httpClient.request<DistrictCommandCenterSummary>(
      `/manager/command-center/district?period=${period}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getBranchCommandCenter(
    _role: AdminRole,
    period: PerformancePeriod = 'week',
  ): Promise<BranchCommandCenterSummary> {
    return this.httpClient.request<BranchCommandCenterSummary>(
      `/manager/command-center/branch?period=${period}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  private requestPerformanceOverview(path: string) {
    return this.httpClient.request<RolePerformanceOverview>(path, {
      accessToken: getAccessToken(),
    });
  }

  private requestPerformanceItems(path: string) {
    return this.httpClient.request<RolePerformanceItem[]>(path, {
      accessToken: getAccessToken(),
    });
  }
}

export class HttpLoanMonitoringApi implements LoanMonitoringApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getPendingLoans(): Promise<LoanQueueItem[]> {
    return this.httpClient.request<LoanQueueItem[]>('/loan-workflow/queue', {
      accessToken: getAccessToken(),
    });
  }

  async getLoanDetail(loanId: string): Promise<LoanQueueDetail | null> {
    return this.httpClient.request<LoanQueueDetail>(`/loan-workflow/queue/${loanId}`, {
      accessToken: getAccessToken(),
    });
  }

  async getCustomerProfile(loanId: string): Promise<LoanCustomerProfile | null> {
    return this.httpClient.request<LoanCustomerProfile>(
      `/loan-workflow/queue/${loanId}/customer-profile`,
      {
      accessToken: getAccessToken(),
      },
    );
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
    return this.httpClient.request<{
      loanId: string;
      previousStatus: string;
      status: string;
      currentLevel: string;
    }>(`/loan-workflow/${loanId}/action`, {
      method: 'PATCH',
      accessToken: getAccessToken(),
      body: payload,
    });
  }
}

export class HttpNotificationApi implements NotificationApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getNotifications(_role: AdminRole): Promise<NotificationCenterItem[]> {
    const result = await this.httpClient.request<
      Array<{
        id: string;
        type: string;
        userId: string;
        status: string;
        title: string;
        actionLabel?: string;
        deepLink?: string;
        priority?: string;
        createdAt?: string;
      }>
    >('/notifications', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      notificationId: item.id,
      type: item.type,
      userId: item.userId,
      userLabel: item.title,
      status: item.status,
      sentAt: item.createdAt ?? 'n/a',
      actionLabel: item.actionLabel,
      deepLink: item.deepLink,
      priority: item.priority,
    }));
  }

  async getTemplates(): Promise<NotificationTemplateItem[]> {
    const result = await this.httpClient.request<
      Array<{
        _id: string;
        category: NotificationTemplateItem['category'];
        templateType: string;
        title: string;
        subject?: string;
        messageBody: string;
        channelDefaults: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
        isActive: boolean;
      }>
    >('/manager/notifications/templates', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      id: item._id,
      category: item.category,
      templateType: item.templateType,
      title: item.title,
      subject: item.subject,
      messageBody: item.messageBody,
      channelDefaults: item.channelDefaults,
      isActive: item.isActive,
    }));
  }

  async getCampaigns(): Promise<NotificationCampaignItem[]> {
    const result = await this.httpClient.request<
      Array<{
        _id: string;
        category: NotificationCampaignItem['category'];
        templateType: string;
        channels: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
        targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
        targetIds: string[];
        messageSubject?: string;
        messageBody: string;
        status: NotificationCampaignItem['status'];
        scheduledAt?: string;
        sentAt?: string;
        deliverySummary?: NotificationCampaignItem['deliverySummary'];
      }>
    >('/manager/notifications/campaigns', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      id: item._id,
      category: item.category,
      templateType: item.templateType,
      channels: item.channels,
      targetType: item.targetType,
      targetIds: item.targetIds,
      messageSubject: item.messageSubject,
      messageBody: item.messageBody,
      status: item.status,
      scheduledAt: item.scheduledAt,
      sentAt: item.sentAt,
      deliverySummary: item.deliverySummary,
    }));
  }

  async createCampaign(
    payload: CreateManagerNotificationCampaignPayload,
  ): Promise<NotificationCampaignItem> {
    const result = await this.httpClient.request<{
      _id: string;
      category: NotificationCampaignItem['category'];
      templateType: string;
      channels: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
      targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
      targetIds: string[];
      messageSubject?: string;
      messageBody: string;
      status: NotificationCampaignItem['status'];
      scheduledAt?: string;
      sentAt?: string;
      deliverySummary?: NotificationCampaignItem['deliverySummary'];
    }>('/manager/notifications/campaigns', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });

    return {
      id: result._id,
      category: result.category,
      templateType: result.templateType,
      channels: result.channels,
      targetType: result.targetType,
      targetIds: result.targetIds,
      messageSubject: result.messageSubject,
      messageBody: result.messageBody,
      status: result.status,
      scheduledAt: result.scheduledAt,
      sentAt: result.sentAt,
      deliverySummary: result.deliverySummary,
    };
  }

  async sendCampaign(campaignId: string): Promise<NotificationCampaignItem> {
    const result = await this.httpClient.request<{
      _id: string;
      category: NotificationCampaignItem['category'];
      templateType: string;
      channels: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
      targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
      targetIds: string[];
      messageSubject?: string;
      messageBody: string;
      status: NotificationCampaignItem['status'];
      scheduledAt?: string;
      sentAt?: string;
      deliverySummary?: NotificationCampaignItem['deliverySummary'];
    }>(`/manager/notifications/campaigns/${campaignId}/send`, {
      method: 'POST',
      accessToken: getAccessToken(),
    });

    return {
      id: result._id,
      category: result.category,
      templateType: result.templateType,
      channels: result.channels,
      targetType: result.targetType,
      targetIds: result.targetIds,
      messageSubject: result.messageSubject,
      messageBody: result.messageBody,
      status: result.status,
      scheduledAt: result.scheduledAt,
      sentAt: result.sentAt,
      deliverySummary: result.deliverySummary,
    };
  }

  async getLogs(campaignId?: string): Promise<NotificationLogItem[]> {
    const path = campaignId
      ? `/manager/notifications/logs/${campaignId}`
      : '/manager/notifications/logs';
    const result = await this.httpClient.request<
      Array<{
        _id: string;
        campaignId: string;
        memberId: string;
        category: NotificationLogItem['category'];
        channel: 'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app';
        recipient: string;
        status: NotificationLogItem['status'];
        messageSubject?: string;
        messageBody: string;
        errorMessage?: string;
        sentAt?: string;
      }>
    >(path, {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      id: item._id,
      campaignId: item.campaignId,
      memberId: item.memberId,
      category: item.category,
      channel: item.channel,
      recipient: item.recipient,
      status: item.status,
      messageSubject: item.messageSubject,
      messageBody: item.messageBody,
      errorMessage: item.errorMessage,
      sentAt: item.sentAt,
    }));
  }

  async getInsuranceAlerts(): Promise<InsuranceAlertItem[]> {
    return this.httpClient.request<InsuranceAlertItem[]>('/manager/insurance/alerts', {
      accessToken: getAccessToken(),
    });
  }
}

export class HttpRecommendationApi implements RecommendationApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getDashboardSummary(): Promise<RecommendationDashboardSummary> {
    return this.httpClient.request<RecommendationDashboardSummary>(
      '/admin/recommendations/dashboard-summary',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getCustomerRecommendations(
    memberId: string,
  ): Promise<RecommendationCollection> {
    return this.httpClient.request<RecommendationCollection>(
      `/admin/recommendations/customers/${memberId}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async generateForCustomer(memberId: string): Promise<void> {
    await this.httpClient.request(
      `/admin/recommendations/generate/${memberId}`,
      {
        method: 'POST',
        accessToken: getAccessToken(),
      },
    );
  }
}

export class HttpVotingApi implements VotingApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getVotes(_role: AdminRole): Promise<VoteAdminItem[]> {
    return this.httpClient.request<VoteAdminItem[]>('/admin/votes', {
      accessToken: getAccessToken(),
    });
  }

  async createVote(payload: CreateVotePayload): Promise<VoteAdminItem> {
    const result = await this.httpClient.request<{
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
    }>('/votes', {
      method: 'POST',
      accessToken: getAccessToken(),
      body: payload,
    });

    return {
      voteId: result.id,
      title: result.title,
      status: result.status,
      totalResponses: 0,
      participationRate: 0,
      eligibleShareholders: 0,
      startDate: result.startDate,
      endDate: result.endDate,
    };
  }

  async openVote(voteId: string): Promise<VoteAdminItem> {
    const result = await this.httpClient.request<{
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
    }>(`/votes/${voteId}/open`, {
      method: 'POST',
      accessToken: getAccessToken(),
    });

    return {
      voteId: result.id,
      title: result.title,
      status: result.status,
      totalResponses: 0,
      participationRate: 0,
      eligibleShareholders: 0,
      startDate: result.startDate,
      endDate: result.endDate,
    };
  }

  async closeVote(voteId: string): Promise<VoteAdminItem> {
    const result = await this.httpClient.request<{
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
    }>(`/votes/${voteId}/close`, {
      method: 'POST',
      accessToken: getAccessToken(),
    });

    return {
      voteId: result.id,
      title: result.title,
      status: result.status,
      totalResponses: 0,
      participationRate: 0,
      eligibleShareholders: 0,
      startDate: result.startDate,
      endDate: result.endDate,
    };
  }

  async getResults(voteId: string): Promise<VoteResultItem[]> {
    return this.httpClient.request<VoteResultItem[]>(`/votes/${voteId}/results`, {
      accessToken: getAccessToken(),
    });
  }

  async getParticipation(voteId: string): Promise<VotingSummaryItem | null> {
    const result = await this.httpClient.request<{
      totalResponses: number;
      uniqueBranches: number;
      uniqueDistricts: number;
      eligibleShareholders: number;
      participationRate: number;
      branchParticipation: VotingSummaryItem['branchParticipation'];
      districtParticipation: VotingSummaryItem['districtParticipation'];
    }>(`/votes/${voteId}/participation`, {
      accessToken: getAccessToken(),
    });

    return {
      voteId,
      title: `Vote ${voteId}`,
      totalResponses: result.totalResponses,
      eligibleShareholders: result.eligibleShareholders,
      participationRate: result.participationRate,
      uniqueBranches: result.uniqueBranches,
      uniqueDistricts: result.uniqueDistricts,
      branchParticipation: result.branchParticipation,
      districtParticipation: result.districtParticipation,
    };
  }
}

export class HttpAuditApi implements AuditApi {
  constructor(private readonly httpClient: HttpClient) {}

  private mapAuditLogItem(item: {
    id: string;
    auditDigest?: string;
    decisionVersion?: number;
    isCurrentDecision?: boolean;
    supersedesAuditId?: string;
    supersededByAuditId?: string;
    actorId: string;
    actorRole?: string;
    actionType: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    createdAt?: string;
  }): AuditLogItem {
    return {
      auditId: item.id,
      auditDigest: item.auditDigest,
      decisionVersion: item.decisionVersion,
      isCurrentDecision: item.isCurrentDecision,
      supersedesAuditId: item.supersedesAuditId,
      supersededByAuditId: item.supersededByAuditId,
      actor: item.actorId,
      actorRole: item.actorRole,
      action: item.actionType,
      entity: `${item.entityType}:${item.entityId}`,
      entityType: item.entityType,
      entityId: item.entityId,
      timestamp: item.createdAt ?? 'n/a',
      before: item.before ?? null,
      after: item.after ?? null,
    };
  }

  async getByEntity(_role: AdminRole): Promise<AuditLogItem[]> {
    const result = await this.httpClient.request<
      Array<{
        id: string;
        auditDigest?: string;
        decisionVersion?: number;
        isCurrentDecision?: boolean;
        supersedesAuditId?: string;
        supersededByAuditId?: string;
        actorId: string;
        actorRole?: string;
        actionType: string;
        entityType: string;
        entityId: string;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        createdAt?: string;
      }>
    >('/audit', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => this.mapAuditLogItem(item));
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLogItem[]> {
    const result = await this.httpClient.request<
      Array<{
        id: string;
        auditDigest?: string;
        decisionVersion?: number;
        isCurrentDecision?: boolean;
        supersedesAuditId?: string;
        supersededByAuditId?: string;
        actorId: string;
        actorRole?: string;
        actionType: string;
        entityType: string;
        entityId: string;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        createdAt?: string;
      }>
    >(`/audit/entity/${entityType}/${entityId}`, {
      accessToken: getAccessToken(),
    });

    return result.map((item) => this.mapAuditLogItem(item));
  }

  async getByActor(_role: AdminRole): Promise<AuditLogItem[]> {
    return this.getByEntity(_role);
  }

  async verifyAuditLog(auditId: string): Promise<AuditLogVerificationResult> {
    return this.httpClient.request<AuditLogVerificationResult>(
      `/audit/${auditId}/verify`,
      {
        accessToken: getAccessToken(),
      },
    );
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
    const params = new URLSearchParams();

    if (query?.actorId) {
      params.set('actorId', query.actorId);
    }
    if (query?.memberId) {
      params.set('memberId', query.memberId);
    }
    if (query?.status) {
      params.set('status', query.status);
    }
    if (query?.approvalReasonCode) {
      params.set('approvalReasonCode', query.approvalReasonCode);
    }
    if (query?.dateFrom) {
      params.set('dateFrom', query.dateFrom);
    }
    if (query?.dateTo) {
      params.set('dateTo', query.dateTo);
    }
    if (query?.currentOnly) {
      params.set('currentOnly', 'true');
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const result = await this.httpClient.request<
      Array<{
        id: string;
        auditDigest?: string;
        decisionVersion?: number;
        isCurrentDecision?: boolean;
        supersedesAuditId?: string;
        supersededByAuditId?: string;
        actorId: string;
        actorRole?: string;
        actionType: string;
        entityType: string;
        entityId: string;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        createdAt?: string;
      }>
    >(`/audit/onboarding-review-decisions${suffix}`, {
      accessToken: getAccessToken(),
    });

    return result.map((item) => this.mapAuditLogItem(item));
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
    const params = new URLSearchParams();

    if (query?.actorId) {
      params.set('actorId', query.actorId);
    }
    if (query?.memberId) {
      params.set('memberId', query.memberId);
    }
    if (query?.status) {
      params.set('status', query.status);
    }
    if (query?.approvalReasonCode) {
      params.set('approvalReasonCode', query.approvalReasonCode);
    }
    if (query?.dateFrom) {
      params.set('dateFrom', query.dateFrom);
    }
    if (query?.dateTo) {
      params.set('dateTo', query.dateTo);
    }
    if (query?.currentOnly) {
      params.set('currentOnly', 'true');
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.httpClient.requestBlob(`/audit/onboarding-review-decisions/export${suffix}`, {
      accessToken: getAccessToken(),
    });
  }
}

export class HttpSupportApi implements SupportApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getOpenChats(): Promise<SupportChatSummaryItem[]> {
    const result = await this.httpClient.request<
      Array<{
        conversationId: string;
        customerId: string;
        memberId?: string;
        memberName?: string;
        phoneNumber?: string;
        branchName?: string;
        status: string;
        issueCategory?: string;
        category?: string;
        memberType: string;
        priority?: string;
        escalationFlag?: boolean;
        responseDueAt?: string;
        slaState?: 'on_track' | 'attention' | 'breached';
        latestMessage?: { message?: string };
        updatedAt?: string;
      }>
    >('/support/console/chats/open', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      conversationId: item.conversationId,
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      phoneNumber: item.phoneNumber,
      branchName: item.branchName,
      status: item.status,
      issueCategory: item.category ?? item.issueCategory ?? 'general_help',
      memberType: item.memberType,
      priority: item.priority,
      escalationFlag: item.escalationFlag ?? false,
      responseDueAt: item.responseDueAt,
      slaState: item.slaState,
      lastMessage: item.latestMessage?.message ?? '',
      updatedAt: item.updatedAt ?? '',
    }));
  }

  async getAssignedChats(): Promise<SupportChatSummaryItem[]> {
    const result = await this.httpClient.request<
      Array<{
        conversationId: string;
        customerId: string;
        memberId?: string;
        memberName?: string;
        phoneNumber?: string;
        branchName?: string;
        status: string;
        issueCategory?: string;
        category?: string;
        memberType: string;
        priority?: string;
        escalationFlag?: boolean;
        responseDueAt?: string;
        slaState?: 'on_track' | 'attention' | 'breached';
        latestMessage?: { message?: string };
        updatedAt?: string;
      }>
    >('/support/console/chats/assigned', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      conversationId: item.conversationId,
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      phoneNumber: item.phoneNumber,
      branchName: item.branchName,
      status: item.status,
      issueCategory: item.category ?? item.issueCategory ?? 'general_help',
      memberType: item.memberType,
      priority: item.priority,
      escalationFlag: item.escalationFlag ?? false,
      responseDueAt: item.responseDueAt,
      slaState: item.slaState,
      lastMessage: item.latestMessage?.message ?? '',
      updatedAt: item.updatedAt ?? '',
    }));
  }

  async getResolvedChats(): Promise<SupportChatSummaryItem[]> {
    const result = await this.httpClient.request<
      Array<{
        conversationId: string;
        customerId: string;
        memberId?: string;
        memberName?: string;
        phoneNumber?: string;
        branchName?: string;
        status: string;
        issueCategory?: string;
        category?: string;
        memberType: string;
        priority?: string;
        escalationFlag?: boolean;
        responseDueAt?: string;
        slaState?: 'on_track' | 'attention' | 'breached';
        latestMessage?: { message?: string };
        updatedAt?: string;
      }>
    >('/support/console/chats/resolved', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      conversationId: item.conversationId,
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      phoneNumber: item.phoneNumber,
      branchName: item.branchName,
      status: item.status,
      issueCategory: item.category ?? item.issueCategory ?? 'general_help',
      memberType: item.memberType,
      priority: item.priority,
      escalationFlag: item.escalationFlag ?? false,
      responseDueAt: item.responseDueAt,
      slaState: item.slaState,
      lastMessage: item.latestMessage?.message ?? '',
      updatedAt: item.updatedAt ?? '',
    }));
  }

  async getChat(chatId: string): Promise<SupportChatDetail> {
    const result = await this.httpClient.request<SupportChatDetail>(
      `/support/console/chats/${chatId}`,
      {
        accessToken: getAccessToken(),
      },
    );

    return {
      ...result,
      messages: result.messages.map((item) => ({
        ...item,
        createdAt: item.createdAt ?? '',
      })),
    };
  }

  async assignChat(chatId: string): Promise<SupportChatDetail> {
    return this.httpClient.request<SupportChatDetail>(
      `/support/console/chats/${chatId}/assign`,
      {
        method: 'POST',
        accessToken: getAccessToken(),
      },
    );
  }

  async reply(chatId: string, message: string): Promise<SupportChatDetail> {
    return this.httpClient.request<SupportChatDetail>(
      `/support/console/chats/${chatId}/messages`,
      {
        method: 'POST',
        body: { message },
        accessToken: getAccessToken(),
      },
    );
  }

  async resolve(chatId: string): Promise<SupportChatDetail> {
    return this.updateStatus(chatId, 'resolved');
  }

  async close(chatId: string): Promise<SupportChatDetail> {
    return this.httpClient.request<SupportChatDetail>(
      `/support/console/chats/${chatId}/status`,
      {
        method: 'PATCH',
        body: { status: 'closed' },
        accessToken: getAccessToken(),
      },
    );
  }

  async updateStatus(chatId: string, status: string): Promise<SupportChatDetail> {
    return this.httpClient.request<SupportChatDetail>(
      `/support/console/chats/${chatId}/status`,
      {
        method: 'PATCH',
        body: { status },
        accessToken: getAccessToken(),
      },
    );
  }
}

export class HttpServiceRequestApi implements ServiceRequestApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getRequests(): Promise<ServiceRequestListResult> {
    return this.httpClient.request<ServiceRequestListResult>('/manager/service-requests', {
      accessToken: getAccessToken(),
    });
  }

  async getRequest(requestId: string): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      `/manager/service-requests/${requestId}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getSecurityReviewMetrics(): Promise<SecurityReviewMetrics> {
    return this.httpClient.request<SecurityReviewMetrics>(
      '/manager/service-requests/security-review/metrics',
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async reportSecurityReviewMetricsContractIssue(payload: {
    detectedContractVersion: string;
    supportedContractVersion: string;
    source: string;
  }): Promise<{ ok: true }> {
    return this.httpClient.request<{ ok: true }>(
      '/manager/service-requests/security-review/metrics/report-contract-issue',
      {
        method: 'POST',
        accessToken: getAccessToken(),
        body: payload,
      },
    );
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
  }): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      '/manager/service-requests/security-review',
      {
        method: 'POST',
        body: payload,
        accessToken: getAccessToken(),
      },
    );
  }

  async assignToCurrentReviewer(requestId: string): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      `/manager/service-requests/${requestId}/assign`,
      {
        method: 'PATCH',
        body: {},
        accessToken: getAccessToken(),
      },
    );
  }

  async acknowledgeBreach(requestId: string): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      `/manager/service-requests/${requestId}/acknowledge-breach`,
      {
        method: 'PATCH',
        body: {},
        accessToken: getAccessToken(),
      },
    );
  }

  async escalateStalled(requestId: string): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      `/manager/service-requests/${requestId}/escalate-stalled`,
      {
        method: 'PATCH',
        body: {},
        accessToken: getAccessToken(),
      },
    );
  }

  async downloadAttachment(storageKey: string): Promise<Blob> {
    return this.httpClient.requestBlob(
      `/uploads/documents?storageKey=${encodeURIComponent(storageKey)}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getAttachmentMetadata(storageKey: string) {
    return this.httpClient.request<AttachmentMetadata>(
      `/uploads/documents/metadata?storageKey=${encodeURIComponent(storageKey)}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async updateStatus(
    requestId: string,
    payload: { status: string; note?: string },
  ): Promise<ServiceRequestDetail> {
    return this.httpClient.request<ServiceRequestDetail>(
      `/manager/service-requests/${requestId}/status`,
      {
        method: 'PATCH',
        body: payload,
        accessToken: getAccessToken(),
      },
    );
  }
}

export class HttpCardOperationsApi implements CardOperationsApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getRequests(): Promise<CardOperationItem[]> {
    return this.httpClient.request<CardOperationItem[]>('/manager/cards/requests', {
      accessToken: getAccessToken(),
    });
  }

  async getRequest(requestId: string): Promise<CardOperationDetail> {
    return this.httpClient.request<CardOperationDetail>(
      `/manager/cards/requests/${requestId}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async updateStatus(
    requestId: string,
    payload: { status: string; note?: string },
  ): Promise<CardOperationUpdateResult> {
    return this.httpClient.request<CardOperationUpdateResult>(
      `/manager/cards/requests/${requestId}/status`,
      {
      method: 'PATCH',
      body: payload,
      accessToken: getAccessToken(),
      },
    );
  }
}

export class HttpPaymentOperationsApi implements PaymentOperationsApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getActivity() {
    return this.httpClient.request<PaymentActivityItem[]>('/payments/activity', {
      accessToken: getAccessToken(),
    });
  }

  async getMemberReceipts(memberId: string): Promise<PaymentReceiptItem[]> {
    return this.httpClient.request<PaymentReceiptItem[]>(
      `/payments/receipts/member/${memberId}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async downloadAttachment(storageKey: string): Promise<Blob> {
    return this.httpClient.requestBlob(
      `/uploads/documents?storageKey=${encodeURIComponent(storageKey)}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }

  async getAttachmentMetadata(storageKey: string) {
    return this.httpClient.request<AttachmentMetadata>(
      `/uploads/documents/metadata?storageKey=${encodeURIComponent(storageKey)}`,
      {
        accessToken: getAccessToken(),
      },
    );
  }
}

export class HttpSchoolConsoleApi implements SchoolConsoleApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getOverview(): Promise<SchoolConsoleOverview> {
    const [institutionOverview, invoiceOverview, paymentOverview] = await Promise.all([
      this.httpClient.request<{
        totals: {
          schools: number;
          students: number;
          openInvoices: number;
          todayCollections: number;
        };
        schools: SchoolPortfolioItem[];
      }>('/institutions/schools/overview', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<{
        totals: {
          invoices: number;
          open: number;
          partiallyPaid: number;
          overdueAmount: number;
        };
        items: SchoolInvoiceItem[];
      }>('/invoices/overview', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<{
        totals: {
          receipts: number;
          successful: number;
          pendingSettlement: number;
          amount: number;
        };
        collectionSummary: {
          generatedAt: string;
          receipts: number;
          successful: number;
          pendingSettlement: number;
          totalAmount: number;
          matchedAmount: number;
          awaitingSettlementAmount: number;
          aging: Array<{
            label: string;
            count: number;
            amount: number;
          }>;
        };
        schoolSettlements: Array<{
          schoolId: string;
          schoolName: string;
          receipts: number;
          totalAmount: number;
          matchedAmount: number;
          awaitingSettlementAmount: number;
          pendingSettlement: number;
          lastRecordedAt?: string;
        }>;
        items: SchoolCollectionItem[];
      }>('/school-payments/overview', {
        accessToken: getAccessToken(),
      }),
    ]);

    return {
      summary: {
        schools: institutionOverview.totals.schools,
        students: institutionOverview.totals.students,
        openInvoices: institutionOverview.totals.openInvoices,
        todayCollections: institutionOverview.totals.todayCollections,
      },
      schools: institutionOverview.schools,
      invoices: invoiceOverview.items,
      collections: paymentOverview.items,
      collectionSummary: paymentOverview.collectionSummary,
      schoolSettlements: paymentOverview.schoolSettlements,
    };
  }

  async getFeePlans(schoolId?: string): Promise<FeePlanRecord[]> {
    const suffix = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return this.httpClient.request<FeePlanRecord[]>(`/fee-plans${suffix}`, {
      accessToken: getAccessToken(),
    });
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
    return this.httpClient.request<FeePlanRecord>('/fee-plans', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }

  async getRegistry(filters: StudentRegistryFilter = {}): Promise<StudentRegistryItem[]> {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        query.set(key, value);
      }
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';

    const [schools, students, guardians, enrollments] = await Promise.all([
      this.httpClient.request<SchoolPortfolioItem[]>('/institutions/schools', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<
        Array<{
          schoolId: string;
          studentId: string;
          fullName: string;
          grade: string;
          section: string;
          guardianName: string;
          guardianPhone: string;
          parentAccountNumber?: string;
          status: string;
          paymentSummary?: StudentRegistryItem['paymentSummary'];
          performanceSummary?: StudentRegistryItem['performanceSummary'];
          parentUpdateSummary?: string;
        }>
      >(`/students${suffix}`, {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<
        Array<{
          studentId: string;
          fullName: string;
          phone: string;
          status: string;
        }>
      >('/guardians', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<
        Array<{
          schoolId: string;
          studentId: string;
          academicYear: string;
          grade: string;
          section: string;
          rollNumber?: string;
          status: string;
        }>
      >('/enrollments', {
        accessToken: getAccessToken(),
      }),
    ]);

    const schoolNames = new Map(schools.map((item) => [item.id, item.name]));
    const guardiansByStudentId = new Map(guardians.map((item) => [item.studentId, item]));
    const enrollmentsByStudentId = new Map(
      enrollments.map((item) => [item.studentId, item]),
    );

    return students.map((item) => {
      const guardian = guardiansByStudentId.get(item.studentId);
      const enrollment = enrollmentsByStudentId.get(item.studentId);

      return {
        schoolId: item.schoolId,
        schoolName: schoolNames.get(item.schoolId) ?? item.schoolId,
        studentId: item.studentId,
        fullName: item.fullName,
        grade: enrollment?.grade ?? item.grade,
        section: enrollment?.section ?? item.section,
        guardianName: guardian?.fullName ?? item.guardianName,
        guardianPhone: guardian?.phone ?? item.guardianPhone,
        parentAccountNumber: item.parentAccountNumber,
        guardianStatus: guardian?.status ?? 'unlinked',
        enrollmentStatus: enrollment?.status ?? 'not_enrolled',
        academicYear: enrollment?.academicYear ?? 'n/a',
        rollNumber: enrollment?.rollNumber,
        status: item.status,
        paymentSummary: item.paymentSummary,
        performanceSummary: item.performanceSummary,
        parentUpdateSummary: item.parentUpdateSummary,
      };
    });
  }

  async getStudentDetail(studentId: string): Promise<StudentDetail | null> {
    const [registry, guardians, guardianLinks, invoiceOverview, paymentOverview] = await Promise.all([
      this.getRegistry(),
      this.httpClient.request<GuardianRecord[]>(
        `/guardians?studentId=${encodeURIComponent(studentId)}`,
        {
          accessToken: getAccessToken(),
        },
      ),
      this.httpClient.request<GuardianStudentLinkItem[]>(
        `/guardian-student-links?studentId=${encodeURIComponent(studentId)}`,
        {
          accessToken: getAccessToken(),
        },
      ),
      this.httpClient.request<{
        items: SchoolInvoiceItem[];
      }>('/invoices/overview', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<{
        items: SchoolCollectionItem[];
      }>('/school-payments/overview', {
        accessToken: getAccessToken(),
      }),
    ]);

    const student = registry.find((item) => item.studentId === studentId);
    if (!student) {
      return null;
    }

    return {
      student,
      guardians,
      guardianLinks,
      invoices: invoiceOverview.items.filter((item) => item.studentId === studentId),
      collections: paymentOverview.items.filter((item) => item.studentId === studentId),
    };
  }

  async createGuardian(payload: {
    studentId: string;
    fullName: string;
    phone: string;
    relationship: string;
    status: string;
  }): Promise<GuardianRecord> {
    return this.httpClient.request<GuardianRecord>('/guardians', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
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
    return this.httpClient.request<GuardianRecord>(
      `/guardians/${encodeURIComponent(guardianId)}`,
      {
        method: 'PATCH',
        body: payload,
        accessToken: getAccessToken(),
      },
    );
  }

  async createGuardianStudentLink(payload: {
    studentId: string;
    guardianId: string;
    memberCustomerId: string;
    relationship: string;
    status: string;
  }): Promise<GuardianStudentLinkItem> {
    return this.httpClient.request<GuardianStudentLinkItem>('/guardian-student-links', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }

  async updateGuardianStudentLink(
    linkId: string,
    payload: {
      relationship?: string;
      status?: string;
    },
  ): Promise<GuardianStudentLinkItem> {
    return this.httpClient.request<GuardianStudentLinkItem>(
      `/guardian-student-links/${encodeURIComponent(linkId)}`,
      {
        method: 'PATCH',
        body: payload,
        accessToken: getAccessToken(),
      },
    );
  }

  async previewInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchPreviewResult> {
    return this.httpClient.request<InvoiceBatchPreviewResult>('/invoices/preview-batch', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }

  async sendInvoiceReminder(invoiceNo: string): Promise<InvoiceReminderResult> {
    return this.httpClient.request<InvoiceReminderResult>(
      `/invoices/${encodeURIComponent(invoiceNo)}/send-reminder`,
      {
        method: 'POST',
        accessToken: getAccessToken(),
      },
    );
  }

  async sendInvoiceReminders(invoiceNos: string[]): Promise<BulkInvoiceReminderResult> {
    return this.httpClient.request<BulkInvoiceReminderResult>('/invoices/send-reminders', {
      method: 'POST',
      body: { invoiceNos },
      accessToken: getAccessToken(),
    });
  }

  async generateInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchGenerationResult> {
    return this.httpClient.request<InvoiceBatchGenerationResult>(
      '/invoices/generate-batch',
      {
        method: 'POST',
        body: payload,
        accessToken: getAccessToken(),
      },
    );
  }

  async createSchool(payload: {
    name: string;
    code: string;
    branchName?: string;
    city?: string;
    region?: string;
  }): Promise<SchoolPortfolioItem> {
    return this.httpClient.request<SchoolPortfolioItem>('/institutions/schools', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }

  async importStudents(payload: {
    schoolId: string;
    students: StudentImportRowInput[];
  }): Promise<StudentImportResult> {
    return this.httpClient.request<StudentImportResult>('/students/import', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }
}

export class HttpParentPortalApi implements ParentPortalApi {
  constructor(private readonly httpClient: HttpClient) {}

  async login(payload: {
    customerId: string;
    password: string;
  }): Promise<ParentPortalSession> {
    const response = await this.httpClient.request<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        customerId?: string;
        fullName?: string;
        phone?: string;
      };
    }>('/auth/member/login', {
      method: 'POST',
      body: payload,
    });

    window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

    return {
      userId: response.user.id,
      customerId: response.user.customerId ?? payload.customerId,
      fullName: response.user.fullName ?? formatIdentifierLabel(payload.customerId),
      phone: response.user.phone,
    };
  }

  async getLinkedStudents(): Promise<ParentStudentLookupItem[]> {
    const [schools, students] = await Promise.all([
      this.httpClient.request<SchoolPortfolioItem[]>('/institutions/schools', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<
        Array<{
          schoolId: string;
          studentId: string;
          fullName: string;
          grade: string;
          section: string;
          guardianName: string;
          guardianPhone: string;
          parentAccountNumber?: string;
          status: string;
          paymentSummary?: ParentStudentLookupItem['paymentSummary'];
          performanceSummary?: ParentStudentLookupItem['performanceSummary'];
          parentUpdateSummary?: string;
        }>
      >('/students/linked/me', {
        accessToken: getAccessToken(),
      }),
    ]);

    const schoolNames = new Map(schools.map((item) => [item.id, item.name]));

    return students.map((item) => ({
      schoolId: item.schoolId,
      schoolName: schoolNames.get(item.schoolId) ?? item.schoolId,
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
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const [schools, students] = await Promise.all([
      this.httpClient.request<SchoolPortfolioItem[]>('/institutions/schools', {
        accessToken: getAccessToken(),
      }),
      this.httpClient.request<
        Array<{
          schoolId: string;
          studentId: string;
          fullName: string;
          grade: string;
          section: string;
          guardianName: string;
          guardianPhone: string;
          parentAccountNumber?: string;
          status: string;
          paymentSummary?: ParentStudentLookupItem['paymentSummary'];
          performanceSummary?: ParentStudentLookupItem['performanceSummary'];
          parentUpdateSummary?: string;
        }>
      >(`/students?search=${encodeURIComponent(normalizedQuery)}`, {
        accessToken: getAccessToken(),
      }),
    ]);

    const schoolNames = new Map(schools.map((item) => [item.id, item.name]));

    return students.map((item) => ({
      schoolId: item.schoolId,
      schoolName: schoolNames.get(item.schoolId) ?? item.schoolId,
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
    const [linkedStudents, invoices, collections] = await Promise.all([
      this.getLinkedStudents(),
      this.httpClient.request<SchoolInvoiceItem[]>(
        `/invoices?studentId=${encodeURIComponent(studentId)}`,
        {
          accessToken: getAccessToken(),
        },
      ),
      this.httpClient.request<SchoolCollectionItem[]>(
        `/school-payments?studentId=${encodeURIComponent(studentId)}`,
        {
          accessToken: getAccessToken(),
        },
      ),
    ]);

    const student =
      linkedStudents.find((item) => item.studentId === studentId) ?? linkedStudents[0];
    if (!student) {
      return null;
    }

    return {
      student,
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
    return this.httpClient.request<ParentPortalPaymentResult>('/school-payments/collect', {
      method: 'POST',
      body: payload,
      accessToken: getAccessToken(),
    });
  }
}

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function formatIdentifierLabel(identifier: string) {
  return identifier
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}
