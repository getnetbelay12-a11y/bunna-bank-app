import type {
  AuditApi,
  AuthApi,
  CardOperationsApi,
  DashboardApi,
  LoanMonitoringApi,
  NotificationApi,
  PaymentOperationsApi,
  PerformanceSummaryItem,
  ParentPortalApi,
  RecommendationApi,
  RolePerformanceItem,
  RolePerformanceOverview,
  SchoolConsoleApi,
  StudentImportRowInput,
  StudentRegistryFilter,
  SupportApi,
  ServiceRequestApi,
  VotingApi,
} from './contracts';
import {
  DemoAuditApi,
  DemoAuthApi,
  DemoCardOperationsApi,
  DemoDashboardApi,
  DemoLoanMonitoringApi,
  DemoNotificationApi,
  DemoPaymentOperationsApi,
  DemoParentPortalApi,
  DemoRecommendationApi,
  DemoSchoolConsoleApi,
  DemoSupportApi,
  DemoServiceRequestApi,
  DemoVotingApi,
} from './demoApi';
import {
  HttpAuditApi,
  HttpAuthApi,
  HttpCardOperationsApi,
  HttpDashboardApi,
  HttpLoanMonitoringApi,
  HttpNotificationApi,
  HttpPaymentOperationsApi,
  HttpParentPortalApi,
  HttpRecommendationApi,
  HttpSchoolConsoleApi,
  HttpSupportApi,
  HttpServiceRequestApi,
  HttpVotingApi,
} from './httpApi';
import { HttpClient } from './httpClient';

export interface AppClient {
  authApi: AuthApi;
  dashboardApi: DashboardApi;
  loanMonitoringApi?: LoanMonitoringApi;
  votingApi: VotingApi;
  notificationApi: NotificationApi;
  recommendationApi: RecommendationApi;
  auditApi: AuditApi;
  supportApi: SupportApi;
  serviceRequestApi?: ServiceRequestApi;
  cardOperationsApi?: CardOperationsApi;
  paymentOperationsApi?: PaymentOperationsApi;
  schoolConsoleApi?: SchoolConsoleApi;
  parentPortalApi?: ParentPortalApi;
}

export function createDemoAppClient(): AppClient {
  return {
    authApi: new DemoAuthApi(),
    dashboardApi: new DemoDashboardApi(),
    loanMonitoringApi: new DemoLoanMonitoringApi(),
    votingApi: new DemoVotingApi(),
    notificationApi: new DemoNotificationApi(),
    recommendationApi: new DemoRecommendationApi(),
    auditApi: new DemoAuditApi(),
    supportApi: new DemoSupportApi(),
    serviceRequestApi: new DemoServiceRequestApi(),
    cardOperationsApi: new DemoCardOperationsApi(),
    paymentOperationsApi: new DemoPaymentOperationsApi(),
    schoolConsoleApi: new DemoSchoolConsoleApi(),
    parentPortalApi: new DemoParentPortalApi(),
  };
}

