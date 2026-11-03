'use client';

import React from 'react';
import { IconPencil, IconTrash, IconHourglassEmpty } from '@tabler/icons-react';
import { Transaction, AmortizedItem } from '@/types/finance';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { CATEGORIES } from '@/constants/categories';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useFinance } from '@/context/FinanceContext';

/**
 * Props for TransactionRow component.
 */
interface TransactionRowProps {
  /** The transaction item to display */
  transaction: Transaction;
  /** Callback to edit this transaction */
  onEdit: (tx: Transaction) => void;
  /** Optional callback to track product lifespan for this transaction */
  onTrackAmortization?: (tx: Transaction, existingItem?: AmortizedItem) => void;
}

/**
 * Individual transaction row item showing category icon, title, notes,
 * formatted date, amount, active amortization status pill, and action buttons.
 */
export function TransactionRow({
  transaction,
  onEdit,
  onTrackAmortization,
}: TransactionRowProps) {

  const { deleteTransaction, currency, amortizedItems } = useFinance();
  const catMeta = CATEGORIES[transaction.category] || CATEGORIES.other;

  // Check if this transaction is already being tracked in Amortization
  const amortizedItem = amortizedItems.find(
    (item) =>
      item.transactionId === transaction.id ||
      (item.name.toLowerCase() === transaction.title.toLowerCase() &&
        item.totalCost === transaction.amount)
  );

  return (
    <div className="group flex items-center justify-between p-3 sm:p-3.5 rounded-[2px] bg-white border border-[#DED9D2] hover:border-[#1B1A18] hover:bg-[#FDFCFB] transition-all gap-3 font-sans">
      {/* Left Icon + Title + Category + Date */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] group-hover:border-[#1B1A18] flex items-center justify-center transition-colors">
          <CategoryIcon category={transaction.category} size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h4
              className="text-sm font-semibold text-[#1B1A18] truncate max-w-[150px] xs:max-w-[220px] sm:max-w-md font-sans"
              title={transaction.title}
            >
              {transaction.title}
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59] shrink-0 font-medium font-mono">
              {catMeta.label}
            </span>

            {/* If already amortized, show lifespan pill */}
            {amortizedItem && (
              <button
                type="button"
                onClick={() => onTrackAmortization?.(transaction, amortizedItem)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#F9EEE9] text-[#A83F29] border border-[#E65B3F]/30 transition-all hover:bg-[#F3E2DB] active:scale-95"
                title="Lifespan tracking is active. Click to view or edit."
              >
                <IconHourglassEmpty size={10} stroke={2.5} />
                <span>
                  {amortizedItem.durationMonths
                    ? `${amortizedItem.durationMonths}m (${formatCurrency(amortizedItem.monthlyCost || 0, currency)}/mo)`
                    : 'Amortized'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#625E59] font-mono tabular-nums shrink-0 font-medium">
              {formatDate(transaction.date)}
            </span>
            {transaction.notes && (
              <span className="text-xs text-[#625E59] truncate max-w-[130px] sm:max-w-sm font-sans" title={transaction.notes}>
                &bull; {transaction.notes}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Amount + Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="text-sm font-mono font-bold tracking-tight tabular-nums text-[#1B1A18] text-right min-w-[75px] sm:min-w-[90px]">
          {formatCurrency(transaction.amount, currency)}
        </span>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity min-w-[68px] sm:min-w-[76px]">
          {/* Track lifespan button (if not already tracked) */}
          {!amortizedItem && onTrackAmortization && (
            <button
              onClick={() => onTrackAmortization(transaction)}
              className="p-1.5 rounded-[2px] text-[#625E59] hover:text-[#E65B3F] hover:bg-[#F9EEE9] active:translate-y-[1px] transition-all"
              title="Track product lifespan / monthly amortization"
              aria-label="Track lifespan"
            >
              <IconHourglassEmpty size={14} stroke={2} />
            </button>
          )}

          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-[2px] text-[#625E59] hover:text-[#1B1A18] hover:bg-[#F7F5F2] active:translate-y-[1px] transition-all"
            title="Edit"
            aria-label="Edit transaction"
          >
            <IconPencil size={14} stroke={2} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${transaction.title}"?`)) {
                deleteTransaction(transaction.id);
              }
            }}
            className="p-1.5 rounded-[2px] text-[#625E59] hover:text-red-600 hover:bg-red-50 active:translate-y-[1px] transition-all"
            title="Delete"
            aria-label="Delete transaction"
          >
            <IconTrash size={14} stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
