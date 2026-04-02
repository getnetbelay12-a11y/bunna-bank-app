"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanWorkflowController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const loan_workflow_service_1 = require("./loan-workflow.service");
let LoanWorkflowController = class LoanWorkflowController {
    constructor(loanWorkflowService) {
        this.loanWorkflowService = loanWorkflowService;
    }
    processAction(currentUser, loanId, dto) {
        return this.loanWorkflowService.processAction(currentUser, loanId, dto);
    }
};
exports.LoanWorkflowController = LoanWorkflowController;
__decorate([
    (0, common_1.Patch)(':loanId/action'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ProcessLoanActionDto]),
    __metadata("design:returntype", void 0)
], LoanWorkflowController.prototype, "processAction", null);
exports.LoanWorkflowController = LoanWorkflowController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Controller)('loan-workflow'),
    __metadata("design:paramtypes", [loan_workflow_service_1.LoanWorkflowService])
], LoanWorkflowController);
//# sourceMappingURL=loan-workflow.controller.js.map