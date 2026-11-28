'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  Transaction,
  CategoryId,
  CurrencyCode,
  ViewTab,
  MonthKey,
  AmortizedItem,
  ImportedBackupData,
} from '@/types/finance';
import { CATEGORY_LIST, DEFAULT_MONTHLY_BUDGET, isValidCurrencyCode } from '@/constants/categories';
import {
  generateSampleTransactions,
  generateSampleAmortizedItems,
} from '@/utils/sampleData';
import {
  addDaysToDate,
  addMonthsToDate,
  calculateDaysDifference,
  getCurrentMonthKey,
  getMonthYearLabel,
  getTodayDateString,
  isValidMonthKey,
  parseLocalDate,
  roundCurrency,
  sumCurrency,
} from '@/utils/formatters';
import { generateId } from '@/utils/id';
import { fireConfettiBurst } from '@/utils/confetti';
import {
  inspectStorageSnapshot,
  StoragePlan,
  STORAGE_KEY_AMORTIZED,
  STORAGE_KEY_BUDGET,
  STORAGE_KEY_CURRENCY,
  STORAGE_KEY_MIGRATED,
  STORAGE_KEY_TX,
} from '@/utils/storage';

/**
 * Aggregated statistics for a specific category within the selected month.
 */
export interface CategoryStats {
  category: CategoryId;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Global state and action contract provided by FinanceContext.
 */
interface FinanceContextType {
  /** Full list of transactions across all months */
  transactions: Transaction[];
  /** Currently active month scope for dashboard and reports */
  selectedMonth: MonthKey;
  /** Current local ISO date string (YYYY-MM-DD), updates automatically after midnight */
  todayDateStr: string;
  /** User's preferred display currency */
  currency: CurrencyCode;
  /** Currently active view tab */
  activeTab: ViewTab;
  /** Monthly target budgets keyed by "YYYY-MM" */
  monthlyBudgets: Record<string, number>;
  /** Monthly budget target for the selected month */
  currentBudget: number;
  /** Filtered transactions belonging specifically to the selected month */
  filteredTransactions: Transaction[];
  /** Total sum of all expenses in the selected month */
  totalSpentThisMonth: number;
  /** Realized/settled expenses up to today */
  settledSpentThisMonth: number;
  /** Scheduled/upcoming bills due later in the month */
  scheduledSpentThisMonth: number;
  /** Count of settled transactions */
  settledCount: number;
  /** Count of scheduled upcoming bills */
  scheduledCount: number;
  /** Number of days elapsed in the selected month */
  elapsedDaysThisMonth: number;
  /** Percentage of budget utilized (0-100+) */
  budgetPercentage: number;
  /** Average spend per active day */
  dailySpendAverage: number;
  /** Category with the largest spending volume this month */
  topCategory: { category: CategoryId; amount: number } | null;
  /** Full category-by-category breakdown sorted by total spend */
  categoryStats: CategoryStats[];
  /** True if corrupted localStorage data was detected and recovered on startup */
  storageRecoveryNotice: boolean;
  dismissStorageRecoveryNotice: () => void;

  // Amortized Lifespan Tracking
  /** All product lifespan amortization items */
  amortizedItems: AmortizedItem[];
  /** Total combined monthly amortized burn across all active items */
  totalMonthlyAmortizedCost: number;
  /** Count of currently active lifespan items */
  activeAmortizedCount: number;

  // Navigation actions
  setActiveTab: (tab: ViewTab) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  setSelectedMonthYear: (year: number, month: number) => void;
  setCurrency: (code: CurrencyCode) => void;

  // Transaction CRUD actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  setMonthlyBudget: (monthKey: string, amount: number) => void;

  // Amortized Lifespan CRUD actions
  addAmortizedItem: (data: Omit<AmortizedItem, 'id' | 'createdAt'>) => AmortizedItem;
  updateAmortizedItem: (id: string, updates: Partial<Omit<AmortizedItem, 'id' | 'createdAt'>>) => void;
  deleteAmortizedItem: (id: string) => void;

