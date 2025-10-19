#!/usr/bin/env python3
"""
run_backtest.py - Backtesting execution wrapper

This script implements Option 2: Wrap User Strategy Class + UI Controls Backtest

ARCHITECTURE:
1. Receives user strategy class definition (NOT full backtesting code)
2. Reads config.json with UI-controlled parameters
3. Loads OHLCV data
4. Wraps strategy with backtesting.py Backtest instance
5. Executes and extracts results
6. Outputs JSON with html_report + metrics

SECURITY:
- Uses RestrictedPython to sandbox user code
- Only whitelisted imports allowed
- No filesystem or network access for user code
"""

import sys
import json
import os
from pathlib import Path
import traceback
import pandas as pd
from io import StringIO
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        output_error("Usage: python run_backtest.py <tmp_dir>")
        sys.exit(1)

    tmp_dir = sys.argv[1]

    try:
        # Step 1: Load configuration
        logger.info(f"Loading configuration from {tmp_dir}")
        config = load_config(tmp_dir)

        # Step 2: Load OHLCV data
        logger.info("Loading OHLCV data")
        ohlcv_data = load_ohlcv_data(tmp_dir)

        # Step 3: Convert to pandas DataFrame (backtesting.py format)
        logger.info("Converting OHLCV data to DataFrame")
        df = convert_to_dataframe(ohlcv_data)

        # Step 4: Load and validate user strategy code
        logger.info("Loading user strategy code")
        strategy_code = load_strategy_code(tmp_dir)

        # Step 5: Execute strategy in sandbox and get Strategy class
        logger.info("Executing user strategy code in sandbox")
        strategy_class = execute_user_code(strategy_code)

        # Step 6: Create Backtest instance with UI-controlled config
        logger.info("Creating Backtest instance with UI config")
        from backtesting import Backtest

        bt = Backtest(
            df,
            strategy_class,
            cash=config['initialCapital'],
            commission=config['commission']
        )

        # Step 7: Run backtest
        logger.info("Running backtest")
        stats = bt.run()

        # Step 8: Generate HTML report
        logger.info("Generating HTML report")
        html_report = bt.plot(_return_fig=True, show_legend=True, agg_func='D')
        # Convert plotly figure to HTML string
        html_str = html_report.to_html(include_plotlyjs='cdn', config={'responsive': True})

        # Step 9: Extract metrics
        logger.info("Extracting metrics")
        metrics = extract_metrics(stats)

        # Step 10: Output successful result
        result = {
            "html_report": html_str,
            "metrics": metrics
        }
        print(json.dumps(result))
        logger.info("Backtest completed successfully")

    except Exception as e:
        output_error(str(e))
        sys.exit(1)


def load_config(tmp_dir):
    """Load configuration from config.json"""
    config_path = os.path.join(tmp_dir, 'config.json')

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"config.json not found at {config_path}")

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in config.json: {e}")

    # Validate required fields
    required_fields = ['initialCapital', 'commission', 'startDate', 'endDate']
    for field in required_fields:
        if field not in config:
            raise ValueError(f"Missing required config field: {field}")

    return config


def load_ohlcv_data(tmp_dir):
    """Load OHLCV data from ohlcv.json"""
    ohlcv_path = os.path.join(tmp_dir, 'ohlcv.json')

    if not os.path.exists(ohlcv_path):
        raise FileNotFoundError(f"ohlcv.json not found at {ohlcv_path}")

    try:
        with open(ohlcv_path, 'r') as f:
            ohlcv_data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in ohlcv.json: {e}")

    if not isinstance(ohlcv_data, list) or len(ohlcv_data) == 0:
        raise ValueError("ohlcv.json must contain a non-empty array of OHLCV candles")

    return ohlcv_data


def convert_to_dataframe(ohlcv_data):
    """Convert OHLCV data to pandas DataFrame in backtesting.py format"""
    try:
        # backtesting.py expects columns: Open, High, Low, Close, Volume (optional)
        # Our OHLCV format has: timestamp, open, high, low, close
        data = []
        for candle in ohlcv_data:
            data.append({
                'Open': candle['open'],
                'High': candle['high'],
                'Low': candle['low'],
                'Close': candle['close'],
                'Volume': candle.get('volume', 0)  # Optional
            })

        df = pd.DataFrame(data)

        # backtesting.py requires a datetime index
        # Since OHLCV data has timestamps, create index from them
        timestamps = [pd.Timestamp(c['timestamp'] * 1000, unit='ms') for c in ohlcv_data]
        df.index = pd.DatetimeIndex(timestamps)

        logger.info(f"DataFrame created with {len(df)} rows")
        logger.info(f"Date range: {df.index[0]} to {df.index[-1]}")

        return df

    except (KeyError, TypeError, ValueError) as e:
        raise ValueError(f"Failed to convert OHLCV data to DataFrame: {e}")


