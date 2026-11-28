import {
  AmortizedItem,
  CurrencyCode,
  Transaction,
} from '@/types/finance';
import { isValidCategoryId, isValidCurrencyCode } from '@/constants/categories';
import {
  calculateDaysDifference,
  compareISODates,
  getTodayDateString,
  isValidISODate,
  isValidMonthKey,
  roundCurrency,
} from '@/utils/formatters';
import { generateId } from '@/utils/id';

/** LocalStorage persistence keys (preserved for 100% backward compatibility) */
export const STORAGE_KEY_TX = 'satyfinance_transactions_v2';
export const STORAGE_KEY_BUDGET = 'satyfinance_budgets_v2';
export const STORAGE_KEY_CURRENCY = 'satyfinance_currency_v2';
export const STORAGE_KEY_AMORTIZED = 'satyfinance_amortized_v2';
export const STORAGE_KEY_MIGRATED = 'satyfinance_demo_cleared_v1';

/** Canonical IDs from legacy sample data seeding — used for safe one-time migration */
export const SAMPLE_TX_IDS = new Set([
  'tx-01', 'tx-02', 'tx-03', 'tx-04', 'tx-05', 'tx-06', 'tx-07', 'tx-08', 'tx-09',
  'tx-10', 'tx-11', 'tx-12', 'tx-13', 'tx-14', 'tx-15', 'tx-16', 'tx-17', 'tx-18', 'tx-19',
]);
export const SAMPLE_AMORT_IDS = new Set(['amort-01', 'amort-02', 'amort-03']);

export interface StorageSnapshot {
  transactions: Transaction[];
  monthlyBudgets: Record<string, number>;
  currency: CurrencyCode;
  amortizedItems: AmortizedItem[];
  hadCorruptData: boolean;
}

export interface SanitizeResult<T> {
  items: T[];
  skippedCount: number;
}

/** Returns true when every entry in the raw list is a known legacy sample transaction */
export function isAllSampleData(txs: unknown[]): boolean {
  return (
    txs.length > 0 &&
    txs.every(
      (t) =>
        Boolean(t) &&
        typeof t === 'object' &&
        typeof (t as { id?: unknown }).id === 'string' &&
        SAMPLE_TX_IDS.has((t as { id: string }).id)
    )
  );
}

/** Returns true when every entry in the raw list is a known legacy sample amortized item */
export function isAllSampleAmortized(items: unknown[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (a) =>
        Boolean(a) &&
        typeof a === 'object' &&
        typeof (a as { id?: unknown }).id === 'string' &&
        SAMPLE_AMORT_IDS.has((a as { id: string }).id)
    )
  );
}

/**
 * Validates and normalizes a single unknown transaction object.
 * Returns null if required fields (title, finite positive amount, valid date) are invalid.
 */
export function sanitizeTransactionRecord(
  raw: unknown,
  options?: { allowMissingDateFallback?: string; allowZeroAmount?: boolean }
): Transaction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.title !== 'string') return null;
  const cleanTitle = obj.title.trim();
  if (!cleanTitle) return null;

  const amountNum =
    typeof obj.amount === 'number'
      ? obj.amount
      : typeof obj.amount === 'string' && obj.amount.trim() !== ''
      ? Number(obj.amount.replace(/,/g, ''))
      : NaN;

  if (!Number.isFinite(amountNum)) return null;
  if (options?.allowZeroAmount ? amountNum < 0 : amountNum <= 0) return null;

  let cleanDate: string | null = null;
  if (typeof obj.date === 'string' && obj.date.trim() !== '') {
    const trimmedDate = obj.date.trim();
    if (!isValidISODate(trimmedDate)) return null;
    cleanDate = trimmedDate;
  } else if (obj.date === undefined && options?.allowMissingDateFallback) {
    cleanDate = options.allowMissingDateFallback;
  } else {
    return null;
  }

  const cleanId =
    typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : generateId('tx');
  const cleanCategory = isValidCategoryId(obj.category) ? obj.category : 'other';
  const cleanNotes =
    typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes.trim() : undefined;
  const cleanCreatedAt =
    typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt)
      ? obj.createdAt
      : Date.now();

  return {
    id: cleanId,
    title: cleanTitle,
    amount: roundCurrency(amountNum),
    category: cleanCategory,
    date: cleanDate,
    ...(cleanNotes !== undefined ? { notes: cleanNotes } : {}),
    createdAt: cleanCreatedAt,
  };
}

