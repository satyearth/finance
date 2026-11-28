import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageExpense } from '@/utils/parser';

describe('Natural Language Expense Parser', () => {
  it('parses standard quick entries with category aliases', () => {
    expect(parseNaturalLanguageExpense('Coffee 150 Groceries')).toMatchObject({
      title: 'Coffee',
      amount: 150,
      category: 'groceries',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('Uber 350 Food')).toMatchObject({
      title: 'Uber',
      amount: 350,
      category: 'food_dining',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('2500 new headphones electronics')).toMatchObject({
      title: 'New Headphones',
      amount: 2500,
      category: 'electronics',
      isValid: true,
    });
  });

  it('extracts explicit currency symbols and Indian/Western comma numbers', () => {
    expect(parseNaturalLanguageExpense('Electricity bill ₹1850')).toMatchObject({
      title: 'Electricity',
      amount: 1850,
      category: 'bills',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('MacBook Pro ₹1,25,000')).toMatchObject({
      title: 'Macbook Pro',
      amount: 125000,
      category: 'electronics',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('Cloud server $45.50')).toMatchObject({
      title: 'Cloud Server',
      amount: 45.5,
      category: 'bills',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('Train ticket 120 eur')).toMatchObject({
      title: 'Train Ticket',
      amount: 120,
      category: 'other',
      isValid: true,
    });
  });

  it('preserves meaningful item words like Dinner/Lunch while detecting category', () => {
    expect(parseNaturalLanguageExpense('Dinner with 2 friends 1500')).toMatchObject({
      title: 'Dinner With 2 Friends',
      amount: 1500,
      category: 'food_dining',
      isValid: true,
    });

    expect(parseNaturalLanguageExpense('Lunch 350')).toMatchObject({
      title: 'Lunch',
      amount: 350,
      category: 'food_dining',
      isValid: true,
    });
  });

  it('rejects empty or amount-less strings safely', () => {
    expect(parseNaturalLanguageExpense('')).toMatchObject({ isValid: false, amount: 0 });
    expect(parseNaturalLanguageExpense('   ')).toMatchObject({ isValid: false, amount: 0 });
    expect(parseNaturalLanguageExpense('Coffee at Starbucks')).toMatchObject({
      isValid: false,
      amount: 0,
    });
  });
});
