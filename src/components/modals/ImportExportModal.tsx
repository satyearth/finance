'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  IconX,
  IconDownload,
  IconUpload,
  IconJson,
  IconCsv,
  IconCircleCheck,
  IconAlertCircle,
  IconArrowsSort,
} from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import {
  exportToJSON,
  exportToCSV,
  parseImportedJSON,
  parseImportedCSV,
} from '@/utils/exportImport';
import { formatCurrency } from '@/utils/formatters';
import { ImportedBackupData } from '@/types/finance';

/**
 * Props definition for the ImportExportModal dialog.
 */
interface ImportExportModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Function invoked to close the modal */
  onClose: () => void;
}

/**
 * Modal dialog enabling full data portability:
 * 1. Export: One-click export to full JSON workspace backup or CSV expenses.
 * 2. Import: Validated restoration from JSON backups (v1 & v2) or CSV files with merge/replace options.
 */
export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const {
    transactions,
    amortizedItems,
    monthlyBudgets,
    importBackup,
    currency,
  } = useFinance();

  // Active view: 'export' for downloads, 'import' for uploads
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Import options
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<ImportedBackupData | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    warning?: string;
  } | null>(null);

  // Hidden file input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Don't render DOM nodes when modal is closed
  if (!isOpen) return null;

  /**
   * Reads, parses, and validates the chosen JSON backup or CSV file.
   */
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        setParsedBackup(null);
        setImportStatus({
          success: false,
          message: 'Unable to read uploaded file as text.',
        });
        return;
      }

      const isCsv =
        file.name.toLowerCase().endsWith('.csv') ||
        file.type === 'text/csv';
      const res = isCsv ? parseImportedCSV(content) : parseImportedJSON(content);

      if (res.success && res.backup) {
        setParsedBackup(res.backup);
        const parts: string[] = [];
        parts.push(`${res.backup.transactions.length} transactions`);
        if (res.backup.amortizedItems !== undefined) {
          parts.push(`${res.backup.amortizedItems.length} tracked products`);
        }
        if (res.backup.monthlyBudgets !== undefined) {
          parts.push(`${Object.keys(res.backup.monthlyBudgets).length} monthly budgets`);
        }
        setImportStatus({
          success: true,
          message: `Validated ${parts.join(', ')} from "${file.name}".`,
          warning: res.warning,
        });
      } else {
        setParsedBackup(null);
        setImportStatus({
          success: false,
          message: res.error || 'Failed to parse uploaded backup file.',
        });
      }
    };

    reader.onerror = () => {
      setParsedBackup(null);
      setImportStatus({
        success: false,
        message: 'Failed to read the selected file.',
      });
    };

    reader.readAsText(file);

    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  /**
   * Commits the validated imported backup to local storage context.
   */
  const handleConfirmImport = () => {
    if (!parsedBackup) return;
    importBackup(parsedBackup, replaceExisting);
    setParsedBackup(null);
    setImportStatus(null);
    setReplaceExisting(false);
    onClose();
  };

  const budgetCount = Object.keys(monthlyBudgets).length;
  const previewTransactions = parsedBackup?.transactions ?? [];
  const totalImportItems =
    previewTransactions.length +
    (parsedBackup?.amortizedItems?.length ?? 0) +
    (parsedBackup?.monthlyBudgets ? Object.keys(parsedBackup.monthlyBudgets).length : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sf-modal-backdrop animate-fadeIn font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-export-title"
    >
      <div
        className="w-full max-w-lg rounded-[2px] sf-modal overflow-hidden animate-scaleUp relative font-sans max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-[#DED9D2] bg-[#F7F5F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-white border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconArrowsSort size={15} stroke={2} className="sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 id="import-export-title" className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                Import &amp; Export
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] border border-[#DED9D2] bg-white text-[#625E59] hover:text-[#1B1A18] hover:border-[#1B1A18] flex items-center justify-center transition-colors shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <IconX size={15} stroke={2} />
          </button>
        </div>

        {/* Tab Switcher: Export vs Import */}
        <div className="flex border-b border-[#DED9D2] bg-[#F7F5F2] p-1.5 sm:p-2 gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 h-8 sm:h-[34px] px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] border transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'export'
                ? 'bg-[#1B1A18] text-white border-[#1B1A18]'
                : 'bg-white text-[#625E59] border-[#DED9D2] hover:text-[#1B1A18]'
            }`}
          >
            <IconDownload size={14} stroke={2} />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 h-8 sm:h-[34px] px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] border transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'import'
                ? 'bg-[#1B1A18] text-white border-[#1B1A18]'
                : 'bg-white text-[#625E59] border-[#DED9D2] hover:text-[#1B1A18]'
            }`}
          >
            <IconUpload size={14} stroke={2} />
            <span>Import</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 bg-white space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {activeTab === 'export' ? (
            /* --- EXPORT VIEW --- */
            <div className="space-y-4">
              <div className="p-4 rounded-[2px] border border-[#DED9D2] bg-[#F7F5F2] space-y-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
                  {transactions.length} transactions &middot; {amortizedItems.length} products &middot; {budgetCount} budgets
                </div>
                <p className="text-[11px] font-mono text-[#625E59]">
                  JSON includes your complete workspace; CSV exports transaction rows.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    exportToJSON({
                      transactions,
                      amortizedItems,
                      monthlyBudgets,
                      currency,
                    })
                  }
                  className="sf-button-secondary h-9 flex items-center justify-center gap-2.5 px-3 text-xs font-mono font-bold tracking-wider uppercase rounded-[2px]"
                >
                  <IconJson size={16} stroke={2} className="text-[#E65B3F]" />
                  <span>Download JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportToCSV(transactions)}
                  className="sf-button-secondary h-9 flex items-center justify-center gap-2.5 px-3 text-xs font-mono font-bold tracking-wider uppercase rounded-[2px]"
                >
                  <IconCsv size={16} stroke={2} className="text-[#E65B3F]" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          ) : (
            /* --- IMPORT VIEW --- */
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={handleFileSelected}
                className="hidden"
              />

              {/* Drag/Click Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="border-2 border-dashed border-[#DED9D2] hover:border-[#1B1A18] rounded-[2px] p-6 text-center cursor-pointer bg-[#F7F5F2] hover:bg-white transition-colors"
              >
                <IconUpload size={24} stroke={2} className="mx-auto text-[#E65B3F] mb-2" />
                <div className="text-xs font-mono font-bold text-[#1B1A18] uppercase tracking-wider">
                  Select JSON or CSV backup
                </div>
                <div className="text-xs font-mono text-[#625E59] mt-1">
                  Supports .json (full backup) and .csv (expenses)
                </div>
              </div>

              {/* Status Message (Success or Error feedback) */}
              {importStatus && (
                <div
                  className={`p-3 rounded-[2px] border space-y-1 text-xs font-mono ${
                    importStatus.success
                      ? 'border-[#DED9D2] bg-[#F7F5F2] text-[#1B1A18]'
                      : 'border-red-300 bg-[#FDF2F0] text-[#A83F29]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importStatus.success ? (
                      <IconCircleCheck size={16} stroke={2} className="shrink-0 text-[#E65B3F]" />
                    ) : (
                      <IconAlertCircle size={16} stroke={2} className="shrink-0 text-[#A83F29]" />
                    )}
                    <span>{importStatus.message}</span>
                  </div>
                  {importStatus.warning && (
                    <div className="text-[11px] text-[#A83F29] pl-6">
                      {importStatus.warning}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons & Merge/Replace Toggle */}
              {parsedBackup && (
                <div className="pt-2 space-y-3">
                  {/* Ledger preview snippet */}
                  <div className="p-3 bg-[#F7F5F2] border border-[#DED9D2] rounded-[2px] space-y-1.5 max-h-40 overflow-y-auto">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#625E59] flex items-center justify-between gap-2">
                      <span>Preview ({previewTransactions.length} transactions)</span>
                      {parsedBackup.currency && (
                        <span>Currency: {parsedBackup.currency}</span>
                      )}
                    </div>
                    {previewTransactions.length === 0 ? (
                      <div className="text-xs font-mono text-[#625E59]">
                        No transactions in backup (settings/products only).
                      </div>
                    ) : (
                      <>
                        {previewTransactions.slice(0, 3).map((item, i) => (
                          <div key={item.id || i} className="flex items-center justify-between text-xs font-mono py-0.5 border-b border-[#EBE6E0] last:border-b-0">
                            <span className="text-[#1B1A18] truncate pr-2 font-medium">{item.title}</span>
                            <span className="text-[#625E59] shrink-0 font-bold tabular-nums">
                              {item.date} · {formatCurrency(item.amount, currency)}
                            </span>
                          </div>
                        ))}
                        {previewTransactions.length > 3 && (
                          <div className="text-[10px] font-mono text-[#625E59] text-center pt-1 italic">
                            + {previewTransactions.length - 3} more transactions
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-[#1B1A18] cursor-pointer font-mono">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded-[2px] border-[#DED9D2] text-[#E65B3F] focus:ring-0 cursor-pointer"
                    />
                    <span>Replace existing records with this backup</span>
                  </label>

                  {replaceExisting && (
                    <div className="p-2.5 rounded-[2px] border border-red-200 bg-red-50 text-[11px] font-mono text-red-700">
                      Warning: Replace mode overwrites current transactions
                      {parsedBackup.amortizedItems !== undefined ? ', tracked products' : ''}
                      {parsedBackup.monthlyBudgets !== undefined ? ', and monthly budgets' : ''}.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="sf-button-primary w-full h-9 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[2px] active:translate-y-[1px]"
                  >
                    Import ({totalImportItems} {totalImportItems === 1 ? 'record' : 'records'})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
