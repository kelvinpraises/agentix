import { SmaCrossParams, StrategyContext } from "@/types/strategy";

/**
 * Checks for a crossover between two Simple Moving Averages (SMAs).
 * This implementation uses pseudocode for the core TA calculation.
 *
 * @param params - The parameters for this strategy (periods, condition).
 * @param context - The shared context containing historical market data.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: SmaCrossParams,
  context: StrategyContext
): Promise<boolean> {
  const { fast_period, slow_period, signal_type } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < slow_period) {
    console.warn(`[SMACross] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  // --- PSEUDOCODE ---
  // In a real implementation, this section would be replaced with calls
  // to a robust library like 'ta-lib' via a Python bridge.

  // 1. Extract the closing prices from the historical data.
  // const closingPrices = historicalData.map((data: any) => data.price);

  // 2. Call the external TA library to calculate both SMAs.
  // const fastSma = await pythonTaLib.sma(closingPrices, fast_period);
  // const slowSma = await pythonTaLib.sma(closingPrices, slow_period);
  const fastSma = [50, 52]; // Placeholder values for demonstration
  const slowSma = [51, 51]; // Placeholder values for demonstration

  // 3. Get the most recent two values for each SMA to check for a cross.
  const lastFastSma = fastSma[fastSma.length - 1];
  const prevFastSma = fastSma[fastSma.length - 2];
  const lastSlowSma = slowSma[slowSma.length - 1];
  const prevSlowSma = slowSma[slowSma.length - 2];

  console.log(
    `[SMACross] Trade ${tradeActionId}: Fast SMA: ${lastFastSma}, Slow SMA: ${lastSlowSma}.`
  );
  // --- END PSEUDOCODE ---

  // Check for bearish cross down (fast crosses below slow)
  const crossDown = (prevFastSma >= prevSlowSma && lastFastSma < lastSlowSma);
  
  // Check for bullish cross up (fast crosses above slow)  
  const crossUp = (prevFastSma <= prevSlowSma && lastFastSma > lastSlowSma);
  
  if ((signal_type === "cross_down" || signal_type === "both") && crossDown) {
    console.log(
      `[SMACross] BEARISH EXIT condition met for trade ${tradeActionId}: Fast SMA crossed below Slow SMA.`
    );
    return true;
  }

  if ((signal_type === "cross_up" || signal_type === "both") && crossUp) {
    console.log(
      `[SMACross] BULLISH EXIT condition met for trade ${tradeActionId}: Fast SMA crossed above Slow SMA.`
    );
    return true;
  }

  return false;
}
