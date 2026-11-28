'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav, MobileBottomBar } from '@/components/layout/MobileNav';
import { HeroBudgetCard } from '@/components/dashboard/HeroBudgetCard';
import { QuickExpenseBar } from '@/components/dashboard/QuickExpenseBar';
import { BentoMetrics } from '@/components/dashboard/BentoMetrics';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { AmortizedTrackerCard } from '@/components/dashboard/AmortizedTrackerCard';
import { Transaction, AmortizedItem } from '@/types/finance';

// Code-split secondary views for optimal initial page bundle size
const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView').then((mod) => mod.CalendarView),
  { ssr: false }
);

const TransactionList = dynamic(
  () => import('@/components/transactions/TransactionList').then((mod) => mod.TransactionList),
  { ssr: false }
);

const AnalyticsView = dynamic(
  () => import('@/components/analytics/AnalyticsView').then((mod) => mod.AnalyticsView),
  { ssr: false }
);

const SettingsView = dynamic(
  () => import('@/components/settings/SettingsView').then((mod) => mod.SettingsView),
  { ssr: false }
);

// Code-split heavy modal dialogs
const AddEditExpenseModal = dynamic(
  () => import('@/components/modals/AddEditExpenseModal').then((mod) => mod.AddEditExpenseModal),
  { ssr: false }
);

const AddEditAmortizedModal = dynamic(
  () => import('@/components/modals/AddEditAmortizedModal').then((mod) => mod.AddEditAmortizedModal),
  { ssr: false }
);

const ImportExportModal = dynamic(
  () => import('@/components/modals/ImportExportModal').then((mod) => mod.ImportExportModal),
  { ssr: false }
);

const ResetConfirmModal = dynamic(
  () => import('@/components/modals/ResetConfirmModal').then((mod) => mod.ResetConfirmModal),
  { ssr: false }
);

/**
 * Main dashboard container managing tab switching, responsive layout,
 * and global modals for adding/editing expenses and amortization items.
 */
