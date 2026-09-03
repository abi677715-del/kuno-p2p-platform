// Single source of truth for which origins may talk to the API (REST + the
// Socket.io gateways). Keeping this in one place avoids the two gateways
// silently drifting from main.ts and re-opening CORS to '*'.
export function getAllowedOrigins(): string[] {
  return [process.env.FRONTEND_URL, 'https://supportive-growth-production-b6d0.up.railway.app'].filter(
    Boolean,
  ) as string[];
}
