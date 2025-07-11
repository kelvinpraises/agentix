export type JournalEntryType =
  // Core AI Operations
  | "AI_ANALYSIS" // Market analysis, portfolio assessment
  | "AI_DECISION" // AI making autonomous decisions
  | "AI_RECOMMENDATION" // AI suggesting actions to user
  // Market & Data
  | "MARKET_DATA" // Price updates, volume, indicators
  | "TRADE_ALERT" // Urgent market opportunities
  | "RISK_ANALYSIS" // Risk assessment and monitoring
  // Strategy & Planning
  | "STRATEGY_INSIGHT" // Strategy performance and insights
  | "WHAT_IF_ANALYSIS" // Scenario planning and alternatives
  | "PORTFOLIO_REBALANCE" // Portfolio adjustment recommendations
  // Execution & Monitoring
  | "TRADE_EXECUTION" // Actual trade execution with approval flow
  | "POSITION_MONITOR" // Live position tracking and updates
  | "TRANSACTION_STATUS" // Blockchain transaction progress
  // User Interaction
  | "USER_ACTION" // User decisions (approve/reject/modify)
  | "USER_OVERRIDE" // User manually overriding AI decisions
  | "USER_FEEDBACK" // User rating or commenting on AI actions
  // System & Alerts
  | "SYSTEM_ALERT" // System notifications, errors, warnings
  | "PERFORMANCE_REPORT" // Periodic performance summaries
  | "COMPLIANCE_CHECK"; // Regulatory or risk compliance notifications

// Specific content types for each journal entry
export type JournalEntryContent =
  | AIAnalysisContent
  | AIDecisionContent
  | AIRecommendationContent
  | MarketDataContent
  | TradeAlertContent
  | RiskAnalysisContent
  | StrategyInsightContent
  | WhatIfAnalysisContent
  | PortfolioRebalanceContent
  | TradeExecutionContent
  | PositionMonitorContent
  | TransactionStatusContent
  | UserActionContent
  | UserOverrideContent
  | UserFeedbackContent
  | SystemAlertContent
  | PerformanceReportContent
  | ComplianceCheckContent;

// Content type definitions
export interface AIAnalysisContent {
  contentType: "AI_ANALYSIS";
  message: string;
  analysis_type: "market" | "portfolio" | "risk" | "sentiment";
  key_metrics?: Record<string, any>;
  confidence_score: number;
}

export interface AIDecisionContent {
  contentType: "AI_DECISION";
  message: string;
  decision_type: "hold" | "buy" | "sell" | "rebalance" | "stop_loss_adjust";
  reasoning: string;
  affected_positions?: string[];
  confidence_score: number;
}

export interface AIRecommendationContent {
  contentType: "AI_RECOMMENDATION";
  message: string;
  recommendation_type:
    | "trade"
    | "position_adjustment"
    | "risk_reduction"
    | "strategy_change";
  action_required: boolean;
  urgency: "low" | "medium" | "high";
  expires_at?: string;
}

export interface MarketDataContent {
  contentType: "MARKET_DATA";
  message: string;
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
  indicators: {
    rsi?: number;
    support?: number;
    resistance?: number;
    sentiment?: "bullish" | "bearish" | "neutral";
  };
}

export interface TradeAlertContent {
  contentType: "TRADE_ALERT";
  message: string;
  symbol: string;
  alert_type: "breakout" | "breakdown" | "volume_spike" | "price_target";
  urgency: "low" | "medium" | "high";
  time_sensitive: boolean;
  suggested_action?: string;
}

export interface RiskAnalysisContent {
  contentType: "RISK_ANALYSIS";
  message: string;
  risk_metrics: {
    portfolio_var: number;
    max_drawdown: number;
    sharpe_ratio: number;
    win_rate: number;
    avg_hold_time: string;
    risk_level: "low" | "medium" | "high";
  };
  recommendations?: string[];
}

export interface StrategyInsightContent {
  contentType: "STRATEGY_INSIGHT";
  message: string;
  strategy_name: string;
  performance_metrics: {
    past_performance: string;
    win_rate: number;
    avg_return: number;
    total_trades: number;
  };
  confidence_score: number;
  next_actions?: string[];
}

export interface WhatIfAnalysisContent {
  contentType: "WHAT_IF_ANALYSIS";
  message: string;
  scenarios: Array<{
    name: string;
    allocation: string;
    expected_return: string;
    risk_level: "low" | "medium" | "high";
    probability: number;
  }>;
  recommended_scenario?: number;
}

