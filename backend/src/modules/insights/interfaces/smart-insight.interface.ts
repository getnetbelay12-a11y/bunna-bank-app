export type SmartInsightType =
  | 'school_payment_due'
  | 'subscription_due'
  | 'utility_due'
  | 'rent_due'
  | 'loan_due'
  | 'loan_status'
  | 'insurance_due'
  | 'low_balance_warning'
  | 'payment_overdue'
  | 'savings_suggestion';

export type SmartInsightPriority = 'high' | 'medium' | 'low';

export interface SmartInsight {
  id: string;
  type: SmartInsightType;
  priority: SmartInsightPriority;
  title: string;
  message: string;
  actionLabel: string;
  actionRoute: string;
  dueAt?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface SmartInsightFeed {
  generatedAt: string;
  total: number;
  urgentCount: number;
  items: SmartInsight[];
}
