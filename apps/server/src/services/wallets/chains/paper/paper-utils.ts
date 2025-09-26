import { ChainType } from "@/types/orb";

// Constants
export const PAPER_BURN_ADDRESS = "paper-burn-000";
export const PAPER_WALLET_PREFIX = "paper";

export function generatePaperWalletAddress(orbId: string, targetChain: ChainType): string {
  return `${PAPER_WALLET_PREFIX}-${orbId}-${targetChain}`;
}

export function extractOrbIdFromAddress(address: string): string | null {
  if (!address.startsWith(`${PAPER_WALLET_PREFIX}-`)) {
    return null;
  }

  const parts = address.split("-");
  if (parts.length >= 3) {
    return parts[1]; // Return orb ID part
  }

  return null;
}

export function isPaperWalletAddress(address: string): boolean {
  return address.startsWith(`${PAPER_WALLET_PREFIX}-`);
}

export function isBurnerAddress(address: string): boolean {
  return address === PAPER_BURN_ADDRESS;
}
