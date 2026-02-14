"use client"

import { Calendar, Home, FileSpreadsheet, Users, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Manage Conferences",
    url: "/dashboard/conferences",
    icon: Calendar,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileSpreadsheet,
  },
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border/40 bg-muted/5">
       <SidebarHeader className="pb-4 pt-6">
        <div className="flex items-center gap-3 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(180,25%,25%)] to-[hsl(180,25%,45%)] text-white shadow-lg shadow-[hsl(180,25%,25%)]/20">
              <span className="font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-none tracking-tight text-[hsl(180,25%,25%)]">Organizer</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-1">Portal</span>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "h-10 px-4 transition-all duration-200",
                        isActive 
                          ? "bg-[hsl(180,25%,25%)]/10 text-[hsl(180,25%,25%)] font-medium shadow-sm" 
                          : "text-muted-foreground hover:text-[hsl(180,25%,25%)] hover:bg-[hsl(180,25%,25%)]/5"
                      )}
                    >
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", isActive ? "text-[hsl(180,25%,25%)]" : "text-muted-foreground group-hover:text-[hsl(180,25%,25%)]")} />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md cursor-pointer group">
            <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:border-indigo-100 transition-colors">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">Admin User</span>
              <span className="truncate text-xs text-muted-foreground">admin@expo.com</span>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
          </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
