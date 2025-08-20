import {
  ALL_SUPPORTED_PAIRS,
  CHAIN_FEATURES,
  getChainConfig,
  isValidChain,
} from "@/constants/registry";
import { ChainType } from "@/types/orb";

export interface TokenValidationResult {
  isValid: boolean;
  tokenInfo?: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    coingeckoId?: string;
  };
}

export interface PairValidationResult {
  isValid: boolean;
  fromToken?: string;
  toToken?: string;
  availableDexes?: string[];
}

export interface DexValidationResult {
  isValid: boolean;
  dexInfo?: {
    name: string;
    type: string;
    supportedPairs: string[];
    website: string;
  };
}

export const registryService = {
  validateAssetPair(chain: ChainType, pair: string): PairValidationResult {
    if (!isValidChain(chain)) {
      return { isValid: false };
    }

    const config = getChainConfig(chain);
    const [fromToken, toToken] = pair.split("/");

    if (!fromToken || !toToken) {
      return { isValid: false };
    }

    // Check if both tokens exist on the chain
    const fromTokenExists = fromToken in config.tokens;
    const toTokenExists = toToken in config.tokens;

    if (!fromTokenExists || !toTokenExists) {
      return { isValid: false };
    }

    // Check if any DEX on the chain supports this pair
    const availableDexes: string[] = [];

    Object.entries(config.dexes).forEach(([dexName, dexInfo]) => {
      if (
        dexInfo.supportedPairs.includes(pair) ||
        dexInfo.supportedPairs.includes(`${toToken}/${fromToken}`)
      ) {
        availableDexes.push(dexName);
      }
    });

    return {
      isValid: availableDexes.length > 0,
      fromToken,
      toToken,
      availableDexes,
    };
  },

  getTokenInfo(chain: ChainType, symbol: string): TokenValidationResult {
    if (!isValidChain(chain)) {
      return { isValid: false };
    }

    const config = getChainConfig(chain);
    const tokenInfo = config.tokens[symbol];

    if (!tokenInfo) {
      return { isValid: false };
    }

    return {
      isValid: true,
      tokenInfo,
    };
  },

  getDexInfo(chain: ChainType, dexName: string): DexValidationResult {
    if (!isValidChain(chain)) {
      return { isValid: false };
    }

    const config = getChainConfig(chain);
    const dexInfo = config.dexes[dexName];

    if (!dexInfo) {
      return { isValid: false };
    }

    return {
      isValid: true,
      dexInfo,
    };
  },

  getBridgeInfo(fromChain: ChainType, toChain: ChainType) {
    if (!isValidChain(fromChain) || !isValidChain(toChain)) {
      return { isValid: false, bridges: [] };
    }

    const fromConfig = getChainConfig(fromChain);
    const availableBridges: any[] = [];

    Object.entries(fromConfig.bridges).forEach(([bridgeName, bridgeInfo]) => {
      if (bridgeInfo.supportedChains.includes(toChain)) {
        availableBridges.push({
          name: bridgeName,
          ...bridgeInfo,
        });
      }
    });

    return {
      isValid: availableBridges.length > 0,
      bridges: availableBridges,
    };
  },

  getAllSupportedPairs(): string[] {
    return Array.from(ALL_SUPPORTED_PAIRS);
  },

  getChainSupportedPairs(chain: ChainType): string[] {
    if (!isValidChain(chain)) {
      return [];
    }

    const config = getChainConfig(chain);
    const pairs = new Set<string>();

    Object.values(config.dexes).forEach((dex) => {
      dex.supportedPairs.forEach((pair: string) => pairs.add(pair));
    });

    return Array.from(pairs);
  },

  getDefaultDex(chain: ChainType): string | null {
    if (!isValidChain(chain)) {
      return null;
    }

    return getChainConfig(chain).defaultDex;
  },

  getChainFeatures(chain: ChainType) {
    if (!isValidChain(chain)) {
      return null;
    }

    return CHAIN_FEATURES[chain];
  },

  validatePairInOrb(orbAssetPairs: Record<string, number>, tradingPair: string): boolean {
    return tradingPair in orbAssetPairs;
  },

  getRoutingInfo(chain: ChainType, tradingPair: string) {
    const pairValidation = this.validateAssetPair(chain, tradingPair);

    if (!pairValidation.isValid) {
      return { isValid: false };
    }

    const config = getChainConfig(chain);
    const defaultDex = config.defaultDex;
    const defaultSlippage = config.defaultSlippage;

    return {
      isValid: true,
      chain,
      pair: tradingPair,
      fromToken: pairValidation.fromToken,
      toToken: pairValidation.toToken,
      availableDexes: pairValidation.availableDexes,
      defaultDex,
      defaultSlippage,
      gasToken: CHAIN_FEATURES[chain].gasToken,
    };
  },
};
