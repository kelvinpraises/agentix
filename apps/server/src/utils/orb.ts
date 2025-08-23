import { Orb } from "@/models/Orb";

// Sanitized orb type for API responses (removes sensitive wallet data)
export type SanitizedOrb = Omit<Orb, "privy_wallet_id">;

/**
 * Sanitizes orb data for API responses by removing sensitive wallet information
 * @param orb - The orb object to sanitize
 * @returns Sanitized orb without privy_wallet_id
 */
export function sanitizeOrbForResponse(orb: Orb): SanitizedOrb {
  const { privy_wallet_id, ...sanitizedOrb } = orb;
  return sanitizedOrb;
}

/**
 * Sanitizes an array of orbs for API responses
 * @param orbs - Array of orb objects to sanitize
 * @returns Array of sanitized orbs without privy_wallet_id
 */
export function sanitizeOrbsForResponse(orbs: Orb[]): SanitizedOrb[] {
  return orbs.map(sanitizeOrbForResponse);
}