  // Bulk / Data actions
  importTransactions: (newTransactions: Transaction[], replaceExisting: boolean) => void;
  importBackup: (backup: ImportedBackupData, replaceExisting: boolean) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or private mode errors safely
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors safely
  }
}

const emptySubscribe = () => () => {};
const NOOP = () => {};
const NOOP_ADD_TX: FinanceContextType['addTransaction'] = (data) => ({
  ...data,
  id: '',
  createdAt: 0,
});
const NOOP_ADD_AMORT: FinanceContextType['addAmortizedItem'] = (data) => ({
  ...data,
  id: '',
  createdAt: 0,
});

function StaticFinanceProvider({ children }: { children: React.ReactNode }) {
  const [now] = useState<Date>(() => new Date());
  const [todayDateStr] = useState<string>(() => getTodayDateString());

  const value = useMemo<FinanceContextType>(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    return {
      transactions: [],
      selectedMonth: {
        year,
        month,
        key,
        label: getMonthYearLabel(year, month),
      },
      todayDateStr,
      currency: 'INR',
      activeTab: 'dashboard',
      monthlyBudgets: {},
      currentBudget: 0,
      filteredTransactions: [],
      totalSpentThisMonth: 0,
      settledSpentThisMonth: 0,
      scheduledSpentThisMonth: 0,
      settledCount: 0,
      scheduledCount: 0,
      elapsedDaysThisMonth: Math.max(1, Math.min(now.getDate(), totalDaysInMonth)),
      budgetPercentage: 0,
      dailySpendAverage: 0,
      topCategory: null,
      categoryStats: [],
      storageRecoveryNotice: false,
      dismissStorageRecoveryNotice: NOOP,
      amortizedItems: [],
      totalMonthlyAmortizedCost: 0,
      activeAmortizedCount: 0,
      setActiveTab: NOOP,
      goToPreviousMonth: NOOP,
      goToNextMonth: NOOP,
      goToCurrentMonth: NOOP,
      setSelectedMonthYear: NOOP,
      setCurrency: NOOP,
      addTransaction: NOOP_ADD_TX,
      updateTransaction: NOOP,
      deleteTransaction: NOOP,
      setMonthlyBudget: NOOP,
      addAmortizedItem: NOOP_ADD_AMORT,
      updateAmortizedItem: NOOP,
      deleteAmortizedItem: NOOP,
      importTransactions: NOOP,
      importBackup: NOOP,
      resetToSampleData: NOOP,
      clearAllData: NOOP,
    };
  }, [now, todayDateStr]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

/**
 * Root context provider managing transactions, budgets, product lifespan amortization,
 * currency conversion, and workspace analytics.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isHydrated) {
    return <StaticFinanceProvider>{children}</StaticFinanceProvider>;
  }

  return <HydratedFinanceProvider>{children}</HydratedFinanceProvider>;
}

function HydratedFinanceProvider({ children }: { children: React.ReactNode }) {
  const [bootPlan] = useState<StoragePlan>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return inspectStorageSnapshot(window.localStorage, getTodayDateString());
    }
    return {
      snapshot: {
        transactions: [],
        monthlyBudgets: {},
        currency: 'INR',
        amortizedItems: [],
        hadCorruptData: false,
      },
      pendingWrites: [],
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(bootPlan.snapshot.transactions);
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>(
    bootPlan.snapshot.monthlyBudgets
  );
  const [currency, setCurrencyState] = useState<CurrencyCode>(bootPlan.snapshot.currency);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [amortizedItems, setAmortizedItems] = useState<AmortizedItem[]>(
    bootPlan.snapshot.amortizedItems
  );
  const [storageRecoveryNotice, setStorageRecoveryNotice] = useState<boolean>(
    bootPlan.snapshot.hadCorruptData
  );

  // Refs prevent stale closures when multiple mutations occur in the same tick
  const transactionsRef = useRef<Transaction[]>(bootPlan.snapshot.transactions);
  const amortizedRef = useRef<AmortizedItem[]>(bootPlan.snapshot.amortizedItems);
  const budgetsRef = useRef<Record<string, number>>(bootPlan.snapshot.monthlyBudgets);

  // Default to current date, and keep todayDateStr synchronized across midnight
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [todayDateStr, setTodayDateStr] = useState<string>(() => getTodayDateString());

  // Persist any migration or corruption-repair writes queued during startup inspection
  useEffect(() => {
    for (const [key, value] of bootPlan.pendingWrites) {
      safeSetStorage(key, value);
    }
  }, [bootPlan]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextMidnightSync = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
      timeoutId = setTimeout(() => {
        const latestStr = getTodayDateString();
        setTodayDateStr((prev) => (prev === latestStr ? prev : latestStr));
        scheduleNextMidnightSync();
      }, msUntilMidnight);
    };

    scheduleNextMidnightSync();

    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        const latestStr = getTodayDateString();
        setTodayDateStr((prev) => (prev === latestStr ? prev : latestStr));
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const selectedMonth = useMemo<MonthKey>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return {
      year,
      month,
      key,
      label: getMonthYearLabel(year, month),
    };
  }, [currentDate]);

  const dismissStorageRecoveryNotice = useCallback(() => {
    setStorageRecoveryNotice(false);
  }, []);

  const persistTransactions = useCallback((updated: Transaction[]) => {
    transactionsRef.current = updated;
    setTransactions(updated);
    safeSetStorage(STORAGE_KEY_TX, JSON.stringify(updated));
  }, []);

  const persistAmortizedItems = useCallback((updated: AmortizedItem[]) => {
    amortizedRef.current = updated;
    setAmortizedItems(updated);
    safeSetStorage(STORAGE_KEY_AMORTIZED, JSON.stringify(updated));
  }, []);

  const persistBudgets = useCallback((updated: Record<string, number>) => {
    budgetsRef.current = updated;
    setMonthlyBudgets(updated);
    safeSetStorage(STORAGE_KEY_BUDGET, JSON.stringify(updated));
  }, []);

  // Sync budgets to LocalStorage
  const setMonthlyBudget = useCallback(
    (monthKey: string, amount: number) => {
      if (!isValidMonthKey(monthKey) || !Number.isFinite(amount) || amount < 0) return;
      const updated = {
        ...budgetsRef.current,
        [monthKey]: roundCurrency(amount),
      };
      persistBudgets(updated);
    },
    [persistBudgets]
  );

  // Sync currency to LocalStorage
  const setCurrency = useCallback((code: CurrencyCode) => {
    if (!isValidCurrencyCode(code)) return;
    setCurrencyState(code);
    safeSetStorage(STORAGE_KEY_CURRENCY, code);
  }, []);

  // Month navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const setSelectedMonthYear = useCallback((year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
  }, []);

  // Filter transactions for currently selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(selectedMonth.key));
  }, [transactions, selectedMonth.key]);

  // Current budget amount for this month (stored in base INR)
  const currentBudget = useMemo(() => {
    if (monthlyBudgets[selectedMonth.key] !== undefined) {
      return monthlyBudgets[selectedMonth.key];
    }
    return 0;
  }, [monthlyBudgets, selectedMonth.key]);

  // Total spent in this month (minor-unit sum prevents floating-point drift)
  const totalSpentThisMonth = useMemo(() => {
    return sumCurrency(filteredTransactions.map((item) => item.amount));
  }, [filteredTransactions]);

  const todayObj = useMemo(() => parseLocalDate(todayDateStr) ?? new Date(), [todayDateStr]);

  const isCurrentMonth = useMemo(() => {
    return todayObj.getFullYear() === selectedMonth.year && todayObj.getMonth() === selectedMonth.month;
  }, [todayObj, selectedMonth]);

  const isPastMonth = useMemo(() => {
    return (
      selectedMonth.year < todayObj.getFullYear() ||
      (selectedMonth.year === todayObj.getFullYear() && selectedMonth.month < todayObj.getMonth())
    );
  }, [todayObj, selectedMonth]);

  const elapsedDaysThisMonth = useMemo(() => {
    if (isCurrentMonth) {
      return Math.max(1, todayObj.getDate());
    }
    if (isPastMonth) {
      return new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
    }
    return 0;
  }, [isCurrentMonth, isPastMonth, todayObj, selectedMonth]);

  // Settled vs Scheduled breakdown
  const { settledSpentThisMonth, scheduledSpentThisMonth, settledCount, scheduledCount } = useMemo(() => {
    const settledAmounts: number[] = [];
    const scheduledAmounts: number[] = [];

    for (const t of filteredTransactions) {
      if (isPastMonth) {
        settledAmounts.push(t.amount);
      } else if (isCurrentMonth) {
        if (t.date <= todayDateStr) {
          settledAmounts.push(t.amount);
        } else {
          scheduledAmounts.push(t.amount);
        }
      } else {
        scheduledAmounts.push(t.amount);
      }
    }

    return {
      settledSpentThisMonth: sumCurrency(settledAmounts),
      scheduledSpentThisMonth: sumCurrency(scheduledAmounts),
      settledCount: settledAmounts.length,
      scheduledCount: scheduledAmounts.length,
    };
  }, [filteredTransactions, isPastMonth, isCurrentMonth, todayDateStr]);

  // Budget progress percentage
  const budgetPercentage = useMemo(() => {
    if (currentBudget <= 0) return 0;
    return Math.round((totalSpentThisMonth / currentBudget) * 100);
  }, [totalSpentThisMonth, currentBudget]);

  // Daily spend pace
  const dailySpendAverage = useMemo(() => {
    if (isCurrentMonth && elapsedDaysThisMonth > 0) {
      return roundCurrency(settledSpentThisMonth / elapsedDaysThisMonth);
    }
    if (isPastMonth && elapsedDaysThisMonth > 0) {
      return roundCurrency(totalSpentThisMonth / elapsedDaysThisMonth);
    }
    return 0;
  }, [isCurrentMonth, isPastMonth, settledSpentThisMonth, totalSpentThisMonth, elapsedDaysThisMonth]);

  // Category stats calculation
  const categoryStats = useMemo<CategoryStats[]>(() => {
    const catMap: Record<CategoryId, { amounts: number[]; count: number }> = {
      groceries: { amounts: [], count: 0 },
      food_dining: { amounts: [], count: 0 },
      bills: { amounts: [], count: 0 },
      electronics: { amounts: [], count: 0 },
      personal_care: { amounts: [], count: 0 },
      household: { amounts: [], count: 0 },
      other: { amounts: [], count: 0 },
    };

    for (const t of filteredTransactions) {
      const cat = catMap[t.category] ? t.category : 'other';
      catMap[cat].amounts.push(t.amount);
      catMap[cat].count += 1;
    }

    return CATEGORY_LIST.map((c) => {
      const data = catMap[c.id];
      const total = sumCurrency(data.amounts);
      const percentage =
        totalSpentThisMonth > 0 ? Math.round((total / totalSpentThisMonth) * 100) : 0;
      return {
        category: c.id,
        total,
        count: data.count,
        percentage,
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, totalSpentThisMonth]);

  // Top spending category
  const topCategory = useMemo(() => {
    if (categoryStats.length === 0 || categoryStats[0].total === 0) return null;
    return {
      category: categoryStats[0].category,
      amount: categoryStats[0].total,
    };
  }, [categoryStats]);

  // CRUD actions
  const addTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
      const newTx: Transaction = {
        ...data,
        title: data.title.trim(),
        amount: roundCurrency(data.amount),
        notes: data.notes?.trim() || undefined,
        id: generateId('tx'),
        createdAt: Date.now(),
      };
      const updated = [newTx, ...transactionsRef.current];
      persistTransactions(updated);
      fireConfettiBurst();
      return newTx;
    },
    [persistTransactions]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const sanitizedUpdates: Partial<Omit<Transaction, 'id' | 'createdAt'>> = {
        ...updates,
        ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
        ...(updates.amount !== undefined ? { amount: roundCurrency(updates.amount) } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes.trim() || undefined } : {}),
      };

      const updatedTx = transactionsRef.current.map((t) =>
        t.id === id ? { ...t, ...sanitizedUpdates } : t
      );
      persistTransactions(updatedTx);

      // Keep any linked AmortizedItem synchronized with edited transaction metadata
      const hasLinkedAmort = amortizedRef.current.some((item) => item.transactionId === id);
      if (hasLinkedAmort) {
        const updatedAmort = amortizedRef.current.map((item) => {
          if (item.transactionId !== id) return item;

          const newName = sanitizedUpdates.title ?? item.name;
          const newTotalCost = sanitizedUpdates.amount ?? item.totalCost;
          const newCategory = sanitizedUpdates.category ?? item.category;
          const newStartDate = sanitizedUpdates.date ?? item.startDate;

          let newEndDate = item.endDate;
          let newDurationDays = item.durationDays;

          if (item.endDate && sanitizedUpdates.date && sanitizedUpdates.date !== item.startDate) {
            if (item.durationMonths && Number.isInteger(item.durationMonths)) {
              newEndDate = addMonthsToDate(newStartDate, item.durationMonths);
            } else if (item.durationDays) {
              newEndDate = addDaysToDate(newStartDate, item.durationDays);
            }
            if (newEndDate) {
              newDurationDays = calculateDaysDifference(newStartDate, newEndDate);
            }
          }

          const newMonthlyCost =
            item.durationMonths && item.durationMonths > 0
              ? roundCurrency(newTotalCost / item.durationMonths)
              : undefined;
          const newDailyCost =
            newDurationDays && newDurationDays > 0
              ? roundCurrency(newTotalCost / newDurationDays)
              : undefined;
          const newStatus: 'active' | 'completed' = newEndDate
            ? newEndDate >= todayDateStr
              ? 'active'
              : 'completed'
            : item.status;

          return {
            ...item,
            name: newName,
            totalCost: newTotalCost,
            category: newCategory,
            startDate: newStartDate,
            ...(newEndDate !== undefined ? { endDate: newEndDate } : {}),
            ...(newDurationDays !== undefined ? { durationDays: newDurationDays } : {}),
            ...(newMonthlyCost !== undefined ? { monthlyCost: newMonthlyCost } : {}),
            ...(newDailyCost !== undefined ? { dailyCost: newDailyCost } : {}),
            status: newStatus,
          };
        });
        persistAmortizedItems(updatedAmort);
      }
    },
    [persistTransactions, persistAmortizedItems, todayDateStr]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const updatedTx = transactionsRef.current.filter((t) => t.id !== id);
      persistTransactions(updatedTx);

      // Unlink any amortized items referencing the deleted transaction so no orphaned FK remains
      const hasLinked = amortizedRef.current.some((item) => item.transactionId === id);
      if (hasLinked) {
        const updatedAmort = amortizedRef.current.map((item) => {
          if (item.transactionId !== id) return item;
          const unlinked = { ...item };
          delete unlinked.transactionId;
          return unlinked;
        });
        persistAmortizedItems(updatedAmort);
      }
    },
    [persistTransactions, persistAmortizedItems]
  );

  // Full backup restore (transactions, amortizedItems, monthlyBudgets, currency)
  const importBackup = useCallback(
    (backup: ImportedBackupData, replaceExisting: boolean) => {
      // 1. Transactions
      let nextTransactions: Transaction[];
      if (replaceExisting) {
        nextTransactions = backup.transactions;
      } else {
        const existingIds = new Set(transactionsRef.current.map((t) => t.id));
        const nonDuplicate = backup.transactions.filter((t) => !existingIds.has(t.id));
        nextTransactions = [...nonDuplicate, ...transactionsRef.current];
      }
      persistTransactions(nextTransactions);
      const validTxIds = new Set(nextTransactions.map((t) => t.id));

      // 2. Amortized Items (never wipe existing items if backup is transactions-only v1/CSV)
      if (backup.amortizedItems !== undefined) {
        let nextAmort: AmortizedItem[];
        if (replaceExisting) {
          nextAmort = backup.amortizedItems;
        } else {
          const existingAmortIds = new Set(amortizedRef.current.map((a) => a.id));
          const existingLinkedTxIds = new Set(
            amortizedRef.current.map((a) => a.transactionId).filter(Boolean)
          );
          const nonDuplicateAmort = backup.amortizedItems.filter(
            (a) =>
              !existingAmortIds.has(a.id) &&
              (!a.transactionId || !existingLinkedTxIds.has(a.transactionId))
          );
          nextAmort = [...nonDuplicateAmort, ...amortizedRef.current];
        }
        // Heal any dangling transaction references
        nextAmort = nextAmort.map((item) => {
          if (item.transactionId && !validTxIds.has(item.transactionId)) {
            const unlinked = { ...item };
            delete unlinked.transactionId;
            return unlinked;
          }
          return item;
        });
        persistAmortizedItems(nextAmort);
      } else if (replaceExisting) {
        // Replacing transactions with a transactions-only backup: keep amortized items but unlink stale IDs
        const healedAmort = amortizedRef.current.map((item) => {
          if (item.transactionId && !validTxIds.has(item.transactionId)) {
            const unlinked = { ...item };
            delete unlinked.transactionId;
            return unlinked;
          }
          return item;
        });
        persistAmortizedItems(healedAmort);
      }

      // 3. Monthly Budgets (never wipe existing budgets if backup is transactions-only v1/CSV)
      if (backup.monthlyBudgets !== undefined) {
        if (replaceExisting) {
          persistBudgets(backup.monthlyBudgets);
        } else {
          // Merge without overwriting existing user budgets
          persistBudgets({
            ...backup.monthlyBudgets,
            ...budgetsRef.current,
          });
        }
      }

      // 4. Currency (restore on full replace when specified)
      if (replaceExisting && backup.currency && isValidCurrencyCode(backup.currency)) {
        setCurrency(backup.currency);
      }

      fireConfettiBurst();
    },
    [persistTransactions, persistAmortizedItems, persistBudgets, setCurrency]
  );

  // Backwards-compatible wrapper for transaction-only callers
  const importTransactions = useCallback(
    (newTransactions: Transaction[], replaceExisting: boolean) => {
      importBackup(
        {
          transactions: newTransactions,
          format: 'v1-array',
          skippedCount: 0,
        },
        replaceExisting
      );
    },
    [importBackup]
  );

  const addAmortizedItem = useCallback(
    (data: Omit<AmortizedItem, 'id' | 'createdAt'>): AmortizedItem => {
      // Prevent duplicate amortized items linked to the same transactionId
      if (data.transactionId) {
        const existingLinked = amortizedRef.current.find(
          (item) => item.transactionId === data.transactionId
        );
        if (existingLinked) {
          const updatedItem: AmortizedItem = {
            ...existingLinked,
            ...data,
            name: data.name.trim(),
            totalCost: roundCurrency(data.totalCost),
          };
          const updated = amortizedRef.current.map((item) =>
            item.id === existingLinked.id ? updatedItem : item
          );
          persistAmortizedItems(updated);
          return updatedItem;
        }
      }

      const newItem: AmortizedItem = {
        ...data,
        name: data.name.trim(),
        totalCost: roundCurrency(data.totalCost),
        id: generateId('amort'),
        createdAt: Date.now(),
      };
      const updated = [newItem, ...amortizedRef.current];
      persistAmortizedItems(updated);
      fireConfettiBurst();
      return newItem;
    },
    [persistAmortizedItems]
  );

  const updateAmortizedItem = useCallback(
    (id: string, updates: Partial<Omit<AmortizedItem, 'id' | 'createdAt'>>) => {
      const updated = amortizedRef.current.map((item) => {
        if (item.id !== id) return item;
        const merged: AmortizedItem = {
          ...item,
          ...updates,
          ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
          ...(updates.totalCost !== undefined ? { totalCost: roundCurrency(updates.totalCost) } : {}),
        };
        // Clean explicit undefined fields (e.g. when unlinking transactionId or removing endDate)
        if ('transactionId' in updates && updates.transactionId === undefined) {
          delete merged.transactionId;
        }
        if ('endDate' in updates && updates.endDate === undefined) {
          delete merged.endDate;
          delete merged.durationMonths;
          delete merged.durationDays;
          delete merged.monthlyCost;
          delete merged.dailyCost;
        }
        return merged;
      });
      persistAmortizedItems(updated);
    },
    [persistAmortizedItems]
  );

  const deleteAmortizedItem = useCallback(
    (id: string) => {
      const updated = amortizedRef.current.filter((item) => item.id !== id);
      persistAmortizedItems(updated);
    },
    [persistAmortizedItems]
  );

  const totalMonthlyAmortizedCost = useMemo(() => {
    return sumCurrency(
      amortizedItems
        .filter((item) => item.status === 'active')
        .map((item) => item.monthlyCost || 0)
    );
  }, [amortizedItems]);

  const activeAmortizedCount = useMemo(() => {
    return amortizedItems.filter((item) => item.status === 'active').length;
  }, [amortizedItems]);

  const resetToSampleData = useCallback(() => {
    const freshTx = generateSampleTransactions();
    const freshAmort = generateSampleAmortizedItems();
    persistTransactions(freshTx);
    persistAmortizedItems(freshAmort);
    const currentMonthKey = getCurrentMonthKey();
    persistBudgets({
      [currentMonthKey]: DEFAULT_MONTHLY_BUDGET.INR,
    });
    safeSetStorage(STORAGE_KEY_MIGRATED, '1');
  }, [persistTransactions, persistAmortizedItems, persistBudgets]);

  const clearAllData = useCallback(() => {
    persistTransactions([]);
    persistAmortizedItems([]);
    persistBudgets({});
    setCurrencyState('INR');
    safeRemoveStorage(STORAGE_KEY_CURRENCY);
    safeSetStorage(STORAGE_KEY_MIGRATED, '1');
  }, [persistTransactions, persistAmortizedItems, persistBudgets]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        selectedMonth,
        todayDateStr,
        currency,
        activeTab,
        monthlyBudgets,
        currentBudget,
        filteredTransactions,
        totalSpentThisMonth,
        settledSpentThisMonth,
        scheduledSpentThisMonth,
        settledCount,
        scheduledCount,
        elapsedDaysThisMonth,
        budgetPercentage,
        dailySpendAverage,
        topCategory,
        categoryStats,
        storageRecoveryNotice,
        dismissStorageRecoveryNotice,

        amortizedItems,
        totalMonthlyAmortizedCost,
        activeAmortizedCount,

        setActiveTab,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        setSelectedMonthYear,
        setCurrency,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        setMonthlyBudget,

        addAmortizedItem,
        updateAmortizedItem,
        deleteAmortizedItem,

        importTransactions,
        importBackup,
        resetToSampleData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
