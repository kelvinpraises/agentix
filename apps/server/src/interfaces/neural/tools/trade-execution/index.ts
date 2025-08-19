import { adjustPositionTool } from "@/interfaces/neural/tools/trade-execution/items/adjust-position";
import { enterPositionTool } from "@/interfaces/neural/tools/trade-execution/items/enter-position";
import { exitPositionTool } from "@/interfaces/neural/tools/trade-execution/items/exit-position";
import { swapPositionTool } from "@/interfaces/neural/tools/trade-execution/items/swap-position";

export const tradeExecutionTools = {
  adjustPosition: adjustPositionTool,
  enterPosition: enterPositionTool,
  exitPosition: exitPositionTool,
  swapPosition: swapPositionTool,
};
