import type {
  AuditApi,
  AuthApi,
  DashboardApi,
  NotificationApi,
  SupportApi,
  VotingApi,
} from './contracts';
import {
  DemoAuditApi,
  DemoAuthApi,
  DemoDashboardApi,
  DemoNotificationApi,
  DemoSupportApi,
  DemoVotingApi,
} from './demoApi';
import {
  HttpAuditApi,
  HttpAuthApi,
  HttpDashboardApi,
  HttpNotificationApi,
  HttpSupportApi,
  HttpVotingApi,
} from './httpApi';
import { HttpClient } from './httpClient';

export interface AppClient {
  authApi: AuthApi;
  dashboardApi: DashboardApi;
  votingApi: VotingApi;
  notificationApi: NotificationApi;
  auditApi: AuditApi;
  supportApi: SupportApi;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const demoModeEnabled =
  import.meta.env.VITE_ENABLE_DEMO_MODE === 'true' ||
  (!import.meta.env.PROD && apiBaseUrl.length === 0);
const apiFallbackEnabled =
  import.meta.env.VITE_ENABLE_API_FALLBACK === 'true' && demoModeEnabled;

export function createDemoAppClient(): AppClient {
  return {
    authApi: new DemoAuthApi(),
    dashboardApi: new DemoDashboardApi(),
    votingApi: new DemoVotingApi(),
    notificationApi: new DemoNotificationApi(),
    auditApi: new DemoAuditApi(),
    supportApi: new DemoSupportApi(),
  };
}

export function createAppClient(): AppClient {
  if (!apiBaseUrl) {
    if (!demoModeEnabled) {
      return createUnavailableAppClient(
        'VITE_API_BASE_URL is required when demo mode is disabled.',
      );
    }

    return createDemoAppClient();
  }

  const httpClient = new HttpClient(apiBaseUrl);
  const demoClient = createDemoAppClient();

  if (!apiFallbackEnabled) {
    return {
      authApi: new HttpAuthApi(httpClient),
      dashboardApi: new HttpDashboardApi(httpClient),
      votingApi: new HttpVotingApi(httpClient),
      notificationApi: new HttpNotificationApi(httpClient),
      auditApi: new HttpAuditApi(httpClient),
      supportApi: new HttpSupportApi(httpClient),
    };
  }

  return {
    authApi: new FallbackAuthApi(new HttpAuthApi(httpClient), demoClient.authApi),
    dashboardApi: new FallbackDashboardApi(
      new HttpDashboardApi(httpClient),
      demoClient.dashboardApi,
    ),
    votingApi: new FallbackVotingApi(
      new HttpVotingApi(httpClient),
      demoClient.votingApi,
    ),
    notificationApi: new FallbackNotificationApi(
      new HttpNotificationApi(httpClient),
      demoClient.notificationApi,
    ),
    auditApi: new FallbackAuditApi(
      new HttpAuditApi(httpClient),
      demoClient.auditApi,
    ),
    supportApi: new FallbackSupportApi(
      new HttpSupportApi(httpClient),
      demoClient.supportApi,
    ),
  };
}

function createUnavailableAppClient(message: string): AppClient {
  const rejectWithMessage = async () => {
    throw new Error(message);
  };

  return {
    authApi: {
      login: rejectWithMessage,
    },
    dashboardApi: {
      getSummary: rejectWithMessage,
      getBranchPerformance: rejectWithMessage,
      getDistrictPerformance: rejectWithMessage,
      getStaffRanking: rejectWithMessage,
      getVotingSummary: rejectWithMessage,
      getHeadOfficeDistrictSummary: rejectWithMessage,
      getHeadOfficeTopDistricts: rejectWithMessage,
      getHeadOfficeDistrictWatchlist: rejectWithMessage,
      getDistrictBranchSummary: rejectWithMessage,
      getDistrictTopBranches: rejectWithMessage,
      getDistrictBranchWatchlist: rejectWithMessage,
      getBranchEmployeeSummary: rejectWithMessage,
      getBranchTopEmployees: rejectWithMessage,
      getBranchEmployeeWatchlist: rejectWithMessage,
    },
    votingApi: {
      getVotes: rejectWithMessage,
      createVote: rejectWithMessage,
      getParticipation: rejectWithMessage,
    },
    notificationApi: {
      getNotifications: rejectWithMessage,
      getTemplates: rejectWithMessage,
      getCampaigns: rejectWithMessage,
      createCampaign: rejectWithMessage,
      sendCampaign: rejectWithMessage,
      getLogs: rejectWithMessage,
      getInsuranceAlerts: rejectWithMessage,
    },
    auditApi: {
      getByEntity: rejectWithMessage,
      getByActor: rejectWithMessage,
    },
    supportApi: {
      getOpenChats: rejectWithMessage,
      getAssignedChats: rejectWithMessage,
      getResolvedChats: rejectWithMessage,
      getChat: rejectWithMessage,
      assignChat: rejectWithMessage,
      reply: rejectWithMessage,
      resolve: rejectWithMessage,
      close: rejectWithMessage,
      updateStatus: rejectWithMessage,
    },
  };
}

export class FallbackAuthApi implements AuthApi {
  constructor(
    private readonly primary: AuthApi,
    private readonly fallback: AuthApi,
  ) {}

