"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const transaction_schema_1 = require("../payments/schemas/transaction.schema");
const savings_account_schema_1 = require("./schemas/savings-account.schema");
const savings_controller_1 = require("./savings.controller");
const savings_service_1 = require("./savings.service");
let SavingsModule = class SavingsModule {
};
exports.SavingsModule = SavingsModule;
exports.SavingsModule = SavingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: savings_account_schema_1.SavingsAccount.name, schema: savings_account_schema_1.SavingsAccountSchema },
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
            ]),
        ],
        controllers: [savings_controller_1.SavingsController],
        providers: [savings_service_1.SavingsService],
        exports: [savings_service_1.SavingsService],
    })
], SavingsModule);
//# sourceMappingURL=savings.module.js.map