import { ChainType } from "@/types/orb";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chain: ChainType;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  marketDataProviders: {
    coingecko: string;
    coinmarketcap?: string;
    binance?: string;
  };
}

export const TOKENS: TokenInfo[] = [
  // Ethereum
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,

    chain: "ethereum",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86a33E6441CE476304E1c1C4a5F6f0e3Ed2D0",
    decimals: 6,

    chain: "ethereum",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    decimals: 6,

    chain: "ethereum",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    decimals: 8,

    chain: "ethereum",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    decimals: 18,

    chain: "ethereum",
  },

  // Solana
  {
    symbol: "SOL",
    name: "Solana",
    address: "11111111111111111111111111111111",
    decimals: 9,

    chain: "solana",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,

    chain: "solana",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,

    chain: "solana",
  },
  {
    symbol: "RAY",
    name: "Raydium",
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,

    chain: "solana",
  },
  {
    symbol: "SRM",
    name: "Serum",
    address: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
    decimals: 6,

    chain: "solana",
  },

  // Sei
  {
    symbol: "SEI",
    name: "Sei",
    address: "sei",
    decimals: 6,

    chain: "sei",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "sei1hrndqntlvtmx2kepr0zsfgr7nzjptcc72cr4ppk",
    decimals: 6,

    chain: "sei",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "sei1l2d3hlxgn0aevprnrrz0dgz3l8gw59g0xgczl2",
    decimals: 6,

    chain: "sei",
  },
  {
    symbol: "ATOM",
    name: "Cosmos Hub",
    address: "sei1xp3khd0qejr2p9r3kdrx9z82lhzpk8vf2fkxmz",
    decimals: 6,

    chain: "sei",
  },

  // Hyperliquid
  {
    symbol: "HL",
    name: "Hyperliquid",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,

    chain: "hyperliquid",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xa0b86a33e6441ce476304e1c1c4a5f6f0e3ed2d0",
    decimals: 6,

    chain: "hyperliquid",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    decimals: 18,

    chain: "hyperliquid",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    decimals: 8,

    chain: "hyperliquid",
  },

  // ICP
  {
    symbol: "ICP",
    name: "Internet Computer",
    address: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    decimals: 8,

    chain: "icp",
  },
  {
    symbol: "ckBTC",
    name: "Chain Key Bitcoin",
    address: "mxzaz-hqaaa-aaaar-qaada-cai",
    decimals: 8,

    chain: "icp",
  },
  {
    symbol: "ckETH",
    name: "Chain Key Ethereum",
    address: "ss2fx-dyaaa-aaaar-qacoq-cai",
    decimals: 18,

    chain: "icp",
  },
  {
    symbol: "CHAT",
    name: "OpenChat",
    address: "2ouva-viaaa-aaaaq-aaamq-cai",
    decimals: 8,

    chain: "icp",
  },
  {
    symbol: "SONIC",
    name: "Sonic",
    address: "qbizb-wiaaa-aaaaq-aabwq-cai",
    decimals: 8,

    chain: "icp",
  },
];

/**
 * Cross-chain asset registry for market data providers.
 * Maps asset symbols to their IDs across different market data providers.
 */
export const ASSETS: Record<string, AssetInfo> = {
  // Major Assets
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    marketDataProviders: {
      coingecko: "ethereum",
      coinmarketcap: "1027",
      binance: "ETH",
    },
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    marketDataProviders: {
      coingecko: "bitcoin",
      coinmarketcap: "1",
      binance: "BTC",
    },
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    marketDataProviders: {
      coingecko: "wrapped-bitcoin",
      coinmarketcap: "3717",
      binance: "WBTC",
    },
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    marketDataProviders: {
      coingecko: "solana",
      coinmarketcap: "5426",
      binance: "SOL",
    },
  },

  // Stablecoins
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    marketDataProviders: {
      coingecko: "usd-coin",
      coinmarketcap: "3408",
      binance: "USDC",
    },
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    marketDataProviders: {
      coingecko: "tether",
      coinmarketcap: "825",
      binance: "USDT",
    },
  },
  DAI: {
    symbol: "DAI",
    name: "Dai",
    marketDataProviders: {
      coingecko: "dai",
      coinmarketcap: "4943",
      binance: "DAI",
    },
  },

  // Solana Ecosystem
  RAY: {
    symbol: "RAY",
    name: "Raydium",
    marketDataProviders: {
      coingecko: "raydium",
      coinmarketcap: "8526",
      binance: "RAY",
    },
  },
  SRM: {
    symbol: "SRM",
    name: "Serum",
    marketDataProviders: {
      coingecko: "serum",
      coinmarketcap: "6187",
    },
  },

  // Layer 1s
  SEI: {
    symbol: "SEI",
    name: "Sei",
    marketDataProviders: {
      coingecko: "sei-network",
      coinmarketcap: "23149",
    },
  },
  ATOM: {
    symbol: "ATOM",
    name: "Cosmos",
    marketDataProviders: {
      coingecko: "cosmos",
      coinmarketcap: "3794",
      binance: "ATOM",
    },
  },
  ICP: {
    symbol: "ICP",
    name: "Internet Computer",
    marketDataProviders: {
      coingecko: "internet-computer",
      coinmarketcap: "8916",
      binance: "ICP",
    },
  },

  // Hyperliquid
  HL: {
    symbol: "HL",
    name: "Hyperliquid",
    marketDataProviders: {
      coingecko: "hyperliquid",
    },
  },

  // ICP Ecosystem
  ckBTC: {
    symbol: "ckBTC",
    name: "Chain Key Bitcoin",
    marketDataProviders: {
      coingecko: "chain-key-bitcoin",
    },
  },
  ckETH: {
    symbol: "ckETH",
    name: "Chain Key Ethereum",
    marketDataProviders: {
      coingecko: "chain-key-ethereum",
    },
  },
  CHAT: {
    symbol: "CHAT",
    name: "OpenChat",
    marketDataProviders: {
      coingecko: "openchat",
    },
  },
  SONIC: {
    symbol: "SONIC",
    name: "Sonic",
    marketDataProviders: {
      coingecko: "sonic-2",
    },
  },
};
