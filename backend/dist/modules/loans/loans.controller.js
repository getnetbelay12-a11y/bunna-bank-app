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
exports.LoansController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const loans_service_1 = require("./loans.service");
let LoansController = class LoansController {
    constructor(loansService) {
        this.loansService = loansService;
    }
    submitLoanApplication(currentUser, dto) {
        return this.loansService.submitLoanApplication(currentUser, dto);
    }
    attachLoanDocument(currentUser, loanId, dto) {
        return this.loansService.attachLoanDocument(currentUser, loanId, dto);
    }
    getMyLoans(currentUser) {
        return this.loansService.getMyLoans(currentUser);
    }
    getLoanDetail(currentUser, loanId) {
        return this.loansService.getLoanDetail(currentUser, loanId);
    }
    getLoanTimeline(loanId) {
        return {
            loanId,
            timeline: [
                { status: 'submitted', title: 'Submitted' },
                { status: 'branch_review', title: 'Branch Review' },
                { status: 'district_review', title: 'District Review' },
                { status: 'head_office_review', title: 'Head Office Review' },
                { status: 'approved', title: 'Approved' },
                { status: 'rejected', title: 'Rejected' },
                { status: 'disbursed', title: 'Disbursed' },
            ],
        };
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateLoanApplicationDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "submitLoanApplication", null);
__decorate([
    (0, common_1.Post)(':loanId/documents'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AttachLoanDocumentDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "attachLoanDocument", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getMyLoans", null);
__decorate([
    (0, common_1.Get)(':loanId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getLoanDetail", null);
__decorate([
    (0, common_1.Get)(':loanId/timeline'),
    __param(0, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getLoanTimeline", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, common_1.Controller)('loans'),
    __metadata("design:paramtypes", [loans_service_1.LoansService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map