"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const member_profiles_module_1 = require("../member-profiles/member-profiles.module");
const identity_verification_controller_1 = require("./identity-verification.controller");
const identity_verification_service_1 = require("./identity-verification.service");
const official_fayda_provider_1 = require("./providers/official-fayda.provider");
const manual_review_fayda_provider_1 = require("./providers/manual-review-fayda.provider");
const identity_verification_schema_1 = require("./schemas/identity-verification.schema");
let IdentityVerificationModule = class IdentityVerificationModule {
};
exports.IdentityVerificationModule = IdentityVerificationModule;
exports.IdentityVerificationModule = IdentityVerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: identity_verification_schema_1.IdentityVerification.name, schema: identity_verification_schema_1.IdentityVerificationSchema },
            ]),
            member_profiles_module_1.MemberProfilesModule,
        ],
        controllers: [identity_verification_controller_1.IdentityVerificationController],
        providers: [
            identity_verification_service_1.IdentityVerificationService,
            official_fayda_provider_1.OfficialFaydaVerificationProvider,
            manual_review_fayda_provider_1.ManualReviewFaydaVerificationProvider,
            {
                provide: identity_verification_service_1.FAYDA_VERIFICATION_PROVIDER,
                inject: [
                    config_1.ConfigService,
                    official_fayda_provider_1.OfficialFaydaVerificationProvider,
                    manual_review_fayda_provider_1.ManualReviewFaydaVerificationProvider,
                ],
                useFactory: (configService, officialProvider, manualProvider) => {
                    return configService.get('FAYDA_PROVIDER_MODE') === 'official'
                        ? officialProvider
                        : manualProvider;
                },
            },
        ],
        exports: [identity_verification_service_1.IdentityVerificationService, identity_verification_service_1.FAYDA_VERIFICATION_PROVIDER],
    })
], IdentityVerificationModule);
//# sourceMappingURL=identity-verification.module.js.map