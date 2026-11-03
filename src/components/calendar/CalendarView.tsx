'use client';

import React, { useState } from 'react';
import {
  IconCalendar,
  IconClock,
  IconPlus,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { DayDetailsModal } from './DayDetailsModal';
import { Transaction } from '@/types/finance';

/**
 * Props for CalendarView component.
 */
interface CalendarViewProps {
  /** Optional callback to open expense modal prefilled with date */
  onOpenAddModal?: (date?: string) => void;
  /** Optional callback to open modal for editing an existing transaction */
  onEditTransaction?: (tx: Transaction) => void;
}

/**
 * Returns a concise display name for common recurring bills and utilities.
 *
 * @param title - Raw transaction title
 * @returns Short badge name
 */
function getBillShortName(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('electricity') || lower.includes('power')) return 'Electricity';
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('aws') || lower.includes('amazon web services')) return 'AWS';
  if (lower.includes('prime')) return 'Prime';
  if (lower.includes('gas') || lower.includes('mgl')) return 'Gas';
  if (lower.includes('broadband') || lower.includes('fiber') || lower.includes('airtel')) return 'Internet';
  if (lower.includes('gym') || lower.includes('cult')) return 'Cult.fit';
  return title.split(' ')[0] || 'Bill';
}

/**
 * Monthly calendar forecasting and cashflow timeline view.
 * Highlights settled expenses on or before today and forecasts upcoming scheduled bills.
 */
