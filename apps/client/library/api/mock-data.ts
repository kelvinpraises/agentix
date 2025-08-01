import type {
  User,
  Trade,
  PortfolioSnapshot,
  JournalEntry,
  AIDecision,
  UserPolicy,
  DashboardMetrics,
  AIActivity,
  TradingStatus,
  PerformanceMetrics,
  JournalEntryContent,
  AIAnalysisContent,
  AIDecisionContent,
  TradeExecutionContent,
  PositionMonitorContent,
  MarketDataContent,
} from "./types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "demo@agentix.com",
    walletAddressEth: "0x742d35Cc6634C0532925a3b8D4C2C4e0C8b4C8b4",
    walletAddressSol: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
];

// Current authenticated user
export const mockCurrentUser = mockUsers[0];
// Mock Portfolio Snapshots
export const mockPortfolioSnapshots: PortfolioSnapshot[] = [
  {
    id: "1",
    userId: "1",
    totalValue: 125000.5,
    totalPnl: 25000.5,
    pnlPercentage: 25.0,
    vsInflationPerformance: 18.2,
    snapshotDate: "2024-01-20",
    createdAt: "2024-01-20T00:00:00Z",
  },
  {
    id: "2",
    userId: "1",
    totalValue: 118500.25,
    totalPnl: 18500.25,
    pnlPercentage: 18.5,
    vsInflationPerformance: 11.7,
    snapshotDate: "2024-01-19",
    createdAt: "2024-01-19T00:00:00Z",
  },
  {
    id: "3",
    userId: "1",
    totalValue: 110000.0,
    totalPnl: 10000.0,
    pnlPercentage: 10.0,
    vsInflationPerformance: 3.2,
    snapshotDate: "2024-01-18",
    createdAt: "2024-01-18T00:00:00Z",
  },
]; // Mock Trades
export const mockTrades: Trade[] = [
  {
    id: "1",
    userId: "1",
    tradeType: "buy",
    status: "COMPLETED",
    isActive: false,
    summary: "Bought 2.5 ETH at $2,450 - AI detected strong support level",
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-20T14:35:00Z",
  },
  {
    id: "2",
    userId: "1",
    tradeType: "sell",
    status: "EXECUTING",
    isActive: true,
    summary: "Selling 100 SOL at $98.50 - Taking profit at resistance",
    createdAt: "2024-01-20T16:15:00Z",
    updatedAt: "2024-01-20T16:15:00Z",
  },
  {
    id: "3",
    userId: "1",
    tradeType: "swap",
    status: "PROPOSED",
    isActive: true,
    summary: "Swap 1000 USDC to BTC - Market momentum shift detected",
    createdAt: "2024-01-20T17:00:00Z",
    updatedAt: "2024-01-20T17:00:00Z",
  },
]; // Mock AI Decisions
export const mockAIDecisions: AIDecision[] = [
  {
    id: "1",
    userId: "1",
    decisionType: "trade",
    reasoning:
      "RSI oversold condition combined with strong volume support at $2,400 level. Historical data shows 78% success rate for similar setups.",
    confidenceScore: 0.85,
    marketConditions: {
      rsi: 28.5,
      volume: "high",
      support_level: 2400,
      sentiment: "bullish",
    },
    userPolicySnapshot: {
      max_position_size: 0.25,
      stop_loss: 0.05,
    },
    tradeId: "1",
    mastraSessionId: "session_123",
    createdAt: "2024-01-20T14:25:00Z",
  },
  {
    id: "2",
    userId: "1",
    decisionType: "hold",
    reasoning:
      "Current market volatility exceeds user risk tolerance. Waiting for clearer trend confirmation.",
    confidenceScore: 0.72,
    marketConditions: {
      volatility: "high",
      trend: "uncertain",
    },
    userPolicySnapshot: {
      risk_tolerance: "medium",
    },
    createdAt: "2024-01-20T15:45:00Z",
  },
]; //Mock User Policy
export const mockUserPolicy: UserPolicy = {
  id: "1",
  userId: "1",
  policyDocument: {
    risk_management: {
      max_position_size_percent: 25,
      stop_loss_percent: 5,
      take_profit_percent: 15,
      max_drawdown_percent: 10,
      daily_loss_limit: 1000,
    },
    trading_preferences: {
      frequency_minutes: 60,
      enabled_markets: ["ETH/USDC", "SOL/USDC", "BTC/USDC"],
      preferred_exchanges: ["Uniswap", "Jupiter", "1inch"],
      max_slippage_percent: 1,
      base_currency: {
        ethereum: "USDC",
        solana: "USDC",
      },
    },
    investment_strategy: {
      strategy_type: "balanced_mix",
      dca_percentage: 30,
      momentum_percentage: 70,
      yield_farming_enabled: true,
      target_annual_return: 25,
    },
  },
  version: 1,
  isActive: true,
  aiCritique:
    "Your current strategy shows good risk management. Consider increasing DCA allocation during high volatility periods.",
  createdAt: "2024-01-15T10:30:00Z",
}; // Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  totalValue: 125000.5,
  totalPnl: 25000.5,
  pnlPercentage: 25.0,
  vsInflationPerformance: 18.2,
  activeTrades: 2,
  winRate: 78.5,
  avgHoldTime: "4.2 days",
  bestTrade: "+$3,250 (ETH)",
  worstTrade: "-$450 (SOL)",
};

