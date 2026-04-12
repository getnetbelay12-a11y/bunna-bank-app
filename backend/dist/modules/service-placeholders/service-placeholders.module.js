"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePlaceholdersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const member_schema_1 = require("../members/schemas/member.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const service_placeholders_controller_1 = require("./service-placeholders.controller");
const account_member_request_schema_1 = require("./schemas/account-member-request.schema");
const atm_card_request_schema_1 = require("./schemas/atm-card-request.schema");
const autopay_setting_schema_1 = require("./schemas/autopay-setting.schema");
const member_security_setting_schema_1 = require("./schemas/member-security-setting.schema");
const phone_update_request_schema_1 = require("./schemas/phone-update-request.schema");
const selfie_verification_schema_1 = require("./schemas/selfie-verification.schema");
const service_placeholders_service_1 = require("./service-placeholders.service");
let ServicePlaceholdersModule = class ServicePlaceholdersModule {
};
exports.ServicePlaceholdersModule = ServicePlaceholdersModule;
exports.ServicePlaceholdersModule = ServicePlaceholdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: autopay_setting_schema_1.AutopaySetting.name, schema: autopay_setting_schema_1.AutopaySettingSchema },
                { name: member_security_setting_schema_1.MemberSecuritySetting.name, schema: member_security_setting_schema_1.MemberSecuritySettingSchema },
                { name: atm_card_request_schema_1.AtmCardRequest.name, schema: atm_card_request_schema_1.AtmCardRequestSchema },
                { name: phone_update_request_schema_1.PhoneUpdateRequest.name, schema: phone_update_request_schema_1.PhoneUpdateRequestSchema },
                { name: account_member_request_schema_1.AccountMemberRequest.name, schema: account_member_request_schema_1.AccountMemberRequestSchema },
                { name: selfie_verification_schema_1.SelfieVerification.name, schema: selfie_verification_schema_1.SelfieVerificationSchema },
            ]),
        ],
        controllers: [service_placeholders_controller_1.ServicePlaceholdersController],
        providers: [service_placeholders_service_1.ServicePlaceholdersService],
    })
], ServicePlaceholdersModule);
//# sourceMappingURL=service-placeholders.module.js.map