import Exa, { SearchResponse } from "exa-js";

// --- Interfaces ---
interface SentimentParams {
  symbol: string;
  sources?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  startCrawlDate?: string;
  endCrawlDate?: string;
}

interface GlobalSearchParams {
  searchTerm: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  startCrawlDate?: string;
  endCrawlDate?: string;
}

interface SearchResult extends SearchResponse<{
  type: string;
  useAutoprompt: true;
  numResults: number;
  text: true;
}> {}

// --- API Client ---
const exa = new Exa(process.env.EXA_API_KEY);

// --- Service Definition ---
export const sentimentService = {
  async getSentiment(params: SentimentParams): Promise<SearchResult> {
    try {
      const response = await exa.searchAndContents(
        `${params.symbol} crypto sentiment right now`,
        {
          type: "neural",
          useAutoprompt: true,
          numResults: 12,
          text: true,
          includeDomains: params.sources,
          startPublishedDate: params.startPublishedDate
            ? new Date(params.startPublishedDate).toISOString()
            : undefined,
          endPublishedDate: params.endPublishedDate
            ? new Date(params.endPublishedDate).toISOString()
            : undefined,
          startCrawlDate: params.startCrawlDate
            ? new Date(params.startCrawlDate).toISOString()
            : undefined,
          endCrawlDate: params.endCrawlDate
            ? new Date(params.endCrawlDate).toISOString()
            : undefined,
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to fetch sentiment for ${params.symbol}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sentiment for ${params.symbol}: ${error.message}`);
      }
      throw error;
    }
  },

  async globalSearch(params: GlobalSearchParams): Promise<SearchResult> {
    try {
      const response = await exa.searchAndContents(params.searchTerm, {
        type: "neural",
        useAutoprompt: true,
        numResults: 10,
        text: true,
        startPublishedDate: params.startPublishedDate
          ? new Date(params.startPublishedDate).toISOString()
          : undefined,
        endPublishedDate: params.endPublishedDate
          ? new Date(params.endPublishedDate).toISOString()
          : undefined,
        startCrawlDate: params.startCrawlDate
          ? new Date(params.startCrawlDate).toISOString()
          : undefined,
        endCrawlDate: params.endCrawlDate
          ? new Date(params.endCrawlDate).toISOString()
          : undefined,
      });
      return response;
    } catch (error) {
      console.error(`Failed to perform global search for "${params.searchTerm}":`, error);
       if (error instanceof Error) {
        throw new Error(`Failed to perform global search for "${params.searchTerm}": ${error.message}`);
      }
      throw error;
    }
  },
};
