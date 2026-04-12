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
exports.LoanSchema = exports.Loan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let Loan = class Loan {
};
exports.Loan = Loan;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Loan.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Loan.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Loan.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Loan.prototype, "loanType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, index: true }),
    __metadata("design:type", Number)
], Loan.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Loan.prototype, "interestRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], Loan.prototype, "termMonths", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Loan.prototype, "purpose", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanStatus, index: true }),
    __metadata("design:type", String)
], Loan.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.LoanWorkflowLevel, index: true }),
    __metadata("design:type", String)
], Loan.prototype, "currentLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Loan.prototype, "assignedToStaffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Loan.prototype, "deficiencyReasons", void 0);
exports.Loan = Loan = __decorate([
    (0, mongoose_1.Schema)({ collection: 'loans', timestamps: true, versionKey: false })
], Loan);
exports.LoanSchema = mongoose_1.SchemaFactory.createForClass(Loan);
exports.LoanSchema.index({ memberId: 1, createdAt: -1 });
exports.LoanSchema.index({ branchId: 1, status: 1, currentLevel: 1, createdAt: -1 });
exports.LoanSchema.index({ districtId: 1, status: 1, currentLevel: 1, createdAt: -1 });
exports.LoanSchema.index({ status: 1, currentLevel: 1, branchId: 1 });
exports.LoanSchema.index({ status: 1, currentLevel: 1, districtId: 1 });
//# sourceMappingURL=loan.schema.js.map