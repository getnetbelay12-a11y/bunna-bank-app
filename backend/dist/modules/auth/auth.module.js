"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const identity_verification_module_1 = require("../identity-verification/identity-verification.module");
const member_profiles_module_1 = require("../member-profiles/member-profiles.module");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const staff_schema_1 = require("../staff/schemas/staff.schema");
const auth_constants_1 = require("./auth.constants");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const member_auth_repository_1 = require("./repositories/member-auth.repository");
const staff_auth_repository_1 = require("./repositories/staff-auth.repository");
const auth_session_schema_1 = require("./schemas/auth-session.schema");
const device_schema_1 = require("./schemas/device.schema");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            member_profiles_module_1.MemberProfilesModule,
            identity_verification_module_1.IdentityVerificationModule,
            mongoose_1.MongooseModule.forFeature([
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: staff_schema_1.Staff.name, schema: staff_schema_1.StaffSchema },
                { name: branch_schema_1.Branch.name, schema: branch_schema_1.BranchSchema },
                { name: district_schema_1.District.name, schema: district_schema_1.DistrictSchema },
                { name: auth_session_schema_1.AuthSession.name, schema: auth_session_schema_1.AuthSessionSchema },
                { name: device_schema_1.Device.name, schema: device_schema_1.DeviceSchema },
            ]),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const auth = configService.getOrThrow('auth');
                    return {
                        secret: auth.jwtSecret,
                        signOptions: {
                            issuer: auth.jwtIssuer,
                            audience: auth.jwtAudience,
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            member_auth_repository_1.MongooseMemberAuthRepository,
            staff_auth_repository_1.MongooseStaffAuthRepository,
            {
                provide: auth_constants_1.MEMBER_AUTH_REPOSITORY,
                useExisting: member_auth_repository_1.MongooseMemberAuthRepository,
            },
            {
                provide: auth_constants_1.STAFF_AUTH_REPOSITORY,
                useExisting: staff_auth_repository_1.MongooseStaffAuthRepository,
            },
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map