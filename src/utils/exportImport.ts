import { Transaction } from '@/types/finance';

/**
 * Serializes transactions array to formatted JSON and triggers a browser file download.
 *
 * @param transactions - List of transactions to back up
 * @param filename - Target filename for download (default: 'satyfinance_backup.json')
 */
export function exportToJSON(transactions: Transaction[], filename = 'satyfinance_backup.json'): void {
  const dataStr = JSON.stringify(transactions, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts transactions into standard RFC-4180 CSV format and initiates a browser download.
 * Quotes all text values and escapes inner quotes to prevent CSV injection or breaking.
 *
 * @param transactions - List of transactions to export
 * @param filename - Target filename for download (default: 'satyfinance_expenses.csv')
 */
export function exportToCSV(transactions: Transaction[], filename = 'satyfinance_expenses.csv'): void {
  const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Notes'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.amount,
    `"${t.category}"`,
    `"${t.date}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates, cleans, and parses JSON content from an uploaded backup file.
 * Handles both plain arrays of transactions and nested backup structures.
 *
 * @param jsonString - Raw string read from uploaded JSON file
 * @returns Object indicating success flag, sanitized data array, or descriptive error message
 */
export function parseImportedJSON(jsonString: string): { success: boolean; data?: Transaction[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    let rawList: unknown[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { transactions?: unknown[] }).transactions)) {
      rawList = (parsed as { transactions: unknown[] }).transactions;
    } else {
      return { success: false, error: 'Uploaded file is not a valid transaction list (must be an array or backup object).' };
    }

    // Validate and sanitize each entry
    const validTransactions: Transaction[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object' && 'title' in item && 'amount' in item) {
        const txObj = item as Record<string, unknown>;
        const amountNum = typeof txObj.amount === 'number' ? txObj.amount : parseFloat(String(txObj.amount));
        if (typeof txObj.title === 'string' && !isNaN(amountNum)) {
          validTransactions.push({
            id: typeof txObj.id === 'string' ? txObj.id : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: txObj.title.trim(),
            amount: Math.abs(amountNum),
            category: (typeof txObj.category === 'string' ? txObj.category : 'other') as Transaction['category'],
            date: typeof txObj.date === 'string' ? txObj.date : new Date().toISOString().split('T')[0],
            notes: typeof txObj.notes === 'string' ? txObj.notes : '',
            createdAt: typeof txObj.createdAt === 'number' ? txObj.createdAt : Date.now(),
          });
        }
      }
    }

    if (validTransactions.length === 0) {
      return { success: false, error: 'No valid transaction records found in this file.' };
    }

    return { success: true, data: validTransactions };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid JSON file content.',
    };
  }
}

