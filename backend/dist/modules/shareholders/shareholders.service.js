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
exports.ShareholdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const member_schema_1 = require("../members/schemas/member.schema");
let ShareholdersService = class ShareholdersService {
    constructor(memberModel) {
        this.memberModel = memberModel;
    }
    async getMyShareholderProfile(currentUser) {
        this.ensureShareholderPrincipal(currentUser);
        const member = await this.findShareholderById(currentUser.sub);
        if (!member) {
            throw new common_1.NotFoundException('Shareholder not found.');
        }
        return member;
    }
    async getMyVotingEligibility(currentUser) {
        this.ensureShareholderPrincipal(currentUser);
        const member = await this.findShareholderById(currentUser.sub);
        if (!member) {
            throw new common_1.NotFoundException('Shareholder not found.');
        }
        return this.buildEligibility(member);
    }
    async getShareholderById(currentUser, memberId) {
        this.ensureStaffAccess(currentUser);
        const member = await this.findShareholderById(memberId);
        if (!member) {
            throw new common_1.NotFoundException('Shareholder not found.');
        }
        return member;
    }
    async getVotingEligibilityByMemberId(currentUser, memberId) {
        this.ensureStaffAccess(currentUser);
        const member = await this.findShareholderById(memberId);
        if (!member) {
            throw new common_1.NotFoundException('Shareholder not found.');
        }
        return this.buildEligibility(member);
    }
    findShareholderById(memberId) {
        return this.memberModel
            .findOne({
            _id: memberId,
            memberType: enums_1.MemberType.SHAREHOLDER,
            role: enums_1.UserRole.SHAREHOLDER_MEMBER,
        })
            .lean()
            .exec();
    }
    buildEligibility(member) {
        const isShareholder = member.memberType === enums_1.MemberType.SHAREHOLDER &&
            member.role === enums_1.UserRole.SHAREHOLDER_MEMBER;
        const canVote = isShareholder && member.isActive && member.shareBalance > 0;
        let reason = 'Eligible for annual shareholder voting.';
        if (!isShareholder) {
            reason = 'Member is not registered as a shareholder.';
        }
        else if (!member.isActive) {
            reason = 'Shareholder account is inactive.';
        }
        else if (member.shareBalance <= 0) {
            reason = 'Shareholder has no voting-eligible share balance.';
        }
        return {
            memberId: member._id,
            isShareholder,
            canVote,
            isActive: member.isActive,
            shareBalance: member.shareBalance,
            reason,
        };
    }
    ensureShareholderPrincipal(currentUser) {
        if (currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only shareholder members can access this resource.');
        }
    }
    ensureStaffAccess(currentUser) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only staff users can access this resource.');
        }
    }
};
exports.ShareholdersService = ShareholdersService;
exports.ShareholdersService = ShareholdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ShareholdersService);
//# sourceMappingURL=shareholders.service.js.map