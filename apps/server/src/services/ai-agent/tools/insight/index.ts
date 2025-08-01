import { getCoinListTool } from "@/services/ai-agent/tools/insight/items/get-coin-list-tool";
import { getMarketChartTool } from "@/services/ai-agent/tools/insight/items/get-market-chart-tool";
import { getMarketDataTool } from "@/services/ai-agent/tools/insight/items/get-market-data-tool";
import { getOHLCTool } from "@/services/ai-agent/tools/insight/items/get-ohlc-tool";
import { getSentimentTool } from "@/services/ai-agent/tools/insight/items/get-sentiment-tool";
import { globalSearchTool } from "@/services/ai-agent/tools/insight/items/global-search-tool";

export const insightTools = {
  getCoinList: getCoinListTool,
  getMarketChart: getMarketChartTool,
  getOHLC: getOHLCTool,
  getMarketData: getMarketDataTool,
  getSentiment: getSentimentTool,
  globalSearch: globalSearchTool,
};
