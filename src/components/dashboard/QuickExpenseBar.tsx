'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { parseNaturalLanguageExpense } from '@/utils/parser';
import { getTodayDateString, convertToBaseCurrency } from '@/utils/formatters';
import { CURRENCIES, CATEGORIES } from '@/constants/categories';

/**
 * Natural language quick expense entry bar.
 * Supports natural language input (e.g. "Dinner 450 food"), live amount previews,
 * and keyboard shortcuts ('/' or 'Cmd/Ctrl + K') to quickly focus.
 */
export function QuickExpenseBar() {

  const { addTransaction, currency, selectedMonth } = useFinance();
  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';
  const [inputVal, setInputVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [justAddedMsg, setJustAddedMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live NLP preview
  const preview = parseNaturalLanguageExpense(inputVal);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || preview.amount <= 0) return;

    const finalTitle = preview.title.trim() || (CATEGORIES[preview.category]?.label || 'Quick Expense');
    const baseAmount = convertToBaseCurrency(preview.amount, currency);
    const today = getTodayDateString();
    const dateToUse = today.startsWith(selectedMonth.key) ? today : `${selectedMonth.key}-01`;

    addTransaction({
      title: finalTitle,
      amount: baseAmount,
      category: preview.category,
      date: dateToUse,
    });

    setJustAddedMsg(`${finalTitle} (${currencySymbol}${preview.amount.toLocaleString()})`);
    setTimeout(() => setJustAddedMsg(null), 2500);

    setInputVal('');
    inputRef.current?.blur();
  };

  // Keyboard shortcut cmd+k / ctrl+k / '/' to focus quick track
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const canSubmit = Boolean(preview && preview.amount > 0);

  return (
    <form onSubmit={handleTrackSubmit} className="w-full font-sans">
      <div
        className={`flex items-center justify-between sf-card-white px-3.5 sm:px-4 py-2 min-h-[48px] gap-3 transition-all ${
          isFocused ? 'border-[#E65B3F] ring-1 ring-[#E65B3F]' : ''
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center shrink-0 text-[#E65B3F]">
            <IconSparkles size={15} stroke={2} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder='Quick add expense: e.g. "Coffee 280 Food", "Uber 450 Travel", "Gym 2000"...'
            className="w-full text-xs sm:text-sm font-medium text-[#1B1A18] placeholder:text-[#625E59] bg-transparent outline-none font-sans"
          />

          {justAddedMsg && (
            <span className="inline-flex items-center h-6 text-xs font-mono font-bold text-[#2A7E3B] bg-[#EBF7EE] border border-[#2A7E3B]/30 px-2.5 rounded-[2px] animate-fadeIn shrink-0">
              ✓ Logged: {justAddedMsg}
            </span>
          )}

          {preview && preview.amount > 0 && !justAddedMsg && (
            <div className="flex items-center gap-1.5 shrink-0 animate-fadeIn">
              <span className="inline-flex items-center h-6 text-[10px] font-mono uppercase font-bold text-[#625E59] bg-[#F7F5F2] border border-[#DED9D2] px-2 rounded-[2px]">
                {CATEGORIES[preview.category]?.label || 'Expense'}
              </span>
              <span className="inline-flex items-center h-6 text-xs font-mono font-bold text-[#A83F29] bg-[#F9EEE9] border border-[#E65B3F]/30 px-2.5 rounded-[2px] tabular-nums">
                {currencySymbol} {preview.amount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-8 sf-button-primary text-xs uppercase tracking-wider px-3.5 shrink-0 transition-opacity flex items-center justify-center rounded-[2px] ${
            !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Track
        </button>
      </div>
    </form>
  );
}
