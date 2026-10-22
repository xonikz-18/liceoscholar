/**
 * Students sign in with their Liceo de Cagayan University address, so every
 * student email field is restricted to the school domain.
 *
 * The server enforces the same rule; checking it here just gives an instant,
 * friendly message instead of a round trip.
 */

export const SCHOOL_EMAIL_DOMAIN = '@liceo.edu.ph';

/** True when the value is an address on the school domain. */
export function isSchoolEmail(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN);
}

/** The message shown when an address is on the wrong domain. */
export const SCHOOL_EMAIL_MESSAGE = `Use your school email ending in ${SCHOOL_EMAIL_DOMAIN}.`;
