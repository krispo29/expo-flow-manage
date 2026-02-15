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
  FileText,
  Wrench,
  Settings,
  ChevronsUpDown,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/store/useAuthStore"

interface SidebarProject {
  name: string
  id: string
  url: string
}

export function AppSidebar({ projects, ...props }: React.ComponentProps<typeof Sidebar> & { projects?: SidebarProject[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get('projectId')
  const { user } = useAuthStore()

  // Find the active project
  const activeProject = projects?.find(p => p.id === projectId)

  const userData = {
    name: user?.username || "Admin",
    email: user?.role || "Administrator",
    avatar: "/avatars/admin.jpg",
  }

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/admin?projectId=${newProjectId}`)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Frame className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeProject?.name || "Select Project"}
                    </span>
                    <span className="truncate text-xs opacity-70">Management System</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56" align="start">
                {projects?.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className="gap-2 p-2"
                  >
                    <Frame className="size-4" />
                    {project.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href={projectId ? `/admin?projectId=${projectId}` : "/admin"}>
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reports">
                   <Link href={projectId ? `/admin/reports?projectId=${projectId}` : "/admin/reports"}>
                    <FileText className="size-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Utility">
                   <Link href={projectId ? `/admin/utilities?projectId=${projectId}` : "/admin/utilities"}>
                    <Wrench className="size-4" />
                    <span>Utility</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                   <Link href={projectId ? `/admin/settings?projectId=${projectId}` : "/admin/settings"}>
                    <Settings className="size-4" />
                    <span>Settings</span>
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
