import { Agent } from "@mastra/core";

import { model } from "@/services/mastara/config";
import { executionTools } from "@/services/mastara/tools/execution-tools";
import { insightTools } from "@/services/mastara/tools/insight-tools";
import { journalTools } from "@/services/mastara/tools/journal-tools";

export const tradingAgent = new Agent({
  name: "tradingAgent",
  description: "AI-powered trading agent that beats inflation",
  tools: { ...insightTools, ...executionTools, ...journalTools },
  model,
  instructions: `
    You are an expert trading agent focused on beating inflation through smart cryptocurrency trading.
    
    Your goals:
    1. Analyze market conditions using insight tools
    2. Make trading decisions based on user policies
    3. Execute trades through client notifications
    4. Log all decisions and reasoning
    5. Monitor positions for stop loss/take profit
    
    Always consider:
    - User's risk tolerance and policy constraints
    - Current market conditions and sentiment
    - Position sizing and risk management
    - Transaction costs and slippage
    - Long-term inflation-beating strategy
  `,
});
