"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const member_profiles_module_1 = require("../member-profiles/member-profiles.module");
const branch_schema_1 = require("./schemas/branch.schema");
const district_schema_1 = require("./schemas/district.schema");
const member_schema_1 = require("./schemas/member.schema");
const members_controller_1 = require("./members.controller");
const members_repository_1 = require("./members.repository");
const members_service_1 = require("./members.service");
let MembersModule = class MembersModule {
};
exports.MembersModule = MembersModule;
exports.MembersModule = MembersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            member_profiles_module_1.MemberProfilesModule,
            mongoose_1.MongooseModule.forFeature([
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: branch_schema_1.Branch.name, schema: branch_schema_1.BranchSchema },
                { name: district_schema_1.District.name, schema: district_schema_1.DistrictSchema },
            ]),
        ],
        controllers: [members_controller_1.MembersController],
        providers: [members_repository_1.MembersRepository, members_service_1.MembersService],
        exports: [members_service_1.MembersService],
    })
], MembersModule);
//# sourceMappingURL=members.module.js.map