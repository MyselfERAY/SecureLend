export interface DashboardData {
  // Common
  roles: string[];
  fullName: string;
  memberSince: string;

  // Tenant metrics
  tenant?: {
    activeContracts: number;
    totalMonthlyRent: number;
    pendingPayments: number;
    overduePayments: number;
    totalPaid: number;
    kmhStatus: string | null;
    kmhLimit: number | null;
    nextPaymentDate: string | null;
    nextPaymentAmount: number | null;
  };

  // Landlord metrics
  landlord?: {
    activeContracts: number;
    totalProperties: number;
    rentedProperties: number;
    totalMonthlyIncome: number;
    totalReceived: number;
    pendingPayments: number;
    overduePayments: number;
    occupancyRate: number;
  };

  // Recent notifications (latest 5)
  recentNotifications: {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }[];
}