  async login(payload: Parameters<AuthApi['login']>[0]) {
    try {
      return await this.primary.login(payload);
    } catch {
      return this.fallback.login(payload);
    }
  }
}

export class FallbackDashboardApi implements DashboardApi {
  constructor(
    private readonly primary: DashboardApi,
    private readonly fallback: DashboardApi,
  ) {}

  async getSummary(role: Parameters<DashboardApi['getSummary']>[0]) {
    try {
      return await this.primary.getSummary(role);
    } catch {
      return this.fallback.getSummary(role);
    }
  }

  async getBranchPerformance(
    role: Parameters<DashboardApi['getBranchPerformance']>[0],
  ) {
    try {
      return await this.primary.getBranchPerformance(role);
    } catch {
      return this.fallback.getBranchPerformance(role);
    }
  }

  async getDistrictPerformance(
    role: Parameters<DashboardApi['getDistrictPerformance']>[0],
  ) {
    try {
      return await this.primary.getDistrictPerformance(role);
    } catch {
      return this.fallback.getDistrictPerformance(role);
    }
  }

  async getStaffRanking(role: Parameters<DashboardApi['getStaffRanking']>[0]) {
    try {
      return await this.primary.getStaffRanking(role);
    } catch {
      return this.fallback.getStaffRanking(role);
    }
  }

  async getVotingSummary() {
    try {
      return await this.primary.getVotingSummary();
    } catch {
      return this.fallback.getVotingSummary();
    }
  }

  async getHeadOfficeDistrictSummary(
    role: Parameters<DashboardApi['getHeadOfficeDistrictSummary']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeDistrictSummary']>[1],
  ) {
    try {
      return await this.primary.getHeadOfficeDistrictSummary(role, period);
    } catch {
      return this.fallback.getHeadOfficeDistrictSummary(role, period);
    }
  }

  async getHeadOfficeTopDistricts(
    role: Parameters<DashboardApi['getHeadOfficeTopDistricts']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeTopDistricts']>[1],
  ) {
    try {
      return await this.primary.getHeadOfficeTopDistricts(role, period);
    } catch {
      return this.fallback.getHeadOfficeTopDistricts(role, period);
    }
  }

  async getHeadOfficeDistrictWatchlist(
    role: Parameters<DashboardApi['getHeadOfficeDistrictWatchlist']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeDistrictWatchlist']>[1],
  ) {
    try {
      return await this.primary.getHeadOfficeDistrictWatchlist(role, period);
    } catch {
      return this.fallback.getHeadOfficeDistrictWatchlist(role, period);
    }
  }

  async getDistrictBranchSummary(
    role: Parameters<DashboardApi['getDistrictBranchSummary']>[0],
    period?: Parameters<DashboardApi['getDistrictBranchSummary']>[1],
  ) {
    try {
      return await this.primary.getDistrictBranchSummary(role, period);
    } catch {
      return this.fallback.getDistrictBranchSummary(role, period);
    }
  }

  async getDistrictTopBranches(
    role: Parameters<DashboardApi['getDistrictTopBranches']>[0],
    period?: Parameters<DashboardApi['getDistrictTopBranches']>[1],
  ) {
    try {
      return await this.primary.getDistrictTopBranches(role, period);
    } catch {
      return this.fallback.getDistrictTopBranches(role, period);
    }
  }

  async getDistrictBranchWatchlist(
    role: Parameters<DashboardApi['getDistrictBranchWatchlist']>[0],
    period?: Parameters<DashboardApi['getDistrictBranchWatchlist']>[1],
  ) {
    try {
      return await this.primary.getDistrictBranchWatchlist(role, period);
    } catch {
      return this.fallback.getDistrictBranchWatchlist(role, period);
    }
  }

  async getBranchEmployeeSummary(
    role: Parameters<DashboardApi['getBranchEmployeeSummary']>[0],
    period?: Parameters<DashboardApi['getBranchEmployeeSummary']>[1],
  ) {
    try {
      return await this.primary.getBranchEmployeeSummary(role, period);
    } catch {
      return this.fallback.getBranchEmployeeSummary(role, period);
    }
  }

