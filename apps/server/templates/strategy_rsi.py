# Strategy Template: RSI (Relative Strength Index)
#
# RSI-based trading strategy for backtesting.py
#
# INSTRUCTIONS:
# 1. Modify RSI period and thresholds (rsi_period, rsi_lower, rsi_upper)
# 2. Modify the trading signals in the next() method
# 3. Run this strategy through the backtester to see results
#
# WARNING: Only use whitelisted imports (backtesting, numpy, pandas, talib)

from backtesting import Strategy
import talib


class RsiStrategy(Strategy):
    """
    RSI-based Trading Strategy

    - Buy when RSI crosses above the lower threshold (oversold)
    - Sell when RSI crosses above the upper threshold (overbought)
    """

    # Strategy parameters
    rsi_period = 14        # RSI calculation period
    rsi_lower = 30         # Oversold threshold (buy signal)
    rsi_upper = 70         # Overbought threshold (sell signal)

    def init(self):
        """Initialize indicators"""
        close = self.data.Close
        self.rsi = self.I(talib.RSI, close, self.rsi_period)

    def next(self):
        """Define trading logic"""
        if not self.position:
            # Buy when RSI goes below oversold level
            if self.rsi[-1] < self.rsi_lower:
                self.buy()

        else:
            # Sell when RSI goes above overbought level
            if self.rsi[-1] > self.rsi_upper:
                self.position.close()