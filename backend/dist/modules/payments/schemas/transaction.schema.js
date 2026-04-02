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
exports.TransactionSchema = exports.Transaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "transactionReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'SavingsAccount', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.PaymentType, index: true }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['mobile', 'branch'], index: true }),
    __metadata("design:type", String)
], Transaction.prototype, "channel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'ETB' }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "externalReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "narration", void 0);
exports.Transaction = Transaction = __decorate([
    (0, mongoose_1.Schema)({ collection: 'transactions', timestamps: true, versionKey: false })
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
exports.TransactionSchema.index({ memberId: 1, createdAt: -1 });
exports.TransactionSchema.index({ staffId: 1, createdAt: -1 });
exports.TransactionSchema.index({ branchId: 1, type: 1, createdAt: -1 });
//# sourceMappingURL=transaction.schema.js.map