'use client';

import React from 'react';
import { IconSparkles } from '@tabler/icons-react';
import { CurrencyCode } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';

interface AmortizedPreviewPillProps {
  hasLifespan: boolean;
  parsedCost: number;
  calculatedMonths: number;
  monthlyCost: number;
  dailyCost: number;
  currency: CurrencyCode;
}

export function AmortizedPreviewPill({
  hasLifespan,
  parsedCost,
  calculatedMonths,
  monthlyCost,
  dailyCost,
  currency,
}: AmortizedPreviewPillProps) {
  return (
    <div className="p-3 sm:p-4 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-white border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
          <IconSparkles size={14} stroke={2} className="sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#A83F29] uppercase tracking-wider block truncate">
            {hasLifespan ? 'Monthly Cost' : 'Lifespan'}
          </span>
          <span className="text-[11px] sm:text-xs text-[#A83F29]/80 font-normal truncate block">
            {hasLifespan
              ? `${formatCurrency(parsedCost, currency)} · ${calculatedMonths}m`
              : 'Ongoing item'}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        {hasLifespan ? (
          <>
            <span className="text-base sm:text-lg font-mono font-bold text-[#E65B3F] tabular-nums block leading-tight">
              {formatCurrency(monthlyCost, currency)}
              <span className="text-[10px] sm:text-xs font-normal text-[#A83F29]"> / mo</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#A83F29]">
              ~{formatCurrency(dailyCost, currency)} / day
            </span>
          </>
        ) : (
          <>
            <span className="text-xs sm:text-sm font-mono font-bold text-[#1B1A18] tabular-nums block">
              {parsedCost > 0 ? formatCurrency(parsedCost, currency) : '—'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#625E59]">
              One-time cost
            </span>
          </>
        )}
      </div>
    </div>
  );
}

