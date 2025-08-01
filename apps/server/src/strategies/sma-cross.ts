import { StrategyContext } from "@/services/mq-worker/strategy-processor";

interface SmaCrossParams {
  shortPeriod: number; // e.g., 9
  longPeriod: number; // e.g., 21
  condition: "short_crosses_above_long" | "short_crosses_below_long";
}

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
  const { shortPeriod, longPeriod, condition } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < longPeriod) {
    console.warn(`[SMACross] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  // --- PSEUDOCODE ---
  // In a real implementation, this section would be replaced with calls
  // to a robust library like 'ta-lib' via a Python bridge.

  // 1. Extract the closing prices from the historical data.
  const closingPrices = historicalData.map((data: any) => data.price);

  // 2. Call the external TA library to calculate both SMAs.
  // const shortSma = await pythonTaLib.sma(closingPrices, shortPeriod);
  // const longSma = await pythonTaLib.sma(closingPrices, longPeriod);
  const shortSma = [50, 52]; // Placeholder values for demonstration
  const longSma = [51, 51]; // Placeholder values for demonstration

  // 3. Get the most recent two values for each SMA to check for a cross.
  const lastShortSma = shortSma[shortSma.length - 1];
  const prevShortSma = shortSma[shortSma.length - 2];
  const lastLongSma = longSma[longSma.length - 1];
  const prevLongSma = longSma[longSma.length - 2];

  console.log(
    `[SMACross] Trade ${tradeActionId}: Short SMA: ${lastShortSma}, Long SMA: ${lastLongSma}.`
  );
  // --- END PSEUDOCODE ---

  if (
    condition === "short_crosses_below_long" &&
    prevShortSma >= prevLongSma && // Previously it was above or equal
    lastShortSma < lastLongSma // Now it is below
  ) {
    console.log(
      `[SMACross] BEARISH EXIT condition met for trade ${tradeActionId}: Short SMA crossed below Long SMA.`
    );
    return true;
  }

  if (
    condition === "short_crosses_above_long" &&
    prevShortSma <= prevLongSma && // Previously it was below or equal
    lastShortSma > lastLongSma // Now it is above
  ) {
    console.log(
      `[SMACross] BULLISH EXIT condition met for trade ${tradeActionId}: Short SMA crossed above Long SMA.`
    );
    return true;
  }

  return false;
}
