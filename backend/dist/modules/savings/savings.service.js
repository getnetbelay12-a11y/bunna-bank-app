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
exports.SavingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const transaction_schema_1 = require("../payments/schemas/transaction.schema");
const savings_account_schema_1 = require("./schemas/savings-account.schema");
let SavingsService = class SavingsService {
    constructor(savingsAccountModel, transactionModel) {
        this.savingsAccountModel = savingsAccountModel;
        this.transactionModel = transactionModel;
    }
    async getMyAccounts(currentUser) {
        this.ensureMemberPrincipal(currentUser);
        const accounts = await this.savingsAccountModel
            .find({
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
        })
            .sort({ isActive: -1, createdAt: -1 })
            .lean()
            .exec();
        return accounts;
    }
    async getAccountDetail(currentUser, accountId) {
        this.ensureMemberPrincipal(currentUser);
        const account = await this.findOwnedAccount(currentUser.sub, accountId);
        if (!account) {
            throw new common_1.NotFoundException('Savings account not found.');
        }
        return account;
    }
    async getAccountTransactions(currentUser, accountId, query) {
        this.ensureMemberPrincipal(currentUser);
        const account = await this.findOwnedAccount(currentUser.sub, accountId);
        if (!account) {
            throw new common_1.NotFoundException('Savings account not found.');
        }
        const transactions = await this.transactionModel
            .find({
            accountId: new mongoose_2.Types.ObjectId(accountId),
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
        })
            .sort({ createdAt: -1 })
            .limit(query.limit ?? 20)
            .lean()
            .exec();
        return transactions;
    }
    async getMemberAccounts(currentUser, memberId) {
        this.ensureStaffAccess(currentUser);
        return this.savingsAccountModel
            .find({
            memberId: new mongoose_2.Types.ObjectId(memberId),
        })
            .sort({ isActive: -1, createdAt: -1 })
            .lean()
            .exec();
    }
    findOwnedAccount(memberId, accountId) {
        return this.savingsAccountModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(accountId),
            memberId: new mongoose_2.Types.ObjectId(memberId),
        })
            .lean()
            .exec();
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
exports.SavingsService = SavingsService;
exports.SavingsService = SavingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(savings_account_schema_1.SavingsAccount.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SavingsService);
//# sourceMappingURL=savings.service.js.map