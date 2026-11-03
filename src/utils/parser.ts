import { CategoryId } from '@/types/finance';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';

/**
 * Result structure returned by natural language expense parser.
 */
export interface ParsedExpense {
  /** Cleaned, title-cased item description */
  title: string;
  /** Numerical amount extracted from the input */
  amount: number;
  /** Best matching category */
  category: CategoryId;
  /** Original user input string */
  rawInput: string;
  /** Whether parsing successfully found a valid amount (> 0) */
  isValid: boolean;
}

/**
 * Common phrase and shortcut aliases mapped directly to CategoryIds.
 * Multi-word phrases are listed first so they are checked before single words.
 */
const CATEGORY_ALIASES: Array<{ phrase: string; category: CategoryId }> = [
  // Multi-word phrases
  { phrase: 'personal care', category: 'personal_care' },
  { phrase: 'food dining', category: 'food_dining' },
  { phrase: 'food and dining', category: 'food_dining' },
  // Single-word shortcuts
  { phrase: 'grocery', category: 'groceries' },
  { phrase: 'groceries', category: 'groceries' },
  { phrase: 'food', category: 'food_dining' },
  { phrase: 'dining', category: 'food_dining' },
  { phrase: 'dinner', category: 'food_dining' },
  { phrase: 'lunch', category: 'food_dining' },
  { phrase: 'bill', category: 'bills' },
  { phrase: 'bills', category: 'bills' },
  { phrase: 'utility', category: 'bills' },
  { phrase: 'utilities', category: 'bills' },
  { phrase: 'electronics', category: 'electronics' },
  { phrase: 'electronic', category: 'electronics' },
  { phrase: 'gadget', category: 'electronics' },
  { phrase: 'personalcare', category: 'personal_care' },
  { phrase: 'personal', category: 'personal_care' },
  { phrase: 'care', category: 'personal_care' },
  { phrase: 'household', category: 'household' },
  { phrase: 'home', category: 'household' },
  { phrase: 'house', category: 'household' },
  { phrase: 'other', category: 'other' },
  { phrase: 'misc', category: 'other' },
];

/**
 * Intelligent natural language parser for quick expense inputs.
 *
 * Examples:
 * - "Coffee 150 Groceries" -> title: "Coffee", amount: 150, category: "groceries"
 * - "Uber 350 Food" -> title: "Uber", amount: 350, category: "food_dining"
 * - "Electricity bill ₹1850" -> title: "Electricity Bill", amount: 1850, category: "bills"
 * - "2500 new headphones electronics" -> title: "New Headphones", amount: 2500, category: "electronics"
 *
 * @param input - Raw natural language expense string from user input
 * @returns ParsedExpense object containing title, amount, category, and validation state
 */
export function parseNaturalLanguageExpense(input: string): ParsedExpense {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      title: '',
      amount: 0,
      category: 'other',
      rawInput: input,
      isValid: false,
    };
  }

  // =========================================================================
  // STEP 1: Extract Amount
  // =========================================================================

  // 1a. Try to match explicit currency-tagged amount first (e.g. ₹1850, $45.50, 150rs)
  const explicitCurrencyRegex = /(?:(?:₹|\$|€|£|rs\.?|inr|usd)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)|([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|usd|bucks))/i;
  const explicitMatch = trimmed.match(explicitCurrencyRegex);

  let amount = 0;
  let textWithoutAmount = trimmed;

  if (explicitMatch) {
    const matchedToken = explicitMatch[0];
    const numStr = (explicitMatch[1] || explicitMatch[2] || '').replace(/,/g, '');
    const parsed = parseFloat(numStr);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      textWithoutAmount = trimmed.replace(matchedToken, ' ').trim();
    }
  }

  // 1b. If no explicit currency match, scan for candidate numbers
  if (amount === 0) {
    const allNumbersRegex = /\b([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\b/g;
    const matches = Array.from(trimmed.matchAll(allNumbersRegex));

    if (matches.length > 0) {
      let chosenMatch = matches[matches.length - 1]; // default to last number

      // If there are multiple numbers (e.g. "Dinner with 2 friends 1500"), choose the intended price (highest value)
      if (matches.length > 1) {
        let maxVal = -1;
        let maxMatch = matches[0];
        for (const m of matches) {
          const val = parseFloat(m[1].replace(/,/g, ''));
          if (val > maxVal) {
            maxVal = val;
            maxMatch = m;
          }
        }
        chosenMatch = maxMatch;
      }

      const cleanNumberStr = chosenMatch[1].replace(/,/g, '');
      const parsedNum = parseFloat(cleanNumberStr);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        amount = parsedNum;
        const matchIndex = chosenMatch.index ?? -1;
        if (matchIndex >= 0) {
          textWithoutAmount = (
            trimmed.slice(0, matchIndex) +
            ' ' +
            trimmed.slice(matchIndex + chosenMatch[0].length)
          ).trim();
        } else {
          textWithoutAmount = trimmed.replace(chosenMatch[0], ' ').trim();
        }
      }
    }
  }

  // =========================================================================
  // STEP 2: Identify Category
  // =========================================================================
  const lowerText = textWithoutAmount.toLowerCase();
  let detectedCategory: CategoryId = 'other';
  let categoryTokenToRemove = '';

  // Check alias list (multi-word phrases checked first, then single words)
  for (const { phrase, category } of CATEGORY_ALIASES) {
    const phraseRegex = new RegExp(`\\b${phrase}\\b`, 'i');
    if (phraseRegex.test(lowerText)) {
      detectedCategory = category;
      categoryTokenToRemove = phrase;
      break;
    }
  }

  // If not found via alias, check keyword mappings in CATEGORIES
  if (detectedCategory === 'other' && !categoryTokenToRemove) {
    for (const cat of CATEGORY_LIST) {
      for (const kw of cat.keywords) {
        const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
        if (kwRegex.test(lowerText)) {
          detectedCategory = cat.id;
          break;
        }
      }
      if (detectedCategory !== 'other') break;
    }
  }

  // =========================================================================
  // STEP 3: Clean and Format Title
  // =========================================================================
  let cleanedTitle = textWithoutAmount;
  if (categoryTokenToRemove) {
    const removeRegex = new RegExp(`\\b${categoryTokenToRemove}\\b`, 'gi');
    cleanedTitle = cleanedTitle.replace(removeRegex, ' ');
  }

  // Clean extra spaces and punctuation while preserving word characters and hyphens
  cleanedTitle = cleanedTitle
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();


  // If cleanedTitle is empty, fallback to category label or "Expense"
  if (!cleanedTitle) {
    cleanedTitle = detectedCategory !== 'other' ? `${CATEGORIES[detectedCategory].label} Expense` : 'Expense';
  } else {
    // Capitalize first letter of each word
    cleanedTitle = cleanedTitle
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const isValid = amount > 0;

  return {
    title: cleanedTitle,
    amount,
    category: detectedCategory,
    rawInput: input,
    isValid,
  };
}

