import { StrategyContext } from "@/services/mq-worker/strategy-processor";

interface RsiParams {
  period: number; // e.g., 14
  level: number; // e.g., 70 or 80
  condition: "above" | "below";
}

/**
 * Checks if the Relative Strength Index (RSI) has crossed a certain level.
 * This implementation uses pseudocode for the core TA calculation.
 *
 * @param params - The parameters for this strategy (period, level, condition).
 * @param context - The shared context containing historical market data.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: RsiParams,
  context: StrategyContext
): Promise<boolean> {
  const { period, level, condition } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < period) {
    console.warn(`[RSI] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  // --- PSEUDOCODE ---
  // In a real implementation, this section would be replaced with a call
  // to a robust library like 'ta-lib' via a Python bridge.

  // 1. Extract the closing prices from the historical data.
  const closingPrices = historicalData.map((data: any) => data.price);

  // 2. Call the external TA library to calculate the RSI.
  // const currentRsi = await pythonTaLib.rsi(closingPrices, period);
  const currentRsi = 75; // Placeholder value for demonstration

  console.log(
    `[RSI] Trade ${tradeActionId}: Current RSI(${period}) is ${currentRsi}. Condition: ${condition} ${level}.`
  );

  // --- END PSEUDOCODE ---

  if (condition === "above" && currentRsi >= level) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is above level (${level}).`
    );
    return true;
  }

  if (condition === "below" && currentRsi <= level) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is below level (${level}).`
    );
    return true;
  }

  return false;
}
