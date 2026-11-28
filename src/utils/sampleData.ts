import { Transaction, AmortizedItem } from '@/types/finance';
import { calculateDaysDifference, formatLocalDateISO, roundCurrency } from '@/utils/formatters';

/**
 * Generates an ISO date string (YYYY-MM-DD) dynamically anchored to the target month,
 * clamping day-of-month safely to prevent month-end date overflow issues.
 *
 * @param day - Target day of month (1-31)
 * @param monthOffset - Optional month offset (0 = current month, -1 = previous, +1 = next)
 * @param referenceDate - Optional anchor date (defaults to current date)
 */
export function getSampleDateStr(
  day: number,
  monthOffset: number = 0,
  referenceDate: Date = new Date()
): string {
  const firstOfTargetMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + monthOffset,
    1
  );
  const year = firstOfTargetMonth.getFullYear();
  const month = firstOfTargetMonth.getMonth();
  const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.max(1, Math.min(day, daysInTargetMonth));
  return formatLocalDateISO(new Date(year, month, clampedDay));
}

/**
 * Generates initial realistic transactions with a mix of settled daily expenses
 * and scheduled recurring utility bills for the current month.
 */
export function generateSampleTransactions(referenceDate: Date = new Date()): Transaction[] {
  const createdAnchor = referenceDate.getTime();
  return [
    // Day 1 (Settled)
    {
      id: 'tx-01',
      title: 'Blue Tokai Espresso & Croissant',
      amount: 340,
      category: 'food_dining',
      date: getSampleDateStr(1, 0, referenceDate),
      notes: 'Morning coffee catchup with team',
      createdAt: createdAnchor - 3 * 86400000,
    },
    {
      id: 'tx-02',
      title: "Nature's Basket Organic Veggies & Fruits",
      amount: 1450,
      category: 'groceries',
      date: getSampleDateStr(1, 0, referenceDate),
      notes: 'Weekly fresh vegetables and organic berries',
      createdAt: createdAnchor - 3 * 86400000 + 3600000,
    },

    // Day 2 (Settled)
    {
      id: 'tx-03',
      title: 'Airtel Xstream Fiber Broadband',
      amount: 1179,
      category: 'bills',
      date: getSampleDateStr(2, 0, referenceDate),
      notes: 'Monthly 300 Mbps unlimited fiber internet',
      createdAt: createdAnchor - 2 * 86400000,
    },
    {
      id: 'tx-04',
      title: 'Cult.fit Elite Gym Membership',
      amount: 2499,
      category: 'personal_care',
      date: getSampleDateStr(2, 0, referenceDate),
      notes: 'Monthly gym and fitness pass renewal',
      createdAt: createdAnchor - 2 * 86400000 + 3600000,
    },
    {
      id: 'tx-05',
      title: 'Artisan Sourdough, Milk & Eggs Delivery',
      amount: 480,
      category: 'groceries',
      date: getSampleDateStr(2, 0, referenceDate),
      notes: 'Country Delight doorstep morning delivery',
      createdAt: createdAnchor - 2 * 86400000 + 7200000,
    },

    // Day 3 (Settled)
    {
      id: 'tx-06',
      title: 'Swiggy Gourmet Dinner & Artisan Pizza',
      amount: 820,
      category: 'food_dining',
      date: getSampleDateStr(3, 0, referenceDate),
      notes: 'Late evening dinner delivery',
      createdAt: createdAnchor - 86400000,
    },
    {
      id: 'tx-07',
      title: 'Logitech MX Master 3S Ergonomic Mouse',
      amount: 8995,
      category: 'electronics',
      date: getSampleDateStr(3, 0, referenceDate),
      notes: 'Productivity upgrade for developer desk',
      createdAt: createdAnchor - 86400000 + 3600000,
    },
    {
      id: 'tx-08',
      title: 'IKEA Tertial Work Lamp & Studio Planter',
      amount: 1890,
      category: 'household',
      date: getSampleDateStr(3, 0, referenceDate),
      notes: 'Desk lighting & studio decor',
      createdAt: createdAnchor - 86400000 + 7200000,
    },

    // Day 4 (Settled)
    {
      id: 'tx-09',
      title: 'Supermarket Grocery Stockup',
      amount: 4230,
      category: 'groceries',
      date: getSampleDateStr(4, 0, referenceDate),
      notes: 'Monthly staples, dry fruits, grains and cleaning items',
      createdAt: createdAnchor - 14400000,
    },
    {
      id: 'tx-10',
      title: 'Uber Premier Ride to Client Meeting',
      amount: 720,
      category: 'other',
      date: getSampleDateStr(4, 0, referenceDate),
      notes: 'City center client presentation commute',
      createdAt: createdAnchor - 10800000,
    },
    {
      id: 'tx-11',
      title: 'Specialty Pourover Coffee Beans (250g)',
      amount: 620,
      category: 'food_dining',
      date: getSampleDateStr(4, 0, referenceDate),
      notes: 'Ethiopian single-origin light roast',
      createdAt: createdAnchor - 7200000,
    },
    {
      id: 'tx-12',
      title: "Kiehl's Ultra Facial Hydrating Cream",
      amount: 2850,
      category: 'personal_care',
      date: getSampleDateStr(4, 0, referenceDate),
      notes: 'Dermatological skincare replenishment',
      createdAt: createdAnchor - 3600000,
    },
    {
      id: 'tx-13',
      title: 'Anker Braided Thunderbolt 4 Cable',
      amount: 1699,
      category: 'electronics',
      date: getSampleDateStr(4, 0, referenceDate),
      notes: 'High speed display and charging cable',
      createdAt: createdAnchor,
    },

    // Future / Scheduled Utility Bills & Subscriptions
    {
      id: 'tx-14',
      title: 'Tata Power Electricity Bill',
      amount: 3820,
      category: 'bills',
      date: getSampleDateStr(5, 0, referenceDate),
      notes: 'Scheduled: Monthly billing cycle power utility',
      createdAt: createdAnchor,
    },
    {
      id: 'tx-15',
      title: 'Spotify Family Hi-Fi Subscription',
      amount: 299,
      category: 'bills',
      date: getSampleDateStr(10, 0, referenceDate),
      notes: 'Scheduled: Monthly audio streaming renewal',
      createdAt: createdAnchor,
    },
    {
      id: 'tx-16',
      title: 'Netflix Premium 4K Ultra HD Plan',
      amount: 649,
      category: 'bills',
      date: getSampleDateStr(15, 0, referenceDate),
      notes: 'Scheduled: Monthly streaming subscription autopay',
      createdAt: createdAnchor,
    },
    {
      id: 'tx-17',
      title: 'AWS Cloud Hosting & Domain Infrastructure',
      amount: 1850,
      category: 'bills',
      date: getSampleDateStr(20, 0, referenceDate),
      notes: 'Scheduled: Production web servers and DNS',
      createdAt: createdAnchor,
    },
    {
      id: 'tx-18',
      title: 'Amazon Prime Annual Membership',
      amount: 1499,
      category: 'bills',
      date: getSampleDateStr(24, 0, referenceDate),
      notes: 'Scheduled: Prime shipping and streaming annual autopay',
      createdAt: createdAnchor,
    },
    {
      id: 'tx-19',
      title: 'MGL Piped Natural Gas Utility',
      amount: 780,
      category: 'bills',
      date: getSampleDateStr(28, 0, referenceDate),
      notes: 'Scheduled: Domestic kitchen gas meter invoice',
      createdAt: createdAnchor,
    },
  ];
}

