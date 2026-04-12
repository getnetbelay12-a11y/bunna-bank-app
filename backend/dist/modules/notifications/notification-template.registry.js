"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TEMPLATE_DEFINITIONS = void 0;
exports.getNotificationTemplateDefinition = getNotificationTemplateDefinition;
const enums_1 = require("../../common/enums");
exports.NOTIFICATION_TEMPLATE_DEFINITIONS = [
    {
        category: enums_1.NotificationCategory.LOAN,
        templateType: enums_1.NotificationTemplateType.LOAN_DUE_SOON,
        title: 'Loan due soon reminder',
        subject: 'Your Loan Payment Reminder',
        messageBody: 'Your loan payment is approaching. Please review the due amount and make your payment on time.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
            enums_1.NotificationChannel.TELEGRAM,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.LOAN,
        templateType: enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER,
        title: 'Loan payment reminder',
        subject: 'Your Loan Payment Reminder',
        messageBody: 'Your loan payment details are ready. Review the amount and due date below.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
            enums_1.NotificationChannel.TELEGRAM,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.PAYMENT,
        templateType: enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE,
        title: 'School payment due reminder',
        subject: 'School Fee Reminder',
        messageBody: 'Your school fee is due soon. Open the Bunna Bank app to review the student profile and complete payment.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
        ],
        templateFile: 'payment_confirmation.html',
    },
    {
        category: enums_1.NotificationCategory.LOAN,
        templateType: enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION,
        title: 'Payment confirmation',
        subject: 'Payment Confirmation',
        messageBody: 'We have successfully received your payment. Review the payment summary below.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL],
        templateFile: 'payment_confirmation.html',
    },
    {
        category: enums_1.NotificationCategory.INSURANCE,
        templateType: enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER,
        title: 'Insurance renewal reminder',
        subject: 'Insurance Renewal Reminder',
        messageBody: 'Your insurance policy is due for renewal soon. Review the policy details and renew on time.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
            enums_1.NotificationChannel.TELEGRAM,
        ],
        templateFile: 'insurance_renewal_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.PAYMENT,
        templateType: enums_1.NotificationTemplateType.PAYMENT_FAILED,
        title: 'Payment failed alert',
        subject: 'Payment Failed',
        messageBody: 'A recent payment attempt failed. Review the payment details and try again.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL],
        templateFile: 'payment_confirmation.html',
    },
    {
        category: enums_1.NotificationCategory.SUPPORT,
        templateType: enums_1.NotificationTemplateType.SUPPORT_REPLY,
        title: 'Support reply',
        subject: 'Support Reply Available',
        messageBody: 'A support agent replied to your case. Open the app to continue the conversation.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.SECURITY,
        templateType: enums_1.NotificationTemplateType.LOGIN_DETECTED,
        title: 'Login detected',
        subject: 'New Login Detected',
        messageBody: 'A new sign-in to your Bunna Bank profile was detected.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL, enums_1.NotificationChannel.SMS],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.SYSTEM,
        templateType: enums_1.NotificationTemplateType.ANNOUNCEMENT,
        title: 'Announcement',
        subject: 'Bunna Bank Announcement',
        messageBody: 'A new announcement is available in your Bunna Bank app.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.KYC,
        templateType: enums_1.NotificationTemplateType.KYC_PENDING_REMINDER,
        title: 'KYC pending reminder',
        subject: 'Complete Your KYC Review',
        messageBody: 'Your onboarding review needs additional action before secure services can be enabled. Review the required KYC details and respond as soon as possible.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.AUTOPAY,
        templateType: enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER,
        title: 'AutoPay failure reminder',
        subject: 'AutoPay Action Needed',
        messageBody: 'Your scheduled AutoPay could not be completed. Review the funding source and retry before the next due date.',
        channelDefaults: [
            enums_1.NotificationChannel.MOBILE_PUSH,
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.SMS,
            enums_1.NotificationChannel.TELEGRAM,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.SHAREHOLDER,
        templateType: enums_1.NotificationTemplateType.SHAREHOLDER_VOTE,
        title: 'Shareholder voting reminder',
        subject: 'Shareholder Voting Update',
        messageBody: 'A shareholder voting event or governance update is available in your Bunna Bank app.',
        channelDefaults: [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.EMAIL],
        templateFile: 'loan_payment_reminder.html',
    },
];
function getNotificationTemplateDefinition(templateType) {
    return exports.NOTIFICATION_TEMPLATE_DEFINITIONS.find((item) => item.templateType === templateType);
}
//# sourceMappingURL=notification-template.registry.js.map