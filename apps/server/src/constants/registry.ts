import { ChainType } from "@/types/orb";
import { ETHEREUM_CONFIG } from "./chains/ethereum";
import { SOLANA_CONFIG } from "./chains/solana";
import { SEI_CONFIG } from "./chains/sei";
import { HYPERLIQUID_CONFIG } from "./chains/hyperliquid";
import { ICP_CONFIG } from "./chains/icp";

// Export all chain configurations
export const CHAIN_CONFIGS = {
  ethereum: ETHEREUM_CONFIG,
  solana: SOLANA_CONFIG,
  sei: SEI_CONFIG,
  hyperliquid: HYPERLIQUID_CONFIG,
  icp: ICP_CONFIG,
} as const;

// Export individual chain configs for convenience
export { ETHEREUM_CONFIG, SOLANA_CONFIG, SEI_CONFIG, HYPERLIQUID_CONFIG, ICP_CONFIG };

// Export all tokens across chains
export const ALL_TOKENS = {
  ethereum: ETHEREUM_CONFIG.tokens,
  solana: SOLANA_CONFIG.tokens,
  sei: SEI_CONFIG.tokens,
  hyperliquid: HYPERLIQUID_CONFIG.tokens,
  icp: ICP_CONFIG.tokens,
};

// Export all DEXes across chains
export const ALL_DEXES = {
  ethereum: ETHEREUM_CONFIG.dexes,
  solana: SOLANA_CONFIG.dexes,
  sei: SEI_CONFIG.dexes,
  hyperliquid: HYPERLIQUID_CONFIG.dexes,
  icp: ICP_CONFIG.dexes,
};

// Export all bridges across chains
export const ALL_BRIDGES = {
  ethereum: ETHEREUM_CONFIG.bridges,
  solana: SOLANA_CONFIG.bridges,
  sei: SEI_CONFIG.bridges,
  hyperliquid: HYPERLIQUID_CONFIG.bridges,
  icp: ICP_CONFIG.bridges,
};

// Cross-chain asset mappings
export const ASSET_MAPPINGS = {
  USDC: ["ethereum", "solana", "sei", "hyperliquid"] as ChainType[],
  USDT: ["ethereum", "solana", "sei"] as ChainType[],
  ETH: ["ethereum", "hyperliquid"] as ChainType[],
  BTC: ["hyperliquid"] as ChainType[],
  ckBTC: ["icp"] as ChainType[],
  ckETH: ["icp"] as ChainType[],
} as const;

// Supported trading pairs across all chains
export const ALL_SUPPORTED_PAIRS = new Set([
  // Ethereum pairs
  ...ETHEREUM_CONFIG.dexes["uniswap-v3"].supportedPairs,
  // Solana pairs  
  ...SOLANA_CONFIG.dexes.jupiter.supportedPairs,
  // Sei pairs
  ...SEI_CONFIG.dexes["sei-orderbook"].supportedPairs,
  // Hyperliquid pairs
  ...HYPERLIQUID_CONFIG.dexes["hyperliquid-perp"].supportedPairs,
  // ICP pairs
  ...ICP_CONFIG.dexes.sonic.supportedPairs,
]);

// Chain feature matrix
export const CHAIN_FEATURES = {
  ethereum: {
    hasAMM: true,
    hasOrderbook: false,
    hasAggregator: true,
    hasPerpetuals: false,
    hasNativeBridge: false,
    gasToken: "ETH",
  },
  solana: {
    hasAMM: true,
    hasOrderbook: true,
    hasAggregator: true,
    hasPerpetuals: false,
    hasNativeBridge: false,
    gasToken: "SOL",
  },
  sei: {
    hasAMM: true,
    hasOrderbook: true,
    hasAggregator: false,
    hasPerpetuals: false,
    hasNativeBridge: true,
    gasToken: "SEI",
  },
  hyperliquid: {
    hasAMM: false,
    hasOrderbook: true,
    hasAggregator: false,
    hasPerpetuals: true,
    hasNativeBridge: true,
    gasToken: "HL",
  },
  icp: {
    hasAMM: true,
    hasOrderbook: true,
    hasAggregator: false,
    hasPerpetuals: false,
    hasNativeBridge: true,
    gasToken: "ICP",
  },
} as const;

// Utility functions for registry access
export const getChainConfig = (chain: ChainType) => {
  return CHAIN_CONFIGS[chain];
};

export const getSupportedChains = (): ChainType[] => {
  return Object.keys(CHAIN_CONFIGS) as ChainType[];
};

export const isValidChain = (chain: string): chain is ChainType => {
  return chain in CHAIN_CONFIGS;
};