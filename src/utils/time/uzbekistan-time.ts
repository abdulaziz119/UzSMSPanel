/**
 * Uzbekistan timezone utility functions
 * Uzbekistan is UTC+5 (no DST)
 */

/**
 * Get current time in Uzbekistan timezone
 * @returns Date object representing current time in Uzbekistan
 */
export function getUzbekistanTime(): Date {
  // Return current time normalized to Uzbekistan (UTC+5) without double shifting
  return convertToUzbekistan(new Date());
}

/**
 * Convert any Date to Uzbekistan local time representation (UTC+5) without double shifting
 * If the runtime is already in UTC+5 (getTimezoneOffset === -300) we return the date as-is.
 * Otherwise we shift from its real UTC value to UTC+5.
 */
export function convertToUzbekistan(date: Date): Date {
  const targetOffsetMinutes = -300; // UTC+5
  const currentOffsetMinutes = date.getTimezoneOffset();
  if (currentOffsetMinutes === targetOffsetMinutes) {
    return date;
  }
  const utc = date.getTime() + currentOffsetMinutes * 60000; // normalize to UTC ms
  return new Date(utc - targetOffsetMinutes * 60000); // apply target offset
}