/**
 * Generates initial sample product lifespan items showcasing daily & monthly amortization.
 */
export function generateSampleAmortizedItems(referenceDate: Date = new Date()): AmortizedItem[] {
  const createdAnchor = referenceDate.getTime();
  const s1 = getSampleDateStr(3, 0, referenceDate);
  const e1 = getSampleDateStr(4, 2, referenceDate);
  const d1 = calculateDaysDifference(s1, e1);

  const s2 = getSampleDateStr(1, -2, referenceDate);
  const e2 = getSampleDateStr(1, 1, referenceDate);
  const d2 = calculateDaysDifference(s2, e2);

  const s3 = getSampleDateStr(15, -4, referenceDate);
  const e3 = getSampleDateStr(15, 2, referenceDate);
  const d3 = calculateDaysDifference(s3, e3);

  return [
    {
      id: 'amort-01',
      name: 'Sunsilk Keratin Smooth Shampoo (650ml)',
      totalCost: 200,
      startDate: s1,
      endDate: e1,
      durationMonths: 2,
      durationDays: d1,
      monthlyCost: roundCurrency(200 / 2),
      dailyCost: roundCurrency(200 / d1),
      category: 'personal_care',
      notes: 'Lasts 2 months between current and next 2 months (~₹100/mo)',
      status: 'active',
      createdAt: createdAnchor - 86400000,
    },
    {
      id: 'amort-02',
      name: 'Optimum Nutrition Gold Standard Whey (1kg)',
      totalCost: 2400,
      startDate: s2,
      endDate: e2,
      durationMonths: 3,
      durationDays: d2,
      monthlyCost: roundCurrency(2400 / 3),
      dailyCost: roundCurrency(2400 / d2),
      category: 'groceries',
      notes: 'Daily post-workout scoop across 3 months',
      status: 'active',
      createdAt: createdAnchor - 60 * 86400000,
    },
    {
      id: 'amort-03',
      name: 'Dior Sauvage Eau De Parfum (100ml)',
      totalCost: 4500,
      startDate: s3,
      endDate: e3,
      durationMonths: 6,
      durationDays: d3,
      monthlyCost: roundCurrency(4500 / 6),
      dailyCost: roundCurrency(4500 / d3),
      category: 'personal_care',
      notes: 'Signature daily fragrance lasting 6 months',
      status: 'active',
      createdAt: createdAnchor - 120 * 86400000,
    },
  ];
}
