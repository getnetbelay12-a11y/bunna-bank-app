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
exports.VotingController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const voting_service_1 = require("./voting.service");
let VotingController = class VotingController {
    constructor(votingService) {
        this.votingService = votingService;
    }
    getActiveVotes() {
        return this.votingService.getActiveVotes();
    }
    getVotingEvents() {
        return this.votingService.getActiveVotes();
    }
    getVote(voteId) {
        return this.votingService.getVote(voteId);
    }
    respondToVote(currentUser, voteId, dto) {
        return this.votingService.respondToVote(currentUser, voteId, dto);
    }
    castVote(currentUser, dto) {
        return this.votingService.respondToVote(currentUser, dto.voteId, dto);
    }
    getVoteResults(currentUser, voteId) {
        return this.votingService.getVoteResults(currentUser, voteId);
    }
    createVoteAlias(currentUser, dto) {
        return this.votingService.createVote(currentUser, dto);
    }
    openVoteAlias(currentUser, voteId) {
        return this.votingService.openVote(currentUser, voteId);
    }
    closeVoteAlias(currentUser, voteId) {
        return this.votingService.closeVote(currentUser, voteId);
    }
    getParticipationAlias(currentUser, voteId) {
        return this.votingService.getParticipation(currentUser, voteId);
    }
    listVotesForAdmin(currentUser) {
        return this.votingService.listVotesForAdmin(currentUser);
    }
    createVote(currentUser, dto) {
        return this.votingService.createVote(currentUser, dto);
    }
    addVoteOption(currentUser, voteId, dto) {
        return this.votingService.addVoteOption(currentUser, voteId, dto);
    }
    openVote(currentUser, voteId) {
        return this.votingService.openVote(currentUser, voteId);
    }
    closeVote(currentUser, voteId) {
        return this.votingService.closeVote(currentUser, voteId);
    }
    getParticipation(currentUser, voteId) {
        return this.votingService.getParticipation(currentUser, voteId);
    }
};
exports.VotingController = VotingController;
__decorate([
    (0, common_1.Get)('votes/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getActiveVotes", null);
__decorate([
    (0, common_1.Get)('voting/events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getVotingEvents", null);
__decorate([
    (0, common_1.Get)('votes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getVote", null);
__decorate([
    (0, common_1.Post)('votes/:id/respond'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RespondToVoteDto]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "respondToVote", null);
__decorate([
    (0, common_1.Post)('voting/vote'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "castVote", null);
__decorate([
    (0, common_1.Get)('votes/:id/results'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getVoteResults", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('votes'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateVoteDto]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "createVoteAlias", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('votes/:id/open'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "openVoteAlias", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('votes/:id/close'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "closeVoteAlias", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)('votes/:id/participation'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getParticipationAlias", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)('admin/votes'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "listVotesForAdmin", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('admin/votes'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateVoteDto]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "createVote", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('admin/votes/:id/options'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreateVoteOptionDto]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "addVoteOption", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('admin/votes/:id/open'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "openVote", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Post)('admin/votes/:id/close'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "closeVote", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)('admin/votes/:id/participation'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getParticipation", null);
exports.VotingController = VotingController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [voting_service_1.VotingService])
], VotingController);
//# sourceMappingURL=voting.controller.js.map