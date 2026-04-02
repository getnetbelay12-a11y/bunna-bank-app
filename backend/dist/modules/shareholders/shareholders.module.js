"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareholdersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const member_schema_1 = require("../members/schemas/member.schema");
const shareholders_controller_1 = require("./shareholders.controller");
const shareholders_service_1 = require("./shareholders.service");
let ShareholdersModule = class ShareholdersModule {
};
exports.ShareholdersModule = ShareholdersModule;
exports.ShareholdersModule = ShareholdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
            ]),
        ],
        controllers: [shareholders_controller_1.ShareholdersController],
        providers: [shareholders_service_1.ShareholdersService],
        exports: [shareholders_service_1.ShareholdersService],
    })
], ShareholdersModule);
//# sourceMappingURL=shareholders.module.js.map