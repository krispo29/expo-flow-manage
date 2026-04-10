"use client"

import {
  ChevronsUpDown,
  LogOut,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/auth"
import { clearClientAuthState } from "@/lib/client-auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutAction()
    } finally {
      clearClientAuthState()
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white/10 h-14 rounded-xl transition-all duration-300 border border-white/5 bg-white/5 hover:bg-white/10"
            >
              <Avatar className="h-9 w-9 rounded-lg border border-white/10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                  {user.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight ml-2 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-sm tracking-tight">{user.name}</span>
                <span className="truncate text-[10px] font-medium opacity-40 uppercase tracking-wider mt-0.5">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-30 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 glass-elevated border-none p-2"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left">
                <Avatar className="h-10 w-10 rounded-xl border border-white/10 shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-sidebar-primary/20 text-sidebar-primary font-bold">
                    {user.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold text-sm">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground font-medium">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5 my-2" />
            {/* <DropdownMenuItem className="gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent/50 transition-colors group-hover:bg-primary/20">
                <User className="size-4" />
              </div>
              <span className="font-semibold text-sm">Account Settings</span>
            </DropdownMenuItem> */}
            <DropdownMenuItem 
              onClick={handleLogout}
              className="gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 transition-colors group-hover:bg-destructive/20">
                <LogOut className="size-4" />
              </div>
              <span className="font-semibold text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
