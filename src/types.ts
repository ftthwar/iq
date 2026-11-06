export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export type PlanType = 'monthly' | 'three_months';

export type PlanPrice = 35 | 45 | 65 | 100;

export interface PlanReceiptOption {
  id: string;
  label: string;
  shortLabel: string;
  expectedCash: number;
  requiresNano: boolean;
}

export interface PlanDefinition {
  planType: PlanType;
  price: PlanPrice;
  name: string;
  durationLabel: string;
  options: PlanReceiptOption[];
}

export type CashStatus = 'paid' | 'unpaid' | 'partial';

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. REC-2026-0001
  subscriberName: string; // اسم المشترك الثلاثي
  subscriberPhone?: string;
  subscriberAddress?: string;
  planType: PlanType;
  planPrice: PlanPrice;
  selectedOptionId: string;
  selectedOptionText: string;
  expectedCash: number;
  actualCashReceived: number;
  cashStatus: CashStatus;
  requiresNano: boolean;
  nanoReceived: boolean;
  nanoModel?: string; // Exclusively "PowerBeam M5 400" when required
  nanoSerial?: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditActionType =
  | 'create_receipt'
  | 'update_receipt'
  | 'toggle_cash_status'
  | 'toggle_nano_status'
  | 'delete_receipt'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'login'
  | 'backup_restore';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType: AuditActionType;
  title: string;
  details: string;
  targetId?: string;
}

export interface StatsSummary {
  totalReceiptsCount: number;
  totalExpectedCash: number;
  totalCollectedCash: number;
  totalUnpaidCash: number;
  totalNanoRequiredCount: number;
  totalNanoReceivedCount: number;
  totalNanoPendingCount: number;
  monthlyCount: number;
  threeMonthsCount: number;
  planBreakdown: {
    planKey: string;
    name: string;
    count: number;
    collectedCash: number;
    unpaidCash: number;
    nanoReceived: number;
    nanoPending: number;
  }[];
  employeePerformance: {
    employeeId: string;
    employeeName: string;
    receiptsCount: number;
    collectedCash: number;
    nanoReceived: number;
  }[];
}
