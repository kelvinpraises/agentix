"use client";

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";

import { SidebarInset } from "@/library/components/atoms/sidebar";
import { Toaster } from "@/library/components/atoms/sonner";
import Header from "@/library/components/molecules/header";
import { AppSidebar } from "@/library/components/organisms/app-sidebar";
import RootProvider from "@/library/providers";
import { cn } from "@/library/utils";

const inter = Inter({ subsets: ["latin"], preload: true });

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Check if the current pathname matches any of the path patterns
  // Define an array of path patterns
  // e.g /^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/somewhere\/[a-zA-Z0-9_-]+$/
  const pathPatterns = [/^\/xyz+$/, /^\/xyz\/.*$/];

  const _isPathMatched = pathPatterns.some((pattern) => pattern.test(pathname));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <RootProvider>
          <AppSidebar />
          <SidebarInset className="relative">
            <Header  />
            {children}
          </SidebarInset>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
};

export default LayoutWrapper;