  async getBranchTopEmployees(
    role: Parameters<DashboardApi['getBranchTopEmployees']>[0],
    period?: Parameters<DashboardApi['getBranchTopEmployees']>[1],
  ) {
    try {
      return await this.primary.getBranchTopEmployees(role, period);
    } catch {
      return this.fallback.getBranchTopEmployees(role, period);
    }
  }

  async getBranchEmployeeWatchlist(
    role: Parameters<DashboardApi['getBranchEmployeeWatchlist']>[0],
    period?: Parameters<DashboardApi['getBranchEmployeeWatchlist']>[1],
  ) {
    try {
      return await this.primary.getBranchEmployeeWatchlist(role, period);
    } catch {
      return this.fallback.getBranchEmployeeWatchlist(role, period);
    }
  }
}

export class FallbackNotificationApi implements NotificationApi {
  constructor(
    private readonly primary: NotificationApi,
    private readonly fallback: NotificationApi,
  ) {}

  async getNotifications(role: Parameters<NotificationApi['getNotifications']>[0]) {
    try {
      return await this.primary.getNotifications(role);
    } catch {
      return this.fallback.getNotifications(role);
    }
  }

  async getTemplates() {
    try {
      return await this.primary.getTemplates();
    } catch {
      return this.fallback.getTemplates();
    }
  }

  async getCampaigns() {
    return this.primary.getCampaigns();
  }

  async createCampaign(payload: Parameters<NotificationApi['createCampaign']>[0]) {
    return this.primary.createCampaign(payload);
  }

  async sendCampaign(campaignId: string) {
    return this.primary.sendCampaign(campaignId);
  }

  async getLogs(campaignId?: string) {
    return this.primary.getLogs(campaignId);
  }

  async getInsuranceAlerts() {
    try {
      return await this.primary.getInsuranceAlerts();
    } catch {
      return this.fallback.getInsuranceAlerts();
    }
  }
}

export class FallbackVotingApi implements VotingApi {
  constructor(
    private readonly primary: VotingApi,
    private readonly fallback: VotingApi,
  ) {}

  async getVotes(role: Parameters<VotingApi['getVotes']>[0]) {
    try {
      return await this.primary.getVotes(role);
    } catch {
      return this.fallback.getVotes(role);
    }
  }

  async createVote() {
    return this.fallback.createVote();
  }

  async getParticipation(voteId: Parameters<VotingApi['getParticipation']>[0]) {
    try {
      return await this.primary.getParticipation(voteId);
    } catch {
      return this.fallback.getParticipation(voteId);
    }
  }
}

export class FallbackAuditApi implements AuditApi {
  constructor(
    private readonly primary: AuditApi,
    private readonly fallback: AuditApi,
  ) {}

  async getByEntity(role: Parameters<AuditApi['getByEntity']>[0]) {
    try {
      return await this.primary.getByEntity(role);
    } catch {
      return this.fallback.getByEntity(role);
    }
  }

  async getByActor(role: Parameters<AuditApi['getByActor']>[0]) {
    try {
      return await this.primary.getByActor(role);
    } catch {
      return this.fallback.getByActor(role);
    }
  }
}

export class FallbackSupportApi implements SupportApi {
  constructor(
    private readonly primary: SupportApi,
    private readonly fallback: SupportApi,
  ) {}

  async getOpenChats() {
    try {
      return await this.primary.getOpenChats();
    } catch {
      return this.fallback.getOpenChats();
    }
  }

  async getAssignedChats() {
    try {
      return await this.primary.getAssignedChats();
    } catch {
      return this.fallback.getAssignedChats();
    }
  }

  async getResolvedChats() {
    try {
      return await this.primary.getResolvedChats();
    } catch {
      return this.fallback.getResolvedChats();
    }
  }

  async getChat(chatId: string) {
    try {
      return await this.primary.getChat(chatId);
    } catch {
      return this.fallback.getChat(chatId);
    }
  }

  async assignChat(chatId: string) {
    try {
      return await this.primary.assignChat(chatId);
    } catch {
      return this.fallback.assignChat(chatId);
    }
  }

  async reply(chatId: string, message: string) {
    try {
      return await this.primary.reply(chatId, message);
    } catch {
      return this.fallback.reply(chatId, message);
    }
  }

  async resolve(chatId: string) {
    try {
      return await this.primary.resolve(chatId);
    } catch {
      return this.fallback.resolve(chatId);
    }
  }

  async close(chatId: string) {
    try {
      return await this.primary.close(chatId);
    } catch {
      return this.fallback.close(chatId);
    }
  }

  async updateStatus(chatId: string, status: string) {
    try {
      return await this.primary.updateStatus(chatId, status);
    } catch {
      return this.fallback.updateStatus(chatId, status);
    }
  }
}
