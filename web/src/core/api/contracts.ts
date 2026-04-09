import type { AdminRole, AppSession } from '../session';

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
  uniqueBranches?: number;
  uniqueDistricts?: number;
  branchParticipation?: Array<{
    id: string;
    name: string;
    totalResponses: number;
  }>;
  districtParticipation?: Array<{
    id: string;
    name: string;
    totalResponses: number;
  }>;
}

export interface OnboardingReviewItem {
  memberId: string;
  customerId: string;
  memberName: string;
  phoneNumber?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  onboardingReviewStatus: string;
  membershipStatus: string;
  identityVerificationStatus: string;
  kycStatus: string;
  requiredAction: string;
  submittedAt?: string;
  updatedAt?: string;
  reviewNote?: string;
}

export interface AutopayOperationItem {
  id: string;
  memberId: string;
  customerId: string;
  memberName: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  serviceType: string;
  accountId: string;
  schedule: string;
  enabled: boolean;
  operationalStatus: 'active' | 'paused';
  actionRequired: string;
  updatedAt?: string;
}

export interface VoteAdminItem {
  voteId: string;
  title: string;
  status: string;
  totalResponses: number;
  participationRate: number;
  eligibleShareholders: number;
  startDate?: string;
  endDate?: string;
}

export interface VoteResultItem {
  optionId: string;
  optionName: string;
  votes: number;
  percentage: number;
}

export interface CreateVotePayload {
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  options: Array<{
    name: string;
    description?: string;
    displayOrder?: number;
  }>;
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

export interface CommandCenterSupportOverview {
  openChats: number;
  assignedChats: number;
  resolvedChats: number;
  escalatedChats: number;
}

export interface CommandCenterRiskSummary {
  totalAlerts: number;
  loanAlerts: number;
  kycAlerts: number;
  supportAlerts: number;
  notificationAlerts: number;
}

export interface GovernanceStatusSummary {
  activeVotes: number;
  draftVotes: number;
  publishedVotes: number;
  shareholderAnnouncements: number;
}

export interface HeadOfficeCommandCenterSummary {
  totalCustomers: number;
  totalShareholders: number;
  totalSavings: number;
  totalLoans: number;
  pendingApprovals: number;
  riskAlerts: CommandCenterRiskSummary;
  districtPerformance: RolePerformanceOverview;
  supportOverview: CommandCenterSupportOverview;
  governanceStatus: GovernanceStatusSummary;
}

export interface DistrictCommandCenterSummary {
  branchList: RolePerformanceItem[];
  branchRanking: RolePerformanceItem[];
  loanApprovalsPerBranch: Array<{
    branchId: string;
    branchName: string;
    approvedCount: number;
  }>;
  kycCompletion: {
    completed: number;
    pendingReview: number;
    needsAction: number;
    completionRate: number;
  };
  supportMetrics: CommandCenterSupportOverview;
}

export interface BranchCommandCenterSummary {
  employeePerformance: RolePerformanceOverview;
  loansHandled: number;
  kycCompleted: number;
  supportHandled: number;
  pendingTasks: number;
}

export interface NotificationCenterItem {
  notificationId: string;
  type: string;
  userId?: string;
  userLabel: string;
  status: string;
  sentAt: string;
  actionLabel?: string;
  deepLink?: string;
  priority?: string;
}

export type NotificationCategory =
  | 'loan'
  | 'insurance'
  | 'kyc'
  | 'autopay'
  | 'payment'
  | 'support'
  | 'security'
  | 'system'
  | 'shareholder';

export interface NotificationTemplateItem {
  id: string;
  category: NotificationCategory;
  templateType: string;
  title: string;
  subject?: string;
  messageBody: string;
  channelDefaults: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
  isActive: boolean;
}

export interface NotificationCampaignItem {
  id: string;
  category: NotificationCategory;
  templateType: string;
  channels: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
  targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
  targetIds: string[];
  messageSubject?: string;
  messageBody: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  deliverySummary?: {
    totalTargets: number;
    totalChannels: number;
    totalAttempts: number;
    channels: Partial<Record<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app', {
      sent: number;
      delivered: number;
      failed: number;
      skipped: number;
    }>>;
    perRecipientResults: Array<{
      customerId: string;
      memberId: string;
      channels: Partial<Record<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app', {
        status: 'sent' | 'delivered' | 'failed' | 'skipped';
        recipient?: string;
        providerMessageId?: string;
        errorMessage?: string;
      }>>;
    }>;
  };
}

