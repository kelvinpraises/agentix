import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { strategyQueue } from "@/infrastructure/queues/config";
import { tradeActionService } from "@/services/trading/trade-action-service";
import {
  UserFeedbackContent,
  PositionEnteredContent,
  ResearchSynthesisContent,
  SystemAlertContent,
  UserActionContent,
} from "@/types/journal";
import { TradeActionsTable } from "@/infrastructure/database/schema";
import { ChainType } from "@/types/orb";

type TradeStatus = TradeActionsTable["status"];

type MockDb = {
  selectFrom: ReturnType<typeof vi.fn>;
  insertInto: ReturnType<typeof vi.fn>;
  updateTable: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  returningAll: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>;
};

vi.mock("@/infrastructure/database/turso-connection", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn().mockReturnThis(),
    executeTakeFirst: vi.fn().mockReturnThis(),
    executeTakeFirstOrThrow: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/infrastructure/queues/config", () => ({
  strategyQueue: {
    removeJobScheduler: vi.fn(),
  },
}));

import { db } from "@/infrastructure/database/turso-connection";
const mockDb = db as unknown as MockDb;

const MOCK_SECTOR_ID = 10;
const MOCK_TRADE_ACTION_ID = 100;
const MOCK_TIMESTAMP = new Date("2025-10-04T10:00:00Z");
const MOCK_TIMESTAMP_ISO = MOCK_TIMESTAMP.toISOString();

const mockTradeAction = {
  id: MOCK_TRADE_ACTION_ID,
  sector_id: MOCK_SECTOR_ID,
  status: "ANALYZING" as TradeStatus,
  is_active: true,
};

