"use client";

import { useState } from "react";
import { Input } from "@/library/components/atoms/input";
import { Card, CardContent } from "@/library/components/atoms/card";
import { Badge } from "@/library/components/atoms/badge";
import { Separator } from "@/library/components/atoms/separator";
import { 
  Search, 
  BookOpen, 
  TrendingUp, 
  Shield, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  BarChart3,
  Settings
} from "lucide-react";

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sections based on search query
  const filterContent = (content: string) => {
    if (!searchQuery) return true;
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Agentix Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your comprehensive guide to AI-powered crypto trading that beats inflation automatically
        </p>
        
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Getting Started Section */}
      {filterContent("getting started setup account") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <h2 className="text-2xl font-bold">Getting Started</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quick Setup</h3>
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Welcome to Agentix!
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        Agentix is your AI-powered crypto trading assistant designed to beat inflation through intelligent, automated trading. 
                        Get started in just a few minutes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Account Setup</h3>
              <div className="grid gap-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Create Your Account</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign up with your email address and create a secure password. No personal information required beyond email verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Connect Your Wallets</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your Ethereum and Solana wallet addresses. Your private keys never leave your device - we only need addresses for transaction routing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Configure Trading Policies</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set your risk tolerance, trading preferences, and investment strategy. The AI will operate within these parameters.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Start Trading</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Activate AI trading and watch as your portfolio grows automatically. Monitor progress through the dashboard and trading history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* Trading Strategies Section */}
      {filterContent("trading strategies ai momentum dca") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <h2 className="text-2xl font-bold">Trading Strategies</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">AI-Powered Decision Making</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agentix uses advanced AI algorithms to analyze market conditions, identify opportunities, and execute trades automatically. 
                Our AI considers multiple factors including technical indicators, market sentiment, and your personal risk profile.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">Market Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Continuous analysis of price movements, volume patterns, RSI indicators, and support/resistance levels across multiple timeframes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      <h4 className="font-medium">Sentiment Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Real-time monitoring of market sentiment, news events, and social media trends to gauge market psychology and timing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Strategy Types</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Dollar-Cost Averaging (DCA)
                  </h4>
                  <p className="text-muted-foreground">
                    Systematic investment approach that reduces volatility impact by spreading purchases over time. 
                    Perfect for building long-term positions while minimizing timing risk.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">How it works:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Invests fixed amounts at regular intervals</li>
                      <li>• Automatically buys more when prices are low, less when high</li>
                      <li>• Reduces average cost basis over time</li>
                      <li>• Ideal for volatile markets and long-term growth</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Momentum Trading
                  </h4>
                  <p className="text-muted-foreground">
                    Capitalizes on strong price movements and market trends. Uses technical analysis to identify breakouts, 
                    trend continuations, and optimal entry/exit points.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Key features:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Identifies strong trending assets</li>
                      <li>• Uses RSI, moving averages, and volume indicators</li>
                      <li>• Quick profit-taking on momentum shifts</li>
                      <li>• Strict stop-losses to limit downside</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Hybrid Approach
                  </h4>
                  <p className="text-muted-foreground">
                    Combines DCA and momentum strategies based on market conditions. Allocates capital dynamically 
                    between conservative and aggressive approaches for optimal risk-adjusted returns.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Adaptive allocation:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• More DCA during high volatility periods</li>
                      <li>• Increased momentum trading in trending markets</li>
                      <li>• Automatic rebalancing based on performance</li>
                      <li>• Customizable allocation percentages</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Separator />
      {/* Risk Management Section */}
      {filterContent("risk management safety protection") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            <h2 className="text-2xl font-bold">Risk Management</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Capital Protection First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agentix prioritizes protecting your capital above all else. Our multi-layered risk management system 
                ensures that losses are minimized while allowing for sustainable growth over time.
              </p>
              
              <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                        Risk-First Philosophy
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                        Every trade is evaluated for risk before profit potential. We'd rather miss an opportunity than risk significant capital loss.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Risk Controls</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Position Sizing
                  </h4>
                  <p className="text-muted-foreground">
                    Never risk more than you can afford to lose. Position sizes are automatically calculated based on your risk tolerance and portfolio size.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Key features:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Maximum 25% of portfolio per trade (configurable)</li>
                      <li>• Dynamic sizing based on market volatility</li>
                      <li>• Correlation analysis to avoid overexposure</li>
                      <li>• Emergency position reduction during high volatility</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Stop Loss & Take Profit
                  </h4>
                  <p className="text-muted-foreground">
                    Every trade includes automatic exit points to lock in profits and limit losses. These are set before trade execution and cannot be overridden by emotions.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Automatic exits:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Stop loss: 5% default (configurable 1-50%)</li>
                      <li>• Take profit: 15% default (configurable 5-1000%)</li>
                      <li>• Trailing stops for momentum trades</li>
                      <li>• Time-based exits for stagnant positions</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Portfolio Limits
                  </h4>
                  <p className="text-muted-foreground">
                    Global portfolio protection prevents catastrophic losses through maximum drawdown limits and daily loss caps.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Safety mechanisms:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Maximum 10% portfolio drawdown before trading pause</li>
                      <li>• Daily loss limits to prevent bad trading days</li>
                      <li>• Automatic trading suspension during market crashes</li>
                      <li>• Manual override capabilities for emergency situations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Market Conditions</h3>
              <p className="text-muted-foreground leading-relaxed">
                The AI continuously monitors market conditions and adjusts risk parameters accordingly. During high volatility periods, 
                position sizes are reduced and stop losses are tightened.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Bull Markets</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Increased position sizes and momentum strategies during strong uptrends with confirmed market strength.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-medium">Sideways Markets</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Range trading strategies with tight stops and quick profit-taking in consolidating markets.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-red-500" />
                      <h4 className="font-medium">Bear Markets</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Defensive positioning with cash preservation and minimal exposure during confirmed downtrends.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* Advanced Features Section */}
      {filterContent("advanced features api monitoring") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-purple-500" />
            <h2 className="text-2xl font-bold">Advanced Features</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Real-Time Monitoring</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track every aspect of your AI trading system with comprehensive monitoring and alerting capabilities.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Performance Analytics</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detailed performance metrics including Sharpe ratio, maximum drawdown, win rate, and inflation-beating analysis.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">AI Decision Logs</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete transparency into every AI decision with reasoning, confidence scores, and market analysis.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Customization Options</h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Trading Policies</h4>
                  <p className="text-sm text-muted-foreground">
                    Fully customizable risk parameters, trading frequency, market preferences, and strategy allocation to match your investment goals.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Notification Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure alerts for trade executions, portfolio milestones, risk events, and market opportunities via email or push notifications.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Multi-Chain Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Trade across Ethereum and Solana networks with support for major DEXs including Uniswap, Jupiter, and 1inch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-muted-foreground">
          Need help? Contact our support team or check the{" "}
          <Badge variant="outline" className="mx-1">FAQ</Badge>
          section for common questions.
        </p>
      </div>
    </div>
  );
}