import { CategoryId, CategoryMeta, CurrencyConfig } from '@/types/finance';

/**
 * Standard category definitions with associated keywords for natural language parsing.
 */
export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: {
    id: 'groceries',
    label: 'Groceries',
    keywords: ['grocery', 'groceries', 'supermarket', 'mart', 'market', 'vegetables', 'veggies', 'fruits', 'milk', 'bread', 'eggs', 'cheese', 'butter', 'oil', 'rice', 'dal', 'flour', 'spices', 'provisions'],
  },
  food_dining: {
    id: 'food_dining',
    label: 'Food & Dining',
    keywords: ['coffee', 'tea', 'cafe', 'starbucks', 'dinner', 'lunch', 'breakfast', 'brunch', 'restaurant', 'pizza', 'burger', 'swiggy', 'zomato', 'uber eats', 'doordash', 'takeout', 'bar', 'drinks', 'beer', 'bistro'],
  },
  bills: {
    id: 'bills',
    label: 'Bills & Utilities',
    keywords: ['bill', 'bills', 'electricity', 'water', 'internet', 'wifi', 'broadband', 'phone', 'recharge', 'rent', 'maintenance', 'subscription', 'netflix', 'spotify', 'prime', 'cloud', 'aws', 'gas', 'insurance'],
  },
  electronics: {
    id: 'electronics',
    label: 'Electronics',
    keywords: ['laptop', 'macbook', 'phone', 'iphone', 'android', 'ipad', 'tablet', 'monitor', 'keyboard', 'mouse', 'headphones', 'earbuds', 'cable', 'charger', 'gadget', 'tv', 'camera', 'hardware', 'drive'],
  },
  personal_care: {
    id: 'personal_care',
    label: 'Personal Care',
    keywords: ['haircut', 'salon', 'spa', 'massage', 'gym', 'fitness', 'skincare', 'perfume', 'shampoo', 'soap', 'grooming', 'medicine', 'pharmacy', 'doctor', 'dentist', 'cosmetics', 'therapy'],
  },
  household: {
    id: 'household',
    label: 'Household',
    keywords: ['furniture', 'chair', 'desk', 'decor', 'curtains', 'cleaning', 'detergent', 'laundry', 'kitchenware', 'appliances', 'tools', 'repair', 'plumbing', 'sheets', 'bedding', 'garden'],
  },
  other: {
    id: 'other',
    label: 'Other',
    keywords: ['miscellaneous', 'misc', 'gift', 'donation', 'books', 'stationery', 'travel', 'uber', 'taxi', 'fuel', 'petrol', 'flight', 'ticket', 'other'],
  },
};

/** Pre-computed array of all categories for dropdowns and filters */
export const CATEGORY_LIST = Object.values(CATEGORIES);

/**
 * Currency configuration with approximate conversion rates against base currency (INR).
 */
export const CURRENCIES: Record<string, CurrencyConfig> = {
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

/**
 * Default monthly budget targets per supported currency.
 */
export const DEFAULT_MONTHLY_BUDGET: Record<string, number> = {
  INR: 45000,
  USD: 1200,
  EUR: 1100,
  GBP: 950,
};

