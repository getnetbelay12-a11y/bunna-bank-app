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
        subject: 'Bunna Bank Loan Due Soon Reminder',
        messageBody: 'Your Bunna Bank loan payment is approaching. Please review the due amount and complete your payment on time.',
        channelDefaults: [
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.IN_APP,
            enums_1.NotificationChannel.SMS,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.LOAN,
        templateType: enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER,
        title: 'Loan payment reminder',
        subject: 'Bunna Bank Loan Payment Reminder',
        messageBody: 'Your Bunna Bank loan payment details are ready. Review the amount and due date below.',
        channelDefaults: [
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.IN_APP,
            enums_1.NotificationChannel.SMS,
        ],
        templateFile: 'loan_payment_reminder.html',
    },
    {
        category: enums_1.NotificationCategory.LOAN,
        templateType: enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION,
        title: 'Payment confirmation',
        subject: 'Bunna Bank Payment Confirmation',
        messageBody: 'We have successfully received your payment. Review the payment summary below.',
        channelDefaults: [enums_1.NotificationChannel.EMAIL, enums_1.NotificationChannel.IN_APP],
        templateFile: 'payment_confirmation.html',
    },
    {
        category: enums_1.NotificationCategory.INSURANCE,
        templateType: enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER,
        title: 'Insurance renewal reminder',
        subject: 'Bunna Insurance Renewal Reminder',
        messageBody: 'Your Bunna insurance policy is due for renewal soon. Review the policy details and renew on time.',
        channelDefaults: [
            enums_1.NotificationChannel.EMAIL,
            enums_1.NotificationChannel.IN_APP,
            enums_1.NotificationChannel.SMS,
            enums_1.NotificationChannel.TELEGRAM,
        ],
        templateFile: 'insurance_renewal_reminder.html',
    },
];
function getNotificationTemplateDefinition(templateType) {
    return exports.NOTIFICATION_TEMPLATE_DEFINITIONS.find((item) => item.templateType === templateType);
}
//# sourceMappingURL=notification-template.registry.js.map