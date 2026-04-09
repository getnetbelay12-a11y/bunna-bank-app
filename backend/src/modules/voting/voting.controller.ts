import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateVoteOptionDto, CreateVoteDto, RespondToVoteDto } from './dto';
import { VotingService } from './voting.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Get('votes/active')
  getActiveVotes() {
    return this.votingService.getActiveVotes();
  }

  @Get('voting/events')
  getVotingEvents() {
    return this.votingService.getActiveVotes();
  }

  @Get('votes/:id')
  getVote(@Param('id') voteId: string) {
    return this.votingService.getVote(voteId);
  }

  @Post('votes/:id/respond')
  respondToVote(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
    @Body() dto: RespondToVoteDto,
  ) {
    return this.votingService.respondToVote(currentUser, voteId, dto);
  }

  @Post('voting/vote')
  castVote(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: RespondToVoteDto & { voteId: string },
  ) {
    return this.votingService.respondToVote(currentUser, dto.voteId, dto);
  }

  @Get('votes/:id/results')
  getVoteResults(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.getVoteResults(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('votes')
  createVoteAlias(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateVoteDto,
  ) {
    return this.votingService.createVote(currentUser, dto);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('votes/:id/open')
  openVoteAlias(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.openVote(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('votes/:id/close')
  closeVoteAlias(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.closeVote(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('votes/:id/participation')
  getParticipationAlias(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.getParticipation(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('admin/votes')
  listVotesForAdmin(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.votingService.listVotesForAdmin(currentUser);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('admin/votes')
  createVote(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateVoteDto,
  ) {
    return this.votingService.createVote(currentUser, dto);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('admin/votes/:id/options')
  addVoteOption(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
    @Body() dto: CreateVoteOptionDto,
  ) {
    return this.votingService.addVoteOption(currentUser, voteId, dto);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('admin/votes/:id/open')
  openVote(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.openVote(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('admin/votes/:id/close')
  closeVote(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.closeVote(currentUser, voteId);
  }

  @Roles(
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('admin/votes/:id/participation')
  getParticipation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') voteId: string,
  ) {
    return this.votingService.getParticipation(currentUser, voteId);
  }
}
