import { ChainType } from "./orb";
import { PolicyDocument } from "./policy";
import { ThreadType } from "./threads";

export type SectorType = "live_trading" | "paper_trading";

export interface SectorSettings {
  max_concurrent_trades?: number;
  auto_rebalance_enabled?: boolean;
  emergency_stop_enabled?: boolean;
  notification_preferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

export type SectorContext = {
  sectorId: number;
  sectorName: string;
  sectorType: "live_trading" | "paper_trading";
  policy: PolicyDocument;
  orbs: Array<{
    id: number;
    name: string;
    chain: ChainType;
    context: string | null;
    assetPairs: Record<string, number> | null;
    threads: Array<{
      type: ThreadType;
      providerId: string;
      description: string | null;
      config: Record<string, any>; // Thread-specific configuration (no permissions - those come from ThreadProvider)
    }>;
  }>;
  walletBalances: Record<string, any>;
  openPositions: any[];
};
