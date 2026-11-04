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
    <div className="p-4 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[2px] bg-white border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
          <IconSparkles size={16} stroke={2} />
        </div>
        <div>
          <span className="text-[11px] font-mono font-bold text-[#A83F29] uppercase tracking-wider block">
            {hasLifespan ? 'Monthly Depreciation' : 'Lifespan'}
          </span>
          <span className="text-xs text-[#A83F29]/80 font-normal">
            {hasLifespan
              ? `${formatCurrency(parsedCost, currency)} · ${calculatedMonths} months`
              : 'Ongoing item'}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        {hasLifespan ? (
          <>
            <span className="text-lg font-mono font-bold text-[#E65B3F] tabular-nums block leading-tight">
              {formatCurrency(monthlyCost, currency)}
              <span className="text-xs font-normal text-[#A83F29]"> / mo</span>
            </span>
            <span className="text-[11px] font-mono text-[#A83F29]">
              ~{formatCurrency(dailyCost, currency)} / day
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-mono font-bold text-[#1B1A18] tabular-nums block">
              {parsedCost > 0 ? formatCurrency(parsedCost, currency) : '—'}
            </span>
            <span className="text-[10px] text-[#625E59]">
              One-time cost
            </span>
          </>
        )}
      </div>
    </div>
  );
}

