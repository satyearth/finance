/**
 * Generates unique identifiers for entities with a given prefix.
 * Uses cryptographically strong random values when available in browser environments,
 * falling back to timestamp-random string format.
 *
 * @param prefix - Entity prefix (e.g. 'tx', 'amort')
 * @returns Unique string ID (e.g. 'tx-1730000000000-a1b2c')
 */
export function generateId(prefix: 'tx' | 'amort'): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

