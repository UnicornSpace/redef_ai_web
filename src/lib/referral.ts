/**
 * A user's referral code, derived deterministically from their id rather
 * than stored — first 8 hex chars of the uuid, uppercased. Collisions are
 * cryptographically improbable, so this doubles as both "your code" and
 * the value looked up against `user_preferences.referred_by`.
 */
export function referralCodeForUserId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}
