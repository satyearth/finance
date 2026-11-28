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

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Rounds a monetary value cleanly to 2 decimal places, normalizing -0 to 0
 * and mitigating IEEE-754 floating-point precision drift.
 */
export function roundCurrency(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const rounded = (sign * Math.round((Math.abs(value) + Number.EPSILON) * 100)) / 100;
  return Math.abs(rounded) < 1e-9 ? 0 : rounded;
}

/**
 * Sums monetary amounts in integer minor units (paise/cents) to avoid
 * floating-point accumulation errors across multiple line items.
 */
export function sumCurrency(values: number[]): number {
  let totalMinor = 0;
  for (const val of values) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      totalMinor += Math.round(val * 100);
    }
  }
  return roundCurrency(totalMinor / 100);
}

/**
 * Formats an amount already expressed in the active display currency.
 */
export function formatDisplayAmount(
  amountInCurrency: number,
  currencyCode: CurrencyCode = 'INR'
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const safeNum = roundCurrency(amountInCurrency);
  const formatter = currencyCode === 'INR' ? inrFormatter : standardFormatter;
  return `${currency.symbol} ${formatter.format(safeNum)}`;
}

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
  const num = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const convertedAmount =
    currencyCode === 'INR' ? roundCurrency(num) : roundCurrency(num * currency.rateAgainstINR);
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
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 0;
  if (currencyCode === 'INR' || !amount) return roundCurrency(amount);
  const rate = CURRENCIES[currencyCode]?.rateAgainstINR || 1;
  return roundCurrency(amount / rate);
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
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 0;
  if (currencyCode === 'INR' || !amount) return roundCurrency(amount);
  const rate = CURRENCIES[currencyCode]?.rateAgainstINR || 1;
  return roundCurrency(amount * rate);
}

/**
 * Validates that a value is a real calendar date string in YYYY-MM-DD format.
 */
export function isValidISODate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false;
  const match = ISO_DATE_REGEX.exec(dateStr.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Validates that a string is a valid YYYY-MM month key.
 */
export function isValidMonthKey(key: unknown): key is string {
  return typeof key === 'string' && MONTH_KEY_REGEX.test(key);
}

/**
 * Parses an ISO date string (YYYY-MM-DD) strictly in the local timezone
 * to avoid UTC-midnight off-by-one date shifts.
 */
export function parseLocalDate(dateString?: string): Date | null {
  if (!isValidISODate(dateString)) return null;
  const [year, month, day] = dateString.trim().split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date instance into a local YYYY-MM-DD string.
 */
export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compares two YYYY-MM-DD date strings chronologically in local calendar space.
 */
export function compareISODates(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  if (da && db) {
    return da.getTime() - db.getTime();
  }
  return a.localeCompare(b);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable date.
 *
 * @param dateString - ISO date string (e.g. "2026-09-15")
 * @returns Formatted date string (e.g. "Sep 15, 2026")
 */
export function formatDate(dateString?: string): string {
  if (!dateString || typeof dateString !== 'string') return '';
  const date = parseLocalDate(dateString);
  if (!date) return dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a full day description.
 *
 * @param dateString - ISO date string (e.g. "2026-09-15")
 * @returns Formatted string (e.g. "Tuesday, September 15, 2026")
 */
export function formatFullDate(dateString?: string): string {
  if (!dateString || typeof dateString !== 'string') return '';
  const date = parseLocalDate(dateString);
  if (!date) return dateString;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
 * Returns today's date formatted as a local ISO date string (YYYY-MM-DD).
 */
export function getTodayDateString(now: Date = new Date()): string {
  return formatLocalDateISO(now);
}

/**
 * Returns the current month key formatted as "YYYY-MM" in local time.
 */
export function getCurrentMonthKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Adds a given number of months to an ISO date string (YYYY-MM-DD),
 * clamping month-end days safely (e.g. Jan 31 + 1 mo -> Feb 28/29).
 *
 * @param dateStr - Base ISO date string
 * @param monthsToAdd - Number of calendar months to add
 * @returns Projected finish date string
 */
export function addMonthsToDate(dateStr?: string, monthsToAdd: number = 0): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr && typeof dateStr === 'string' && dateStr.trim() ? dateStr : getTodayDateString();
  const y = parsed.getFullYear();
  const m = parsed.getMonth();
  const d = parsed.getDate();

  const targetMonthLastDay = new Date(y, m + monthsToAdd + 1, 0).getDate();
  const clampedDay = Math.min(d, targetMonthLastDay);
  const targetDate = new Date(y, m + monthsToAdd, clampedDay);
  return formatLocalDateISO(targetDate);
}

/**
 * Adds a given number of calendar days to an ISO date string (YYYY-MM-DD) in local time.
 */
export function addDaysToDate(dateStr?: string, daysToAdd: number = 0): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return getTodayDateString();
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + daysToAdd);
  return formatLocalDateISO(target);
}

/**
 * Calculates calendar days difference between two ISO date strings (YYYY-MM-DD),
 * using UTC calendar coordinates so DST transitions never cause off-by-one drift.
 *
 * @param startStr - Start date string
 * @param endStr - End date string
 * @returns Number of days (minimum 1)
 */
export function calculateDaysDifference(startStr?: string, endStr?: string): number {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (!start || !end) return 30;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((endUtc - startUtc) / 86400000);
  return Math.max(1, diffDays);
}
