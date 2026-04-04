// Contract types
export interface ContractSummary {
  id: string;
  status: string;
  monthlyRent: number;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  startDate: string;
  endDate: string;
  signatureCount?: number;
  mySignature?: boolean;
}

export interface ContractDetail {
  id: string;
  status: string;
  monthlyRent: number;
  depositAmount?: number;
  startDate: string;
  endDate: string;
  paymentDayOfMonth: number;
  terms: string;
  landlordIban?: string;
  property: {
    id: string;
    title: string;
    city: string;
    district: string;
    addressLine1: string;
  };
  tenant: { id: string; fullName: string; tcknMasked: string };
  landlord: { id: string; fullName: string; tcknMasked: string };
  signatures: { role: string; signedAt: string; signedByName: string }[];
  tenantKmhInfo?: {
    accountId: string;
    accountNumber: string;
    creditLimit: number;
    status: string;
  } | null;
  tenantKmhAccounts?: KmhAccountOption[];
}

export interface KmhAccountOption {
  accountId: string;
  accountNumber: string;
  creditLimit: number;
  status: string;
  contractId?: string | null;
}

// Payment types
export interface PaymentItem {
  id: string;
  contractId?: string;
  propertyTitle: string;
  dueDate: string;
  amount: number;
  periodLabel: string;
  status: string;
  paidAt?: string;
}

// Property types
export interface Property {
  id: string;
  title: string;
  addressLine1: string;
  city: string;
  district: string;
  propertyType: string;
  roomCount?: number;
  areaM2?: number;
  floor?: number;
  totalFloors?: number;
  monthlyRent: number;
  depositAmount?: number;
  status: string;
}

// Bank types
export interface KmhApplication {
  id: string;
  employmentStatus: string;
  monthlyIncome: number;
  employerName?: string;
  residentialAddress: string;
  estimatedRent: number;
  status: string;
  approvedLimit?: number;
  rejectionReason?: string;
  bankReferenceNo?: string;
  onboardingCompleted: boolean;
  bankAccount?: {
    accountNumber: string;
    creditLimit: number;
    status: string;
  } | null;
  createdAt: string;
}

export interface BankAccount {
  accountId: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  creditLimit?: number;
  currency: string;
  contractId?: string;
  propertyTitle?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  referenceNo: string;
  status: string;
  direction: 'IN' | 'OUT';
  processedAt?: string;
  createdAt: string;
}

// KMH Evaluation
export interface KmhEvaluationResult {
  applicationId: string;
  status: 'APPROVED' | 'REJECTED';
  creditScore: number;
  creditScoreLabel: string;
  approvedLimit?: number;
  interestRate?: number;
  monthlyInstallment?: number;
  debtToIncomeRatio?: number;
  evaluationFactors: { name: string; impact: string; detail: string }[];
  rejectionReason?: string;
  bankReferenceNo?: string;
  existingCustomer: boolean;
}

// KYC
export interface KycStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface KycStatus {
  applicationId: string;
  kycStatus: string;
  existingCustomer: boolean;
  steps: KycStep[];
  completedSteps: number;
  totalSteps: number;
  canComplete: boolean;
}

// Notification types
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

// Dashboard types
export interface DashboardTenantData {
  activeContracts: number;
  totalMonthlyRent: number;
  pendingPayments: number;
  overduePayments: number;
  totalPaid: number;
  kmhStatus: string | null;
  kmhLimit: number | null;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
}

export interface DashboardLandlordData {
  activeContracts: number;
  totalProperties: number;
  rentedProperties: number;
  totalMonthlyIncome: number;
  totalReceived: number;
  pendingPayments: number;
  overduePayments: number;
  occupancyRate: number;
}

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  roles: string[];
  fullName: string;
  memberSince: string;
  tenant?: DashboardTenantData;
  landlord?: DashboardLandlordData;
  recentNotifications: DashboardNotification[];
}
