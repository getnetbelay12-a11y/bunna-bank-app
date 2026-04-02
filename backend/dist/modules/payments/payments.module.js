"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const savings_account_schema_1 = require("../savings/schemas/savings-account.schema");
const payment_notification_port_1 = require("./payment-notification.port");
const payment_notification_service_1 = require("./payment-notification.service");
const payments_controller_1 = require("./payments.controller");
const payments_service_1 = require("./payments.service");
const school_payment_schema_1 = require("./schemas/school-payment.schema");
const transaction_schema_1 = require("./schemas/transaction.schema");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            mongoose_1.MongooseModule.forFeature([
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
                { name: school_payment_schema_1.SchoolPayment.name, schema: school_payment_schema_1.SchoolPaymentSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: savings_account_schema_1.SavingsAccount.name, schema: savings_account_schema_1.SavingsAccountSchema },
            ]),
        ],
        controllers: [payments_controller_1.PaymentsController],
        providers: [
            payments_service_1.PaymentsService,
            payment_notification_service_1.PaymentNotificationService,
            {
                provide: payment_notification_port_1.PAYMENT_NOTIFICATION_PORT,
                useExisting: payment_notification_service_1.PaymentNotificationService,
            },
        ],
        exports: [payments_service_1.PaymentsService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map