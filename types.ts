export enum PlanType {
  PLUS = 'Plus',
  GO = 'Go',
  GOOGLE_AI_PRO = 'Google AI Pro'
}

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  planType: PlanType;
  costPrice: number; // Base subscription cost (COGS)
  salePrice: number; // Price sold to customer
  currency: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Gmail' | 'Facebook Ads' | 'Poster' | 'Other';
  amount: number;
  description?: string;
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