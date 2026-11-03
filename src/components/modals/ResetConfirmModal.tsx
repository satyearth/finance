'use client';

import React, { useEffect } from 'react';
import { IconAlertTriangle, IconX, IconRotateClockwise, IconTrash } from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';

/**
 * Props for ResetConfirmModal component.
 */
interface ResetConfirmModalProps {
  /** Target action mode ('sample' to reset to demo data, 'clear' to wipe all) */
  actionType: 'sample' | 'clear' | null;
  /** Callback to close modal */
  onClose: () => void;
}

/**
 * Destructive action confirmation dialog for resetting or clearing ledger data.
 */
export function ResetConfirmModal({ actionType, onClose }: ResetConfirmModalProps) {
  const { resetToSampleData, clearAllData } = useFinance();

  // Close on Escape key press
  useEffect(() => {
    if (!actionType) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionType, onClose]);

  if (!actionType) return null;

  const isClear = actionType === 'clear';

  const handleConfirm = () => {
    if (isClear) {
      clearAllData();
    } else {
      resetToSampleData();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sf-modal-backdrop animate-fadeIn font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
    >
      <div
        className="w-full max-w-md rounded-[2px] sf-modal p-5 sm:p-6 space-y-4 animate-scaleUp relative overflow-hidden font-sans bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#DED9D2]">
          <div className="flex items-center gap-3 text-[#1B1A18]">
            <div className="w-8 h-8 rounded-[2px] bg-[#F9EEE9] border border-[#DED9D2] flex items-center justify-center text-[#E65B3F] shrink-0">
              <IconAlertTriangle size={17} stroke={2} />
            </div>
            <h3 id="reset-confirm-title" className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A18]">
              {isClear ? 'Erase All Records Confirmation' : 'Restore Default Sample Data'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[2px] border border-[#DED9D2] bg-white text-[#625E59] hover:text-[#1B1A18] hover:border-[#1B1A18] flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        <p className="text-xs text-[#625E59] leading-relaxed font-mono">
          {isClear
            ? 'Are you sure you want to permanently clear all transactions from your browser? This action cannot be reversed.'
            : 'This will reset your ledger back to the pre-populated realistic sample transactions across your current month.'}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DED9D2]">
          <button
            type="button"
            onClick={onClose}
            className="sf-button-secondary h-9 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-[2px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex items-center gap-1.5 h-9 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-[2px] transition-colors ${
              isClear
                ? 'bg-[#E65B3F] text-white border border-[#E65B3F] hover:bg-[#d44d32]'
                : 'sf-button-primary'
            }`}
          >
            {isClear ? <IconTrash size={14} stroke={2} /> : <IconRotateClockwise size={14} stroke={2} />}
            <span>{isClear ? 'Erase All Data' : 'Restore Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

