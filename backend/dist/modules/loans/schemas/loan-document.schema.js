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
exports.LoanDocumentMetadataSchema = exports.LoanDocumentMetadata = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let LoanDocumentMetadata = class LoanDocumentMetadata {
};
exports.LoanDocumentMetadata = LoanDocumentMetadata;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Loan', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanDocumentMetadata.prototype, "loanId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LoanDocumentMetadata.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], LoanDocumentMetadata.prototype, "documentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], LoanDocumentMetadata.prototype, "originalFileName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], LoanDocumentMetadata.prototype, "storageKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoanDocumentMetadata.prototype, "mimeType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0 }),
    __metadata("design:type", Number)
], LoanDocumentMetadata.prototype, "sizeBytes", void 0);
exports.LoanDocumentMetadata = LoanDocumentMetadata = __decorate([
    (0, mongoose_1.Schema)({ collection: 'loan_documents', timestamps: true, versionKey: false })
], LoanDocumentMetadata);
exports.LoanDocumentMetadataSchema = mongoose_1.SchemaFactory.createForClass(LoanDocumentMetadata);
exports.LoanDocumentMetadataSchema.index({ loanId: 1, documentType: 1 });
//# sourceMappingURL=loan-document.schema.js.map