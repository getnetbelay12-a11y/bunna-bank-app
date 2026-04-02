import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { TransactionDocument } from '../payments/schemas/transaction.schema';
import { ListAccountTransactionsQueryDto } from './dto';
import { SavingsAccountDetail, TransactionHistoryItem } from './interfaces';
import { SavingsAccountDocument } from './schemas/savings-account.schema';
export declare class SavingsService {
    private readonly savingsAccountModel;
    private readonly transactionModel;
    constructor(savingsAccountModel: Model<SavingsAccountDocument>, transactionModel: Model<TransactionDocument>);
    getMyAccounts(currentUser: AuthenticatedUser): Promise<SavingsAccountDetail[]>;
    getAccountDetail(currentUser: AuthenticatedUser, accountId: string): Promise<SavingsAccountDetail>;
    getAccountTransactions(currentUser: AuthenticatedUser, accountId: string, query: ListAccountTransactionsQueryDto): Promise<TransactionHistoryItem[]>;
    getMemberAccounts(currentUser: AuthenticatedUser, memberId: string): Promise<SavingsAccountDetail[]>;
    private findOwnedAccount;
    private ensureMemberPrincipal;
    private ensureStaffAccess;
}
