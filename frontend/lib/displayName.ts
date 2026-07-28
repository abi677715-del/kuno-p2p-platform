export function displayName(user?: { fullName?: string | null }) {
  return user?.fullName?.trim() || 'Trader';
}
