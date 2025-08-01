import { insightTools } from "@/services/ai-agent/tools/insight";
import { journalTools } from "@/services/ai-agent/tools/journal";
import { tradeBuildingTools } from "@/services/ai-agent/tools/trade-building";
import { tradeExecutionTools } from "@/services/ai-agent/tools/trade-execution";

export const allTools = {
  ...insightTools,
  ...journalTools,
  ...tradeBuildingTools,
  ...tradeExecutionTools,
};
