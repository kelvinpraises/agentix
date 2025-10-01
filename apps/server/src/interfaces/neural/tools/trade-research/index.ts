import { getCoinListTool } from "@/interfaces/neural/tools/trade-research/items/get-coin-list-tool";
import { getMarketChartTool } from "@/interfaces/neural/tools/trade-research/items/get-market-chart-tool";
import { getMarketDataTool } from "@/interfaces/neural/tools/trade-research/items/get-market-data-tool";
import { getOHLCTool } from "@/interfaces/neural/tools/trade-research/items/get-ohlc-tool";
import { getOrbContextTool } from "@/interfaces/neural/tools/trade-research/items/get-orb-context";
import { getSentimentTool } from "@/interfaces/neural/tools/trade-research/items/get-sentiment-tool";
import { globalSearchTool } from "@/interfaces/neural/tools/trade-research/items/global-search-tool";

export const tradeResearchTools = {
  getCoinList: getCoinListTool,
  getMarketChart: getMarketChartTool,
  getOHLC: getOHLCTool,
  getMarketData: getMarketDataTool,
  getSentiment: getSentimentTool,
  globalSearch: globalSearchTool,
  getOrbContext: getOrbContextTool,
};
