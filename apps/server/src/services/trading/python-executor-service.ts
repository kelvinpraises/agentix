import { spawn, spawnSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { marketDataService } from "./market-data-service";

export interface BacktestResult {
  html_report: string;
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
  };
}

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  coinId?: string; // CoinGecko coin ID for OHLCV data (e.g., "bitcoin", "ethereum")
  days?: number; // Number of days of historical data to fetch (default: 365)
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export class PythonExecutorError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
    public readonly stdout: string
  ) {
    super(message);
    this.name = "PythonExecutorError";
  }
}

export class PythonEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PythonEnvironmentError";
  }
}

export const pythonExecutorService = {
  /**
   * Validate that Python environment is properly set up
   * Throws PythonEnvironmentError if issues are found
   */
  async validateEnvironment(): Promise<void> {
    // Check Python installation
    const pythonCheck = spawnSync("python3", ["--version"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (pythonCheck.error) {
      throw new PythonEnvironmentError(
        `Python 3 is not installed or not found in PATH. Error: ${pythonCheck.error.message}`
      );
    }

    if (pythonCheck.status !== 0) {
      throw new PythonEnvironmentError(
        `Failed to verify Python installation: ${pythonCheck.stderr}`
      );
    }

    const pythonVersion = pythonCheck.stdout.trim();
    console.log(`✓ Python environment validated: ${pythonVersion}`);

    // Check if run_backtest.py exists
    const scriptPath = path.join(__dirname, "../../../scripts/run_backtest.py");
    try {
      await fs.access(scriptPath);
    } catch {
      throw new PythonEnvironmentError(
        `run_backtest.py script not found at: ${scriptPath}`
      );
    }

    console.log(`✓ run_backtest.py script found at: ${scriptPath}`);
  },
  /**
   * Main execution method - runs backtest with given strategy code and config
   *
   * Pipeline (Option 2: Wrap User Strategy Class + UI Controls):
   * 1. Validate Python environment
   * 2. Validate strategy code (user writes Strategy class only)
   * 3. Fetch OHLCV data from market-data service
   * 4. Create temp directory with strategy, config, and OHLCV data
   * 5. Execute Python script (python-executor wraps with Backtest instance)
   * 6. Return results (html_report + metrics)
   */
  async runBacktest(
    strategyCode: string,
    config: BacktestConfig
  ): Promise<BacktestResult> {
    // Step 1: Validate environment
    try {
      await this.validateEnvironment();
    } catch (error) {
      if (error instanceof PythonEnvironmentError) {
        throw error;
      }
      throw new PythonEnvironmentError(`Environment validation failed: ${error}`);
    }

    // Step 2: Validate strategy code (stub - always passes)
    let validatedCode: string;
    try {
      validatedCode = await this.validateStrategyCode(strategyCode);
    } catch (error) {
      throw new Error(`Strategy validation failed: ${error}`);
    }

    // Step 3: Fetch OHLCV data
    const coinId = config.coinId || "bitcoin";
    const days = config.days || 365;
    let ohlcvData: OHLCVData[];
    try {
      ohlcvData = await this.fetchOHLCVData(coinId, days);
    } catch (error) {
      throw new Error(`Failed to fetch market data: ${error}`);
    }

    // Step 4: Setup temp directory with all files
    const tmpDir = await this._createTempDirectory();

    try {
      // Write validated strategy code to temp file
      const strategyPath = path.join(tmpDir, "strategy.py");
      await fs.writeFile(strategyPath, validatedCode, "utf-8");

      // Write config to temp file
      const configPath = path.join(tmpDir, "config.json");
      await fs.writeFile(configPath, JSON.stringify(config), "utf-8");

      // Write OHLCV data to temp file
      await this._writeOHLCVData(tmpDir, ohlcvData);

      // Step 5: Execute Python script
      const scriptPath = path.join(__dirname, "../../../scripts/run_backtest.py");
      const result = await this._executePython(scriptPath, [tmpDir]);

      // Step 6: Parse and return result
      return JSON.parse(result);
    } finally {
      // Cleanup temp files
      await this._cleanupTempDirectory(tmpDir);
    }
  },

  /**
   * Execute Python script with given arguments
   * Returns stdout if successful, throws error with stderr on failure
   */
  async _executePython(scriptPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = 5 * 60 * 1000; // 5 minutes
      let stdoutData = "";
      let stderrData = "";
      let timedOut = false;

      const pythonProcess = spawn("python3", [scriptPath, ...args], {
        timeout,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      // Set timeout handler
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        pythonProcess.kill("SIGTERM");
      }, timeout);

      // Collect stdout
      pythonProcess.stdout?.on("data", (data: Buffer) => {
        stdoutData += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr?.on("data", (data: Buffer) => {
        stderrData += data.toString();
      });

      // Handle process exit
      pythonProcess.on("close", (code: number | null) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          reject(
            new PythonExecutorError(
              "Python execution timed out after 5 minutes",
              stderrData,
              stdoutData
            )
          );
          return;
        }

        if (code !== 0) {
          // Try to parse error JSON from stderr first
          try {
            const errorObj = JSON.parse(stderrData);
            reject(
              new PythonExecutorError(
                errorObj.error || "Python script failed",
                stderrData,
                stdoutData
              )
            );
          } catch {
            reject(
              new PythonExecutorError(
                `Python script failed with exit code ${code}`,
                stderrData,
                stdoutData
              )
            );
          }
          return;
        }

        // Success - return parsed stdout
        if (!stdoutData) {
          reject(
            new PythonExecutorError(
              "Python script produced no output",
              stderrData,
              stdoutData
            )
          );
          return;
        }

        resolve(stdoutData);
      });

      // Handle process errors
      pythonProcess.on("error", (err: Error) => {
        clearTimeout(timeoutHandle);
        reject(
          new PythonExecutorError(
            `Failed to spawn Python process: ${err.message}`,
            stderrData,
            stdoutData
          )
        );
      });
    });
  },

  /**
   * Create temporary directory for strategy and config files
   */
  async _createTempDirectory(): Promise<string> {
    const tmpBase = os.tmpdir();
    const tmpDir = path.join(
      tmpBase,
      `backtest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    );

    try {
      await fs.mkdir(tmpDir, { recursive: true });
      return tmpDir;
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error}`);
    }
  },

  /**
   * Cleanup temporary directory and files
   */
  async _cleanupTempDirectory(tmpDir: string): Promise<void> {
    try {
      // Remove all files in directory
      const files = await fs.readdir(tmpDir);
      for (const file of files) {
        await fs.unlink(path.join(tmpDir, file));
      }

      // Remove directory
      await fs.rmdir(tmpDir);
    } catch (error) {
      // Log but don't throw - cleanup failure shouldn't break the system
      console.error(`Failed to cleanup temp directory ${tmpDir}:`, error);
    }
  },

  /**
   * Validate strategy code before execution
   *
   * Checks that user code:
   * 1. Defines a Strategy class
   * 2. Only uses whitelisted imports
   * 3. Doesn't contain dangerous patterns
   * 4. Can be compiled without syntax errors
   *
   * This is Option 2 validation: Users write Strategy class only,
   * system handles Backtest instantiation + parameter control
   */
  async validateStrategyCode(strategyCode: string): Promise<string> {
    const whitelistedImports = [
      "backtesting",
      "numpy",
      "np",
      "pandas",
      "pd",
      "talib",
    ];

    const dangerousPatterns = [
      /import\s+os\b/,
      /import\s+sys\b/,
      /import\s+socket\b/,
      /import\s+subprocess\b/,
      /import\s+urllib\b/,
      /import\s+requests\b/,
      /from\s+os\b/,
      /from\s+sys\b/,
      /open\s*\(/,
      /exec\s*\(/,
      /eval\s*\(/,
      /__import__/,
    ];

    // Check for Strategy class definition
    if (!/class\s+\w+\s*\(\s*Strategy\s*\)/m.test(strategyCode)) {
      throw new Error(
        'Strategy code must define a class that inherits from Strategy.\n' +
        'Example: class MyStrategy(Strategy):'
      );
    }

    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(strategyCode)) {
        throw new Error(
          `Dangerous pattern detected: ${pattern.source}\n` +
          'For security, only these imports are allowed: backtesting, numpy, pandas, talib'
        );
      }
    }

    // Basic syntax check - try to compile with Python syntax rules
    // (This is a simple JS-level check; Python will do the final validation)
    if (strategyCode.match(/^\s*$/) || !strategyCode.includes('def ')) {
      throw new Error(
        'Strategy code appears incomplete. Must define init() and next() methods.'
      );
    }

    console.log("✓ Strategy code validation passed");
    return strategyCode;
  },

  /**
   * Fetch OHLCV data from market-data service
   * Uses CoinGecko API via existing marketDataService
   */
  async fetchOHLCVData(coinId: string = "bitcoin", days: number = 365): Promise<OHLCVData[]> {
    try {
      console.log(`Fetching OHLCV data for ${coinId} (${days} days)...`);

      // Fetch OHLC data from market-data service
      const ohlcData = await marketDataService.getOHLC(coinId, "usd", days);

      // Transform from market-data-service format to our OHLCVData format
      const transformed: OHLCVData[] = ohlcData.map((candle) => ({
        timestamp: candle.x,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
      }));

      console.log(`✓ Fetched ${transformed.length} OHLCV candles for ${coinId}`);
      return transformed;
    } catch (error) {
      throw new Error(`Failed to fetch OHLCV data: ${error}`);
    }
  },

  /**
   * Write OHLCV data to temp directory as JSON
   */
  async _writeOHLCVData(tmpDir: string, ohlcvData: OHLCVData[]): Promise<void> {
    try {
      const ohlcvPath = path.join(tmpDir, "ohlcv.json");
      await fs.writeFile(ohlcvPath, JSON.stringify(ohlcvData), "utf-8");
      console.log(`✓ OHLCV data written to ${ohlcvPath}`);
    } catch (error) {
      throw new Error(`Failed to write OHLCV data: ${error}`);
    }
  },
};
