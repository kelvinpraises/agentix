import { tradeBuildingTools } from "@/services/ai-agent/tools/trade-building";
import { tradeExecutionTools } from "@/services/ai-agent/tools/trade-execution";
import { tradeResearchTools } from "@/services/ai-agent/tools/trade-research";

export const allTools = {
  ...tradeResearchTools,
  ...tradeBuildingTools,
  ...tradeExecutionTools,
};
