/**
 * Supported expense category identifiers across the application.
 */
export type CategoryId =
  | 'groceries'
  | 'personal_care'
  | 'household'
  | 'electronics'
  | 'bills'
  | 'food_dining'
  | 'other';

/**
 * Metadata definition for each category, including display label and NLP keywords.
 */
export interface CategoryMeta {
  id: CategoryId;
  label: string;
  keywords: string[];
}

/**
 * Individual expense transaction entry.
 */
export interface Transaction {
  /** Unique transaction identifier (e.g. 'tx-1234567890-abcde') */
  id: string;
  /** Description or merchant title */
  title: string;
  /** Numerical cost amount stored in base currency (INR) */
  amount: number;
  /** Categorization key */
  category: CategoryId;
  /** ISO date string format YYYY-MM-DD */
  date: string;
  /** Optional user notes or annotations */
  notes?: string;
  /** Epoch timestamp in milliseconds when transaction was created */
  createdAt: number;
}

/** Supported currency codes for reporting and display */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

/** Configuration for currency conversion and symbol formatting */
export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rateAgainstINR: number;
}

/** Main navigation tabs */
export type ViewTab = 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'settings';

/** Sorting preferences for transaction listings */
export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'title-asc';

/** Month representation used for month-by-month scoping and navigation */
export interface MonthKey {
  year: number;
  month: number; // 0-indexed: 0 is January, 11 is December
  key: string; // Formatted as "YYYY-MM"
  label: string; // e.g. "September 2026"
}

/**
 * Product lifespan and monthly amortization item.
 * Represents expenses that provide utility across multiple months (e.g., shampoo, supplements, perfume).
 */
export interface AmortizedItem {
  /** Unique item identifier */
  id: string;
  /** Optional linked transaction ID if created directly from an expense */
  transactionId?: string;
  /** Product or item name */
  name: string;
  /** Total purchase cost stored in base currency (INR) */
  totalCost: number;
  /** Purchase or start date (YYYY-MM-DD) */
  startDate: string;
  /** Expected consumption or finish date (YYYY-MM-DD) */
  endDate?: string;
  /** Duration in months (e.g., 2 months) */
  durationMonths?: number;
  /** Duration in days (e.g., 62 days) */
  durationDays?: number;
  /** Calculated monthly cost (totalCost / durationMonths) */
  monthlyCost?: number;
  /** Calculated daily cost (totalCost / durationDays) */
  dailyCost?: number;
  /** Categorization key */
  category: CategoryId;
  /** Optional notes or product specifications */
  notes?: string;
  /** Active tracking or completed consumption */
  status: 'active' | 'completed';
  /** Epoch timestamp when record was created */
  createdAt: number;
}

