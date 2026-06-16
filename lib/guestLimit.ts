/**
 * Guest Generate Limit
 * Tracks how many times a non-logged-in user has generated.
 * Stored in localStorage with key: design_ai_guest_count
 * Limit: 2 generates (then user must login)
 *
 * Once the user logs in via the modal, a persistent flag is set
 * (design_ai_logged_in) so the limit is never checked again.
 */

const KEY = "design_ai_guest_count";
const LOGGED_IN_KEY = "design_ai_logged_in";
export const GUEST_LIMIT = 2;

export function getGuestCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) ?? "0", 10);
}

export function incrementGuestCount(): number {
  const next = getGuestCount() + 1;
  localStorage.setItem(KEY, String(next));
  return next;
}

/** Returns true if the user has completed the in-app login */
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGGED_IN_KEY) === "true";
}

/** Persist logged-in state so the guest limit is never triggered again */
export function setLoggedIn(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGGED_IN_KEY, "true");
}

/**
 * Returns true only when:
 * - the user is NOT logged in, AND
 * - the guest count has reached the limit
 */
export function hasGuestLimitReached(): boolean {
  if (isLoggedIn()) return false;
  return getGuestCount() >= GUEST_LIMIT;
}

export function resetGuestCount(): void {
  localStorage.removeItem(KEY);
}
