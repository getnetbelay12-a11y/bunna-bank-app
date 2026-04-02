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
exports.CreateMemberDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../common/enums");
class CreateMemberDto {
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "memberNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.MemberType),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "memberType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.UserRole),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)('ET'),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "districtId", void 0);
__decorate([
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMemberDto.prototype, "shareBalance", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "password", void 0);
//# sourceMappingURL=create-member.dto.js.map