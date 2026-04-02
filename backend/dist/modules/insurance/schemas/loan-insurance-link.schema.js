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
exports.LoanInsuranceLinkSchema = exports.LoanInsuranceLink = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let LoanInsuranceLink = class LoanInsuranceLink {
};
exports.LoanInsuranceLink = LoanInsuranceLink;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Loan', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanInsuranceLink.prototype, "loanId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'InsurancePolicy', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanInsuranceLink.prototype, "insurancePolicyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanInsuranceLink.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], LoanInsuranceLink.prototype, "relationType", void 0);
exports.LoanInsuranceLink = LoanInsuranceLink = __decorate([
    (0, mongoose_1.Schema)({ collection: 'loan_insurance_links', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
], LoanInsuranceLink);
exports.LoanInsuranceLinkSchema = mongoose_1.SchemaFactory.createForClass(LoanInsuranceLink);
exports.LoanInsuranceLinkSchema.index({ loanId: 1, insurancePolicyId: 1 }, { unique: true });
exports.LoanInsuranceLinkSchema.index({ memberId: 1, createdAt: -1 });
//# sourceMappingURL=loan-insurance-link.schema.js.map