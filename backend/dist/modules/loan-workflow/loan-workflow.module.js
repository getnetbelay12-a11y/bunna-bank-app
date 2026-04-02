"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanWorkflowModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const staff_activity_log_schema_1 = require("../staff-activity/schemas/staff-activity-log.schema");
const loan_workflow_controller_1 = require("./loan-workflow.controller");
const loan_workflow_service_1 = require("./loan-workflow.service");
const loan_workflow_history_schema_1 = require("./schemas/loan-workflow-history.schema");
let LoanWorkflowModule = class LoanWorkflowModule {
};
exports.LoanWorkflowModule = LoanWorkflowModule;
exports.LoanWorkflowModule = LoanWorkflowModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            mongoose_1.MongooseModule.forFeature([
                { name: loan_schema_1.Loan.name, schema: loan_schema_1.LoanSchema },
                { name: loan_workflow_history_schema_1.LoanWorkflowHistory.name, schema: loan_workflow_history_schema_1.LoanWorkflowHistorySchema },
                { name: staff_activity_log_schema_1.StaffActivityLog.name, schema: staff_activity_log_schema_1.StaffActivityLogSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
            ]),
        ],
        controllers: [loan_workflow_controller_1.LoanWorkflowController],
        providers: [loan_workflow_service_1.LoanWorkflowService],
        exports: [loan_workflow_service_1.LoanWorkflowService],
    })
], LoanWorkflowModule);
//# sourceMappingURL=loan-workflow.module.js.map