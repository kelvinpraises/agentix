"use client";

import { useQuery } from "@tanstack/react-query";
import type { AIActivity, AIDecision } from "../types";
import { mockAIActivity, mockAIDecisions, generateMockAIActivity } from "../mock-data";

export const useAIActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ["ai", "activity", limit],
    queryFn: async (): Promise<AIActivity[]> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockAIActivity(limit);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for real-time updates
  });
};

export const useAIDecisions = () => {
  return useQuery({
    queryKey: ["ai", "decisions"],
    queryFn: async (): Promise<AIDecision[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockAIDecisions;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLatestAIActivity = () => {
  return useQuery({
    queryKey: ["ai", "activity", "latest"],
    queryFn: async (): Promise<AIActivity[]> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockAIActivity.slice(0, 5); // Get latest 5 activities
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
  });
};