export function createAppClient(): AppClient {
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    return createDemoAppClient();
  }

  const httpClient = new HttpClient(baseUrl);
  const demoClient = createDemoAppClient();

  return {
    authApi: new FallbackAuthApi(new HttpAuthApi(httpClient), demoClient.authApi),
    dashboardApi: new FallbackDashboardApi(
      new HttpDashboardApi(httpClient),
      demoClient.dashboardApi,
    ),
    loanMonitoringApi: new FallbackLoanMonitoringApi(
      new HttpLoanMonitoringApi(httpClient),
      demoClient.loanMonitoringApi ?? new DemoLoanMonitoringApi(),
    ),
    votingApi: new FallbackVotingApi(
      new HttpVotingApi(httpClient),
      demoClient.votingApi,
    ),
    notificationApi: new FallbackNotificationApi(
      new HttpNotificationApi(httpClient),
      demoClient.notificationApi,
    ),
    recommendationApi: new FallbackRecommendationApi(
      new HttpRecommendationApi(httpClient),
      demoClient.recommendationApi,
    ),
    auditApi: new FallbackAuditApi(
      new HttpAuditApi(httpClient),
      demoClient.auditApi,
    ),
    supportApi: new FallbackSupportApi(
      new HttpSupportApi(httpClient),
      demoClient.supportApi,
    ),
    serviceRequestApi: new FallbackServiceRequestApi(
      new HttpServiceRequestApi(httpClient),
      demoClient.serviceRequestApi!,
    ),
    cardOperationsApi: new FallbackCardOperationsApi(
      new HttpCardOperationsApi(httpClient),
      demoClient.cardOperationsApi!,
    ),
    paymentOperationsApi: new FallbackPaymentOperationsApi(
      new HttpPaymentOperationsApi(httpClient),
      demoClient.paymentOperationsApi!,
    ),
    schoolConsoleApi: new FallbackSchoolConsoleApi(
      new HttpSchoolConsoleApi(httpClient),
      demoClient.schoolConsoleApi!,
    ),
    parentPortalApi: new FallbackParentPortalApi(
      new HttpParentPortalApi(httpClient),
      demoClient.parentPortalApi!,
    ),
  };
}

function resolveApiBaseUrl() {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const isLocalHost = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  if (!isLocalHost) {
    return '';
  }

  return '/api';
}

function isLocalPreviewRuntime() {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return ['127.0.0.1', 'localhost'].includes(window.location.hostname) || params.get('preview') === 'admin';
}

function isPerformanceSummaryEmpty(items: PerformanceSummaryItem[]) {
  return (
    items.length === 0 ||
    items.every(
      (item) =>
        item.customersServed === 0 &&
        item.transactionsCount === 0 &&
        item.loanApprovedCount === 0 &&
        item.loanRejectedCount === 0 &&
        item.schoolPaymentsCount === 0 &&
        item.totalTransactionAmount === 0,
    )
  );
}

function isRolePerformanceOverviewEmpty(overview: RolePerformanceOverview | null | undefined) {
  if (!overview) {
    return true;
  }

  const kpis = overview.kpis;
  return (
    overview.items.length === 0 ||
    (kpis.membersServed === 0 &&
      kpis.loansHandled === 0 &&
      kpis.kycCompleted === 0 &&
      kpis.pendingApprovals === 0 &&
      kpis.transactionsProcessed === 0 &&
      kpis.responseTimeMinutes === 0)
  );
}

function isRolePerformanceItemsEmpty(items: RolePerformanceItem[]) {
  return (
    items.length === 0 ||
    items.every(
      (item) =>
        item.membersServed === 0 &&
        item.loansHandled === 0 &&
        item.kycCompleted === 0 &&
        item.transactionsProcessed === 0 &&
        item.score === 0,
    )
  );
}

function logDashboardFallback(message: string, details: Record<string, unknown>) {
  if (!isLocalPreviewRuntime() || typeof console === 'undefined') {
    return;
  }

  console.info('[district-demo-fallback]', message, details);
}

export class FallbackAuthApi implements AuthApi {
  constructor(
    private readonly primary: AuthApi,
    private readonly fallback: AuthApi,
  ) {}

  async login(payload: Parameters<AuthApi['login']>[0]) {
    if (payload.identifier.trim().toLowerCase().includes('school')) {
      return this.fallback.login(payload);
    }

    try {
      return await this.primary.login(payload);
    } catch {
      return this.fallback.login(payload);
    }
  }

  async checkExistingAccount(
    payload: NonNullable<AuthApi['checkExistingAccount']> extends (
      input: infer T,
    ) => Promise<unknown>
      ? T
      : never,
  ) {
    if (!this.primary.checkExistingAccount) {
      return this.fallback.checkExistingAccount?.(payload) ?? {
        exists: false,
        message: 'No existing account was found. You can continue onboarding.',
      };
    }

    try {
      return await this.primary.checkExistingAccount(payload);
    } catch {
      return (
        (await this.fallback.checkExistingAccount?.(payload)) ?? {
          exists: false,
          message: 'No existing account was found. You can continue onboarding.',
        }
      );
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
      const result = await this.primary.getBranchPerformance(role);
      const empty = isPerformanceSummaryEmpty(result);
      logDashboardFallback('branch performance received', {
        previewMode: isLocalPreviewRuntime(),
        apiDataEmpty: empty,
        rowCount: result.length,
      });
      if (empty && isLocalPreviewRuntime()) {
        const fallbackResult = await this.fallback.getBranchPerformance(role);
        logDashboardFallback('using demo branch performance fallback', {
          rowCount: fallbackResult.length,
        });
        return fallbackResult;
      }
      return result;
    } catch {
      return this.fallback.getBranchPerformance(role);
    }
  }

