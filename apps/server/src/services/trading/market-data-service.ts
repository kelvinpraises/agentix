import Fuse from "fuse.js";
import ky from "ky";
import { z } from "zod";

// --- Interfaces ---
interface Coin {
  id: string;
  symbol: string;
  name: string;
  platforms?: { [key: string]: string };
}

interface CryptoDataPoint {
  timestamp: number;
  price: number;
  marketCap: number;
  volume: number;
}

interface CandlestickData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

// --- Zod Schema for Market Data ---
export const marketDataResultSchema = z.object({
  id: z.any().optional(),
  symbol: z.any().optional(),
  name: z.any().optional(),
  block_time_in_minutes: z.any().optional(),
  categories: z.any().optional(),
  public_notice: z.any().optional(),
  additional_notices: z.any().optional(),
  description: z.object({ en: z.any().optional() }).optional(),
  platforms: z.any().optional(),
  detail_platforms: z.any().optional(),
  links: z.any().optional(),
  country_origin: z.any().optional(),
  genesis_date: z.any().optional(),
  sentiment_votes_up_percentage: z.any().optional(),
  sentiment_votes_down_percentage: z.any().optional(),
  watchlist_portfolio_users: z.any().optional(),
  market_cap_rank: z.any().optional(),
  market_data: z
    .object({
      current_price: z.object({ usd: z.any().optional() }).optional(),
      total_value_locked: z.any().optional(),
      mcap_to_tvl_ratio: z.any().optional(),
      fdv_to_tvl_ratio: z.any().optional(),
      roi: z.any().optional(),
      ath: z.object({ usd: z.any().optional() }).optional(),
      ath_change_percentage: z.object({ usd: z.any().optional() }).optional(),
      ath_date: z.object({ usd: z.any().optional() }).optional(),
      atl: z.object({ usd: z.any().optional() }).optional(),
      atl_change_percentage: z.object({ usd: z.any().optional() }).optional(),
      atl_date: z.object({ usd: z.any().optional() }).optional(),
      market_cap: z.object({ usd: z.any().optional() }).optional(),
      market_cap_rank: z.any().optional(),
      fully_diluted_valuation: z.object({ usd: z.any().optional() }).optional(),
      market_cap_fdv_ratio: z.any().optional(),
      total_volume: z.object({ usd: z.any().optional() }).optional(),
      high_24h: z.object({ usd: z.any().optional() }).optional(),
      low_24h: z.object({ usd: z.any().optional() }).optional(),
      price_change_24h: z.any().optional(),
      price_change_percentage_24h: z.any().optional(),
      price_change_percentage_7d: z.any().optional(),
      price_change_percentage_14d: z.any().optional(),
      price_change_percentage_30d: z.any().optional(),
      price_change_percentage_60d: z.any().optional(),
      price_change_percentage_200d: z.any().optional(),
      price_change_percentage_1y: z.any().optional(),
      market_cap_change_24h: z.any().optional(),
      market_cap_change_percentage_24h: z.any().optional(),
      price_change_24h_in_currency: z.object({ usd: z.any().optional() }).optional(),
      price_change_percentage_1h_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_24h_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_7d_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_14d_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_30d_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_60d_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_200d_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      price_change_percentage_1y_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      market_cap_change_24h_in_currency: z.object({ usd: z.any().optional() }).optional(),
      market_cap_change_percentage_24h_in_currency: z
        .object({ usd: z.any().optional() })
        .optional(),
      total_supply: z.number().nullable().optional(),
      max_supply: z.number().nullable().optional(),
      circulating_supply: z.any().optional(),
      last_updated: z.any().optional(),
    })
    .optional(),
  community_data: z.any().optional(),
  developer_data: z.any().optional(),
  status_updates: z.any().optional(),
  last_updated: z.any().optional(),
});

type MarketDataResult = z.infer<typeof marketDataResultSchema>;

