import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAndMigrateStorage,
  STORAGE_KEY_AMORTIZED,
  STORAGE_KEY_BUDGET,
  STORAGE_KEY_CURRENCY,
  STORAGE_KEY_MIGRATED,
  STORAGE_KEY_TX,
} from '@/utils/storage';
import { generateSampleAmortizedItems, generateSampleTransactions } from '@/utils/sampleData';

describe('Storage migration, corruption recovery, and link healing', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes clean empty state for brand new users', () => {
    const snap = loadAndMigrateStorage(window.localStorage, '2026-11-28');
    expect(snap.transactions).toEqual([]);
    expect(snap.monthlyBudgets).toEqual({});
    expect(snap.amortizedItems).toEqual([]);
    expect(snap.currency).toBe('INR');
    expect(snap.hadCorruptData).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY_MIGRATED)).toBe('1');
  });

  it('never deletes legitimate user ₹45,000 budgets during migration', () => {
    window.localStorage.setItem(
      STORAGE_KEY_TX,
      JSON.stringify([
        {
          id: 'tx-user-1',
          title: 'Rent',
          amount: 20000,
          category: 'bills',
          date: '2026-11-01',
          createdAt: 1700000000000,
        },
      ])
    );
    window.localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify({ '2026-11': 45000 }));
    // Simulate pre-migration state where STORAGE_KEY_MIGRATED is unset
    const snap = loadAndMigrateStorage(window.localStorage, '2026-11-28');

    expect(snap.transactions).toHaveLength(1);
    expect(snap.monthlyBudgets).toEqual({ '2026-11': 45000 });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_BUDGET)!)).toEqual({
      '2026-11': 45000,
    });
  });

  it('clears legacy auto-seeded sample transactions and auto-seeded 45000 budget when workspace is pure legacy demo', () => {
    window.localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(generateSampleTransactions()));
    window.localStorage.setItem(
      STORAGE_KEY_AMORTIZED,
      JSON.stringify(generateSampleAmortizedItems())
    );
    window.localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify({ '2026-11': 45000 }));

    const snap = loadAndMigrateStorage(window.localStorage, '2026-11-28');
    expect(snap.transactions).toEqual([]);
    expect(snap.amortizedItems).toEqual([]);
    expect(snap.monthlyBudgets).toEqual({});
  });

  it('recovers gracefully from corrupted localStorage JSON without throwing', () => {
    window.localStorage.setItem(STORAGE_KEY_TX, '{corrupted json');
    window.localStorage.setItem(STORAGE_KEY_BUDGET, '["not","an","object"]');
    window.localStorage.setItem(STORAGE_KEY_AMORTIZED, 'null');
    window.localStorage.setItem(STORAGE_KEY_CURRENCY, 'INVALID_CURRENCY');

    const snap = loadAndMigrateStorage(window.localStorage, '2026-11-28');
    expect(snap.hadCorruptData).toBe(true);
    expect(snap.transactions).toEqual([]);
    expect(snap.monthlyBudgets).toEqual({});
    expect(snap.amortizedItems).toEqual([]);
    expect(snap.currency).toBe('INR');
  });

  it('heals orphaned amortized transactionId references while preserving the product item', () => {
    window.localStorage.setItem(STORAGE_KEY_MIGRATED, '1');
    window.localStorage.setItem(STORAGE_KEY_TX, JSON.stringify([]));
    window.localStorage.setItem(
      STORAGE_KEY_AMORTIZED,
      JSON.stringify([
        {
          id: 'amort-orphan',
          transactionId: 'deleted-tx-999',
          name: 'Perfume',
          totalCost: 3000,
          startDate: '2026-11-01',
          endDate: '2027-05-01',
          durationMonths: 6,
          category: 'personal_care',
          status: 'active',
          createdAt: 1700000000000,
        },
      ])
    );

    const snap = loadAndMigrateStorage(window.localStorage, '2026-11-28');
    expect(snap.amortizedItems).toHaveLength(1);
    expect(snap.amortizedItems[0].transactionId).toBeUndefined();
    expect(snap.amortizedItems[0].name).toBe('Perfume');
  });
});
