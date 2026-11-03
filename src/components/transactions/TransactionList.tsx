'use client';

import React, { useState, useMemo } from 'react';
import {
  IconSearch,
  IconArrowsSort,
  IconPlus,
  IconReceipt,
  IconX,
  IconFilter,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, CategoryId, SortOption, AmortizedItem } from '@/types/finance';
import { CATEGORY_LIST } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';
import { TransactionRow } from './TransactionRow';

/**
 * Props for TransactionList component.
 */
interface TransactionListProps {
  /** Callback to trigger modal for editing a transaction */
  onEditTransaction: (tx: Transaction) => void;
  /** Callback to open modal to add a new transaction */
  onOpenAddModal: () => void;
  /** Optional callback to initiate lifespan amortization tracking for an expense */
  onTrackAmortization?: (tx: Transaction, existingItem?: AmortizedItem) => void;
}

/**
 * Filterable and sortable transaction list supporting:
 * - Page Header with consistent spacing, view icon, and action button
 * - Summary metric cards for total monthly outflow, filtered volume, and average expense
 * - Keyword search by title/merchant and notes with clear button
 * - Responsive category filter pills with dynamic count badges
 * - Multi-criteria sorting (newest, oldest, highest/lowest amount, alphabetical)
 * - Synchronized column headers for pixel-perfect table alignment
 * - Accessible empty states and quick actions
 */
