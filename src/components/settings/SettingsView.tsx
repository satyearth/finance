'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconTarget,
  IconDownload,
  IconUpload,
  IconRotateClockwise,
  IconTrash,
  IconShieldExclamation,
  IconCheck,
  IconDatabase,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
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
    currentBudget,
    selectedMonth,
    setMonthlyBudget,
    transactions,
  } = useFinance();

  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial budget value
  useEffect(() => {
    const converted = convertFromBaseCurrency(currentBudget || 0, currency);
    setBudgetInput(converted ? converted.toString() : '');
  }, [currentBudget, currency]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save budget on blur or Enter
  const handleBudgetBlur = useCallback(() => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      const baseBudget = convertToBaseCurrency(val, currency);
      if (Math.abs(baseBudget - currentBudget) > 0.01) {
        setMonthlyBudget(selectedMonth.key, baseBudget);
        setBudgetSaved(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setBudgetSaved(false), 2000);
      }
    }
  }, [budgetInput, currentBudget, currency, selectedMonth.key, setMonthlyBudget]);

  const sectionTitle = 'flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]';

  return (
    <div className="w-full space-y-4 animate-fadeIn font-sans">
      {/* Page Title */}
      <div>
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1B1A18]">Settings</h2>
      </div>

      {/* Monthly Budget Target Card */}
      <div className="sf-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconTarget size={17} stroke={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                  Monthly Budget Target
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59]">
                  {selectedMonth.label}
                </span>
              </div>
              <p className="text-xs text-[#625E59] mt-0.5 font-sans">
                Set your spending limit to track headroom, daily velocity, and safe cashflow.
              </p>
            </div>
          </div>

          {/* Quick calculation hint */}
          {parseFloat(budgetInput) > 0 && (
            <div className="text-xs font-mono text-[#625E59] bg-[#F7F5F2] px-2.5 py-1 rounded-[2px] border border-[#DED9D2] self-start sm:self-auto tabular-nums">
              ~₹{Math.round(parseFloat(budgetInput) / 30).toLocaleString('en-IN')} / day
            </div>
          )}
        </div>

        {/* Input & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#1B1A18] block">
              Target Amount (₹)
            </span>
            <p className="text-[11px] text-[#625E59] font-mono">
              Press Enter or click Update to apply
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Styled currency input capsule */}
            <div className="flex items-center bg-white border border-[#DED9D2] focus-within:!border-[#E65B3F] rounded-[2px] transition-all h-9 shadow-sm">
              <span className="px-3 text-xs font-mono font-bold text-[#E65B3F] bg-[#F7F5F2] border-r border-[#DED9D2] h-full flex items-center justify-center select-none">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={handleBudgetBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBudgetBlur();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-32 px-3 text-sm font-mono font-bold text-[#1B1A18] bg-transparent outline-none border-none focus:outline-none tabular-nums"
                placeholder="45000"
                aria-label="Monthly budget target in Rupees"
                style={{ outline: 'none', border: 'none' }}
              />
            </div>

            {/* Save / Update Button */}
            <button
              type="button"
              onClick={handleBudgetBlur}
              className={`h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 shrink-0 ${
                budgetSaved
                  ? 'bg-[#EBF7EE] text-[#2A7E3B] border border-[#2A7E3B]/40'
                  : 'sf-button-primary'
              }`}
            >
              {budgetSaved ? (
                <>
                  <IconCheck size={14} stroke={2.5} />
                  <span>Saved</span>
                </>
              ) : (
                <span>Update</span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-[#F0ECE1] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#756D66] font-semibold mr-1">
            Presets:
          </span>
          {[25000, 35000, 45000, 50000, 60000, 75000, 100000].map((preset) => {
            const isCurrent = parseFloat(budgetInput) === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setBudgetInput(preset.toString());
                  const baseBudget = convertToBaseCurrency(preset, 'INR');
                  setMonthlyBudget(selectedMonth.key, baseBudget);
                  setBudgetSaved(true);
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  saveTimeoutRef.current = setTimeout(() => setBudgetSaved(false), 2000);
                }}
                className={`text-xs font-mono px-2.5 py-1 rounded-[2px] transition-all border tabular-nums ${
                  isCurrent
                    ? 'bg-[#E65B3F] text-white border-[#E65B3F] font-bold shadow-sm'
                    : 'bg-[#F7F5F2] hover:bg-[#EFECE6] text-[#1B1A18] border-[#DED9D2]'
                }`}
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Portability */}
      <div className="sf-card p-5 sm:p-6 space-y-4">
        <div className={sectionTitle}>
          <div className="w-7 h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconDatabase size={15} stroke={2} />
          </div>
          <h3>Data &amp; Backups</h3>
        </div>

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
