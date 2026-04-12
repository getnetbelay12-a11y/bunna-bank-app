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
exports.MembersRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const member_schema_1 = require("./schemas/member.schema");
let MembersRepository = class MembersRepository {
    constructor(memberModel) {
        this.memberModel = memberModel;
    }
    async findById(id) {
        const member = await this.memberModel
            .findById(id)
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        return member ? this.toProfile(member) : null;
    }
    async findByCustomerId(customerId) {
        const normalized = customerId.trim();
        if (!normalized) {
            return null;
        }
        const member = await this.memberModel
            .findOne({
            $or: [
                { customerId: normalized },
                { customerId: normalized.toUpperCase() },
                { memberNumber: normalized },
                { memberNumber: normalized.toUpperCase() },
            ],
        })
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        return member ? this.toProfile(member) : null;
    }
    async updateById(id, dto) {
        const member = await this.memberModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, lean: true, runValidators: true })
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        return this.toProfile(member);
    }
    async create(dto) {
        const member = await this.memberModel.create({
            ...dto,
            passwordHash: dto.password,
            isActive: true,
        });
        const created = await this.memberModel
            .findById(member._id)
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        if (!created) {
            throw new common_1.NotFoundException('Member not found.');
        }
        return this.toProfile(created);
    }
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const filter = {};
        if (query.memberType) {
            filter.memberType = query.memberType;
        }
        if (query.role) {
            filter.role = query.role;
        }
        if (query.branchId) {
            filter.branchId = query.branchId;
        }
        if (query.districtId) {
            filter.districtId = query.districtId;
        }
        if (typeof query.isActive === 'boolean') {
            filter.isActive = query.isActive;
        }
        if (query.search) {
            filter.$or = [
                { fullName: { $regex: query.search, $options: 'i' } },
                { customerId: { $regex: query.search, $options: 'i' } },
                { memberNumber: { $regex: query.search, $options: 'i' } },
                { phone: { $regex: query.search, $options: 'i' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.memberModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({ path: 'branchId', select: 'name' })
                .populate({ path: 'districtId', select: 'name' })
                .lean(),
            this.memberModel.countDocuments(filter),
        ]);
        return {
            items: items.map((item) => this.toProfile(item)),
            total,
            page,
            limit,
        };
    }
    toProfile(member) {
        const branchValue = member.branchId;
        const districtValue = member.districtId;
        return {
            ...member,
            id: member.id ?? member._id?.toString?.() ?? '',
            customerId: member.customerId,
            branchId: typeof branchValue === 'string'
                ? branchValue
                : branchValue._id?.toString?.() ?? branchValue.toString(),
            branchName: typeof branchValue === 'string' ? undefined : branchValue.name,
            districtId: typeof districtValue === 'string'
                ? districtValue
                : districtValue._id?.toString?.() ?? districtValue.toString(),
            districtName: typeof districtValue === 'string' ? undefined : districtValue.name,
        };
    }
};
exports.MembersRepository = MembersRepository;
exports.MembersRepository = MembersRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MembersRepository);
//# sourceMappingURL=members.repository.js.map