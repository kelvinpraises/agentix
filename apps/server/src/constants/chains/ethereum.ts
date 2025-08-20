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
  type: "AMM" | "orderbook" | "aggregator";
  routerAddress?: string;
  factoryAddress?: string;
  supportedFeeTiers?: number[];
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

export const ETHEREUM_TOKENS: Record<string, TokenInfo> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000", // Native token
    decimals: 18,
    coingeckoId: "ethereum",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86a33E6441CE476304E1c1C4a5F6f0e3Ed2D0", // Placeholder
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    decimals: 6,
    coingeckoId: "tether",
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    decimals: 18,
    coingeckoId: "dai",
  },
};

export const ETHEREUM_DEXES: Record<string, DexInfo> = {
  "uniswap-v3": {
    name: "Uniswap V3",
    type: "AMM",
    routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    supportedFeeTiers: [100, 500, 3000, 10000],
    supportedPairs: [
      "ETH/USDC", "ETH/USDT", "ETH/DAI", "ETH/WBTC",
      "USDC/USDT", "USDC/DAI", "USDC/WBTC",
      "WBTC/ETH", "WBTC/USDC", "WBTC/USDT",
      "DAI/ETH", "DAI/USDC", "DAI/USDT"
    ],
    website: "https://uniswap.org",
  },
  "uniswap-v2": {
    name: "Uniswap V2",
    type: "AMM",
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    factoryAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    supportedPairs: [
      "ETH/USDC", "ETH/USDT", "ETH/DAI", "ETH/WBTC",
      "USDC/USDT", "USDC/DAI", "USDC/WBTC"
    ],
    website: "https://uniswap.org",
  },
  "1inch": {
    name: "1inch",
    type: "aggregator",
    routerAddress: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    supportedPairs: [
      "ETH/USDC", "ETH/USDT", "ETH/DAI", "ETH/WBTC",
      "USDC/USDT", "USDC/DAI", "USDC/WBTC",
      "WBTC/ETH", "WBTC/USDC", "WBTC/USDT",
      "DAI/ETH", "DAI/USDC", "DAI/USDT"
    ],
    website: "https://1inch.io",
  },
  balancer: {
    name: "Balancer",
    type: "AMM",
    routerAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    supportedPairs: [
      "ETH/USDC", "ETH/DAI", "ETH/WBTC",
      "USDC/DAI", "WBTC/ETH"
    ],
    website: "https://balancer.fi",
  },
};

export const ETHEREUM_BRIDGES: Record<string, BridgeInfo> = {
  wormhole: {
    name: "Wormhole",
    type: "third_party",
    contractAddress: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    website: "https://wormhole.com",
    supportedChains: ["solana", "sei"],
  },
  "layer-zero": {
    name: "LayerZero",
    type: "third_party",
    website: "https://layerzero.network",
    supportedChains: ["solana"],
  },
};

export const ETHEREUM_CONFIG = {
  chainId: 1,
  name: "Ethereum",
  nativeToken: "ETH",
  blockTime: 12, // seconds
  tokens: ETHEREUM_TOKENS,
  dexes: ETHEREUM_DEXES,
  bridges: ETHEREUM_BRIDGES,
  defaultDex: "uniswap-v3",
  defaultSlippage: 0.5, // 0.5%
  gasStrategy: {
    slow: 1.0,
    standard: 1.2,
    fast: 1.5,
  },
};