"use client";

import { SidebarInset } from "@/library/components/atoms/sidebar";
import Header from "@/library/components/molecules/header";
import { AppSidebar } from "@/library/components/organisms/app-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="relative">
        <Header />
        {children}
      </SidebarInset>
    </>
  );
}