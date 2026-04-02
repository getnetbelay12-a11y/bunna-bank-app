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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const member_profiles_service_1 = require("../member-profiles/member-profiles.service");
const members_repository_1 = require("./members.repository");
let MembersService = class MembersService {
    constructor(membersRepository, auditService, memberProfilesService) {
        this.membersRepository = membersRepository;
        this.auditService = auditService;
        this.memberProfilesService = memberProfilesService;
    }
    async getMyProfile(currentUser) {
        this.ensureMemberPrincipal(currentUser);
        const member = await this.membersRepository.findById(currentUser.sub);
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);
        return {
            ...member,
            membershipStatus: profile?.membershipStatus ?? 'pending_verification',
            identityVerificationStatus: profile?.identityVerificationStatus ?? 'not_started',
        };
    }
    async updateMyProfile(currentUser, dto) {
        this.ensureMemberPrincipal(currentUser);
        const before = await this.membersRepository.findById(currentUser.sub);
        if (!before) {
            throw new common_1.NotFoundException('Member not found.');
        }
        const updated = await this.membersRepository.updateById(currentUser.sub, dto);
        await this.auditService.log({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: 'member_profile_updated',
            entityType: 'member',
            entityId: currentUser.sub,
            before: {
                fullName: before.fullName,
                email: before.email,
                phone: before.phone,
            },
            after: {
                fullName: updated.fullName,
                email: updated.email,
                phone: updated.phone,
            },
        });
        const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);
        return {
            ...updated,
            membershipStatus: profile?.membershipStatus ?? 'pending_verification',
            identityVerificationStatus: profile?.identityVerificationStatus ?? 'not_started',
        };
    }
    async getMemberById(currentUser, memberId) {
        this.ensureStaffAccess(currentUser);
        const member = await this.membersRepository.findById(memberId);
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        return member;
    }
    async createMember(currentUser, dto) {
        this.ensureStaffAccess(currentUser);
        const allowedRoles = new Set([enums_1.UserRole.MEMBER, enums_1.UserRole.SHAREHOLDER_MEMBER]);
        if (!allowedRoles.has(dto.role)) {
            throw new common_1.ConflictException('Members can only be created with member roles.');
        }
        const created = await this.membersRepository.create(dto);
        await this.auditService.log({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: 'member_created',
            entityType: 'member',
            entityId: created.id,
            before: null,
            after: {
                memberNumber: created.memberNumber,
                memberType: created.memberType,
                role: created.role,
                branchId: created.branchId,
                districtId: created.districtId,
            },
        });
        return created;
    }
    async listMembers(currentUser, query) {
        this.ensureStaffAccess(currentUser);
        return this.membersRepository.list(query);
    }
    ensureMemberPrincipal(currentUser) {
        if (currentUser.role !== enums_1.UserRole.MEMBER &&
            currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only members can access this resource.');
        }
    }
    ensureStaffAccess(currentUser) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only staff users can access this resource.');
        }
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [members_repository_1.MembersRepository,
        audit_service_1.AuditService,
        member_profiles_service_1.MemberProfilesService])
], MembersService);
//# sourceMappingURL=members.service.js.map