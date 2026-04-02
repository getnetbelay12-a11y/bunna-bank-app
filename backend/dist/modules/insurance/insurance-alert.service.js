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
exports.InsuranceAlertService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const insurance_policy_schema_1 = require("./schemas/insurance-policy.schema");
const loan_insurance_link_schema_1 = require("./schemas/loan-insurance-link.schema");
let InsuranceAlertService = class InsuranceAlertService {
    constructor(loanModel, memberModel, insurancePolicyModel, loanInsuranceLinkModel) {
        this.loanModel = loanModel;
        this.memberModel = memberModel;
        this.insurancePolicyModel = insurancePolicyModel;
        this.loanInsuranceLinkModel = loanInsuranceLinkModel;
        this.expiringThirtyDaysWindow = 30;
        this.expiringSevenDaysWindow = 7;
    }
    async getAlerts(currentUser) {
        this.ensureManagerAccess(currentUser);
        const scopedLoans = await this.loanModel
            .find({
            ...this.buildScope(currentUser),
            status: {
                $in: [
                    enums_1.LoanStatus.SUBMITTED,
                    enums_1.LoanStatus.BRANCH_REVIEW,
                    enums_1.LoanStatus.DISTRICT_REVIEW,
                    enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
                    enums_1.LoanStatus.APPROVED,
                    enums_1.LoanStatus.DISBURSED,
                ],
            },
        });
        if (scopedLoans.length === 0) {
            return [];
        }
        const memberIds = [...new Set(scopedLoans.map((loan) => loan.memberId.toString()))].map((id) => new mongoose_2.Types.ObjectId(id));
        const loanIds = scopedLoans.map((loan) => loan._id);
        const [members, links, policies] = await Promise.all([
            this.memberModel.find({ _id: { $in: memberIds } }),
            this.loanInsuranceLinkModel.find({ loanId: { $in: loanIds } }),
            this.insurancePolicyModel
                .find({
                $or: [{ linkedLoanId: { $in: loanIds } }, { memberId: { $in: memberIds } }],
            }),
        ]);
        const memberMap = new Map(members.map((member) => [member._id.toString(), member]));
        const linksByLoanId = new Map();
        for (const link of links) {
            const key = link.loanId.toString();
            const group = linksByLoanId.get(key) ?? [];
            group.push(link);
            linksByLoanId.set(key, group);
        }
        const policiesById = new Map(policies.map((policy) => [policy._id.toString(), policy]));
        const policiesByLoanId = new Map();
        for (const policy of policies) {
            if (policy.linkedLoanId) {
                const key = policy.linkedLoanId.toString();
                const group = policiesByLoanId.get(key) ?? [];
                group.push(policy);
                policiesByLoanId.set(key, group);
            }
        }
        const now = new Date();
        const alerts = [];
        for (const loan of scopedLoans) {
            const member = memberMap.get(loan.memberId.toString());
            if (!member) {
                continue;
            }
            const linkedPolicies = this.resolveLinkedPolicies(loan._id.toString(), linksByLoanId, policiesById, policiesByLoanId);
            if (linkedPolicies.length === 0) {
                alerts.push(this.buildAlert(loan, member, 'loan_without_linked_insurance'));
                continue;
            }
            const validPolicy = linkedPolicies.find((policy) => policy.endDate.getTime() >= now.getTime());
            if (!validPolicy) {
                const latestPolicy = linkedPolicies.sort((left, right) => right.endDate.getTime() - left.endDate.getTime())[0];
                alerts.push(this.buildAlert(loan, member, 'expired', latestPolicy, now));
                alerts.push(this.buildAlert(loan, member, 'loan_without_valid_insurance', latestPolicy, now));
                continue;
            }
            const daysUntilExpiry = Math.ceil((validPolicy.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= this.expiringSevenDaysWindow) {
                alerts.push(this.buildAlert(loan, member, 'expiring_7_days', validPolicy, now));
            }
            else if (daysUntilExpiry <= this.expiringThirtyDaysWindow) {
                alerts.push(this.buildAlert(loan, member, 'expiring_30_days', validPolicy, now));
            }
        }
        return alerts;
    }
    async getAlertsByType(currentUser, alertType) {
        const alerts = await this.getAlerts(currentUser);
        return alerts.filter((item) => item.alertType === alertType);
    }
    buildAlert(loan, member, alertType, policy, now = new Date()) {
        const daysUntilExpiry = policy?.endDate
            ? Math.ceil((policy.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : undefined;
        return {
            loanId: loan._id.toString(),
            memberId: member._id.toString(),
            customerId: member.customerId,
            memberName: member.fullName,
            branchId: member.branchId.toString(),
            districtId: member.districtId.toString(),
            policyId: policy?._id.toString(),
            policyNumber: policy?.policyNumber,
            providerName: policy?.providerName,
            insuranceType: policy?.insuranceType,
            alertType,
            endDate: policy?.endDate,
            daysUntilExpiry,
            requiresManagerAction: ['expired', 'loan_without_valid_insurance', 'loan_without_linked_insurance'].includes(alertType),
        };
    }
    resolveLinkedPolicies(loanId, linksByLoanId, policiesById, policiesByLoanId) {
        const linkedByJoin = (linksByLoanId.get(loanId) ?? [])
            .map((link) => policiesById.get(link.insurancePolicyId.toString()))
            .filter((policy) => Boolean(policy));
        if (linkedByJoin.length > 0) {
            return linkedByJoin;
        }
        return policiesByLoanId.get(loanId) ?? [];
    }
    ensureManagerAccess(currentUser) {
        if (![
            enums_1.UserRole.BRANCH_MANAGER,
            enums_1.UserRole.DISTRICT_MANAGER,
            enums_1.UserRole.DISTRICT_OFFICER,
            enums_1.UserRole.HEAD_OFFICE_MANAGER,
            enums_1.UserRole.HEAD_OFFICE_OFFICER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only managers can access insurance alerts.');
        }
    }
    buildScope(currentUser) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            return { branchId: new mongoose_2.Types.ObjectId(currentUser.branchId) };
        }
        if ([enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
            currentUser.districtId) {
            return { districtId: new mongoose_2.Types.ObjectId(currentUser.districtId) };
        }
        return {};
    }
};
exports.InsuranceAlertService = InsuranceAlertService;
exports.InsuranceAlertService = InsuranceAlertService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(2, (0, mongoose_1.InjectModel)(insurance_policy_schema_1.InsurancePolicy.name)),
    __param(3, (0, mongoose_1.InjectModel)(loan_insurance_link_schema_1.LoanInsuranceLink.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], InsuranceAlertService);
//# sourceMappingURL=insurance-alert.service.js.map