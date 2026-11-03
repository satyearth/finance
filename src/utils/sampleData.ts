import { Transaction, AmortizedItem } from '@/types/finance';

/**
 * Generates an ISO date string (YYYY-MM-DD) dynamically anchored to the current month.
 *
 * @param day - Target day of month (1-31)
 * @param monthOffset - Optional month offset (0 = current month, -1 = previous, +1 = next)
 */
function getSampleDateStr(day: number, monthOffset: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
}

/**
 * Generates initial realistic transactions with a mix of settled daily expenses
 * and scheduled recurring utility bills for the current month.
 */
export function generateSampleTransactions(): Transaction[] {
  return [
    // Day 1 (Settled)
    {
      id: 'tx-01',
      title: 'Blue Tokai Espresso & Croissant',
      amount: 340,
      category: 'food_dining',
      date: getSampleDateStr(1),
      notes: 'Morning coffee catchup with team',
      createdAt: Date.now() - 3 * 86400000,
    },

    {
      id: 'tx-02',
      title: "Nature's Basket Organic Veggies & Fruits",
      amount: 1450,
      category: 'groceries',
      date: getSampleDateStr(1),
      notes: 'Weekly fresh vegetables and organic berries',
      createdAt: Date.now() - 3 * 86400000 + 3600000,
    },

    // Day 2 (Settled)
    {
      id: 'tx-03',
      title: 'Airtel Xstream Fiber Broadband',
      amount: 1179,
      category: 'bills',
      date: getSampleDateStr(2),
      notes: 'Monthly 300 Mbps unlimited fiber internet',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx-04',
      title: 'Cult.fit Elite Gym Membership',
      amount: 2499,
      category: 'personal_care',
      date: getSampleDateStr(2),
      notes: 'Monthly gym and fitness pass renewal',
      createdAt: Date.now() - 2 * 86400000 + 3600000,
    },
    {
      id: 'tx-05',
      title: 'Artisan Sourdough, Milk & Eggs Delivery',
      amount: 480,
      category: 'groceries',
      date: getSampleDateStr(2),
      notes: 'Country Delight doorstep morning delivery',
      createdAt: Date.now() - 2 * 86400000 + 7200000,
    },

    // Day 3 (Settled)
    {
      id: 'tx-06',
      title: 'Swiggy Gourmet Dinner & Artisan Pizza',
      amount: 820,
      category: 'food_dining',
      date: getSampleDateStr(3),
      notes: 'Late evening dinner delivery',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'tx-07',
      title: 'Logitech MX Master 3S Ergonomic Mouse',
      amount: 8995,
      category: 'electronics',
      date: getSampleDateStr(3),
      notes: 'Productivity upgrade for developer desk',
      createdAt: Date.now() - 86400000 + 3600000,
    },
    {
      id: 'tx-08',
      title: 'IKEA Tertial Work Lamp & Studio Planter',
      amount: 1890,
      category: 'household',
      date: getSampleDateStr(3),
      notes: 'Desk lighting & studio decor',
      createdAt: Date.now() - 86400000 + 7200000,
    },

    // Day 4 (Today - Settled)
    {
      id: 'tx-09',
      title: 'Supermarket Grocery Stockup',
      amount: 4230,
      category: 'groceries',
      date: getSampleDateStr(4),
      notes: 'Monthly staples, dry fruits, grains and cleaning items',
      createdAt: Date.now() - 14400000,
    },
    {
      id: 'tx-10',
      title: 'Uber Premier Ride to Client Meeting',
      amount: 720,
      category: 'other',
      date: getSampleDateStr(4),
      notes: 'City center client presentation commute',
      createdAt: Date.now() - 10800000,
    },
    {
      id: 'tx-11',
      title: 'Specialty Pourover Coffee Beans (250g)',
      amount: 620,
      category: 'food_dining',
      date: getSampleDateStr(4),
      notes: 'Ethiopian single-origin light roast',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'tx-12',
      title: "Kiehl's Ultra Facial Hydrating Cream",
      amount: 2850,
      category: 'personal_care',
      date: getSampleDateStr(4),
      notes: 'Dermatological skincare replenishment',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'tx-13',
      title: 'Anker Braided Thunderbolt 4 Cable',
      amount: 1699,
      category: 'electronics',
      date: getSampleDateStr(4),
      notes: 'High speed display and charging cable',
      createdAt: Date.now(),
    },

    // Future Dates: Strictly Recurring Utility Bills & Subscriptions ONLY
    {
      id: 'tx-14',
      title: 'Tata Power Electricity Bill',
      amount: 3820,
      category: 'bills',
      date: getSampleDateStr(5),
      notes: 'Scheduled: August billing cycle power utility',
      createdAt: Date.now(),
    },
    {
      id: 'tx-15',
      title: 'Spotify Family Hi-Fi Subscription',
      amount: 299,
      category: 'bills',
      date: getSampleDateStr(10),
      notes: 'Scheduled: Monthly audio streaming renewal',
      createdAt: Date.now(),
    },
    {
      id: 'tx-16',
      title: 'Netflix Premium 4K Ultra HD Plan',
      amount: 649,
      category: 'bills',
      date: getSampleDateStr(15),
      notes: 'Scheduled: Monthly streaming subscription autopay',
      createdAt: Date.now(),
    },
    {
      id: 'tx-17',
      title: 'AWS Cloud Hosting & Domain Infrastructure',
      amount: 1850,
      category: 'bills',
      date: getSampleDateStr(20),
      notes: 'Scheduled: Production web servers and DNS',
      createdAt: Date.now(),
    },
    {
      id: 'tx-18',
      title: 'Amazon Prime Annual Membership',
      amount: 1499,
      category: 'bills',
      date: getSampleDateStr(24),
      notes: 'Scheduled: Prime shipping and streaming annual autopay',
      createdAt: Date.now(),
    },
    {
      id: 'tx-19',
      title: 'MGL Piped Natural Gas Utility',
      amount: 780,
      category: 'bills',
      date: getSampleDateStr(28),
      notes: 'Scheduled: Domestic kitchen gas meter invoice',
      createdAt: Date.now(),
    },
  ];
}

