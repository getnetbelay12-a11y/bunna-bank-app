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
exports.ServicePlaceholdersService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const member_schema_1 = require("../members/schemas/member.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const account_member_request_schema_1 = require("./schemas/account-member-request.schema");
const atm_card_request_schema_1 = require("./schemas/atm-card-request.schema");
const autopay_setting_schema_1 = require("./schemas/autopay-setting.schema");
const member_security_setting_schema_1 = require("./schemas/member-security-setting.schema");
const phone_update_request_schema_1 = require("./schemas/phone-update-request.schema");
const selfie_verification_schema_1 = require("./schemas/selfie-verification.schema");
let ServicePlaceholdersService = class ServicePlaceholdersService {
    constructor(autopayModel, memberModel, securityModel, atmCardRequestModel, phoneUpdateRequestModel, accountMemberRequestModel, selfieVerificationModel, auditService, notificationsService) {
        this.autopayModel = autopayModel;
        this.memberModel = memberModel;
        this.securityModel = securityModel;
        this.atmCardRequestModel = atmCardRequestModel;
        this.phoneUpdateRequestModel = phoneUpdateRequestModel;
        this.accountMemberRequestModel = accountMemberRequestModel;
        this.selfieVerificationModel = selfieVerificationModel;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
    }
    async createAutopay(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const serviceType = dto.provider;
        const item = await this.autopayModel.findOneAndUpdate({ memberId, serviceType }, {
            $set: {
                accountId: dto.accountId,
                schedule: dto.schedule,
                enabled: true,
            },
        }, { new: true, upsert: true, setDefaultsOnInsert: true });
        return {
            feature: 'autopay',
            status: 'saved',
            item: this.toAutopayItem(item),
        };
    }
    async listAutopay(currentUser) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const items = await this.autopayModel
            .find({ memberId })
            .sort({ serviceType: 1 })
            .lean();
        return {
            feature: 'autopay',
            status: 'ok',
            items: items.map((item) => this.toAutopayItem(item)),
        };
    }
    async updateAutopayStatus(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const filter = { memberId };
        if (dto.id) {
            filter._id = this.toObjectId(dto.id);
        }
        else if (dto.provider) {
            filter.serviceType = dto.provider;
        }
        else {
            throw new common_1.BadRequestException('Autopay item id or provider is required.');
        }
        const item = await this.autopayModel.findOneAndUpdate(filter, { $set: { enabled: dto.enabled } }, { new: true });
        if (!item) {
            throw new common_1.NotFoundException('Autopay setting not found.');
        }
        return {
            feature: 'autopay',
            status: 'updated',
            item: this.toAutopayItem(item),
        };
    }
    async updateAccountLock(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        await this.loadEligibleMember(currentUser, {
            requireVerifiedKyc: false,
            ignoreAccountLock: !dto.enabled,
        });
        const setting = await this.securityModel.findOneAndUpdate({ memberId }, { $set: { accountLockEnabled: dto.enabled } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        await this.auditService.log({
            actorId: memberId.toString(),
            actorRole: currentUser.role,
            actionType: dto.enabled ? 'account_lock_enabled' : 'account_lock_disabled',
            entityType: 'member_security_setting',
            entityId: setting._id.toString(),
            before: null,
            after: {
                memberId: memberId.toString(),
                accountLockEnabled: setting.accountLockEnabled,
            },
        });
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: memberId.toString(),
            userRole: currentUser.role,
            type: dto.enabled
                ? enums_1.NotificationType.ACCOUNT_LOCKED
                : enums_1.NotificationType.ACCOUNT_UNLOCKED,
            title: dto.enabled ? 'Account lock enabled' : 'Account lock disabled',
            message: dto.enabled
                ? 'High-risk actions are now blocked until you unlock the account again.'
                : 'High-risk actions are available again on your mobile banking profile.',
            entityType: 'security',
            entityId: setting._id.toString(),
            actionLabel: 'Open security',
            priority: 'high',
            deepLink: '/profile/security',
        });
        return {
            feature: 'account_lock',
            status: 'updated',
            memberId: memberId.toString(),
            accountLockEnabled: setting.accountLockEnabled,
        };
    }
    async getAccountLock(currentUser) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const setting = await this.securityModel
            .findOne({ memberId })
            .lean();
        return {
            feature: 'account_lock',
            status: 'ok',
            memberId: memberId.toString(),
            accountLockEnabled: setting?.accountLockEnabled ?? false,
        };
    }
    async createAtmCardRequest(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const member = await this.loadEligibleMember(currentUser);
        this.ensureProfileMatchesMember(member, dto.firstName, dto.lastName, dto.phoneNumber);
        this.ensureStrongCardPin(dto.pin);
        const existingPending = await this.atmCardRequestModel.exists({
            memberId,
            status: { $in: ['submitted', 'branch_review', 'card_production'] },
        });
        if (existingPending) {
            throw new common_1.BadRequestException('An ATM card request is already in progress for this member.');
        }
        const request = await this.atmCardRequestModel.create({
            memberId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phoneNumber: dto.phoneNumber,
            region: dto.region,
            city: dto.city,
            preferredBranch: dto.preferredBranch,
            faydaFrontImageUrl: dto.faydaFrontImage,
            faydaBackImageUrl: dto.faydaBackImage,
            selfieImageUrl: dto.selfieImage,
            pinHash: this.hashSecret(dto.pin),
            status: 'submitted',
        });
        await this.auditService.log({
            actorId: memberId.toString(),
            actorRole: currentUser.role,
            actionType: 'atm_card_request_submitted',
            entityType: 'atm_card_request',
            entityId: request._id.toString(),
            before: null,
            after: {
                phoneNumber: dto.phoneNumber,
                preferredBranch: dto.preferredBranch,
                status: 'submitted',
            },
        });
        return {
            feature: 'atm_card_request',
            status: 'submitted',
            workflow: ['submitted', 'branch_review', 'card_production', 'ready_for_pickup'],
            requestId: request._id.toString(),
        };
    }
    async updatePhone(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const member = await this.loadEligibleMember(currentUser);
        if (member.phone === dto.phoneNumber) {
            throw new common_1.BadRequestException('Requested phone number must be different from the current phone number.');
        }
        const request = await this.phoneUpdateRequestModel.create({
            memberId,
            currentPhoneNumber: currentUser.phone ?? '',
            requestedPhoneNumber: dto.phoneNumber,
            faydaFrontImageUrl: dto.faydaFrontImage,
            faydaBackImageUrl: dto.faydaBackImage,
            selfieImageUrl: dto.selfieImage,
            faydaVerificationRequired: true,
            selfieVerificationRequired: true,
            status: 'pending_review',
        });
        await this.auditService.log({
            actorId: memberId.toString(),
            actorRole: currentUser.role,
            actionType: 'phone_update_requested',
            entityType: 'phone_update_request',
            entityId: request._id.toString(),
            before: { phoneNumber: member.phone },
            after: { requestedPhoneNumber: dto.phoneNumber, status: 'pending_review' },
        });
        return {
            feature: 'update_phone',
            status: 'pending_review',
            requestId: request._id.toString(),
            memberId: memberId.toString(),
            selfieVerificationRequired: true,
        };
    }
    async addMember(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        await this.loadEligibleMember(currentUser);
        const request = await this.accountMemberRequestModel.create({
            memberId,
            memberName: dto.memberName,
            relationship: dto.relationship,
            phoneNumber: dto.phoneNumber,
            faydaDocumentUrl: dto.faydaDocument,
            selfieImageUrl: dto.selfieImage,
            selfieVerificationRequired: true,
            status: 'pending_review',
        });
        await this.auditService.log({
            actorId: memberId.toString(),
            actorRole: currentUser.role,
            actionType: 'account_member_add_requested',
            entityType: 'account_member_request',
            entityId: request._id.toString(),
            before: null,
            after: {
                memberName: dto.memberName,
                relationship: dto.relationship,
                status: 'pending_review',
            },
        });
        return {
            feature: 'add_member',
            status: 'pending_review',
            requestId: request._id.toString(),
            memberId: memberId.toString(),
            selfieVerificationRequired: true,
        };
    }
    async selfieVerify(currentUser, dto) {
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        await this.loadEligibleMember(currentUser, { requireVerifiedKyc: false });
        const record = await this.selfieVerificationModel.create({
            memberId,
            imageReference: dto.imageReference,
            purpose: dto.purpose,
            status: 'manual_review_required',
        });
        await this.auditService.log({
            actorId: memberId.toString(),
            actorRole: currentUser.role,
            actionType: 'selfie_verification_requested',
            entityType: 'selfie_verification',
            entityId: record._id.toString(),
            before: null,
            after: {
                purpose: dto.purpose,
                status: 'manual_review_required',
            },
        });
        return {
            feature: 'selfie_verify',
            status: 'manual_review_required',
            requestId: record._id.toString(),
            memberId: memberId.toString(),
            payload: dto,
        };
    }
    toAutopayItem(item) {
        return {
            id: item._id?.toString(),
            provider: item.serviceType,
            serviceType: item.serviceType,
            accountId: item.accountId,
            schedule: item.schedule,
            enabled: item.enabled,
        };
    }
    toObjectId(value) {
        if (!mongoose_2.Types.ObjectId.isValid(value)) {
            throw new common_1.BadRequestException('Invalid member identifier.');
        }
        return new mongoose_2.Types.ObjectId(value);
    }
    async loadEligibleMember(currentUser, options = {}) {
        const requireVerifiedKyc = options.requireVerifiedKyc ?? true;
        const ignoreAccountLock = options.ignoreAccountLock ?? false;
        const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
        const [member, security] = await Promise.all([
            this.memberModel.findById(memberId).lean(),
            this.securityModel
                .findOne({ memberId })
                .lean(),
        ]);
        if (!member || !member.isActive) {
            throw new common_1.ForbiddenException('Inactive members cannot use this service.');
        }
        if (requireVerifiedKyc &&
            !['verified', 'demo_approved', 'active_demo'].includes(member.kycStatus)) {
            throw new common_1.ForbiddenException('Complete Fayda verification before using this service.');
        }
        if (!ignoreAccountLock && security?.accountLockEnabled) {
            throw new common_1.ForbiddenException('Account lock is enabled. Unlock the account before continuing.');
        }
        return member;
    }
    ensureProfileMatchesMember(member, firstName, lastName, phoneNumber) {
        if (member.phone !== phoneNumber) {
            throw new common_1.BadRequestException('The request phone number must match the member profile.');
        }
        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName.trim().toLowerCase();
        if (member.firstName.trim().toLowerCase() !== normalizedFirstName ||
            member.lastName.trim().toLowerCase() !== normalizedLastName) {
            throw new common_1.BadRequestException('The requested card profile must match the verified member name.');
        }
    }
    ensureStrongCardPin(pin) {
        if (!/^\d{4}$/.test(pin)) {
            throw new common_1.BadRequestException('Card PIN must be exactly 4 digits.');
        }
        if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') {
            throw new common_1.BadRequestException('Choose a stronger ATM card PIN than common repeated or sequential values.');
        }
    }
    hashSecret(value) {
        return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    }
};
exports.ServicePlaceholdersService = ServicePlaceholdersService;
exports.ServicePlaceholdersService = ServicePlaceholdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(autopay_setting_schema_1.AutopaySetting.name)),
    __param(1, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(2, (0, mongoose_1.InjectModel)(member_security_setting_schema_1.MemberSecuritySetting.name)),
    __param(3, (0, mongoose_1.InjectModel)(atm_card_request_schema_1.AtmCardRequest.name)),
    __param(4, (0, mongoose_1.InjectModel)(phone_update_request_schema_1.PhoneUpdateRequest.name)),
    __param(5, (0, mongoose_1.InjectModel)(account_member_request_schema_1.AccountMemberRequest.name)),
    __param(6, (0, mongoose_1.InjectModel)(selfie_verification_schema_1.SelfieVerification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], ServicePlaceholdersService);
//# sourceMappingURL=service-placeholders.service.js.map