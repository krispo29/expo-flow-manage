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

  const basePath = user?.role === 'ORGANIZER' ? '/organizer' : '/admin'

  const handleProjectChange = (newProjectId: string) => {
    router.push(`${basePath}?projectId=${newProjectId}`)
  }

  // Helper to check if a path is active
  const isActive = (path: string) => {
    if (path === basePath && pathname === basePath) return true
    return pathname.startsWith(path) && path !== basePath
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {user?.role === 'ORGANIZER' ? (
              <SidebarMenuButton 
                size="lg" 
                className="border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent cursor-default hover:bg-primary/10 transition-all duration-500 rounded-xl h-14"
              >
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-primary/5 group-hover:scale-105 transition-transform duration-500">
                  <Frame className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-bold text-[14px] tracking-tight text-foreground">Organizer</span>
                  <span className="truncate text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.1em] mt-0.5">Management Hub</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent hover:bg-primary/10 transition-all duration-500 rounded-xl h-14"
                  >
                    <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-primary/5 group-hover:scale-105 transition-transform duration-500">
                      <Frame className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                      <span className="truncate text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.1em] mb-0.5">Active Project</span>
                      <span className="truncate font-bold text-[14px] tracking-tight text-foreground">
                        {activeProject?.name || "Select Project"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 opacity-30" />
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
            )}
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
                        isActive(`${basePath}/exhibitors`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/exhibitors`)}
                    >
                      <Link href={projectId ? `${basePath}/exhibitors?projectId=${projectId}` : `${basePath}/exhibitors`}>
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
                        isActive(`${basePath}/participants`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/participants`)}
                    >
                      <Link href={projectId ? `${basePath}/participants?projectId=${projectId}` : `${basePath}/participants`}>
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
                        isActive(`${basePath}/organizers`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/organizers`)}
                    >
                      <Link href={projectId ? `${basePath}/organizers?projectId=${projectId}` : `${basePath}/organizers`}>
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
                        isActive(`${basePath}/conferences`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/conferences`)}
                    >
                      <Link href={projectId ? `${basePath}/conferences?projectId=${projectId}` : `${basePath}/conferences`}>
                        <Presentation className="size-5 transition-transform group-hover:scale-110" />
                        <span>Conferences</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Rooms" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive(`${basePath}/rooms`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/rooms`)}
                    >
                      <Link href={projectId ? `${basePath}/rooms?projectId=${projectId}` : `${basePath}/rooms`}>
                        <DoorOpen className="size-5 transition-transform group-hover:scale-110" />
                        <span>Rooms</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Events" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive(`${basePath}/events`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/events`)}
                    >
                      <Link href={projectId ? `${basePath}/events?projectId=${projectId}` : `${basePath}/events`}>
                        <Calendar className="size-5 transition-transform group-hover:scale-110" />
                        <span>Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Invitation Codes" 
                      className={cn(
                        "h-10 text-[15px] font-medium px-4 transition-all duration-200",
                        isActive(`${basePath}/invitation-codes`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/invitation-codes`)}
                    >
                      <Link href={projectId ? `${basePath}/invitation-codes?projectId=${projectId}` : `${basePath}/invitation-codes`}>
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
                        isActive(`${basePath}/reports`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/reports`)}
                    >
                      <Link href={projectId ? `${basePath}/reports?projectId=${projectId}` : `${basePath}/reports`}>
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
                        isActive(`${basePath}/utilities`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/utilities`)}
                    >
                      <Link href={projectId ? `${basePath}/utilities?projectId=${projectId}` : `${basePath}/utilities`}>
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
                        isActive(`${basePath}/settings`) 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-none ml-0 pl-3" 
                          : "hover:bg-sidebar-accent/50"
                      )}
                      isActive={isActive(`${basePath}/settings`)}
                    >
                      <Link href={projectId ? `${basePath}/settings?projectId=${projectId}` : `${basePath}/settings`}>
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
