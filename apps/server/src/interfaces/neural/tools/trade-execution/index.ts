import { adjustPositionTool } from "@/services/ai-agent/tools/trade-execution/items/adjust-position";
import { enterPositionTool } from "@/services/ai-agent/tools/trade-execution/items/enter-position";
import { exitPositionTool } from "@/services/ai-agent/tools/trade-execution/items/exit-position";
import { swapPositionTool } from "@/services/ai-agent/tools/trade-execution/items/swap-position";

export const tradeExecutionTools = {
  adjustPosition: adjustPositionTool,
  enterPosition: enterPositionTool,
  exitPosition: exitPositionTool,
  swapPosition: swapPositionTool,
};