export interface NotificationLogItem {
  id: string;
  campaignId: string;
  memberId: string;
  category: NotificationCategory;
  channel: 'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app';
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
  category: NotificationCategory;
  templateType: string;
  channels: Array<'mobile_push' | 'email' | 'sms' | 'telegram' | 'in_app'>;
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
  priority?: string;
  escalationFlag?: boolean;
  responseDueAt?: string;
  slaState?: 'on_track' | 'attention' | 'breached';
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
  responseDueAt?: string;
  slaState?: 'on_track' | 'attention' | 'breached';
  assignedToStaffName?: string;
  messages: Array<{
    id: string;
    senderType: string;
    senderName?: string;
    message: string;
    createdAt: string;
  }>;
}

export interface RecommendationItem {
  id: string;
  customerId: string;
  audienceType: 'customer' | 'staff';
  type: string;
  title: string;
  description: string;
  reason: string;
  actionLabel: string;
  actionRoute: string;
  score: number;
  priority: number;
  badge: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationCollection {
  title: string;
  recommendations: RecommendationItem[];
}

export interface RecommendationDashboardSummary {
  recommendationsGeneratedToday: number;
  topRecommendationType: string | null;
  completionRate: number;
  dismissedRate: number;
  highOpportunityCustomers: number;
  customersMissingKyc: number;
  customersSuitableForAutopay: number;
}

export type ServiceRequestType =
  | 'failed_transfer'
  | 'payment_dispute'
  | 'phone_update'
  | 'atm_card_request'
  | 'account_relationship';

export type ServiceRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'awaiting_customer'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface ServiceRequestItem {
  id: string;
  memberId: string;
  customerId: string;
  memberName: string;
  phoneNumber?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  type: ServiceRequestType;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  latestNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestDetail extends ServiceRequestItem {
  payload: Record<string, unknown>;
  attachments: string[];
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  timeline?: Array<{
    id: string;
    actorType: string;
    actorId?: string;
    actorName?: string;
    eventType: string;
    fromStatus?: ServiceRequestStatus;
    toStatus?: ServiceRequestStatus;
    note?: string;
    createdAt?: string;
  }>;
}

export interface ServiceRequestListResult {
  items: ServiceRequestItem[];
  total: number;
  page: number;
  limit: number;
}

export type CardStatus =
  | 'active'
  | 'locked'
  | 'blocked'
  | 'pending_issue'
  | 'replacement_requested';

export type CardRequestType = 'new_issue' | 'replacement';

export type CardRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface CardOperationItem {
  id: string;
  memberId: string;
  cardId?: string;
  requestType: CardRequestType;
  status: CardRequestStatus;
  preferredBranch?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CardOperationDetail extends CardOperationItem {
  memberName: string;
  customerId: string;
  phoneNumber?: string;
  card: CardOperationUpdateResult['card'] | null;
  timeline: Array<{
    id: string;
    actorType: string;
    actorId?: string;
    actorName?: string;
    eventType: string;
    note?: string;
    createdAt?: string;
  }>;
}

export interface CardOperationUpdateResult {
  card: {
    id: string;
    memberId: string;
    cardType: string;
    last4?: string;
    status: CardStatus;
    preferredBranch?: string;
    channelControls?: Record<string, boolean>;
    issuedAt?: string;
    lockedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  request: CardOperationItem;
}

export interface PaymentReceiptItem {
  receiptId: string;
  receiptType:
    | 'school_payment'
    | 'qr_payment'
    | 'payment_dispute'
    | 'failed_transfer';
  sourceId: string;
  title: string;
  description: string;
  status: string;
  amount?: number;
  currency?: string;
  transactionReference?: string;
  counterparty?: string;
  channel?: string;
  attachments: string[];
  recordedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentActivityItem {
  memberId: string;
  customerId: string;
  memberName: string;
  phone?: string;
  branchName?: string;
  openCases: number;
  totalReceipts: number;
  qrPayments: number;
  schoolPayments: number;
  disputeReceipts: number;
  latestActivityAt?: string;
}

export interface SchoolConsoleSummary {
  schools: number;
  students: number;
  openInvoices: number;
  todayCollections: number;
}

export interface SchoolPortfolioItem {
  id: string;
  code: string;
  name: string;
  branchName: string;
  city: string;
  region: string;
  status: string;
  students: number;
  openInvoices: number;
  todayCollections: number;
}

export interface SchoolInvoiceItem {
  invoiceNo: string;
  schoolId: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
  dueDate: string;
}

export interface SchoolCollectionItem {
  receiptNo: string;
  schoolId: string;
  schoolName: string;
  studentId: string;
  amount: number;
  channel: string;
  status: string;
  reconciliationStatus: string;
  recordedAt: string;
}

export interface SchoolCollectionAgingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface SchoolCollectionSummary {
  generatedAt: string;
  receipts: number;
  successful: number;
  pendingSettlement: number;
  totalAmount: number;
  matchedAmount: number;
  awaitingSettlementAmount: number;
  aging: SchoolCollectionAgingBucket[];
}

export interface SchoolSettlementSummaryItem {
  schoolId: string;
  schoolName: string;
  receipts: number;
  totalAmount: number;
  matchedAmount: number;
  awaitingSettlementAmount: number;
  pendingSettlement: number;
  lastRecordedAt?: string;
}

export interface SchoolConsoleOverview {
  summary: SchoolConsoleSummary;
  schools: SchoolPortfolioItem[];
  invoices: SchoolInvoiceItem[];
  collections: SchoolCollectionItem[];
  collectionSummary: SchoolCollectionSummary;
  schoolSettlements: SchoolSettlementSummaryItem[];
}

export interface FeePlanItem {
  label: string;
  amount: number;
}

export interface FeePlanRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  academicYear: string;
  term: string;
  grade: string;
  name: string;
  status: string;
  items: FeePlanItem[];
  total: number;
}

export interface StudentRegistryFilter {
  schoolId?: string;
  grade?: string;
  section?: string;
  status?: string;
  search?: string;
}

export interface StudentPaymentSummary {
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid' | 'pending_billing';
  latestInvoiceNo?: string;
  latestInvoiceStatus?: string;
  latestReceiptNo?: string;
  latestPaymentAt?: string;
  nextDueDate?: string;
  monthlyFee: number;
}

export interface StudentPerformanceSummary {
  studentId: string;
  latestReportPeriod: string;
  latestAverage: number;
  attendanceRate: number;
  classRank: number;
  behavior: 'excellent' | 'good' | 'watch';
  teacherRemark: string;
  strengths: string[];
  improvementAreas: string[];
  updatedAt: string;
}

export interface StudentRegistryItem {
  schoolId: string;
  schoolName: string;
  studentId: string;
  fullName: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  parentAccountNumber?: string;
  guardianStatus: string;
  enrollmentStatus: string;
  academicYear: string;
  rollNumber?: string;
  status: string;
  paymentSummary?: StudentPaymentSummary;
  performanceSummary?: StudentPerformanceSummary;
  parentUpdateSummary?: string;
}

export interface GuardianRecord {
  guardianId: string;
  studentId: string;
  fullName: string;
  phone: string;
  relationship: string;
  status: string;
}

export interface GuardianStudentLinkItem {
  linkId: string;
  studentId: string;
  guardianId: string;
  memberCustomerId: string;
  relationship: string;
  status: string;
}

export interface StudentDetail {
  student: StudentRegistryItem;
  guardians: GuardianRecord[];
  guardianLinks: GuardianStudentLinkItem[];
  invoices: SchoolInvoiceItem[];
  collections: SchoolCollectionItem[];
}

export interface ParentStudentLookupItem {
  schoolId: string;
  schoolName: string;
  studentId: string;
  fullName: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  parentAccountNumber?: string;
  status: string;
  paymentSummary?: StudentPaymentSummary;
  performanceSummary?: StudentPerformanceSummary;
  parentUpdateSummary?: string;
}

export interface ParentPortalSession {
  userId: string;
  customerId: string;
  fullName: string;
  phone?: string;
}

export interface ParentStudentAccount {
  student: ParentStudentLookupItem;
  invoices: SchoolInvoiceItem[];
  collections: SchoolCollectionItem[];
  outstandingBalance: number;
  paymentSummary?: StudentPaymentSummary;
  performanceSummary?: StudentPerformanceSummary;
  parentUpdateSummary?: string;
}

export interface ParentPortalPaymentResult {
  status: string;
  message: string;
  receiptNo?: string;
  invoiceNo?: string;
  studentId?: string;
  amount?: number;
  remainingBalance?: number;
}

export interface InvoiceReminderResult {
  invoiceNo: string;
  status: string;
  message: string;
}

export interface BulkInvoiceReminderResult {
  invoiceNos: string[];
  queued: number;
  missing: number;
  results: InvoiceReminderResult[];
  message: string;
}

export interface InvoiceBatchGenerationResult {
  schoolId: string;
  academicYear: string;
  term: string;
  generatedInvoices: number;
  message: string;
}

export interface InvoiceBatchPreviewResult {
  schoolId: string;
  academicYear: string;
  term: string;
  totalStudents: number;
  previewCount: number;
  missingGrades: string[];
  grades: Array<{
    grade: string;
    totalStudents: number;
    activePlan: boolean;
    feePlanName?: string;
    invoiceTotal: number;
    canGenerate: boolean;
  }>;
}

export interface StudentImportRowInput {
  studentId?: string;
  fullName: string;
  grade?: string;
  section?: string;
  guardianName?: string;
  guardianPhone?: string;
  parentAccountNumber?: string;
}

export interface StudentImportResult {
  schoolId: string;
  importedCount: number;
  message: string;
  items: Array<{
    schoolId: string;
    studentId: string;
    fullName: string;
    grade: string;
    section: string;
    guardianName: string;
    guardianPhone: string;
    parentAccountNumber?: string;
    status: string;
  }>;
}

export interface AttachmentMetadata {
  provider: 'local' | 's3';
  storageKey: string;
  originalFileName: string;
  mimeType?: string;
  sizeBytes: number;
}

export interface StaffLoginPayload {
  identifier: string;
  password: string;
}

export interface AuthApi {
  login(payload: StaffLoginPayload): Promise<AppSession>;
  checkExistingAccount?: (payload: {
    phoneNumber?: string;
    faydaFin?: string;
    email?: string;
  }) => Promise<{
    exists: boolean;
    matchType?: 'phone' | 'fayda_fin' | 'national_id_data' | 'email';
    message: string;
    customerId?: string;
  }>;
}

export interface DashboardApi {
  getSummary(role: AdminRole): Promise<ManagerDashboardSummary>;
  getBranchPerformance(role: AdminRole): Promise<PerformanceSummaryItem[]>;
  getDistrictPerformance(role: AdminRole): Promise<PerformanceSummaryItem[]>;
  getStaffRanking(role: AdminRole): Promise<StaffRankingItem[]>;
  getVotingSummary(): Promise<VotingSummaryItem[]>;
  getOnboardingReviewQueue(role: AdminRole): Promise<OnboardingReviewItem[]>;
  getAutopayOperations(role: AdminRole): Promise<AutopayOperationItem[]>;
  updateAutopayOperation(
    id: string,
    payload: {
      enabled: boolean;
      note?: string;
    },
  ): Promise<AutopayOperationItem>;
  updateOnboardingReview(
    memberId: string,
    payload: {
      status: 'submitted' | 'review_in_progress' | 'needs_action' | 'approved';
      note?: string;
    },
  ): Promise<OnboardingReviewItem>;
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
  getHeadOfficeCommandCenter(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<HeadOfficeCommandCenterSummary>;
  getDistrictCommandCenter(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<DistrictCommandCenterSummary>;
  getBranchCommandCenter(
    role: AdminRole,
    period?: PerformancePeriod,
  ): Promise<BranchCommandCenterSummary>;
}

export interface LoanMonitoringApi {
  getPendingLoans(): Promise<LoanQueueItem[]>;
  getLoanDetail(loanId: string): Promise<LoanQueueDetail | null>;
  getCustomerProfile(loanId: string): Promise<LoanCustomerProfile | null>;
  processAction(
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
  ): Promise<{
    loanId: string;
    previousStatus: string;
    status: string;
    currentLevel: string;
  }>;
}

export type LoanQueueAction =
  | 'review'
  | 'forward'
  | 'approve'
  | 'return_for_correction';

export interface LoanQueueItem {
  loanId: string;
  memberId: string;
  customerId: string;
  memberName: string;
  amount: number;
  level: string;
  status: string;
  branchId?: string;
  districtId?: string;
  deficiencyReasons: string[];
  availableActions: LoanQueueAction[];
  updatedAt?: string;
}

export interface LoanWorkflowTimelineEntry {
  action: string;
  level: string;
  fromStatus: string;
  toStatus: string;
  actorRole?: string;
  comment?: string;
  createdAt?: string;
}

export interface LoanQueueDetail extends LoanQueueItem {
  nextAction: string;
  availableActions: LoanQueueAction[];
  history: LoanWorkflowTimelineEntry[];
}

export interface LoanCustomerProfile {
  memberId: string;
  customerId: string;
  memberName: string;
  branchId?: string;
  districtId?: string;
  activeLoans: number;
  closedLoans: number;
  rejectedLoans: number;
  totalLoanCount: number;
  totalBorrowedAmount: number;
  totalClosedAmount: number;
  repaymentCount90d: number;
  lastRepaymentAt?: string;
  autopayEnabled: boolean;
  autopayServices: string[];
  repaymentSignal: 'strong' | 'steady' | 'watch';
  loyaltyTier: 'gold' | 'silver' | 'watch';
  nextBestAction: string;
  offerCue: string;
  openSupportCases: number;
  activeLoanStatuses: string[];
}

export interface VotingApi {
  getVotes(role: AdminRole): Promise<VoteAdminItem[]>;
  createVote(payload: CreateVotePayload): Promise<VoteAdminItem>;
  openVote?(voteId: string): Promise<VoteAdminItem>;
  closeVote?(voteId: string): Promise<VoteAdminItem>;
  getResults?(voteId: string): Promise<VoteResultItem[]>;
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
  getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLogItem[]>;
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

export interface ServiceRequestApi {
  getRequests(): Promise<ServiceRequestListResult>;
  getRequest(requestId: string): Promise<ServiceRequestDetail>;
  downloadAttachment(storageKey: string): Promise<Blob>;
  getAttachmentMetadata(storageKey: string): Promise<AttachmentMetadata>;
  updateStatus(
    requestId: string,
    payload: { status: ServiceRequestStatus; note?: string },
  ): Promise<ServiceRequestDetail>;
}

export interface CardOperationsApi {
  getRequests(): Promise<CardOperationItem[]>;
  getRequest(requestId: string): Promise<CardOperationDetail>;
  updateStatus(
    requestId: string,
    payload: { status: CardRequestStatus; note?: string },
  ): Promise<CardOperationUpdateResult>;
}

export interface PaymentOperationsApi {
  getActivity(): Promise<PaymentActivityItem[]>;
  getMemberReceipts(memberId: string): Promise<PaymentReceiptItem[]>;
  downloadAttachment(storageKey: string): Promise<Blob>;
  getAttachmentMetadata(storageKey: string): Promise<AttachmentMetadata>;
}

export interface SchoolConsoleApi {
  getOverview(): Promise<SchoolConsoleOverview>;
  getFeePlans(schoolId?: string): Promise<FeePlanRecord[]>;
  createFeePlan(payload: {
    schoolId: string;
    schoolName: string;
    academicYear: string;
    term: string;
    grade: string;
    name: string;
    status: string;
    items: FeePlanItem[];
  }): Promise<FeePlanRecord>;
  getRegistry(filters?: StudentRegistryFilter): Promise<StudentRegistryItem[]>;
  getStudentDetail(studentId: string): Promise<StudentDetail | null>;
  createGuardian(payload: {
    studentId: string;
    fullName: string;
    phone: string;
    relationship: string;
    status: string;
  }): Promise<GuardianRecord>;
  updateGuardian(
    guardianId: string,
    payload: {
      fullName?: string;
      phone?: string;
      relationship?: string;
      status?: string;
    },
  ): Promise<GuardianRecord>;
  createGuardianStudentLink(payload: {
    studentId: string;
    guardianId: string;
    memberCustomerId: string;
    relationship: string;
    status: string;
  }): Promise<GuardianStudentLinkItem>;
  updateGuardianStudentLink(
    linkId: string,
    payload: {
      relationship?: string;
      status?: string;
    },
  ): Promise<GuardianStudentLinkItem>;
  previewInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchPreviewResult>;
  sendInvoiceReminder(invoiceNo: string): Promise<InvoiceReminderResult>;
  sendInvoiceReminders(invoiceNos: string[]): Promise<BulkInvoiceReminderResult>;
  generateInvoiceBatch(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }): Promise<InvoiceBatchGenerationResult>;
  createSchool(payload: {
    name: string;
    code: string;
    branchName?: string;
    city?: string;
    region?: string;
  }): Promise<SchoolPortfolioItem>;
  importStudents(payload: {
    schoolId: string;
    students: StudentImportRowInput[];
  }): Promise<StudentImportResult>;
}

export interface ParentPortalApi {
  login(payload: { customerId: string; password: string }): Promise<ParentPortalSession>;
  getLinkedStudents(): Promise<ParentStudentLookupItem[]>;
  searchStudents(query: string): Promise<ParentStudentLookupItem[]>;
  getStudentAccount(studentId: string): Promise<ParentStudentAccount | null>;
  submitPayment(payload: {
    invoiceNo: string;
    amount: number;
    channel?: string;
    payerName?: string;
    payerPhone?: string;
  }): Promise<ParentPortalPaymentResult>;
}

export interface RecommendationApi {
  getDashboardSummary(): Promise<RecommendationDashboardSummary>;
  getCustomerRecommendations(memberId: string): Promise<RecommendationCollection>;
  generateForCustomer(memberId: string): Promise<void>;
}
