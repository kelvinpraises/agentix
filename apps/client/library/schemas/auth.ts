import { z } from "zod";

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters"),
});

// Register form schema
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    walletAddressEth: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^0x[a-fA-F0-9]{40}$/.test(val),
        "Please enter a valid Ethereum address (0x...)"
      ),
    walletAddressSol: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val),
        "Please enter a valid Solana address"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;