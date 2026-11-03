'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IconX, IconPlus, IconCheck, IconPencil } from '@tabler/icons-react';
import { Transaction, CategoryId } from '@/types/finance';
import { CATEGORY_LIST } from '@/constants/categories';
import { useFinance } from '@/context/FinanceContext';
import { getTodayDateString, convertToBaseCurrency, convertFromBaseCurrency } from '@/utils/formatters';

/**
 * Props for AddEditExpenseModal component.
 */
interface AddEditExpenseModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Transaction being edited, or null/undefined if creating a new expense */
  editingTransaction?: Transaction | null;
  /** Optional prefilled date string (YYYY-MM-DD) */
  initialDate?: string;
}

/**
 * Modal dialog for recording a new expense or editing an existing transaction.
 */
export function AddEditExpenseModal({
  isOpen,
  onClose,
  editingTransaction,
  initialDate,
}: AddEditExpenseModalProps) {

  const { addTransaction, updateTransaction, currency, selectedMonth } = useFinance();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId>('food_dining');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      const converted = convertFromBaseCurrency(editingTransaction.amount, currency);
      setAmount(converted.toString());
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('food_dining');
      const today = getTodayDateString();
      if (initialDate) {
        setDate(initialDate);
      } else if (today.startsWith(selectedMonth.key)) {
        setDate(today);
      } else {
        setDate(`${selectedMonth.key}-01`);
      }
      setNotes('');
    }
    setError(null);
  }, [editingTransaction, isOpen, initialDate, selectedMonth.key, currency]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter an item name.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    const baseAmount = convertToBaseCurrency(parsedAmount, currency);

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        title: title.trim(),
        amount: baseAmount,
        category,
        date,
        notes: notes.trim() || undefined,
      });
    } else {
      addTransaction({
        title: title.trim(),
        amount: baseAmount,
        category,
        date,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sf-modal-backdrop animate-fadeIn font-sans"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={editingTransaction ? 'Edit Expense' : 'Record New Expense'}
    >
      <div
        className="w-full max-w-md rounded-[2px] sf-modal overflow-hidden relative font-sans shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DED9D2] bg-[#F7F5F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              {editingTransaction ? <IconPencil size={17} stroke={2} /> : <IconPlus size={17} stroke={2.5} />}
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                {editingTransaction ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <p className="text-xs text-[#625E59] font-normal">
                {editingTransaction
                  ? 'Modify transaction details'
                  : 'Save entry to your personal finance ledger'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-sans bg-[#F7F5F2] overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Grocery run, Flight..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sf-input w-full h-9 px-3 text-xs"
              autoFocus
            />
          </div>

          {/* Price / Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="sf-input w-full h-9 px-3 text-xs font-mono font-bold tracking-tight tabular-nums"
            />
          </div>

          {/* Category Dropdown & Quick Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
              Category *
            </label>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {CATEGORY_LIST.slice(0, 5).map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-[2px] border transition-all ${
                    category === cat.id
                      ? 'bg-[#1B1A18] text-white border-[#1B1A18] font-bold'
                      : 'bg-white text-[#625E59] border-[#DED9D2] hover:border-[#1B1A18] hover:text-[#1B1A18]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
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

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="sf-input w-full h-9 px-3 text-xs font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
              Notes <span className="text-[#625E59] text-[11px] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add additional notes or split details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sf-input w-full py-2 px-3 text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#DED9D2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="sf-button-ghost h-9 px-4 text-xs font-mono flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="sf-button-primary h-9 px-5 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {editingTransaction ? <IconCheck size={14} stroke={2.5} /> : <IconPlus size={14} stroke={2.5} />}
              <span>{editingTransaction ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
