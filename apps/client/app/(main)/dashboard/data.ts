// NOTE: This file is used to store mock data for the dashboard.
// It should be replaced with actual API calls once the backend is ready.

// ===========================================================================
// Top Metrics Data
// ===========================================================================
export const topMetrics = {
  totalPortfolioValue: {
    value: "$1,247.83",
    change: "+12.5%",
    changeType: "positive",
  },
  activeTradesCount: {
    value: "3",
    change: "-20%",
    changeType: "negative",
  },
  totalPositions: {
    value: "45,678",
    change: "+5.2%",
    changeType: "positive",
  },
  overallPnL: {
    value: "$28.50",
    change: "+4.5%",
    changeType: "positive",
  },
};

// ===========================================================================
// Portfolio Chart Data
// ===========================================================================
const generatePortfolioData = (days: number) => {
  const data = [];
  let value = 1200;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    value += Math.random() * 50 - 20; // Simulate daily fluctuations
    data.push({
      date: date.toISOString().split("T")[0],
      value: value.toFixed(2),
    });
  }
  return data;
};

export const portfolioData = {
  last3Months: generatePortfolioData(90),
  last30Days: generatePortfolioData(30),
  last7Days: generatePortfolioData(7),
};

// ===========================================================================
// Trade Actions Table Data
// ===========================================================================
export type Trade = {
  id: string;
  summary: string;
  tradeType: "Buy" | "Sell" | "Swap";
  status:
    | "SUCCEEDED"
    | "FAILED"
    | "REJECTED"
    | "ANALYZING"
    | "PENDING_USER_ACTION";
  date: string;
};

export const trades: Trade[] = [
  {
    id: "#00009",
    summary: "Attempting to buy 1.5 ETH",
    tradeType: "Buy",
    status: "ANALYZING",
    date: new Date().toISOString(),
  },
  {
    id: "#00008",
    summary: "Sell 0.5 BTC for USDC",
    tradeType: "Sell",
    status: "PENDING_USER_ACTION",
    date: new Date(
      new Date().setDate(new Date().getDate() - 1),
    ).toISOString(),
  },
  {
    id: "#00007",
    summary: "Swap 250 USDC for SOL",
    tradeType: "Swap",
    status: "PENDING_USER_ACTION",
    date: new Date(
      new Date().setDate(new Date().getDate() - 2),
    ).toISOString(),
  },
  {
    id: "#00006",
    summary: "Bought 10 SOL with USDC",
    tradeType: "Buy",
    status: "SUCCEEDED",
    date: new Date(
      new Date().setDate(new Date().getDate() - 3),
    ).toISOString(),
  },
  {
    id: "#00005",
    summary: "Sell 10 ATOM for USDT",
    tradeType: "Sell",
    status: "SUCCEEDED",
    date: new Date(
      new Date().setDate(new Date().getDate() - 4),
    ).toISOString(),
  },
  {
    id: "#00004",
    summary: "Failed to acquire 5 TIA",
    tradeType: "Buy",
    status: "FAILED",
    date: new Date(
      new Date().setDate(new Date().getDate() - 5),
    ).toISOString(),
  },
  {
    id: "#00003",
    summary: "User rejected BTC buy",
    tradeType: "Buy",
    status: "REJECTED",
    date: new Date(
      new Date().setDate(new Date().getDate() - 6),
    ).toISOString(),
  },
  {
    id: "#00002",
    summary: "Swapped 1000 USDT for ETH",
    tradeType: "Swap",
    status: "SUCCEEDED",
    date: new Date(
      new Date().setDate(new Date().getDate() - 7),
    ).toISOString(),
  },
];
