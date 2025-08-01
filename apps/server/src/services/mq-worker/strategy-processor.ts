import { SandboxedJob } from "bullmq";

import { strategyQueue } from "@/config/queue-config";
import { db } from "@/database/turso-connection";
import { sendTradeProposal } from "@/services/core/notification-service";
import { marketDataService } from "@/services/trading/market-data-service";
import * as positionMonitor from "@/strategies/position-monitor";
import * as rsiStrategy from "@/strategies/rsi";
import * as smaCrossStrategy from "@/strategies/sma-cross";
import * as timeLimitStrategy from "@/strategies/time-limit";
import { JournalEntryContent } from "@/types/journal";

/**
 * This is the sandboxed processor for the strategy queue.
 * It runs in a separate process to avoid blocking the main event loop.
 *
 * @param job The job from the strategy queue, containing the tradeActionId.
 */
module.exports = async (job: SandboxedJob) => {
  const { tradeActionId } = job.data;
  if (!tradeActionId) {
    console.error("[StrategyProcessor] Job is missing tradeActionId.", job.data);
    return;
  }

  try {
    job.log(`[StrategyProcessor] Running engine for trade ${tradeActionId}`);

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("is_active", "=", true)
      .selectAll()
      .execute();

    if (strategies.length === 0) {
      console.warn(
        `[StrategyEngine] No active strategies for trade ${tradeActionId}. Removing job.`
      );
      await strategyQueue.removeJobScheduler(`monitor-trade-${tradeActionId}`);
      return;
    }

    const context = await getTradeContext(tradeActionId);
    if (!context) {
      return;
    }

    // --- Pre-fetch data for TA strategies ---
    const needsHistoricalData = strategies.some(
      (s) => s.strategy_type === "rsi" || s.strategy_type === "smaCross"
    );
    if (needsHistoricalData) {
      // Fetch the maximum period required by any strategy to be efficient
      // For now, fetching a default of 90 days for TA.
      context.historicalData = await marketDataService.getMarketChart(
        context.assetId,
        "usd",
        90
      );
    }
    // ---

    for (const strategy of strategies) {
      const checker =
        strategyCheckers[strategy.strategy_type as keyof typeof strategyCheckers];
      if (!checker) {
        console.warn(`[StrategyEngine] Unknown strategy: ${strategy.strategy_type}`);
        continue;
      }

      const params = strategy.strategy_params_json;
      const conditionMet = await checker(params, context);

      if (conditionMet) {
        console.log(
          `[StrategyEngine] Strategy '${strategy.strategy_type}' met for trade ${tradeActionId}. Triggering exit.`
        );

        await sendTradeProposal(context.userId, tradeActionId, 0, "EXIT_POSITION");

        await db
          .updateTable("trade_strategies")
          .set({ is_active: false })
          .where("trade_action_id", "=", tradeActionId)
          .execute();
        await strategyQueue.removeJobScheduler(`monitor-trade-${tradeActionId}`);
        break;
      }
    }

    await job.updateProgress(100);
  } catch (error) {
    console.error(`[StrategyProcessor] Engine failed for trade ${tradeActionId}:`, error);
    // Re-throw the error to let BullMQ handle the job failure and retry logic
    throw error;
  }
};

// A map to dynamically call the correct strategy checker
const strategyCheckers = {
  positionMonitor: positionMonitor.check,
  rsi: rsiStrategy.check,
  smaCross: smaCrossStrategy.check,
  timeLimit: timeLimitStrategy.check,
};

export interface StrategyContext {
  tradeActionId: number;
  userId: number;
  assetId: string;
  currentPrice: number;
  tradeCreatedAt: Date;
  // This can be extended with more data like OHLC charts to avoid refetching
  historicalData?: any; // To hold data for TA-based strategies
}

async function getTradeContext(tradeActionId: number): Promise<StrategyContext | null> {
  const tradeAction = await db
    .selectFrom("trade_actions")
    .where("id", "=", tradeActionId)
    .select(["user_id", "created_at"])
    .executeTakeFirst();

  if (!tradeAction) {
    console.warn(`[StrategyEngine] Trade action ${tradeActionId} not found.`);
    return null;
  }

  const executionEntry = await db
    .selectFrom("journal_entries")
    .where("trade_action_id", "=", tradeActionId)
    .where("type", "=", "TRADE_EXECUTION")
    .orderBy("created_at", "desc")
    .select(["content"])
    .executeTakeFirst();

  if (!executionEntry?.content) {
    console.warn(`[StrategyEngine] No execution entry for trade ${tradeActionId}.`);
    return null;
  }

  const content = executionEntry.content as JournalEntryContent;

  if (
    content.contentType !== "TRADE_EXECUTION" ||
    content.trade_details.proposalType !== "ENTER_POSITION"
  ) {
    return null; // Not an entry trade, no need to monitor
  }

  const assetId = content.trade_details.toToken;
  const { user_id: userId, created_at } = tradeAction;

  const marketData = await marketDataService.getMarketData(assetId);
  const currentPrice = marketData.market_data?.current_price?.usd;

  if (currentPrice === undefined) {
    console.error(`[StrategyEngine] Could not fetch price for ${assetId}.`);
    return null;
  }

  return {
    assetId,
    userId,
    currentPrice,
    tradeActionId,
    tradeCreatedAt: new Date(created_at),
  };
}
