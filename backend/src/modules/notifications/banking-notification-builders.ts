import {
  NotificationCategory,
  LoanAction,
  LoanStatus,
  LoanWorkflowLevel,
  NotificationStatus,
  NotificationType,
} from '../../common/enums';

export interface BankingNotificationContent {
  type: NotificationType;
  status?: NotificationStatus;
  title: string;
  message: string;
}

export function buildRegistrationCompletedNotification(
  demoMode: boolean,
): BankingNotificationContent {
  return {
    type: NotificationType.SYSTEM,
    title: 'Registration Completed',
    message: demoMode
      ? 'Your seeded account has been created. Verification is bypassed in local seeded mode.'
      : 'Your account has been created. Fayda verification is pending and the submission may require manual review.',
  };
}

export function buildLoanSubmissionNotification(): BankingNotificationContent {
  return {
    type: NotificationType.LOAN_STATUS,
    status: NotificationStatus.SENT,
    title: 'Loan Application Submitted',
    message: 'Your loan application has been submitted successfully.',
  };
}

export function buildSchoolPaymentNotification(
  schoolName: string,
  status: NotificationStatus,
  context?: {
    studentName?: string;
    grade?: string;
    latestAverage?: number;
    attendanceRate?: number;
    remainingBalance?: number;
  },
): BankingNotificationContent {
  const contextParts = [
    context?.studentName ? `for ${context.studentName}` : undefined,
    context?.grade ? `(${context.grade})` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const performanceParts = [
    typeof context?.latestAverage === 'number'
      ? `average ${context.latestAverage}%`
      : undefined,
    typeof context?.attendanceRate === 'number'
      ? `attendance ${context.attendanceRate}%`
      : undefined,
  ]
    .filter(Boolean)
    .join(', ');
  const balanceMessage =
    typeof context?.remainingBalance === 'number'
      ? context.remainingBalance <= 0
        ? 'School fee status is now paid in full.'
        : `Remaining balance: ETB ${context.remainingBalance.toLocaleString()}.`
      : undefined;

  return {
    type: NotificationType.PAYMENT,
    status,
    title: 'School Payment Successful',
    message: [
      `Your payment to ${schoolName}${contextParts ? ` ${contextParts}` : ''} has been recorded successfully.`,
      performanceParts ? `Latest performance snapshot: ${performanceParts}.` : undefined,
      balanceMessage,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function buildSchoolFeeReminderNotification(input: {
  schoolName: string;
  studentName: string;
  grade?: string;
  dueDate?: string;
  outstandingBalance: number;
  parentUpdateSummary?: string;
}): BankingNotificationContent {
  const context = input.grade ? `${input.studentName} (${input.grade})` : input.studentName;

  return {
    type: NotificationType.SCHOOL_PAYMENT_DUE,
    status: NotificationStatus.SENT,
    title: 'School Fee Reminder',
    message: [
      `Reminder from ${input.schoolName}: ${context} has an outstanding school fee balance of ETB ${input.outstandingBalance.toLocaleString()}.`,
      input.dueDate ? `Due date: ${input.dueDate}.` : undefined,
      input.parentUpdateSummary ? `Academic update: ${input.parentUpdateSummary}.` : undefined,
      'Open School Payment in the Bunna Bank app to review and pay.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function buildVoteRecordedNotification(
  voteTitle: string,
): BankingNotificationContent {
  return {
    type: NotificationType.VOTING,
    status: NotificationStatus.SENT,
    title: 'Vote Recorded',
    message: `Your vote for ${voteTitle} has been recorded.`,
  };
}

export function buildLoanWorkflowNotification(input: {
  action: LoanAction;
  status: LoanStatus;
  level: LoanWorkflowLevel;
  deficiencyReasons: string[];
}): BankingNotificationContent {
  return {
    type: NotificationType.LOAN_STATUS,
    status: NotificationStatus.SENT,
    title: buildLoanWorkflowNotificationTitle(input.action, input.status),
    message: buildLoanWorkflowNotificationMessage(
      input.action,
      input.status,
      input.level,
      input.deficiencyReasons,
    ),
  };
}

export function buildSupportAssignmentNotification(): BankingNotificationContent {
  return {
    type: NotificationType.SUPPORT_ASSIGNED,
    title: 'Your support case has been assigned',
    message: 'An Bunna Bank support agent is now handling your request.',
  };
}

export function buildSupportReplyNotification(
  message: string,
): BankingNotificationContent {
  return {
    type: NotificationType.SUPPORT_REPLY,
    title: 'Support replied to your message',
    message,
  };
}

export function buildSupportResolvedNotification(): BankingNotificationContent {
  return {
    type: NotificationType.SUPPORT_RESOLVED,
    title: 'Your support conversation was resolved',
    message: 'Support marked your current conversation as resolved.',
  };
}

export function buildSupportStaffMessageNotification(
  message: string,
): BankingNotificationContent {
  return {
    type: NotificationType.CHAT,
    title: 'Customer sent a support message',
    message,
  };
}

export function buildReminderInAppNotification(input: {
  category: NotificationCategory;
  subject?: string;
  messageBody: string;
}): BankingNotificationContent {
  return {
    type:
      input.category === NotificationCategory.INSURANCE
        ? NotificationType.INSURANCE_RENEWAL_DUE
        : input.category === NotificationCategory.PAYMENT
          ? NotificationType.PAYMENT_SUCCESS
          : input.category === NotificationCategory.SUPPORT
            ? NotificationType.SUPPORT_REPLY
            : input.category === NotificationCategory.SECURITY
              ? NotificationType.SUSPICIOUS_LOGIN
              : input.category === NotificationCategory.KYC
                ? NotificationType.KYC_NEED_MORE_INFORMATION
                : input.category === NotificationCategory.AUTOPAY
                  ? NotificationType.AUTOPAY_FAILED
                  : input.category === NotificationCategory.SHAREHOLDER
                    ? NotificationType.SHAREHOLDER_ANNOUNCEMENT
        : NotificationType.LOAN_STATUS,
    title: input.subject ?? defaultReminderTitle(input.category),
    message: input.messageBody,
  };
}

function defaultReminderTitle(category: NotificationCategory): string {
  switch (category) {
    case NotificationCategory.INSURANCE:
      return 'Insurance reminder';
    case NotificationCategory.SHAREHOLDER:
      return 'Shareholder announcement';
    case NotificationCategory.LOAN:
    default:
      return 'Bunna Bank reminder';
  }
}

function buildLoanWorkflowNotificationTitle(
  action: LoanAction,
  status: LoanStatus,
): string {
  switch (action) {
    case LoanAction.APPROVE:
      return 'Loan Approved';
    case LoanAction.REJECT:
      return 'Loan Rejected';
    case LoanAction.DISBURSE:
      return 'Loan Disbursed';
    case LoanAction.CLOSE:
      return 'Loan Closed';
    case LoanAction.FORWARD:
      return 'Loan Review Escalated';
    case LoanAction.RETURN_FOR_CORRECTION:
      return 'Loan Needs More Documents';
    case LoanAction.REVIEW:
      return 'Loan Review In Progress';
    default:
      return `Loan ${status.replace(/_/g, ' ')}`.replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      );
  }
}

function buildLoanWorkflowNotificationMessage(
  action: LoanAction,
  status: LoanStatus,
  level: LoanWorkflowLevel,
  deficiencyReasons: string[],
): string {
  if (action === LoanAction.FORWARD && status === LoanStatus.DISTRICT_REVIEW) {
    return 'Your loan has moved to district review for the next approval step.';
  }

  if (
    action === LoanAction.FORWARD &&
    status === LoanStatus.HEAD_OFFICE_REVIEW
  ) {
    return 'Your loan has moved to head office review for additional controls.';
  }

  if (action === LoanAction.RETURN_FOR_CORRECTION) {
    return deficiencyReasons.length > 0
      ? `Your loan needs more evidence before approval: ${deficiencyReasons.join(', ')}.`
      : 'Your loan has been returned for correction and resubmission.';
  }

  if (action === LoanAction.REVIEW) {
    return `Your loan is actively under review at ${level.replace(/_/g, ' ')} level.`;
  }

  if (action === LoanAction.APPROVE) {
    return 'Your loan has been approved. Watch the app for disbursement and repayment reminders.';
  }

  return `Your loan is now ${status.replace(/_/g, ' ')} at ${level.replace(/_/g, ' ')} level.`;
}
