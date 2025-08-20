import { ChainType } from "@/types/orb";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // Principal ID on ICP
  decimals: number;
  coingeckoId?: string;
}

export interface DexInfo {
  name: string;
  type: "AMM" | "orderbook" | "aggregator";
  canisterId?: string;
  supportedPairs: string[];
  website: string;
}

export interface BridgeInfo {
  name: string;
  type: "native" | "wrapped" | "third_party";
  canisterId?: string;
  website: string;
  supportedChains: ChainType[];
}

export const ICP_TOKENS: Record<string, TokenInfo> = {
  ICP: {
    symbol: "ICP",
    name: "Internet Computer",
    address: "rrkah-fqaaa-aaaaa-aaaaq-cai", // Native token
    decimals: 8,
    coingeckoId: "internet-computer",
  },
  ckBTC: {
    symbol: "ckBTC",
    name: "Chain Key Bitcoin",
    address: "mxzaz-hqaaa-aaaar-qaada-cai",
    decimals: 8,
    coingeckoId: "bitcoin",
  },
  ckETH: {
    symbol: "ckETH",
    name: "Chain Key Ethereum",
    address: "ss2fx-dyaaa-aaaar-qacoq-cai",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  CHAT: {
    symbol: "CHAT",
    name: "OpenChat",
    address: "2ouva-viaaa-aaaaq-aaamq-cai",
    decimals: 8,
    coingeckoId: "openchat",
  },
  SONIC: {
    symbol: "SONIC",
    name: "Sonic",
    address: "qbizb-wiaaa-aaaaq-aabwq-cai",
    decimals: 8,
    coingeckoId: "sonic",
  },
};

export const ICP_DEXES: Record<string, DexInfo> = {
  sonic: {
    name: "Sonic",
    type: "AMM",
    canisterId: "3xwpq-ziaaa-aaaah-qcn4a-cai",
    supportedPairs: [
      "ICP/ckBTC", "ICP/ckETH", "ICP/CHAT", "ICP/SONIC",
      "ckBTC/ckETH", "ckBTC/ICP", "ckBTC/SONIC",
      "ckETH/ICP", "ckETH/ckBTC", "ckETH/SONIC",
      "SONIC/ICP", "SONIC/ckBTC", "SONIC/ckETH",
      "CHAT/ICP"
    ],
    website: "https://app.sonic.ooo",
  },
  icpswap: {
    name: "ICPSwap",
    type: "AMM",
    canisterId: "ca6gz-lqaaa-aaaaq-aacwa-cai",
    supportedPairs: [
      "ICP/ckBTC", "ICP/ckETH", "ICP/CHAT",
      "ckBTC/ckETH", "ckBTC/ICP",
      "ckETH/ICP", "ckETH/ckBTC"
    ],
    website: "https://icpswap.com",
  },
  icdex: {
    name: "ICDex",
    type: "orderbook",
    canisterId: "j4d4d-pqaaa-aaaaq-aabzq-cai",
    supportedPairs: [
      "ICP/ckBTC", "ICP/ckETH",
      "ckBTC/ICP", "ckETH/ICP"
    ],
    website: "https://icdex.io",
  },
};

export const ICP_BRIDGES: Record<string, BridgeInfo> = {
  "chain-key-bitcoin": {
    name: "Chain-Key Bitcoin",
    type: "native",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
    website: "https://internetcomputer.org/bitcoin-integration",
    supportedChains: [], // Direct Bitcoin integration
  },
  "chain-key-ethereum": {
    name: "Chain-Key Ethereum",
    type: "native",
    canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai",
    website: "https://internetcomputer.org/ethereum-integration", 
    supportedChains: ["ethereum"],
  },
};

export const ICP_CONFIG = {
  chainId: "icp", // Internet Computer Network
  name: "Internet Computer",
  nativeToken: "ICP",
  blockTime: 2.0, // seconds (finality time)
  tokens: ICP_TOKENS,
  dexes: ICP_DEXES,
  bridges: ICP_BRIDGES,
  defaultDex: "sonic",
  defaultSlippage: 0.5, // 0.5%
  gasStrategy: {
    slow: 1.0,
    standard: 1.0, // ICP has predictable costs
    fast: 1.0,
  },
  features: {
    chainKeyBitcoin: true,
    chainKeyEthereum: true,
    httpsOutcalls: true,
    canisterSmart: true,
  },
};