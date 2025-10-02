import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { PinoLogger } from "@mastra/loggers";
import { MCPClient } from "@mastra/mcp";

import { tradingAgent } from "@/interfaces/neural/agents/trading-agent";
import { threadService } from "@/services/threads/thread-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContext } from "@/types/context";
import { SectorContext } from "@/types/sector";

// Central map to manage running agent analyses
const runningAnalyses = new Map<number, AbortController>();

export const mastra = new Mastra({
  agents: { tradingAgent },
  logger: new PinoLogger({
    name: "agentix",
    level: "info",
  }),
});

export const neuralAgent = {
  async runAnalysis(sectorContext: SectorContext) {
    const { sectorName, sectorId, sectorType, orbs } = sectorContext;

    const threadConfigs = orbs
      .map((orb) =>
        orb.threads.map((thread) => ({
          orbId: orb.id,
          orbName: orb.name,
          sectorId: sectorId,
          chain: orb.chain,
          type: thread.type,
          providerId: thread.providerId,
          config: thread.config,
        }))
      )
      .flat();

    // Pre-warm all threads for the orbs in this sector. This ensures lower latency
    // when the agent decides to use a specific orb during the analysis -> decision phase
    const threadPorts = await Promise.all(
      threadConfigs.map(({ orbId, sectorId, chain, providerId, config }) =>
        threadService.getOrServeThread(orbId, sectorId, chain, providerId, config)
      )
    );

    // Build dynamic MCP servers object with namespaced tools.
    // Namespace: orbName_threadType_providerId (e.g., ethereum_l1_dex_uniswap)
    const mcpServers = Object.fromEntries(
      threadConfigs.map(({ orbName, type, providerId }, index) => {
        const serverKey = `${orbName
          .toLowerCase()
          .replace(/\s+/g, "_")}_${type}_${providerId}`;
        const serverUrl = new URL(`http://localhost:${threadPorts[index].port}/mcp`);
        return [
          serverKey,
          {
            url: serverUrl,
            /* TODO: KP enable Authorization header here to mitigate xsrf -> good first issue*/
          },
        ];
      })
    );

    const threadsMCPs = new MCPClient({ servers: mcpServers });

    if (!orbs || orbs.length === 0) {
      console.warn(
        `[ai-agent-service] No orbs found for sector ${sectorName}. Skipping analysis.`
      );
      return;
    }

    const { id: tradeActionId } = await tradeActionService.startNewTradeAction(sectorId);

    const abortController = new AbortController();
    runningAnalyses.set(tradeActionId, abortController);

    const runtimeContext = new RuntimeContext<AgentRuntimeContext>();
    runtimeContext.set("tradeActionId", tradeActionId);
    runtimeContext.set("sectorId", sectorId);
    runtimeContext.set("lockedOrbId", null); // Initialize as null, set via lockOrbSelection tool

    console.log(
      `[ai-agent-service] Starting analysis for sector ${sectorName}, trade action ${tradeActionId}`
    );

    try {
      const agent = mastra.getAgent("tradingAgent");
      const decision = await agent.generate(
        [
          {
            role: "user",
            content: `Analyze the market and my current portfolio status within the "${sectorName}" sector (${sectorType}). Based on my sector policy and available orbs/threads, decide the next trading action. The sector context, policy, orbs configuration, wallet balances, and open positions are available in the runtime context. ultimately decide to run with a specific orb with better odds for the trade action. unless only a single orb is available, then run with that orb.`,
          },
        ],
        {
          toolsets: await threadsMCPs.getToolsets(),
          runtimeContext,
          abortSignal: abortController.signal,
          memory: {
            resource: `sector-${sectorName}`,
            thread: tradeActionId.toString(),
          },
        }
      );

      console.log(
        `[ai-agent-service] Analysis complete for sector ${sectorName}, trade action ${tradeActionId}:`,
        decision
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(
          `[ai-agent-service] Analysis for sector ${sectorName}, trade action ${tradeActionId} was aborted.`
        );
      } else {
        console.error(
          `[ai-agent-service] Error during analysis for sector ${sectorName}, trade action ${tradeActionId}:`,
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
        `[ai-agent-service] Interrupting analysis for trade action ${tradeActionId}`
      );
      abortController.abort();
      // The 'finally' block in runAnalysis will handle cleanup
      return true;
    }
    console.warn(
      `[ai-agent-service] No running analysis found for trade action ${tradeActionId} to interrupt.`
    );
    return false;
  },
};
