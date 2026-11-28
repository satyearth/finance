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
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { CurrencyCode } from '@/types/finance';
import {
  BUDGET_PRESETS_BY_CURRENCY,
  CURRENCIES,
  DEFAULT_MONTHLY_BUDGET,
} from '@/constants/categories';
import { exportToJSON, exportToCSV } from '@/utils/exportImport';
import {
  convertToBaseCurrency,
  convertFromBaseCurrency,
  formatDisplayAmount,
  roundCurrency,
} from '@/utils/formatters';

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
 * - Export data as full JSON backup or CSV expenses
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
    amortizedItems,
    monthlyBudgets,
  } = useFinance();

  const activeCurrency = CURRENCIES[currency] || CURRENCIES.INR;
  const presets = BUDGET_PRESETS_BY_CURRENCY[currency] || BUDGET_PRESETS_BY_CURRENCY.INR;

  const convertedBudget = convertFromBaseCurrency(currentBudget || 0, currency);
  const defaultBudgetStr = convertedBudget > 0 ? convertedBudget.toString() : '';
  const syncKey = `${selectedMonth.key}::${currentBudget}::${currency}`;

  const [draftBudget, setDraftBudget] = useState<{ key: string; value: string } | null>(null);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const budgetInput =
    draftBudget && draftBudget.key === syncKey ? draftBudget.value : defaultBudgetStr;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const triggerSavedFeedback = useCallback(() => {
    setBudgetSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setBudgetSaved(false), 2000);
  }, []);

  // Save budget on blur, Enter, or Update click
  const handleBudgetSave = useCallback(() => {
    const trimmed = budgetInput.trim();
    if (trimmed === '') {
      if (currentBudget > 0) {
        setMonthlyBudget(selectedMonth.key, 0);
        triggerSavedFeedback();
      }
      setDraftBudget(null);
      setBudgetError(null);
      return;
    }

    const val = parseFloat(trimmed);
    if (!Number.isFinite(val) || val < 0) {
      setBudgetError('Enter a valid non-negative budget amount.');
      setDraftBudget(null);
      return;
    }

    setBudgetError(null);
    const baseBudget = convertToBaseCurrency(val, currency);
    if (Math.abs(baseBudget - currentBudget) > 0.01) {
      setMonthlyBudget(selectedMonth.key, baseBudget);
      triggerSavedFeedback();
    }
    setDraftBudget(null);
  }, [budgetInput, currentBudget, currency, selectedMonth.key, setMonthlyBudget, triggerSavedFeedback]);

  const parsedBudgetNum = parseFloat(budgetInput);
  const dailyBudgetHint =
    Number.isFinite(parsedBudgetNum) && parsedBudgetNum > 0
      ? formatDisplayAmount(roundCurrency(parsedBudgetNum / 30), currency)
      : null;

  const sectionTitle =
    'flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]';

  return (
    <div className="w-full space-y-4 animate-fadeIn font-sans">
      {/* Page Title */}
      <div>
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1B1A18]">Settings</h2>
      </div>

      {/* Display Currency Selector Card */}
      <div className="sf-card p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconCurrencyDollar size={16} stroke={2.2} className="sm:w-[17px] sm:h-[17px]" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                Display Currency
              </h3>
              <p className="text-[11px] sm:text-xs text-[#625E59] mt-0.5 font-sans">
                Amounts remain safely stored in base INR and convert dynamically on display.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#1B1A18] self-start sm:self-auto">
            Active: {activeCurrency.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Select display currency">
          {(Object.values(CURRENCIES) as Array<(typeof CURRENCIES)[CurrencyCode]>).map((curr) => {
            const isActive = currency === curr.code;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => {
                  setCurrency(curr.code);
                  setBudgetError(null);
                }}
                aria-pressed={isActive}
                className={`h-9 px-3 text-xs font-mono rounded-[2px] border transition-colors flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-[#E65B3F] text-white border-[#E65B3F] font-bold'
                    : 'bg-white text-[#1B1A18] border-[#DED9D2] hover:border-[#1B1A18]'
                }`}
              >
                <span>{curr.symbol}</span>
                <span>{curr.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Budget Target Card */}
      <div className="sf-card p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-[#DED9D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconTarget size={16} stroke={2.2} className="sm:w-[17px] sm:h-[17px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                  Monthly Budget Target
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-[2px] bg-[#F7F5F2] border border-[#DED9D2] text-[#625E59]">
                  {selectedMonth.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#625E59] mt-0.5 font-sans">
                Set a monthly spending limit.
              </p>
            </div>
          </div>

          {/* Quick calculation hint */}
          {dailyBudgetHint && (
            <div className="text-[11px] sm:text-xs font-mono text-[#625E59] bg-[#F7F5F2] px-2.5 py-1 rounded-[2px] border border-[#DED9D2] self-start sm:self-auto tabular-nums">
              ~{dailyBudgetHint} / day
            </div>
          )}
        </div>

        {budgetError && (
          <div className="p-2.5 rounded-[2px] bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
            {budgetError}
          </div>
        )}

        {/* Input & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-1">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#1B1A18] block">
              Target Amount ({activeCurrency.symbol})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Styled currency input capsule */}
            <div className="flex items-center flex-1 sm:flex-none bg-white border border-[#DED9D2] focus-within:!border-[#E65B3F] rounded-[2px] transition-all h-9 shadow-sm">
              <span className="px-2.5 sm:px-3 text-xs font-mono font-bold text-[#E65B3F] bg-[#F7F5F2] border-r border-[#DED9D2] h-full flex items-center justify-center select-none">
                {activeCurrency.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={budgetInput}
                onChange={(e) => {
                  setDraftBudget({ key: syncKey, value: e.target.value });
                  if (budgetError) setBudgetError(null);
                }}
                onBlur={handleBudgetSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBudgetSave();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full sm:w-32 px-2.5 sm:px-3 text-xs sm:text-sm font-mono font-bold text-[#1B1A18] bg-transparent outline-none border-none focus:outline-none tabular-nums"
                placeholder={(DEFAULT_MONTHLY_BUDGET[currency] || 45000).toString()}
                aria-label={`Monthly budget target in ${currency}`}
                style={{ outline: 'none', border: 'none' }}
              />
            </div>

            {/* Save / Update Button */}
            <button
              type="button"
              onClick={handleBudgetSave}
              className={`h-9 px-3.5 sm:px-4 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all flex items-center justify-center gap-1.5 shrink-0 ${
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
        <div className="pt-2 border-t border-[#F0ECE1] flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#756D66] font-semibold mr-1 whitespace-nowrap">
            Presets:
          </span>
          {presets.map((preset) => {
            const isCurrent =
              Number.isFinite(parsedBudgetNum) && Math.abs(parsedBudgetNum - preset) < 0.01;
            const locale = currency === 'INR' ? 'en-IN' : 'en-US';
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setDraftBudget(null);
                  setBudgetError(null);
                  const baseBudget = convertToBaseCurrency(preset, currency);
                  setMonthlyBudget(selectedMonth.key, baseBudget);
                  triggerSavedFeedback();
                }}
                className={`text-[11px] sm:text-xs font-mono px-2 sm:px-2.5 py-1 rounded-[2px] transition-all border tabular-nums whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-[#E65B3F] text-white border-[#E65B3F] font-bold shadow-sm'
                    : 'bg-[#F7F5F2] hover:bg-[#EFECE6] text-[#1B1A18] border-[#DED9D2]'
                }`}
              >
                {activeCurrency.symbol}
                {preset.toLocaleString(locale)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Portability */}
      <div className="sf-card p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div className={sectionTitle}>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#1B1A18] shrink-0">
            <IconDatabase size={14} stroke={2} className="sm:w-[15px] sm:h-[15px]" />
          </div>
          <h3>Data &amp; Backups</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <button
            onClick={() =>
              exportToJSON({
                transactions,
                amortizedItems,
                monthlyBudgets,
                currency,
              })
            }
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

        <p className="text-[11px] text-[#625E59] font-mono">
          JSON backups include transactions, monthly budgets, tracked products, and currency settings. CSV exports transactions.
        </p>
      </div>

      {/* Storage & Reset */}
      <div className="sf-card p-4 sm:p-6 space-y-3.5 sm:space-y-4">
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
          ⚠ Clearing records permanently removes all transactions, budgets, tracked products, and resets currency. Export a backup first.
        </p>
      </div>
    </div>
  );
}
