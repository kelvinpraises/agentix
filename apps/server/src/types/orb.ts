export const CHAINS = ["ethereum", "solana", "morph", "stellar"] as const;
export type ChainType = (typeof CHAINS)[number];

export interface AssetPairs {
  [pair: string]: number; // pair -> weight percentage
}

export interface OrbConfig {
  default_slippage?: number;
  gas_strategy?: "slow" | "standard" | "fast";
  auto_compound?: boolean;
  max_position_size?: number;
}

export type ThreadType = "dex" | "bridge" | "lending" | "yield_farming";

export interface ThreadConfig {
  // DEX specific
  slippage_tolerance?: number;
  fee_tier?: number;
  route_optimization?: boolean;
  priority_fee?: number;

  // Bridge specific
  timeout?: number;
  auto_retry?: boolean;

  // Lending specific
  max_ltv?: number;
  auto_compound?: boolean;

  // Common
  gas_strategy?: "slow" | "standard" | "fast";
}
