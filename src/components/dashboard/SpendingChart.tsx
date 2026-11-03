'use client';

import React, { useMemo } from 'react';
import { IconChartBar } from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';

/**
 * Data bucket representation for timeline intervals.
 */
interface ChartPoint {
  id: string;
  label: string;
  settled: number;
  scheduled: number;
  isToday?: boolean;
}

/**
 * Visual timeline bar chart rendering 7 chronological intervals spanning the month,
 * displaying settled expenses and upcoming scheduled bills with hover tooltips.
 */
export function SpendingChart() {

  const {
    filteredTransactions,
    selectedMonth,
    currency,
  } = useFinance();

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
    const monthShort = new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', {
      month: 'short',
    });

    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === selectedMonth.year && today.getMonth() === selectedMonth.month;
    const todayDay = today.getDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const isPastMonth =
      selectedMonth.year < today.getFullYear() ||
      (selectedMonth.year === today.getFullYear() && selectedMonth.month < today.getMonth());

    // Generate 7 chronological intervals covering all days 1..daysInMonth
    const numBuckets = 7;
    const step = daysInMonth / numBuckets;
    const buckets: { startDay: number; endDay: number }[] = [];

    let currentStart = 1;
    for (let i = 0; i < numBuckets; i++) {
      const endDay = i === numBuckets - 1 ? daysInMonth : Math.round((i + 1) * step);
      if (currentStart <= daysInMonth) {
        buckets.push({ startDay: currentStart, endDay: Math.min(daysInMonth, endDay) });
        currentStart = endDay + 1;
      }
    }

    return buckets.map((b, idx) => {
      let settled = 0;
      let scheduled = 0;

      for (const t of filteredTransactions) {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          if (day >= b.startDay && day <= b.endDay) {
            if (isPastMonth) {
              settled += t.amount;
            } else if (isCurrentMonth) {
              if (t.date <= todayStr) {
                settled += t.amount;
              } else {
                scheduled += t.amount;
              }
            } else {
              scheduled += t.amount;
            }
          }
        }
      }

      const isCurrentRange = isCurrentMonth && todayDay >= b.startDay && todayDay <= b.endDay;
      const label =
        b.startDay === b.endDay
          ? `${monthShort} ${b.startDay}`
          : `${monthShort} ${b.startDay}-${b.endDay}`;

      return {
        id: `bucket-${idx}-${b.startDay}`,
        label,
        settled,
        scheduled,
        isToday: isCurrentRange,
      };
    });
  }, [filteredTransactions, selectedMonth]);

  const maxVal = useMemo(() => {
    const totals = chartPoints.map((p) => p.settled + p.scheduled);
    const highest = Math.max(...totals, 0);
    return highest > 0 ? highest : 1000;
  }, [chartPoints]);

  return (
    <div className="sf-card p-5 sm:p-6 transition-all relative font-sans">
      {/* Header with Title and Legends */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconChartBar size={16} stroke={2} />
          </div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
            Spending Timeline ({selectedMonth.label})
          </h3>
        </div>

        {/* Legends */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#625E59]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-[#1B1A18] shrink-0" />
            <span>Settled</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-[#DED9D2] shrink-0" />
            <span>Scheduled Bills</span>
          </span>
        </div>
      </div>

      {/* Chart Graphic Container: Grounded on subtle X-axis line */}
      <div className="pt-4">
        <div className="relative h-40 sm:h-44 px-2 sm:px-6">
          {/* Empty state overlay note when no transactions */}
          {filteredTransactions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="px-3 py-1.5 text-xs font-mono text-[#625E59] bg-[#F7F5F2]/90 border border-[#DED9D2] rounded-[2px] shadow-xs">
                No spending data for {selectedMonth.label}
              </span>
            </div>
          )}

          {/* Subtle horizontal reference lines */}
          <div className="absolute inset-x-2 sm:inset-x-6 top-0 border-b border-dashed border-[#E5E0D8] pointer-events-none flex justify-end z-0">
            <span className="text-[10px] font-mono font-medium text-[#756D66] -mt-3.5 bg-[#F7F5F2] px-1.5 tabular-nums">
              {formatCurrency(maxVal, currency)}
            </span>
          </div>
          <div className="absolute inset-x-2 sm:inset-x-6 top-1/2 border-b border-dashed border-[#E5E0D8] pointer-events-none flex justify-end z-0">
            <span className="text-[10px] font-mono font-medium text-[#756D66] -mt-3.5 bg-[#F7F5F2] px-1.5 tabular-nums">
              {formatCurrency(Math.round(maxVal / 2), currency)}
            </span>
          </div>

          {/* Bars container */}
          <div className="relative flex items-end justify-between h-full border-b border-[#DED9D2] z-10">
            {chartPoints.map((bar, idx) => {
              const total = bar.settled + bar.scheduled;
              const heightPercent = total > 0 ? Math.max(12, Math.round((total / maxVal) * 100)) : 4;
              const settledRatio = total > 0 ? bar.settled / total : 0;
              const scheduledRatio = total > 0 ? bar.scheduled / total : 0;
              const isFirst = idx === 0;
              const isLast = idx === chartPoints.length - 1;

              return (
                <div
                  key={bar.id}
                  className="flex flex-col items-center h-full justify-end group relative flex-1 max-w-[70px] cursor-pointer"
                >
                  {/* Floating Tooltip with Pointer - Clamped to avoid container clipping */}
                  <div
                    className={`absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none bg-[#242220] text-white border border-[#3A3835] text-[11px] font-mono py-1.5 px-2.5 rounded-[2px] whitespace-nowrap z-30 flex flex-col shadow-md ${
                      isFirst
                        ? 'left-0 items-start'
                        : isLast
                        ? 'right-0 items-end'
                        : 'left-1/2 -translate-x-1/2 items-center'
                    }`}
                  >
                    <div className="tabular-nums font-bold text-white">{formatCurrency(total, currency)}</div>
                    {total > 0 && (
                      <div className="text-[10px] text-[#A6A29C]">
                        {bar.settled > 0 ? `Settled: ${formatCurrency(bar.settled, currency)}` : ''}
                        {bar.settled > 0 && bar.scheduled > 0 ? ' • ' : ''}
                        {bar.scheduled > 0 ? `Due: ${formatCurrency(bar.scheduled, currency)}` : ''}
                      </div>
                    )}
                    <div
                      className={`w-2 h-2 bg-[#242220] border-r border-b border-[#3A3835] rotate-45 absolute -bottom-1 ${
                        isFirst ? 'left-3' : isLast ? 'right-3' : 'left-1/2 -translate-x-1/2'
                      }`}
                    />
                  </div>

                  {/* Stacked Bar with Flat Bottom grounded on X-axis line */}
                  <div
                    className={`w-7 sm:w-9 flex flex-col justify-end overflow-hidden rounded-none transition-all duration-300 ${
                      bar.isToday ? 'ring-2 ring-[#E65B3F] ring-offset-2 ring-offset-[#F7F5F2]' : 'hover:opacity-90'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Top segment: Scheduled Bills (#DED9D2) */}
                    {bar.scheduled > 0 && (
                      <div
                        className="w-full bg-[#DED9D2] transition-all"
                        style={{ height: `${scheduledRatio * 100}%` }}
                      />
                    )}

                    {/* Bottom segment: Settled Spend (#1B1A18) */}
                    {bar.settled > 0 ? (
                      <div
                        className="w-full bg-[#1B1A18] transition-all"
                        style={{ height: `${settledRatio * 100}%` }}
                      />
                    ) : total === 0 ? (
                      <div className="w-full h-1 bg-[#EBE6E0] rounded-none" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-2 sm:px-6 mt-3">
          {chartPoints.map((bar) => (
            <span
              key={bar.id}
              className={`flex-1 max-w-[70px] text-center text-[10px] sm:text-xs truncate font-mono ${
                bar.isToday ? 'text-[#E65B3F] font-bold underline decoration-2 underline-offset-4' : 'text-[#625E59] font-normal'
              }`}
              title={bar.label}
            >
              {bar.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
