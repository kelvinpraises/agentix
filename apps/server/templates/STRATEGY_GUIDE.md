# Strategy Writing Guide

This guide explains how to write trading strategies for the Agentix backtesting system.

## Overview

You write a **Strategy class** that inherits from `backtesting.Strategy`. The system automatically:

1. Loads your strategy code
2. Fetches historical OHLCV data
3. Creates a `Backtest` instance with your UI-configured parameters
4. Runs the backtest
5. Returns HTML report + metrics

## Basic Structure

```python
from backtesting import Strategy
from backtesting.lib import crossover

class MyStrategy(Strategy):
    # 1. Define parameters (can be tuned)
    n1 = 10
    n2 = 20

    def init(self):
        """Initialize indicators (called once at start)"""
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

    def next(self):
        """Trading logic (called on each bar)"""
        if not self.position:
            if crossover(self.sma1, self.sma2):
                self.buy()
        else:
            if crossover(self.sma2, self.sma1):
                self.position.close()
```

## Key Concepts

### Parameters

Parameters are class attributes that can be adjusted:

```python
class MyStrategy(Strategy):
    period = 14      # Parameter (can be tuned)
    threshold = 30   # Parameter (can be tuned)

    def init(self):
        pass

    def next(self):
        pass
```

### Indicators

Calculate indicators in `init()` using `self.I()`:

```python
def init(self):
    close = self.data.Close
    self.sma = self.I(SMA, close, 20)
    self.rsi = self.I(talib.RSI, close, 14)
```

### Access Data

The `self.data` object provides OHLCV data:

```python
self.data.Open      # Open prices
self.data.High      # High prices
self.data.Low       # Low prices
self.data.Close     # Close prices
self.data.Volume    # Volume
```

### Trading Logic

In `next()`, place trades based on indicators:

```python
def next(self):
    if not self.position:  # Not in a trade
        if signal:
            self.buy()

    else:  # Currently in a trade
        if exit_signal:
            self.position.close()
```

## Whitelisted Imports

You can only import these modules:

```python
from backtesting import Strategy
from backtesting.lib import crossover
import numpy as np
import pandas as pd
import talib
```

**NOT allowed:**
- File system access (`open()`, `os.path`, etc.)
- Network access (`requests`, `urllib`, etc.)
- System execution (`subprocess`, `os.system`, etc.)
- Dangerous builtins

## Data Access

All data is provided as numpy arrays:

```python
# Last bar's close price
close_price = self.data.Close[-1]

# Last 5 close prices
recent_closes = self.data.Close[-5:]

# All historical close prices
all_closes = self.data.Close
```

## Position Management

```python
# Open a long position
self.buy()

# Close current position
self.position.close()

# Check if in a position
if self.position:
    # Do something
    pass

# Sell short (if supported)
self.sell()
```

## Common Indicators

### Built-in (via backtesting.lib)

```python
from backtesting.lib import crossover, SMA, DEMA, EMA

self.sma = self.I(SMA, self.data.Close, 20)
self.ema = self.I(EMA, self.data.Close, 20)
```

### TA-Lib Functions

```python
import talib

self.rsi = self.I(talib.RSI, self.data.Close, 14)
self.macd, self.macd_signal, self.macd_hist = self.I(
    talib.MACD, self.data.Close, fastperiod=12, slowperiod=26, signalperiod=9
)
self.bb_upper, self.bb_middle, self.bb_lower = self.I(
    talib.BBANDS, self.data.Close, timeperiod=20
)
```

## Example: RSI Strategy

```python
from backtesting import Strategy
import talib

class RsiStrategy(Strategy):
    rsi_period = 14
    rsi_lower = 30   # Buy when RSI < 30 (oversold)
    rsi_upper = 70   # Sell when RSI > 70 (overbought)

    def init(self):
        self.rsi = self.I(talib.RSI, self.data.Close, self.rsi_period)

    def next(self):
        if not self.position:
            if self.rsi[-1] < self.rsi_lower:
                self.buy()
        else:
            if self.rsi[-1] > self.rsi_upper:
                self.position.close()
```

## Example: SMA Crossover Strategy

```python
from backtesting import Strategy
from backtesting.lib import crossover
import numpy as np

class SmaCrossover(Strategy):
    n1 = 10
    n2 = 20

    def init(self):
        close = self.data.Close
        self.sma1 = self.I(self._sma, close, self.n1)
        self.sma2 = self.I(self._sma, close, self.n2)

    def next(self):
        if not self.position:
            if crossover(self.sma1, self.sma2):
                self.buy()
        else:
            if crossover(self.sma2, self.sma1):
                self.position.close()

    @staticmethod
    def _sma(data, n):
        return np.convolve(data, np.ones(n) / n, mode='valid')[-len(data):]
```

## Best Practices

1. **Keep it simple**: Start with 1-2 indicators, add complexity gradually
2. **Test thoroughly**: Try different parameter values before deploying
3. **Avoid overfitting**: Don't optimize too much - it rarely works in live trading
4. **Use appropriate timeframes**: Strategies work differently on 1h, 4h, 1d timeframes
5. **Consider transaction costs**: The backtester includes commission in results
6. **Monitor drawdowns**: Max drawdown is as important as returns

## Common Mistakes

❌ **Accessing future data in `next()`**
- Never use `self.data.Close[0]` - that's the future
- Always use `self.data.Close[-1]` for current bar

❌ **Forgetting to close positions**
- Strategy should have exit logic for every entry

❌ **Using external imports**
- Only use whitelisted modules
- No `requests`, `pandas.read_csv()`, etc.

❌ **Making trades too frequently**
- High-frequency trading incurs high commission costs
- Balance trading frequency vs. profit

## UI Configuration

These parameters are controlled via the UI (not in your strategy code):

- **Initial Capital**: Starting cash amount
- **Commission**: Transaction fee (e.g., 0.2%)
- **Start Date / End Date**: Historical period to test

Your strategy receives OHLCV data for this period automatically.

---

## Support

For more info on backtesting.py: https://kernc.github.io/backtesting.py/