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
exports.InsurancePolicyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const insurance_policy_schema_1 = require("./schemas/insurance-policy.schema");
let InsurancePolicyService = class InsurancePolicyService {
    constructor(insurancePolicyModel) {
        this.insurancePolicyModel = insurancePolicyModel;
    }
    async listPoliciesForMembers(memberIds) {
        if (memberIds.length === 0) {
            return [];
        }
        return this.insurancePolicyModel
            .find({ memberId: { $in: memberIds } })
            .sort({ endDate: 1 })
            .lean();
    }
    async markReminderSent(policyId) {
        await this.insurancePolicyModel.updateOne({ _id: policyId }, { $set: { renewalReminderSent: true } });
    }
    resolvePolicyStatus(endDate, now = new Date()) {
        if (endDate.getTime() < now.getTime()) {
            return enums_1.InsurancePolicyStatus.EXPIRED;
        }
        const dayDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 30) {
            return enums_1.InsurancePolicyStatus.EXPIRING;
        }
        return enums_1.InsurancePolicyStatus.ACTIVE;
    }
};
exports.InsurancePolicyService = InsurancePolicyService;
exports.InsurancePolicyService = InsurancePolicyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(insurance_policy_schema_1.InsurancePolicy.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], InsurancePolicyService);
//# sourceMappingURL=insurance-policy.service.js.map