/**
 * Validates and normalizes an array of unknown transaction records.
 */
export function sanitizeTransactions(
  raw: unknown,
  options?: { allowMissingDateFallback?: string; allowZeroAmount?: boolean }
): SanitizeResult<Transaction> {
  if (!Array.isArray(raw)) return { items: [], skippedCount: 0 };
  const items: Transaction[] = [];
  const seenIds = new Set<string>();
  let skippedCount = 0;

  for (const entry of raw) {
    const clean = sanitizeTransactionRecord(entry, options);
    if (!clean) {
      skippedCount++;
      continue;
    }
    const id = seenIds.has(clean.id) ? generateId('tx') : clean.id;
    seenIds.add(id);
    items.push(id === clean.id ? clean : { ...clean, id });
  }

  return { items, skippedCount };
}

/**
 * Validates and normalizes a single unknown amortized product item.
 */
export function sanitizeAmortizedRecord(
  raw: unknown,
  todayDateStr: string = getTodayDateString()
): AmortizedItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== 'string') return null;
  const cleanName = obj.name.trim();
  if (!cleanName) return null;

  const totalCostNum =
    typeof obj.totalCost === 'number'
      ? obj.totalCost
      : typeof obj.totalCost === 'string' && obj.totalCost.trim() !== ''
      ? Number(obj.totalCost.replace(/,/g, ''))
      : NaN;
  if (!Number.isFinite(totalCostNum) || totalCostNum <= 0) return null;
  const totalCost = roundCurrency(totalCostNum);

  if (typeof obj.startDate !== 'string' || !isValidISODate(obj.startDate.trim())) {
    return null;
  }
  const startDate = obj.startDate.trim();

  let endDate: string | undefined;
  if (obj.endDate !== undefined && obj.endDate !== null && obj.endDate !== '') {
    if (typeof obj.endDate !== 'string' || !isValidISODate(obj.endDate.trim())) {
      return null;
    }
    const candidateEnd = obj.endDate.trim();
    if (compareISODates(candidateEnd, startDate) <= 0) {
      return null;
    }
    endDate = candidateEnd;
  }

  let durationDays: number | undefined;
  let durationMonths: number | undefined;
  let monthlyCost: number | undefined;
  let dailyCost: number | undefined;

  if (endDate) {
    durationDays = calculateDaysDifference(startDate, endDate);
    const rawMonths =
      typeof obj.durationMonths === 'number' &&
      Number.isFinite(obj.durationMonths) &&
      obj.durationMonths > 0
        ? obj.durationMonths
        : Math.max(0.1, Number((durationDays / 30.44).toFixed(1)));
    durationMonths = Math.max(0.1, Number(rawMonths.toFixed(1)));
    monthlyCost = roundCurrency(totalCost / durationMonths);
    dailyCost = roundCurrency(totalCost / durationDays);
  }

  const cleanStatus: 'active' | 'completed' =
    obj.status === 'completed' || (endDate !== undefined && endDate < todayDateStr)
      ? 'completed'
      : 'active';

  const cleanId =
    typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : generateId('amort');
  const cleanCategory = isValidCategoryId(obj.category) ? obj.category : 'other';
  const cleanNotes =
    typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes.trim() : undefined;
  const cleanTxId =
    typeof obj.transactionId === 'string' && obj.transactionId.trim()
      ? obj.transactionId.trim()
      : undefined;
  const cleanCreatedAt =
    typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt)
      ? obj.createdAt
      : Date.now();

  return {
    id: cleanId,
    ...(cleanTxId !== undefined ? { transactionId: cleanTxId } : {}),
    name: cleanName,
    totalCost,
    startDate,
    ...(endDate !== undefined ? { endDate } : {}),
    ...(durationMonths !== undefined ? { durationMonths } : {}),
    ...(durationDays !== undefined ? { durationDays } : {}),
    ...(monthlyCost !== undefined ? { monthlyCost } : {}),
    ...(dailyCost !== undefined ? { dailyCost } : {}),
    category: cleanCategory,
    ...(cleanNotes !== undefined ? { notes: cleanNotes } : {}),
    status: cleanStatus,
    createdAt: cleanCreatedAt,
  };
}

