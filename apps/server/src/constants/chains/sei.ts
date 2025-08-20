import { ChainType } from "@/types/orb";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // Sei address format
  decimals: number;
  coingeckoId?: string;
}

export interface DexInfo {
  name: string;
  type: "AMM" | "orderbook" | "aggregator";
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

export const SEI_TOKENS: Record<string, TokenInfo> = {
  SEI: {
    symbol: "SEI",
    name: "Sei",
    address: "sei", // Native token
    decimals: 6,
    coingeckoId: "sei-network",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "sei1hrndqntlvtmx2kepr0zsfgr7nzjptcc72cr4ppk", // Example Sei address
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "sei1l2d3hlxgn0aevprnrrz0dgz3l8gw59g0xgczl2", // Example Sei address
    decimals: 6,
    coingeckoId: "tether",
  },
  ATOM: {
    symbol: "ATOM",
    name: "Cosmos Hub",
    address: "sei1xp3khd0qejr2p9r3kdrx9z82lhzpk8vf2fkxmz", // IBC token
    decimals: 6,
    coingeckoId: "cosmos",
  },
};

export const SEI_DEXES: Record<string, DexInfo> = {
  "sei-orderbook": {
    name: "Sei Native Orderbook",
    type: "orderbook",
    contractAddress: "sei1orderbook...", // Native module
    supportedPairs: [
      "SEI/USDC", "SEI/USDT", "SEI/ATOM",
      "USDC/USDT", "ATOM/USDC", "ATOM/SEI"
    ],
    website: "https://sei.io",
  },
  "dragonswap": {
    name: "DragonSwap",
    type: "AMM",
    contractAddress: "sei1dragonswap...", // CosmWasm contract
    supportedPairs: [
      "SEI/USDC", "SEI/USDT", "SEI/ATOM",
      "USDC/USDT"
    ],
    website: "https://dragonswap.app",
  },
  "astroport": {
    name: "Astroport",
    type: "AMM",
    contractAddress: "sei1astroport...", // CosmWasm contract
    supportedPairs: [
      "SEI/USDC", "SEI/USDT", 
      "USDC/USDT", "ATOM/SEI"
    ],
    website: "https://astroport.fi",
  },
};

export const SEI_BRIDGES: Record<string, BridgeInfo> = {
  wormhole: {
    name: "Wormhole",
    type: "third_party",
    contractAddress: "sei1wormhole...",
    website: "https://wormhole.com",
    supportedChains: ["ethereum", "solana"],
  },
  "ibc-bridge": {
    name: "IBC Bridge",
    type: "native",
    website: "https://cosmos.network/ibc",
    supportedChains: ["ethereum"], // Via Gravity Bridge
  },
};

export const SEI_CONFIG = {
  chainId: "pacific-1", // Mainnet chain ID
  name: "Sei",
  nativeToken: "SEI",
  blockTime: 0.6, // seconds (very fast)
  tokens: SEI_TOKENS,
  dexes: SEI_DEXES,
  bridges: SEI_BRIDGES,
  defaultDex: "sei-orderbook",
  defaultSlippage: 0.3, // 0.3% (orderbook has tight spreads)
  gasStrategy: {
    slow: 1.0,
    standard: 1.2,
    fast: 1.5,
  },
};