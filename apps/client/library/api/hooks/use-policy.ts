"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserPolicy } from "../types";
import { mockUserPolicy } from "../mock-data";

export const usePolicy = () => {
  return useQuery({
    queryKey: ["policy"],
    queryFn: async (): Promise<UserPolicy> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockUserPolicy;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePolicyMutations = () => {
  const queryClient = useQueryClient();

  const updatePolicy = useMutation({
    mutationFn: async (policy: Partial<UserPolicy>): Promise<UserPolicy> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Simulate API call
      const updatedPolicy = { ...mockUserPolicy, ...policy };
      console.log("Updating policy:", updatedPolicy);
      return updatedPolicy;
    },
    onSuccess: (updatedPolicy) => {
      queryClient.setQueryData(["policy"], updatedPolicy);
      toast.success("Policy updated successfully");
    },
    onError: () => {
      toast.error("Failed to update policy");
    },
  });

  const resetPolicy = useMutation({
    mutationFn: async (): Promise<UserPolicy> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      console.log("Resetting policy to defaults");
      return mockUserPolicy;
    },
    onSuccess: (resetPolicy) => {
      queryClient.setQueryData(["policy"], resetPolicy);
      toast.success("Policy reset to defaults");
    },
    onError: () => {
      toast.error("Failed to reset policy");
    },
  });

  return {
    updatePolicy: updatePolicy.mutate,
    resetPolicy: resetPolicy.mutate,
    isUpdating: updatePolicy.isPending,
    isResetting: resetPolicy.isPending,
  };
};