'use client';

import React from 'react';
import {
  IconReceipt,
  IconClock,
  IconTrendingUp,
  IconAward,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/common/CategoryIcon';

/**
 * 4-metric grid displaying:
 * 1. Settled Outflow (realized expenses)
 * 2. Scheduled Bills (due recurring utilities)
 * 3. Daily Burn Pace (settled expenses / elapsed days)
 * 4. Top Category (category with greatest expenditure)
 */
export function BentoMetrics() {
  const {
    settledSpentThisMonth,
    scheduledSpentThisMonth,
    settledCount,
    scheduledCount,
    elapsedDaysThisMonth,
    dailySpendAverage,
    topCategory,
    categoryStats,
    currency,
  } = useFinance();

  const topCatStat = categoryStats[0] || null;
  const topCategoryMeta = topCategory?.category ? CATEGORIES[topCategory.category] : null;
  const topCategoryLabel = topCategoryMeta?.label || (topCategory ? 'General' : 'None');
  const topCategoryAmount = topCategory?.amount || 0;
  const topCategoryPercentage = topCatStat?.percentage || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 font-sans">
      {/* 1. Settled Spend */}
      <div className="sf-card p-3 sm:p-5 flex flex-col justify-between min-h-[112px] sm:min-h-[140px] hover:border-[#1B1A18] transition-colors overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider truncate whitespace-nowrap">
            SETTLED
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconReceipt size={14} stroke={2} className="sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="my-auto py-1 min-w-0">
          <span className="text-base xs:text-lg sm:text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums truncate whitespace-nowrap block">
            {formatCurrency(settledSpentThisMonth, currency)}
          </span>
        </div>

        <p className="text-[10px] sm:text-xs text-[#625E59] m-0 truncate whitespace-nowrap font-mono">
          {settledCount} {settledCount === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* 2. Scheduled */}
      <div className="sf-card p-3 sm:p-5 flex flex-col justify-between min-h-[112px] sm:min-h-[140px] hover:border-[#1B1A18] transition-colors overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider truncate whitespace-nowrap">
            SCHEDULED
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconClock size={14} stroke={2} className="sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="my-auto py-1 min-w-0">
          <span className="text-base xs:text-lg sm:text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums truncate whitespace-nowrap block">
            {formatCurrency(scheduledSpentThisMonth, currency)}
          </span>
        </div>

        <p className="text-[10px] sm:text-xs text-[#625E59] m-0 truncate whitespace-nowrap font-mono">
          {scheduledCount} {scheduledCount === 1 ? 'bill' : 'bills'}
        </p>
      </div>

      {/* 3. Daily Average */}
      <div className="sf-card p-3 sm:p-5 flex flex-col justify-between min-h-[112px] sm:min-h-[140px] hover:border-[#1B1A18] transition-colors overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider truncate whitespace-nowrap">
            DAILY AVG
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
            <IconTrendingUp size={14} stroke={2} className="sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="my-auto py-1 min-w-0">
          <span className="text-base xs:text-lg sm:text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums truncate whitespace-nowrap block">
            {formatCurrency(dailySpendAverage, currency)}
            <span className="text-[10px] sm:text-xs font-mono font-normal text-[#625E59] ml-0.5">/d</span>
          </span>
        </div>

        <p className="text-[10px] sm:text-xs text-[#625E59] m-0 truncate whitespace-nowrap font-mono">
          {elapsedDaysThisMonth}d elapsed
        </p>
      </div>

      {/* 4. Top Category */}
      <div className="sf-card p-3 sm:p-5 flex flex-col justify-between min-h-[112px] sm:min-h-[140px] hover:border-[#1B1A18] transition-colors overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider truncate whitespace-nowrap">
              TOP CAT
            </span>
            {topCategory && topCategoryPercentage > 0 && (
              <span className="inline-block px-1 py-0.2 text-[9px] sm:text-[10px] font-mono font-semibold text-[#1B1A18] bg-[#EFECE6] border border-[#DED9D2] rounded-[2px] leading-none shrink-0 whitespace-nowrap">
                {topCategoryPercentage}%
              </span>
            )}
          </div>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            {topCategory?.category ? (
              <CategoryIcon category={topCategory.category} size={14} stroke={2} className="text-[#1B1A18] sm:w-4 sm:h-4" />
            ) : (
              <IconAward size={14} stroke={2} className="sm:w-4 sm:h-4" />
            )}
          </div>
        </div>

        <div className="my-auto py-1 min-w-0">
          <span className="text-xs xs:text-sm sm:text-2xl font-display font-bold text-[#1B1A18] tracking-tight truncate whitespace-nowrap block" title={topCategoryLabel}>
            {topCategoryLabel}
          </span>
        </div>

        <p className="text-[10px] sm:text-xs text-[#625E59] m-0 truncate whitespace-nowrap font-mono">
          {topCategory ? (
            `${formatCurrency(topCategoryAmount, currency)}`
          ) : (
            'No expenses'
          )}
        </p>
      </div>
    </div>
  );
}
