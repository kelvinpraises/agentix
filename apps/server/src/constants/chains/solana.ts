import { ChainType } from "@/types/orb";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // Mint address on Solana
  decimals: number;
  coingeckoId?: string;
}

export interface DexInfo {
  name: string;
  type: "AMM" | "orderbook" | "aggregator";
  programId?: string;
  supportedPairs: string[];
  website: string;
}

export interface BridgeInfo {
  name: string;
  type: "native" | "wrapped" | "third_party";
  programId?: string;
  website: string;
  supportedChains: ChainType[];
}

export const SOLANA_TOKENS: Record<string, TokenInfo> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    address: "11111111111111111111111111111111", // Native token
    decimals: 9,
    coingeckoId: "solana",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    coingeckoId: "tether",
  },
  RAY: {
    symbol: "RAY",
    name: "Raydium",
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    coingeckoId: "raydium",
  },
  SRM: {
    symbol: "SRM",
    name: "Serum",
    address: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
    decimals: 6,
    coingeckoId: "serum",
  },
};

export const SOLANA_DEXES: Record<string, DexInfo> = {
  jupiter: {
    name: "Jupiter",
    type: "aggregator",
    programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    supportedPairs: [
      "SOL/USDC", "SOL/USDT", "SOL/RAY", "SOL/SRM",
      "USDC/USDT", "USDC/RAY", "USDC/SRM",
      "RAY/SOL", "RAY/USDC", "RAY/USDT",
      "SRM/SOL", "SRM/USDC", "SRM/USDT"
    ],
    website: "https://jup.ag",
  },
  raydium: {
    name: "Raydium",
    type: "AMM",
    programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    supportedPairs: [
      "SOL/USDC", "SOL/USDT", "SOL/RAY",
      "USDC/USDT", "USDC/RAY",
      "RAY/SOL", "RAY/USDC"
    ],
    website: "https://raydium.io",
  },
  orca: {
    name: "Orca",
    type: "AMM",
    programId: "9W959DqEETiGZocYWCQPaJ6sKfdQh5QZf3jczk3oVnTD",
    supportedPairs: [
      "SOL/USDC", "SOL/USDT", "SOL/RAY",
      "USDC/USDT", "USDC/RAY"
    ],
    website: "https://orca.so",
  },
  serum: {
    name: "Serum",
    type: "orderbook",
    programId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    supportedPairs: [
      "SOL/USDC", "SOL/USDT", "SOL/SRM",
      "SRM/USDC", "SRM/USDT"
    ],
    website: "https://serum.academy",
  },
};

export const SOLANA_BRIDGES: Record<string, BridgeInfo> = {
  wormhole: {
    name: "Wormhole",
    type: "third_party",
    programId: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
    website: "https://wormhole.com",
    supportedChains: ["ethereum", "sei"],
  },
  "all-bridge": {
    name: "AllBridge",
    type: "third_party",
    programId: "BB2Xp8r2tCi4FAy9tk8k7kMMJ2PVxc38KRGpM6BkVVP4",
    website: "https://allbridge.io",
    supportedChains: ["ethereum"],
  },
};

export const SOLANA_CONFIG = {
  chainId: 101, // Mainnet
  name: "Solana",
  nativeToken: "SOL",
  blockTime: 0.4, // seconds
  tokens: SOLANA_TOKENS,
  dexes: SOLANA_DEXES,
  bridges: SOLANA_BRIDGES,
  defaultDex: "jupiter",
  defaultSlippage: 1.0, // 1.0%
  gasStrategy: {
    slow: 1.0,
    standard: 1.0, // SOL has consistent fees
    fast: 1.0,
  },
};