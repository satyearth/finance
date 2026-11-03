'use client';

import React from 'react';
import {
  IconLayoutDashboard,
  IconCalendarMonth,
  IconReceiptRupee,
  IconChartLine,
  IconAdjustmentsHorizontal,
  IconX,
  IconPlus,
  IconArrowsSort,
} from '@tabler/icons-react';
import { ViewTab } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';

/**
 * Props for MobileNav drawer.
 */
interface MobileNavProps {
  /** Whether the mobile menu drawer is open */
  isOpen: boolean;
  /** Callback to close the mobile menu drawer */
  onClose: () => void;
  /** Callback to launch the expense creation modal */
  onOpenAddModal: () => void;
  /** Callback to launch the import/export modal */
  onOpenImportExportModal: () => void;
}

/**
 * Satyfinance Slide-out Navigation Drawer for mobile screens.
 */
export function MobileNav({
  isOpen,
  onClose,
  onOpenAddModal,
  onOpenImportExportModal,
}: MobileNavProps) {
  const { activeTab, setActiveTab } = useFinance();

  // Close mobile drawer on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: IconCalendarMonth },
    { id: 'transactions', label: 'Transactions', icon: IconReceiptRupee },
    { id: 'analytics', label: 'Analytics', icon: IconChartLine },
    { id: 'settings', label: 'Settings', icon: IconAdjustmentsHorizontal },
  ];

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1B1A18]/40 transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-white border-r border-[#DED9D2] h-full flex flex-col z-10 p-5 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E65B3F] rotate-45 shrink-0" />
            <span className="font-extrabold text-xl tracking-tight text-[#1B1A18] font-display">
              Satyfinance
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[2px] text-[#1B1A18] hover:bg-[#F7F5F2] border border-[#DED9D2] flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <IconX size={16} stroke={1.8} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[2px] text-xs sm:text-sm transition-colors text-left min-h-[44px] ${
                  isActive
                    ? 'bg-[#F7F5F2] text-[#1B1A18] font-bold border-l-2 border-[#E65B3F]'
                    : 'text-[#625E59] hover:text-[#1B1A18] hover:bg-[#F7F5F2] font-medium border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={18}
                    stroke={isActive ? 2.2 : 1.8}
                    className={isActive ? 'text-[#E65B3F]' : 'text-[#756D66]'}
                  />
                  <span className="font-display tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-[#E65B3F]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#DED9D2] space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddModal();
            }}
            className="sf-button-primary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono uppercase tracking-wider rounded-[2px]"
          >
            <IconPlus size={16} stroke={2.5} />
            <span>New Expense</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenImportExportModal();
            }}
            className="sf-button-secondary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono uppercase tracking-wider rounded-[2px]"
          >
            <IconArrowsSort size={15} stroke={1.8} />
            <span>Import / Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Satyfinance Bottom Navigation Bar fixed to viewport on mobile.
 */
export function MobileBottomBar({
  onOpenAddModal,
}: {
  /** Callback to launch the expense creation modal */
  onOpenAddModal: () => void;
}) {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: IconCalendarMonth },
    { id: 'transactions', label: 'Transactions', icon: IconReceiptRupee },
    { id: 'analytics', label: 'Analytics', icon: IconChartLine },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#DED9D2] px-3 py-1.5 flex items-center justify-around select-none font-sans shadow-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center min-h-[44px] gap-1 px-3 py-1 rounded-[2px] text-[11px] transition-colors ${
              isActive
                ? 'text-[#E65B3F] font-bold'
                : 'text-[#625E59] font-medium hover:text-[#1B1A18]'
            }`}
          >
            <Icon
              size={18}
              stroke={isActive ? 2.2 : 1.8}
              className={isActive ? 'text-[#E65B3F]' : 'text-[#756D66]'}
            />
            <span className="font-display leading-none">{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="w-10 h-10 rounded-[2px] bg-[#E65B3F] hover:bg-[#DC5238] active:translate-y-[1px] text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
        title="Add Expense"
        aria-label="Add Expense"
      >
        <IconPlus size={20} stroke={2.5} />
      </button>
    </div>
  );
}
