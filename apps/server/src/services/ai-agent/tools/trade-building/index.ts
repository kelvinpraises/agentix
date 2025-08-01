import { addPositionMonitorTool } from "@/services/ai-agent/tools/trade-building/items/add-position-monitor";
import { addRsiStrategyTool } from "@/services/ai-agent/tools/trade-building/items/add-rsi-strategy";
import { addSmaCrossStrategyTool } from "@/services/ai-agent/tools/trade-building/items/add-sma-cross";
import { addTimeLimitTool } from "@/services/ai-agent/tools/trade-building/items/add-time-limit";
import { removeStrategyTool } from "@/services/ai-agent/tools/trade-building/items/remove-strategy";
import { updateStrategyTool } from "@/services/ai-agent/tools/trade-building/items/update-strategy";
import { viewBuildStateTool } from "@/services/ai-agent/tools/trade-building/items/view-build-state";

export const tradeBuildingTools = {
  addPositionMonitor: addPositionMonitorTool,
  addRsiStrategy: addRsiStrategyTool,
  addSmaCrossStrategy: addSmaCrossStrategyTool,
  addTimeLimit: addTimeLimitTool,
  removeStrategy: removeStrategyTool,
  updateStrategy: updateStrategyTool,
  viewBuildState: viewBuildStateTool,
};
