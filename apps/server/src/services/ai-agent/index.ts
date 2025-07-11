import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";

import { tradingAgent } from "./agents/trading-agent";

export const mastra = new Mastra({
  agents: { tradingAgent },
  logger: new PinoLogger({
    name: "agentix",
    level: "info",
  }),
});