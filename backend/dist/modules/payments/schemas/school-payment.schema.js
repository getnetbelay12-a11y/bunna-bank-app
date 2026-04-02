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
exports.SchoolPaymentSchema = exports.SchoolPayment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SchoolPayment = class SchoolPayment {
};
exports.SchoolPayment = SchoolPayment;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, type: mongoose_2.Types.ObjectId, ref: 'Transaction' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SchoolPayment.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SchoolPayment.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SchoolPayment.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'SavingsAccount', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SchoolPayment.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SchoolPayment.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], SchoolPayment.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], SchoolPayment.prototype, "schoolName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], SchoolPayment.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['mobile', 'branch'], index: true }),
    __metadata("design:type", String)
], SchoolPayment.prototype, "channel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['successful', 'failed'], index: true }),
    __metadata("design:type", String)
], SchoolPayment.prototype, "status", void 0);
exports.SchoolPayment = SchoolPayment = __decorate([
    (0, mongoose_1.Schema)({ collection: 'school_payments', timestamps: true, versionKey: false })
], SchoolPayment);
exports.SchoolPaymentSchema = mongoose_1.SchemaFactory.createForClass(SchoolPayment);
exports.SchoolPaymentSchema.index({ memberId: 1, createdAt: -1 });
exports.SchoolPaymentSchema.index({ branchId: 1, channel: 1, createdAt: -1 });
//# sourceMappingURL=school-payment.schema.js.map