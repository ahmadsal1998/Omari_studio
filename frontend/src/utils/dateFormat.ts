import { format } from 'date-fns';

/**
 * Formats a date for display in Gregorian calendar.
 * Uses DD/MM/YYYY format consistently across all UI screens.
 * Do not use Hijri or other calendar formats.
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy');
}
