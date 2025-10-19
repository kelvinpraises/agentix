import { beforeEach, describe, expect, test, vi, Mock } from "vitest";
import {
  pythonExecutorService,
  PythonExecutorError,
  PythonEnvironmentError,
} from "@/services/trading/python-executor-service";
import { spawn, spawnSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

// Mock child_process
vi.mock("child_process");

// Mock fs/promises
vi.mock("fs/promises");

// Mock market-data-service
vi.mock("@/services/trading/market-data-service", () => ({
  marketDataService: {
    getOHLC: vi.fn(),
  },
}));

import { marketDataService } from "@/services/trading/market-data-service";

describe("PythonExecutorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateEnvironment", () => {
    test("should successfully validate Python environment", async () => {
      const mockSpawnSync = spawnSync as Mock;
      mockSpawnSync.mockReturnValue({
        error: null,
        status: 0,
        stdout: "Python 3.11.0",
      });

      const mockAccess = fs.access as Mock;
      mockAccess.mockResolvedValue(undefined);

      await expect(pythonExecutorService.validateEnvironment()).resolves.toBeUndefined();

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "python3",
        ["--version"],
        expect.any(Object)
      );
      expect(mockAccess).toHaveBeenCalled();
    });

    test("should throw PythonEnvironmentError if Python is not installed", async () => {
      const mockSpawnSync = spawnSync as Mock;
      mockSpawnSync.mockReturnValue({
        error: new Error("python3 not found"),
        status: null,
      });

      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        PythonEnvironmentError
      );
      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        "Python 3 is not installed"
      );
    });

    test("should throw PythonEnvironmentError if Python verification fails", async () => {
      const mockSpawnSync = spawnSync as Mock;
      mockSpawnSync.mockReturnValue({
        error: null,
        status: 1,
        stderr: "Error verifying Python",
      });

      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        PythonEnvironmentError
      );
      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        "Failed to verify Python installation"
      );
    });

    test("should throw PythonEnvironmentError if run_backtest.py is not found", async () => {
      const mockSpawnSync = spawnSync as Mock;
      mockSpawnSync.mockReturnValue({
        error: null,
        status: 0,
        stdout: "Python 3.11.0",
      });

      const mockAccess = fs.access as Mock;
      mockAccess.mockRejectedValue(new Error("File not found"));

      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        PythonEnvironmentError
      );
      await expect(pythonExecutorService.validateEnvironment()).rejects.toThrow(
        "run_backtest.py script not found"
      );
    });
  });

  describe("validateStrategyCode", () => {
    test("should accept valid Strategy class definition", async () => {
      const code = `
from backtesting import Strategy
from backtesting.lib import crossover

class MyStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        pass
      `;

      const result = await pythonExecutorService.validateStrategyCode(code);
      expect(result).toBe(code);
    });

    test("should reject code without Strategy class", async () => {
      const code = "x = 1";

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Strategy code must define a class that inherits from Strategy"
      );
    });

    test("should reject code with dangerous os import", async () => {
      const code = `
import os
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        os.system('rm -rf /')

    def next(self):
        pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Dangerous pattern detected"
      );
    });

    test("should reject code with dangerous sys import", async () => {
      const code = `
import sys
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Dangerous pattern detected"
      );
    });

    test("should reject code with file operations", async () => {
      const code = `
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        open('/etc/passwd', 'r')

    def next(self):
        pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Dangerous pattern detected"
      );
    });

    test("should reject code with eval()", async () => {
      const code = `
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        eval('1 + 1')

    def next(self):
        pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Dangerous pattern detected"
      );
    });

    test("should reject code with requests import", async () => {
      const code = `
import requests
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Dangerous pattern detected"
      );
    });

    test("should reject empty code", async () => {
      const code = "";

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Strategy code must define a class that inherits from Strategy"
      );
    });

    test("should reject code without methods", async () => {
      const code = `
from backtesting import Strategy

class MyStrategy(Strategy):
    pass
      `;

      await expect(pythonExecutorService.validateStrategyCode(code)).rejects.toThrow(
        "Strategy code appears incomplete"
      );
    });

    test("should accept code with whitelisted imports", async () => {
      const code = `
from backtesting import Strategy
from backtesting.lib import crossover
import numpy as np
import pandas as pd
import talib

class MyStrategy(Strategy):
    def init(self):
        self.sma = self.I(talib.SMA, self.data.Close, 20)

    def next(self):
        if self.sma[-1] > 100:
            self.buy()
      `;

      const result = await pythonExecutorService.validateStrategyCode(code);
      expect(result).toBe(code);
    });

    test("should accept code with numpy as alternate import", async () => {
      const code = `
from backtesting import Strategy
import numpy

class MyStrategy(Strategy):
    def init(self):
        self.values = numpy.array([1, 2, 3])

    def next(self):
        pass
      `;

      const result = await pythonExecutorService.validateStrategyCode(code);
      expect(result).toBe(code);
    });
  });

  describe("fetchOHLCVData", () => {
    test("should fetch and transform OHLCV data", async () => {
      const mockGetOHLC = marketDataService.getOHLC as Mock;
      const mockData = [
        { x: 1609459200000, o: 29000, h: 30000, l: 28000, c: 29500 },
        { x: 1609545600000, o: 29500, h: 31000, l: 29000, c: 30500 },
      ];

      mockGetOHLC.mockResolvedValue(mockData);

      const result = await pythonExecutorService.fetchOHLCVData("bitcoin", 30);

      expect(mockGetOHLC).toHaveBeenCalledWith("bitcoin", "usd", 30);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: mockData[0].x,
        open: mockData[0].o,
        high: mockData[0].h,
        low: mockData[0].l,
        close: mockData[0].c,
      });
    });

    test("should use default coin ID if not provided", async () => {
      const mockGetOHLC = marketDataService.getOHLC as Mock;
      mockGetOHLC.mockResolvedValue([]);

      await pythonExecutorService.fetchOHLCVData();

      expect(mockGetOHLC).toHaveBeenCalledWith("bitcoin", "usd", 365);
    });

    test("should use custom days parameter", async () => {
      const mockGetOHLC = marketDataService.getOHLC as Mock;
      mockGetOHLC.mockResolvedValue([]);

      await pythonExecutorService.fetchOHLCVData("ethereum", 90);

      expect(mockGetOHLC).toHaveBeenCalledWith("ethereum", "usd", 90);
    });

    test("should throw error if market data service fails", async () => {
      const mockGetOHLC = marketDataService.getOHLC as Mock;
      mockGetOHLC.mockRejectedValue(new Error("API error"));

      await expect(pythonExecutorService.fetchOHLCVData()).rejects.toThrow(
        "Failed to fetch OHLCV data"
      );
    });
  });

  describe("_createTempDirectory", () => {
    test("should create a temporary directory", async () => {
      const mockMkdir = fs.mkdir as Mock;
      mockMkdir.mockResolvedValue(undefined);

      const result = await pythonExecutorService._createTempDirectory();

      expect(mockMkdir).toHaveBeenCalled();
      expect(result).toMatch(/backtest-\d+-/);
    });

    test("should throw error if directory creation fails", async () => {
      const mockMkdir = fs.mkdir as Mock;
      mockMkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(pythonExecutorService._createTempDirectory()).rejects.toThrow(
        "Failed to create temp directory"
      );
    });
  });

  describe("_cleanupTempDirectory", () => {
    test("should cleanup temporary directory and files", async () => {
      const mockReaddir = fs.readdir as Mock;
      const mockUnlink = fs.unlink as Mock;
      const mockRmdir = fs.rmdir as Mock;

      mockReaddir.mockResolvedValue(["file1.txt", "file2.json"]);
      mockUnlink.mockResolvedValue(undefined);
      mockRmdir.mockResolvedValue(undefined);

      await pythonExecutorService._cleanupTempDirectory("/tmp/test-backtest");

      expect(mockReaddir).toHaveBeenCalledWith("/tmp/test-backtest");
      expect(mockUnlink).toHaveBeenCalledTimes(2);
      expect(mockRmdir).toHaveBeenCalledWith("/tmp/test-backtest");
    });

    test("should log error but not throw if cleanup fails", async () => {
      const mockReaddir = fs.readdir as Mock;
      const consoleSpy = vi.spyOn(console, "error");

      mockReaddir.mockRejectedValue(new Error("Failed to read"));

      await expect(
        pythonExecutorService._cleanupTempDirectory("/tmp/test-backtest")
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("_writeOHLCVData", () => {
    test("should write OHLCV data to JSON file", async () => {
      const mockWriteFile = fs.writeFile as Mock;
      mockWriteFile.mockResolvedValue(undefined);

      const ohlcvData = [{ timestamp: 1000, open: 100, high: 110, low: 90, close: 105 }];

      await pythonExecutorService._writeOHLCVData("/tmp/test", ohlcvData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("ohlcv.json"),
        JSON.stringify(ohlcvData),
        "utf-8"
      );
    });

    test("should throw error if write fails", async () => {
      const mockWriteFile = fs.writeFile as Mock;
      mockWriteFile.mockRejectedValue(new Error("Write failed"));

      await expect(pythonExecutorService._writeOHLCVData("/tmp/test", [])).rejects.toThrow(
        "Failed to write OHLCV data"
      );
    });
  });

  describe("runBacktest", () => {
    test("should run complete backtest pipeline", async () => {
      const mockValidateEnv = vi.spyOn(pythonExecutorService, "validateEnvironment");
      const mockValidateCode = vi.spyOn(pythonExecutorService, "validateStrategyCode");
      const mockFetchOHLCV = vi.spyOn(pythonExecutorService, "fetchOHLCVData");
      const mockCreateTemp = vi.spyOn(pythonExecutorService, "_createTempDirectory");
      const mockWriteOHLCV = vi.spyOn(pythonExecutorService, "_writeOHLCVData");
      const mockExecutePython = vi.spyOn(pythonExecutorService, "_executePython");
      const mockCleanup = vi.spyOn(pythonExecutorService, "_cleanupTempDirectory");

      const mockWriteFile = fs.writeFile as Mock;
      mockWriteFile.mockResolvedValue(undefined);

      const strategyCode = `
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        pass
      `;

      const config = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      const mockResult = {
        html_report: "<html>Report</html>",
        metrics: {
          total_return: 15.5,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
      };

      mockValidateEnv.mockResolvedValue(undefined);
      mockValidateCode.mockResolvedValue(strategyCode);
      mockFetchOHLCV.mockResolvedValue([
        { timestamp: 1000, open: 100, high: 110, low: 90, close: 105 },
      ]);
      mockCreateTemp.mockResolvedValue("/tmp/test-backtest");
      mockWriteOHLCV.mockResolvedValue(undefined);
      mockExecutePython.mockResolvedValue(JSON.stringify(mockResult));
      mockCleanup.mockResolvedValue(undefined);

      const result = await pythonExecutorService.runBacktest(strategyCode, config);

      expect(mockValidateEnv).toHaveBeenCalled();
      expect(mockValidateCode).toHaveBeenCalledWith(strategyCode);
      expect(mockFetchOHLCV).toHaveBeenCalled();
      expect(mockCreateTemp).toHaveBeenCalled();
      expect(mockWriteOHLCV).toHaveBeenCalled();
      expect(mockExecutePython).toHaveBeenCalled();
      expect(mockCleanup).toHaveBeenCalled();

      expect(result).toEqual(mockResult);
      expect(result.metrics.total_return).toBe(15.5);
      expect(result.metrics.sharpe_ratio).toBe(1.8);
    });

    test("should throw validation error on invalid strategy code", async () => {
      const config = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      const invalidCode = "x = 1"; // No Strategy class

      await expect(pythonExecutorService.runBacktest(invalidCode, config)).rejects.toThrow(
        "Strategy validation failed"
      );
    });

    test("should cleanup on error", async () => {
      const mockValidateEnv = vi.spyOn(pythonExecutorService, "validateEnvironment");
      const mockCleanup = vi.spyOn(pythonExecutorService, "_cleanupTempDirectory");

      mockValidateEnv.mockRejectedValue(new PythonEnvironmentError("Python not found"));

      const config = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      const strategyCode = `
from backtesting import Strategy

class MyStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        pass
      `;

      await expect(
        pythonExecutorService.runBacktest(strategyCode, config)
      ).rejects.toThrow();
    });
  });

  describe("error classes", () => {
    test("PythonExecutorError should contain stderr and stdout", () => {
      const error = new PythonExecutorError("Test error", "stderr output", "stdout output");

      expect(error.message).toBe("Test error");
      expect(error.stderr).toBe("stderr output");
      expect(error.stdout).toBe("stdout output");
      expect(error.name).toBe("PythonExecutorError");
    });

    test("PythonEnvironmentError should be thrown with message", () => {
      const error = new PythonEnvironmentError("Environment not setup");

      expect(error.message).toBe("Environment not setup");
      expect(error.name).toBe("PythonEnvironmentError");
    });
  });
});
