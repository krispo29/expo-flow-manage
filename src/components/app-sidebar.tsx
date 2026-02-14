"use client"

import * as React from "react"
import {
  Command,
  Users,
  Contact,
  Frame,
  LayoutDashboard,
  Store,
  Presentation,
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import Link from 'next/link'


import { useSearchParams } from 'next/navigation'
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/store/useAuthStore"

interface SidebarProject {
  name: string
  id: string
  url: string
}

export function AppSidebar({ projects, ...props }: React.ComponentProps<typeof Sidebar> & { projects?: SidebarProject[] }) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const { user } = useAuthStore()

  // Find the active project
  const activeProject = projects?.find(p => p.id === projectId)

  // Display only the active project, or nothing (or a placeholder)
  const displayProjects = activeProject ? [{
    name: activeProject.name,
    url: '/admin/projects', // Link back to selection
    icon: Frame
  }] : []

  const userData = {
    name: user?.username || "Admin",
    email: user?.role || "Administrator",
    avatar: "/avatars/admin.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={projectId ? `/admin?projectId=${projectId}` : "/admin"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold uppercase tracking-wider">Expo Flow</span>
                  <span className="truncate text-xs opacity-70">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={displayProjects} projectId={projectId} />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href={projectId ? `/admin?projectId=${projectId}` : "/admin"}>
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exhibitors">
                  <Link href={projectId ? `/admin/exhibitors?projectId=${projectId}` : "/admin/exhibitors"}>
                    <Store className="size-4" />
                    <span>Exhibitors</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Conferences">
                  <Link href={projectId ? `/admin/conferences?projectId=${projectId}` : "/admin/conferences"}>
                    <Presentation className="size-4" />
                    <span>Conferences</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Organizers">
                  <Link href={projectId ? `/admin/organizers?projectId=${projectId}` : "/admin/organizers"}>
                    <Users className="size-4" />
                    <span>Organizers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Participants">
                  <Link href={projectId ? `/admin/participants?projectId=${projectId}` : "/admin/participants"}>
                    <Contact className="size-4" />
                    <span>Participants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
           <ModeToggle />
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
