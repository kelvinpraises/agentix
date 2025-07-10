import { createTool } from "@mastra/core";
import { z } from "zod";

export const executionTools = {
  enterPosition: createTool({
    id: "enterPosition",
    description: "Send notification to client to enter a trading position",
    inputSchema: z.object({
      userId: z.string(),
      fromToken: z.string(),
      toToken: z.string(),
      amount: z.string(),
      chain: z.enum(["ethereum", "solana"]),
      slippage: z.number().default(0.5),
      reasoning: z.string(),
    }),
    outputSchema: z.any(),
    execute: async ({ context }) => {
      // Send notification to client
      console.log("Sending trade notification to user", context.userId);
      return { tradeId: "123", status: "notification_sent" };
    },
  }),
  exitPosition: createTool({
    id: "exitPosition",
    description: "Send notification to client to exit a trading position",
    inputSchema: z.object({
      userId: z.string(),
      positionId: z.string(),
      percentage: z.number().default(100),
      reasoning: z.string(),
    }),
    outputSchema: z.any(),
    execute: async ({ context }) => {
      console.log("Sending exit notification to user", context.userId);
      return { status: "exit_notification_sent" };
    },
  }),
};
