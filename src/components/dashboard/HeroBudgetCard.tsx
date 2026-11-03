'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, convertToBaseCurrency, convertFromBaseCurrency } from '@/utils/formatters';
import { CURRENCIES } from '@/constants/categories';

/**
 * Top dashboard hero card showcasing total outflow for the selected month,
 * breakdown of settled vs scheduled expenses, budget headroom,
 * and an interactive monthly target utilization progress bar.
 */
export function HeroBudgetCard() {
  const {
    selectedMonth,
    currentBudget,
    setMonthlyBudget,
    totalSpentThisMonth,
    settledSpentThisMonth,
    scheduledSpentThisMonth,
    currency,
  } = useFinance();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const displayBudget = convertFromBaseCurrency(currentBudget || 0, currency);
  const [budgetValue, setBudgetValue] = useState(displayBudget.toString());

  useEffect(() => {
    const converted = convertFromBaseCurrency(currentBudget || 0, currency);
    setBudgetValue(converted.toString());
  }, [currentBudget, currency]);

  const remaining = currentBudget - totalSpentThisMonth;
  const percentUsed = currentBudget > 0 ? Math.round((totalSpentThisMonth / currentBudget) * 100) : 0;
  const isOverBudget = remaining < 0;

  const handleSaveBudget = () => {
    const num = parseFloat(budgetValue);
    if (!isNaN(num) && num >= 0) {
      const baseBudget = convertToBaseCurrency(num, currency);
      setMonthlyBudget(selectedMonth.key, baseBudget);
    } else {
      setBudgetValue(displayBudget.toString());
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="sf-card p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-stretch font-sans">
      {/* Left Half: Outflow, Giant Stat, Breakdown & Headroom Badges */}
      <div className="flex flex-col justify-between gap-4 lg:pr-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65B3F] rotate-45 shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#625E59] font-bold">
              {selectedMonth.label} Total Outflow
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-[#1B1A18] tracking-tight leading-none tabular-nums mt-2">
            {formatCurrency(totalSpentThisMonth, currency)}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-white border border-[#DED9D2] text-xs font-mono">
            <span className="w-1.5 h-1.5 bg-[#1B1A18] shrink-0" />
            <span className="text-[#625E59]">Settled:</span>
            <strong className="font-bold text-[#1B1A18] tabular-nums">{formatCurrency(settledSpentThisMonth, currency)}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-white border border-[#DED9D2] text-xs font-mono">
            <span className="w-1.5 h-1.5 bg-[#625E59] shrink-0" />
            <span className="text-[#625E59]">Scheduled:</span>
            <strong className="font-bold text-[#1B1A18] tabular-nums">{formatCurrency(scheduledSpentThisMonth, currency)}</strong>
          </span>

          {currentBudget > 0 ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-mono border ${
              isOverBudget ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#F9EEE9] text-[#A83F29] border-[#E65B3F]/30'
            }`}>
              <span className={`w-1.5 h-1.5 shrink-0 ${isOverBudget ? 'bg-red-600' : 'bg-[#E65B3F]'}`} />
              <span>{isOverBudget ? 'Over target:' : 'Headroom:'}</span>
              <strong className="font-bold tabular-nums">{formatCurrency(Math.abs(remaining), currency)}</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingBudget(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-mono bg-[#F7F5F2] text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18] hover:text-[#1B1A18] transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-[#625E59] shrink-0" />
              <span>Target: <strong className="font-bold text-[#E65B3F]">+ Set Monthly Target</strong></span>
            </button>
          )}
        </div>
      </div>

      {/* Right Half: Monthly Target Utilization with desktop left separator */}
      <div className="flex flex-col justify-between gap-4 lg:border-l lg:border-[#DED9D2] lg:pl-8 pt-4 lg:pt-0 border-t border-[#DED9D2] lg:border-t-0">
        <div className="flex items-center justify-between text-xs font-semibold text-[#1B1A18]">
          <span className="text-xs uppercase tracking-wider text-[#625E59] font-mono font-bold">
            Monthly Target Utilization
          </span>
          {currentBudget > 0 ? (
            <span className={`px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold tabular-nums ${
              isOverBudget
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-[#F9EEE9] text-[#A83F29] border border-[#E65B3F]/30'
            }`}>
              {percentUsed}%
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-[2px] text-xs font-mono text-[#625E59] bg-[#F7F5F2] border border-[#DED9D2]">
              No Target Set
            </span>
          )}
        </div>

        {/* Progress Track & Bar */}
        <div className="space-y-2 my-auto py-1">
          <div className="relative w-full h-3 bg-[#EFECE6] rounded-[2px] overflow-hidden border border-[#E5E0D8]">
            {/* Subtle 50% and 80% guide marks */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#DED9D2] z-10 pointer-events-none" />
            <div className="absolute left-[80%] top-0 bottom-0 w-[1px] bg-[#DED9D2] z-10 pointer-events-none" />
            <div
              className={`h-full rounded-[2px] transition-all duration-700 ease-out ${
                currentBudget === 0 ? 'bg-transparent' : isOverBudget ? 'bg-[#A33B27]' : 'bg-[#E65B3F]'
              }`}
              style={{ width: `${currentBudget === 0 ? 0 : Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-[#625E59] font-medium pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#E65B3F] shrink-0" />
            <span>Spent <strong className="font-mono font-bold text-[#1B1A18] tabular-nums">{formatCurrency(totalSpentThisMonth, currency)}</strong></span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#DED9D2] shrink-0" />
            {isEditingBudget ? (
              <span className="flex items-center gap-1.5 bg-white border border-[#E65B3F] px-2 py-0.5 rounded-[2px]">
                <span className="font-mono text-xs font-bold text-[#625E59]">{CURRENCIES[currency]?.symbol || '₹'}</span>
                <input
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  className="w-20 text-xs font-mono bg-transparent text-[#1B1A18] focus:outline-none tabular-nums font-bold"
                  autoFocus
                  onBlur={handleSaveBudget}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBudget();
                    if (e.key === 'Escape') {
                      setIsEditingBudget(false);
                      setBudgetValue(displayBudget.toString());
                    }
                  }}
                />
              </span>
            ) : (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="hover:text-[#1B1A18] transition-colors flex items-center gap-1 group"
                title="Click to edit target"
              >
                <span>Target:</span>
                <strong className="font-mono font-bold text-[#1B1A18] tabular-nums underline decoration-dotted underline-offset-2 group-hover:text-[#E65B3F]">
                  {currentBudget > 0 ? formatCurrency(currentBudget, currency) : 'Set Target'}
                </strong>
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
