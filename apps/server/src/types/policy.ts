import { z } from "zod";

export const policyDocumentSchema = z.object({
  risk_management: z
    .object({
      max_position_size_percent: z.number().optional(),
      stop_loss_percent: z.number().optional(),
      take_profit_percent: z.number().optional(),
      max_drawdown_percent: z.number().optional(),
      daily_loss_limit: z.number().optional(),
    })
    .optional(),
  trading_preferences: z
    .object({
      frequency_minutes: z.number().optional(),
      enabled_markets: z.array(z.string()).optional(),
      preferred_exchanges: z.array(z.string()).optional(),
      max_slippage_percent: z.number().optional(),
      base_currency: z
        .object({
          ethereum: z.string().optional(),
          solana: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  investment_strategy: z
    .object({
      strategy_type: z.enum(["conservative", "balanced_mix", "aggressive"]).optional(),
      dca_percentage: z.number().optional(),
      momentum_percentage: z.number().optional(),
      yield_farming_enabled: z.boolean().optional(),
      target_annual_return: z.number().optional(),
    })
    .optional(),
});

export type PolicyDocument = z.infer<typeof policyDocumentSchema>;