export function TransactionList({
  onEditTransaction,
  onOpenAddModal,
  onTrackAmortization,
}: TransactionListProps) {
  const { filteredTransactions, totalSpentThisMonth, selectedMonth, currency } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  // Filter & sort pipeline
  const processedTransactions = useMemo(() => {
    let result = [...filteredTransactions];

    // 1. Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((tx) => tx.category === selectedCategory);
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.title.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc': {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return diff !== 0 ? diff : (b.createdAt || 0) - (a.createdAt || 0);
        }
        case 'date-asc': {
          const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
          return diff !== 0 ? diff : (a.createdAt || 0) - (b.createdAt || 0);
        }
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [filteredTransactions, selectedCategory, searchQuery, sortOption]);

  const totalFilteredAmount = useMemo(() => {
    return processedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [processedTransactions]);

  const averageExpense = useMemo(() => {
    return filteredTransactions.length > 0 ? totalSpentThisMonth / filteredTransactions.length : 0;
  }, [filteredTransactions.length, totalSpentThisMonth]);

  const countsPerCategory = useMemo(() => {
    const counts: Record<string, number> = { all: filteredTransactions.length };
    for (const cat of CATEGORY_LIST) {
      counts[cat.id] = filteredTransactions.filter((t) => t.category === cat.id).length;
    }
    return counts;
  }, [filteredTransactions]);

  const isFilterActive = searchQuery.trim() !== '' || selectedCategory !== 'all';

  return (
    <div className="w-full space-y-4 animate-fadeIn font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-[#DED9D2] rounded-[2px] sf-card">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
            <IconReceipt size={20} stroke={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-mono font-bold text-[#1B1A18] uppercase tracking-wider">
                Transactions Ledger
              </h1>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59]">
                {selectedMonth.label}
              </span>
            </div>
            <p className="text-xs text-[#625E59] font-normal mt-0.5">
              Audited record of expenses, categorized outflows, and lifespan tracking
            </p>
          </div>
        </div>

        {/* Header Action Button */}
        <button
          onClick={onOpenAddModal}
          className="sf-button-primary h-9 px-4 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <IconPlus size={15} stroke={2.5} />
          <span>New Entry</span>
        </button>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Monthly Outflow */}
        <div className="bg-white border border-[#DED9D2] rounded-[2px] p-4 flex flex-col justify-between hover:border-[#1B1A18] transition-colors sf-card">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block">
            Month Outflow
          </span>
          <div className="mt-2 mb-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#1B1A18] tabular-nums tracking-tight">
              {formatCurrency(totalSpentThisMonth, currency)}
            </span>
          </div>
          <span className="text-xs text-[#625E59] font-mono">
            {filteredTransactions.length} recorded {filteredTransactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Filtered Volume */}
        <div className="bg-white border border-[#DED9D2] rounded-[2px] p-4 flex flex-col justify-between hover:border-[#1B1A18] transition-colors sf-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block">
              Filtered Volume
            </span>
            {isFilterActive && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] bg-[#F9EEE9] text-[#E65B3F] border border-[#E65B3F]/30 uppercase">
                Active
              </span>
            )}
          </div>
          <div className="mt-2 mb-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#E65B3F] tabular-nums tracking-tight">
              {formatCurrency(totalFilteredAmount, currency)}
            </span>
          </div>
          <span className="text-xs text-[#625E59] font-mono">
            {processedTransactions.length} of {filteredTransactions.length} matching
          </span>
        </div>

        {/* Average Transaction Size */}
        <div className="bg-white border border-[#DED9D2] rounded-[2px] p-4 flex flex-col justify-between hover:border-[#1B1A18] transition-colors sf-card">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block">
            Average / Entry
          </span>
          <div className="mt-2 mb-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#1B1A18] tabular-nums tracking-tight">
              {formatCurrency(averageExpense, currency)}
            </span>
          </div>
          <span className="text-xs text-[#625E59] font-mono">
            Mean transaction size
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="bg-white border border-[#DED9D2] rounded-[2px] p-4 space-y-3 sf-card">
        {/* Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <IconSearch
              size={15}
              stroke={2}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#625E59]"
            />
            <input
              type="text"
              placeholder="Search items by description, merchant, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className="sf-input w-full h-9 pl-9 pr-8 text-xs font-medium placeholder:text-[#625E59] rounded-[2px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#625E59] hover:text-[#1B1A18] p-0.5 rounded-[2px]"
                aria-label="Clear search"
              >
                <IconX size={14} stroke={2} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="relative shrink-0 sm:w-44">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="sf-input appearance-none pl-3 pr-8 h-9 text-xs font-mono font-medium text-[#1B1A18] cursor-pointer bg-white w-full rounded-[2px]"
              aria-label="Sort transactions"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="title-asc">Name (A-Z)</option>
            </select>
            <IconArrowsSort
              size={13}
              stroke={2}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#625E59] pointer-events-none"
            />
          </div>

          {/* Reset Filters (shown if filtered) */}
          {isFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="sf-button-ghost h-9 px-3 text-xs font-mono flex items-center justify-center gap-1.5 shrink-0 rounded-[2px]"
            >
              <IconX size={13} stroke={2} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 select-none text-xs pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-[2px] font-mono text-xs transition-all flex items-center gap-1.5 active:translate-y-[1px] ${
              selectedCategory === 'all'
                ? 'bg-[#1B1A18] text-white border border-[#1B1A18] font-bold shadow-xs'
                : 'bg-[#F7F5F2] text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18] hover:text-[#1B1A18]'
            }`}
          >
            <span>All</span>
            <span className="text-[11px] tabular-nums opacity-85">({countsPerCategory.all || 0})</span>
          </button>

          {CATEGORY_LIST.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = countsPerCategory[cat.id] || 0;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-[2px] font-mono text-xs transition-all flex items-center gap-1.5 active:translate-y-[1px] ${
                  isActive
                    ? 'bg-[#1B1A18] text-white border border-[#1B1A18] font-bold shadow-xs'
                    : 'bg-[#F7F5F2] text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18] hover:text-[#1B1A18]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[11px] tabular-nums opacity-85">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Filter Summary Status */}
        <div className="flex items-center justify-between text-xs text-[#625E59] font-mono px-0.5 pt-2 border-t border-[#DED9D2]/70">
          <div className="flex items-center gap-1.5">
            <IconFilter size={12} stroke={2} className="text-[#625E59]" />
            <span>
              Showing <span className="text-[#1B1A18] font-bold tabular-nums">{processedTransactions.length}</span>{' '}
              of <span className="tabular-nums font-bold text-[#1B1A18]">{filteredTransactions.length}</span> entries
            </span>
          </div>
          <span>
            Total:{' '}
            <strong className="text-[#1B1A18] font-bold tabular-nums">
              {formatCurrency(totalFilteredAmount, currency)}
            </strong>
          </span>
        </div>
      </div>

      {/* 4. Table Header & Transaction List Container */}
      <div className="space-y-2">
        {/* Synchronized Column Header Row */}
        <div className="hidden sm:flex items-center justify-between px-3 sm:px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider text-[#625E59] bg-[#F7F5F2] border border-[#DED9D2] rounded-[2px] select-none font-semibold">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-8 text-center shrink-0">Type</span>
            <span className="min-w-0 flex-1">Item & Category</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="min-w-[90px] text-right">Amount</span>
            <span className="min-w-[76px] text-right">Actions</span>
          </div>
        </div>

        {/* Transactions Items */}
        {processedTransactions.length === 0 ? (
          <div className="rounded-[2px] bg-white border border-dashed border-[#DED9D2] p-10 sm:p-14 text-center">
            <div className="w-10 h-10 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#625E59] mx-auto mb-3">
              <IconReceipt size={22} stroke={2} />
            </div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
              No transactions found
            </h4>
            <p className="text-xs text-[#625E59] mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search query or selected category filter.'
                : 'No expenses recorded for this month yet.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="sf-button-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-[2px]"
                >
                  <IconX size={13} stroke={2} />
                  <span>Clear Filters</span>
                </button>
              )}
              <button
                onClick={onOpenAddModal}
                className="sf-button-primary text-xs font-mono uppercase tracking-wider py-1.5 px-3.5 flex items-center gap-1.5 rounded-[2px]"
              >
                <IconPlus size={14} stroke={2.5} />
                <span>Record Expense</span>
              </button>
            </div>
          </div>
        ) : (
          processedTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onEdit={onEditTransaction}
              onTrackAmortization={onTrackAmortization}
            />
          ))
        )}
      </div>
    </div>
  );
}

