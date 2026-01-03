export enum PlanType {
  PLUS = 'Plus',
  GO = 'Go',
  GOOGLE_AI_PRO = 'Google AI Pro'
}

export interface Transaction {
  id: string;
  userId?: string; // Owner ID
  date: string;
  customerName?: string; // Optional field
  planType: PlanType;
  costPrice: number; // Base subscription cost (COGS)
  salePrice: number; // Price sold to customer
  quantity?: number; // Number of items sold in this transaction
  currency: string;
  notes?: string;
  isHistorical?: boolean; // If true, excluded from charts but included in totals
}

export interface Expense {
  id: string;
  userId?: string; // Owner ID
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