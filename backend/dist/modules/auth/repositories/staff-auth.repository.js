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
const enums_1 = require("../../../common/enums");
const staff_schema_1 = require("../../staff/schemas/staff.schema");
const staff_permissions_1 = require("../../staff/staff-permissions");
const DEMO_SCHOOL_IDENTIFIER = 'admin@bluenileacademy.school';
let MongooseStaffAuthRepository = class MongooseStaffAuthRepository {
    constructor(staffModel) {
        this.staffModel = staffModel;
    }
    async findByIdentifier(identifier) {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        if (normalizedIdentifier === DEMO_SCHOOL_IDENTIFIER) {
            return {
                id: 'school_admin_blue_nile',
                role: enums_1.UserRole.SCHOOL_ADMIN,
                passwordHash: 'demo-pass',
                identifier: DEMO_SCHOOL_IDENTIFIER,
                email: DEMO_SCHOOL_IDENTIFIER,
                fullName: 'Meron Fenta',
                staffNumber: 'SCH-0001',
                phone: '0911223344',
                schoolId: 'school_blue_nile',
                schoolName: 'Blue Nile Academy',
                branchName: 'Bahir Dar Branch',
                permissions: (0, staff_permissions_1.deriveStaffPermissions)(enums_1.UserRole.SCHOOL_ADMIN),
            };
        }
        const staff = await this.staffModel
            .findOne({ identifier, isActive: true })
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
            schoolId: undefined,
            schoolName: undefined,
            branchId: branch.id,
            districtId: district.id,
            branchName: branch.name,
            districtName: district.name,
            permissions: staff.permissions?.length != null && staff.permissions.length > 0
                ? staff.permissions
                : (0, staff_permissions_1.deriveStaffPermissions)(staff.role),
        };
    }
};
exports.MongooseStaffAuthRepository = MongooseStaffAuthRepository;
exports.MongooseStaffAuthRepository = MongooseStaffAuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseStaffAuthRepository);
//# sourceMappingURL=staff-auth.repository.js.map