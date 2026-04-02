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
var MongooseMemberAuthRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseMemberAuthRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const member_schema_1 = require("../../members/schemas/member.schema");
let MongooseMemberAuthRepository = MongooseMemberAuthRepository_1 = class MongooseMemberAuthRepository {
    constructor(memberModel) {
        this.memberModel = memberModel;
        this.logger = new common_1.Logger(MongooseMemberAuthRepository_1.name);
    }
    async findByCustomerId(customerId) {
        const normalized = customerId.trim();
        const normalizedUpper = normalized.toUpperCase();
        const normalizedPhone = normalizePhoneNumber(normalized);
        const phoneCandidates = Array.from(new Set([normalizedPhone, ...resolveDemoPhoneAliases(normalizedPhone)]));
        const query = {
            isActive: true,
            $or: [
                { phone: { $in: phoneCandidates } },
                { memberNumber: normalizedUpper },
                { customerId: normalizedUpper },
            ],
        };
        this.logger.log(`member lookup input=${customerId} normalized=${normalizedUpper} phones=${phoneCandidates.join(',')}`);
        const member = await this.memberModel
            .findOne(query)
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        if (!member) {
            this.logger.warn(`member lookup not found query=${JSON.stringify(query)}`);
            return null;
        }
        this.logger.log(`member lookup found _id=${member._id.toString()} customerId=${member.customerId ?? member.memberNumber} memberNumber=${member.memberNumber} phone=${member.phone}`);
        const branch = typeof member.branchId === 'string'
            ? { id: member.branchId, name: undefined }
            : {
                id: member.branchId?._id?.toString?.() ??
                    member.branchId?.toString?.(),
                name: member.branchId?.name,
            };
        const district = typeof member.districtId === 'string'
            ? { id: member.districtId, name: undefined }
            : {
                id: member.districtId?._id?.toString?.() ??
                    member.districtId?.toString?.(),
                name: member.districtId?.name,
            };
        return {
            id: member._id.toString(),
            customerId: member.customerId ?? member.memberNumber,
            role: member.role,
            passwordHash: member.passwordHash,
            memberType: member.memberType,
            fullName: member.fullName,
            memberNumber: member.memberNumber,
            phone: member.phone,
            branchId: branch.id,
            districtId: district.id,
            branchName: branch.name,
            districtName: district.name,
        };
    }
};
exports.MongooseMemberAuthRepository = MongooseMemberAuthRepository;
exports.MongooseMemberAuthRepository = MongooseMemberAuthRepository = MongooseMemberAuthRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseMemberAuthRepository);
function normalizePhoneNumber(value) {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
        return `0${digitsOnly.slice(3)}`;
    }
    if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
        return `0${digitsOnly}`;
    }
    return digitsOnly.length > 0 ? digitsOnly : value;
}
function resolveDemoPhoneAliases(phone) {
    if (phone === '0900000001') {
        return ['0911000001'];
    }
    return [];
}
//# sourceMappingURL=member-auth.repository.js.map