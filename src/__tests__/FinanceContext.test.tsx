import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import {
  STORAGE_KEY_AMORTIZED,
  STORAGE_KEY_BUDGET,
  STORAGE_KEY_CURRENCY,
  STORAGE_KEY_TX,
} from '@/utils/storage';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FinanceProvider>{children}</FinanceProvider>
);

describe('FinanceContext integration: CRUD, budgets, classification, linking, midnight rollover, and clearAllData', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 15, 14, 0, 0)); // Nov 15, 2026 14:00 local
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('supports transaction CRUD, settled vs scheduled classification, budgets, and floating-point precision', () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    act(() => {
      result.current.setMonthlyBudget('2026-11', 10000);
      result.current.addTransaction({
        title: 'Settled Coffee',
        amount: 19.99,
        category: 'food_dining',
        date: '2026-11-10',
      });
      result.current.addTransaction({
        title: 'Today Groceries',
        amount: 10.01,
        category: 'groceries',
        date: '2026-11-15',
      });
      result.current.addTransaction({
        title: 'Future Power Bill',
        amount: 2000,
        category: 'bills',
        date: '2026-11-25',
      });
    });

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.settledCount).toBe(2);
    expect(result.current.scheduledCount).toBe(1);
    expect(result.current.settledSpentThisMonth).toBe(30); // 19.99 + 10.01 exact!
    expect(result.current.scheduledSpentThisMonth).toBe(2000);
    expect(result.current.totalSpentThisMonth).toBe(2030);
    expect(result.current.currentBudget).toBe(10000);
    expect(result.current.budgetPercentage).toBe(20); // Math.round(2030/10000 * 100)
    expect(result.current.elapsedDaysThisMonth).toBe(15);
    expect(result.current.dailySpendAverage).toBe(2); // 30 / 15 = 2
    expect(result.current.topCategory?.category).toBe('bills');

    // Update & delete
    const firstId = result.current.transactions[0].id;
    act(() => {
      result.current.updateTransaction(firstId, { amount: 2500 });
    });
    expect(result.current.totalSpentThisMonth).toBe(2530);

    act(() => {
      result.current.deleteTransaction(firstId);
    });
    expect(result.current.transactions).toHaveLength(2);
  });

  it('updates todayDateStr and reclassifies scheduled -> settled automatically after midnight', () => {
    vi.setSystemTime(new Date(2026, 10, 15, 23, 59, 55)); // 5s before midnight
    const { result } = renderHook(() => useFinance(), { wrapper });

    act(() => {
      result.current.addTransaction({
        title: 'Nov 16 Scheduled Bill',
        amount: 500,
        category: 'bills',
        date: '2026-11-16',
      });
    });

    expect(result.current.todayDateStr).toBe('2026-11-15');
    expect(result.current.scheduledCount).toBe(1);
    expect(result.current.settledCount).toBe(0);

    // Advance past midnight into Nov 16
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.todayDateStr).toBe('2026-11-16');
    expect(result.current.scheduledCount).toBe(0);
    expect(result.current.settledCount).toBe(1);
    expect(result.current.settledSpentThisMonth).toBe(500);
  });

  it('keeps linked amortized items synchronized on transaction edit and unlinks safely on delete', () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    let txId = '';
    act(() => {
      const tx = result.current.addTransaction({
        title: 'Shampoo 650ml',
        amount: 200,
        category: 'personal_care',
        date: '2026-11-01',
      });
      txId = tx.id;
    });

    act(() => {
      result.current.addAmortizedItem({
        transactionId: txId,
        name: 'Shampoo 650ml',
        totalCost: 200,
        startDate: '2026-11-01',
        endDate: '2027-01-01',
        durationMonths: 2,
        durationDays: 61,
        monthlyCost: 100,
        dailyCost: 3.28,
        category: 'personal_care',
        status: 'active',
      });
    });

    // Attempting duplicate add for same transactionId updates existing rather than duplicating
    act(() => {
      result.current.addAmortizedItem({
        transactionId: txId,
        name: 'Shampoo 650ml',
        totalCost: 200,
        startDate: '2026-11-01',
        endDate: '2027-01-01',
        durationMonths: 2,
        durationDays: 61,
        monthlyCost: 100,
        dailyCost: 3.28,
        category: 'personal_care',
        status: 'active',
      });
    });
    expect(result.current.amortizedItems).toHaveLength(1);

    // Edit transaction updates linked amortized item
    act(() => {
      result.current.updateTransaction(txId, {
        title: 'Shampoo 1L',
        amount: 400,
        date: '2026-11-05',
      });
    });

    expect(result.current.amortizedItems[0].name).toBe('Shampoo 1L');
    expect(result.current.amortizedItems[0].totalCost).toBe(400);
    expect(result.current.amortizedItems[0].monthlyCost).toBe(200);
    expect(result.current.amortizedItems[0].startDate).toBe('2026-11-05');
    expect(result.current.amortizedItems[0].endDate).toBe('2027-01-05');

    // Deleting transaction unlinks rather than leaving orphaned transactionId or deleting product
    act(() => {
      result.current.deleteTransaction(txId);
    });

    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.amortizedItems).toHaveLength(1);
    expect(result.current.amortizedItems[0].transactionId).toBeUndefined();
  });

  it('restores full backups safely and clears all persisted data on clearAllData', () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    act(() => {
      result.current.setCurrency('USD');
      result.current.setMonthlyBudget('2026-11', 50000);
      result.current.addTransaction({
        title: 'Initial Item',
        amount: 500,
        category: 'other',
        date: '2026-11-15',
      });
    });

    // Full v2 restore in merge mode preserves existing Nov budget while adding Dec budget
    act(() => {
      result.current.importBackup(
        {
          format: 'v2-full',
          skippedCount: 0,
          transactions: [
            {
              id: 'tx-imported',
              title: 'Imported Desk',
              amount: 3000,
              category: 'household',
              date: '2026-11-12',
              createdAt: 1700000000000,
            },
          ],
          amortizedItems: [
            {
              id: 'amort-imported',
              name: 'Imported Desk',
              totalCost: 3000,
              startDate: '2026-11-12',
              endDate: '2027-11-12',
              durationMonths: 12,
              durationDays: 365,
              monthlyCost: 250,
              dailyCost: 8.22,
              category: 'household',
              status: 'active',
              createdAt: 1700000000000,
            },
          ],
          monthlyBudgets: { '2026-11': 99999, '2026-12': 60000 },
          currency: 'EUR',
        },
        false
      );
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.amortizedItems).toHaveLength(1);
    expect(result.current.monthlyBudgets['2026-11']).toBe(50000); // Existing kept in merge
    expect(result.current.monthlyBudgets['2026-12']).toBe(60000); // Missing added
    expect(result.current.currency).toBe('USD'); // Merge keeps current display currency

    // Clear All Data removes transactions, budgets, amortized items, and resets currency
    act(() => {
      result.current.clearAllData();
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.amortizedItems).toEqual([]);
    expect(result.current.monthlyBudgets).toEqual({});
    expect(result.current.currency).toBe('INR');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_TX)!)).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_BUDGET)!)).toEqual({});
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_AMORTIZED)!)).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY_CURRENCY)).toBeNull();
  });
});
