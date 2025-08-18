import { SandboxedJob } from "bullmq";

import { strategyQueue } from "@/infrastructure/queues/definitions";
import { sendTradeProposal } from "@/services/shared/notification-service";
import { marketDataService } from "@/services/trading/market-data-service";
import { strategyManagementService } from "@/services/trading/strategy-management-service";
import { 
  getTradeAction, 
  getExecutionJournalEntry, 
  getSectorWithUser 
} from "@/services/trading/trade-service";
import * as positionMonitor from "@/services/trading/strategies/position-monitor";
import * as rsiStrategy from "@/services/trading/strategies/rsi";
import * as smaCrossStrategy from "@/services/trading/strategies/sma-cross";
import * as timeLimitStrategy from "@/services/trading/strategies/time-limit";
import { PositionEnteredContent } from "@/types/journal";
import { StrategyContext, StrategyParams } from "@/types/strategy";

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

    const strategies = await strategyManagementService.getStrategies(tradeActionId);
    const activeStrategies = strategies.filter((s) => s.is_active);

    if (activeStrategies.length === 0) {
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
    const needsHistoricalData = activeStrategies.some(
      (s) => s.strategy_type === "rsi" || s.strategy_type === "smaCross"
    );
    if (needsHistoricalData) {
      // Fetch the maximum period required by any strategy to be efficient
      // For now, fetching a default of 90 days for TA.
      // In future Agent should specify this to the tool.
      context.historicalData = await marketDataService.getMarketChart(
        context.assetId,
        "usd",
        90
      );
    }
    // ---

    for (const strategy of activeStrategies) {
      const checker =
        strategyCheckers[strategy.strategy_type as keyof typeof strategyCheckers];
      if (!checker) {
        console.warn(`[StrategyEngine] Unknown strategy: ${strategy.strategy_type}`);
        continue;
      }

      const params = strategy.strategy_params_json as StrategyParams;
      const conditionMet = await checker(params as any, context);

      if (conditionMet) {
        console.log(
          `[StrategyEngine] Strategy '${strategy.strategy_type}' condition met for trade ${tradeActionId}.`
        );

        const action = params.action;

        if (action === "close") {
          console.log(
            `[StrategyEngine] Action is 'close' - triggering immediate exit for trade ${tradeActionId}.`
          );
          await sendTradeProposal(context.userId, tradeActionId, 0, "EXIT_POSITION");

          await strategyManagementService.closeAllStrategies(tradeActionId);
          await strategyQueue.removeJobScheduler(`monitor-trade-${tradeActionId}`);
          break;
        } else if (action === "reassess") {
          console.log(
            `[StrategyEngine] Action is 'reassess' - notifying for manual evaluation on trade ${tradeActionId}.`
          );
          // TODO: Send notification for manual assessment instead of automatic exit
          // For now, continue monitoring other strategies
          continue;
        }
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

async function getTradeContext(tradeActionId: number): Promise<StrategyContext | null> {
  try {
    // Get trade action using service layer
    const tradeAction = await getTradeAction(tradeActionId);
    if (!tradeAction) {
      console.warn(`[StrategyEngine] Trade action ${tradeActionId} not found.`);
      return null;
    }

    // Get execution journal entry using service layer
    const executionEntry = await getExecutionJournalEntry(tradeActionId);
    if (!executionEntry?.content) {
      console.warn(`[StrategyEngine] No execution entry for trade ${tradeActionId}.`);
      return null;
    }

    // Use proper typing for position entry content
    const content = executionEntry.content as PositionEnteredContent;
    if (!content.to_token) {
      console.error(`[StrategyEngine] Invalid position entry content for trade ${tradeActionId}.`);
      return null;
    }

    // Get sector and user information using service layer
    const sector = await getSectorWithUser(tradeAction.sector_id);
    if (!sector) {
      console.warn(`[StrategyEngine] Sector ${tradeAction.sector_id} not found.`);
      return null;
    }

    // Get live market data for the asset
    const assetId = content.to_token;
    const marketData = await marketDataService.getMarketData(assetId);
    const currentPrice = marketData.market_data?.current_price?.usd;

    if (currentPrice === undefined) {
      console.error(`[StrategyEngine] Could not fetch price for ${assetId}.`);
      return null;
    }

    return {
      assetId,
      userId: sector.user_id,
      sectorId: sector.id,
      currentPrice,
      tradeActionId,
      tradeCreatedAt: new Date(tradeAction.created_at),
    };
  } catch (error) {
    console.error(`[StrategyEngine] Error building trade context for ${tradeActionId}:`, error);
    return null;
  }
}