export interface PortfolioRebalanceContent {
  contentType: "PORTFOLIO_REBALANCE";
  message: string;
  current_allocation: Record<string, number>;
  target_allocation: Record<string, number>;
  required_actions: Array<{
    action: "buy" | "sell";
    symbol: string;
    amount: number;
    reason: string;
  }>;
  urgency: "low" | "medium" | "high";
}

export interface TradeExecutionContent {
  contentType: "TRADE_EXECUTION";
  message: string;
  trade_details: TradeProposal;
  status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
  auto_execute_in?: number;
  confidence_score: number;
}

export type TradeProposal = 
  | EnterPositionProposal
  | ExitPositionProposal
  | AdjustPositionProposal
  | SwapProposal;

export interface EnterPositionProposal {
  proposalType: "ENTER_POSITION";
  pair: string;
  fromToken: string;
  toToken: string;
  amount: string;
  chain: "ethereum" | "solana";
  dex: string;
  strategy: string;
  slippagePercent: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ExitPositionProposal {
  proposalType: "EXIT_POSITION";
  positionId: string;
  exitAmount: string; // e.g., "100%" or "0.5 SOL" or "$500"
  exitType: "FULL" | "PARTIAL" | "STOP_LOSS" | "TAKE_PROFIT";
  chain: "ethereum" | "solana";
  dex: string;
  strategy: string;
  slippagePercent: number;
  riskLevel: "low" | "medium" | "high";
}

export interface AdjustPositionProposal {
  proposalType: "ADJUST_POSITION";
  positionId: string;
  adjustmentType: "STOP_LOSS" | "TAKE_PROFIT" | "BOTH";
  newStopLossPrice?: number;
  newTakeProfitPrice?: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
}

export interface SwapProposal {
  proposalType: "SWAP";
  fromToken: string;
  toToken: string;
  amount: string;
  chain: "ethereum" | "solana";
  dex: string;
  strategy: string;
  slippagePercent: number;
  riskLevel: "low" | "medium" | "high";
}

export interface PositionMonitorContent {
  contentType: "POSITION_MONITOR";
  message: string;
  position_details: {
    token: string;
    entry_price: string;
    current_price: string;
    pnl: string;
    pnl_percent: string;
    stop_loss: string;
    take_profit: string;
    holding_time: string;
    risk_level: "low" | "medium" | "high";
    strategy: string;
  };
  alerts?: Array<{
    type: "stop_loss_hit" | "take_profit_near" | "unusual_volume";
    message: string;
    urgency: "low" | "medium" | "high";
  }>;
  confidence_score: number;
}

export interface TransactionStatusContent {
  contentType: "TRANSACTION_STATUS";
  message: string;
  transaction_hash: string;
  status: "pending" | "confirming" | "confirmed" | "failed";
  network: string;
  gas_fee?: string;
  block_number?: number;
  confirmations?: number;
  estimated_completion?: string;
}

export interface UserActionContent {
  contentType: "USER_ACTION";
  message: string;
  action_type: "approve" | "reject" | "modify" | "manual_trade" | "stop_ai" | "resume_ai";
  target_entry_id?: number; // References the journal entry they're responding to
  details?: Record<string, any>;
  timestamp: string;
}

export interface UserOverrideContent {
  contentType: "USER_OVERRIDE";
  message: string;
  override_type: "force_trade" | "cancel_trade" | "modify_limits" | "change_strategy";
  original_ai_recommendation?: string;
  user_reasoning?: string;
  risk_acknowledged: boolean;
}

export interface UserFeedbackContent {
  contentType: "USER_FEEDBACK";
  message: string;
  target_entry_id: number;
  feedback_type: "rating" | "comment" | "suggestion";
  rating?: number; // 1-5 scale
  comment?: string;
  helpful: boolean;
}

export interface SystemAlertContent {
  contentType: "SYSTEM_ALERT";
  message: string;
  alert_type: "error" | "warning" | "info" | "maintenance";
  severity: "low" | "medium" | "high" | "critical";
  requires_action: boolean;
  resolution_steps?: string[];
  error_code?: string;
}

export interface PerformanceReportContent {
  contentType: "PERFORMANCE_REPORT";
  message: string;
  report_period: string;
  metrics: {
    total_return: string;
    win_rate: number;
    total_trades: number;
    best_trade: string;
    worst_trade: string;
    sharpe_ratio: number;
    max_drawdown: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface ComplianceCheckContent {
  contentType: "COMPLIANCE_CHECK";
  message: string;
  check_type: "position_limits" | "daily_loss_limit" | "concentration_risk" | "regulatory";
  status: "passed" | "warning" | "failed";
  current_value: number;
  limit_value: number;
  required_actions?: string[];
  deadline?: string;
}
