import { ColumnType, Generated, JSONColumnType } from "kysely";

import { JournalEntryContent, JournalEntryType } from "@/types/journal";

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  wallet_address_eth: string | null;
  wallet_address_sol: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface UserPoliciesTable {
  id: Generated<number>;
  user_id: number;
  policy_document: JSONColumnType<{ [key: string]: any }>;
  version: number;
  is_active: boolean;
  ai_critique: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface TradeActionsTable {
  id: Generated<number>;
  user_id: number;
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

export interface JournalEntriesTable {
  id: Generated<number>;
  user_id: number;
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
  user_id: number;
  total_value: number;
  total_pnl: number;
  pnl_percentage: number;
  vs_inflation_performance: number | null;
  snapshot_date: ColumnType<Date, string, string>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface DB {
  users: UsersTable;
  user_policies: UserPoliciesTable;
  trade_actions: TradeActionsTable;
  journal_entries: JournalEntriesTable;
  portfolio_snapshots: PortfolioSnapshotsTable;
}
