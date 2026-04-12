"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const storage_service_1 = require("../../common/storage/storage.service");
const audit_module_1 = require("../audit/audit.module");
const loan_workflow_history_schema_1 = require("../loan-workflow/schemas/loan-workflow-history.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const loan_document_schema_1 = require("./schemas/loan-document.schema");
const loan_schema_1 = require("./schemas/loan.schema");
const loans_controller_1 = require("./loans.controller");
const loans_service_1 = require("./loans.service");
let LoansModule = class LoansModule {
};
exports.LoansModule = LoansModule;
exports.LoansModule = LoansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: loan_schema_1.Loan.name, schema: loan_schema_1.LoanSchema },
                { name: loan_document_schema_1.LoanDocumentMetadata.name, schema: loan_document_schema_1.LoanDocumentMetadataSchema },
                { name: loan_workflow_history_schema_1.LoanWorkflowHistory.name, schema: loan_workflow_history_schema_1.LoanWorkflowHistorySchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
            ]),
        ],
        controllers: [loans_controller_1.LoansController],
        providers: [loans_service_1.LoansService, storage_service_1.StorageService],
        exports: [loans_service_1.LoansService],
    })
], LoansModule);
//# sourceMappingURL=loans.module.js.map