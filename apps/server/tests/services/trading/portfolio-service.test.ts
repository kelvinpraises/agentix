import { beforeEach, describe, expect, test, vi } from "vitest";

import { portfolioService } from "@/services/trading/portfolio-service";
import { PositionEnteredContent } from "@/types/journal";

type MockDb = {
  selectFrom: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
};

// Mock the database
vi.mock("@/infrastructure/database/turso-connection", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

// Import mocked db with proper typing
import { db } from "@/infrastructure/database/turso-connection";
const mockDb = db as unknown as MockDb;

describe("Portfolio Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOpenPositions", () => {
    test("should return correctly formatted open positions", async () => {
      const sectorId = 1;
      const mockDbResult = [
        {
          id: 1,
          trade_action_id: 101,
          content: {
            trading_pair: "ETH/USDC",
            amount: "1.5",
            chain: "ethereum",
            dex: "uniswap",
            transaction_hash: "0x123",
            reasoning: "Based on market analysis",
          } as PositionEnteredContent,
          created_at: new Date("2025-10-01T10:00:00Z"),
          trade_status: "ANALYZING",
        },
        {
          id: 2,
          trade_action_id: 102,
          content: {
            trading_pair: "SOL/USDT",
            amount: "100",
            chain: "solana",
            dex: "jupiter",
            reasoning: "Based on technical indicators",
          } as PositionEnteredContent,
          created_at: new Date("2025-10-01T11:00:00Z"),
          trade_status: "EXECUTING",
        },
      ];

      mockDb.execute.mockResolvedValue(mockDbResult);

      const positions = await portfolioService.getOpenPositions(sectorId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("journal_entries as je");
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        "trade_actions as ta",
        "je.trade_action_id",
        "ta.id"
      );
      expect(mockDb.where).toHaveBeenCalledWith("je.sector_id", "=", sectorId);
      expect(mockDb.where).toHaveBeenCalledWith("je.type", "=", "POSITION_ENTERED");
      expect(mockDb.where).toHaveBeenCalledWith("ta.status", "in", [
        "ANALYZING",
        "EXECUTING",
      ]);

      expect(positions).toHaveLength(2);

      expect(positions[0]).toEqual({
        journalId: 1,
        tradeActionId: 101,
        tradingPair: "ETH/USDC",
        baseAsset: "ETH",
        quoteAsset: "USDC",
        amount: 1.5,
        side: "buy",
        status: "ANALYZING",
        dex: "uniswap",
        chain: "ethereum",
        transactionHash: "0x123",
        createdAt: mockDbResult[0].created_at,
      });

      expect(positions[1]).toEqual({
        journalId: 2,
        tradeActionId: 102,
        tradingPair: "SOL/USDT",
        baseAsset: "SOL",
        quoteAsset: "USDT",
        amount: 100,
        side: "buy",
        status: "EXECUTING",
        dex: "jupiter",
        chain: "solana",
        transactionHash: undefined,
        createdAt: mockDbResult[1].created_at,
      });
    });

    test("should return an empty array when no open positions are found", async () => {
      mockDb.execute.mockResolvedValue([]);
      const positions = await portfolioService.getOpenPositions(1);
      expect(positions).toEqual([]);
    });

    test("should correctly parse trading pairs with different formats", async () => {
      const mockDbResult = [
        {
          id: 1,
          trade_action_id: 101,
          content: {
            trading_pair: "WBTC/DAI",
            amount: "0.5",
            chain: "ethereum",
            dex: "sushiswap",
            reasoning: "High volatility expected",
          } as PositionEnteredContent,
          created_at: new Date(),
          trade_status: "ANALYZING",
        },
      ];

      mockDb.execute.mockResolvedValue(mockDbResult);
      const positions = await portfolioService.getOpenPositions(1);

      expect(positions[0].baseAsset).toBe("WBTC");
      expect(positions[0].quoteAsset).toBe("DAI");
    });

    test("should handle positions without transaction hash", async () => {
      const mockDbResult = [
        {
          id: 1,
          trade_action_id: 101,
          content: {
            trading_pair: "SEI/USDT",
            amount: "0.1",
            chain: "sei",
            dex: "dragonswap",
            reasoning: "Cross-chain opportunity",
          } as PositionEnteredContent,
          created_at: new Date(),
          trade_status: "ANALYZING",
        },
      ];

      mockDb.execute.mockResolvedValue(mockDbResult);
      const positions = await portfolioService.getOpenPositions(1);

      expect(positions[0].transactionHash).toBeUndefined();
    });
  });

  describe("getPortfolioSnapshots", () => {
    test("should return snapshots ordered by date descending", async () => {
      const sectorId = 1;
      const mockSnapshots = [
        {
          id: 3,
          sector_id: 1,
          snapshot_date: new Date("2025-10-03"),
          total_value_usd: "15000.00",
        },
        {
          id: 2,
          sector_id: 1,
          snapshot_date: new Date("2025-10-02"),
          total_value_usd: "14500.00",
        },
        {
          id: 1,
          sector_id: 1,
          snapshot_date: new Date("2025-10-01"),
          total_value_usd: "14000.00",
        },
      ];

      mockDb.execute.mockResolvedValue(mockSnapshots);
      const snapshots = await portfolioService.getPortfolioSnapshots(sectorId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("portfolio_snapshots");
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.orderBy).toHaveBeenCalledWith("snapshot_date", "desc");
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(snapshots).toEqual(mockSnapshots);
    });

    test("should return empty array when no snapshots exist", async () => {
      mockDb.execute.mockResolvedValue([]);
      const snapshots = await portfolioService.getPortfolioSnapshots(1);
      expect(snapshots).toEqual([]);
    });

    test("should filter by correct sector_id", async () => {
      const sectorId = 42;
      mockDb.execute.mockResolvedValue([]);
      await portfolioService.getPortfolioSnapshots(sectorId);
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", 42);
    });
  });

  describe("getWalletBalances", () => {
    test("should return an empty array and log a TODO", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const balances = await portfolioService.getWalletBalances(1);
      expect(balances).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "TODO: Fetching wallet balances for user 1..."
      );
    });
  });
});
