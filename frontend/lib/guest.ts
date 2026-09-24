// Temporary (guest performer) accounts sign in with nickname + password.
// User.email is still required and unique, so they get a placeholder under
// the reserved .invalid TLD — nothing can ever be delivered there.
export const GUEST_EMAIL_DOMAIN = "guest.petraband.invalid";

export function guestEmail(): string {
  return `${crypto.randomUUID()}@${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestEmail(email: string | null | undefined): boolean {
  return !!email?.endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}
