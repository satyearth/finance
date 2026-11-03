'use client';

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav, MobileBottomBar } from '@/components/layout/MobileNav';
import { HeroBudgetCard } from '@/components/dashboard/HeroBudgetCard';
import { QuickExpenseBar } from '@/components/dashboard/QuickExpenseBar';
import { BentoMetrics } from '@/components/dashboard/BentoMetrics';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { AmortizedTrackerCard } from '@/components/dashboard/AmortizedTrackerCard';
import { CalendarView } from '@/components/calendar/CalendarView';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { AddEditExpenseModal } from '@/components/modals/AddEditExpenseModal';
import { AddEditAmortizedModal } from '@/components/modals/AddEditAmortizedModal';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { ResetConfirmModal } from '@/components/modals/ResetConfirmModal';
import { Transaction, AmortizedItem } from '@/types/finance';

/**
 * Main dashboard container managing tab switching, responsive layout,
 * and global modals for adding/editing expenses and amortization items.
 */
function MainDashboard() {
  const { activeTab } = useFinance();

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

  const handleOpenAddModal = (date?: string | unknown) => {
    setEditingTransaction(null);
    setSelectedInitialDate(typeof date === 'string' ? date : undefined);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setSelectedInitialDate(undefined);
    setIsAddModalOpen(true);
  };

  const handleOpenAddAmortModal = (tx?: Transaction | unknown) => {
    setEditingAmortItem(null);
    const validTx =
      tx && typeof tx === 'object' && 'title' in tx && 'amount' in tx
        ? (tx as Transaction)
        : null;
    setSelectedTxForAmort(validTx);
    setIsAmortModalOpen(true);
  };

  const handleOpenEditAmortModal = (item: AmortizedItem) => {
    setSelectedTxForAmort(null);
    setEditingAmortItem(item);
    setIsAmortModalOpen(true);
  };

  // Global keyboard shortcut 'n' to open new expense modal
  React.useEffect(() => {
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
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 relative z-10">
        {/* Top Bar */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddModal={handleOpenAddModal}
        />

        {/* Dynamic Screen View Container */}
        <main className="flex-1 px-6 sm:px-8 py-3 max-w-[1360px] w-full mx-auto">
          {/* Dashboard Tab View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Repositioned Standalone Quick Expense Search Bar (Above Hero Outflow Card) */}
              <QuickExpenseBar />

              {/* 1. Top Hero Card: Outflow + Monthly Target Utilization */}
              <HeroBudgetCard />

              {/* 2. Metric Cards Row */}
              <BentoMetrics />

              {/* 3. Spending Chart Card */}
              <SpendingChart />

              {/* 4. Product Lifespan & Monthly Amortization Tracker Card */}
              <AmortizedTrackerCard
                onOpenAddModal={handleOpenAddAmortModal}
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
                onOpenAddModal={handleOpenAddModal}
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
        onOpenAddModal={handleOpenAddModal}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
      />

      {/* Mobile Bottom Quick Navigation */}
      <MobileBottomBar onOpenAddModal={handleOpenAddModal} />

      {/* Global Modals */}
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

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
      />

      <ResetConfirmModal
        actionType={resetConfirmAction}
        onClose={() => setResetConfirmAction(null)}
      />
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
