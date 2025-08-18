export interface PositionMonitorParams {
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  action: "close";
}

export interface RsiParams {
  period: number;
  overbought: number;
  oversold: number;
  action: "reassess" | "close";
  reasoning: string;
}

export interface SmaCrossParams {
  fast_period: number;
  slow_period: number;
  signal_type: "cross_up" | "cross_down" | "both";
  action: "reassess" | "close";
  reasoning: string;
}

export interface TimeLimitParams {
  duration_seconds: number;
  action: "reassess" | "close";
  reasoning: string;
}

export type StrategyParams = PositionMonitorParams | RsiParams | SmaCrossParams | TimeLimitParams;

export interface StrategyContext {
  tradeActionId: number;
  userId: number;
  sectorId: number;
  assetId: string;
  currentPrice: number;
  tradeCreatedAt: Date;
  historicalData?: any;
}