/**
 * Date of birth helpers.
 *
 * The browser sends and receives `YYYY-MM-DD` so a birthday never shifts a day
 * because of a timezone difference between the student and the server.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Formats a `YYYY-MM-DD` string as `MM/DD/YYYY` for display. */
export function formatDateOfBirth(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!ISO_DATE.test(raw)) return '';

  const [year, month, day] = raw.split('-');
  return `${month}/${day}/${year}`;
}

/** Whole years old on a given day, or null when the date cannot be used. */
function ageFromDateOfBirth(
  value: string | null | undefined,
  on: Date = new Date()
): number | null {
  const raw = (value ?? '').trim();
  if (!ISO_DATE.test(raw)) return null;

  const [year, month, day] = raw.split('-').map(Number);

  // Build in UTC so the browser's timezone cannot shift the result.
  const born = new Date(Date.UTC(year, month - 1, day));
  if (
    born.getUTCFullYear() !== year ||
    born.getUTCMonth() !== month - 1 ||
    born.getUTCDate() !== day
  ) {
    return null;
  }

  const today = Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), on.getUTCDate());
  if (born.getTime() > today) return null;

  let age = on.getUTCFullYear() - year;
  const hadBirthday =
    on.getUTCMonth() > month - 1 ||
    (on.getUTCMonth() === month - 1 && on.getUTCDate() >= day);

  if (!hadBirthday) age -= 1;

  return age >= 1 && age <= 120 ? age : null;
}

/**
 * True when the value is a real, past, plausible birth date.
 *
 * Used to give the same feedback the server would give, before submitting.
 */
export function isValidDateOfBirth(value: string | null | undefined): boolean {
  return ageFromDateOfBirth(value) !== null;
}

/** Latest date a student may pick: today. */
export function todayAsDateInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}