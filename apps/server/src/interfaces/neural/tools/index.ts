import { tradeBuildingTools } from "@/interfaces/neural/tools/trade-building";
import { tradeExecutionTools } from "@/interfaces/neural/tools/trade-execution";
import { tradeResearchTools } from "@/interfaces/neural/tools/trade-research";

export const allTools = {
  ...tradeResearchTools,
  ...tradeBuildingTools,
  ...tradeExecutionTools,
};
