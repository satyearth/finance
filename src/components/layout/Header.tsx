'use client';

import React from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconMenu2,
  IconCalendar,
  IconPlus,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';

/**
 * Props for Header component.
 */
interface HeaderProps {
  /** Optional callback to toggle mobile drawer menu */
  onToggleMobileMenu?: () => void;
  /** Optional callback to open new expense modal */
  onOpenAddModal?: () => void;
}

/**
 * Satyfinance Header:
 * Editorial header with month navigation switcher and quick action.
 */
export function Header({ onToggleMobileMenu, onOpenAddModal }: HeaderProps) {
  const {
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setSelectedMonthYear,
  } = useFinance();

  const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);
  const [pickerYear, setPickerYear] = React.useState(selectedMonth.year);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth.key === currentMonthKey;

  // Sync picker year when selectedMonth changes
  React.useEffect(() => {
    setPickerYear(selectedMonth.year);
  }, [selectedMonth.year]);

  // Close popup on outside click or Escape key
  React.useEffect(() => {
    if (!isMonthPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMonthPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMonthPickerOpen]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const handleSelectMonth = (monthIdx: number) => {
    setSelectedMonthYear(pickerYear, monthIdx);
    setIsMonthPickerOpen(false);
  };

  return (
    <header className="w-full select-none py-3 px-6 sm:px-8 font-sans border-b border-[#DED9D2] bg-white sticky top-0 z-20">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between w-full min-h-[38px]">
        {/* Left: Month Switcher & Popover Trigger */}
        <div className="flex items-center gap-2 relative">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden h-8.5 w-8.5 rounded-[2px] border border-[#DED9D2] hover:bg-[#F7F5F2] text-[#1B1A18] flex items-center justify-center transition-colors mr-1"
              aria-label="Open menu"
            >
              <IconMenu2 size={18} stroke={1.8} />
            </button>
          )}

          {/* Month Switcher Capsule */}
          <div className="relative" ref={popoverRef}>
            <div className="flex items-center h-8.5 bg-[#F7F5F2] border border-[#DED9D2] rounded-[2px] p-0.5">
              <button
                onClick={goToPreviousMonth}
                className="w-7 h-7 flex items-center justify-center rounded-[2px] hover:bg-[#EBE6E0] text-[#1B1A18] transition-colors"
                title="Previous month"
                aria-label="Previous month"
              >
                <IconChevronLeft size={15} stroke={2} />
              </button>

              <button
                type="button"
                onClick={() => setIsMonthPickerOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 h-7 rounded-[2px] hover:bg-[#EBE6E0] text-[#1B1A18] transition-colors"
                title="Click to jump to another month or year"
                aria-expanded={isMonthPickerOpen}
                aria-haspopup="dialog"
                aria-label="Select month"
              >
                <IconCalendar size={14} stroke={2} className="text-[#E65B3F] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#1B1A18] font-display tracking-tight">
                  {selectedMonth.label}
                </span>
                <IconChevronDown
                  size={13}
                  stroke={2}
                  className={`text-[#625E59] transition-transform duration-200 ${
                    isMonthPickerOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                onClick={goToNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-[2px] hover:bg-[#EBE6E0] text-[#1B1A18] transition-colors"
                title="Next month"
                aria-label="Next month"
              >
                <IconChevronRight size={15} stroke={2} />
              </button>
            </div>

            {/* Calendar / Month Selector Popover */}
            {isMonthPickerOpen && (
              <div
                className="absolute top-full left-0 mt-2 z-50 w-72 bg-white/95 backdrop-blur-md border border-[#DED9D2] shadow-xl rounded-[2px] p-3 font-sans animate-scaleUp"
                role="dialog"
                aria-label="Month picker"
              >
                {/* Year Navigation Bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DED9D2]">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="w-7 h-7 rounded-[2px] border border-[#DED9D2] hover:bg-[#F7F5F2] flex items-center justify-center text-[#1B1A18] transition-colors"
                    aria-label="Previous year"
                  >
                    <IconChevronLeft size={14} stroke={2} />
                  </button>

                  <span className="font-mono font-bold text-xs text-[#1B1A18] tracking-wider uppercase">
                    {pickerYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="w-7 h-7 rounded-[2px] border border-[#DED9D2] hover:bg-[#F7F5F2] flex items-center justify-center text-[#1B1A18] transition-colors"
                    aria-label="Next year"
                  >
                    <IconChevronRight size={14} stroke={2} />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-1.5 py-1">
                  {monthNames.map((name, idx) => {
                    const isSelected =
                      selectedMonth.year === pickerYear && selectedMonth.month === idx;
                    const isCurrent =
                      today.getFullYear() === pickerYear && today.getMonth() === idx;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        className={`py-1.5 px-2 text-xs font-mono font-semibold rounded-[2px] transition-all flex items-center justify-center gap-1 relative ${
                          isSelected
                            ? 'bg-[#E65B3F] text-white font-bold shadow-sm'
                            : isCurrent
                            ? 'bg-[#F9EEE9] text-[#A83F29] border border-[#E65B3F]/30 hover:border-[#E65B3F]'
                            : 'text-[#625E59] hover:bg-[#F7F5F2] hover:text-[#1B1A18] border border-transparent'
                        }`}
                      >
                        <span>{name}</span>
                        {isCurrent && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-[#E65B3F]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Quick Return Action */}
                <div className="pt-2 mt-2 border-t border-[#DED9D2] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      goToCurrentMonth();
                      setIsMonthPickerOpen(false);
                    }}
                    className="text-[11px] font-mono font-semibold text-[#E65B3F] hover:underline"
                  >
                    Jump to Current Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMonthPickerOpen(false)}
                    className="text-[11px] font-mono text-[#625E59] hover:text-[#1B1A18]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="hidden sm:inline-flex items-center h-8.5 text-xs font-semibold px-3 rounded-[2px] bg-[#F7F5F2] hover:bg-[#EBE6E0] border border-[#DED9D2] text-[#1B1A18] transition-colors"
              title="Return to current month"
            >
              Current Month
            </button>
          )}
        </div>

        {/* Right: Quick Action */}
        <div className="flex items-center gap-2.5">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center h-8.5 sm:h-9 sf-button-primary text-xs uppercase tracking-wider px-3.5 gap-1.5 shrink-0 rounded-[2px]"
              title="Record new expense (N)"
            >
              <IconPlus size={14} stroke={2.5} />
              <span>New Entry</span>
              <span className="hidden md:inline-block ml-1 text-[10px] bg-black/20 px-1 py-0.5 rounded-[1px] font-mono opacity-80 leading-none">
                N
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
