'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  IconX,
  IconPlus,
  IconTrash,
  IconPencil,
  IconCalendar,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, CategoryId } from '@/types/finance';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { CATEGORY_LIST, CURRENCIES } from '@/constants/categories';
import { formatCurrency, convertToBaseCurrency } from '@/utils/formatters';

/**
 * Props for DayDetailsModal component.
 */
interface DayDetailsModalProps {
  /** ISO date string of selected day (YYYY-MM-DD), or null if modal is closed */
  dateString: string | null;
  /** Callback to close modal */
  onClose: () => void;
  /** Optional callback to edit a transaction from this day */
  onEditTransaction?: (tx: Transaction) => void;
}

/**
 * Modal dialog displaying all transactions recorded on a specific date,
 * with options to edit/delete existing transactions and quickly log new ones.
 */
export function DayDetailsModal({
  dateString,
  onClose,
  onEditTransaction,
}: DayDetailsModalProps) {

  const { transactions, addTransaction, deleteTransaction, currency } = useFinance();
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState<CategoryId>('food_dining');

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (dateString) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [dateString, handleKeyDown]);

  if (!dateString) return null;

  const dayTransactions = transactions.filter((t) => t.date === dateString);
  const dayTotal = dayTransactions.reduce((acc, t) => acc + t.amount, 0);

  const [y, m, d] = dateString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDayTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleQuickAddForDay = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(quickAmount);
    if (!quickTitle.trim() || isNaN(amountVal) || amountVal <= 0) return;

    const baseAmount = convertToBaseCurrency(amountVal, currency);

    addTransaction({
      title: quickTitle.trim(),
      amount: baseAmount,
      category: quickCategory,
      date: dateString,
      notes: 'Logged from Calendar',
    });

    setQuickTitle('');
    setQuickAmount('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sf-modal-backdrop animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={`Transactions for ${formattedDayTitle}`}
    >
      <div
        className="w-full max-w-lg rounded-[2px] sf-modal overflow-hidden flex flex-col max-h-[90vh] relative font-sans shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DED9D2] bg-[#F7F5F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconCalendar size={17} stroke={2} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">{formattedDayTitle}</h3>
              <p className="text-xs text-[#625E59] mt-0.5 font-mono">
                Day Outflow: <span className="text-[#1B1A18] font-bold tabular-nums">{formatCurrency(dayTotal, currency)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-[2px] border border-[#DED9D2] bg-white text-[#625E59] hover:text-[#1B1A18] hover:border-[#1B1A18] flex items-center justify-center transition-colors shrink-0"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-[#F7F5F2]">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#625E59]">
            Recorded Transactions ({dayTransactions.length})
          </div>

          {dayTransactions.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-[2px] bg-white border border-dashed border-[#DED9D2]">
              <p className="text-xs font-mono font-semibold text-[#1B1A18]">No expenses recorded for this date.</p>
              <p className="text-xs text-[#625E59] mt-1 font-mono">Use the form below to quickly log an expense.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-[2px] bg-white border border-[#DED9D2] hover:border-[#1B1A18] transition-colors group gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CategoryBadge category={tx.category} showLabel={false} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#1B1A18] truncate">{tx.title}</div>
                      {tx.notes && <div className="text-[11px] text-[#625E59] truncate font-normal mt-0.5">{tx.notes}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-mono text-xs font-bold text-[#1B1A18] tracking-tight tabular-nums text-right min-w-[75px]">
                      {formatCurrency(tx.amount, currency)}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          onClose();
                          onEditTransaction?.(tx);
                        }}
                        className="p-1.5 rounded-[2px] text-[#625E59] hover:text-[#1B1A18] hover:bg-[#F7F5F2] active:translate-y-[1px] transition-all"
                        title="Edit"
                        aria-label="Edit transaction"
                      >
                        <IconPencil size={13} stroke={2} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${tx.title}"?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 rounded-[2px] text-[#625E59] hover:text-red-600 hover:bg-red-50 active:translate-y-[1px] transition-all"
                        title="Delete"
                        aria-label="Delete transaction"
                      >
                        <IconTrash size={13} stroke={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Form for this day */}
          <div className="pt-4 border-t border-[#DED9D2]">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#625E59] mb-2.5">
              Quick Log for {dateString}
            </div>

            <form onSubmit={handleQuickAddForDay} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Description (e.g. Lunch with team)"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="sf-input w-full h-8.5 px-3 text-xs rounded-[2px]"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Amount (${CURRENCIES[currency]?.symbol || '₹'})`}
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="sf-input w-full h-8.5 px-3 text-xs font-mono font-bold tabular-nums rounded-[2px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as CategoryId)}
                  className="sf-input flex-1 h-8.5 px-3 text-xs font-mono cursor-pointer bg-white rounded-[2px]"
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="sf-button-primary h-8.5 text-xs uppercase tracking-wider px-4 shrink-0 flex items-center justify-center gap-1.5 font-mono rounded-[2px]"
                >
                  <IconPlus size={13} stroke={2.5} />
                  <span>Log Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