  async getDistrictPerformance(
    role: Parameters<DashboardApi['getDistrictPerformance']>[0],
  ) {
    try {
      const result = await this.primary.getDistrictPerformance(role);
      const empty = isPerformanceSummaryEmpty(result);
      logDashboardFallback('district performance received', {
        previewMode: isLocalPreviewRuntime(),
        apiDataEmpty: empty,
        rowCount: result.length,
      });
      if (empty && isLocalPreviewRuntime()) {
        const fallbackResult = await this.fallback.getDistrictPerformance(role);
        logDashboardFallback('using demo district performance fallback', {
          rowCount: fallbackResult.length,
        });
        return fallbackResult;
      }
      return result;
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

  async getOnboardingReviewQueue(
    role: Parameters<DashboardApi['getOnboardingReviewQueue']>[0],
  ) {
    try {
      return await this.primary.getOnboardingReviewQueue(role);
    } catch {
      return this.fallback.getOnboardingReviewQueue(role);
    }
  }

  async getAutopayOperations(
    role: Parameters<DashboardApi['getAutopayOperations']>[0],
  ) {
    try {
      return await this.primary.getAutopayOperations(role);
    } catch {
      return this.fallback.getAutopayOperations(role);
    }
  }

  async updateAutopayOperation(
    id: Parameters<DashboardApi['updateAutopayOperation']>[0],
    payload: Parameters<DashboardApi['updateAutopayOperation']>[1],
  ) {
    try {
      return await this.primary.updateAutopayOperation(id, payload);
    } catch {
      return this.fallback.updateAutopayOperation(id, payload);
    }
  }

  async updateOnboardingReview(
    memberId: Parameters<DashboardApi['updateOnboardingReview']>[0],
    payload: Parameters<DashboardApi['updateOnboardingReview']>[1],
  ) {
    try {
      return await this.primary.updateOnboardingReview(memberId, payload);
    } catch {
      return this.fallback.updateOnboardingReview(memberId, payload);
    }
  }

  async getHeadOfficeDistrictSummary(
    role: Parameters<DashboardApi['getHeadOfficeDistrictSummary']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeDistrictSummary']>[1],
  ) {
    try {
      const result = await this.primary.getHeadOfficeDistrictSummary(role, period);
      const empty = isRolePerformanceOverviewEmpty(result);
      logDashboardFallback('head office district summary received', {
        previewMode: isLocalPreviewRuntime(),
        apiDataEmpty: empty,
        rowCount: result.items.length,
        kpis: result.kpis,
      });
      if (empty && isLocalPreviewRuntime()) {
        const fallbackResult = await this.fallback.getHeadOfficeDistrictSummary(role, period);
        logDashboardFallback('using demo head office district summary fallback', {
          rowCount: fallbackResult.items.length,
          kpis: fallbackResult.kpis,
        });
        return fallbackResult;
      }
      return result;
    } catch {
      return this.fallback.getHeadOfficeDistrictSummary(role, period);
    }
  }

  async getHeadOfficeTopDistricts(
    role: Parameters<DashboardApi['getHeadOfficeTopDistricts']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeTopDistricts']>[1],
  ) {
    try {
      const result = await this.primary.getHeadOfficeTopDistricts(role, period);
      const empty = isRolePerformanceItemsEmpty(result);
      logDashboardFallback('head office top districts received', {
        previewMode: isLocalPreviewRuntime(),
        apiDataEmpty: empty,
        rowCount: result.length,
      });
      if (empty && isLocalPreviewRuntime()) {
        const fallbackResult = await this.fallback.getHeadOfficeTopDistricts(role, period);
        logDashboardFallback('using demo head office top districts fallback', {
          rowCount: fallbackResult.length,
        });
        return fallbackResult;
      }
      return result;
    } catch {
      return this.fallback.getHeadOfficeTopDistricts(role, period);
    }
  }

  async getHeadOfficeDistrictWatchlist(
    role: Parameters<DashboardApi['getHeadOfficeDistrictWatchlist']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeDistrictWatchlist']>[1],
  ) {
    try {
      const result = await this.primary.getHeadOfficeDistrictWatchlist(role, period);
      const empty = isRolePerformanceItemsEmpty(result);
      logDashboardFallback('head office district watchlist received', {
        previewMode: isLocalPreviewRuntime(),
        apiDataEmpty: empty,
        rowCount: result.length,
      });
      if (empty && isLocalPreviewRuntime()) {
        const fallbackResult = await this.fallback.getHeadOfficeDistrictWatchlist(role, period);
        logDashboardFallback('using demo head office district watchlist fallback', {
          rowCount: fallbackResult.length,
        });
        return fallbackResult;
      }
      return result;
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

  async getHeadOfficeCommandCenter(
    role: Parameters<DashboardApi['getHeadOfficeCommandCenter']>[0],
    period?: Parameters<DashboardApi['getHeadOfficeCommandCenter']>[1],
  ) {
    try {
      return await this.primary.getHeadOfficeCommandCenter(role, period);
    } catch {
      return this.fallback.getHeadOfficeCommandCenter(role, period);
    }
  }

  async getDistrictCommandCenter(
    role: Parameters<DashboardApi['getDistrictCommandCenter']>[0],
    period?: Parameters<DashboardApi['getDistrictCommandCenter']>[1],
  ) {
    try {
      return await this.primary.getDistrictCommandCenter(role, period);
    } catch {
      return this.fallback.getDistrictCommandCenter(role, period);
    }
  }

  async getBranchCommandCenter(
    role: Parameters<DashboardApi['getBranchCommandCenter']>[0],
    period?: Parameters<DashboardApi['getBranchCommandCenter']>[1],
  ) {
    try {
      return await this.primary.getBranchCommandCenter(role, period);
    } catch {
      return this.fallback.getBranchCommandCenter(role, period);
    }
  }
}

export class FallbackLoanMonitoringApi implements LoanMonitoringApi {
  constructor(
    private readonly primary: LoanMonitoringApi,
    private readonly fallback: LoanMonitoringApi,
  ) {}

  async getPendingLoans() {
    try {
      return await this.primary.getPendingLoans();
    } catch {
      return this.fallback.getPendingLoans();
    }
  }

  async getLoanDetail(loanId: string) {
    try {
      return await this.primary.getLoanDetail(loanId);
    } catch {
      return this.fallback.getLoanDetail(loanId);
    }
  }

  async getCustomerProfile(loanId: string) {
    try {
      return await this.primary.getCustomerProfile(loanId);
    } catch {
      return this.fallback.getCustomerProfile(loanId);
    }
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
    try {
      return await this.primary.processAction(loanId, payload);
    } catch {
      return this.fallback.processAction(loanId, payload);
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

  async createVote(payload: Parameters<VotingApi['createVote']>[0]) {
    try {
      return await this.primary.createVote(payload);
    } catch {
      return this.fallback.createVote(payload);
    }
  }

  async openVote(voteId: string) {
    try {
      return await this.primary.openVote!(voteId);
    } catch {
      return this.fallback.openVote!(voteId);
    }
  }

  async closeVote(voteId: string) {
    try {
      return await this.primary.closeVote!(voteId);
    } catch {
      return this.fallback.closeVote!(voteId);
    }
  }

  async getResults(voteId: string) {
    try {
      return await this.primary.getResults!(voteId);
    } catch {
      return this.fallback.getResults!(voteId);
    }
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

  async getEntityAuditTrail(
    entityType: Parameters<AuditApi['getEntityAuditTrail']>[0],
    entityId: Parameters<AuditApi['getEntityAuditTrail']>[1],
  ) {
    try {
      return await this.primary.getEntityAuditTrail(entityType, entityId);
    } catch {
      return this.fallback.getEntityAuditTrail(entityType, entityId);
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

export class FallbackRecommendationApi implements RecommendationApi {
  constructor(
    private readonly primary: RecommendationApi,
    private readonly fallback: RecommendationApi,
  ) {}

  async getDashboardSummary() {
    try {
      return await this.primary.getDashboardSummary();
    } catch {
      return this.fallback.getDashboardSummary();
    }
  }

  async getCustomerRecommendations(memberId: string) {
    try {
      return await this.primary.getCustomerRecommendations(memberId);
    } catch {
      return this.fallback.getCustomerRecommendations(memberId);
    }
  }

  async generateForCustomer(memberId: string) {
    try {
      await this.primary.generateForCustomer(memberId);
    } catch {
      await this.fallback.generateForCustomer(memberId);
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

export class FallbackServiceRequestApi implements ServiceRequestApi {
  constructor(
    private readonly primary: ServiceRequestApi,
    private readonly fallback: ServiceRequestApi,
  ) {}

  async getRequests() {
    try {
      return await this.primary.getRequests();
    } catch {
      return this.fallback.getRequests();
    }
  }

  async getRequest(requestId: string) {
    try {
      return await this.primary.getRequest(requestId);
    } catch {
      return this.fallback.getRequest(requestId);
    }
  }

  async downloadAttachment(storageKey: string) {
    try {
      return await this.primary.downloadAttachment(storageKey);
    } catch {
      return this.fallback.downloadAttachment(storageKey);
    }
  }

  async getAttachmentMetadata(storageKey: string) {
    try {
      return await this.primary.getAttachmentMetadata(storageKey);
    } catch {
      return this.fallback.getAttachmentMetadata(storageKey);
    }
  }

  async updateStatus(requestId: string, payload: { status: any; note?: string }) {
    try {
      return await this.primary.updateStatus(requestId, payload);
    } catch {
      return this.fallback.updateStatus(requestId, payload);
    }
  }
}

export class FallbackCardOperationsApi implements CardOperationsApi {
  constructor(
    private readonly primary: CardOperationsApi,
    private readonly fallback: CardOperationsApi,
  ) {}

  async getRequests() {
    try {
      return await this.primary.getRequests();
    } catch {
      return this.fallback.getRequests();
    }
  }

  async getRequest(requestId: string) {
    try {
      return await this.primary.getRequest(requestId);
    } catch {
      return this.fallback.getRequest(requestId);
    }
  }

  async updateStatus(
    requestId: string,
    payload: Parameters<CardOperationsApi['updateStatus']>[1],
  ) {
    try {
      return await this.primary.updateStatus(requestId, payload);
    } catch {
      return this.fallback.updateStatus(requestId, payload);
    }
  }
}

export class FallbackPaymentOperationsApi implements PaymentOperationsApi {
  constructor(
    private readonly primary: PaymentOperationsApi,
    private readonly fallback: PaymentOperationsApi,
  ) {}

  async getActivity() {
    try {
      return await this.primary.getActivity();
    } catch {
      return this.fallback.getActivity();
    }
  }

  async getMemberReceipts(memberId: string) {
    try {
      return await this.primary.getMemberReceipts(memberId);
    } catch {
      return this.fallback.getMemberReceipts(memberId);
    }
  }

  async downloadAttachment(storageKey: string) {
    try {
      return await this.primary.downloadAttachment(storageKey);
    } catch {
      return this.fallback.downloadAttachment(storageKey);
    }
  }

  async getAttachmentMetadata(storageKey: string) {
    try {
      return await this.primary.getAttachmentMetadata(storageKey);
    } catch {
      return this.fallback.getAttachmentMetadata(storageKey);
    }
  }
}

export class FallbackSchoolConsoleApi implements SchoolConsoleApi {
  constructor(
    private readonly primary: SchoolConsoleApi,
    private readonly fallback: SchoolConsoleApi,
  ) {}

  async getOverview() {
    try {
      return await this.primary.getOverview();
    } catch {
      return this.fallback.getOverview();
    }
  }

  async getFeePlans(schoolId?: string) {
    try {
      return await this.primary.getFeePlans(schoolId);
    } catch {
      return this.fallback.getFeePlans(schoolId);
    }
  }

  async createFeePlan(payload: {
    schoolId: string;
    schoolName: string;
    academicYear: string;
    term: string;
    grade: string;
    name: string;
    status: string;
    items: Array<{ label: string; amount: number }>;
  }) {
    return this.primary.createFeePlan(payload);
  }

  async getRegistry(filters?: StudentRegistryFilter) {
    try {
      return await this.primary.getRegistry(filters);
    } catch {
      return this.fallback.getRegistry(filters);
    }
  }

  async getStudentDetail(studentId: string) {
    try {
      return await this.primary.getStudentDetail(studentId);
    } catch {
      return this.fallback.getStudentDetail(studentId);
    }
  }

  async createGuardian(payload: {
    studentId: string;
    fullName: string;
    phone: string;
    relationship: string;
    status: string;
  }) {
    return this.primary.createGuardian(payload);
  }

  async updateGuardian(
    guardianId: string,
    payload: {
      fullName?: string;
      phone?: string;
      relationship?: string;
      status?: string;
    },
  ) {
    return this.primary.updateGuardian(guardianId, payload);
  }

  async createGuardianStudentLink(payload: {
    studentId: string;
    guardianId: string;
    memberCustomerId: string;
    relationship: string;
    status: string;
  }) {
    return this.primary.createGuardianStudentLink(payload);
  }

  async updateGuardianStudentLink(
    linkId: string,
    payload: {
      relationship?: string;
      status?: string;
    },
  ) {
    return this.primary.updateGuardianStudentLink(linkId, payload);
  }

  async previewInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }) {
    try {
      return await this.primary.previewInvoiceBatch(payload);
    } catch {
      return this.fallback.previewInvoiceBatch(payload);
    }
  }

  async sendInvoiceReminder(invoiceNo: string) {
    return this.primary.sendInvoiceReminder(invoiceNo);
  }

  async sendInvoiceReminders(invoiceNos: string[]) {
    return this.primary.sendInvoiceReminders(invoiceNos);
  }

  async generateInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }) {
    return this.primary.generateInvoiceBatch(payload);
  }

  async createSchool(payload: {
    name: string;
    code: string;
    branchName?: string;
    city?: string;
    region?: string;
  }) {
    return this.primary.createSchool(payload);
  }

  async importStudents(payload: { schoolId: string; students: StudentImportRowInput[] }) {
    return this.primary.importStudents(payload);
  }
}

export class FallbackParentPortalApi implements ParentPortalApi {
  constructor(
    private readonly primary: ParentPortalApi,
    private readonly fallback: ParentPortalApi,
  ) {}

  async login(payload: { customerId: string; password: string }) {
    try {
      return await this.primary.login(payload);
    } catch {
      return this.fallback.login(payload);
    }
  }

  async getLinkedStudents() {
    try {
      return await this.primary.getLinkedStudents();
    } catch {
      return this.fallback.getLinkedStudents();
    }
  }

  async searchStudents(query: string) {
    try {
      return await this.primary.searchStudents(query);
    } catch {
      return this.fallback.searchStudents(query);
    }
  }

  async getStudentAccount(studentId: string) {
    try {
      return await this.primary.getStudentAccount(studentId);
    } catch {
      return this.fallback.getStudentAccount(studentId);
    }
  }

  async submitPayment(payload: {
    invoiceNo: string;
    amount: number;
    channel?: string;
    payerName?: string;
    payerPhone?: string;
  }) {
    try {
      return await this.primary.submitPayment(payload);
    } catch {
      return this.fallback.submitPayment(payload);
    }
  }
}
