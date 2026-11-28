import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createBackupPayload,
  exportToCSV,
  exportToJSON,
  parseImportedCSV,
  parseImportedJSON,
} from '@/utils/exportImport';
import { AmortizedItem, Transaction } from '@/types/finance';

const sampleTxs: Transaction[] = [
  {
    id: 'tx-100',
    title: 'Coffee, Beans & "Filter"',
    amount: 650.5,
    category: 'food_dining',
    date: '2026-11-15',
    notes: 'Morning roast',
    createdAt: 1700000000000,
  },
  {
    id: 'tx-101',
    title: 'Broadband',
    amount: 1179,
    category: 'bills',
    date: '2026-11-18',
    createdAt: 1700000001000,
  },
];

const sampleAmort: AmortizedItem[] = [
  {
    id: 'amort-100',
    transactionId: 'tx-100',
    name: 'Coffee, Beans & "Filter"',
    totalCost: 650.5,
    startDate: '2026-11-15',
    endDate: '2027-01-15',
    durationMonths: 2,
    durationDays: 61,
    monthlyCost: 325.25,
    dailyCost: 10.66,
    category: 'food_dining',
    status: 'active',
    createdAt: 1700000000000,
  },
];

describe('JSON Backup & Restore', () => {
  it('builds and round-trips a complete v2 backup with transactions, budgets, amortized items, and currency', () => {
    const payload = createBackupPayload({
      transactions: sampleTxs,
      amortizedItems: sampleAmort,
      monthlyBudgets: { '2026-11': 50000, '2026-12': 45000 },
      currency: 'USD',
    });

    expect(payload.version).toBe(2);
    expect(payload.app).toBe('satyfinance');

    const res = parseImportedJSON(JSON.stringify(payload));
    expect(res.success).toBe(true);
    expect(res.backup?.format).toBe('v2-full');
    expect(res.backup?.transactions).toHaveLength(2);
    expect(res.backup?.amortizedItems).toHaveLength(1);
    expect(res.backup?.monthlyBudgets).toEqual({ '2026-11': 50000, '2026-12': 45000 });
    expect(res.backup?.currency).toBe('USD');
    expect(res.backup?.skippedCount).toBe(0);
  });

  it('preserves backward compatibility with legacy v1 array and { transactions } backups', () => {
    const arrayRes = parseImportedJSON(JSON.stringify(sampleTxs));
    expect(arrayRes.success).toBe(true);
    expect(arrayRes.backup?.format).toBe('v1-array');
    expect(arrayRes.data).toHaveLength(2);
    expect(arrayRes.backup?.amortizedItems).toBeUndefined();
    expect(arrayRes.backup?.monthlyBudgets).toBeUndefined();

    const objRes = parseImportedJSON(JSON.stringify({ transactions: sampleTxs }));
    expect(objRes.success).toBe(true);
    expect(objRes.backup?.format).toBe('v1-object');
    expect(objRes.data).toHaveLength(2);
  });

  it('validates and rejects malformed, incomplete, or incompatible JSON backups', () => {
    expect(parseImportedJSON('').success).toBe(false);
    expect(parseImportedJSON('{invalid json').success).toBe(false);
    expect(parseImportedJSON('"string"').success).toBe(false);
    expect(parseImportedJSON('[]').success).toBe(false);
    expect(parseImportedJSON('{"foo":"bar"}').success).toBe(false);
    expect(parseImportedJSON('{"version":99,"app":"satyfinance","transactions":[]}').success).toBe(false);
    expect(parseImportedJSON('{"version":2,"app":"other-app","transactions":[]}').success).toBe(false);
    expect(parseImportedJSON('{"version":2,"app":"satyfinance","transactions":"not-an-array"}').success).toBe(false);
  });

  it('skips invalid entries inside a backup while preserving valid entries and warning', () => {
    const mixed = {
      version: 2,
      app: 'satyfinance',
      transactions: [
        sampleTxs[0],
        { id: 'bad-1', title: '', amount: 100, date: '2026-11-01' },
        { id: 'bad-2', title: 'Bad date', amount: 100, date: '2026-02-30' },
        { id: 'bad-3', title: 'Negative', amount: -50, date: '2026-11-01' },
      ],
      monthlyBudgets: {
        '2026-11': 45000,
        'invalid-key': 1000,
        '2026-12': -500,
      },
      currency: 'XYZ',
    };

    const res = parseImportedJSON(JSON.stringify(mixed));
    expect(res.success).toBe(true);
    expect(res.backup?.transactions).toHaveLength(1);
    expect(res.backup?.monthlyBudgets).toEqual({ '2026-11': 45000 });
    expect(res.backup?.currency).toBeUndefined();
    expect(res.backup?.skippedCount).toBe(6);
    expect(res.warning).toBeDefined();
  });
});

describe('CSV Export & Import', () => {
  let lastDownloadPromise: Promise<string>;
  const origCreateObjectURL = URL.createObjectURL;
  const origRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    lastDownloadPromise = Promise.resolve('');
    URL.createObjectURL = vi.fn((blob: Blob) => {
      lastDownloadPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsText(blob);
      });
      return 'blob:mock-url';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('exports RFC-4180 CSV and round-trips through parseImportedCSV', async () => {
    exportToCSV(sampleTxs);
    const csvText = await lastDownloadPromise;

    expect(csvText).toContain('ID,Title,Amount,Category,Date,Notes');
    expect(csvText).toContain('"Coffee, Beans & ""Filter"""');

    const parsed = parseImportedCSV(`\uFEFF${csvText}`);
    expect(parsed.success).toBe(true);
    expect(parsed.backup?.format).toBe('csv');
    expect(parsed.backup?.transactions).toHaveLength(2);
    expect(parsed.backup?.transactions[0].title).toBe('Coffee, Beans & "Filter"');
    expect(parsed.backup?.transactions[0].amount).toBe(650.5);
    expect(parsed.backup?.transactions[1].category).toBe('bills');
  });

  it('exports full JSON backup via exportToJSON', async () => {
    exportToJSON({
      transactions: sampleTxs,
      amortizedItems: sampleAmort,
      monthlyBudgets: { '2026-11': 50000 },
      currency: 'EUR',
    });
    const jsonText = await lastDownloadPromise;

    const parsed = parseImportedJSON(jsonText);
    expect(parsed.success).toBe(true);
    expect(parsed.backup?.currency).toBe('EUR');
    expect(parsed.backup?.amortizedItems).toHaveLength(1);
    expect(parsed.backup?.monthlyBudgets).toEqual({ '2026-11': 50000 });
  });

  it('rejects malformed CSV, missing required headers, and unclosed quotes', () => {
    expect(parseImportedCSV('').success).toBe(false);
    expect(parseImportedCSV('ID,Title,Amount\r\n').success).toBe(false);
    expect(parseImportedCSV('Name,Cost\r\nCoffee,100').success).toBe(true); // Supports Description/Cost aliases
    expect(parseImportedCSV('Foo,Bar\r\n1,2').success).toBe(false);
    expect(parseImportedCSV('Title,Amount\r\n"Unclosed,100').success).toBe(false);
  });
});
