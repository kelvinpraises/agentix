import { ChainType } from "@/types/orb";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  coingeckoId?: string;
}

export interface DexInfo {
  name: string;
  type: "AMM" | "orderbook" | "aggregator" | "perp";
  contractAddress?: string;
  supportedPairs: string[];
  website: string;
}

export interface BridgeInfo {
  name: string;
  type: "native" | "wrapped" | "third_party";
  contractAddress?: string;
  website: string;
  supportedChains: ChainType[];
}

export const HYPERLIQUID_TOKENS: Record<string, TokenInfo> = {
  HL: {
    symbol: "HL",
    name: "Hyperliquid",
    address: "0x0000000000000000000000000000000000000000", // Native token
    decimals: 18,
    coingeckoId: "hyperliquid",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xa0b86a33e6441ce476304e1c1c4a5f6f0e3ed2d0", // Bridged USDC
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", // Bridged ETH
    decimals: 18,
    coingeckoId: "ethereum",
  },
  BTC: {
    symbol: "BTC", 
    name: "Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // Wrapped BTC
    decimals: 8,
    coingeckoId: "bitcoin",
  },
};

export const HYPERLIQUID_DEXES: Record<string, DexInfo> = {
  "hyperliquid-perp": {
    name: "Hyperliquid Perpetuals",
    type: "perp",
    contractAddress: "0xperp...", // Native perpetuals
    supportedPairs: [
      "BTC/USDC", "ETH/USDC", "HL/USDC",
      "SOL/USDC", "AVAX/USDC", "ATOM/USDC",
      "ARB/USDC", "OP/USDC", "SUI/USDC"
    ],
    website: "https://hyperliquid.xyz",
  },
  "hyperliquid-spot": {
    name: "Hyperliquid Spot",
    type: "orderbook",
    contractAddress: "0xspot...", // Native spot trading
    supportedPairs: [
      "HL/USDC", "ETH/USDC", "BTC/USDC",
      "ETH/HL", "BTC/HL"
    ],
    website: "https://hyperliquid.xyz",
  },
};

export const HYPERLIQUID_BRIDGES: Record<string, BridgeInfo> = {
  "hyperliquid-bridge": {
    name: "Hyperliquid Native Bridge",
    type: "native",
    contractAddress: "0xbridge...",
    website: "https://hyperliquid.xyz/bridge",
    supportedChains: ["ethereum"],
  },
};

export const HYPERLIQUID_CONFIG = {
  chainId: 998, // Hyperliquid L1 chain ID
  name: "Hyperliquid",
  nativeToken: "HL",
  blockTime: 1.0, // seconds
  tokens: HYPERLIQUID_TOKENS,
  dexes: HYPERLIQUID_DEXES,
  bridges: HYPERLIQUID_BRIDGES,
  defaultDex: "hyperliquid-perp",
  defaultSlippage: 0.1, // 0.1% (tight spreads on orderbook)
  gasStrategy: {
    slow: 1.0,
    standard: 1.0, // Fixed gas costs
    fast: 1.0,
  },
  features: {
    perpetuals: true,
    leverage: {
      max: 50, // 50x leverage
      isolated: true,
      crossMargin: true,
    },
    orderTypes: ["market", "limit", "stop", "stop-limit", "twap"],
  },
};