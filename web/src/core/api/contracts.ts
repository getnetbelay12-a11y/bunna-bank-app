import type { AdminRole, AdminSession } from '../session';

export interface ManagerDashboardSummary {
  customersServed: number;
  transactionsCount: number;
  schoolPaymentsCount: number;
  pendingLoansByLevel: Array<{
    level: string;
    count: number;
  }>;
}

export interface PerformanceSummaryItem {
  scopeId: string;
  customersServed: number;
  transactionsCount: number;
  loanApprovedCount: number;
  loanRejectedCount: number;
  schoolPaymentsCount: number;
  totalTransactionAmount: number;
}

export interface StaffRankingItem {
  staffId: string;
  branchId?: string;
  districtId?: string;
  customersServed: number;
  transactionsCount: number;
  loanApprovedCount: number;
  schoolPaymentsCount: number;
  score: number;
}

export interface VotingSummaryItem {
  voteId: string;
  title: string;
  totalResponses: number;
  eligibleShareholders: number;
  participationRate: number;
}

export interface VoteAdminItem {
  voteId: string;
  title: string;
  status: string;
  totalResponses: number;
  participationRate: number;
}

export type PerformancePeriod = 'today' | 'week' | 'month' | 'year';

export interface RolePerformanceMetrics {
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
  status: 'excellent' | 'good' | 'watch' | 'needs_support';
}

export interface RolePerformanceItem extends RolePerformanceMetrics {
  entityId: string;
  entityType: 'district' | 'branch' | 'employee';
  name: string;
  districtId?: string;
  districtName?: string;
  branchId?: string;
  branchName?: string;
  role?: string;
}

export interface RolePerformanceOverview {
  scope: 'district' | 'branch' | 'employee';
  period: PerformancePeriod;
  generatedAt: string;
  kpis: RolePerformanceMetrics;
  items: RolePerformanceItem[];
}

export interface NotificationCenterItem {
  notificationId: string;
  type: string;
  userLabel: string;
  status: string;
  sentAt: string;
}

export interface NotificationTemplateItem {
  id: string;
  category: 'loan' | 'insurance';
  templateType: string;
  title: string;
  subject?: string;
  messageBody: string;
  channelDefaults: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
  isActive: boolean;
}

export interface NotificationCampaignItem {
  id: string;
  category: 'loan' | 'insurance';
  templateType: string;
  channels: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
  targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
  targetIds: string[];
  messageSubject?: string;
  messageBody: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
}

export interface NotificationLogItem {
  id: string;
  campaignId: string;
  memberId: string;
  category: 'loan' | 'insurance';
  channel: 'email' | 'sms' | 'telegram' | 'in_app';
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  messageSubject?: string;
  messageBody: string;
  errorMessage?: string;
  sentAt?: string;
}

export interface InsuranceAlertItem {
  loanId: string;
  memberId: string;
  customerId: string;
  memberName: string;
  policyNumber?: string;
  providerName?: string;
  insuranceType?: string;
  alertType:
    | 'expiring_30_days'
    | 'expiring_7_days'
    | 'expired'
    | 'loan_without_valid_insurance'
    | 'loan_without_linked_insurance';
  endDate?: string;
  daysUntilExpiry?: number;
  requiresManagerAction: boolean;
}

export interface CreateManagerNotificationCampaignPayload {
  category: 'loan' | 'insurance';
  templateType: string;
  channels: Array<'email' | 'sms' | 'telegram' | 'in_app'>;
  targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
  targetIds?: string[];
  filters?: Record<string, unknown>;
  messageSubject?: string;
  messageBody?: string;
  demoRecipientEmail?: string;
}

export interface AuditLogItem {
  auditId: string;
  actor: string;
  action: string;
  entity: string;
  timestamp: string;
}

export interface SupportChatSummaryItem {
  conversationId: string;
  memberId?: string;
  customerId: string;
  memberName?: string;
  phoneNumber?: string;
  branchName?: string;
  status: string;
  issueCategory: string;
  memberType: string;
  lastMessage: string;
  updatedAt: string;
}

export interface SupportChatDetail {
  conversationId: string;
  memberId?: string;
  customerId: string;
  memberName?: string;
  phoneNumber?: string;
  branchName?: string;
  status: string;
  issueCategory: string;
  memberType: string;
  priority?: string;
  assignedAgentId?: string;
  assignedToStaffName?: string;
  messages: Array<{
    id: string;
    senderType: string;
    senderName?: string;
    message: string;
    createdAt: string;
  }>;
}

export interface StaffLoginPayload {
  identifier: string;
  password: string;
}

export interface AuthApi {
  login(payload: StaffLoginPayload): Promise<AdminSession>;
}

export interface DashboardApi {
  getSummary(role: AdminRole): Promise<ManagerDashboardSummary>;
  getBranchPerformance(role: AdminRole): Promise<PerformanceSummaryItem[]>;
  getDistrictPerformance(role: AdminRole): Promise<PerformanceSummaryItem[]>;
  getStaffRanking(role: AdminRole): Promise<StaffRankingItem[]>;
  getVotingSummary(): Promise<VotingSummaryItem[]>;
  getHeadOfficeDistrictSummary(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceOverview>;
  getHeadOfficeTopDistricts(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
  getHeadOfficeDistrictWatchlist(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
  getDistrictBranchSummary(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceOverview>;
  getDistrictTopBranches(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
  getDistrictBranchWatchlist(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
  getBranchEmployeeSummary(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceOverview>;
  getBranchTopEmployees(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
  getBranchEmployeeWatchlist(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<RolePerformanceItem[]>;
}

export interface LoanMonitoringApi {
  getPendingLoans(): Promise<void>;
  getLoanDetail(loanId: string): Promise<void>;
}

export interface VotingApi {
  getVotes(role: AdminRole): Promise<VoteAdminItem[]>;
  createVote(): Promise<void>;
  getParticipation(voteId: string): Promise<VotingSummaryItem | null>;
}

export interface NotificationApi {
  getNotifications(role: AdminRole): Promise<NotificationCenterItem[]>;
  getTemplates(): Promise<NotificationTemplateItem[]>;
  getCampaigns(): Promise<NotificationCampaignItem[]>;
  createCampaign(
    payload: CreateManagerNotificationCampaignPayload,
  ): Promise<NotificationCampaignItem>;
  sendCampaign(campaignId: string): Promise<NotificationCampaignItem>;
  getLogs(campaignId?: string): Promise<NotificationLogItem[]>;
  getInsuranceAlerts(): Promise<InsuranceAlertItem[]>;
}

export interface AuditApi {
  getByEntity(role: AdminRole): Promise<AuditLogItem[]>;
  getByActor(role: AdminRole): Promise<AuditLogItem[]>;
}

export interface SupportApi {
  getOpenChats(): Promise<SupportChatSummaryItem[]>;
  getAssignedChats(): Promise<SupportChatSummaryItem[]>;
  getResolvedChats(): Promise<SupportChatSummaryItem[]>;
  getChat(chatId: string): Promise<SupportChatDetail>;
  assignChat(chatId: string): Promise<SupportChatDetail>;
  reply(chatId: string, message: string): Promise<SupportChatDetail>;
  resolve(chatId: string): Promise<SupportChatDetail>;
  close(chatId: string): Promise<SupportChatDetail>;
  updateStatus(chatId: string, status: string): Promise<SupportChatDetail>;
}
