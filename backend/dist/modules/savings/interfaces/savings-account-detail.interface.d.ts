export interface SavingsAccountDetail {
    _id: string;
    accountNumber: string;
    memberId: string;
    branchId: string;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
