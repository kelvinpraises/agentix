// Re-export journal types from server
export type {
  JournalEntryType,
  JournalEntryContent,
  UserActionContent,
  UserFeedbackContent,
  TradeProposal,
  EnterPositionProposal,
  ExitPositionProposal,
  AdjustPositionProposal,
  SwapProposal,
  AIAnalysisContent,
  AIDecisionContent,
  AIRecommendationContent,
  MarketDataContent,
  TradeAlertContent,
  RiskAnalysisContent,
  StrategyInsightContent,
  WhatIfAnalysisContent,
  PortfolioRebalanceContent,
  TradeExecutionContent,
  PositionMonitorContent,
  TransactionStatusContent,
  UserOverrideContent,
  SystemAlertContent,
  PerformanceReportContent,
  ComplianceCheckContent,
} from "../../../../server/src/types/journal";

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  walletAddressEth?: string;
  walletAddressSol?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  walletAddressEth?: string;
  walletAddressSol?: string;
}

// Trading and Portfolio Types
export interface Trade {
  id: string;
  userId: string;
  tradeType: 'buy' | 'sell' | 'swap';
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  isActive: boolean;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeStrategy {
  id: string;
  tradeActionId: string;
  strategyType: string;
  strategyParamsJson: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValue: number;
  totalPnl: number;
  pnlPercentage: number;
  vsInflationPerformance?: number;
  snapshotDate: string;
  createdAt: string;
}

// Journal Entry Types
export interface JournalEntry {
  id: string;
  userId: string;
  tradeActionId?: string;
  type: string;
  content: JournalEntryContent;
  metadata?: Record<string, any>;
  confidenceScore?: number;
  isInternal: boolean;
  createdAt: string;
}

// AI Decision Types
export interface AIDecision {
  id: string;
  userId: string;
  decisionType: 'trade' | 'hold' | 'rebalance';
  reasoning: string;
  confidenceScore: number;
  marketConditions: Record<string, any>;
  userPolicySnapshot: Record<string, any>;
  tradeId?: string;
  mastraSessionId?: string;
  createdAt: string;
}

// User Policy Types
export interface UserPolicy {
  id: string;
  userId: string;
  policyDocument: {
    risk_management: {
      max_position_size_percent: number;
      stop_loss_percent: number;
      take_profit_percent: number;
      max_drawdown_percent: number;
      daily_loss_limit: number;
    };
    trading_preferences: {
      frequency_minutes: number;
      enabled_markets: string[];
      preferred_exchanges: string[];
      max_slippage_percent: number;
      base_currency: {
        ethereum: string;
        solana: string;
      };
    };
    investment_strategy: {
      strategy_type: 'conservative' | 'balanced_mix' | 'aggressive';
      dca_percentage: number;
      momentum_percentage: number;
      yield_farming_enabled: boolean;
      target_annual_return: number;
    };
  };
  version: number;
  isActive: boolean;
  aiCritique?: string;
  createdAt: string;
}

// API Response Wrappers
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard specific types
export interface DashboardMetrics {
  totalValue: number;
  totalPnl: number;
  pnlPercentage: number;
  vsInflationPerformance: number;
  activeTrades: number;
  winRate: number;
  avgHoldTime: string;
  bestTrade: string;
  worstTrade: string;
}

export interface AIActivity {
  id: string;
  type: 'analysis' | 'decision' | 'recommendation' | 'execution';
  message: string;
  confidenceScore: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Trading Controls
export interface TradingStatus {
  isActive: boolean;
  pausedAt?: string;
  pauseReason?: string;
  nextResumeAt?: string;
}

// Performance Metrics
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgTradeReturn: number;
  bestTrade: number;
  worstTrade: number;
  inflationBeatRate: number;
}