/**
 * Generates initial sample product lifespan items showcasing daily & monthly amortization.
 */
export function generateSampleAmortizedItems(): AmortizedItem[] {
  return [
    {
      id: 'amort-01',
      name: 'Sunsilk Keratin Smooth Shampoo (650ml)',
      totalCost: 200,
      startDate: getSampleDateStr(3, 0),
      endDate: getSampleDateStr(4, 2),
      durationMonths: 2,
      durationDays: 62,
      monthlyCost: 100,
      dailyCost: 3.23,
      category: 'personal_care',
      notes: 'Lasts 2 months between current and next 2 months (~₹100/mo)',
      status: 'active',
      createdAt: Date.now() - 86400000,
    },

    {
      id: 'amort-02',
      name: 'Optimum Nutrition Gold Standard Whey (1kg)',
      totalCost: 2400,
      startDate: getSampleDateStr(1, -2),
      endDate: getSampleDateStr(1, 1),
      durationMonths: 3,
      durationDays: 92,
      monthlyCost: 800,
      dailyCost: 26.09,
      category: 'groceries',
      notes: 'Daily post-workout scoop across 3 months',
      status: 'active',
      createdAt: Date.now() - 60 * 86400000,
    },
    {
      id: 'amort-03',
      name: 'Dior Sauvage Eau De Parfum (100ml)',
      totalCost: 4500,
      startDate: getSampleDateStr(15, -4),
      endDate: getSampleDateStr(15, 2),
      durationMonths: 6,
      durationDays: 183,
      monthlyCost: 750,
      dailyCost: 24.59,
      category: 'personal_care',
      notes: 'Signature daily fragrance lasting 6 months',
      status: 'active',
      createdAt: Date.now() - 120 * 86400000,
    },
  ];
}

export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = generateSampleTransactions();
export const INITIAL_SAMPLE_AMORTIZED_ITEMS: AmortizedItem[] = generateSampleAmortizedItems();
