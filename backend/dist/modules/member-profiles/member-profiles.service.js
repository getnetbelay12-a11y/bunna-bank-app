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
exports.MemberProfilesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const member_profile_schema_1 = require("./schemas/member-profile.schema");
let MemberProfilesService = class MemberProfilesService {
    constructor(memberProfileModel) {
        this.memberProfileModel = memberProfileModel;
    }
    async create(dto) {
        return this.memberProfileModel.create({
            memberId: new mongoose_2.Types.ObjectId(dto.memberId),
            dateOfBirth: dto.dateOfBirth,
            branchId: new mongoose_2.Types.ObjectId(dto.branchId),
            districtId: new mongoose_2.Types.ObjectId(dto.districtId),
            consentAccepted: dto.consentAccepted,
            membershipStatus: dto.membershipStatus ?? 'pending_verification',
            identityVerificationStatus: dto.identityVerificationStatus ?? 'not_started',
        });
    }
    async findByMemberId(memberId) {
        return this.memberProfileModel
            .findOne({ memberId: new mongoose_2.Types.ObjectId(memberId) })
            .lean();
    }
    async updateStatuses(memberId, input) {
        return this.memberProfileModel.findOneAndUpdate({ memberId: new mongoose_2.Types.ObjectId(memberId) }, { $set: input }, { new: true, upsert: false });
    }
};
exports.MemberProfilesService = MemberProfilesService;
exports.MemberProfilesService = MemberProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_profile_schema_1.MemberProfileEntity.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MemberProfilesService);
//# sourceMappingURL=member-profiles.service.js.map