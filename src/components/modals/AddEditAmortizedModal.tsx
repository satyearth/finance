'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  IconX,
  IconPlus,
  IconCheck,
  IconSparkles,
  IconSearch,
  IconReceipt,
  IconPencil,
  IconArrowLeft,
  IconHourglassEmpty,
} from '@tabler/icons-react';
import { AmortizedItem, CategoryId, Transaction } from '@/types/finance';
import { CATEGORY_LIST, CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { useFinance } from '@/context/FinanceContext';
import {
  getTodayDateString,
  formatCurrency,
  formatDate,
  convertToBaseCurrency,
  convertFromBaseCurrency,
} from '@/utils/formatters';

/**
 * Props for AddEditAmortizedModal component.
 */
interface AddEditAmortizedModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Existing amortized item being edited, or null/undefined if adding */
  editingItem?: AmortizedItem | null;
  /** Optional transaction preselected to link directly to this lifespan item */
  initialTransaction?: Transaction | null;
}

/** Preset duration choices in months */
const DURATION_PRESETS = [
  { label: '1 Month', months: 1 },
  { label: '2 Months', months: 2 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
  { label: 'No Lifespan', months: -1 },
  { label: 'Custom', months: 0 },
];

/**
 * Adds a given number of months to an ISO date string (YYYY-MM-DD).
 *
 * @param dateStr - Base date string
 * @param monthsToAdd - Number of calendar months to add
 * @returns Projected finish date string
 */
function addMonthsToDate(dateStr?: string, monthsToAdd: number = 0): string {
  if (!dateStr || typeof dateStr !== 'string') return getTodayDateString();
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    date.setMonth(date.getMonth() + monthsToAdd);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr || getTodayDateString();
  }
}

/**
 * Calculates calendar days between two ISO date strings (YYYY-MM-DD).
 *
 * @param startStr - Start date
 * @param endStr - End date
 * @returns Number of days
 */
