"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/library/components/atoms/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/library/components/atoms/sidebar";
import { cn } from "@/library/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const pathname = usePathname();
          const isActive = pathname === item.url;
          return (
            <div key={item.title}>
              {item.items && item.items.length > 0 ? (
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem
                    className={cn(
                      "rounded-md mb-1 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      isActive && " text-gray-900  dark:text-gray-50"
                    )}
                  >
                    <Link href={item.url}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={cn(
                            "rounded-md mb-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                            isActive && "bg-gray-100 dark:bg-gray-800"
                          )}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </Link>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <Link key={subItem.title} href={subItem.url} className="transition-colors">
                            <SidebarMenuSubItem >
                              <SidebarMenuSubButton asChild>
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </Link>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <Link href={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        "rounded-md mb-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                        isActive &&
                          "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                      )}
                    >
                      <item.icon />

                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
            </div>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
