import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { PinoLogger } from "@mastra/loggers";

import { tradingAgent } from "@/interfaces/neural/agents/trading-agent";
import { startNewTradeAction } from "@/services/trading/trade-service";
import { AgentRuntimeContext } from "@/types/context";
import { ChainType } from "@/types/orb";
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

type SectorContext = {
  sectorId: number;
  sectorName: string;
  sectorType: "live_trading" | "paper_trading";
  policy: PolicyDocument;
  orbs: Array<{
    id: number;
    name: string;
    chain: ChainType;
    assetPairs: Record<string, number> | null;
    threads: Array<{
      type: "dex" | "bridge" | "lending" | "yield_farming";
      provider: string;
      config: Record<string, any>;
    }>;
  }>;
  walletBalances: Record<string, any>;
  openPositions: any[];
};

export const aiAgentService = {
  async runAnalysis(sectorContext: SectorContext) {
    const { sectorName, sectorId, sectorType, orbs } = sectorContext;

    if (!orbs || orbs.length === 0) {
      console.warn(
        `⚠️ [ai-agent-service] No orbs found for sector ${sectorName}. Skipping analysis.`
      );
      return;
    }

    const { id: tradeActionId } = await startNewTradeAction(sectorId);

    const abortController = new AbortController();
    runningAnalyses.set(tradeActionId, abortController);

    const runtimeContext = new RuntimeContext<AgentRuntimeContext>();
    runtimeContext.set("tradeActionId", tradeActionId);
    runtimeContext.set("sectorId", sectorId);

    console.log(
      `🤖 [ai-agent-service] Starting analysis for sector ${sectorName}, trade action ${tradeActionId}`
    );

    try {
      const agent = mastra.getAgent("tradingAgent");
      const decision = await agent.generate(
        [
          {
            role: "user",
            content: `Analyze the market and my current portfolio status within the "${sectorName}" sector (${sectorType}). Based on my sector policy and available orbs/threads, decide the next trading action. The sector context, policy, orbs configuration, wallet balances, and open positions are available in the runtime context. ultimately decide to run with a specific orb with better odds for the trade action. unless only a sinlge orb is available, then run with that orb.`,
          },
        ],
        {
          runtimeContext,
          abortSignal: abortController.signal,
          memory: {
            resource: `sector-${sectorName}`,
            thread: tradeActionId.toString(),
          },
        }
      );

      console.log(
        `✅ [ai-agent-service] Analysis complete for sector ${sectorName}, trade action ${tradeActionId}:`,
        decision
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(
          `🛑 [ai-agent-service] Analysis for sector ${sectorName}, trade action ${tradeActionId} was aborted.`
        );
      } else {
        console.error(
          `❌ [ai-agent-service] Error during analysis for sector ${sectorName}, trade action ${tradeActionId}:`,
          error
        );
      }
    } finally {
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
