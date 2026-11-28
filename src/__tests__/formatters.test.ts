import { describe, it, expect } from 'vitest';
import {
  addDaysToDate,
  addMonthsToDate,
  calculateDaysDifference,
  compareISODates,
  convertFromBaseCurrency,
  convertToBaseCurrency,
  formatCurrency,
  formatDate,
  formatDisplayAmount,
  formatFullDate,
  formatLocalDateISO,
  isValidISODate,
  isValidMonthKey,
  parseLocalDate,
  roundCurrency,
  sumCurrency,
} from '@/utils/formatters';
import { getSampleDateStr } from '@/utils/sampleData';

describe('Currency formatting, precision, and conversion', () => {
  it('rounds floating-point edge cases cleanly and prevents -0', () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(roundCurrency(-0.000001)).toBe(0);
    expect(Object.is(roundCurrency(-0), -0)).toBe(false);
    expect(roundCurrency(1234.567)).toBe(1234.57);
    expect(roundCurrency(NaN)).toBe(0);
    expect(roundCurrency(Infinity)).toBe(0);
  });

  it('sums currency amounts in minor units without IEEE-754 accumulation drift', () => {
    expect(sumCurrency([0.1, 0.2, 19.99, 10.01])).toBe(30.3);
    expect(sumCurrency([833.33, 1666.67, 0.01])).toBe(2500.01);
  });

  it('formats base INR amounts into supported currencies', () => {
    expect(formatCurrency(125000, 'INR')).toBe('₹ 1,25,000');
    expect(formatCurrency(1000, 'USD')).toBe('$ 12');
    expect(formatCurrency(1000, 'EUR')).toBe('€ 11');
    expect(formatCurrency(1000, 'GBP')).toBe('£ 9.4');
    expect(formatCurrency(NaN, 'INR')).toBe('₹ 0');
    expect(formatCurrency(-0.001, 'USD')).toBe('$ 0');
  });

  it('formats already-converted display amounts without double conversion', () => {
    expect(formatDisplayAmount(100, 'USD')).toBe('$ 100');
    expect(formatDisplayAmount(45000, 'INR')).toBe('₹ 45,000');
    expect(formatDisplayAmount(75.5, 'EUR')).toBe('€ 75.5');
  });

  it('converts between display currencies and base INR accurately', () => {
    const baseFromUsd = convertToBaseCurrency(120, 'USD');
    expect(baseFromUsd).toBe(10000);
    expect(convertFromBaseCurrency(baseFromUsd, 'USD')).toBe(120);

    const baseFromEur = convertToBaseCurrency(110, 'EUR');
    expect(baseFromEur).toBe(10000);
    expect(convertFromBaseCurrency(baseFromEur, 'EUR')).toBe(110);

    expect(convertToBaseCurrency(NaN, 'USD')).toBe(0);
    expect(convertFromBaseCurrency(Infinity, 'GBP')).toBe(0);
  });
});

describe('Local calendar date and timezone handling', () => {
  it('validates real calendar ISO dates and rejects invalid calendar dates', () => {
    expect(isValidISODate('2026-11-28')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true); // Leap year
    expect(isValidISODate('2026-02-29')).toBe(false); // Non-leap year
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-04-31')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-9-5')).toBe(false);
    expect(isValidISODate('invalid')).toBe(false);
  });

  it('validates month keys strictly', () => {
    expect(isValidMonthKey('2026-01')).toBe(true);
    expect(isValidMonthKey('2026-12')).toBe(true);
    expect(isValidMonthKey('2026-00')).toBe(false);
    expect(isValidMonthKey('2026-13')).toBe(false);
    expect(isValidMonthKey('2026-1')).toBe(false);
  });

  it('parses YYYY-MM-DD strictly in local timezone without UTC off-by-one shift', () => {
    const d = parseLocalDate('2026-09-15');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(8);
    expect(d?.getDate()).toBe(15);
    expect(formatLocalDateISO(d!)).toBe('2026-09-15');
    expect(formatDate('2026-09-15')).toBe('Sep 15, 2026');
    expect(formatFullDate('2026-09-15')).toContain('September 15, 2026');
  });

  it('clamps month-end overflow safely in addMonthsToDate', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonthsToDate('2026-03-31', 1)).toBe('2026-04-30');
    expect(addMonthsToDate('2026-11-15', 2)).toBe('2027-01-15');
  });

  it('computes exact calendar day differences across DST boundaries and leap years', () => {
    expect(calculateDaysDifference('2026-03-01', '2026-04-01')).toBe(31); // Crosses US DST spring-forward
    expect(calculateDaysDifference('2026-11-01', '2026-12-01')).toBe(30); // Crosses US DST fall-back
    expect(calculateDaysDifference('2024-02-01', '2024-03-01')).toBe(29); // Leap year Feb
    expect(calculateDaysDifference('2026-05-10', '2026-05-10')).toBe(1);  // Minimum 1 day
    expect(addDaysToDate('2026-02-28', 1)).toBe('2026-03-01');
    expect(compareISODates('2026-03-01', '2026-02-28')).toBeGreaterThan(0);
  });

  it('clamps sample data dates cleanly on short months', () => {
    const janAnchor = new Date(2026, 0, 15);
    expect(getSampleDateStr(31, 1, janAnchor)).toBe('2026-02-28');
    expect(getSampleDateStr(31, 3, janAnchor)).toBe('2026-04-30');
    const leapAnchor = new Date(2024, 0, 15);
    expect(getSampleDateStr(31, 1, leapAnchor)).toBe('2024-02-29');
  });
});
