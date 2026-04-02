"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const member_profile_schema_1 = require("./schemas/member-profile.schema");
const member_profiles_service_1 = require("./member-profiles.service");
let MemberProfilesModule = class MemberProfilesModule {
};
exports.MemberProfilesModule = MemberProfilesModule;
exports.MemberProfilesModule = MemberProfilesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: member_profile_schema_1.MemberProfileEntity.name, schema: member_profile_schema_1.MemberProfileSchema },
            ]),
        ],
        providers: [member_profiles_service_1.MemberProfilesService],
        exports: [member_profiles_service_1.MemberProfilesService],
    })
], MemberProfilesModule);
//# sourceMappingURL=member-profiles.module.js.map