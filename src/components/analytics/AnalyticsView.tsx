'use client';

import React, { useState, useMemo } from 'react';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconAward,
  IconTrendingUp,
  IconChartPie,
  IconChartBar,
  IconArrowsSort,
  IconGauge,
  IconWallet,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { CATEGORIES } from '@/constants/categories';

/**
 * Aesthetic palette mapped to categories for visual distribution charting.
 */
const CATEGORY_CHART_COLORS: Record<string, string> = {
  food_dining: '#E65B3F',
  bills: '#1B1A18',
  groceries: '#2E6F54',
  electronics: '#3B5998',
  personal_care: '#8D5B4C',
  household: '#5A6B7C',
  other: '#7A756F',
};

type CategorySortOption = 'amount-desc' | 'count-desc' | 'name-asc';

/**
 * Analytics view presenting comprehensive financial reporting:
 * - Page Header with active month scope and monthly totals
 * - 4-stat KPI highlight cards with standardized baselines
 * - Proportional Category Allocation Distribution Chart with interactive legend
 * - Monthly Budget Utilization & Spend Velocity insights
 * - Responsive, sortable category breakdown cards with aligned progress bars
 */
export function AnalyticsView() {
  const {
    filteredTransactions,
    categoryStats,
    budgetPercentage,
    totalSpentThisMonth,
    currentBudget,
    dailySpendAverage,
    currency,
    selectedMonth,
  } = useFinance();

  const [categorySort, setCategorySort] = useState<CategorySortOption>('amount-desc');

  const hasData = filteredTransactions.length > 0;

  // Extremes: Highest transaction, lowest transaction
  const sortedByAmount = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const highestTx = sortedByAmount[0] || null;
  const lowestTx = sortedByAmount[sortedByAmount.length - 1] || null;

  // Most frequent category
  const sortedByCount = useMemo(() => {
    return [...categoryStats].sort((a, b) => b.count - a.count);
  }, [categoryStats]);

  const mostFrequentCat = sortedByCount[0] || null;

  // Sorted category breakdown based on user selection
  const processedCategoryStats = useMemo(() => {
    const list = [...categoryStats];
    switch (categorySort) {
      case 'amount-desc':
        return list.sort((a, b) => b.total - a.total);
      case 'count-desc':
        return list.sort((a, b) => b.count - a.count);
      case 'name-asc':
        return list.sort((a, b) => {
          const nameA = CATEGORIES[a.category]?.label || a.category;
          const nameB = CATEGORIES[b.category]?.label || b.category;
          return nameA.localeCompare(nameB);
        });
      default:
        return list;
    }
  }, [categoryStats, categorySort]);

  // Categories with non-zero spending for the allocation bar
  const activeAllocationCategories = useMemo(() => {
    return categoryStats
      .filter((cat) => cat.total > 0 && cat.percentage > 0)
      .sort((a, b) => b.total - a.total);
  }, [categoryStats]);

  const isOverBudget = currentBudget > 0 && totalSpentThisMonth > currentBudget;
  const remainingBudget = Math.max(0, currentBudget - totalSpentThisMonth);

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-fadeIn font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-[#DED9D2] rounded-[2px] sf-card">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
            <IconChartBar size={20} stroke={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-mono font-bold text-[#1B1A18] uppercase tracking-wider">
                Spending Analytics & Reports
              </h1>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59]">
                {selectedMonth.label}
              </span>
            </div>
            <p className="text-xs text-[#625E59] font-normal mt-0.5">
              Allocation breakdown, spending velocity, budget burn, and category metrics
            </p>
          </div>
        </div>

        {/* Quick Monthly Summary Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="px-3.5 py-1.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-right min-w-[95px]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block leading-tight">
              Total Outflow
            </span>
            <span className="text-xs font-mono font-bold text-[#1B1A18] tabular-nums">
              {formatCurrency(totalSpentThisMonth, currency)}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-right min-w-[95px]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block leading-tight">
              Target Budget
            </span>
            <span className="text-xs font-mono font-bold text-[#1B1A18] tabular-nums">
              {formatCurrency(currentBudget, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4-Stat KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Highest Outflow */}
        <div className="sf-card p-4 sm:p-5 flex flex-col justify-between min-h-[160px] bg-white border border-[#DED9D2] rounded-[2px] hover:border-[#1B1A18] transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#625E59] uppercase tracking-wider font-semibold">
            <span>Largest Entry</span>
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconArrowUpRight size={14} stroke={2} />
            </div>
          </div>
          {highestTx ? (
            <>
              <div className="my-auto py-1">
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular-nums text-[#1B1A18]">
                  {formatCurrency(highestTx.amount, currency)}
                </div>
                <p
                  className="text-xs text-[#1B1A18] truncate mt-0.5 font-medium max-w-[200px]"
                  title={highestTx.title}
                >
                  {highestTx.title}
                </p>
              </div>
              <div className="h-7 flex items-center">
                <CategoryBadge
                  category={highestTx.category}
                  showLabel={true}
                  className="text-[10px] py-0.5 px-2"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#625E59] font-mono italic">No entries yet</p>
            </div>
          )}
        </div>

        {/* Lowest Outflow */}
        <div className="sf-card p-4 sm:p-5 flex flex-col justify-between min-h-[160px] bg-white border border-[#DED9D2] rounded-[2px] hover:border-[#1B1A18] transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#625E59] uppercase tracking-wider font-semibold">
            <span>Smallest Entry</span>
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
              <IconArrowDownRight size={14} stroke={2} />
            </div>
          </div>
          {lowestTx && lowestTx.id !== highestTx?.id ? (
            <>
              <div className="my-auto py-1">
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular-nums text-[#1B1A18]">
                  {formatCurrency(lowestTx.amount, currency)}
                </div>
                <p
                  className="text-xs text-[#1B1A18] truncate mt-0.5 font-medium max-w-[200px]"
                  title={lowestTx.title}
                >
                  {lowestTx.title}
                </p>
              </div>
              <div className="h-7 flex items-center">
                <CategoryBadge
                  category={lowestTx.category}
                  showLabel={true}
                  className="text-[10px] py-0.5 px-2"
                />
              </div>
            </>
          ) : highestTx && lowestTx?.id === highestTx?.id ? (
            <>
              <div className="my-auto py-1">
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular-nums text-[#1B1A18]">
                  {formatCurrency(lowestTx!.amount, currency)}
                </div>
                <p
                  className="text-xs text-[#1B1A18] truncate mt-0.5 font-medium max-w-[200px]"
                  title={lowestTx!.title}
                >
                  {lowestTx!.title}
                </p>
              </div>
              <div className="h-7 flex items-center text-[11px] text-[#625E59] font-mono">
                Single entry in period
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#625E59] font-mono italic">No entries yet</p>
            </div>
          )}
        </div>

        {/* Most Frequent Category */}
        <div className="sf-card p-4 sm:p-5 flex flex-col justify-between min-h-[160px] bg-white border border-[#DED9D2] rounded-[2px] hover:border-[#1B1A18] transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#625E59] uppercase tracking-wider font-semibold">
            <span>Most Frequent</span>
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
              <IconAward size={14} stroke={2} />
            </div>
          </div>
          {mostFrequentCat && mostFrequentCat.count > 0 ? (
            <>
              <div className="my-auto py-1">
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular-nums text-[#1B1A18]">
                  {mostFrequentCat.count}
                  <span className="text-xs font-mono font-normal text-[#625E59] ml-1.5">
                    {mostFrequentCat.count === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <p className="text-xs text-[#1B1A18] mt-0.5 font-bold truncate">
                  {CATEGORIES[mostFrequentCat.category]?.label || 'General'}
                </p>
              </div>
              <div className="h-7 flex items-center text-xs text-[#625E59] font-mono tabular-nums">
                {formatCurrency(mostFrequentCat.total, currency)} total volume
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#625E59] font-mono italic">No entries yet</p>
            </div>
          )}
        </div>

        {/* Budget Burn Velocity */}
        <div className="sf-card p-4 sm:p-5 flex flex-col justify-between min-h-[160px] bg-white border border-[#DED9D2] rounded-[2px] hover:border-[#1B1A18] transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#625E59] uppercase tracking-wider font-semibold">
            <span>Budget Burn</span>
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconTrendingUp size={14} stroke={2} />
            </div>
          </div>
          {currentBudget > 0 ? (
            <>
              <div className="my-auto py-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular-nums text-[#1B1A18]">
                    {budgetPercentage}%
                  </span>
                  {isOverBudget && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[1px] bg-red-50 text-red-700 border border-red-200 uppercase">
                      Exceeded
                    </span>
                  )}
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-[#EBE6E0] h-1.5 rounded-[2px] overflow-hidden mt-1.5 mb-0.5">
                  <div
                    className={`h-full rounded-[2px] transition-all duration-500 ${
                      isOverBudget ? 'bg-red-600' : 'bg-[#E65B3F]'
                    }`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="h-7 flex items-center text-xs text-[#625E59] font-mono tabular-nums truncate">
                {formatCurrency(totalSpentThisMonth, currency)} of {formatCurrency(currentBudget, currency)}
              </div>
            </>
          ) : (
            <>
              <div className="my-auto py-1">
                <div className="text-2xl font-mono font-bold tracking-tight text-[#625E59]">—</div>
                <p className="text-[11px] text-[#625E59] mt-0.5 italic">No target configured</p>
              </div>
              <div className="h-7 flex items-center text-xs text-[#625E59] font-mono tabular-nums">
                Spent: {formatCurrency(totalSpentThisMonth, currency)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Proportional Category Allocation Distribution Chart */}
      <div className="sf-card p-5 sm:p-6 bg-white border border-[#DED9D2] rounded-[2px] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconChartPie size={16} stroke={2} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                Category Allocation Distribution
              </h3>
              <p className="text-[11px] text-[#625E59] font-normal">
                Proportional share of total monthly expenditure
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#625E59] self-start sm:self-auto">
            {activeAllocationCategories.length} active {activeAllocationCategories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {/* Proportional Segmented Bar */}
        {!hasData || activeAllocationCategories.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[#625E59]">
            <div className="w-full bg-[#EFECE6] h-3.5 rounded-[2px] mb-2.5 border border-[#E5E0D8]" />
            <span>No expenditure logged to allocate for {selectedMonth.label}</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Multi-segment Allocation Bar */}
            <div
              className="w-full h-4 sm:h-5 rounded-[2px] overflow-hidden flex bg-[#EFECE6] border border-[#E5E0D8]"
              role="img"
              aria-label="Category allocation distribution bar"
            >
              {activeAllocationCategories.map((cat) => {
                const color = CATEGORY_CHART_COLORS[cat.category] || '#7A756F';
                const meta = CATEGORIES[cat.category] || CATEGORIES.other;

                return (
                  <div
                    key={cat.category}
                    className="h-full transition-all duration-300 relative group cursor-pointer hover:opacity-90"
                    style={{
                      width: `${Math.max(cat.percentage, 1)}%`,
                      backgroundColor: color,
                    }}
                    title={`${meta.label}: ${formatCurrency(cat.total, currency)} (${cat.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Interactive Category Legend Grid */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              {activeAllocationCategories.map((cat) => {
                const color = CATEGORY_CHART_COLORS[cat.category] || '#7A756F';
                const meta = CATEGORIES[cat.category] || CATEGORIES.other;

                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-[1px] shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-[#1B1A18]">{meta.label}</span>
                    <span className="text-[#625E59] font-medium tabular-nums">
                      {cat.percentage}%
                    </span>
                    <span className="text-[#1B1A18] font-bold tabular-nums pl-1 border-l border-[#DED9D2]">
                      {formatCurrency(cat.total, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Budget Utilization & Spend Velocity Card */}
      <div className="sf-card p-5 sm:p-6 bg-white border border-[#DED9D2] rounded-[2px] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
              <IconGauge size={16} stroke={2} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                Budget Utilization &amp; Burn Pace
              </h3>
              <p className="text-[11px] text-[#625E59] font-normal">
                Monthly allowance consumption and daily cashflow pace
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#625E59] tabular-nums self-start sm:self-auto">
            Avg Pace:{' '}
            <strong className="text-[#1B1A18] font-bold">
              {formatCurrency(dailySpendAverage, currency)}/day
            </strong>
          </span>
        </div>

        {/* Burn progress indicator */}
        <div className="space-y-2">
          <div className="w-full bg-[#EFECE6] h-3 rounded-[2px] overflow-hidden border border-[#E5E0D8]">
            <div
              className={`h-full rounded-[2px] transition-all duration-500 ${
                isOverBudget
                  ? 'bg-red-600'
                  : budgetPercentage > 80
                  ? 'bg-[#E65B3F]'
                  : 'bg-[#1B1A18]'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              role="progressbar"
              aria-valuenow={budgetPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Budget utilization: ${budgetPercentage}%`}
            />
          </div>

          {/* 3 Metric Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2]">
              <span className="text-[10px] uppercase text-[#625E59] font-semibold block">
                Total Outflow
              </span>
              <span className="font-bold text-[#1B1A18] text-sm tabular-nums">
                {formatCurrency(totalSpentThisMonth, currency)}
              </span>
            </div>

            <div className="p-2.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2]">
              <span className="text-[10px] uppercase text-[#625E59] font-semibold block">
                {isOverBudget ? 'Budget Deficit' : 'Remaining Buffer'}
              </span>
              <span
                className={`font-bold text-sm tabular-nums ${
                  isOverBudget ? 'text-red-700' : 'text-[#2E6F54]'
                }`}
              >
                {isOverBudget
                  ? `+${formatCurrency(totalSpentThisMonth - currentBudget, currency)} over`
                  : formatCurrency(remainingBudget, currency)}
              </span>
            </div>

            <div className="p-2.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2]">
              <span className="text-[10px] uppercase text-[#625E59] font-semibold block">
                Monthly Limit
              </span>
              <span className="font-bold text-[#1B1A18] text-sm tabular-nums">
                {formatCurrency(currentBudget, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Detailed Category Breakdown */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconWallet size={16} stroke={2} className="text-[#E65B3F]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
              Category Breakdown &amp; Volume
            </h3>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-[#625E59]">Sort:</span>
            <div className="relative">
              <select
                value={categorySort}
                onChange={(e) => setCategorySort(e.target.value as CategorySortOption)}
                className="sf-input appearance-none pl-3 pr-7 h-8 text-xs font-mono font-medium text-[#1B1A18] cursor-pointer bg-white rounded-[2px]"
                aria-label="Sort category breakdown"
              >
                <option value="amount-desc">Highest Volume</option>
                <option value="count-desc">Most Entries</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
              <IconArrowsSort
                size={12}
                stroke={2}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#625E59] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="rounded-[2px] bg-white border border-dashed border-[#DED9D2] p-8 text-center sm:p-12">
            <div className="w-12 h-12 mx-auto rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] mb-3">
              <IconChartPie size={24} stroke={1.8} />
            </div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
              No spending logged for {selectedMonth.label}
            </h4>
            <p className="text-xs text-[#625E59] mt-1.5 max-w-sm mx-auto font-mono">
              Category breakdowns, burn rates, and spending extremes will automatically calculate as entries are recorded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {processedCategoryStats.map((item, index) => {
              const meta = CATEGORIES[item.category] || CATEGORIES.other;
              const isLastOdd =
                index === processedCategoryStats.length - 1 &&
                processedCategoryStats.length % 2 !== 0;
              const avgPerEntry = item.count > 0 ? item.total / item.count : 0;

              return (
                <div
                  key={item.category}
                  className={`sf-card-white p-4 sm:p-4.5 flex flex-col justify-between gap-3.5 hover:border-[#1B1A18] transition-colors rounded-[2px] bg-white border border-[#DED9D2] group ${
                    isLastOdd ? 'md:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] group-hover:border-[#1B1A18] flex items-center justify-center shrink-0 transition-colors">
                          <CategoryIcon category={item.category} size={15} />
                        </div>
                        <span className="text-xs font-bold text-[#1B1A18] truncate font-sans">
                          {meta.label}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#1B1A18] tracking-tight tabular-nums">
                          {formatCurrency(item.total, currency)}
                        </span>
                        <span className="text-xs text-[#625E59] font-mono ml-2 tabular-nums font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-[#EFECE6] h-2 rounded-[2px] overflow-hidden border border-[#E5E0D8]">
                      <div
                        className="h-full rounded-[2px] transition-all duration-500 bg-[#1B1A18] group-hover:bg-[#E65B3F]"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${meta.label}: ${item.percentage}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#625E59] font-mono tabular-nums font-medium">
                      <span>
                        {item.count || 0} {item.count === 1 ? 'entry' : 'entries'}
                      </span>
                      {item.count > 0 && (
                        <span>
                          Avg: {formatCurrency(avgPerEntry, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

