import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { PinoLogger } from "@mastra/loggers";

import { tradingAgent } from "@/services/ai-agent/agents/trading-agent";
import { AgentRuntimeContext } from "@/services/ai-agent/context";
import { startNewTradeAction } from "@/services/trading/trade-service";
import { PolicyDocument } from "@/types/policy";

// Central map to manage running agent analyses
const runningAnalyses = new Map<number, AbortController>();

export const mastra = new Mastra({
  agents: { tradingAgent },
  logger: new PinoLogger({
    name: "agentix",
    level: "info",
  }),
});

type UserContext = {
  userId: number;
  policy: {
    id: number;
    user_id: number;
    policy_document: PolicyDocument;
    version: number;
    is_active: boolean;
    ai_critique: string | null;
    created_at: Date;
  };
  walletBalances: Record<string, any>; // Placeholder
  openPositions: any[]; // Placeholder
};

export const aiAgentService = {
  async runAnalysis(userContext: UserContext) {
    const { userId, policy, walletBalances, openPositions } = userContext;

    const { id: tradeActionId } = await startNewTradeAction(userId, "buy"); // Assuming 'buy' for now

    const abortController = new AbortController();
    runningAnalyses.set(tradeActionId, abortController);

    const runtimeContext = new RuntimeContext<AgentRuntimeContext>();
    runtimeContext.set("userId", userId);
    runtimeContext.set("tradeActionId", tradeActionId);
    runtimeContext.set("policy", policy);
    runtimeContext.set("walletBalances", walletBalances);
    runtimeContext.set("openPositions", openPositions);

    console.log(
      `🤖 [ai-agent-service] Starting analysis for user ${userId}, trade action ${tradeActionId}`
    );

    try {
      const agent = mastra.getAgent("tradingAgent");
      const decision = await agent.generate(
        [
          {
            role: "user",
            content: `Analyze the market and my current portfolio status. Based on my investment policy, decide the next trading action. The user policy, wallet balances, and open positions are available in the runtime context.`,
          },
        ],
        {
          runtimeContext,
          abortSignal: abortController.signal,
          memory: {
            resource: userId.toString(),
            thread: tradeActionId.toString(),
          },
        }
      );

      console.log(
        `✅ [ai-agent-service] Analysis complete for trade action ${tradeActionId}:`,
        decision
      );
      // Process the decision...
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(
          `🛑 [ai-agent-service] Analysis for trade action ${tradeActionId} was aborted.`
        );
      } else {
        console.error(
          `❌ [ai-agent-service] Error during analysis for trade action ${tradeActionId}:`,
          error
        );
      }
    } finally {
      // Clean up the map once the analysis is complete or aborted
      runningAnalyses.delete(tradeActionId);
    }
  },

  interruptAnalysis(tradeActionId: number) {
    const abortController = runningAnalyses.get(tradeActionId);
    if (abortController) {
      console.log(
        `🛑 [ai-agent-service] Interrupting analysis for trade action ${tradeActionId}`
      );
      abortController.abort();
      // The 'finally' block in runAnalysis will handle cleanup
      return true;
    }
    console.warn(
      `⚠️ [ai-agent-service] No running analysis found for trade action ${tradeActionId} to interrupt.`
    );
    return false;
  },
};
