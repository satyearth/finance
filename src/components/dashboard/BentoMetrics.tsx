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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {/* 1. Settled Outflow */}
      <div className="sf-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#1B1A18] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider">
            SETTLED OUTFLOW
          </span>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconReceipt size={16} stroke={2} />
          </div>
        </div>

        <div className="flex items-baseline my-auto py-1">
          <span className="text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums">
            {formatCurrency(settledSpentThisMonth, currency)}
          </span>
        </div>

        <p className="text-xs text-[#625E59] m-0 truncate font-mono">
          {settledCount} {settledCount === 1 ? 'realized entry' : 'realized entries'} to date
        </p>
      </div>

      {/* 2. Scheduled Bills */}
      <div className="sf-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#1B1A18] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider">
            SCHEDULED BILLS
          </span>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconClock size={16} stroke={2} />
          </div>
        </div>

        <div className="flex items-baseline my-auto py-1">
          <span className="text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums">
            {formatCurrency(scheduledSpentThisMonth, currency)}
          </span>
        </div>

        <p className="text-xs text-[#625E59] m-0 truncate font-mono">
          {scheduledCount} {scheduledCount === 1 ? 'upcoming bill' : 'upcoming bills'}
        </p>
      </div>

      {/* 3. Daily Burn Pace */}
      <div className="sf-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#1B1A18] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider">
            DAILY BURN PACE
          </span>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
            <IconTrendingUp size={16} stroke={2} />
          </div>
        </div>

        <div className="flex items-baseline my-auto py-1">
          <span className="text-2xl font-mono font-bold text-[#1B1A18] tracking-tight tabular-nums">
            {formatCurrency(dailySpendAverage, currency)}
            <span className="text-xs font-mono font-normal text-[#625E59] ml-1">/day</span>
          </span>
        </div>

        <p className="text-xs text-[#625E59] m-0 truncate font-mono">
          Across {elapsedDaysThisMonth} active days
        </p>
      </div>

      {/* 4. Top Category */}
      <div className="sf-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#1B1A18] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-[#625E59] uppercase tracking-wider">
              TOP CATEGORY
            </span>
            {topCategory && topCategoryPercentage > 0 && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#1B1A18] bg-[#EFECE6] border border-[#DED9D2] rounded-[2px] leading-none">
                {topCategoryPercentage}%
              </span>
            )}
          </div>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            {topCategory?.category ? (
              <CategoryIcon category={topCategory.category} size={16} stroke={2} className="text-[#1B1A18]" />
            ) : (
              <IconAward size={16} stroke={2} />
            )}
          </div>
        </div>

        <div className="flex items-baseline my-auto py-1 min-w-0">
          <span className="text-xl sm:text-2xl font-display font-bold text-[#1B1A18] tracking-tight truncate">
            {topCategoryLabel}
          </span>
        </div>

        <p className="text-xs text-[#625E59] m-0 truncate font-mono">
          {topCategory ? (
            `${formatCurrency(topCategoryAmount, currency)} total spent`
          ) : (
            'No expenses recorded'
          )}
        </p>
      </div>
    </div>
  );
}
