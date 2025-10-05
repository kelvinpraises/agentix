import { describe, expect, test } from "vitest";

import { marketDataService } from "@/services/trading/market-data-service";

describe("Market Data Service (Integration)", () => {
  describe("getCoinList", () => {
    test("should return a list of coins", async () => {
      const result = await marketDataService.getCoinList();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("symbol");
      expect(result[0]).toHaveProperty("name");
    });

    test("should return fuzzy matched coins for 'btc'", async () => {
      const result = await marketDataService.getCoinList("btc");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((coin) => coin.id === "bitcoin")).toBe(true);
    });

    test("should return an empty array for a very unlikely search term", async () => {
      const result = await marketDataService.getCoinList("nonexistentcoinasdfghjkl");
      expect(result).toEqual([]);
    });
  });

  describe("getMarketChart", () => {
    test("should fetch and transform market chart data for bitcoin", async () => {
      const result = await marketDataService.getMarketChart("bitcoin", "usd", 1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const dataPoint = result[0];
      expect(dataPoint).toHaveProperty("timestamp");
      expect(dataPoint).toHaveProperty("price");
      expect(dataPoint).toHaveProperty("marketCap");
      expect(dataPoint).toHaveProperty("volume");
    });

    test("should throw an error for a nonexistent coin", async () => {
      await expect(
        marketDataService.getMarketChart("nonexistent-coin-123", "usd", 1)
      ).rejects.toThrow(
        "Failed to fetch market chart for nonexistent-coin-123 from CoinGecko."
      );
    });
  });

  describe("getOHLC", () => {
    test("should fetch and transform OHLC data for bitcoin", async () => {
      const result = await marketDataService.getOHLC("bitcoin", "usd", 1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const ohlcPoint = result[0];
      expect(ohlcPoint).toHaveProperty("x"); // timestamp
      expect(ohlcPoint).toHaveProperty("o"); // open
      expect(ohlcPoint).toHaveProperty("h"); // high
      expect(ohlcPoint).toHaveProperty("l"); // low
      expect(ohlcPoint).toHaveProperty("c"); // close
    });

    test("should throw an error for a nonexistent coin", async () => {
      await expect(
        marketDataService.getOHLC("nonexistent-coin-123", "usd", 1)
      ).rejects.toThrow(
        "Failed to fetch OHLC data for nonexistent-coin-123 from CoinGecko."
      );
    });
  });

  describe("getMarketData", () => {
    test("should fetch and validate market data for bitcoin", async () => {
      const result = await marketDataService.getMarketData("bitcoin");
      expect(result).toBeDefined();
      expect(result.id).toBe("bitcoin");
      expect(result.symbol).toBe("btc");
    });

    test("should throw an error for a nonexistent coin", async () => {
      await expect(marketDataService.getMarketData("nonexistent-coin-123")).rejects.toThrow(
        "Failed to fetch market data for nonexistent-coin-123 from CoinGecko."
      );
    });
  });
});
