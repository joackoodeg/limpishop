/**
 * Date and time utility functions
 */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Normalize a date string to include time component
 * @param dateStr - Date string in any format
 * @param isEndOfDay - If true, sets time to 23:59:59, otherwise 00:00:00
 */
export function normalizeDateTime(dateStr: string, isEndOfDay = false): string {
  const trimmed = dateStr.trim();
  if (trimmed.includes('T')) {
    return trimmed.replace('T', ' ');
  }
  if (trimmed.includes(' ')) {
    return trimmed;
  }
  return isEndOfDay ? `${trimmed} 23:59:59` : `${trimmed} 00:00:00`;
}
