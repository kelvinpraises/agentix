import { z } from "zod";
import { PolicySchema } from "@/models/Policy";

export const AgentRuntimeContextSchema = z.object({
  userId: z.number(),
  tradeActionId: z.number(),
  policy: PolicySchema,
  walletBalances: z.record(z.any()),
  openPositions: z.array(z.any()),
});

export type AgentRuntimeContext = z.infer<typeof AgentRuntimeContextSchema>;
