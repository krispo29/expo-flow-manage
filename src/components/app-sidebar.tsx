"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  Contact,
  Frame,
  LayoutDashboard,

  Presentation,
  FileText,
  Wrench,
  Settings,
  ChevronsUpDown,
  Calendar,
  DoorOpen,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/store/useAuthStore"

interface SidebarProject {
  name: string
  id: string
  url: string
}

export function AppSidebar({ projects, ...props }: React.ComponentProps<typeof Sidebar> & { projects?: SidebarProject[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
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

  // Helper to check if a path is active
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true
    return pathname.startsWith(path) && path !== '/admin'
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border transition-all"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Frame className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight leading-4">
                    <span className="truncate font-bold uppercase tracking-tight text-[11px] text-muted-foreground/80">Active Project</span>
                    <span className="truncate font-semibold text-sm">
                      {activeProject?.name || "Select Project"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl" align="start">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Projects</div>
                {projects?.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className="gap-2 p-2 focus:bg-primary/5 focus:text-primary cursor-pointer"
                  >
                    <Frame className="size-4" />
                    <span className="font-medium">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {user?.role !== 'ORGANIZER' && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Dashboard" 
                    className={cn(
                      "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                      isActive('/admin') 
                        ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                        : "hover:bg-sidebar-accent/50"
                    )}
                    isActive={isActive('/admin')}
                  >
                    <Link href={projectId ? `/admin?projectId=${projectId}` : "/admin"}>
                      <LayoutDashboard className="size-5 transition-transform group-hover:scale-110" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-4 mb-2">
              Event Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Exhibitors" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/exhibitors') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/exhibitors')}
                    >
                      <Link href={projectId ? `/admin/exhibitors?projectId=${projectId}` : "/admin/exhibitors"}>
                        <Users className="size-5 transition-transform group-hover:scale-110" />
                        <span>Exhibitors</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Participants" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/participants') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/participants')}
                    >
                      <Link href={projectId ? `/admin/participants?projectId=${projectId}` : "/admin/participants"}>
                        <Contact className="size-5 transition-transform group-hover:scale-110" />
                        <span>Participants</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Organizers" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/organizers') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/organizers')}
                    >
                      <Link href={projectId ? `/admin/organizers?projectId=${projectId}` : "/admin/organizers"}>
                        <Users className="size-5 transition-transform group-hover:scale-110" />
                        <span>Organizers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Conferences" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/conferences') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/conferences')}
                    >
                      <Link href={projectId ? `/admin/conferences?projectId=${projectId}` : "/admin/conferences"}>
                        <Presentation className="size-5 transition-transform group-hover:scale-110" />
                        <span>Conferences</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Rooms" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/rooms') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/rooms')}
                    >
                      <Link href={projectId ? `/admin/rooms?projectId=${projectId}` : "/admin/rooms"}>
                        <DoorOpen className="size-5 transition-transform group-hover:scale-110" />
                        <span>Rooms</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Events" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/events') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/events')}
                    >
                      <Link href={projectId ? `/admin/events?projectId=${projectId}` : "/admin/events"}>
                        <Calendar className="size-5 transition-transform group-hover:scale-110" />
                        <span>Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Invitation Codes" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/invitation-codes') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/invitation-codes')}
                    >
                      <Link href={projectId ? `/admin/invitation-codes?projectId=${projectId}` : "/admin/invitation-codes"}>
                        <FileText className="size-5 transition-transform group-hover:scale-110" />
                        <span>Invitation Codes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-4 mb-2">
              System & Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Reports" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/reports') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/reports')}
                    >
                      <Link href={projectId ? `/admin/reports?projectId=${projectId}` : "/admin/reports"}>
                        <FileText className="size-5 transition-transform group-hover:scale-110" />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Utility" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/utilities') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/utilities')}
                    >
                      <Link href={projectId ? `/admin/utilities?projectId=${projectId}` : "/admin/utilities"}>
                        <Wrench className="size-5 transition-transform group-hover:scale-110" />
                        <span>Utility</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Settings" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive('/admin/settings') 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive('/admin/settings')}
                    >
                      <Link href={projectId ? `/admin/settings?projectId=${projectId}` : "/admin/settings"}>
                        <Settings className="size-5 transition-transform group-hover:scale-110" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
