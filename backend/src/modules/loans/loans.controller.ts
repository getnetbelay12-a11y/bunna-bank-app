import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { AttachLoanDocumentDto, CreateLoanApplicationDto } from './dto';
import { LoansService } from './loans.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  submitLoanApplication(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateLoanApplicationDto,
  ) {
    return this.loansService.submitLoanApplication(currentUser, dto);
  }

  @Post(':loanId/documents')
  attachLoanDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
    @Body() dto: AttachLoanDocumentDto,
  ) {
    return this.loansService.attachLoanDocument(currentUser, loanId, dto);
  }

  @Get('my')
  getMyLoans(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.loansService.getMyLoans(currentUser);
  }

  @Get(':loanId')
  getLoanDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.getLoanDetail(currentUser, loanId);
  }

  @Get(':loanId/timeline')
  getLoanTimeline(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.getLoanTimeline(currentUser, loanId);
  }
}
