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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanWorkflowHistorySchema = exports.LoanWorkflowHistory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let LoanWorkflowHistory = class LoanWorkflowHistory {
};
exports.LoanWorkflowHistory = LoanWorkflowHistory;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Loan', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanWorkflowHistory.prototype, "loanId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanAction, index: true }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanWorkflowLevel, index: true }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "level", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanStatus, index: true }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanStatus, index: true }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "toStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanWorkflowHistory.prototype, "actorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: enums_1.UserRole }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "actorRole", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoanWorkflowHistory.prototype, "comment", void 0);
exports.LoanWorkflowHistory = LoanWorkflowHistory = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'loan_workflow_history',
        timestamps: true,
        versionKey: false,
    })
], LoanWorkflowHistory);
exports.LoanWorkflowHistorySchema = mongoose_1.SchemaFactory.createForClass(LoanWorkflowHistory);
exports.LoanWorkflowHistorySchema.index({ loanId: 1, createdAt: 1 });
//# sourceMappingURL=loan-workflow-history.schema.js.map