function calculateDaysDifference(startStr?: string, endStr?: string): number {
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

/**
 * Modal dialog for product lifespan amortization tracking:
 * - Tab 1: Pick an already added expense to track its lifespan
 * - Tab 2: Manually enter custom product specifications
 * Calculates monthly and daily burn rate with interactive presets and dates.
 */
export function AddEditAmortizedModal({
  isOpen,
  onClose,
  editingItem,
  initialTransaction,
}: AddEditAmortizedModalProps) {

  const {
    transactions,
    amortizedItems,
    addAmortizedItem,
    updateAmortizedItem,
    currency,
  } = useFinance();

  // Tab mode: 'from_list' (pick from already added transactions) vs 'custom' (manual entry)
  const [activeTabMode, setActiveTabMode] = useState<'from_list' | 'custom'>('from_list');

  // Search & filter for selecting from existing transactions
  const [searchTxQuery, setSearchTxQuery] = useState('');
  const [selectedTxCategory, setSelectedTxCategory] = useState<CategoryId | 'all'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState<CategoryId>('personal_care');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPresetMonths, setSelectedPresetMonths] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize modal state on open or prop change
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setActiveTabMode('custom');
      setSelectedTx(null);
      setName(editingItem.name || '');
      const convertedCost = convertFromBaseCurrency(editingItem.totalCost ?? 0, currency);
      setCost(convertedCost !== undefined && convertedCost !== null ? convertedCost.toString() : '0');
      setCategory(editingItem.category || 'personal_care');
      setStartDate(editingItem.startDate || getTodayDateString());
      setEndDate(editingItem.endDate || '');
      setSelectedPresetMonths(
        editingItem.durationMonths !== undefined ? editingItem.durationMonths : -1
      );
      setNotes(editingItem.notes || '');
    } else if (
      initialTransaction &&
      typeof initialTransaction === 'object' &&
      'title' in initialTransaction &&
      'amount' in initialTransaction
    ) {
      // Opened directly with a selected transaction!
      setActiveTabMode('from_list');
      setSelectedTx(initialTransaction);
      setName(initialTransaction.title || '');
      const convertedCost = convertFromBaseCurrency(initialTransaction.amount ?? 0, currency);
      setCost(convertedCost !== undefined && convertedCost !== null ? convertedCost.toString() : '0');
      setCategory(initialTransaction.category || 'personal_care');
      const txDate = initialTransaction.date || getTodayDateString();
      setStartDate(txDate);
      const defaultEnd = addMonthsToDate(txDate, 2);
      setEndDate(defaultEnd);
      setSelectedPresetMonths(2);
      setNotes(initialTransaction.notes || '');
    } else {
      // Default Add: choose from existing transactions
      setActiveTabMode('from_list');
      setSelectedTx(null);
      setSearchTxQuery('');
      setSelectedTxCategory('all');
      setName('');
      setCost('');
      setCategory('personal_care');
      const today = getTodayDateString();
      setStartDate(today);
      const defaultEnd = addMonthsToDate(today, 2);
      setEndDate(defaultEnd);
      setSelectedPresetMonths(2);
      setNotes('');
    }
    setError(null);
  }, [isOpen, editingItem, initialTransaction, currency]);

  // When a transaction is selected from the list
  const handleSelectTransaction = (tx: Transaction) => {
    if (!tx) return;
    setSelectedTx(tx);
    setName(tx.title || '');
    const convertedCost = convertFromBaseCurrency(tx.amount ?? 0, currency);
    setCost(convertedCost !== undefined && convertedCost !== null ? convertedCost.toString() : '0');
    setCategory(tx.category || 'personal_care');
    const txDate = tx.date || getTodayDateString();
    setStartDate(txDate);
    const defaultEnd = addMonthsToDate(txDate, 2);
    setEndDate(defaultEnd);
    setSelectedPresetMonths(2);
    setNotes(tx.notes || '');
    setError(null);
  };

  // Map of transactions that are already being amortized
  const trackedTxIds = useMemo(() => {
    const map = new Map<string, AmortizedItem>();
    if (!Array.isArray(amortizedItems)) return map;
    for (const item of amortizedItems) {
      if (item && item.transactionId) {
        map.set(item.transactionId, item);
      }
    }
    return map;
  }, [amortizedItems]);

  // Filtered list of transactions for selection
  const selectableTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter((tx) => {
      if (!tx || typeof tx !== 'object') return false;
      // Category filter
      if (selectedTxCategory !== 'all' && tx.category !== selectedTxCategory) {
        return false;
      }
      // Search filter
      if (searchTxQuery.trim()) {
        const q = searchTxQuery.toLowerCase();
        const matchesTitle = tx.title ? tx.title.toLowerCase().includes(q) : false;
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNotes) return false;
      }
      return true;
    });
  }, [transactions, selectedTxCategory, searchTxQuery]);

  if (!isOpen) return null;

  // Handle preset click
  const handlePresetSelect = (months: number) => {
    setSelectedPresetMonths(months);
    if (months === -1) {
      setEndDate('');
    } else if (months > 0 && startDate) {
      const calculatedEnd = addMonthsToDate(startDate, months);
      setEndDate(calculatedEnd);
    }
  };

  // When start date changes and preset is active, re-calculate end date
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (selectedPresetMonths > 0) {
      setEndDate(addMonthsToDate(newStart, selectedPresetMonths));
    }
  };

  // Check if item has lifespan set
  const hasLifespan = Boolean(endDate && endDate.trim());

  // Calculations for live preview
  const parsedCost = parseFloat(cost) || 0;
  const totalDays = hasLifespan ? calculateDaysDifference(startDate, endDate) : 0;
  const calculatedMonths =
    hasLifespan
      ? selectedPresetMonths > 0
        ? selectedPresetMonths
        : Math.max(0.1, Number((totalDays / 30.44).toFixed(1)))
      : 0;
  const monthlyCost = hasLifespan && calculatedMonths > 0 ? parsedCost / calculatedMonths : 0;
  const dailyCost = hasLifespan && totalDays > 0 ? parsedCost / totalDays : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please choose an expense or enter a product name.');
      return;
    }

    if (parsedCost <= 0) {
      setError('Please enter a valid purchase price.');
      return;
    }

    if (!startDate) {
      setError('Please specify a purchase start date.');
      return;
    }

    if (hasLifespan && new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after the start date.');
      return;
    }

    const baseTotalCost = convertToBaseCurrency(parsedCost, currency);
    const baseMonthlyCost = hasLifespan ? convertToBaseCurrency(monthlyCost, currency) : undefined;
    const baseDailyCost = hasLifespan ? convertToBaseCurrency(dailyCost, currency) : undefined;

    const isStillActive = hasLifespan ? new Date(endDate) >= new Date() : true;

    if (editingItem) {
      updateAmortizedItem(editingItem.id, {
        name: name.trim(),
        totalCost: baseTotalCost,
        startDate,
        endDate: hasLifespan ? endDate : undefined,
        durationMonths: hasLifespan ? Math.max(0.1, Number(calculatedMonths.toFixed(1))) : undefined,
        durationDays: hasLifespan ? totalDays : undefined,
        monthlyCost: baseMonthlyCost,
        dailyCost: baseDailyCost,
        category,
        notes: notes.trim() || undefined,
        status: isStillActive ? 'active' : 'completed',
        transactionId: selectedTx?.id || editingItem.transactionId,
      });
    } else {
      addAmortizedItem({
        name: name.trim(),
        totalCost: baseTotalCost,
        startDate,
        endDate: hasLifespan ? endDate : undefined,
        durationMonths: hasLifespan ? Math.max(0.1, Number(calculatedMonths.toFixed(1))) : undefined,
        durationDays: hasLifespan ? totalDays : undefined,
        monthlyCost: baseMonthlyCost,
        dailyCost: baseDailyCost,
        category,
        notes: notes.trim() || undefined,
        status: isStillActive ? 'active' : 'completed',
        transactionId: selectedTx?.id,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sf-modal-backdrop animate-fadeIn font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="amort-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-[2px] sf-modal overflow-hidden relative font-sans shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DED9D2] bg-[#F7F5F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconHourglassEmpty size={17} stroke={2} />
            </div>
            <div>
              <h3 id="amort-modal-title" className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                {editingItem
                  ? 'Edit Lifespan Tracking'
                  : selectedTx
                    ? 'Set Product Lifespan'
                    : 'Track Lifespan from Added Expenses'}
              </h3>
              <p className="text-xs text-[#625E59] font-normal">
                {editingItem
                  ? 'Modify duration or details for this item'
                  : 'Calculate true monthly burn for items lasting multiple months'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-[2px] border border-[#DED9D2] bg-white text-[#625E59] hover:text-[#1B1A18] hover:border-[#1B1A18] flex items-center justify-center transition-colors"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {/* Mode Switcher Tabs (Only when adding new, not editing) */}
        {!editingItem && !selectedTx && (
          <div className="p-3 bg-[#F7F5F2] border-b border-[#DED9D2] flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTabMode('from_list')}
              className={`flex-1 h-8.5 px-3 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 rounded-[2px] transition-colors ${
                activeTabMode === 'from_list'
                  ? 'sf-button-primary'
                  : 'sf-button-ghost'
              }`}
            >
              <IconReceipt size={14} stroke={2} />
              <span>Choose from Expenses ({(transactions || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('custom')}
              className={`flex-1 h-8.5 px-3 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 rounded-[2px] transition-colors ${
                activeTabMode === 'custom'
                  ? 'sf-button-primary'
                  : 'sf-button-ghost'
              }`}
            >
              <IconPencil size={14} stroke={2} />
              <span>Custom Product</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1 bg-[#F7F5F2]">
          {error && (
            <div className="p-3 rounded-none bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
              {error}
            </div>
          )}

          {/* VIEW 1: SELECTING FROM EXISTING EXPENSES LIST */}
          {!editingItem && activeTabMode === 'from_list' && !selectedTx ? (
            <div className="space-y-3.5">
              <div className="space-y-0.5">
                <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
                  Select an expense you already added:
                </label>
                <p className="text-xs text-[#625E59]">
                  Choose any product/expense below to track its duration and monthly impact.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <IconSearch
                  size={14}
                  stroke={2}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#625E59]"
                />
                <input
                  type="text"
                  placeholder="Search added expenses (e.g. Shampoo, Protein, Gym)..."
                  value={searchTxQuery}
                  onChange={(e) => setSearchTxQuery(e.target.value)}
                  className="sf-input w-full h-9 pl-9 pr-3.5 text-xs"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedTxCategory('all')}
                  className={`px-2.5 py-1 rounded-none font-mono font-semibold whitespace-nowrap transition-colors ${
                    selectedTxCategory === 'all'
                      ? 'bg-[#E65B3F] text-white'
                      : 'bg-white text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18]'
                  }`}
                >
                  All ({(transactions || []).length})
                </button>
                {CATEGORY_LIST.map((cat) => {
                  const count = (transactions || []).filter((t) => t && t.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedTxCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-none font-mono font-semibold whitespace-nowrap transition-colors ${
                        selectedTxCategory === cat.id
                          ? 'bg-[#E65B3F] text-white'
                          : 'bg-white text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18]'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Transactions List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {selectableTransactions.length === 0 ? (
                  <div className="p-8 text-center rounded-none bg-white border border-dashed border-[#DED9D2] space-y-2">
                    <IconReceipt size={28} stroke={1.5} className="mx-auto text-[#625E59]" />
                    <h4 className="text-xs font-mono font-bold uppercase text-[#1B1A18]">No matching expenses found</h4>
                    <p className="text-xs text-[#625E59] max-w-xs mx-auto">
                      {(transactions || []).length === 0
                        ? "You haven't recorded any expenses yet. You can enter custom product details directly."
                        : 'Try searching with a different keyword or clear your category filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('custom')}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#E65B3F] hover:underline"
                    >
                      <IconPlus size={13} stroke={2} />
                      <span>Enter Custom Product Manually</span>
                    </button>
                  </div>
                ) : (
                  selectableTransactions.map((tx) => {
                    const alreadyTracked = trackedTxIds.get(tx.id);
                    const catMeta = CATEGORIES[tx.category] || CATEGORIES.other;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => handleSelectTransaction(tx)}
                        className="group flex items-center justify-between p-3 rounded-[2px] bg-white border border-[#DED9D2] hover:border-[#1B1A18] transition-colors cursor-pointer gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] flex items-center justify-center shrink-0">
                            <CategoryIcon category={tx.category} size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-semibold text-[#1B1A18] truncate">
                                {tx.title}
                              </h5>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59] shrink-0 font-medium">
                                {catMeta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-[#625E59]">
                              <span>{formatDate(tx.date)}</span>
                              {alreadyTracked && (
                                <span className="inline-flex items-center gap-1 font-bold text-[#E65B3F]">
                                  &bull; ✓ Tracked ({alreadyTracked.durationMonths || '—'}m)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="min-w-[70px] text-right text-xs font-mono font-bold text-[#1B1A18] tabular-nums">
                            {formatCurrency(tx.amount, currency)}
                          </span>
                          <button
                            type="button"
                            className="sf-button-primary h-7 px-2.5 text-[11px] uppercase tracking-wider font-mono rounded-[2px]"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: CONFIGURE LIFESPAN (Selected Transaction or Custom Form) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If Selected from existing Transaction: Display Banner */}
              {selectedTx && !editingItem && (
                <div className="p-3.5 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] flex items-center justify-center shrink-0">
                      <CategoryIcon category={selectedTx.category} size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono font-semibold text-[#625E59] block leading-none">
                        Selected Expense
                      </span>
                      <h4 className="text-xs font-bold text-[#1B1A18] truncate mt-0.5">
                        {selectedTx.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#625E59] mt-0.5">
                        <span className="font-bold text-[#1B1A18] tabular-nums">
                          {formatCurrency(selectedTx.amount, currency)}
                        </span>
                        <span>&bull;</span>
                        <span>{formatDate(selectedTx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTx(null);
                      setName('');
                      setCost('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 h-7 rounded-[2px] text-xs font-mono font-semibold text-[#1B1A18] bg-[#F7F5F2] border border-[#DED9D2] hover:border-[#1B1A18] transition-colors shrink-0"
                  >
                    <IconArrowLeft size={12} stroke={2} />
                    <span>Change</span>
                  </button>
                </div>
              )}

              {/* If Custom Entry or Editing: Show editable Name & Category */}
              {(!selectedTx || editingItem) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-[#1B1A18] block">Product / Item Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunsilk Shampoo (650ml)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="sf-input w-full h-9 px-3 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-[#1B1A18] block">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryId)}
                      className="sf-input w-full h-9 px-3 text-xs font-mono cursor-pointer bg-white"
                    >
                      {CATEGORY_LIST.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Total Cost */}
              {(!selectedTx || editingItem) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
                    Total Purchase Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="e.g. 200"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="sf-input w-full h-9 px-3 text-xs font-mono font-bold tracking-tight tabular-nums"
                  />
                </div>
              )}

              {/* Duration Selector Preset Chips */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-[#1B1A18] flex items-center justify-between">
                  <span>Lifespan Duration (How long will it last?) *</span>
                  <span className="text-[11px] font-mono font-normal text-[#625E59]">
                    {hasLifespan ? `${calculatedMonths} months amortization` : 'Leave ongoing'}
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected = selectedPresetMonths === preset.months;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetSelect(preset.months)}
                        className={`h-8 px-1 text-xs font-mono font-semibold rounded-[2px] transition-colors text-center flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#E65B3F] text-white border border-[#E65B3F] font-bold'
                            : 'bg-white text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start and End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-[#1B1A18] block">Bought / Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="sf-input w-full h-9 px-3 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
                      Expected Finish Date <span className="font-normal text-[11px] text-[#625E59]">(Optional)</span>
                    </label>
                    {endDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEndDate('');
                          setSelectedPresetMonths(-1);
                        }}
                        className="text-[10px] font-mono text-[#E65B3F] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedPresetMonths(e.target.value ? 0 : -1);
                    }}
                    className="sf-input w-full h-9 px-3 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Live Amortization Calculation Result Pill */}
              <div className="p-4 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[2px] bg-white border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
                    <IconSparkles size={16} stroke={2} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#A83F29] uppercase tracking-wider block">
                      {hasLifespan ? 'Calculated Monthly Burn' : 'Lifespan Duration'}
                    </span>
                    <span className="text-xs text-[#A83F29]/80 font-normal">
                      {hasLifespan
                        ? `${formatCurrency(parsedCost, currency)} across ${totalDays} days (${calculatedMonths} mo)`
                        : 'Ongoing item without monthly split'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {hasLifespan ? (
                    <>
                      <span className="text-lg font-mono font-bold text-[#E65B3F] tabular-nums block leading-tight">
                        {formatCurrency(monthlyCost, currency)}
                        <span className="text-xs font-normal text-[#A83F29]"> / mo</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#A83F29]">
                        ~{formatCurrency(dailyCost, currency)} / day
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-mono font-bold text-[#1B1A18] tabular-nums block">
                        {parsedCost > 0 ? formatCurrency(parsedCost, currency) : '—'}
                      </span>
                      <span className="text-[10px] text-[#625E59]">
                        One-time cost
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
                  Notes <span className="font-normal text-[11px] text-[#625E59]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 650ml pack lasts 2 full months"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="sf-input w-full p-2.5 text-xs resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[#DED9D2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTx && !editingItem) {
                      setSelectedTx(null);
                    } else {
                      onClose();
                    }
                  }}
                  className="sf-button-ghost h-9 px-4 text-xs font-mono rounded-[2px]"
                >
                  {selectedTx && !editingItem ? 'Back to List' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="sf-button-primary h-9 px-5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-[2px]"
                >
                  {editingItem ? <IconCheck size={14} stroke={2.5} /> : <IconPlus size={14} stroke={2.5} />}
                  <span>
                    {editingItem
                      ? 'Save Changes'
                      : hasLifespan
                        ? `Track Lifespan (${formatCurrency(monthlyCost, currency)}/mo)`
                        : 'Track Lifespan'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
