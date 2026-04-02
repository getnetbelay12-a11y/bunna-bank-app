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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const staff_schema_1 = require("./schemas/staff.schema");
let StaffService = class StaffService {
    constructor(staffModel) {
        this.staffModel = staffModel;
    }
    async getMyProfile(currentUser) {
        this.ensureStaffPrincipal(currentUser);
        const staff = await this.findVisibleStaffById(currentUser, currentUser.sub);
        if (!staff) {
            throw new common_1.NotFoundException('Staff profile not found.');
        }
        return staff;
    }
    async getStaffById(currentUser, staffId) {
        this.ensureStaffPrincipal(currentUser);
        const staff = await this.findVisibleStaffById(currentUser, staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found.');
        }
        return staff;
    }
    async listStaff(currentUser, query) {
        this.ensureStaffPrincipal(currentUser);
        const match = this.buildScopeFilter(currentUser);
        if (query.role) {
            match.role = query.role;
        }
        if (query.isActive !== undefined) {
            match.isActive = query.isActive === 'true';
        }
        if (query.branchId) {
            match.branchId = this.visibleBranchId(currentUser, query.branchId);
        }
        if (query.districtId) {
            match.districtId = this.visibleDistrictId(currentUser, query.districtId);
        }
        return this.staffModel
            .find(match)
            .sort({ role: 1, fullName: 1 })
            .lean()
            .exec();
    }
    async getBranchStaff(currentUser, branchId) {
        this.ensureStaffPrincipal(currentUser);
        return this.staffModel
            .find({
            ...this.buildScopeFilter(currentUser),
            branchId: this.visibleBranchId(currentUser, branchId),
        })
            .sort({ role: 1, fullName: 1 })
            .lean()
            .exec();
    }
    async getDistrictStaff(currentUser, districtId) {
        this.ensureStaffPrincipal(currentUser);
        return this.staffModel
            .find({
            ...this.buildScopeFilter(currentUser),
            districtId: this.visibleDistrictId(currentUser, districtId),
        })
            .sort({ role: 1, fullName: 1 })
            .lean()
            .exec();
    }
    findVisibleStaffById(currentUser, staffId) {
        return this.staffModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(staffId),
            ...this.buildScopeFilter(currentUser),
        })
            .lean()
            .exec();
    }
    buildScopeFilter(currentUser) {
        const filter = {};
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            filter.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if ((currentUser.role === enums_1.UserRole.DISTRICT_OFFICER ||
            currentUser.role === enums_1.UserRole.DISTRICT_MANAGER) &&
            currentUser.districtId) {
            filter.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        return filter;
    }
    visibleBranchId(currentUser, branchId) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER &&
            currentUser.branchId &&
            currentUser.branchId !== branchId) {
            throw new common_1.ForbiddenException('Cannot access staff outside your branch.');
        }
        return new mongoose_2.Types.ObjectId(branchId);
    }
    visibleDistrictId(currentUser, districtId) {
        if ((currentUser.role === enums_1.UserRole.DISTRICT_OFFICER ||
            currentUser.role === enums_1.UserRole.DISTRICT_MANAGER) &&
            currentUser.districtId &&
            currentUser.districtId !== districtId) {
            throw new common_1.ForbiddenException('Cannot access staff outside your district.');
        }
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER &&
            currentUser.districtId &&
            currentUser.districtId !== districtId) {
            throw new common_1.ForbiddenException('Cannot access staff outside your district.');
        }
        return new mongoose_2.Types.ObjectId(districtId);
    }
    ensureStaffPrincipal(currentUser) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only staff users can access this resource.');
        }
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], StaffService);
//# sourceMappingURL=staff.service.js.map