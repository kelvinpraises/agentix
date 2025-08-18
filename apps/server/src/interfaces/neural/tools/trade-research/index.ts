import { getCoinListTool } from "@/services/ai-agent/tools/trade-research/items/get-coin-list-tool";
import { getMarketChartTool } from "@/services/ai-agent/tools/trade-research/items/get-market-chart-tool";
import { getMarketDataTool } from "@/services/ai-agent/tools/trade-research/items/get-market-data-tool";
import { getOHLCTool } from "@/services/ai-agent/tools/trade-research/items/get-ohlc-tool";
import { getSentimentTool } from "@/services/ai-agent/tools/trade-research/items/get-sentiment-tool";
import { globalSearchTool } from "@/services/ai-agent/tools/trade-research/items/global-search-tool";

export const tradeResearchTools = {
  getCoinList: getCoinListTool,
  getMarketChart: getMarketChartTool,
  getOHLC: getOHLCTool,
  getMarketData: getMarketDataTool,
  getSentiment: getSentimentTool,
  globalSearch: globalSearchTool,
};
