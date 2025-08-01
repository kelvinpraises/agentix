"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Trade, JournalEntry, TradingStatus } from "../types";
import { 
  mockTrades, 
  mockJournalEntries, 
  mockTradingStatus,
  generateMockTrades,
  generateMockJournalEntries
} from "../mock-data";

export const useTrades = () => {
  return useQuery({
    queryKey: ["trades"],
    queryFn: async (): Promise<Trade[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockTrades(20);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTradeDetails = (tradeId: string) => {
  return useQuery({
    queryKey: ["trades", tradeId],
    queryFn: async (): Promise<Trade | null> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      // Generate a consistent set of trades and find the one we need
      const allTrades = generateMockTrades(20);
      const trade = allTrades.find(t => t.id === tradeId);
      return trade || null;
    },
    enabled: !!tradeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useTradeJournal = (tradeId: string) => {
  return useQuery({
    queryKey: ["trades", tradeId, "journal"],
    queryFn: async (): Promise<JournalEntry[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockJournalEntries(tradeId, 12);
    },
    enabled: !!tradeId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
};

export const useTradingStatus = () => {
  return useQuery({
    queryKey: ["trading", "status"],
    queryFn: async (): Promise<TradingStatus> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockTradingStatus;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};
export const useTradeMutations = () => {
  const queryClient = useQueryClient();

  const approveTrade = useMutation({
    mutationFn: async (tradeId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate API call
      console.log(`Approving trade ${tradeId}`);
    },
    onSuccess: (_, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", tradeId] });
      toast.success("Trade approved successfully");
    },
    onError: () => {
      toast.error("Failed to approve trade");
    },
  });

  const rejectTrade = useMutation({
    mutationFn: async (tradeId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`Rejecting trade ${tradeId}`);
    },
    onSuccess: (_, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades", tradeId] });
      toast.success("Trade rejected");
    },
    onError: () => {
      toast.error("Failed to reject trade");
    },
  });

  const pauseTrading = useMutation({
    mutationFn: async (reason?: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log(`Pausing trading: ${reason}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "status"] });
      toast.success("Trading paused");
    },
    onError: () => {
      toast.error("Failed to pause trading");
    },
  });

  const resumeTrading = useMutation({
    mutationFn: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log("Resuming trading");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "status"] });
      toast.success("Trading resumed");
    },
    onError: () => {
      toast.error("Failed to resume trading");
    },
  });

  return {
    approveTrade: approveTrade.mutate,
    rejectTrade: rejectTrade.mutate,
    pauseTrading: pauseTrading.mutate,
    resumeTrading: resumeTrading.mutate,
    isApproving: approveTrade.isPending,
    isRejecting: rejectTrade.isPending,
    isPausing: pauseTrading.isPending,
    isResuming: resumeTrading.isPending,
  };
};