// --- Cache ---
let coinListCache: {
  data: Coin[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// --- API Client ---
const coingeckoClient = ky.create({
  prefixUrl: "https://api.coingecko.com/api/v3",
  headers: {
    accept: "application/json",
    "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "",
  },
});

// --- Data Processing Functions ---
function processRawMarketData(data: {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}): CryptoDataPoint[] {
  return data.prices.map((price, index) => ({
    timestamp: price[0],
    price: price[1],
    marketCap: data.market_caps[index][1],
    volume: data.total_volumes[index][1],
  }));
}

function processRawOHLCData(data: number[][]): CandlestickData[] {
  return data.map((entry) => ({
    x: entry[0],
    o: entry[1],
    h: entry[2],
    l: entry[3],
    c: entry[4],
  }));
}

// --- Service Definition ---
export const marketDataService = {
  async getCoinList(searchTerm?: string): Promise<Coin[]> {
    try {
      let coins: Coin[];
      if (coinListCache.data && Date.now() - coinListCache.timestamp < CACHE_TTL) {
        coins = coinListCache.data;
      } else {
        coins = await coingeckoClient
          .get("coins/list?include_platform=true")
          .json<Coin[]>();
        coinListCache.data = coins;
        coinListCache.timestamp = Date.now();
      }

      if (searchTerm) {
        const fuse = new Fuse(coins, {
          keys: ["id", "symbol", "name"],
          includeScore: true,
          threshold: 0.3,
        });
        return fuse.search(searchTerm).map((result) => result.item);
      }
      return coins;
    } catch (error) {
      console.error("Failed to fetch coin list:", error);
      throw new Error("Failed to fetch coin list from CoinGecko.");
    }
  },

  async getMarketChart(
    id: string,
    vs_currency: string,
    days: number
  ): Promise<CryptoDataPoint[]> {
    try {
      const rawData = await coingeckoClient
        .get(`coins/${id}/market_chart`, {
          searchParams: {
            vs_currency,
            days: days.toString(),
            precision: "full",
          },
        })
        .json<{
          prices: [number, number][];
          market_caps: [number, number][];
          total_volumes: [number, number][];
        }>();
      return processRawMarketData(rawData);
    } catch (error) {
      console.error(`Failed to fetch market chart for ${id}:`, error);
      throw new Error(`Failed to fetch market chart for ${id} from CoinGecko.`);
    }
  },

  async getOHLC(id: string, vs_currency: string, days: number): Promise<CandlestickData[]> {
    try {
      const rawData = await coingeckoClient
        .get(`coins/${id}/ohlc`, {
          searchParams: {
            vs_currency,
            days: days.toString(),
          },
        })
        .json<number[][]>();
      return processRawOHLCData(rawData);
    } catch (error) {
      console.error(`Failed to fetch OHLC data for ${id}:`, error);
      throw new Error(`Failed to fetch OHLC data for ${id} from CoinGecko.`);
    }
  },

  async getMarketData(id: string): Promise<MarketDataResult> {
    try {
      const data = await coingeckoClient
        .get(`coins/${id}?tickers=false&community_data=false&developer_data=false`)
        .json();

      const transformer = marketDataResultSchema.transform((data) => {
        const removeEmpty = (obj: any): any => {
          if (Array.isArray(obj)) {
            const filtered = obj
              .filter((item) => item != null && item !== 0 && item !== "")
              .map(removeEmpty);
            return filtered.length ? filtered : undefined;
          }
          if (obj && typeof obj === "object") {
            const filtered = Object.fromEntries(
              Object.entries(obj)
                .map(([k, v]) => [k, removeEmpty(v)])
                .filter(([_, v]) => {
                  if (v === undefined || v === null || v === 0 || v === "") return false;
                  if (Array.isArray(v) && !v.length) return false;
                  if (typeof v === "object" && !Object.keys(v).length) return false;
                  return true;
                })
            );
            return Object.keys(filtered).length ? filtered : undefined;
          }
          return obj === 0 || obj === "" ? undefined : obj;
        };
        return removeEmpty(data);
      });

      return transformer.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Invalid market data format for ${id}:`, error.issues);
        throw new Error(`Invalid market data format for ${id}: ${error.message}`);
      }
      console.error(`Failed to fetch market data for ${id}:`, error);
      throw new Error(`Failed to fetch market data for ${id} from CoinGecko.`);
    }
  },
};