// Mock AI Activity
export const mockAIActivity: AIActivity[] = [
  {
    id: "1",
    type: "decision",
    message: "Executed buy order for 2.5 ETH at $2,450",
    confidenceScore: 0.85,
    timestamp: "2024-01-20T14:35:00Z",
    metadata: { symbol: "ETH", amount: 2.5, price: 2450 },
  },
  {
    id: "2",
    type: "analysis",
    message: "Market analysis complete: Bullish momentum detected",
    confidenceScore: 0.78,
    timestamp: "2024-01-20T14:20:00Z",
    metadata: { trend: "bullish", strength: "strong" },
  },
  {
    id: "3",
    type: "recommendation",
    message: "Recommend taking profit on SOL position",
    confidenceScore: 0.72,
    timestamp: "2024-01-20T16:10:00Z",
    metadata: { symbol: "SOL", action: "take_profit" },
  },
]; // Mock Trading Status
export const mockTradingStatus: TradingStatus = {
  isActive: true,
  pausedAt: undefined,
  pauseReason: undefined,
  nextResumeAt: undefined,
};

// Mock Performance Metrics
export const mockPerformanceMetrics: PerformanceMetrics = {
  totalReturn: 25.0,
  annualizedReturn: 32.5,
  sharpeRatio: 1.85,
  maxDrawdown: 8.2,
  winRate: 78.5,
  totalTrades: 47,
  avgTradeReturn: 2.3,
  bestTrade: 12.8,
  worstTrade: -3.2,
  inflationBeatRate: 18.2,
}; //Mock Journal Entry Content
const mockAIAnalysisContent: AIAnalysisContent = {
  contentType: "AI_ANALYSIS",
  message: "Market analysis shows strong bullish momentum for ETH",
  analysis_type: "market",
  key_metrics: {
    rsi: 28.5,
    volume_ratio: 1.8,
    support_level: 2400,
  },
  confidence_score: 0.85,
};

const mockAIDecisionContent: AIDecisionContent = {
  contentType: "AI_DECISION",
  message: "Decision to buy 2.5 ETH at current price levels",
  decision_type: "buy",
  reasoning: "RSI oversold, strong volume support, favorable risk/reward ratio",
  affected_positions: ["ETH/USDC"],
  confidence_score: 0.85,
};

