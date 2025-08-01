import { createTool } from "@mastra/core";
import { z } from "zod";

import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { createJournalEntry } from "@/services/trading/trade-service";

export const swapPositionTool = createTool({
  id: "swapPosition",
  description:
    "Exchanges current position for a different asset while maintaining the strategy framework.",
  inputSchema: z.object({
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.string(),
    reason: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { fromToken, toToken, amount, reason } = context;
    const { userId, tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    // In a real scenario, you would validate the new asset and compatibility here.

    await createJournalEntry({
      userId,
      tradeActionId,
      type: "SYSTEM_ALERT",
      content: {
        contentType: "SYSTEM_ALERT",
        message: `User swapped ${amount} ${fromToken} for ${toToken}. Reason: ${reason}`,
        alert_type: "info",
        severity: "low",
        requires_action: false,
      },
    });

    return {
      success: true,
      message: `Swap for trade ${tradeActionId} has been executed.`,
    };
  },
});
