'use client';

import React from 'react';
import { IconSearch, IconReceipt, IconPlus } from '@tabler/icons-react';
import { Transaction, CategoryId, CurrencyCode, AmortizedItem } from '@/types/finance';
import { CATEGORY_LIST, CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface AmortizedExpensePickerProps {
  transactions: Transaction[];
  searchTxQuery: string;
  onSearchChange: (query: string) => void;
  selectedTxCategory: CategoryId | 'all';
  onCategoryChange: (cat: CategoryId | 'all') => void;
  selectableTransactions: Transaction[];
  trackedTxIds: Map<string, AmortizedItem>;
  currency: CurrencyCode;
  onSelectTransaction: (tx: Transaction) => void;
  onSwitchToCustom: () => void;
}

export function AmortizedExpensePicker({
  transactions,
  searchTxQuery,
  onSearchChange,
  selectedTxCategory,
  onCategoryChange,
  selectableTransactions,
  trackedTxIds,
  currency,
  onSelectTransaction,
  onSwitchToCustom,
}: AmortizedExpensePickerProps) {
  return (
    <div className="space-y-3.5">
      <div className="space-y-0.5">
        <label className="text-xs font-mono font-semibold text-[#1B1A18] block">
          Select an expense:
        </label>
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
          placeholder="Search expenses..."
          value={searchTxQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sf-input w-full h-9 pl-9 pr-3.5 text-xs"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
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
              onClick={() => onCategoryChange(cat.id)}
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
                ? 'No expenses recorded yet.'
                : 'No matching expenses.'}
            </p>
            <button
              type="button"
              onClick={onSwitchToCustom}
              className="mt-2 inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#E65B3F] hover:underline"
            >
              <IconPlus size={13} stroke={2} />
              <span>Add custom product</span>
            </button>
          </div>
        ) : (
          selectableTransactions.map((tx) => {
            const alreadyTracked = trackedTxIds.get(tx.id);
            const catMeta = CATEGORIES[tx.category] || CATEGORIES.other;

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
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
  );
}

