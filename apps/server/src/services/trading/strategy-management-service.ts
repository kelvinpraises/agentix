import { Selectable } from "kysely";

import { db } from "@/infrastructure/database/turso-connection";
import { TradeStrategiesTable } from "@/infrastructure/database/schema";
import { strategyAnalysisService, StrategyAnalysis } from "./strategy-analysis-service";

export interface Strategy {
  type: string;
  params: Record<string, any>;
}

export interface StrategyResult {
  success: boolean;
  strategies: Selectable<TradeStrategiesTable>[];
  analysis: StrategyAnalysis;
  errorMessage?: string;
}

export const strategyManagementService = {
  async addStrategy(
    tradeActionId: number,
    strategyType: string,
    params: Record<string, any>,
    toolId?: string
  ): Promise<StrategyResult> {
    // Check for existing position monitor if adding another one
    if (strategyType === "positionMonitor") {
      const existingMonitor = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .where("strategy_type", "=", "positionMonitor")
        .executeTakeFirst();

      if (existingMonitor) {
        const strategies = await this.getStrategies(tradeActionId);
        return {
          success: false,
          strategies,
          analysis: strategyAnalysisService.analyze(strategies, toolId),
          errorMessage: "A position monitor already exists for this trade.",
        };
      }
    }

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: strategyType,
        strategy_params_json: JSON.stringify(params),
        is_active: true,
      })
      .execute();

    const strategies = await this.getStrategies(tradeActionId);
    const analysis = strategyAnalysisService.analyze(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async getStrategies(tradeActionId: number): Promise<Selectable<TradeStrategiesTable>[]> {
    return await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();
  },

  async updateStrategy(
    tradeActionId: number,
    currentStrategy: Strategy,
    updatedStrategy: Strategy,
    toolId?: string
  ): Promise<StrategyResult> {
    const result = await db
      .updateTable("trade_strategies")
      .set({ strategy_params_json: JSON.stringify(updatedStrategy.params) })
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", currentStrategy.type)
      .where("strategy_params_json", "=", currentStrategy.params)
      .executeTakeFirst();

    const strategies = await this.getStrategies(tradeActionId);

    if (result.numUpdatedRows === 0n) {
      return {
        success: false,
        strategies,
        analysis: strategyAnalysisService.analyze(strategies, toolId),
        errorMessage: "No matching strategy found to update.",
      };
    }

    const analysis = strategyAnalysisService.analyze(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async removeStrategy(
    tradeActionId: number,
    strategy: Strategy,
    toolId?: string
  ): Promise<StrategyResult> {
    // Prevent removing position monitor if other strategies exist
    if (strategy.type === "positionMonitor") {
      const otherStrategies = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .where("strategy_type", "!=", "positionMonitor")
        .selectAll()
        .execute();

      if (otherStrategies.length > 0) {
        const allStrategies = await this.getStrategies(tradeActionId);
        return {
          success: false,
          strategies: allStrategies,
          analysis: strategyAnalysisService.analyze(allStrategies, toolId),
          errorMessage: "Cannot remove position monitor when other strategies exist.",
        };
      }
    }

    const result = await db
      .deleteFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", strategy.type)
      .where("strategy_params_json", "=", strategy.params)
      .executeTakeFirst();

    const strategies = await this.getStrategies(tradeActionId);

    if (result.numDeletedRows === 0n) {
      return {
        success: false,
        strategies,
        analysis: strategyAnalysisService.analyze(strategies, toolId),
        errorMessage: "No matching strategy found to remove.",
      };
    }

    const analysis = strategyAnalysisService.analyze(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async closeAllStrategies(tradeActionId: number): Promise<StrategyResult> {
    await db
      .updateTable("trade_strategies")
      .set({ is_active: false })
      .where("trade_action_id", "=", tradeActionId)
      .execute();

    const strategies = await this.getStrategies(tradeActionId);
    const analysis = strategyAnalysisService.analyze(strategies);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async analyzeStrategies(
    strategies: Selectable<TradeStrategiesTable>[],
    toolId?: string
  ): Promise<StrategyAnalysis> {
    return strategyAnalysisService.analyze(strategies, toolId);
  },
};