const mockTradeExecutionContent: TradeExecutionContent = {
  contentType: "TRADE_EXECUTION",
  message: "Executing buy order for 2.5 ETH",
  trade_details: {
    proposalType: "ENTER_POSITION",
    pair: "ETH/USDC",
    fromToken: "USDC",
    toToken: "ETH",
    amount: "6125.00",
    chain: "ethereum",
    dex: "Uniswap",
    strategy: "momentum_buy",
    slippagePercent: 0.5,
    stopLossPrice: 2327.5,
    takeProfitPrice: 2817.5,
    riskLevel: "medium",
  },
  status: "executing",
  confidence_score: 0.85,
};
// Mock Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: "1",
    userId: "1",
    tradeActionId: "1",
    type: "AI_ANALYSIS",
    content: mockAIAnalysisContent,
    metadata: { symbol: "ETH", timeframe: "1h" },
    confidenceScore: 0.85,
    isInternal: false,
    createdAt: "2024-01-20T14:20:00Z",
  },
  {
    id: "2",
    userId: "1",
    tradeActionId: "1",
    type: "AI_DECISION",
    content: mockAIDecisionContent,
    metadata: { decision_id: "dec_123" },
    confidenceScore: 0.85,
    isInternal: false,
    createdAt: "2024-01-20T14:25:00Z",
  },
  {
    id: "3",
    userId: "1",
    tradeActionId: "1",
    type: "TRADE_EXECUTION",
    content: mockTradeExecutionContent,
    metadata: { execution_id: "exec_456" },
    confidenceScore: 0.85,
    isInternal: false,
    createdAt: "2024-01-20T14:30:00Z",
  },
];
// Mock Data Generators
export const generateMockPortfolioHistory = (days: number = 30): PortfolioSnapshot[] => {
  const snapshots: PortfolioSnapshot[] = [];
  const baseValue = 100000;
  let currentValue = baseValue;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Simulate portfolio growth with some volatility
    const dailyChange = (Math.random() - 0.4) * 0.05; // Slight upward bias
    currentValue *= 1 + dailyChange;

    const pnl = currentValue - baseValue;
    const pnlPercentage = (pnl / baseValue) * 100;
    const vsInflation = pnlPercentage - 6.8; // Assuming 6.8% inflation

    snapshots.push({
      id: `hist_${i}`,
      userId: "1",
      totalValue: Math.round(currentValue * 100) / 100,
      totalPnl: Math.round(pnl * 100) / 100,
      pnlPercentage: Math.round(pnlPercentage * 100) / 100,
      vsInflationPerformance: Math.round(vsInflation * 100) / 100,
      snapshotDate: date.toISOString().split("T")[0],
      createdAt: date.toISOString(),
    });
  }

  return snapshots;
};
export const generateMockTrades = (count: number = 20): Trade[] => {
  const trades: Trade[] = [];
  const tradeTypes: Trade["tradeType"][] = ["buy", "sell", "swap"];
  const statuses: Trade["status"][] = ["COMPLETED", "EXECUTING", "PROPOSED", "FAILED"];
  const symbols = ["ETH", "SOL", "BTC", "USDC", "MATIC"];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i * 2);

    // Use deterministic selection based on index for consistency
    const tradeType = tradeTypes[i % tradeTypes.length];
    const status = statuses[i % statuses.length];
    const symbol = symbols[i % symbols.length];

    trades.push({
      id: `${i + 1}`, // Simple numeric IDs that match URL params
      userId: "1",
      tradeType,
      status,
      isActive: status === "EXECUTING" || status === "PROPOSED",
      summary: `${
        tradeType.charAt(0).toUpperCase() + tradeType.slice(1)
      } ${symbol} - AI detected opportunity`,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }

  return trades;
};

