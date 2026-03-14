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
  ContactRound,
  BarChart3,
  FileUp,
  ArrowUpCircle,
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
    name: user?.username?.toUpperCase() || "ADMIN",
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
                className="border border-white/5 bg-white/5 cursor-default hover:bg-white/10 transition-all duration-300 rounded-xl h-14"
              >
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-500">
                  <Frame className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-bold text-[14px] tracking-tight text-sidebar-foreground">Organizer</span>
                  <span className="truncate text-[10px] text-sidebar-foreground/50 font-semibold uppercase tracking-[0.1em] mt-0.5">Management Hub</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-xl h-14"
                  >
                    <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-500">
                      <Frame className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                      <span className="truncate text-[10px] text-sidebar-foreground/50 font-semibold uppercase tracking-[0.1em] mb-0.5">Active Project</span>
                      <span className="truncate font-bold text-[14px] tracking-tight text-sidebar-foreground">
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
                      className="gap-2 p-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
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
        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-1">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Dashboard" 
                    className={cn(
                      "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                      isActive(basePath) 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    )}
                    isActive={isActive(basePath)}
                  >
                    <Link href={projectId ? `${basePath}?projectId=${projectId}` : basePath}>
                      <LayoutDashboard className={cn("size-4 transition-transform", isActive(basePath) ? "scale-110" : "group-hover:scale-110")} />
                      <span>Dashboard Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mt-2 mb-1">
              Event Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Exhibitors" 
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/exhibitors`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/exhibitors`)}
                    >
                      <Link href={projectId ? `${basePath}/exhibitors?projectId=${projectId}` : `${basePath}/exhibitors`}>
                        <Users className={cn("size-4 transition-transform", isActive(`${basePath}/exhibitors`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/participants`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/participants`)}
                    >
                      <Link href={projectId ? `${basePath}/participants?projectId=${projectId}` : `${basePath}/participants`}>
                        <Contact className={cn("size-4 transition-transform", isActive(`${basePath}/participants`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Participants</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Staff" 
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/staff`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/staff`)}
                    >
                      <Link href={projectId ? `${basePath}/staff?projectId=${projectId}` : `${basePath}/staff`}>
                        <ContactRound className={cn("size-4 transition-transform", isActive(`${basePath}/staff`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Staff</span>
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/organizers`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/organizers`)}
                    >
                      <Link href={projectId ? `${basePath}/organizers?projectId=${projectId}` : `${basePath}/organizers`}>
                        <Users className={cn("size-4 transition-transform", isActive(`${basePath}/organizers`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/conferences`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/conferences`)}
                    >
                      <Link href={projectId ? `${basePath}/conferences?projectId=${projectId}` : `${basePath}/conferences`}>
                        <Presentation className={cn("size-4 transition-transform", isActive(`${basePath}/conferences`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/rooms`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/rooms`)}
                    >
                      <Link href={projectId ? `${basePath}/rooms?projectId=${projectId}` : `${basePath}/rooms`}>
                        <DoorOpen className={cn("size-4 transition-transform", isActive(`${basePath}/rooms`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/events`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/events`)}
                    >
                      <Link href={projectId ? `${basePath}/events?projectId=${projectId}` : `${basePath}/events`}>
                        <Calendar className={cn("size-4 transition-transform", isActive(`${basePath}/events`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/invitation-codes`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/invitation-codes`)}
                    >
                      <Link href={projectId ? `${basePath}/invitation-codes?projectId=${projectId}` : `${basePath}/invitation-codes`}>
                        <FileText className={cn("size-4 transition-transform", isActive(`${basePath}/invitation-codes`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Invitation Codes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                      {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Quota Requests" 
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/quota-requests`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/quota-requests`)}
                    >
                      <Link href={projectId ? `${basePath}/quota-requests?projectId=${projectId}` : `${basePath}/quota-requests`}>
                        <ArrowUpCircle className={cn("size-4 transition-transform", isActive(`${basePath}/quota-requests`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Quota Requests</span>
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
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mt-2 mb-1">
              System & Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Reports" 
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/reports`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/reports`)}
                    >
                      <Link href={projectId ? `${basePath}/reports?projectId=${projectId}` : `${basePath}/reports`}>
                        <FileText className={cn("size-4 transition-transform", isActive(`${basePath}/reports`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Questionnaires Stats"
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/questionnaires-stats`)
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/questionnaires-stats`)}
                    >
                      <Link href={projectId ? `${basePath}/questionnaires-stats?projectId=${projectId}` : `${basePath}/questionnaires-stats`}>
                        <BarChart3 className={cn("size-4 transition-transform", isActive(`${basePath}/questionnaires-stats`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Questionnaires Stats</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Imports"
                      className={cn(
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/imports`)
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/imports`)}
                    >
                      <Link href={projectId ? `${basePath}/imports?projectId=${projectId}` : `${basePath}/imports`}>
                        <FileUp className={cn("size-4 transition-transform", isActive(`${basePath}/imports`) ? "scale-110" : "group-hover:scale-110")} />
                        <span>Imports</span>
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/utilities`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/utilities`)}
                    >
                      <Link href={projectId ? `${basePath}/utilities?projectId=${projectId}` : `${basePath}/utilities`}>
                        <Wrench className={cn("size-4 transition-transform", isActive(`${basePath}/utilities`) ? "scale-110" : "group-hover:scale-110")} />
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
                        "h-9 text-[14px] font-semibold px-4 transition-all duration-300 rounded-lg mx-2 w-[calc(100%-16px)]",
                        isActive(`${basePath}/settings`) 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      isActive={isActive(`${basePath}/settings`)}
                    >
                      <Link href={projectId ? `${basePath}/settings?projectId=${projectId}` : `${basePath}/settings`}>
                        <Settings className={cn("size-4 transition-transform", isActive(`${basePath}/settings`) ? "scale-110" : "group-hover:scale-110")} />
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



