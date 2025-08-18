import { RsiParams, StrategyContext } from "@/types/strategy";

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
  const { period, overbought, oversold } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < period) {
    console.warn(`[RSI] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  // --- PSEUDOCODE ---
  // In a real implementation, this section would be replaced with a call
  // to a robust library like 'ta-lib' via a Python bridge.

  // 1. Extract the closing prices from the historical data.
  // const closingPrices = historicalData.map((data: any) => data.price);

  // 2. Call the external TA library to calculate the RSI.
  // const currentRsi = await pythonTaLib.rsi(closingPrices, period);
  const currentRsi = 75; // Placeholder value for demonstration

  console.log(
    `[RSI] Trade ${tradeActionId}: Current RSI(${period}) is ${currentRsi}. Overbought: ${overbought}, Oversold: ${oversold}.`
  );

  // --- END PSEUDOCODE ---

  // Check for overbought condition (potential sell signal)
  if (currentRsi >= overbought) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is overbought (>= ${overbought}).`
    );
    return true;
  }

  // Check for oversold condition (potential buy signal, but we only do spot trading exits)
  if (currentRsi <= oversold) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is oversold (<= ${oversold}).`
    );
    return true;
  }

  return false;
}
