import { CategoryId, CategoryMeta, CurrencyCode, CurrencyConfig } from '@/types/finance';

/**
 * Standard category definitions with associated keywords for natural language parsing.
 */
export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: {
    id: 'groceries',
    label: 'Groceries',
    keywords: [
      'grocery', 'groceries', 'supermarket', 'mart', 'market', 'vegetables',
      'veggies', 'fruits', 'milk', 'bread', 'eggs', 'cheese', 'butter', 'oil',
      'rice', 'dal', 'flour', 'spices', 'provisions',
    ],
  },
  food_dining: {
    id: 'food_dining',
    label: 'Food & Dining',
    keywords: [
      'coffee', 'tea', 'cafe', 'starbucks', 'dinner', 'lunch', 'breakfast',
      'brunch', 'restaurant', 'pizza', 'burger', 'swiggy', 'zomato',
      'uber eats', 'doordash', 'takeout', 'bar', 'drinks', 'beer', 'bistro',
    ],
  },
  bills: {
    id: 'bills',
    label: 'Bills & Utilities',
    keywords: [
      'bill', 'bills', 'electricity', 'water', 'internet', 'wifi', 'broadband',
      'phone', 'recharge', 'rent', 'maintenance', 'subscription', 'netflix',
      'spotify', 'prime', 'cloud', 'aws', 'gas', 'insurance',
    ],
  },
  electronics: {
    id: 'electronics',
    label: 'Electronics',
    keywords: [
      'laptop', 'macbook', 'phone', 'iphone', 'android', 'ipad', 'tablet',
      'monitor', 'keyboard', 'mouse', 'headphones', 'earbuds', 'cable',
      'charger', 'gadget', 'tv', 'camera', 'hardware', 'drive',
    ],
  },
  personal_care: {
    id: 'personal_care',
    label: 'Personal Care',
    keywords: [
      'haircut', 'salon', 'spa', 'massage', 'gym', 'fitness', 'skincare',
      'perfume', 'shampoo', 'soap', 'grooming', 'medicine', 'pharmacy',
      'doctor', 'dentist', 'cosmetics', 'therapy',
    ],
  },
  household: {
    id: 'household',
    label: 'Household',
    keywords: [
      'furniture', 'chair', 'desk', 'decor', 'curtains', 'cleaning',
      'detergent', 'laundry', 'kitchenware', 'appliances', 'tools',
      'repair', 'plumbing', 'sheets', 'bedding', 'garden', 'home', 'house',
    ],
  },
  other: {
    id: 'other',
    label: 'Other',
    keywords: [
      'miscellaneous', 'misc', 'gift', 'donation', 'books', 'stationery',
      'travel', 'uber', 'taxi', 'fuel', 'petrol', 'flight', 'ticket', 'other',
    ],
  },
};

/** Pre-computed array of all categories for dropdowns and filters */
export const CATEGORY_LIST = Object.values(CATEGORIES);

/** Valid category identifiers for runtime validation */
export const VALID_CATEGORY_IDS: ReadonlySet<CategoryId> = new Set(
  Object.keys(CATEGORIES) as CategoryId[]
);

/** Type guard checking if an unknown value is a supported CategoryId */
export function isValidCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && VALID_CATEGORY_IDS.has(value as CategoryId);
}

/**
 * Aesthetic palette mapped to categories for visual distribution charting.
 */
export const CATEGORY_CHART_COLORS: Record<CategoryId, string> = {
  food_dining: '#E65B3F',
  bills: '#1B1A18',
  groceries: '#2E6F54',
  electronics: '#3B5998',
  personal_care: '#8D5B4C',
  household: '#5A6B7C',
  other: '#7A756F',
};

/** Short month abbreviations */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Short weekday abbreviations */
export const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/**
 * Currency configuration with approximate conversion rates against base currency (INR).
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'INR (₹)',
    rateAgainstINR: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($)',
    rateAgainstINR: 0.012,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (€)',
    rateAgainstINR: 0.011,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'GBP (£)',
    rateAgainstINR: 0.0094,
  },
};

/** Valid currency identifiers for runtime validation */
export const VALID_CURRENCY_CODES: ReadonlySet<CurrencyCode> = new Set(
  Object.keys(CURRENCIES) as CurrencyCode[]
);

/** Type guard checking if an unknown value is a supported CurrencyCode */
export function isValidCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && VALID_CURRENCY_CODES.has(value as CurrencyCode);
}

/**
 * Default monthly budget targets per supported currency.
 */
export const DEFAULT_MONTHLY_BUDGET: Record<CurrencyCode, number> = {
  INR: 45000,
  USD: 1200,
  EUR: 1100,
  GBP: 950,
};

/**
 * Quick budget target presets displayed in Settings, expressed in each display currency.
 */
export const BUDGET_PRESETS_BY_CURRENCY: Record<CurrencyCode, number[]> = {
  INR: [25000, 35000, 45000, 50000, 60000, 75000, 100000],
  USD: [500, 800, 1000, 1200, 1500, 2000, 3000],
  EUR: [500, 750, 1000, 1100, 1500, 2000, 3000],
  GBP: [400, 600, 800, 950, 1200, 1500, 2500],
};
