import { ColumnType, Generated, JSONColumnType } from "kysely";

import { JournalEntryContent, JournalEntryType } from "@/types/journal";
import { PolicyDocument } from "@/types/policy";

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface SectorsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  type: "live_trading" | "paper_trading" | "conservative_defi";
  settings: JSONColumnType<Record<string, any>> | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface SectorPoliciesTable {
  id: Generated<number>;
  sector_id: number;
  policy_document: JSONColumnType<PolicyDocument>;
  version: number;
  is_active: boolean;
  ai_critique: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface OrbsTable {
  id: Generated<number>;
  sector_id: number;
  name: string;
  chain: "ethereum" | "solana" | "morph" | "stellar";
  wallet_address: string | null;
  asset_pairs: JSONColumnType<Record<string, number>> | null;
  config_json: JSONColumnType<Record<string, any>> | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface ThreadsTable {
  id: Generated<number>;
  orb_id: number;
  type: "dex" | "bridge" | "lending" | "yield_farming";
  provider: string;
  enabled: boolean;
  config_json: JSONColumnType<Record<string, any>>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface TradeActionsTable {
  id: Generated<number>;
  orb_id: number;
  trade_type: "buy" | "sell" | "swap";
  status:
    | "ANALYZING" // AI is actively processing, user can interrupt.
    | "PENDING_USER_ACTION" // AI has made a proposal, awaiting user approval/rejection.
    | "USER_INTERVENED" // User has interrupted the AI and now has control.
    | "APPROVED" // User has approved the AI's proposal.
    | "REJECTED" // User has rejected the AI's proposal (terminal state).
    | "EXECUTING" // The approved trade is being sent to the blockchain.
    | "SUCCEEDED" // The trade was successfully confirmed on-chain (terminal state).
    | "FAILED"; // The trade failed on-chain or during execution (terminal state).
  is_active: boolean;
  summary: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface TradeStrategiesTable {
  id: Generated<number>;
  trade_action_id: number;
  strategy_type: string;
  strategy_params_json: JSONColumnType<Record<string, any>>;
  is_active: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface JournalEntriesTable {
  id: Generated<number>;
  sector_id: number;
  trade_action_id: number | null;
  type: JournalEntryType;
  content: JSONColumnType<JournalEntryContent>;
  metadata: JSONColumnType<Record<string, any>> | null;
  confidence_score: number | null;
  is_internal: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface PortfolioSnapshotsTable {
  id: Generated<number>;
  sector_id: number;
  total_value: number;
  total_pnl: number;
  pnl_percentage: number;
  vs_inflation_performance: number | null;
  snapshot_date: ColumnType<Date, string, string>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface DB {
  users: UsersTable;
  sectors: SectorsTable;
  sector_policies: SectorPoliciesTable;
  orbs: OrbsTable;
  threads: ThreadsTable;
  trade_actions: TradeActionsTable;
  trade_strategies: TradeStrategiesTable;
  journal_entries: JournalEntriesTable;
  portfolio_snapshots: PortfolioSnapshotsTable;
}
