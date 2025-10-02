import { ASSETS, TOKENS } from "@/constants/token-registry";
import { ChainType } from "@/types/orb";

type MarketDataProvider = "coingecko" | "coinmarketcap" | "binance";

/**
 * Service for accessing token and asset registry information.
 */
export const tokenService = {
  /**
   * Get market data provider ID for a given asset symbol.
   * @param symbol - Asset symbol (e.g., "ETH", "BTC")
   * @param provider - Market data provider (defaults to "coingecko")
   * @returns Provider-specific ID or lowercase symbol as fallback
   */
  getMarketDataId(symbol: string, provider: MarketDataProvider = "coingecko"): string {
    const asset = ASSETS[symbol];
    if (!asset) {
      console.warn(`[TokenService] Asset ${symbol} not found in registry, using lowercase`);
      return symbol.toLowerCase();
    }
    return asset.marketDataProviders[provider] || symbol.toLowerCase();
  },

  /**
   * Parse a trading pair and get the base asset's market data ID.
   * @param tradingPair - Trading pair (e.g., "ETH/USDC", "BTC/USDT")
   * @param provider - Market data provider (defaults to "coingecko")
   * @returns Provider-specific ID for the base asset
   */
  getBaseAssetId(tradingPair: string, provider: MarketDataProvider = "coingecko"): string {
    const [baseSymbol] = tradingPair.split("/");
    if (!baseSymbol) {
      throw new Error(`Invalid trading pair format: ${tradingPair}`);
    }
    return this.getMarketDataId(baseSymbol.trim(), provider);
  },

  /**
   * Validate if a trading pair is supported on a specific chain.
   * @param chain - Chain type
   * @param tradingPair - Trading pair (e.g., "ETH/USDC")
   * @returns Validation result with available DEXes
   */
  validateAssetPair(
    chain: ChainType,
    tradingPair: string
  ): { isValid: boolean; availableDexes?: string[] } {
    const [baseSymbol, quoteSymbol] = tradingPair.split("/").map((s) => s.trim());

    if (!baseSymbol || !quoteSymbol) {
      return { isValid: false };
    }

    const baseToken = TOKENS.find((t) => t.symbol === baseSymbol && t.chain === chain);
    const quoteToken = TOKENS.find((t) => t.symbol === quoteSymbol && t.chain === chain);

    if (!baseToken || !quoteToken) {
      return { isValid: false };
    }

    // Return available DEXes based on chain
    const dexMap: Partial<Record<ChainType, string[]>> = {
      ethereum: ["Uniswap", "SushiSwap", "Curve"],
      solana: ["Jupiter", "Raydium", "Orca"],
      sei: ["Astroport", "Levana"],
      hyperliquid: ["Hyperliquid DEX"],
      icp: ["ICPSwap", "Sonic"],
    };

    return {
      isValid: true,
      availableDexes: dexMap[chain] || [],
    };
  },

  /**
   * Get routing information for a trading pair on a specific chain.
   * @param chain - Chain type
   * @param tradingPair - Trading pair (e.g., "ETH/USDC")
   * @returns Routing information including default DEX
   */
  getRoutingInfo(
    chain: ChainType,
    tradingPair: string
  ): { isValid: boolean; defaultDex?: string; availableDexes?: string[] } {
    const validation = this.validateAssetPair(chain, tradingPair);

    if (!validation.isValid) {
      return { isValid: false };
    }

    // Default DEX per chain
    const defaultDexMap: Partial<Record<ChainType, string>> = {
      ethereum: "Uniswap",
      solana: "Jupiter",
      sei: "Astroport",
      hyperliquid: "Hyperliquid DEX",
      icp: "ICPSwap",
    };

    return {
      isValid: true,
      defaultDex: defaultDexMap[chain],
      availableDexes: validation.availableDexes,
    };
  },
};