function MainDashboard() {
  const {
    activeTab,
    transactions,
    storageRecoveryNotice,
    dismissStorageRecoveryNotice,
  } = useFinance();
  const hasAnyTransactions = transactions.length > 0;

  // Global modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [resetConfirmAction, setResetConfirmAction] = useState<'sample' | 'clear' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedInitialDate, setSelectedInitialDate] = useState<string | undefined>(undefined);

  // Amortized Lifespan modal states
  const [isAmortModalOpen, setIsAmortModalOpen] = useState(false);
  const [editingAmortItem, setEditingAmortItem] = useState<AmortizedItem | null>(null);
  const [selectedTxForAmort, setSelectedTxForAmort] = useState<Transaction | null>(null);

  const handleOpenAddModal = (date?: string) => {
    setEditingTransaction(null);
    setSelectedInitialDate(date);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setSelectedInitialDate(undefined);
    setIsAddModalOpen(true);
  };

  const handleOpenAddAmortModal = (tx?: Transaction | null) => {
    setEditingAmortItem(null);
    setSelectedTxForAmort(tx ?? null);
    setIsAmortModalOpen(true);
  };

  const handleOpenEditAmortModal = (item: AmortizedItem) => {
    setSelectedTxForAmort(null);
    setEditingAmortItem(item);
    setIsAmortModalOpen(true);
  };

  // Global keyboard shortcut 'n' to open new expense modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isAddModalOpen || isAmortModalOpen || isImportExportModalOpen || resetConfirmAction) {
        return;
      }
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenAddModal();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isAddModalOpen, isAmortModalOpen, isImportExportModalOpen, resetConfirmAction]);

  return (
    <div className="min-h-screen bg-white text-[#1B1A18] flex antialiased selection:bg-[#E65B3F] selection:text-white font-sans relative">
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden md:block flex-shrink-0 relative z-30">
        <Sidebar />
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8 relative z-10">
        {/* Top Bar */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddModal={() => handleOpenAddModal()}
        />

        {/* Dynamic Screen View Container */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-3.5 max-w-[1360px] w-full mx-auto">
          {storageRecoveryNotice && (
            <div className="mb-4 p-3 rounded-[2px] border border-[#E65B3F]/40 bg-[#F9EEE9] text-[#A83F29] flex items-center justify-between gap-3 text-xs font-mono">
              <span>
                Some corrupted localStorage entries were safely cleaned up during startup to protect your workspace.
              </span>
              <button
                type="button"
                onClick={dismissStorageRecoveryNotice}
                className="px-2 py-1 rounded-[2px] bg-white border border-[#DED9D2] text-[#1B1A18] hover:border-[#1B1A18] shrink-0 text-[11px] font-bold uppercase"
              >
                Dismiss
              </button>
            </div>
          )}
          {/* Dashboard Tab View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              <QuickExpenseBar />

              {/* Welcome banner — only shown when there are zero transactions */}
              {!hasAnyTransactions && (
                <div className="sf-card p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 border-dashed">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[2px] bg-[#F9EEE9] border border-[#E65B3F]/30 flex items-center justify-center text-[#E65B3F] shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[22px] sm:h-[22px]">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs sm:text-sm font-mono font-bold text-[#1B1A18] uppercase tracking-wider">
                      Welcome to SatyFinance
                    </h2>
                    <p className="text-xs text-[#625E59] mt-1 font-sans max-w-lg leading-relaxed">
                      Your personal wealth workspace is ready. Start by logging your first expense below, or use the quick entry bar above. All your analytics, charts, and insights will appear here as you add data.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => handleOpenAddModal()}
                        className="sf-button-primary h-[34px] px-3.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-[2px]"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Add First Transaction</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <HeroBudgetCard />
              <BentoMetrics />
              <SpendingChart />
              <AmortizedTrackerCard
                onOpenAddModal={() => handleOpenAddAmortModal(null)}
                onEditItem={handleOpenEditAmortModal}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              onEditTransaction={handleOpenEditModal}
              onOpenAddModal={handleOpenAddModal}
            />
          )}

          {activeTab === 'transactions' && (
            <div className="w-full">
              <TransactionList
                onEditTransaction={handleOpenEditModal}
                onOpenAddModal={() => handleOpenAddModal()}
                onTrackAmortization={(tx, existingItem) => {
                  if (existingItem) {
                    handleOpenEditAmortModal(existingItem);
                  } else {
                    handleOpenAddAmortModal(tx);
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="w-full">
              <AnalyticsView />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="w-full">
              <SettingsView
                onOpenImportModal={() => setIsImportExportModalOpen(true)}
                onOpenResetConfirmModal={(act) => setResetConfirmAction(act)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
      />

      {/* Mobile Bottom Quick Navigation */}
      <MobileBottomBar onOpenAddModal={() => handleOpenAddModal()} />

      {/* Global Modals - Rendered only when active to prevent DOM bloat */}
      {isAddModalOpen && (
        <AddEditExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
            setSelectedInitialDate(undefined);
          }}
          editingTransaction={editingTransaction}
          initialDate={selectedInitialDate}
        />
      )}

      {isAmortModalOpen && (
        <AddEditAmortizedModal
          isOpen={isAmortModalOpen}
          onClose={() => {
            setIsAmortModalOpen(false);
            setEditingAmortItem(null);
            setSelectedTxForAmort(null);
          }}
          editingItem={editingAmortItem}
          initialTransaction={selectedTxForAmort}
        />
      )}

      {isImportExportModalOpen && (
        <ImportExportModal
          isOpen={isImportExportModalOpen}
          onClose={() => setIsImportExportModalOpen(false)}
        />
      )}

      {resetConfirmAction && (
        <ResetConfirmModal
          actionType={resetConfirmAction}
          onClose={() => setResetConfirmAction(null)}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <FinanceProvider>
      <MainDashboard />
    </FinanceProvider>
  );
}
