"use client";

import {
  AudioWaveform,
  BookOpen,
  Command,
  FileText,
  GalleryVerticalEnd,
  History,
  LayoutDashboard,
  Map,
  Settings2,
} from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/library/components/atoms/sidebar";
import { NavBotActions } from "@/library/components/molecules/nav-bot-action";
import { NavMain } from "@/library/components/molecules/nav-main";
import { NavUser } from "@/library/components/molecules/nav-user";
import { AgentSwitcher } from "@/library/components/molecules/team-switcher";
import { trades } from "@/app/(main)/dashboard/data";

// This is sample data.
const data = {
  user: {
    name: "Kelvx",
    email: "me@kelvinpraises.com",
    avatar: "/avatars/shadcn.jpg",
  },
  agents: [
    {
      name: "AGX001",
      logo: GalleryVerticalEnd,
      network: "Avalanche",
    },
    {
      name: "AGX133",
      logo: AudioWaveform,
      network: "Base",
    },
    {
      name: "AGX300",
      logo: Command,
      network: "Hedera",
    },
  ],
  platform: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
      items: [],
    },
    {
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "Policies",
      url: "/policies",
      icon: FileText,
      items: [
        {
          title: "Models",
          url: "/policies/#",
        },
        {
          title: "Limits",
          url: "/policies/#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Bot Wallet",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
      ],
    },
  ],
  actions: trades
    .filter((trade) => ["ANALYZING", "PENDING_USER_ACTION"].includes(trade.status))
    .map((trade) => ({
      name: trade.id,
      url: `/actions/${trade.id.replace("#", "")}`,
      icon: Map,
    })),
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AgentSwitcher agents={data.agents} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.platform} />
        <NavBotActions actions={data.actions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