describe("Trade Action Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TIMESTAMP);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("startNewTradeAction", () => {
    test("should create trade in ANALYZING status and set is_active to true", async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValue({
        id: MOCK_TRADE_ACTION_ID,
      });
      await tradeActionService.startNewTradeAction(MOCK_SECTOR_ID);
      expect(db.insertInto).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.values).toHaveBeenCalledWith({
        sector_id: MOCK_SECTOR_ID,
        status: "ANALYZING",
        is_active: true,
      });
    });
  });

  describe("updateTradeAction", () => {
    test("should transition ANALYZING → EXECUTING and update timestamp", async () => {
      const updates = { status: "EXECUTING" as TradeStatus };
      await tradeActionService.updateTradeAction(MOCK_TRADE_ACTION_ID, updates);
      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        status: "EXECUTING",
        updated_at: MOCK_TIMESTAMP_ISO,
      });
    });

    test("should transition EXECUTING → SUCCEEDED", async () => {
      await tradeActionService.updateTradeAction(MOCK_TRADE_ACTION_ID, {
        status: "SUCCEEDED",
      });
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "SUCCEEDED" })
      );
    });

    test("should transition EXECUTING → FAILED", async () => {
      await tradeActionService.updateTradeAction(MOCK_TRADE_ACTION_ID, {
        status: "FAILED",
      });
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FAILED" })
      );
    });
  });

  describe("createJournalEntry", () => {
    test("should create RESEARCH_SYNTHESIS entry and validate content schema", async () => {
      const content: ResearchSynthesisContent = { reasoning: "AI is thinking" };
      await tradeActionService.createJournalEntry({
        sectorId: MOCK_SECTOR_ID,
        tradeActionId: MOCK_TRADE_ACTION_ID,
        type: "RESEARCH_SYNTHESIS",
        content,
      });
      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "RESEARCH_SYNTHESIS",
          content: JSON.stringify(content),
        })
      );
    });

    test("should create POSITION_ENTERED entry and validate content schema", async () => {
      const content: PositionEnteredContent = {
        trading_pair: "BTC/USD",
        amount: "1.0",
        chain: "ethereum" as ChainType,
        dex: "uniswap",
        reasoning: "Entering position",
      };
      await tradeActionService.createJournalEntry({
        sectorId: MOCK_SECTOR_ID,
        tradeActionId: MOCK_TRADE_ACTION_ID,
        type: "POSITION_ENTERED",
        content,
      });
      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "POSITION_ENTERED",
          content: JSON.stringify(content),
        })
      );
    });
  });

  describe("interruptTradeAction", () => {
    test("should set is_active to false and create interruption journal entry", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(mockTradeAction);

      await tradeActionService.interruptTradeAction(MOCK_TRADE_ACTION_ID);

      expect(strategyQueue.removeJobScheduler).toHaveBeenCalledWith(
        `monitor-trade-${MOCK_TRADE_ACTION_ID}`
      );

      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        status: "FAILED",
        is_active: false,
        updated_at: MOCK_TIMESTAMP_ISO,
      });

      const alertContent: SystemAlertContent = {
        message: "AI analysis was interrupted by the user.",
        alert_type: "info",
        severity: "low",
        requires_action: true,
      };
      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          sector_id: MOCK_SECTOR_ID,
          trade_action_id: MOCK_TRADE_ACTION_ID,
          type: "SYSTEM_ALERT",
          content: JSON.stringify(alertContent),
        })
      );
    });

    test("should throw error if trade is already completed", async () => {
      const completedTrade = { ...mockTradeAction, is_active: false };
      mockDb.executeTakeFirst.mockResolvedValue(completedTrade);
      await expect(
        tradeActionService.interruptTradeAction(MOCK_TRADE_ACTION_ID)
      ).rejects.toThrow("Cannot interrupt a trade that is already completed.");
    });
  });

  describe("addUserFeedback", () => {
    test("should create USER_FEEDBACK journal entry and validate schema", async () => {
      mockDb.executeTakeFirst.mockResolvedValue({
        sector_id: MOCK_SECTOR_ID,
      });
      const feedbackContent: UserFeedbackContent = {
        comment: "Great trade!",
        timestamp: MOCK_TIMESTAMP_ISO,
      };

      await tradeActionService.addUserFeedback(MOCK_TRADE_ACTION_ID, feedbackContent);

      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith({
        sector_id: MOCK_SECTOR_ID,
        trade_action_id: MOCK_TRADE_ACTION_ID,
        type: "USER_FEEDBACK",
        content: JSON.stringify(feedbackContent),
        confidence_score: undefined,
        is_internal: false,
      });
    });
  });

  describe("setTradingPair", () => {
    const MOCK_ORB_ID = 200;
    const MOCK_TRADING_PAIR = "BTC/USD";
    const mockTrade = {
      sector_id: MOCK_SECTOR_ID,
      orb_id: null,
      trading_pair: null,
    };
    const mockOrb = {
      id: MOCK_ORB_ID,
      chain: "ethereum" as ChainType,
      asset_pairs: { "BTC/USD": 1, "ETH/USD": 2 },
    };

    test("should successfully set trading pair when all validations pass", async () => {
      mockDb.executeTakeFirst
        .mockResolvedValueOnce(mockTrade) // First call for the trade
        .mockResolvedValueOnce(mockOrb); // Second call for the orb

      await tradeActionService.setTradingPair(
        MOCK_TRADE_ACTION_ID,
        MOCK_ORB_ID,
        MOCK_TRADING_PAIR
      );

      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        orb_id: MOCK_ORB_ID,
        trading_pair: MOCK_TRADING_PAIR,
        updated_at: MOCK_TIMESTAMP_ISO,
      });
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);
      expect(mockDb.execute).toHaveBeenCalled();
    });

    test("should throw an error if trade action is not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(null);

      await expect(
        tradeActionService.setTradingPair(
          MOCK_TRADE_ACTION_ID,
          MOCK_ORB_ID,
          MOCK_TRADING_PAIR
        )
      ).rejects.toThrow("Trade action not found");
    });

    test("should throw an error if trading pair is already set", async () => {
      const tradeWithPair = { ...mockTrade, trading_pair: "ETH/USD" };
      mockDb.executeTakeFirst.mockResolvedValue(tradeWithPair);

      await expect(
        tradeActionService.setTradingPair(
          MOCK_TRADE_ACTION_ID,
          MOCK_ORB_ID,
          MOCK_TRADING_PAIR
        )
      ).rejects.toThrow("Trading pair already set for this trade action");
    });

    test("should throw an error if orb does not belong to the same sector", async () => {
      mockDb.executeTakeFirst
        .mockResolvedValueOnce(mockTrade) // First call for the trade
        .mockResolvedValueOnce(null); // Second call for the orb returns null

      await expect(
        tradeActionService.setTradingPair(
          MOCK_TRADE_ACTION_ID,
          MOCK_ORB_ID,
          MOCK_TRADING_PAIR
        )
      ).rejects.toThrow("Orb not found or does not belong to the same sector");
    });

    test("should throw an error if trading pair is not available in the orb", async () => {
      mockDb.executeTakeFirst
        .mockResolvedValueOnce(mockTrade)
        .mockResolvedValueOnce(mockOrb);

      await expect(
        tradeActionService.setTradingPair(MOCK_TRADE_ACTION_ID, MOCK_ORB_ID, "INVALID/PAIR")
      ).rejects.toThrow("Trading pair not available in selected orb");
    });
  });

  describe("addUserAction", () => {
    const mockUserActionApprove: UserActionContent = {
      action_type: "approve_trade",
      message: "Looks good, proceed.",
      timestamp: MOCK_TIMESTAMP_ISO,
    };
    const mockUserActionReject: UserActionContent = {
      action_type: "reject_trade",
      message: "Not confident, abort.",
      timestamp: MOCK_TIMESTAMP_ISO,
    };

    test("should update status to EXECUTING and create journal entry on approval", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        sector_id: MOCK_SECTOR_ID,
      });

      mockDb.executeTakeFirstOrThrow.mockResolvedValue({ id: 999 });

      await tradeActionService.addUserAction(MOCK_TRADE_ACTION_ID, mockUserActionApprove);

      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        status: "EXECUTING",
        is_active: true,
        updated_at: MOCK_TIMESTAMP_ISO,
      });
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);

      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          sector_id: MOCK_SECTOR_ID,
          trade_action_id: MOCK_TRADE_ACTION_ID,
          type: "USER_ACTION",
          content: JSON.stringify(mockUserActionApprove),
        })
      );
    });

    test("should update status to REJECTED and create journal entry on rejection", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        sector_id: MOCK_SECTOR_ID,
      });
      mockDb.executeTakeFirstOrThrow.mockResolvedValue({ id: 999 });

      await tradeActionService.addUserAction(MOCK_TRADE_ACTION_ID, mockUserActionReject);

      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        status: "REJECTED",
        is_active: false,
        updated_at: MOCK_TIMESTAMP_ISO,
      });
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);

      expect(db.insertInto).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          sector_id: MOCK_SECTOR_ID,
          trade_action_id: MOCK_TRADE_ACTION_ID,
          type: "USER_ACTION",
          content: JSON.stringify(mockUserActionReject),
        })
      );
    });

    test("should throw an error if trade action is not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(null);

      await expect(
        tradeActionService.addUserAction(MOCK_TRADE_ACTION_ID, mockUserActionApprove)
      ).rejects.toThrow("Trade action not found or invalid");
    });
  });

  describe("getTradeAction", () => {
    test("should retrieve a trade action by its ID", async () => {
      const mockTrade = { id: MOCK_TRADE_ACTION_ID, status: "ANALYZING" };
      mockDb.executeTakeFirst.mockResolvedValue(mockTrade);

      const result = await tradeActionService.getTradeAction(MOCK_TRADE_ACTION_ID);

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(result).toEqual(mockTrade);
    });
  });

  describe("getSectorIdFromTradeAction", () => {
    test("should retrieve the sector ID for a given trade action ID", async () => {
      const mockResult = { sector_id: MOCK_SECTOR_ID };
      mockDb.executeTakeFirst.mockResolvedValue(mockResult);

      const result = await tradeActionService.getSectorIdFromTradeAction(
        MOCK_TRADE_ACTION_ID
      );

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_actions.id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(mockDb.select).toHaveBeenCalledWith("trade_actions.sector_id");
      expect(result).toBe(MOCK_SECTOR_ID);
    });

    test("should return undefined if trade action is not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(null);
      const result = await tradeActionService.getSectorIdFromTradeAction(999);
      expect(result).toBeUndefined();
    });
  });

  describe("getExecutionJournalEntry", () => {
    test("should retrieve the latest POSITION_ENTERED journal entry for a trade", async () => {
      const mockEntry = { content: JSON.stringify({ trading_pair: "BTC/USD" }) };
      mockDb.executeTakeFirst.mockResolvedValue(mockEntry);

      const result = await tradeActionService.getExecutionJournalEntry(
        MOCK_TRADE_ACTION_ID
      );

      expect(db.selectFrom).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_action_id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(mockDb.where).toHaveBeenCalledWith("type", "=", "POSITION_ENTERED");
      expect(mockDb.orderBy).toHaveBeenCalledWith("created_at", "desc");
      expect(mockDb.select).toHaveBeenCalledWith(["content"]);
      expect(result).toEqual(mockEntry);
    });
  });

  describe("getTradesBySector", () => {
    test("should retrieve all trades for a given sector and user", async () => {
      const MOCK_USER_ID = 1;
      const mockTrades = [{ id: MOCK_TRADE_ACTION_ID }, { id: 101 }];
      mockDb.execute.mockResolvedValue(mockTrades);

      const result = await tradeActionService.getTradesBySector(
        MOCK_SECTOR_ID,
        MOCK_USER_ID
      );

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        "sectors",
        "sectors.id",
        "trade_actions.sector_id"
      );
      expect(mockDb.where).toHaveBeenCalledWith("sectors.id", "=", MOCK_SECTOR_ID);
      expect(mockDb.where).toHaveBeenCalledWith("sectors.user_id", "=", MOCK_USER_ID);
      expect(mockDb.orderBy).toHaveBeenCalledWith("trade_actions.created_at", "desc");
      expect(result).toEqual(mockTrades);
    });
  });

  describe("getJournalForTradeAction", () => {
    test("should retrieve all non-internal journal entries for a trade action", async () => {
      const mockJournal = [{ id: 1, type: "RESEARCH_SYNTHESIS" }];
      mockDb.execute.mockResolvedValue(mockJournal);

      const result = await tradeActionService.getJournalForTradeAction(
        MOCK_TRADE_ACTION_ID
      );

      expect(db.selectFrom).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_action_id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(mockDb.where).toHaveBeenCalledWith("is_internal", "=", false);
      expect(mockDb.orderBy).toHaveBeenCalledWith("created_at", "asc");
      expect(result).toEqual(mockJournal);
    });

    test("should retrieve all journal entries, including internal ones, when requested", async () => {
      const mockJournal = [
        { id: 1, type: "RESEARCH_SYNTHESIS", is_internal: false },
        { id: 2, type: "DEBUG", is_internal: true },
      ];
      mockDb.execute.mockResolvedValue(mockJournal);

      const result = await tradeActionService.getJournalForTradeAction(
        MOCK_TRADE_ACTION_ID,
        true
      );

      expect(db.selectFrom).toHaveBeenCalledWith("journal_entries");
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_action_id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(mockDb.where).not.toHaveBeenCalledWith("is_internal", "=", false);
      expect(result).toEqual(mockJournal);
    });
  });

  describe("getTradingPairInfo", () => {
    test("should retrieve trading pair and orb information for a trade", async () => {
      const mockInfo = { trading_pair: "BTC/USD", orb_id: 1, orb_name: "Test Orb" };
      mockDb.executeTakeFirst.mockResolvedValue(mockInfo);

      const result = await tradeActionService.getTradingPairInfo(MOCK_TRADE_ACTION_ID);

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        "orbs",
        "trade_actions.orb_id",
        "orbs.id"
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_actions.id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(result).toEqual(mockInfo);
    });
  });

  describe("getOrbForTrade", () => {
    test("should retrieve the orb associated with a trade action", async () => {
      const mockOrb = { id: 1, name: "Test Orb" };
      mockDb.executeTakeFirst.mockResolvedValue(mockOrb);

      const result = await tradeActionService.getOrbForTrade(MOCK_TRADE_ACTION_ID);

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        "orbs",
        "trade_actions.orb_id",
        "orbs.id"
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_actions.id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(result).toEqual(mockOrb);
    });
  });

  describe("getTradeActionById", () => {
    test("should retrieve a trade action by ID if user has access", async () => {
      const MOCK_USER_ID = 1;
      const mockTrade = { id: MOCK_TRADE_ACTION_ID, sector_id: MOCK_SECTOR_ID };
      mockDb.executeTakeFirst.mockResolvedValue(mockTrade);

      const result = await tradeActionService.getTradeActionById(
        MOCK_TRADE_ACTION_ID,
        MOCK_USER_ID
      );

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        "sectors",
        "sectors.id",
        "trade_actions.sector_id"
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        "trade_actions.id",
        "=",
        MOCK_TRADE_ACTION_ID
      );
      expect(mockDb.where).toHaveBeenCalledWith("sectors.user_id", "=", MOCK_USER_ID);
      expect(result).toEqual(mockTrade);
    });

    test("should return null if trade does not exist or user does not have access", async () => {
      const MOCK_USER_ID = 1;
      mockDb.executeTakeFirst.mockResolvedValue(null);
      const result = await tradeActionService.getTradeActionById(999, MOCK_USER_ID);
      expect(result).toBeNull();
    });
  });

  describe("getTradeStatus", () => {
    test("should retrieve the status of a trade action", async () => {
      const mockStatus = { status: "EXECUTING" as TradeStatus };
      mockDb.executeTakeFirst.mockResolvedValue(mockStatus);

      const result = await tradeActionService.getTradeStatus(MOCK_TRADE_ACTION_ID);

      expect(db.selectFrom).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);
      expect(mockDb.select).toHaveBeenCalledWith("status");
      expect(result).toEqual(mockStatus);
    });
  });

  describe("getOrbById", () => {
    test("should retrieve an orb by its ID", async () => {
      const MOCK_ORB_ID = 200;
      const mockOrb = { id: MOCK_ORB_ID, name: "Test Orb" };
      mockDb.executeTakeFirst.mockResolvedValue(mockOrb);

      const result = await tradeActionService.getOrbById(MOCK_ORB_ID);

      expect(db.selectFrom).toHaveBeenCalledWith("orbs");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_ORB_ID);
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(result).toEqual(mockOrb);
    });
  });

  describe("updateTradeStatus", () => {
    test.each([
      ["EXECUTING", true],
      ["SUCCEEDED", false],
      ["FAILED", false],
      ["REJECTED", false],
      ["ANALYZING", true],
    ])("should update status to %s and set is_active to %s", async (status, isActive) => {
      await tradeActionService.updateTradeStatus(
        MOCK_TRADE_ACTION_ID,
        status as TradeStatus
      );

      expect(db.updateTable).toHaveBeenCalledWith("trade_actions");
      expect(mockDb.set).toHaveBeenCalledWith({
        status,
        is_active: isActive,
        updated_at: MOCK_TIMESTAMP_ISO,
      });
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", MOCK_TRADE_ACTION_ID);
    });
  });

  describe("Error Handling", () => {
    test("should throw an error if trying to interrupt a non-existent trade", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(null);
      await expect(tradeActionService.interruptTradeAction(999)).rejects.toThrow(
        "Trade action not found or invalid"
      );
    });

    test("should propagate database errors during trade creation", async () => {
      const dbError = new Error("DB Connection Failed");
      mockDb.executeTakeFirstOrThrow.mockRejectedValue(dbError);
      await expect(tradeActionService.startNewTradeAction(MOCK_SECTOR_ID)).rejects.toThrow(
        "DB Connection Failed"
      );
    });
  });
});
