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
    subject: 'Bunna Bank Loan Due Soon Reminder',
    messageBody:
      'Your Bunna Bank loan payment is approaching. Please review the due amount and complete your payment on time.',
    channelDefaults: [
      NotificationChannel.EMAIL,
      NotificationChannel.IN_APP,
      NotificationChannel.SMS,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.LOAN,
    templateType: NotificationTemplateType.LOAN_PAYMENT_REMINDER,
    title: 'Loan payment reminder',
    subject: 'Bunna Bank Loan Payment Reminder',
    messageBody:
      'Your Bunna Bank loan payment details are ready. Review the amount and due date below.',
    channelDefaults: [
      NotificationChannel.EMAIL,
      NotificationChannel.IN_APP,
      NotificationChannel.SMS,
    ],
    templateFile: 'loan_payment_reminder.html',
  },
  {
    category: NotificationCategory.LOAN,
    templateType: NotificationTemplateType.PAYMENT_CONFIRMATION,
    title: 'Payment confirmation',
    subject: 'Bunna Bank Payment Confirmation',
    messageBody:
      'We have successfully received your payment. Review the payment summary below.',
    channelDefaults: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateFile: 'payment_confirmation.html',
  },
  {
    category: NotificationCategory.INSURANCE,
    templateType: NotificationTemplateType.INSURANCE_RENEWAL_REMINDER,
    title: 'Insurance renewal reminder',
    subject: 'Bunna Insurance Renewal Reminder',
    messageBody:
      'Your Bunna insurance policy is due for renewal soon. Review the policy details and renew on time.',
    channelDefaults: [
      NotificationChannel.EMAIL,
      NotificationChannel.IN_APP,
      NotificationChannel.SMS,
      NotificationChannel.TELEGRAM,
    ],
    templateFile: 'insurance_renewal_reminder.html',
  },
];

export function getNotificationTemplateDefinition(
  templateType: NotificationTemplateType | string,
): NotificationTemplateDefinition | undefined {
  return NOTIFICATION_TEMPLATE_DEFINITIONS.find(
    (item) => item.templateType === templateType,
  );
}
