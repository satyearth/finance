import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { SettingsView } from '@/components/settings/SettingsView';
import { DayDetailsModal } from '@/components/calendar/DayDetailsModal';
import { AmortizedPreviewPill } from '@/components/modals/amortized/AmortizedPreviewPill';
import { AmortizedTrackerCard } from '@/components/dashboard/AmortizedTrackerCard';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { AddEditAmortizedModal } from '@/components/modals/AddEditAmortizedModal';
import { CalendarView } from '@/components/calendar/CalendarView';
import { STORAGE_KEY_BUDGET, STORAGE_KEY_MIGRATED } from '@/utils/storage';

describe('Component integration tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEY_MIGRATED, '1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SettingsView switches currency dynamically without corrupting stored INR budget', () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Store ₹50,000 INR budget
    window.localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify({ [currentMonthKey]: 50000 }));

    render(
      <FinanceProvider>
        <SettingsView
          onOpenImportModal={vi.fn()}
          onOpenResetConfirmModal={vi.fn()}
        />
      </FinanceProvider>
    );

    expect(screen.getByText('Active: INR (₹)')).toBeInTheDocument();
    expect(screen.getByText('Target Amount (₹)')).toBeInTheDocument();

    // Switch currency to USD (rate 0.012 -> 50000 * 0.012 = $600)
    fireEvent.click(screen.getByRole('button', { name: /USD/i }));

    expect(screen.getByText('Active: USD ($)')).toBeInTheDocument();
    expect(screen.getByText('Target Amount ($)')).toBeInTheDocument();

    const input = screen.getByLabelText('Monthly budget target in USD') as HTMLInputElement;
    expect(input.value).toBe('600');

    // Stored INR value in localStorage must remain unchanged at 50000
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_BUDGET)!)[currentMonthKey]).toBe(50000);

    // Click USD preset $1,200 -> 1200 / 0.012 = ₹100,000 stored in base INR
    fireEvent.click(screen.getByRole('button', { name: '$1,200' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY_BUDGET)!)[currentMonthKey]).toBe(100000);
  });

  it('DayDetailsModal shows explicit validation errors instead of failing silently', () => {
    render(
      <FinanceProvider>
        <DayDetailsModal dateString="2026-11-15" onClose={vi.fn()} />
      </FinanceProvider>
    );

    const addBtn = screen.getByRole('button', { name: /add/i });

    // Empty description
    fireEvent.click(addBtn);
    expect(screen.getByText('Enter a description.')).toBeInTheDocument();

    // Valid description, invalid amount
    fireEvent.change(screen.getByLabelText('Transaction description'), {
      target: { value: 'Tea' },
    });
    fireEvent.change(screen.getByLabelText('Transaction amount in INR'), {
      target: { value: '0' },
    });
    fireEvent.click(addBtn);
    expect(screen.getByText('Enter a valid amount greater than 0.')).toBeInTheDocument();

    // Valid submission adds transaction
    fireEvent.change(screen.getByLabelText('Transaction amount in INR'), {
      target: { value: '120' },
    });
    fireEvent.click(addBtn);
    expect(screen.queryByText('Enter a valid amount greater than 0.')).not.toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('AmortizedPreviewPill formats active display currency without double conversion', () => {
    render(
      <AmortizedPreviewPill
        hasLifespan={true}
        parsedCost={120}
        calculatedMonths={2}
        monthlyCost={60}
        dailyCost={1.94}
        currency="USD"
      />
    );

    expect(screen.getByText('$ 120 · 2m')).toBeInTheDocument();
    expect(screen.getByText(/\$ 60/)).toBeInTheDocument();
    expect(screen.getByText(/~\$ 1.94 \/ day/)).toBeInTheDocument();
  });

  it('AmortizedTrackerCard requires confirmation before deleting an item', () => {
    function Harness() {
      const { addAmortizedItem } = useFinance();
      React.useEffect(() => {
        addAmortizedItem({
          name: 'Test Fragrance',
          totalCost: 3000,
          startDate: '2026-11-01',
          endDate: '2027-02-01',
          durationMonths: 3,
          durationDays: 92,
          monthlyCost: 1000,
          dailyCost: 32.61,
          category: 'personal_care',
          status: 'active',
        });
      }, [addAmortizedItem]);

      return <AmortizedTrackerCard onOpenAddModal={vi.fn()} onEditItem={vi.fn()} />;
    }

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(
      <FinanceProvider>
        <Harness />
      </FinanceProvider>
    );

    const deleteBtn = screen.getByLabelText('Delete Test Fragrance');
    // Cancelled deletion preserves item
    fireEvent.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalledWith('Delete "Test Fragrance"?');
    expect(screen.getByText('Test Fragrance')).toBeInTheDocument();

    // Confirmed deletion removes item
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Test Fragrance')).not.toBeInTheDocument();
  });

  it('ImportExportModal validates malformed uploads and imports valid CSV with replace warning', async () => {
    function Harness() {
      const { transactions, monthlyBudgets } = useFinance();
      return (
        <div>
          <span data-testid="tx-count">{transactions.length}</span>
          <span data-testid="budget-count">{Object.keys(monthlyBudgets).length}</span>
          <ImportExportModal isOpen={true} onClose={vi.fn()} />
        </div>
      );
    }

    render(
      <FinanceProvider>
        <Harness />
      </FinanceProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Import/i }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    // Upload invalid JSON
    const badFile = new File(['{not-json'], 'bad.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });
    expect(
      await screen.findByText(/Expected property name|Unexpected token|Invalid JSON/i)
    ).toBeInTheDocument();

    // Upload valid CSV
    const csvContent = 'ID,Title,Amount,Category,Date,Notes\r\n"tx-csv-1","Metro Card",500,"other","2026-11-10","Commute"';
    const csvFile = new File([csvContent], 'expenses.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [csvFile] } });

    expect(await screen.findByText(/Validated 1 transactions from "expenses.csv"/i)).toBeInTheDocument();
    const replaceCheckbox = screen.getByRole('checkbox');
    fireEvent.click(replaceCheckbox);
    expect(screen.getByText(/Warning: Replace mode overwrites current transactions/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Import \(1 record\)/i }));
    expect(screen.getByTestId('tx-count')).toHaveTextContent('1');
  });

  it('AddEditAmortizedModal opens existing item when selecting an already-tracked transaction instead of duplicating', () => {
    function Harness() {
      const { addTransaction, addAmortizedItem, amortizedItems } = useFinance();
      React.useEffect(() => {
        const tx = addTransaction({
          title: 'Whey Protein',
          amount: 2400,
          category: 'groceries',
          date: '2026-11-01',
        });
        addAmortizedItem({
          transactionId: tx.id,
          name: 'Whey Protein',
          totalCost: 2400,
          startDate: '2026-11-01',
          endDate: '2027-02-01',
          durationMonths: 3,
          durationDays: 92,
          monthlyCost: 800,
          dailyCost: 26.09,
          category: 'groceries',
          status: 'active',
        });
      }, [addTransaction, addAmortizedItem]);

      return (
        <div>
          <span data-testid="amort-count">{amortizedItems.length}</span>
          <AddEditAmortizedModal isOpen={true} onClose={vi.fn()} />
        </div>
      );
    }

    render(
      <FinanceProvider>
        <Harness />
      </FinanceProvider>
    );

    expect(screen.getByTestId('amort-count')).toHaveTextContent('1');
    // Picker button should display "Edit" for already-tracked expense
    const editPickerBtn = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editPickerBtn);

    // Modal switches to Edit Product mode with Save button instead of Add product
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('amort-count')).toHaveTextContent('1');
  });

  it('CalendarView selects day cells stably and opens DayDetailsModal on click', () => {
    render(
      <FinanceProvider>
        <CalendarView />
      </FinanceProvider>
    );

    // Click day 10 cell in the current month
    const dayTenLabels = screen.getAllByText('10');
    fireEvent.click(dayTenLabels[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('No transactions for this day.')).toBeInTheDocument();
  });
});