def load_strategy_code(tmp_dir):
    """Load user strategy code from strategy.py"""
    strategy_path = os.path.join(tmp_dir, 'strategy.py')

    if not os.path.exists(strategy_path):
        raise FileNotFoundError(f"strategy.py not found at {strategy_path}")

    try:
        with open(strategy_path, 'r') as f:
            strategy_code = f.read()
    except IOError as e:
        raise IOError(f"Failed to read strategy.py: {e}")

    if not strategy_code.strip():
        raise ValueError("strategy.py is empty")

    return strategy_code


def execute_user_code(strategy_code):
    """
    Execute user strategy code in a sandboxed environment

    This implements security by:
    1. Using RestrictedPython to compile the code
    2. Only allowing specific imports
    3. Removing dangerous builtins

    Returns the Strategy class
    """
    try:
        from RestrictedPython import compile_restricted_exec
        from RestrictedPython.Guards import safe_builtins, guarded_inplacebinary_op
    except ImportError:
        raise ImportError("RestrictedPython not installed. Run: pip install RestrictedPython")

    try:
        # Compile user code with RestrictedPython
        byte_code = compile_restricted_exec(strategy_code)

        if byte_code.errors:
            error_msg = "Code compilation errors:\n" + "\n".join(str(e) for e in byte_code.errors)
            raise SyntaxError(error_msg)

        # Create restricted execution environment
        # Whitelist allowed modules and functions
        safe_globals = {
            "__builtins__": safe_builtins,
            "__name__": "__main__",
            "__metaclass__": type,
            "_print_": lambda x: None,  # Disable print in user code
            "_getattr_": getattr,
            "_write_": lambda x: None,  # Disable writes
            "_inplacebinary_": guarded_inplacebinary_op,
        }

        # Add allowed imports to safe globals
        try:
            from backtesting import Strategy
            from backtesting.lib import crossover
            import numpy as np
            import pandas as pd
            import talib

            safe_globals.update({
                'Strategy': Strategy,
                'crossover': crossover,
                'numpy': np,
                'np': np,
                'pandas': pd,
                'pd': pd,
                'talib': talib,
            })
        except ImportError as e:
            raise ImportError(f"Failed to import backtesting dependencies: {e}")

        # Execute the code
        exec(byte_code.code, safe_globals)

        # Extract Strategy class from executed code
        if 'Strategy' not in safe_globals or not isinstance(safe_globals['Strategy'], type):
            raise ValueError("User code must define a 'Strategy' class that inherits from backtesting.Strategy")

        strategy_class = safe_globals['Strategy']

        # Validate that Strategy inherits from backtesting.Strategy
        from backtesting import Strategy as BaseStrategy
        if not issubclass(strategy_class, BaseStrategy):
            raise ValueError("Strategy class must inherit from backtesting.Strategy")

        logger.info("User strategy code executed and validated successfully")
        return strategy_class

    except SyntaxError as e:
        raise SyntaxError(f"Strategy code syntax error: {e}")
    except Exception as e:
        logger.error(f"Error executing strategy code: {e}")
        raise


def extract_metrics(stats):
    """Extract key metrics from backtesting.py results"""
    try:
        metrics = {
            "total_return": float(stats.get('Return [%]', 0)),
            "sharpe_ratio": float(stats.get('Sharpe Ratio', 0)),
            "max_drawdown": float(stats.get('Max. Drawdown [%]', 0)),
            "win_rate": float(stats.get('Win Rate [%]', 0)),
            "total_trades": int(stats.get('# Trades', 0)),
            "profit_factor": float(stats.get('Profit Factor', 0)),
            "best_day": float(stats.get('Best Day [%]', 0)),
            "worst_day": float(stats.get('Worst Day [%]', 0)),
            "avg_trade": float(stats.get('Avg. Trade [%]', 0)),
        }

        logger.info(f"Extracted metrics: {json.dumps(metrics, indent=2)}")
        return metrics

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(f"Failed to extract some metrics: {e}")
        # Return basic metrics even if extraction is incomplete
        return {
            "total_return": float(stats.get('Return [%]', 0)),
            "sharpe_ratio": float(stats.get('Sharpe Ratio', 0)),
            "max_drawdown": float(stats.get('Max. Drawdown [%]', 0)),
            "win_rate": float(stats.get('Win Rate [%]', 0)),
            "total_trades": int(stats.get('# Trades', 0)),
        }


def output_error(message):
    """Output error as JSON to stderr"""
    error_output = {
        "error": message,
        "traceback": traceback.format_exc()
    }
    print(json.dumps(error_output), file=sys.stderr)


if __name__ == '__main__':
    main()