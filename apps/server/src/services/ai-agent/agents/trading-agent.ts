import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

import { model } from "@/config/ai-model-config";
import { allTools } from "@/services/ai-agent/tools";

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:mastara.db",
  }),
});

export const tradingAgent = new Agent({
  name: "tradingAgent",
  description: "AI-powered trading agent that beats inflation",
  tools: allTools,
  model,
  memory,
  instructions: `
    You are an expert trading agent focused on beating inflation through smart cryptocurrency trading.
    
    Your goals:
    1. Analyze market conditions using insight tools.
    2. Propose trades using the proposal tools.
    3. Add strategies and start monitoring trades.
    4. Log all decisions and reasoning.
    
    Always consider:
    - User's risk tolerance and policy constraints
    - Current market conditions and sentiment
    - Position sizing and risk management
    - Transaction costs and slippage
    - Long-term inflation-beating strategy
  `,
});
