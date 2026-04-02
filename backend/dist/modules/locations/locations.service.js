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
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const branch_schema_1 = require("../members/schemas/branch.schema");
const DEFAULT_REGION = 'Amhara';
let LocationsService = class LocationsService {
    constructor(branchModel) {
        this.branchModel = branchModel;
    }
    async getRegions() {
        const rows = await this.branchModel
            .find({ isActive: true })
            .select('region')
            .lean();
        const regions = Array.from(new Set(rows
            .map((item) => item.region?.trim() || DEFAULT_REGION)
            .filter((item) => item.length > 0))).sort();
        return regions.map((name) => ({ name }));
    }
    async getCities(region) {
        const rows = await this.branchModel
            .find({ isActive: true, region: region || DEFAULT_REGION })
            .select('city')
            .lean();
        const cities = Array.from(new Set(rows
            .map((item) => item.city?.trim())
            .filter((item) => Boolean(item && item.length > 0)))).sort();
        return cities.map((name) => ({ name, region: region || DEFAULT_REGION }));
    }
    async getBranches(region, city) {
        const filter = { isActive: true };
        if (region) {
            filter.region = region;
        }
        if (city) {
            filter.city = city;
        }
        const rows = await this.branchModel
            .find(filter)
            .select('name city region')
            .sort({ name: 1 })
            .lean();
        return rows.map((item) => ({
            id: item._id.toString(),
            name: item.name,
            city: item.city ?? '',
            region: item.region ?? DEFAULT_REGION,
        }));
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(branch_schema_1.Branch.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LocationsService);
//# sourceMappingURL=locations.service.js.map