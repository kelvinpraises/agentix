import { addPositionMonitorTool } from "@/interfaces/neural/tools/trade-building/items/add-position-monitor";
import { addRsiStrategyTool } from "@/interfaces/neural/tools/trade-building/items/add-rsi-strategy";
import { addSmaCrossStrategyTool } from "@/interfaces/neural/tools/trade-building/items/add-sma-cross";
import { addTimeLimitTool } from "@/interfaces/neural/tools/trade-building/items/add-time-limit";
import { removeStrategyTool } from "@/interfaces/neural/tools/trade-building/items/remove-strategy";
import { setTradingPairTool } from "@/interfaces/neural/tools/trade-building/items/set-trading-pair";
import { updateStrategyTool } from "@/interfaces/neural/tools/trade-building/items/update-strategy";
import { viewBuildStateTool } from "@/interfaces/neural/tools/trade-building/items/view-build-state";

export const tradeBuildingTools = {
  setTradingPair: setTradingPairTool,
  addPositionMonitor: addPositionMonitorTool,
  addRsiStrategy: addRsiStrategyTool,
  addSmaCrossStrategy: addSmaCrossStrategyTool,
  addTimeLimit: addTimeLimitTool,
  removeStrategy: removeStrategyTool,
  updateStrategy: updateStrategyTool,
  viewBuildState: viewBuildStateTool,
};
