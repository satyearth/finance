import { CurrencyCode } from '@/types/finance';
import { CURRENCIES } from '@/constants/categories';

/** Cached number formatters to avoid expensive instantiation on every render */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const standardFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats a given monetary amount into a localized currency string.
 *
 * @param amount - Numerical amount in base currency (INR)
 * @param currencyCode - Target currency code to display (default: 'INR')
 * @returns Formatted string with currency symbol (e.g. "₹ 1,500" or "$ 45.00")
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'INR'
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const convertedAmount = currencyCode === 'INR' ? num : num * currency.rateAgainstINR;
  const formatter = currencyCode === 'INR' ? inrFormatter : standardFormatter;

  return `${currency.symbol} ${formatter.format(convertedAmount)}`;
}

/**
 * Converts an amount in a given currency back to the base storage currency (INR).
 *
 * @param amount - Numerical amount in active currency
 * @param currencyCode - Source currency code
 * @returns Converted amount in INR rounded to 2 decimal places
 */
export function convertToBaseCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'INR'
): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  if (currencyCode === 'INR' || !amount) return amount;
  const rate = CURRENCIES[currencyCode]?.rateAgainstINR || 1;
  return Number((amount / rate).toFixed(2));
}

/**
 * Converts an amount from base currency (INR) to the active display currency.
 *
 * @param amount - Numerical amount in base INR
 * @param currencyCode - Target currency code
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertFromBaseCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'INR'
): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  if (currencyCode === 'INR' || !amount) return amount;
  const rate = CURRENCIES[currencyCode]?.rateAgainstINR || 1;
  return Number((amount * rate).toFixed(2));
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable date.
 *
 * @param dateString - ISO date string (e.g. "2026-09-15")
 * @returns Formatted date string (e.g. "Sep 15, 2026")
 */
export function formatDate(dateString?: string): string {
  if (!dateString || typeof dateString !== 'string') return '';
  try {
    const parts = dateString.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return dateString;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString || '';
  }
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a full day description.
 *
 * @param dateString - ISO date string (e.g. "2026-09-15")
 * @returns Formatted string (e.g. "Tuesday, September 15, 2026")
 */
export function formatFullDate(dateString?: string): string {
  if (!dateString || typeof dateString !== 'string') return '';
  try {
    const parts = dateString.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return dateString;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString || '';
  }
}

/**
 * Generates a full month-year label from a 0-indexed month and year.
 *
 * @param year - 4-digit year (e.g. 2026)
 * @param monthIndex - 0-indexed month (0 = January, 11 = December)
 * @returns Formatted string (e.g. "September 2026")
 */
export function getMonthYearLabel(year: number, monthIndex: number): string {
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns today's date formatted as an ISO date string (YYYY-MM-DD).
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current month key formatted as "YYYY-MM".
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Adds a given number of months to an ISO date string (YYYY-MM-DD),
 * safely handling month overflows and leap years.
 *
 * @param dateStr - Base ISO date string
 * @param monthsToAdd - Number of calendar months to add
 * @returns Projected finish date string
 */
export function addMonthsToDate(dateStr?: string, monthsToAdd: number = 0): string {
  if (!dateStr || typeof dateStr !== 'string') return getTodayDateString();
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts;
    const targetDate = new Date(y, m - 1 + monthsToAdd, d);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr || getTodayDateString();
  }
}

/**
 * Calculates calendar days difference between two ISO date strings (YYYY-MM-DD).
 *
 * @param startStr - Start date string
 * @param endStr - End date string
 * @returns Number of days (minimum 1)
 */
export function calculateDaysDifference(startStr?: string, endStr?: string): number {
  if (!startStr || !endStr) return 30;
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return 30;
  }
}
