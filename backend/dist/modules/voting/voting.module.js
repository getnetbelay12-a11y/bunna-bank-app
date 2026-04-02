"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const member_schema_1 = require("../members/schemas/member.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const vote_otp_service_1 = require("./vote-otp.service");
const vote_otp_port_1 = require("./vote-otp.port");
const vote_audit_log_schema_1 = require("./schemas/vote-audit-log.schema");
const vote_option_schema_1 = require("./schemas/vote-option.schema");
const vote_response_schema_1 = require("./schemas/vote-response.schema");
const vote_schema_1 = require("./schemas/vote.schema");
const voting_controller_1 = require("./voting.controller");
const voting_service_1 = require("./voting.service");
let VotingModule = class VotingModule {
};
exports.VotingModule = VotingModule;
exports.VotingModule = VotingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            mongoose_1.MongooseModule.forFeature([
                { name: vote_schema_1.Vote.name, schema: vote_schema_1.VoteSchema },
                { name: vote_option_schema_1.VoteOption.name, schema: vote_option_schema_1.VoteOptionSchema },
                { name: vote_response_schema_1.VoteResponse.name, schema: vote_response_schema_1.VoteResponseSchema },
                { name: vote_audit_log_schema_1.VoteAuditLog.name, schema: vote_audit_log_schema_1.VoteAuditLogSchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
            ]),
        ],
        controllers: [voting_controller_1.VotingController],
        providers: [
            voting_service_1.VotingService,
            vote_otp_service_1.VoteOtpService,
            {
                provide: vote_otp_port_1.VOTE_OTP_PORT,
                useExisting: vote_otp_service_1.VoteOtpService,
            },
        ],
        exports: [voting_service_1.VotingService],
    })
], VotingModule);
//# sourceMappingURL=voting.module.js.map