# Strategy Template: SMA Crossover
#
# This is a simple Moving Average Crossover strategy for backtesting.py
#
# INSTRUCTIONS:
# 1. Modify the parameters (n1, n2) to adjust the strategy
# 2. Modify the init() method to add more indicators
# 3. Modify the next() method to change trading logic
# 4. Run this strategy through the backtester to see results
#
# WARNING: Only use whitelisted imports (backtesting, numpy, pandas, talib)

from backtesting import Strategy
from backtesting.lib import crossover
import numpy as np


class SmaCrossover(Strategy):
    """
    Simple Moving Average Crossover Strategy

    - Buy when fast SMA crosses above slow SMA
    - Sell when fast SMA crosses below slow SMA
    """

    # Strategy parameters (these can be optimized)
    n1 = 10    # Fast SMA period
    n2 = 20    # Slow SMA period

    def init(self):
        """Initialize indicators"""
        # Calculate Moving Averages using the built-in I() function
        close = self.data.Close
        self.sma1 = self.I(self._sma, close, self.n1)
        self.sma2 = self.I(self._sma, close, self.n2)

    def next(self):
        """Define trading logic (called on each new bar)"""
        # If no position, check for buy signal
        if not self.position:
            # Buy when fast SMA crosses above slow SMA
            if crossover(self.sma1, self.sma2):
                self.buy()

        # If in position, check for sell signal
        else:
            # Sell when fast SMA crosses below slow SMA
            if crossover(self.sma2, self.sma1):
                self.position.close()

    @staticmethod
    def _sma(data, n):
        """Calculate Simple Moving Average"""
        return np.convolve(data, np.ones(n) / n, mode='valid')[-len(data):]