/**
 * Validates and normalizes an array of unknown amortized product items.
 */
export function sanitizeAmortizedItems(
  raw: unknown,
  todayDateStr: string = getTodayDateString()
): SanitizeResult<AmortizedItem> {
  if (!Array.isArray(raw)) return { items: [], skippedCount: 0 };
  const items: AmortizedItem[] = [];
  const seenIds = new Set<string>();
  let skippedCount = 0;

  for (const entry of raw) {
    const clean = sanitizeAmortizedRecord(entry, todayDateStr);
    if (!clean) {
      skippedCount++;
      continue;
    }
    const id = seenIds.has(clean.id) ? generateId('amort') : clean.id;
    seenIds.add(id);
    items.push(id === clean.id ? clean : { ...clean, id });
  }

  return { items, skippedCount };
}

/**
 * Validates and normalizes a monthly budget dictionary ({ "YYYY-MM": amount }).
 */
export function sanitizeMonthlyBudgets(raw: unknown): {
  budgets: Record<string, number>;
  skippedCount: number;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { budgets: {}, skippedCount: raw === undefined || raw === null ? 0 : 1 };
  }
  const budgets: Record<string, number> = {};
  let skippedCount = 0;

  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidMonthKey(key)) {
      skippedCount++;
      continue;
    }
    const num = typeof val === 'number' ? val : NaN;
    if (!Number.isFinite(num) || num < 0) {
      skippedCount++;
      continue;
    }
    budgets[key] = roundCurrency(num);
  }

  return { budgets, skippedCount };
}

function safeParseJson(raw: string | null): { present: boolean; ok: boolean; value: unknown } {
  if (raw === null) return { present: false, ok: true, value: null };
  try {
    return { present: true, ok: true, value: JSON.parse(raw) };
  } catch {
    return { present: true, ok: false, value: null };
  }
}

export interface StoragePlan {
  snapshot: StorageSnapshot;
  pendingWrites: Array<[string, string]>;
}

/**
 * Purely inspects, validates, heals, and computes any migration/repair writes
 * needed for persisted storage without mutating storage directly inside render.
 */
