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
exports.CreateLoanDocumentDto = exports.SAFE_MIME_TYPE_PATTERN = exports.SAFE_STORAGE_KEY_PATTERN = exports.MAX_LOAN_DOCUMENTS = exports.MAX_LOAN_DOCUMENT_SIZE_BYTES = void 0;
const class_validator_1 = require("class-validator");
exports.MAX_LOAN_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;
exports.MAX_LOAN_DOCUMENTS = 10;
exports.SAFE_STORAGE_KEY_PATTERN = /^[A-Za-z0-9/_ .-]+$/;
exports.SAFE_MIME_TYPE_PATTERN = /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+$/;
class CreateLoanDocumentDto {
}
exports.CreateLoanDocumentDto = CreateLoanDocumentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateLoanDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateLoanDocumentDto.prototype, "originalFileName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    (0, class_validator_1.Matches)(exports.SAFE_STORAGE_KEY_PATTERN, {
        message: 'storageKey may only contain letters, numbers, spaces, ".", "-", "_", and "/".',
    }),
    __metadata("design:type", String)
], CreateLoanDocumentDto.prototype, "storageKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(exports.SAFE_MIME_TYPE_PATTERN, {
        message: 'mimeType must be a valid MIME type such as application/pdf.',
    }),
    __metadata("design:type", String)
], CreateLoanDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(exports.MAX_LOAN_DOCUMENT_SIZE_BYTES),
    __metadata("design:type", Number)
], CreateLoanDocumentDto.prototype, "sizeBytes", void 0);
//# sourceMappingURL=create-loan-document.dto.js.map