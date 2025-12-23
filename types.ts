export enum PlanType {
  PLUS = 'Plus',
  TEAM = 'Team',
  ENTERPRISE = 'Enterprise',
  API_CREDITS = 'API Credits'
}

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  planType: PlanType;
  costPrice: number; // Base subscription cost
  gmailCost?: number; // Cost of the gmail account
  fbAdCost?: number; // Marketing cost allocation (FB)
  posterCost?: number; // Marketing cost allocation (Poster)
  salePrice: number; // Price sold to customer
  currency: string;
  notes?: string;
}

export interface BusinessMetrics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  margin: number;
  salesCount: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}