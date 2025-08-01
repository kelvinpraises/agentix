"use client";

import { useQuery } from "@tanstack/react-query";
import type { PortfolioSnapshot, DashboardMetrics, PerformanceMetrics } from "../types";
import { 
  mockPortfolioSnapshots, 
  mockDashboardMetrics, 
  mockPerformanceMetrics,
  generateMockPortfolioHistory 
} from "../mock-data";

export const usePortfolioSnapshots = () => {
  return useQuery({
    queryKey: ["portfolio", "snapshots"],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockPortfolioSnapshots;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePortfolioHistory = (days: number = 30) => {
  return useQuery({
    queryKey: ["portfolio", "history", days],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockPortfolioHistory(days);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockDashboardMetrics;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ["portfolio", "performance"],
    queryFn: async (): Promise<PerformanceMetrics> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockPerformanceMetrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};