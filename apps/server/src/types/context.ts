import { z } from "zod";

export const AgentRuntimeContextSchema = z.object({
  sectorId: z.number(),
  tradeActionId: z.number(),
  lockedOrbId: z.number().nullable().optional(),
});

export type AgentRuntimeContext = z.infer<typeof AgentRuntimeContextSchema>;
