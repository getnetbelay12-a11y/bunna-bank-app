"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const insurance_alert_service_1 = require("./insurance-alert.service");
const insurance_controller_1 = require("./insurance.controller");
const insurance_policy_service_1 = require("./insurance-policy.service");
const insurance_policy_schema_1 = require("./schemas/insurance-policy.schema");
const loan_insurance_link_schema_1 = require("./schemas/loan-insurance-link.schema");
let InsuranceModule = class InsuranceModule {
};
exports.InsuranceModule = InsuranceModule;
exports.InsuranceModule = InsuranceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: loan_schema_1.Loan.name, schema: loan_schema_1.LoanSchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: insurance_policy_schema_1.InsurancePolicy.name, schema: insurance_policy_schema_1.InsurancePolicySchema },
                { name: loan_insurance_link_schema_1.LoanInsuranceLink.name, schema: loan_insurance_link_schema_1.LoanInsuranceLinkSchema },
            ]),
        ],
        controllers: [insurance_controller_1.InsuranceController],
        providers: [insurance_alert_service_1.InsuranceAlertService, insurance_policy_service_1.InsurancePolicyService],
        exports: [insurance_alert_service_1.InsuranceAlertService, insurance_policy_service_1.InsurancePolicyService, mongoose_1.MongooseModule],
    })
], InsuranceModule);
//# sourceMappingURL=insurance.module.js.map