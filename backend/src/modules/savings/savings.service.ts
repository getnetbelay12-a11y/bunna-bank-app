import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema';
import { ListAccountTransactionsQueryDto } from './dto';
import {
  SavingsAccountDetail,
  TransactionHistoryItem,
} from './interfaces';
import {
  SavingsAccount,
  SavingsAccountDocument,
} from './schemas/savings-account.schema';

@Injectable()
export class SavingsService {
  constructor(
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async getMyAccounts(
    currentUser: AuthenticatedUser,
  ): Promise<SavingsAccountDetail[]> {
    this.ensureMemberPrincipal(currentUser);

    const accounts = await this.savingsAccountModel
      .find({
        memberId: new Types.ObjectId(currentUser.sub),
      })
      .sort({ isActive: -1, createdAt: -1 })
      .lean<SavingsAccountDetail[]>()
      .exec();

    return accounts;
  }

  async getAccountDetail(
    currentUser: AuthenticatedUser,
    accountId: string,
  ): Promise<SavingsAccountDetail> {
    this.ensureMemberPrincipal(currentUser);

    const account = await this.findOwnedAccount(currentUser.sub, accountId);

    if (!account) {
      throw new NotFoundException('Savings account not found.');
    }

    return account;
  }

  async getAccountTransactions(
    currentUser: AuthenticatedUser,
    accountId: string,
    query: ListAccountTransactionsQueryDto,
  ): Promise<TransactionHistoryItem[]> {
    this.ensureMemberPrincipal(currentUser);

    const account = await this.findOwnedAccount(currentUser.sub, accountId);

    if (!account) {
      throw new NotFoundException('Savings account not found.');
    }

    const transactions = await this.transactionModel
      .find({
        accountId: new Types.ObjectId(accountId),
        memberId: new Types.ObjectId(currentUser.sub),
      })
      .sort({ createdAt: -1 })
      .limit(query.limit ?? 20)
      .lean<TransactionHistoryItem[]>()
      .exec();

    return transactions;
  }

  async getMemberAccounts(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<SavingsAccountDetail[]> {
    this.ensureStaffAccess(currentUser);

    return this.savingsAccountModel
      .find({
        memberId: new Types.ObjectId(memberId),
      })
      .sort({ isActive: -1, createdAt: -1 })
      .lean<SavingsAccountDetail[]>()
      .exec();
  }

  private findOwnedAccount(
    memberId: string,
    accountId: string,
  ): Promise<SavingsAccountDetail | null> {
    return this.savingsAccountModel
      .findOne({
        _id: new Types.ObjectId(accountId),
        memberId: new Types.ObjectId(memberId),
      })
      .lean<SavingsAccountDetail | null>()
      .exec();
  }

  private ensureMemberPrincipal(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only members can access this resource.');
    }
  }

  private ensureStaffAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only staff users can access this resource.');
    }
  }
}
