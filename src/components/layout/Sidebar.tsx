'use client';

import React from 'react';
import {
  IconLayoutDashboard,
  IconCalendarMonth,
  IconReceiptRupee,
  IconChartLine,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react';
import { ViewTab } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';

/**
 * Satyfinance Desktop Navigation Sidebar:
 * Clean white background with 1px border (#DED9D2), editorial typography,
 * and terracotta (#E65B3F) active indicators.
 */
export function Sidebar() {
  const { activeTab, setActiveTab } = useFinance();

  const menuItems: { id: ViewTab; name: string; icon: React.ElementType }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'calendar', name: 'Calendar', icon: IconCalendarMonth },
    { id: 'transactions', name: 'Transactions', icon: IconReceiptRupee },
    { id: 'analytics', name: 'Analytics', icon: IconChartLine },
    { id: 'settings', name: 'Settings', icon: IconAdjustmentsHorizontal },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#DED9D2] flex flex-col justify-between p-5 select-none shrink-0 sticky top-0 z-30 font-sans">
      {/* Top Section: Brand & Nav */}
      <div className="flex flex-col gap-6">
        {/* Brand Name */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#E65B3F] rotate-45 shrink-0" />
            <span className="font-extrabold text-xl tracking-tight text-[#1B1A18] leading-none font-display">
              Satyfinance
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[2px] text-xs sm:text-sm transition-colors text-left border-l-2 ${
                  isActive
                    ? 'bg-[#F7F5F2] text-[#1B1A18] font-bold border-[#E65B3F]'
                    : 'text-[#625E59] hover:text-[#1B1A18] hover:bg-[#F7F5F2] font-medium border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={17}
                    stroke={isActive ? 2.2 : 1.8}
                    className={isActive ? 'text-[#E65B3F]' : 'text-[#756D66]'}
                  />
                  <span className="font-display tracking-tight">{item.name}</span>
                </div>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 bg-[#E65B3F] rounded-[1px]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer: Made by Saty */}
      <div className="pt-2 px-3 select-none">
        <span className="text-xs font-semibold text-[#625E59] hover:text-[#1B1A18] tracking-tight font-display block transition-colors">
          Made by Saty
        </span>
      </div>
    </aside>
  );
}
