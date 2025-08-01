import type { Metadata } from "next";
import { Inter } from "next/font/google";

import RootProvider from "@/library/providers";
import { Toaster } from "@/library/components/atoms/sonner";
import { cn } from "@/library/utils";
import "@/library/styles/globals.css";

const inter = Inter({ subsets: ["latin"], preload: true });

export const metadata: Metadata = {
  title: "Agentix - AI-Powered Trading Platform",
  icons: "/favicon.ico",
  description: "Beat inflation with AI-powered crypto trading. Automated trading that works while you sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <RootProvider>
          {children}
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
