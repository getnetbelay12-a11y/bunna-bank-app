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
exports.InsurancePolicySchema = exports.InsurancePolicy = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let InsurancePolicy = class InsurancePolicy {
};
exports.InsurancePolicy = InsurancePolicy;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], InsurancePolicy.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, unique: true, index: true }),
    __metadata("design:type", String)
], InsurancePolicy.prototype, "policyNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], InsurancePolicy.prototype, "providerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], InsurancePolicy.prototype, "insuranceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Loan', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], InsurancePolicy.prototype, "linkedLoanId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], InsurancePolicy.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], InsurancePolicy.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.InsurancePolicyStatus, index: true }),
    __metadata("design:type", String)
], InsurancePolicy.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], InsurancePolicy.prototype, "renewalReminderSent", void 0);
exports.InsurancePolicy = InsurancePolicy = __decorate([
    (0, mongoose_1.Schema)({ collection: 'insurance_policies', timestamps: true, versionKey: false })
], InsurancePolicy);
exports.InsurancePolicySchema = mongoose_1.SchemaFactory.createForClass(InsurancePolicy);
exports.InsurancePolicySchema.index({ memberId: 1, status: 1, endDate: 1 });
exports.InsurancePolicySchema.index({ linkedLoanId: 1, status: 1 });
//# sourceMappingURL=insurance-policy.schema.js.map