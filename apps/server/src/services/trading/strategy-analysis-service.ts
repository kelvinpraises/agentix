import { Selectable } from "kysely";

import { TradeStrategiesTable } from "@/database/schema";

export interface StrategyAnalysis {
  warnings: string[];
  suggestions: string[];
}

// NOTE: This list is hardcoded to avoid circular dependencies.
// It should be kept in sync with the tools in 'services/ai-agent/tools/trade-building/index.ts'
const allTradeBuildingToolNames = [
  "addPositionMonitor",
  "addRsiStrategy",
  "addSmaCrossStrategy",
  "addTimeLimit",
  "removeStrategy",
  "updateStrategy",
  "viewBuildState",
];

export const strategyAnalysisService = {
  analyze(
    strategies: Selectable<TradeStrategiesTable>[],
    currentToolId?: string
  ): StrategyAnalysis {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Rule: Must have a position monitor
    const hasPositionMonitor = strategies.some(
      (s) => s.strategy_type === "positionMonitor"
    );
    if (!hasPositionMonitor) {
      warnings.push(
        "A position monitor with stop-loss and take-profit is required before execution."
      );
      suggestions.push(
        "Consider adding a position monitor to protect your trade. Use the `addPositionMonitor` tool."
      );
    }

    // Rule: Prevent duplicate strategies
    const strategyCounts = new Map<string, number>();
    for (const strategy of strategies) {
      const key = `${strategy.strategy_type}:${JSON.stringify(
        strategy.strategy_params_json
      )}`;
      strategyCounts.set(key, (strategyCounts.get(key) || 0) + 1);
    }
    for (const [key, count] of strategyCounts.entries()) {
      if (count > 1) {
        const [type] = key.split(":", 1);
        warnings.push(`Duplicate strategy found: ${type}. Consolidate or remove duplicates.`);
      }
    }

    // New suggestion logic
    if (currentToolId) {
      const otherTools = allTradeBuildingToolNames.filter(
        (toolName) => toolName !== currentToolId
      );
      suggestions.push(
        ...otherTools.map(
          (toolName) =>
            `You can also use the '${toolName}' tool to further configure the trade.`
        )
      );
    }

    return { warnings, suggestions };
  },
};

