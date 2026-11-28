import {
  AmortizedItem,
  CurrencyCode,
  ImportedBackupData,
  SatyfinanceBackup,
  Transaction,
} from '@/types/finance';
import { isValidCurrencyCode } from '@/constants/categories';
import { getTodayDateString } from '@/utils/formatters';
import {
  sanitizeAmortizedItems,
  sanitizeMonthlyBudgets,
  sanitizeTransactionRecord,
  sanitizeTransactions,
} from '@/utils/storage';

export interface BackupExportInput {
  transactions: Transaction[];
  amortizedItems?: AmortizedItem[];
  monthlyBudgets?: Record<string, number>;
  currency?: CurrencyCode;
}

export interface ImportParseResult {
  success: boolean;
  data?: Transaction[];
  backup?: ImportedBackupData;
  error?: string;
  warning?: string;
}

/**
 * Triggers an immediate browser download for a Blob payload.
 *
 * @param blob - The file content blob
 * @param filename - Target filename for download
 */
function triggerFileDownload(blob: Blob, filename: string): void {
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
 * Builds a complete, versioned JSON backup object containing transactions,
 * amortized items, monthly budgets, and active currency preference.
 */
export function createBackupPayload(input: BackupExportInput): SatyfinanceBackup {
  return {
    version: 2,
    app: 'satyfinance',
    exportedAt: new Date().toISOString(),
    transactions: input.transactions,
    amortizedItems: input.amortizedItems ?? [],
    monthlyBudgets: input.monthlyBudgets ?? {},
    currency: isValidCurrencyCode(input.currency) ? input.currency : 'INR',
  };
}

/**
 * Serializes full workspace data (or a legacy Transaction array) to formatted JSON
 * and triggers a browser file download.
 *
 * @param data - Full backup input or Transaction array
 * @param filename - Target filename for download (default: 'satyfinance_backup.json')
 */
export function exportToJSON(
  data: Transaction[] | BackupExportInput,
  filename = 'satyfinance_backup.json'
): void {
  const payload = Array.isArray(data)
    ? createBackupPayload({ transactions: data })
    : createBackupPayload(data);

  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  triggerFileDownload(blob, filename);
}

/**
 * Converts transactions into standard RFC-4180 CSV format and initiates a browser download.
 * Quotes all text values and escapes inner quotes to prevent CSV breakage.
 *
 * @param transactions - List of transactions to export
 * @param filename - Target filename for download (default: 'satyfinance_expenses.csv')
 */
export function exportToCSV(
  transactions: Transaction[],
  filename = 'satyfinance_expenses.csv'
): void {
  const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Notes'];
  const rows = transactions.map((t) => [
    `"${(t.id || '').replace(/"/g, '""')}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.amount,
    `"${(t.category || 'other').replace(/"/g, '""')}"`,
    `"${(t.date || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, filename);
}

/**
 * Validates, cleans, and parses JSON content from an uploaded backup file.
 * Supports:
 * - v2 complete Satyfinance backups (transactions, amortizedItems, monthlyBudgets, currency)
 * - v1 legacy nested objects ({ transactions: [...] })
 * - v1 legacy plain Transaction[] arrays
 */
export function parseImportedJSON(jsonString: string): ImportParseResult {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return { success: false, error: 'Uploaded JSON file is empty.' };
  }

  try {
    const parsed: unknown = JSON.parse(jsonString);
    const todayDateStr = getTodayDateString();

    // Case 1: Legacy plain Transaction[] array
    if (Array.isArray(parsed)) {
      const txRes = sanitizeTransactions(parsed, { allowMissingDateFallback: todayDateStr });
      if (txRes.items.length === 0) {
        return {
          success: false,
          error: 'No valid transaction records found in this file.',
        };
      }
      return {
        success: true,
        data: txRes.items,
        backup: {
          transactions: txRes.items,
          format: 'v1-array',
          skippedCount: txRes.skippedCount,
        },
        ...(txRes.skippedCount > 0
          ? { warning: `Skipped ${txRes.skippedCount} invalid or incomplete entries.` }
          : {}),
      };
    }

    // Must be a non-null plain object from here on
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'Uploaded file is not a valid Satyfinance backup.',
      };
    }

    const obj = parsed as Record<string, unknown>;

    // Check incompatible future version
    if (typeof obj.version === 'number' && obj.version > 2) {
      return {
        success: false,
        error: `Unsupported backup version (v${obj.version}). Please update Satyfinance.`,
      };
    }

    if (obj.app !== undefined && obj.app !== 'satyfinance') {
      return {
        success: false,
        error: `Incompatible backup source "${String(obj.app)}".`,
      };
    }

    const hasV2Markers =
      obj.version === 2 ||
      obj.app === 'satyfinance' ||
      'amortizedItems' in obj ||
      'monthlyBudgets' in obj ||
      'currency' in obj;

    if (!hasV2Markers && !Array.isArray(obj.transactions)) {
      return {
        success: false,
        error:
          'Uploaded file is not a valid transaction list or Satyfinance backup.',
      };
    }

    // Validate transactions field if present
    if (obj.transactions !== undefined && !Array.isArray(obj.transactions)) {
      return {
        success: false,
        error: 'Backup field "transactions" is malformed (expected an array).',
      };
    }

    // Validate amortizedItems field if present
    if (obj.amortizedItems !== undefined && !Array.isArray(obj.amortizedItems)) {
      return {
        success: false,
        error: 'Backup field "amortizedItems" is malformed (expected an array).',
      };
    }

    // Validate monthlyBudgets field if present
    if (
      obj.monthlyBudgets !== undefined &&
      (obj.monthlyBudgets === null ||
        typeof obj.monthlyBudgets !== 'object' ||
        Array.isArray(obj.monthlyBudgets))
    ) {
      return {
        success: false,
        error: 'Backup field "monthlyBudgets" is malformed (expected an object).',
      };
    }

    let totalSkipped = 0;

    const txRes = Array.isArray(obj.transactions)
      ? sanitizeTransactions(obj.transactions, { allowMissingDateFallback: todayDateStr })
      : { items: [], skippedCount: 0 };
    totalSkipped += txRes.skippedCount;

    // Case 2: v1 object backup ({ transactions: [...] } without v2 fields)
    if (!hasV2Markers) {
      if (txRes.items.length === 0) {
        return {
          success: false,
          error: 'No valid transaction records found in this file.',
        };
      }
      return {
        success: true,
        data: txRes.items,
        backup: {
          transactions: txRes.items,
          format: 'v1-object',
          skippedCount: totalSkipped,
        },
        ...(totalSkipped > 0
          ? { warning: `Skipped ${totalSkipped} invalid or incomplete entries.` }
          : {}),
      };
    }

    // Case 3: v2 full backup
    let amortizedItems: AmortizedItem[] | undefined;
    if (Array.isArray(obj.amortizedItems)) {
      const amortRes = sanitizeAmortizedItems(obj.amortizedItems, todayDateStr);
      totalSkipped += amortRes.skippedCount;
      amortizedItems = amortRes.items;
    }

    let monthlyBudgets: Record<string, number> | undefined;
    if (obj.monthlyBudgets !== undefined) {
      const budgetRes = sanitizeMonthlyBudgets(obj.monthlyBudgets);
      totalSkipped += budgetRes.skippedCount;
      monthlyBudgets = budgetRes.budgets;
    }

    let currency: CurrencyCode | undefined;
    if (obj.currency !== undefined) {
      if (isValidCurrencyCode(obj.currency)) {
        currency = obj.currency;
      } else {
        totalSkipped++;
      }
    }

    const hasAnyRecords =
      txRes.items.length > 0 ||
      (amortizedItems !== undefined && amortizedItems.length > 0) ||
      (monthlyBudgets !== undefined && Object.keys(monthlyBudgets).length > 0);

    if (!hasAnyRecords && obj.app !== 'satyfinance') {
      return {
        success: false,
        error: 'No valid financial records found in this backup file.',
      };
    }

    return {
      success: true,
      data: txRes.items,
      backup: {
        transactions: txRes.items,
        ...(amortizedItems !== undefined ? { amortizedItems } : {}),
        ...(monthlyBudgets !== undefined ? { monthlyBudgets } : {}),
        ...(currency !== undefined ? { currency } : {}),
        format: 'v2-full',
        skippedCount: totalSkipped,
      },
      ...(totalSkipped > 0
        ? { warning: `Skipped ${totalSkipped} invalid or unrecognized entries during validation.` }
        : {}),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid JSON file content.',
    };
  }
}

/**
 * Parses an RFC-4180 CSV string into rows of string cells.
 * Returns null if an unclosed quote is detected.
 */
function parseRFC4180Rows(rawCsv: string): string[][] | null {
  const input = rawCsv.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      if (field.length === 0) {
        inQuotes = true;
      } else {
        field += ch;
      }
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (inQuotes) return null;

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/**
 * Parses and validates an exported CSV expenses file (RFC-4180).
 * Supports standard Satyfinance CSV headers: ID, Title, Amount, Category, Date, Notes.
 */
export function parseImportedCSV(csvString: string): ImportParseResult {
  if (typeof csvString !== 'string' || !csvString.trim()) {
    return { success: false, error: 'Uploaded CSV file is empty.' };
  }

  const rows = parseRFC4180Rows(csvString);
  if (!rows) {
    return { success: false, error: 'Malformed CSV: unclosed quoted field.' };
  }

  if (rows.length < 2) {
    return {
      success: false,
      error: 'CSV file must contain a header row and at least one transaction row.',
    };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = headers.findIndex(
    (h) => h === 'title' || h === 'description' || h === 'item' || h === 'name'
  );
  const amountIdx = headers.findIndex((h) => h === 'amount' || h === 'cost' || h === 'price');

  if (titleIdx === -1 || amountIdx === -1) {
    return {
      success: false,
      error: 'CSV header must include "Title" and "Amount" columns.',
    };
  }

  const idIdx = headers.indexOf('id');
  const categoryIdx = headers.indexOf('category');
  const dateIdx = headers.indexOf('date');
  const notesIdx = headers.indexOf('notes');
  const todayDateStr = getTodayDateString();

  const validTransactions: Transaction[] = [];
  let skippedCount = 0;

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const candidate = {
      id: idIdx !== -1 ? cols[idIdx] : undefined,
      title: cols[titleIdx],
      amount: cols[amountIdx],
      category: categoryIdx !== -1 ? cols[categoryIdx]?.trim().toLowerCase() : 'other',
      date: dateIdx !== -1 ? cols[dateIdx]?.trim() : undefined,
      notes: notesIdx !== -1 ? cols[notesIdx] : undefined,
    };

    const sanitized = sanitizeTransactionRecord(candidate, {
      allowMissingDateFallback: dateIdx === -1 ? todayDateStr : undefined,
    });

    if (sanitized) {
      validTransactions.push(sanitized);
    } else {
      skippedCount++;
    }
  }

  if (validTransactions.length === 0) {
    return {
      success: false,
      error: 'No valid transaction rows found in this CSV file.',
    };
  }

  return {
    success: true,
    data: validTransactions,
    backup: {
      transactions: validTransactions,
      format: 'csv',
      skippedCount,
    },
    ...(skippedCount > 0
      ? { warning: `Skipped ${skippedCount} invalid CSV rows during import.` }
      : {}),
  };
}
