"use client";

import { useState } from "react";
import { usePolicy, usePolicyMutations } from "@/library/api/hooks/use-policy";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Switch } from "@/library/components/atoms/switch";
import { Separator } from "@/library/components/atoms/separator";
import { Badge } from "@/library/components/atoms/badge";
import { Skeleton } from "@/library/components/atoms/skeleton";
import {
  Shield,
  Settings,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";
import type { UserPolicy } from "@/library/api/types";

export default function PoliciesPage() {
  const { data: policy, isLoading } = usePolicy();
  const { updatePolicy, isUpdating } = usePolicyMutations();

  const [formData, setFormData] = useState<UserPolicy["policyDocument"] | null>(null);

  // Initialize form data when policy loads
  if (policy && !formData) {
    setFormData(policy.policyDocument);
  }

  const handleSave = () => {
    if (formData) {
      updatePolicy(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">Trading Policies</h1>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!policy || !formData) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">Trading Policies</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load policy configuration</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Policies</h1>
          <p className="text-muted-foreground">
            Configure your AI trading parameters and risk management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            Version {policy.version}
          </Badge>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* AI Policy Critique */}
      <AIPolicyCritique critique={policy.aiCritique} />

      {/* Risk Management - Primary */}
      <RiskManagementSection
        data={formData.risk_management}
        onChange={(data) => setFormData({ ...formData, risk_management: data })}
      />

      {/* Trading Preferences - Secondary */}
      <TradingPreferencesSection
        data={formData.trading_preferences}
        onChange={(data) => setFormData({ ...formData, trading_preferences: data })}
      />

      {/* Investment Strategy - Secondary */}
      <InvestmentStrategySection
        data={formData.investment_strategy}
        onChange={(data) => setFormData({ ...formData, investment_strategy: data })}
      />
    </div>
  );
}
function AIPolicyCritique({ critique }: { critique?: string }) {
  if (!critique) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Brain className="h-5 w-5" />
          AI Policy Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {critique}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
function RiskManagementSection({
  data,
  onChange,
}: {
  data: UserPolicy["policyDocument"]["risk_management"];
  onChange: (data: UserPolicy["policyDocument"]["risk_management"]) => void;
}) {
  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-red-500" />
          Risk Management
          <Badge variant="secondary" className="text-xs">
            Primary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Core risk parameters that protect your capital on every trade
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="max-position">Maximum Position Size (%)</Label>
            <Input
              id="max-position"
              type="number"
              value={data.max_position_size_percent}
              onChange={(e) =>
                onChange({
                  ...data,
                  max_position_size_percent: Number(e.target.value),
                })
              }
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Maximum percentage of portfolio to risk on a single trade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop-loss">Stop Loss (%)</Label>
            <Input
              id="stop-loss"
              type="number"
              value={data.stop_loss_percent}
              onChange={(e) =>
                onChange({
                  ...data,
                  stop_loss_percent: Number(e.target.value),
                })
              }
              min="0.1"
              max="50"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Automatic exit when position loses this percentage
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="take-profit">Take Profit (%)</Label>
            <Input
              id="take-profit"
              type="number"
              value={data.take_profit_percent}
              onChange={(e) =>
                onChange({
                  ...data,
                  take_profit_percent: Number(e.target.value),
                })
              }
              min="1"
              max="1000"
            />
            <p className="text-xs text-muted-foreground">
              Automatic exit when position gains this percentage
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-drawdown">Maximum Drawdown (%)</Label>
            <Input
              id="max-drawdown"
              type="number"
              value={data.max_drawdown_percent}
              onChange={(e) =>
                onChange({
                  ...data,
                  max_drawdown_percent: Number(e.target.value),
                })
              }
              min="1"
              max="50"
            />
            <p className="text-xs text-muted-foreground">
              Stop all trading if portfolio drops this much
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="daily-limit">Daily Loss Limit ($)</Label>
          <Input
            id="daily-limit"
            type="number"
            value={data.daily_loss_limit}
            onChange={(e) =>
              onChange({
                ...data,
                daily_loss_limit: Number(e.target.value),
              })
            }
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Stop trading for the day after losing this amount
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
function TradingPreferencesSection({
  data,
  onChange,
}: {
  data: UserPolicy["policyDocument"]["trading_preferences"];
  onChange: (data: UserPolicy["policyDocument"]["trading_preferences"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          Trading Preferences
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure how and where the AI executes trades
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="frequency">Trading Frequency (minutes)</Label>
            <Select
              value={data.frequency_minutes.toString()}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  frequency_minutes: Number(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="1440">Daily</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often the AI checks for trading opportunities
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slippage">Maximum Slippage (%)</Label>
            <Input
              id="slippage"
              type="number"
              value={data.max_slippage_percent}
              onChange={(e) =>
                onChange({
                  ...data,
                  max_slippage_percent: Number(e.target.value),
                })
              }
              min="0.1"
              max="10"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Maximum price difference acceptable during execution
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Enabled Markets</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["ETH/USDC", "SOL/USDC", "BTC/USDC", "MATIC/USDC", "AVAX/USDC"].map(
                (market) => (
                  <Badge
                    key={market}
                    variant={data.enabled_markets.includes(market) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newMarkets = data.enabled_markets.includes(market)
                        ? data.enabled_markets.filter((m) => m !== market)
                        : [...data.enabled_markets, market];
                      onChange({ ...data, enabled_markets: newMarkets });
                    }}
                  >
                    {market}
                  </Badge>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to enable/disable trading pairs
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Preferred Exchanges</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Uniswap", "Jupiter", "1inch", "SushiSwap", "PancakeSwap"].map(
                (exchange) => (
                  <Badge
                    key={exchange}
                    variant={
                      data.preferred_exchanges.includes(exchange) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      const newExchanges = data.preferred_exchanges.includes(exchange)
                        ? data.preferred_exchanges.filter((e) => e !== exchange)
                        : [...data.preferred_exchanges, exchange];
                      onChange({ ...data, preferred_exchanges: newExchanges });
                    }}
                  >
                    {exchange}
                  </Badge>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to enable/disable exchanges for trading
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Ethereum Base Currency</Label>
            <Select
              value={data.base_currency.ethereum}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  base_currency: { ...data.base_currency, ethereum: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Solana Base Currency</Label>
            <Select
              value={data.base_currency.solana}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  base_currency: { ...data.base_currency, solana: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="SOL">SOL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function InvestmentStrategySection({
  data,
  onChange,
}: {
  data: UserPolicy["policyDocument"]["investment_strategy"];
  onChange: (data: UserPolicy["policyDocument"]["investment_strategy"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Investment Strategy
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define your investment approach and return targets
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Strategy Type</Label>
            <Select
              value={data.strategy_type}
              onValueChange={(value: "conservative" | "balanced_mix" | "aggressive") =>
                onChange({ ...data, strategy_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Conservative - Lower risk, steady returns
                  </div>
                </SelectItem>
                <SelectItem value="balanced_mix">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Balanced Mix - Moderate risk and returns
                  </div>
                </SelectItem>
                <SelectItem value="aggressive">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    Aggressive - Higher risk, higher potential returns
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dca-percent">DCA Allocation (%)</Label>
              <Input
                id="dca-percent"
                type="number"
                value={data.dca_percentage}
                onChange={(e) =>
                  onChange({
                    ...data,
                    dca_percentage: Number(e.target.value),
                  })
                }
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Percentage allocated to dollar-cost averaging
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="momentum-percent">Momentum Trading (%)</Label>
              <Input
                id="momentum-percent"
                type="number"
                value={data.momentum_percentage}
                onChange={(e) =>
                  onChange({
                    ...data,
                    momentum_percentage: Number(e.target.value),
                  })
                }
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Percentage allocated to momentum-based trading
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-return">Target Annual Return (%)</Label>
            <Input
              id="target-return"
              type="number"
              value={data.target_annual_return}
              onChange={(e) =>
                onChange({
                  ...data,
                  target_annual_return: Number(e.target.value),
                })
              }
              min="1"
              max="1000"
            />
            <p className="text-xs text-muted-foreground">
              Your desired annual return percentage goal
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Yield Farming</Label>
              <p className="text-xs text-muted-foreground">
                Enable participation in DeFi yield farming opportunities
              </p>
            </div>
            <Switch
              checked={data.yield_farming_enabled}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  yield_farming_enabled: checked,
                })
              }
            />
          </div>
        </div>

        {/* Strategy Allocation Visualization */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Strategy Allocation</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>DCA Strategy</span>
              <span>{data.dca_percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${data.dca_percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span>Momentum Trading</span>
              <span>{data.momentum_percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${data.momentum_percentage}%` }}
              />
            </div>

            {data.dca_percentage + data.momentum_percentage !== 100 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Allocation percentages should total 100%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
