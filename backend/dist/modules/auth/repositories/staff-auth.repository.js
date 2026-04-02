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
exports.MongooseStaffAuthRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const staff_schema_1 = require("../../staff/schemas/staff.schema");
let MongooseStaffAuthRepository = class MongooseStaffAuthRepository {
    constructor(staffModel) {
        this.staffModel = staffModel;
    }
    async findByIdentifier(identifier) {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        const aliasTargets = this.resolveDemoAliases(normalizedIdentifier);
        if (aliasTargets.length > 0) {
            const aliasedStaff = await this.findFirstMatchingStaff(aliasTargets);
            if (aliasedStaff) {
                return aliasedStaff;
            }
        }
        const lookupValues = Array.from(new Set([identifier.trim(), normalizedIdentifier]));
        return this.findFirstMatchingStaff(lookupValues, identifier.trim());
    }
    async findFirstMatchingStaff(lookupValues, staffNumber) {
        const staff = await this.staffModel
            .findOne({
            isActive: true,
            $or: [
                { identifier: { $in: lookupValues } },
                { email: { $in: lookupValues } },
                ...(staffNumber ? [{ staffNumber }] : []),
            ],
        })
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        if (!staff) {
            return null;
        }
        const branch = typeof staff.branchId === 'string'
            ? { id: staff.branchId, name: undefined }
            : {
                id: staff.branchId?._id?.toString?.() ??
                    staff.branchId
                        ?.toString?.(),
                name: staff.branchId?.name,
            };
        const district = typeof staff.districtId === 'string'
            ? { id: staff.districtId, name: undefined }
            : {
                id: staff.districtId?._id?.toString?.() ??
                    staff.districtId
                        ?.toString?.(),
                name: staff.districtId?.name,
            };
        return {
            id: staff._id.toString(),
            role: staff.role,
            passwordHash: staff.passwordHash,
            identifier: staff.identifier,
            email: staff.email,
            fullName: staff.fullName,
            staffNumber: staff.staffNumber,
            phone: staff.phone,
            branchId: branch.id,
            districtId: district.id,
            branchName: branch.name,
            districtName: district.name,
        };
    }
    resolveDemoAliases(identifier) {
        const headOfficeAliases = new Set([
            'admin',
            'head_office',
            'head-office',
            'head office',
            'headoffice',
        ]);
        if (!headOfficeAliases.has(identifier)) {
            return [];
        }
        return ['admin@bunna.local'];
    }
};
exports.MongooseStaffAuthRepository = MongooseStaffAuthRepository;
exports.MongooseStaffAuthRepository = MongooseStaffAuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseStaffAuthRepository);
//# sourceMappingURL=staff-auth.repository.js.map