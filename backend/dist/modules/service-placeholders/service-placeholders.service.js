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
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const account_member_request_schema_1 = require("./schemas/account-member-request.schema");
const atm_card_request_schema_1 = require("./schemas/atm-card-request.schema");
const autopay_setting_schema_1 = require("./schemas/autopay-setting.schema");
const member_security_setting_schema_1 = require("./schemas/member-security-setting.schema");
const phone_update_request_schema_1 = require("./schemas/phone-update-request.schema");
const selfie_verification_schema_1 = require("./schemas/selfie-verification.schema");
let ServicePlaceholdersService = class ServicePlaceholdersService {
    constructor(autopayModel, securityModel, atmCardRequestModel, phoneUpdateRequestModel, accountMemberRequestModel, selfieVerificationModel) {
        this.autopayModel = autopayModel;
        this.securityModel = securityModel;
        this.atmCardRequestModel = atmCardRequestModel;
        this.phoneUpdateRequestModel = phoneUpdateRequestModel;
        this.accountMemberRequestModel = accountMemberRequestModel;
        this.selfieVerificationModel = selfieVerificationModel;
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
        const setting = await this.securityModel.findOneAndUpdate({ memberId }, { $set: { accountLockEnabled: dto.enabled } }, { new: true, upsert: true, setDefaultsOnInsert: true });
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
            pin: dto.pin,
            status: 'submitted',
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
        const record = await this.selfieVerificationModel.create({
            memberId,
            imageReference: dto.imageReference,
            purpose: dto.purpose,
            status: 'manual_review_required',
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
};
exports.ServicePlaceholdersService = ServicePlaceholdersService;
exports.ServicePlaceholdersService = ServicePlaceholdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(autopay_setting_schema_1.AutopaySetting.name)),
    __param(1, (0, mongoose_1.InjectModel)(member_security_setting_schema_1.MemberSecuritySetting.name)),
    __param(2, (0, mongoose_1.InjectModel)(atm_card_request_schema_1.AtmCardRequest.name)),
    __param(3, (0, mongoose_1.InjectModel)(phone_update_request_schema_1.PhoneUpdateRequest.name)),
    __param(4, (0, mongoose_1.InjectModel)(account_member_request_schema_1.AccountMemberRequest.name)),
    __param(5, (0, mongoose_1.InjectModel)(selfie_verification_schema_1.SelfieVerification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ServicePlaceholdersService);
//# sourceMappingURL=service-placeholders.service.js.map