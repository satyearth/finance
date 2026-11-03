'use client';

import React from 'react';
import {
  IconHourglassEmpty,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSparkles,
  IconCalendarTime,
  IconCheck,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { AmortizedItem } from '@/types/finance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { CURRENCIES } from '@/constants/categories';

/**
 * Props for AmortizedTrackerCard component.
 */
interface AmortizedTrackerCardProps {
  /** Callback to launch creation modal for lifespan tracking */
  onOpenAddModal: () => void;
  /** Callback to launch edit modal for an existing amortized item */
  onEditItem: (item: AmortizedItem) => void;
}

/**
 * Dashboard card showcasing products with a defined lifespan (e.g., shampoo, perfume, protein),
 * calculating and displaying the true monthly burn (total cost / months of duration) and elapsed progress.
 */
export function AmortizedTrackerCard({
  onOpenAddModal,
  onEditItem,
}: AmortizedTrackerCardProps) {

  const {
    amortizedItems,
    deleteAmortizedItem,
    totalMonthlyAmortizedCost,
    activeAmortizedCount,
    currency,
  } = useFinance();

  const sym = CURRENCIES[currency]?.symbol || '₹';
  const today = new Date();

  return (
    <div className="sf-card p-5 sm:p-6 transition-all font-sans space-y-5">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
              <IconHourglassEmpty size={16} stroke={2} />
            </div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
              Product Lifespan &amp; Monthly Amortization
            </h3>
            <span className="sf-badge text-xs">
              <span className="w-1.5 h-1.5 bg-[#E65B3F]" />
              {activeAmortizedCount} Active {activeAmortizedCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-[#625E59] font-normal">
            Real cost-per-month for items that last multiple months (e.g. {sym}200 item for 2 months = {sym}100/mo)
          </p>
        </div>

        {/* Action Button & Summary Pill */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center h-9 gap-2 px-3.5 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 text-xs shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#A83F29]">
              Monthly Burn:
            </span>
            <span className="font-mono font-bold text-[#A83F29] tabular-nums">
              {formatCurrency(totalMonthlyAmortizedCost, currency)}
            </span>
            <span className="text-[10px] text-[#A83F29]/80 font-mono">/ mo</span>
          </div>

          <button
            onClick={() => onOpenAddModal()}
            className="sf-button-primary h-9 text-xs uppercase tracking-wider px-3.5 flex items-center justify-center gap-1.5 shrink-0 rounded-[2px]"
          >
            <IconPlus size={14} stroke={2.5} />
            <span>Track from Expenses</span>
          </button>
        </div>
      </div>

      {/* 2. Items List / Grid */}
      {amortizedItems.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-[2px] bg-white border border-dashed border-[#DED9D2] space-y-2">
          <div className="w-9 h-9 mx-auto rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F]">
            <IconSparkles size={18} stroke={2} />
          </div>
          <h4 className="text-xs font-mono font-bold uppercase text-[#1B1A18]">No lifespan items tracked yet</h4>
          <p className="text-xs text-[#625E59] max-w-sm mx-auto">
            Pick any expense you&apos;ve already added (like shampoo, supplements, perfume, gym, or skincare) to calculate its real cost-per-month!
          </p>
          <button
            onClick={() => onOpenAddModal()}
            className="sf-button-primary text-xs uppercase tracking-wider h-8 px-3.5 inline-flex items-center gap-1.5 mt-2 rounded-[2px]"
          >
            <IconPlus size={13} stroke={2.5} />
            <span>Pick from Added Expenses</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amortizedItems.map((item) => {
            const startDateObj = new Date(item.startDate);
            const hasLifespan = Boolean(item.endDate && item.durationMonths && item.durationMonths > 0);
            const endDateObj = hasLifespan && item.endDate ? new Date(item.endDate) : null;
            const totalLifespanMs = endDateObj ? Math.max(1, endDateObj.getTime() - startDateObj.getTime()) : 0;
            const elapsedMs = Math.max(0, today.getTime() - startDateObj.getTime());
            const progressPercent = totalLifespanMs > 0 ? Math.min(100, Math.round((elapsedMs / totalLifespanMs) * 100)) : 0;
            const remainingDays = endDateObj
              ? Math.max(0, Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
              : null;
            const isCompleted = hasLifespan && endDateObj ? (item.status === 'completed' || today > endDateObj) : false;

            return (
              <div
                key={item.id}
                className="sf-card-white p-4 flex flex-col justify-between gap-3.5 hover:border-[#1B1A18] transition-colors group"
              >
                {/* Top Row: Category Badge, Title, Action buttons */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <CategoryBadge category={item.category} showLabel={false} />

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1 rounded-[2px] text-[#625E59] hover:text-[#1B1A18] hover:bg-[#F7F5F2] transition-colors"
                        title="Edit Item"
                      >
                        <IconPencil size={13} stroke={2} />
                      </button>
                      <button
                        onClick={() => deleteAmortizedItem(item.id)}
                        className="p-1 rounded-[2px] text-[#625E59] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Item"
                      >
                        <IconTrash size={13} stroke={2} />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-[44px] flex flex-col justify-center mt-1.5">
                    <h4 className="text-sm font-sans font-bold text-[#1B1A18] truncate" title={item.name}>
                      {item.name}
                    </h4>
                    {item.notes ? (
                      <p className="text-[11px] text-[#625E59] truncate mt-0.5 font-normal">
                        {item.notes}
                      </p>
                    ) : (
                      <span className="text-[11px] text-transparent select-none">No notes</span>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown: Total vs Monthly */}
                <div className="p-2.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#625E59] block leading-none">
                      Total Cost
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1B1A18] tabular-nums mt-1 block">
                      {formatCurrency(item.totalCost, currency)}
                    </span>
                  </div>

                  <div className="text-right">
                    {hasLifespan && item.monthlyCost ? (
                      <>
                        <span className="text-[10px] font-mono uppercase font-semibold text-[#A83F29] block leading-none">
                          Monthly Burn
                        </span>
                        <span className="text-sm font-mono font-bold text-[#E65B3F] tabular-nums mt-0.5 block">
                          {formatCurrency(item.monthlyCost, currency)}
                          <span className="text-[10px] font-mono font-normal text-[#625E59]"> / mo</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono uppercase font-semibold text-[#625E59] block leading-none">
                          Lifespan
                        </span>
                        <span className="text-xs font-sans text-[#625E59] mt-1 block">
                          Ongoing
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar & Timeline info */}
                {hasLifespan && item.endDate ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#625E59]">
                      <span className="flex items-center gap-1">
                        <IconCalendarTime size={12} stroke={2} />
                        <span>{item.durationMonths}m lifespan</span>
                      </span>

                      <span>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1B1A18]">
                            <IconCheck size={11} stroke={3} /> Finished
                          </span>
                        ) : (
                          `${remainingDays}d left (${progressPercent}%)`
                        )}
                      </span>
                    </div>

                    {/* Lifespan Progress Track */}
                    <div className="w-full bg-[#EFECE6] h-2 rounded-[2px] overflow-hidden border border-[#E5E0D8]">
                      <div
                        className={`h-full rounded-[2px] transition-all duration-500 ${isCompleted ? 'bg-[#1B1A18]' : 'bg-[#E65B3F]'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#625E59] pt-0.5">
                      <span>{formatDate(item.startDate)}</span>
                      <span>{formatDate(item.endDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#625E59]">
                      <span className="flex items-center gap-1">
                        <IconCalendarTime size={12} stroke={2} />
                        <span>Started {formatDate(item.startDate)}</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-[#1B1A18]">
                        Ongoing
                      </span>
                    </div>

                    <div className="p-2 rounded-[2px] bg-white border border-dashed border-[#DED9D2] flex items-center justify-between text-[11px]">
                      <span className="text-[#625E59]">No duration set</span>
                      <button
                        onClick={() => onEditItem(item)}
                        className="font-mono text-xs font-semibold text-[#E65B3F] hover:underline"
                      >
                        + Set Lifespan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
