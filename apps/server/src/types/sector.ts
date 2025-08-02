export type SectorType = "live_trading" | "paper_trading" | "conservative_defi";

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