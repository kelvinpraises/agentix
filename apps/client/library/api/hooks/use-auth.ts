"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "../client";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  walletAddressEth?: string;
  walletAddressSol?: string;
}

interface User {
  id: string;
  email: string;
  walletAddressEth?: string;
  walletAddressSol?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      try {
        const response = await api.get("/auth/me");
        return response.data;
      } catch (error) {
        localStorage.removeItem("token");
        return null;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in both localStorage and cookies for better SSR support
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Login successful!");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in both localStorage and cookies for better SSR support
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Registration successful!");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    // Clear the cookie by setting it with an expired date
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
    queryClient.setQueryData(["auth", "user"], null);
    queryClient.clear();
    toast.success("Logged out successfully");
    router.push("/");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};