'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  IconCoins,
  IconDownload,
  IconUpload,
  IconRotateClockwise,
  IconTrash,
  IconShieldExclamation,
  IconCheck,
  IconDatabase,
  IconChevronDown,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { CURRENCIES } from '@/constants/categories';
import { CurrencyCode } from '@/types/finance';
import { exportToJSON, exportToCSV } from '@/utils/exportImport';
import { convertToBaseCurrency, convertFromBaseCurrency } from '@/utils/formatters';

/**
 * Props for SettingsView component.
 */
interface SettingsViewProps {
  /** Callback to open backup import modal */
  onOpenImportModal: () => void;
  /** Callback to trigger reset confirmation modal ('sample' or 'clear') */
  onOpenResetConfirmModal: (mode: 'sample' | 'clear') => void;
}

/**
 * Settings configuration view allowing user to:
 * - Change reporting currency and monthly budget target
 * - Export data as JSON or CSV backups
 * - Restore ledger from backups or sample data
 */
export function SettingsView({
  onOpenImportModal,
  onOpenResetConfirmModal,
}: SettingsViewProps) {

  const {
    currency,
    setCurrency,
    currentBudget,
    selectedMonth,
    setMonthlyBudget,
    transactions,
  } = useFinance();

  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);

  // Sync initial budget value
  useEffect(() => {
    const converted = convertFromBaseCurrency(currentBudget || 0, currency);
    setBudgetInput(converted ? converted.toString() : '');
  }, [currentBudget, currency]);

  // Auto-save budget on blur or Enter
  const handleBudgetBlur = useCallback(() => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      const baseBudget = convertToBaseCurrency(val, currency);
      if (Math.abs(baseBudget - currentBudget) > 0.01) {
        setMonthlyBudget(selectedMonth.key, baseBudget);
        setBudgetSaved(true);
        setTimeout(() => setBudgetSaved(false), 2000);
      }
    }
  }, [budgetInput, currentBudget, currency, selectedMonth.key, setMonthlyBudget]);

  const sectionTitle = 'flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]';

  return (
    <div className="w-full space-y-4 animate-fadeIn font-sans">
      {/* Page Title */}
      <div>
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1B1A18]">Settings</h2>
        <p className="text-xs text-[#625E59] font-mono mt-0.5">
          Workspace preferences and data management
        </p>
      </div>

      {/* Financial Preferences */}
      <div className="sf-card p-5 sm:p-6 space-y-4">
        <div className={sectionTitle}>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
            <IconCoins size={15} stroke={2} />
          </div>
          <h3>Financial Preferences</h3>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#DED9D2]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#1B1A18] font-bold font-sans">
              <span>Reporting Currency</span>
            </div>
            <p className="text-xs text-[#625E59] mt-0.5">All amounts displayed in this currency</p>
          </div>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="sf-input appearance-none h-8.5 pl-3 pr-8 text-xs font-mono font-bold cursor-pointer bg-white rounded-[2px]"
              aria-label="Select reporting currency"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
            <IconChevronDown size={14} stroke={2} className="text-[#625E59] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#1B1A18] font-bold font-sans">
              <span>Monthly Target ({selectedMonth.label})</span>
            </div>
            <p className="text-xs text-[#625E59] mt-0.5 font-mono">Blur or press Enter to save</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onBlur={handleBudgetBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-32 sf-input h-8.5 px-3 text-xs font-mono font-bold tracking-tight tabular-nums text-right rounded-[2px]"
              placeholder="0.00"
              aria-label="Monthly budget target amount"
            />
            {/* Saved feedback */}
            {budgetSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#E65B3F] animate-fadeIn">
                <IconCheck size={12} stroke={2.5} />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Backup & Portability */}
      <div className="sf-card p-5 sm:p-6 space-y-4">
        <div className={sectionTitle}>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconDatabase size={15} stroke={2} />
          </div>
          <h3>Data Portability &amp; Backups</h3>
        </div>

        <p className="text-xs text-[#625E59] -mt-1 font-sans">
          Export your transaction ledger or import from a previous backup
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => exportToJSON(transactions)}
            className="sf-button-secondary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono rounded-[2px]"
            aria-label="Export data as JSON"
          >
            <IconDownload size={14} stroke={2} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => exportToCSV(transactions)}
            className="sf-button-secondary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono rounded-[2px]"
            aria-label="Export data as CSV"
          >
            <IconDownload size={14} stroke={2} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="sf-button-secondary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono rounded-[2px]"
            aria-label="Import backup data"
          >
            <IconUpload size={14} stroke={2} />
            <span>Import Backup</span>
          </button>
        </div>
      </div>

      {/* Storage & Reset */}
      <div className="sf-card p-5 sm:p-6 space-y-4">
        <div className={sectionTitle}>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-red-600 shrink-0">
            <IconShieldExclamation size={15} stroke={2} />
          </div>
          <h3>Storage &amp; Reset</h3>
        </div>

        <p className="text-xs text-[#625E59] -mt-1 font-sans">
          Load demo data or permanently clear all your transaction records
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onOpenResetConfirmModal('sample')}
            className="sf-button-secondary w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono rounded-[2px]"
            aria-label="Reload sample data"
          >
            <IconRotateClockwise size={14} stroke={2} />
            <span>Reload Sample Data</span>
          </button>

          <button
            onClick={() => onOpenResetConfirmModal('clear')}
            className="w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-mono font-bold bg-[#A33B27] hover:bg-[#8F3220] border border-[#8F3220] text-white rounded-[2px] transition-colors uppercase tracking-wider active:translate-y-[1px]"
            aria-label="Clear all records permanently"
          >
            <IconTrash size={14} stroke={2} />
            <span>Clear All Records</span>
          </button>
        </div>

        <p className="text-[11px] text-[#625E59] font-mono">
          ⚠ &quot;Clear All Records&quot; permanently removes all transactions. Export a backup first.
        </p>
      </div>
    </div>
  );
}
