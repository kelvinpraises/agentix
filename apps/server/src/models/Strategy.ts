import { Insertable, Selectable, Updateable } from "kysely";
import { StrategiesTable } from "@/infrastructure/database/schema";

export interface StrategyRevision {
  code: string;
  created_at: string;
  results: {
    metrics: {
      total_return: number;
      sharpe_ratio: number;
      max_drawdown: number;
      win_rate: number;
      total_trades: number;
    } | null;
    html_report: string | null;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
  } | null;
}

export type Strategy = Selectable<StrategiesTable>;
export type NewStrategy = Insertable<StrategiesTable>;
export type StrategyUpdate = Updateable<StrategiesTable>;