export function inspectStorageSnapshot(
  storage: Pick<Storage, 'getItem'>,
  todayDateStr: string = getTodayDateString()
): StoragePlan {
  let hadCorruptData = false;
  let transactions: Transaction[] = [];
  let monthlyBudgets: Record<string, number> = {};
  let currency: CurrencyCode = 'INR';
  let amortizedItems: AmortizedItem[] = [];
  const pendingWrites: Array<[string, string]> = [];

  try {
    const rawTx = safeParseJson(storage.getItem(STORAGE_KEY_TX));
    const rawBudgets = safeParseJson(storage.getItem(STORAGE_KEY_BUDGET));
    const rawCurrency = storage.getItem(STORAGE_KEY_CURRENCY);
    const rawAmort = safeParseJson(storage.getItem(STORAGE_KEY_AMORTIZED));
    const alreadyMigrated = storage.getItem(STORAGE_KEY_MIGRATED) === '1';

    let wasLegacySampleTx = false;

    // 1. Transactions
    if (rawTx.present) {
      if (!rawTx.ok || !Array.isArray(rawTx.value)) {
        hadCorruptData = true;
      } else if (!alreadyMigrated && isAllSampleData(rawTx.value)) {
        wasLegacySampleTx = true;
        transactions = [];
        pendingWrites.push([STORAGE_KEY_TX, JSON.stringify([])]);
      } else {
        const res = sanitizeTransactions(rawTx.value, { allowZeroAmount: true });
        if (res.skippedCount > 0) hadCorruptData = true;
        transactions = res.items;
        if (res.skippedCount > 0) {
          pendingWrites.push([STORAGE_KEY_TX, JSON.stringify(transactions)]);
        }
      }
    } else {
      pendingWrites.push([STORAGE_KEY_TX, JSON.stringify([])]);
    }

    // 2. Budgets — ONLY clear legacy auto-seeded 45000 if workspace was legacy sample data
    if (rawBudgets.present) {
      if (
        !rawBudgets.ok ||
        !rawBudgets.value ||
        typeof rawBudgets.value !== 'object' ||
        Array.isArray(rawBudgets.value)
      ) {
        hadCorruptData = true;
      } else {
        const res = sanitizeMonthlyBudgets(rawBudgets.value);
        if (res.skippedCount > 0) hadCorruptData = true;
        if (!alreadyMigrated && wasLegacySampleTx) {
          const cleaned: Record<string, number> = {};
          for (const [k, v] of Object.entries(res.budgets)) {
            if (v !== 45000) cleaned[k] = v;
          }
          monthlyBudgets = cleaned;
          pendingWrites.push([STORAGE_KEY_BUDGET, JSON.stringify(cleaned)]);
        } else {
          monthlyBudgets = res.budgets;
          if (res.skippedCount > 0) {
            pendingWrites.push([STORAGE_KEY_BUDGET, JSON.stringify(monthlyBudgets)]);
          }
        }
      }
    } else {
      pendingWrites.push([STORAGE_KEY_BUDGET, JSON.stringify({})]);
    }

    // 3. Currency
    if (isValidCurrencyCode(rawCurrency)) {
      currency = rawCurrency;
    }

    // 4. Amortized items
    if (rawAmort.present) {
      if (!rawAmort.ok || !Array.isArray(rawAmort.value)) {
        hadCorruptData = true;
      } else if (!alreadyMigrated && isAllSampleAmortized(rawAmort.value)) {
        amortizedItems = [];
        pendingWrites.push([STORAGE_KEY_AMORTIZED, JSON.stringify([])]);
      } else {
        const res = sanitizeAmortizedItems(rawAmort.value, todayDateStr);
        if (res.skippedCount > 0) hadCorruptData = true;
        amortizedItems = res.items;
      }
    } else {
      pendingWrites.push([STORAGE_KEY_AMORTIZED, JSON.stringify([])]);
    }

    // 5. Heal orphaned transactionId references cleanly without deleting user products
    if (amortizedItems.length > 0) {
      const txIdSet = new Set(transactions.map((t) => t.id));
      let healed = false;
      amortizedItems = amortizedItems.map((item) => {
        if (item.transactionId && !txIdSet.has(item.transactionId)) {
          healed = true;
          const rest = { ...item };
          delete rest.transactionId;
          return rest;
        }
        return item;
      });
      if (healed || hadCorruptData) {
        pendingWrites.push([STORAGE_KEY_AMORTIZED, JSON.stringify(amortizedItems)]);
      }
    }

    if (!alreadyMigrated) {
      pendingWrites.push([STORAGE_KEY_MIGRATED, '1']);
    }
  } catch {
    hadCorruptData = true;
  }

  return {
    snapshot: {
      transactions,
      monthlyBudgets,
      currency,
      amortizedItems,
      hadCorruptData,
    },
    pendingWrites,
  };
}

/**
 * Loads, validates, heals orphaned links, and safely migrates persisted storage.
 * Never deletes legitimate user budgets (e.g. a user-set ₹45,000 target): legacy
 * auto-seeded budgets are only cleared when the workspace contained solely legacy
 * sample transactions.
 */
export function loadAndMigrateStorage(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  todayDateStr: string = getTodayDateString()
): StorageSnapshot {
  const { snapshot, pendingWrites } = inspectStorageSnapshot(storage, todayDateStr);
  try {
    for (const [key, value] of pendingWrites) {
      storage.setItem(key, value);
    }
  } catch {
    // Ignore storage write errors in restricted environments
  }
  return snapshot;
}
