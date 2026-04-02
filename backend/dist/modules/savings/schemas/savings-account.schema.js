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
exports.SavingsAccountSchema = exports.SavingsAccount = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SavingsAccount = class SavingsAccount {
};
exports.SavingsAccount = SavingsAccount;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], SavingsAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SavingsAccount.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SavingsAccount.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], SavingsAccount.prototype, "balance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'ETB' }),
    __metadata("design:type", String)
], SavingsAccount.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true, index: true }),
    __metadata("design:type", Boolean)
], SavingsAccount.prototype, "isActive", void 0);
exports.SavingsAccount = SavingsAccount = __decorate([
    (0, mongoose_1.Schema)({ collection: 'savings_accounts', timestamps: true, versionKey: false })
], SavingsAccount);
exports.SavingsAccountSchema = mongoose_1.SchemaFactory.createForClass(SavingsAccount);
exports.SavingsAccountSchema.index({ memberId: 1, isActive: 1 });
//# sourceMappingURL=savings-account.schema.js.map