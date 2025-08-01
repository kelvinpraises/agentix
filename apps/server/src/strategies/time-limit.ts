import { StrategyContext } from "@/services/mq-worker/strategy-processor";

interface TimeLimitParams {
  minutes: number;
}

/**
 * Checks if the trade has been open for longer than the specified time limit.
 *
 * @param params - The parameters for this strategy, containing the time limit in minutes.
 * @param context - The shared context containing the trade's creation timestamp.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: TimeLimitParams,
  context: StrategyContext
): Promise<boolean> {
  const { minutes } = params;
  const { tradeCreatedAt, tradeActionId } = context;

  const now = new Date();
  const elapsedMilliseconds = now.getTime() - tradeCreatedAt.getTime();
  const elapsedMinutes = elapsedMilliseconds / (1000 * 60);

  if (elapsedMinutes >= minutes) {
    console.log(
      `[TimeLimit] Time limit of ${minutes} mins reached for trade ${tradeActionId}.`
    );
    return true;
  }

  return false;
}
