'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Transaction,
  CategoryId,
  CurrencyCode,
  ViewTab,
  MonthKey,
  AmortizedItem,
} from '@/types/finance';
import { CATEGORY_LIST, DEFAULT_MONTHLY_BUDGET } from '@/constants/categories';
import {
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_SAMPLE_AMORTIZED_ITEMS,
  generateSampleTransactions,
  generateSampleAmortizedItems,
} from '@/utils/sampleData';
import { getMonthYearLabel } from '@/utils/formatters';
import { fireConfettiBurst } from '@/utils/confetti';

/**
 * Aggregated statistics for a specific category within the selected month.
 */
interface CategoryStats {
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
  resetToSampleData: () => void;
  clearAllData: () => void;
}

/** LocalStorage persistence keys */
const STORAGE_KEY_TX = 'satyfinance_transactions_v2';
const STORAGE_KEY_BUDGET = 'satyfinance_budgets_v2';
const STORAGE_KEY_CURRENCY = 'satyfinance_currency_v2';
const STORAGE_KEY_AMORTIZED = 'satyfinance_amortized_v2';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

/**
 * Root context provider managing transactions, budgets, product lifespan amortization,
 * currency conversion, and workspace analytics.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>({});

  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [amortizedItems, setAmortizedItems] = useState<AmortizedItem[]>([]);

  // Default to current date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

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

  // Initialize from LocalStorage (respecting existing user data without forced seed resets)
  useEffect(() => {
    try {
      const storedTx = localStorage.getItem(STORAGE_KEY_TX);
      const storedBudgets = localStorage.getItem(STORAGE_KEY_BUDGET);
      const storedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);
      const storedAmort = localStorage.getItem(STORAGE_KEY_AMORTIZED);

      // 1. Transactions: if user already has data in storage, use it directly (even if empty array [])
      if (storedTx !== null) {
        try {
          const parsed = JSON.parse(storedTx);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          } else {
            setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
          }
        } catch {
          setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
        }
      } else {
        // Seed first visit with sample transactions
        setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
        localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(INITIAL_SAMPLE_TRANSACTIONS));
      }

      // 2. Budgets:
      const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      if (storedBudgets) {
        try {
          setMonthlyBudgets(JSON.parse(storedBudgets));
        } catch {
          const defaultBudgets: Record<string, number> = {
            [currentMonthKey]: DEFAULT_MONTHLY_BUDGET.INR,
          };
          setMonthlyBudgets(defaultBudgets);
        }
      } else {
        const defaultBudgets: Record<string, number> = {
          [currentMonthKey]: DEFAULT_MONTHLY_BUDGET.INR,
        };
        setMonthlyBudgets(defaultBudgets);
        localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(defaultBudgets));
      }

      // 3. Currency:
      if (storedCurrency && ['INR', 'USD', 'EUR', 'GBP'].includes(storedCurrency)) {
        setCurrencyState(storedCurrency as CurrencyCode);
      }

      // 4. Amortized Items: if user already has data in storage, use it directly (even if empty array [])
      if (storedAmort !== null) {
        try {
          const parsedAmort = JSON.parse(storedAmort);
          if (Array.isArray(parsedAmort)) {
            setAmortizedItems(parsedAmort);
          } else {
            setAmortizedItems(INITIAL_SAMPLE_AMORTIZED_ITEMS);
          }
        } catch {
          setAmortizedItems(INITIAL_SAMPLE_AMORTIZED_ITEMS);
        }
      } else {
        // Seed first visit with sample amortized items
        setAmortizedItems(INITIAL_SAMPLE_AMORTIZED_ITEMS);
        localStorage.setItem(STORAGE_KEY_AMORTIZED, JSON.stringify(INITIAL_SAMPLE_AMORTIZED_ITEMS));
      }
    } catch {
      setTransactions([]);
      setAmortizedItems([]);
    }
  }, []);

  const persistTransactions = useCallback((updated: Transaction[]) => {
    setTransactions(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Sync budgets to LocalStorage
  const setMonthlyBudget = useCallback((monthKey: string, amount: number) => {
    setMonthlyBudgets((prev) => {
      const updated = { ...prev, [monthKey]: amount };
      try {
        localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Sync currency to LocalStorage
  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    } catch {
      // ignore
    }
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
    if (monthlyBudgets[selectedMonth.key]) {
      return monthlyBudgets[selectedMonth.key];
    }
    return DEFAULT_MONTHLY_BUDGET.INR || 45000;
  }, [monthlyBudgets, selectedMonth.key]);

  // Total spent in this month (sum of all transactions)
  const totalSpentThisMonth = useMemo(() => {
    return filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredTransactions]);

  const today = useMemo(() => new Date(), []);
  const todayDay = today.getDate();
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const isCurrentMonth = useMemo(() => {
    return today.getFullYear() === selectedMonth.year && today.getMonth() === selectedMonth.month;
  }, [today, selectedMonth]);

  const isPastMonth = useMemo(() => {
    return (
      selectedMonth.year < today.getFullYear() ||
      (selectedMonth.year === today.getFullYear() && selectedMonth.month < today.getMonth())
    );
  }, [today, selectedMonth]);

  const elapsedDaysThisMonth = useMemo(() => {
    if (isCurrentMonth) {
      return Math.max(1, todayDay);
    }
    if (isPastMonth) {
      return new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
    }
    return 0;
  }, [isCurrentMonth, isPastMonth, todayDay, selectedMonth]);

  // Settled vs Scheduled breakdown
  // Current month: <= todayDateStr is settled, > todayDateStr is scheduled
  // Past month: all transactions are settled
  // Future month: all transactions are scheduled
  const { settledSpentThisMonth, scheduledSpentThisMonth, settledCount, scheduledCount } = useMemo(() => {
    let settled = 0;
    let scheduled = 0;
    let countSettled = 0;
    let countScheduled = 0;

    for (const t of filteredTransactions) {
      if (isPastMonth) {
        settled += t.amount;
        countSettled++;
      } else if (isCurrentMonth) {
        if (t.date <= todayDateStr) {
          settled += t.amount;
          countSettled++;
        } else {
          scheduled += t.amount;
          countScheduled++;
        }
      } else {
        // Future month
        scheduled += t.amount;
        countScheduled++;
      }
    }

    return {
      settledSpentThisMonth: settled,
      scheduledSpentThisMonth: scheduled,
      settledCount: countSettled,
      scheduledCount: countScheduled,
    };
  }, [filteredTransactions, isPastMonth, isCurrentMonth, todayDateStr]);

  // Budget progress percentage (clamped appropriately in UI)
  const budgetPercentage = useMemo(() => {
    if (currentBudget <= 0) return 0;
    return Math.round((totalSpentThisMonth / currentBudget) * 100);
  }, [totalSpentThisMonth, currentBudget]);

  // Daily spend pace:
  // - For current month: settledSpentThisMonth / elapsedDaysThisMonth
  // - For past month: totalSpentThisMonth / daysInMonth
  // - For future month: 0
  const dailySpendAverage = useMemo(() => {
    if (isCurrentMonth && elapsedDaysThisMonth > 0) {
      return Math.round(settledSpentThisMonth / elapsedDaysThisMonth);
    }
    if (isPastMonth && elapsedDaysThisMonth > 0) {
      return Math.round(totalSpentThisMonth / elapsedDaysThisMonth);
    }
    return 0;
  }, [isCurrentMonth, isPastMonth, settledSpentThisMonth, totalSpentThisMonth, elapsedDaysThisMonth]);


  // Category stats calculation
  const categoryStats = useMemo<CategoryStats[]>(() => {
    const catMap: Record<CategoryId, { total: number; count: number }> = {
      groceries: { total: 0, count: 0 },
      food_dining: { total: 0, count: 0 },
      bills: { total: 0, count: 0 },
      electronics: { total: 0, count: 0 },
      personal_care: { total: 0, count: 0 },
      household: { total: 0, count: 0 },
      other: { total: 0, count: 0 },
    };

    for (const t of filteredTransactions) {
      const cat = catMap[t.category] ? t.category : 'other';
      catMap[cat].total += t.amount;
      catMap[cat].count += 1;
    }

    return CATEGORY_LIST.map((c) => {
      const data = catMap[c.id];
      const percentage = totalSpentThisMonth > 0 ? Math.round((data.total / totalSpentThisMonth) * 100) : 0;
      return {
        category: c.id,
        total: data.total,
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
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      const updated = [newTx, ...transactions];
      persistTransactions(updated);
      fireConfettiBurst();
      return newTx;
    },
    [transactions, persistTransactions]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
      persistTransactions(updated);
    },
    [transactions, persistTransactions]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const updated = transactions.filter((t) => t.id !== id);
      persistTransactions(updated);
    },
    [transactions, persistTransactions]
  );

  const importTransactions = useCallback(
    (newTransactions: Transaction[], replaceExisting: boolean) => {
      let combined: Transaction[];
      if (replaceExisting) {
        combined = newTransactions;
      } else {
        // Merge without duplicating IDs
        const existingIds = new Set(transactions.map((t) => t.id));
        const nonDuplicate = newTransactions.filter((t) => !existingIds.has(t.id));
        combined = [...nonDuplicate, ...transactions];
      }
      persistTransactions(combined);
      fireConfettiBurst();
    },
    [transactions, persistTransactions]
  );

  // Sync amortized items to LocalStorage
  const persistAmortizedItems = useCallback((updated: AmortizedItem[]) => {
    setAmortizedItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY_AMORTIZED, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const addAmortizedItem = useCallback(
    (data: Omit<AmortizedItem, 'id' | 'createdAt'>): AmortizedItem => {
      const newItem: AmortizedItem = {
        ...data,
        id: `amort-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      const updated = [newItem, ...amortizedItems];
      persistAmortizedItems(updated);
      fireConfettiBurst();
      return newItem;
    },
    [amortizedItems, persistAmortizedItems]
  );

  const updateAmortizedItem = useCallback(
    (id: string, updates: Partial<Omit<AmortizedItem, 'id' | 'createdAt'>>) => {
      const updated = amortizedItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persistAmortizedItems(updated);
    },
    [amortizedItems, persistAmortizedItems]
  );

  const deleteAmortizedItem = useCallback(
    (id: string) => {
      const updated = amortizedItems.filter((item) => item.id !== id);
      persistAmortizedItems(updated);
    },
    [amortizedItems, persistAmortizedItems]
  );

  const totalMonthlyAmortizedCost = useMemo(() => {
    return amortizedItems
      .filter((item) => item.status === 'active')
      .reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
  }, [amortizedItems]);

  const activeAmortizedCount = useMemo(() => {
    return amortizedItems.filter((item) => item.status === 'active').length;
  }, [amortizedItems]);

  const resetToSampleData = useCallback(() => {
    const freshTx = generateSampleTransactions();
    const freshAmort = generateSampleAmortizedItems();
    persistTransactions(freshTx);
    persistAmortizedItems(freshAmort);
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const defaultBudgets: Record<string, number> = {
      [currentMonthKey]: DEFAULT_MONTHLY_BUDGET.INR,
    };
    setMonthlyBudgets(defaultBudgets);
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(defaultBudgets));
    } catch {
      // ignore
    }
  }, [persistTransactions, persistAmortizedItems]);

  const clearAllData = useCallback(() => {
    persistTransactions([]);
    persistAmortizedItems([]);
  }, [persistTransactions, persistAmortizedItems]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        selectedMonth,
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