export const generateMockAIActivity = (count: number = 10): AIActivity[] => {
  const activities: AIActivity[] = [];
  const types: AIActivity["type"][] = [
    "analysis",
    "decision",
    "recommendation",
    "execution",
  ];
  const messages = [
    "Market analysis complete: Strong bullish momentum",
    "Executed buy order successfully",
    "Risk assessment: Low volatility detected",
    "Recommendation: Take profit on current position",
    "Portfolio rebalancing suggested",
    "Stop-loss triggered for protection",
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 15);

    activities.push({
      id: `activity_${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      confidenceScore: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
      timestamp: date.toISOString(),
      metadata: { generated: true },
    });
  }

  return activities;
};

export const generateMockJournalEntries = (
  tradeId: string,
  count: number = 15
): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const entryTypes = [
    "AI_ANALYSIS",
    "AI_DECISION",
    "TRADE_EXECUTION",
    "MARKET_DATA",
    "RISK_ANALYSIS",
    "POSITION_MONITOR",
  ];
  const symbols = ["ETH", "SOL", "BTC", "USDC", "MATIC"];
  const chains = ["ethereum", "solana"] as const;
  const dexes = ["Uniswap", "Jupiter", "1inch"];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 5);

    const entryType = entryTypes[i % entryTypes.length]; // Use deterministic selection for consistency
    const symbol = symbols[i % symbols.length];

    let content: JournalEntryContent;

    switch (entryType) {
      case "AI_ANALYSIS":
        content = {
          contentType: "AI_ANALYSIS",
          message: `Market analysis for ${symbol}: ${
            i % 2 === 0 ? "Bullish momentum detected" : "Consolidation phase identified"
          }`,
          analysis_type: ["market", "portfolio", "risk", "sentiment"][i % 4] as any,
          key_metrics: {
            rsi: Math.round((20 + Math.random() * 60) * 10) / 10,
            volume_ratio: Math.round((0.8 + Math.random() * 1.4) * 10) / 10,
            support_level: Math.round(2000 + Math.random() * 1000),
            resistance_level: Math.round(3000 + Math.random() * 1000),
          },
          confidence_score: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
        } as AIAnalysisContent;
        break;

      case "AI_DECISION":
        const decisionTypes = ["buy", "sell", "hold", "rebalance"] as const;
        content = {
          contentType: "AI_DECISION",
          message: `AI recommends ${decisionTypes[i % 4]} action for ${symbol}`,
          decision_type: decisionTypes[i % 4],
          reasoning: `Technical indicators show ${
            i % 2 === 0 ? "strong bullish signals" : "risk management trigger"
          }. RSI at optimal levels.`,
          affected_positions: [`${symbol}/USDC`],
          confidence_score: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
        } as AIDecisionContent;
        break;

      case "TRADE_EXECUTION":
        content = {
          contentType: "TRADE_EXECUTION",
          message: `Executing ${i % 2 === 0 ? "buy" : "sell"} order for ${symbol}`,
          trade_details: {
            proposalType: "ENTER_POSITION",
            pair: `${symbol}/USDC`,
            fromToken: "USDC",
            toToken: symbol,
            amount: `${(Math.random() * 5000 + 1000).toFixed(2)}`,
            chain: chains[i % 2],
            dex: dexes[i % 3],
            strategy: "momentum_trading",
            slippagePercent: 0.5,
            stopLossPrice: Math.round((2000 + Math.random() * 500) * 100) / 100,
            takeProfitPrice: Math.round((3000 + Math.random() * 500) * 100) / 100,
            riskLevel: ["low", "medium", "high"][i % 3] as any,
          },
          status: ["pending", "approved", "executing", "completed"][i % 4] as any,
          confidence_score: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
        } as TradeExecutionContent;
        break;

      default:
        content = {
          contentType: "AI_ANALYSIS",
          message: `System monitoring ${symbol} position`,
          analysis_type: "portfolio",
          key_metrics: {
            current_price: Math.round((2000 + Math.random() * 1000) * 100) / 100,
            price_change_24h: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
          },
          confidence_score: 0.8,
        } as AIAnalysisContent;
    }

    entries.push({
      id: `journal_${tradeId}_${i}`,
      userId: "1",
      tradeActionId: tradeId,
      type: entryType,
      content,
      metadata: {
        generated: true,
        sequence: i,
        symbol,
        timestamp: date.toISOString(),
      },
      confidenceScore: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
      isInternal: false,
      createdAt: date.toISOString(),
    });
  }

  return entries.reverse(); // Show oldest first
};
