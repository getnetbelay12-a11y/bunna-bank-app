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
  type StaffLoginPayload,
  type StaffRankingItem,
  type VoteAdminItem,
  type VotingApi,
  type VotingSummaryItem,
} from './contracts';
import {
  AdminRole,
  isHeadOfficeConsoleRole,
  type AdminSession,
} from '../session';
import { HttpClient } from './httpClient';

const ACCESS_TOKEN_KEY = 'bunna_access_token';
const REFRESH_TOKEN_KEY = 'bunna_refresh_token';

type StaffLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: AdminRole;
    fullName?: string;
    staffNumber?: string;
    branchId?: string;
    districtId?: string;
    branchName?: string;
    districtName?: string;
  };
};

export class HttpAuthApi implements AuthApi {
  constructor(private readonly httpClient: HttpClient) {}

  async login(payload: StaffLoginPayload): Promise<AdminSession> {
    const response = await this.httpClient.request<StaffLoginResponse>(
      '/auth/staff/login',
      {
        method: 'POST',
        body: payload,
      },
    );

    if (!isHeadOfficeConsoleRole(response.user.role)) {
      throw new Error(
        'This Bunna manager console is restricted to Head Office staff only.',
      );
    }

    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

    return {
      userId: response.user.id,
      fullName:
        response.user.fullName ?? formatIdentifierLabel(payload.identifier),
      role: response.user.role,
      branchName:
        response.user.branchName ??
        response.user.districtName ??
        buildScopeLabel(response.user.branchId, response.user.districtId),
    };
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

export class HttpNotificationApi implements NotificationApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getNotifications(_role: AdminRole): Promise<NotificationCenterItem[]> {
    const result = await this.httpClient.request<
      Array<{
        id: string;
        type: string;
        status: string;
        title: string;
        createdAt?: string;
      }>
    >('/notifications', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      notificationId: item.id,
      type: item.type,
      userLabel: item.title,
      status: item.status,
      sentAt: item.createdAt ?? 'n/a',
    }));
  }

  async getTemplates(): Promise<NotificationTemplateItem[]> {
    const result = await this.httpClient.request<
      Array<{
        _id: string;
        category: 'loan' | 'insurance';
        templateType: string;
        title: string;
        subject?: string;
        messageBody: string;
        channelDefaults: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
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
        category: 'loan' | 'insurance';
        templateType: string;
        channels: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
        targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
        targetIds: string[];
        messageSubject?: string;
        messageBody: string;
        status: NotificationCampaignItem['status'];
        scheduledAt?: string;
        sentAt?: string;
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
    }));
  }

  async createCampaign(
    payload: CreateManagerNotificationCampaignPayload,
  ): Promise<NotificationCampaignItem> {
    const result = await this.httpClient.request<{
      _id: string;
      category: 'loan' | 'insurance';
      templateType: string;
      channels: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
      targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
      targetIds: string[];
      messageSubject?: string;
      messageBody: string;
      status: NotificationCampaignItem['status'];
      scheduledAt?: string;
      sentAt?: string;
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
    };
  }

  async sendCampaign(campaignId: string): Promise<NotificationCampaignItem> {
    const result = await this.httpClient.request<{
      _id: string;
      category: 'loan' | 'insurance';
      templateType: string;
      channels: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
      targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
      targetIds: string[];
      messageSubject?: string;
      messageBody: string;
      status: NotificationCampaignItem['status'];
      scheduledAt?: string;
      sentAt?: string;
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
        category: 'loan' | 'insurance';
        channel: 'email' | 'sms' | 'telegram' | 'in_app';
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

export class HttpVotingApi implements VotingApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getVotes(_role: AdminRole): Promise<VoteAdminItem[]> {
    return this.httpClient.request<VoteAdminItem[]>('/admin/votes', {
      accessToken: getAccessToken(),
    });
  }

  async createVote(): Promise<void> {
    throw new Error('Create vote UI flow is not implemented yet.');
  }

  async getParticipation(voteId: string): Promise<VotingSummaryItem | null> {
    const result = await this.httpClient.request<{
      totalResponses: number;
      uniqueBranches: number;
    }>(`/admin/votes/${voteId}/participation`, {
      accessToken: getAccessToken(),
    });

    return {
      voteId,
      title: `Vote ${voteId}`,
      totalResponses: result.totalResponses,
      eligibleShareholders: 0,
      participationRate: 0,
    };
  }
}

export class HttpAuditApi implements AuditApi {
  constructor(private readonly httpClient: HttpClient) {}

  async getByEntity(_role: AdminRole): Promise<AuditLogItem[]> {
    const result = await this.httpClient.request<
      Array<{
        id: string;
        actorId: string;
        actionType: string;
        entityType: string;
        entityId: string;
        createdAt?: string;
      }>
    >('/audit', {
      accessToken: getAccessToken(),
    });

    return result.map((item) => ({
      auditId: item.id,
      actor: item.actorId,
      action: item.actionType,
      entity: `${item.entityType}:${item.entityId}`,
      timestamp: item.createdAt ?? 'n/a',
    }));
  }

  async getByActor(_role: AdminRole): Promise<AuditLogItem[]> {
    return this.getByEntity(_role);
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

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function formatIdentifierLabel(identifier: string) {
  return identifier
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}

function buildScopeLabel(branchId?: string, districtId?: string) {
  if (branchId) {
    return `Branch ${branchId}`;
  }

  if (districtId) {
    return `District ${districtId}`;
  }

  return 'Head Office';
}
