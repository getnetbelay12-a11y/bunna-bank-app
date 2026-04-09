import {
  NotificationCategory,
  NotificationChannel,
  NotificationTemplateType,
} from '../../common/enums';

export type NotificationTemplateDefinition = {
  category: NotificationCategory;
  templateType: NotificationTemplateType;
  title: string;
  subject: string;
  messageBody: string;
  channelDefaults: NotificationChannel[];
  templateFile: string;
};

export const NOTIFICATION_TEMPLATE_DEFINITIONS: NotificationTemplateDefinition[] = [
  {
    category: NotificationCategory.LOAN,
    templateType: NotificationTemplateType.LOAN_DUE_SOON,
    title: 'Loan due soon reminder',
    subject: 'Your Loan Payment Reminder',
    messageBody:
      'Your loan payment is approaching. Please review the due amount and make your payment on time.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.TELEGRAM,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.LOAN,
    templateType: NotificationTemplateType.LOAN_PAYMENT_REMINDER,
    title: 'Loan payment reminder',
    subject: 'Your Loan Payment Reminder',
    messageBody:
      'Your loan payment details are ready. Review the amount and due date below.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.TELEGRAM,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.PAYMENT,
    templateType: NotificationTemplateType.SCHOOL_PAYMENT_DUE,
    title: 'School payment due reminder',
    subject: 'School Fee Reminder',
    messageBody:
      'Your school fee is due soon. Open the Bunna Bank app to review the student profile and complete payment.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ],
    templateFile: 'payment_confirmation.html',
  },
  {
    category: NotificationCategory.LOAN,
    templateType: NotificationTemplateType.PAYMENT_CONFIRMATION,
    title: 'Payment confirmation',
    subject: 'Payment Confirmation',
    messageBody:
      'We have successfully received your payment. Review the payment summary below.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL],
    templateFile: 'payment_confirmation.html',
  },
  {
    category: NotificationCategory.INSURANCE,
    templateType: NotificationTemplateType.INSURANCE_RENEWAL_REMINDER,
    title: 'Insurance renewal reminder',
    subject: 'Insurance Renewal Reminder',
    messageBody:
      'Your insurance policy is due for renewal soon. Review the policy details and renew on time.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.TELEGRAM,
    ],
    templateFile: 'insurance_renewal_reminder.html',
  },
  {
    category: NotificationCategory.PAYMENT,
    templateType: NotificationTemplateType.PAYMENT_FAILED,
    title: 'Payment failed alert',
    subject: 'Payment Failed',
    messageBody: 'A recent payment attempt failed. Review the payment details and try again.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL],
    templateFile: 'payment_confirmation.html',
  },
  {
    category: NotificationCategory.SUPPORT,
    templateType: NotificationTemplateType.SUPPORT_REPLY,
    title: 'Support reply',
    subject: 'Support Reply Available',
    messageBody: 'A support agent replied to your case. Open the app to continue the conversation.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.SECURITY,
    templateType: NotificationTemplateType.LOGIN_DETECTED,
    title: 'Login detected',
    subject: 'New Login Detected',
    messageBody: 'A new sign-in to your Bunna Bank profile was detected.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL, NotificationChannel.SMS],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.SYSTEM,
    templateType: NotificationTemplateType.ANNOUNCEMENT,
    title: 'Announcement',
    subject: 'Bunna Bank Announcement',
    messageBody: 'A new announcement is available in your Bunna Bank app.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.KYC,
    templateType: NotificationTemplateType.KYC_PENDING_REMINDER,
    title: 'KYC pending reminder',
    subject: 'Complete Your KYC Review',
    messageBody:
      'Your onboarding review needs additional action before secure services can be enabled. Review the required KYC details and respond as soon as possible.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.AUTOPAY,
    templateType: NotificationTemplateType.AUTOPAY_FAILURE_REMINDER,
    title: 'AutoPay failure reminder',
    subject: 'AutoPay Action Needed',
    messageBody:
      'Your scheduled AutoPay could not be completed. Review the funding source and retry before the next due date.',
    channelDefaults: [
      NotificationChannel.MOBILE_PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.TELEGRAM,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.SHAREHOLDER,
    templateType: NotificationTemplateType.SHAREHOLDER_VOTE,
    title: 'Shareholder voting reminder',
    subject: 'Shareholder Voting Update',
    messageBody:
      'A shareholder voting event or governance update is available in your Bunna Bank app.',
    channelDefaults: [NotificationChannel.MOBILE_PUSH, NotificationChannel.EMAIL],
    templateFile: 'loan_payment_reminder.html',
  },
];

export function getNotificationTemplateDefinition(
  templateType: NotificationTemplateType | string,
): NotificationTemplateDefinition | undefined {
  return NOTIFICATION_TEMPLATE_DEFINITIONS.find(
    (item) => item.templateType === templateType,
  );
}
