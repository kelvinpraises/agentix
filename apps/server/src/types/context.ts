import { z } from "zod";

export const AgentRuntimeContextSchema = z.object({
  sectorId: z.number(),
  tradeActionId: z.number(),
});

export type AgentRuntimeContext = z.infer<typeof AgentRuntimeContextSchema>;