export function CalendarView({ onOpenAddModal, onEditTransaction }: CalendarViewProps) {

  const {
    selectedMonth,
    filteredTransactions,
    totalSpentThisMonth,
    settledSpentThisMonth,
    scheduledSpentThisMonth,
    currency,
  } = useFinance();

  const today = new Date();
  const isCurrentMonth =
    selectedMonth.year === today.getFullYear() &&
    selectedMonth.month === today.getMonth();
  const isFutureMonth =
    selectedMonth.year > today.getFullYear() ||
    (selectedMonth.year === today.getFullYear() && selectedMonth.month > today.getMonth());

  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    return isCurrentMonth ? today.getDate() : 1;
  });
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  // First day of month
  const firstDayIndex = new Date(selectedMonth.year, selectedMonth.month, 1).getDay();
  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(selectedMonth.year, selectedMonth.month, 0).getDate();

  // Calendar cells
  interface CellData {
    dayNumber: number;
    isCurrentMonth: boolean;
    dateString: string;
    isToday: boolean;
    settled: number;
    bill?: {
      name: string;
      amount: number;
    };
    itemsCount: number;
    hasAnyTransaction: boolean;
  }

  const calendarCells: CellData[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthIdx = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1;
    const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year;
    const dateString = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: day,
      isCurrentMonth: false,
      dateString,
      isToday: false,
      settled: 0,
      itemsCount: 0,
      hasAnyTransaction: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${selectedMonth.key}-${String(d).padStart(2, '0')}`;
    const dayTxs = filteredTransactions.filter((t) => t.date === dateString);
    const isToday = isCurrentMonth && d === today.getDate();
    const isFuture = isFutureMonth || (isCurrentMonth && d > today.getDate());

    let daySettled = 0;
    let dayBill: { name: string; amount: number } | undefined = undefined;

    dayTxs.forEach((tx) => {
      if (isFuture) {
        if (!dayBill) {
          dayBill = {
            name: getBillShortName(tx.title),
            amount: tx.amount,
          };
        } else {
          dayBill.amount += tx.amount;
        }
      } else {
        daySettled += tx.amount;
      }
    });

    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateString,
      isToday,
      settled: daySettled,
      bill: dayBill,
      itemsCount: dayTxs.length,
      hasAnyTransaction: dayTxs.length > 0,
    });
  }

  // Next month trailing days to complete grid
  const totalSlots = Math.ceil(calendarCells.length / 7) * 7;
  const remaining = totalSlots - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthIdx = selectedMonth.month === 11 ? 0 : selectedMonth.month + 1;
    const nextYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year;
    const dateString = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString,
      isToday: false,
      settled: 0,
      itemsCount: 0,
      hasAnyTransaction: false,
    });
  }

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleCellClick = (cell: CellData) => {
    if (!cell.isCurrentMonth) return;
    setSelectedDay(cell.dayNumber);
    setSelectedDayModal(cell.dateString);
  };

  const handleDirectAdd = (e: React.MouseEvent, dateString: string) => {
    e.stopPropagation();
    if (onOpenAddModal) {
      onOpenAddModal(dateString);
    } else {
      setSelectedDayModal(dateString);
    }
  };

  return (
    <div className="sf-card p-0 overflow-hidden animate-fadeIn font-sans">
      {/* 1. Header: Quick Stats & Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-[#DED9D2] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        {/* Left: View Title & Legend */}
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-base font-mono font-bold text-[#1B1A18] uppercase tracking-wider flex items-center gap-2">
              <div className="w-7 h-7 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F]">
                <IconCalendar className="w-4 h-4" stroke={2} />
              </div>
              {selectedMonth.label}
            </h2>
            <p className="text-xs text-[#625E59] font-normal mt-0.5">
              Showing scheduled recurring bills and settled outflows
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#DED9D2] text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#625E59]">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#1B1A18]" /> Settled Spend
            </span>
            <span className="flex items-center gap-1.5 text-[#625E59]">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#DED9D2]" /> Due Bills
            </span>
          </div>
        </div>

        {/* Right: Aggregated Summary Chips */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="px-3.5 py-1.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-right min-w-[90px]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block leading-tight">
              Settled
            </span>
            <span className="text-xs font-mono font-bold text-[#1B1A18] tabular-nums">
              {formatCurrency(settledSpentThisMonth, currency)}
            </span>
          </div>
          <div className="px-3.5 py-1.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-right min-w-[90px]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#625E59] block leading-tight">
              Scheduled
            </span>
            <span className="text-xs font-mono font-bold text-[#1B1A18] tabular-nums">
              {formatCurrency(scheduledSpentThisMonth, currency)}
            </span>
          </div>
          <div className="px-3.5 py-1.5 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 text-right min-w-[90px]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#A83F29] block leading-tight">
              Total
            </span>
            <span className="text-xs font-mono font-bold text-[#E65B3F] tabular-nums">
              {formatCurrency(totalSpentThisMonth, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Weekday Column Headers (Grid-synchronized with identical 1px dividers) */}
      <div className="grid grid-cols-7 gap-[1px] bg-[#DED9D2] border-b border-[#DED9D2]">
        {weekDays.map((d, i) => (
          <div
            key={d}
            className={`bg-[#F7F5F2] py-2 text-center text-[11px] font-mono font-semibold tracking-wider ${
              i === 0 || i === 6 ? 'text-[#8A857F]' : 'text-[#625E59]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 3. Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-[#DED9D2]">
        {calendarCells.map((item, idx) => {
          const isSelected = item.isCurrentMonth && selectedDay === item.dayNumber;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;

          return (
            <div
              key={idx}
              onClick={() => handleCellClick(item)}
              className={`min-h-[90px] sm:min-h-[115px] p-2 flex flex-col justify-between transition-colors relative group ${
                !item.isCurrentMonth
                  ? 'bg-[#FAF8F5] opacity-40 select-none cursor-default'
                  : isSelected
                  ? 'bg-[#F7F5F2] ring-1 ring-inset ring-[#1B1A18] z-10 cursor-pointer'
                  : isWeekend
                  ? 'bg-[#FCFBF9] hover:bg-[#F5F2EC] cursor-pointer'
                  : 'bg-white hover:bg-[#FAF8F5] cursor-pointer'
              }`}
            >
              {/* Day Header: Date & Action/Count group */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-[2px] flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                    item.isToday
                      ? 'bg-[#E65B3F] text-white'
                      : !item.isCurrentMonth
                      ? 'text-[#B8B2A9]'
                      : 'text-[#1B1A18]'
                  }`}
                >
                  {item.dayNumber}
                </span>

                <div className="flex items-center gap-1">
                  {item.itemsCount > 0 && (
                    <span className="text-[10px] font-mono text-[#625E59] bg-[#F7F5F2] border border-[#DED9D2] px-1.5 py-0.5 rounded-[2px] truncate">
                      {item.itemsCount} <span className="hidden sm:inline">{item.itemsCount === 1 ? 'txn' : 'txns'}</span>
                    </span>
                  )}
                  {item.isCurrentMonth && (
                    <button
                      type="button"
                      onClick={(e) => handleDirectAdd(e, item.dateString)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-[2px] bg-white border border-[#DED9D2] hover:border-[#E65B3F] hover:bg-[#F9EEE9] hover:text-[#E65B3F] text-[#625E59] flex items-center justify-center transition-all active:translate-y-[1px]"
                      title={`Add expense on ${item.dateString}`}
                      aria-label={`Add expense on ${item.dateString}`}
                    >
                      <IconPlus className="w-3 h-3" stroke={2.5} />
                    </button>
                  )}
                </div>
              </div>

              {/* Day Content: Amounts / Scheduled Bills */}
              <div className="mt-1.5 sm:mt-2 flex flex-col gap-1 sm:gap-1.5">
                {/* Settled Spending */}
                {item.settled > 0 && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#625E59]">Spent</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#1B1A18] tracking-tight leading-none truncate">
                      {formatCurrency(item.settled, currency)}
                    </span>
                  </div>
                )}

                {/* Scheduled Bill */}
                {item.bill && (
                  <div className="flex items-center justify-between px-1.5 py-1 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] text-xs font-mono">
                    <div className="flex items-center gap-1 truncate">
                      <IconClock className="w-3 h-3 text-[#E65B3F] shrink-0" stroke={2} />
                      <span className="font-semibold truncate">{item.bill.name}</span>
                    </div>
                    <span className="font-bold shrink-0 ml-1">
                      {formatCurrency(item.bill.amount, currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      <DayDetailsModal
        dateString={selectedDayModal}
        onClose={() => setSelectedDayModal(null)}
        onEditTransaction={onEditTransaction}
      />
    </div>
  );
}
