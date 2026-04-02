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
exports.StaffPerformanceQueryDto = exports.StaffPerformancePeriod = void 0;
const class_validator_1 = require("class-validator");
var StaffPerformancePeriod;
(function (StaffPerformancePeriod) {
    StaffPerformancePeriod["DAILY"] = "daily";
    StaffPerformancePeriod["WEEKLY"] = "weekly";
    StaffPerformancePeriod["MONTHLY"] = "monthly";
    StaffPerformancePeriod["YEARLY"] = "yearly";
})(StaffPerformancePeriod || (exports.StaffPerformancePeriod = StaffPerformancePeriod = {}));
class StaffPerformanceQueryDto {
}
exports.StaffPerformanceQueryDto = StaffPerformanceQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(StaffPerformancePeriod),
    __metadata("design:type", String)
], StaffPerformanceQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], StaffPerformanceQueryDto.prototype, "staffId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], StaffPerformanceQueryDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], StaffPerformanceQueryDto.prototype, "districtId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], StaffPerformanceQueryDto.prototype, "date", void 0);
//# sourceMappingURL=staff-performance-query.dto.js.map