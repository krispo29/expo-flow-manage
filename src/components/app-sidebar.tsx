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
  Sparkles,
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

  const isActive = (path: string) => {
    if (path === basePath && pathname === basePath) return true
    return pathname.startsWith(path) && path !== basePath
  }

  return (
    <Sidebar collapsible="icon" className="border-none" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {user?.role === 'ORGANIZER' ? (
              <SidebarMenuButton 
                size="lg" 
                variant="outline"
                className="cursor-default h-16 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-aurora-gradient text-white shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:scale-110">
                  <Sparkles className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight ml-3">
                  <span className="truncate font-bold text-[15px] tracking-tight text-sidebar-foreground">Organizer</span>
                  <span className="truncate text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-[0.15em] mt-1">Management Hub</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    variant="outline"
                    className="data-[state=open]:bg-white/10 h-16 transition-all duration-500 hover:scale-[1.02]"
                  >
                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-aurora-gradient text-white shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:scale-110">
                      <Frame className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left leading-tight ml-3">
                      <span className="truncate text-[9px] text-sidebar-foreground/40 font-bold uppercase tracking-[0.15em] mb-1">Active Project</span>
                      <span className="truncate font-bold text-[15px] tracking-tight text-sidebar-foreground">
                        {activeProject?.name || "Select Project"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 opacity-30" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 glass-elevated border-none p-2" align="start">
                  <div className="px-3 py-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.2em]">Projects</div>
                  {projects?.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                      className="gap-3 p-2.5 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors"
                    >
                      <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-accent/50">
                        <Frame className="size-4" />
                      </div>
                      <span className="font-semibold text-sm">{project.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="scrollbar-hide px-2">
        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Dashboard" 
                    isActive={isActive(basePath)}
                  >
                    <Link href={projectId ? `${basePath}?projectId=${projectId}` : basePath}>
                      <LayoutDashboard className={cn("transition-transform duration-300", isActive(basePath) ? "scale-110" : "group-hover:scale-110")} />
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
            <SidebarGroupLabel>Event Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Exhibitors" 
                      isActive={isActive(`${basePath}/exhibitors`)}
                    >
                      <Link href={projectId ? `${basePath}/exhibitors?projectId=${projectId}` : `${basePath}/exhibitors`}>
                        <Users />
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
                      isActive={isActive(`${basePath}/participants`)}
                    >
                      <Link href={projectId ? `${basePath}/participants?projectId=${projectId}` : `${basePath}/participants`}>
                        <Contact />
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
                      isActive={isActive(`${basePath}/staff`)}
                    >
                      <Link href={projectId ? `${basePath}/staff?projectId=${projectId}` : `${basePath}/staff`}>
                        <ContactRound />
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
                      isActive={isActive(`${basePath}/organizers`)}
                    >
                      <Link href={projectId ? `${basePath}/organizers?projectId=${projectId}` : `${basePath}/organizers`}>
                        <Users />
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
                      isActive={isActive(`${basePath}/conferences`)}
                    >
                      <Link href={projectId ? `${basePath}/conferences?projectId=${projectId}` : `${basePath}/conferences`}>
                        <Presentation />
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
                      isActive={isActive(`${basePath}/rooms`)}
                    >
                      <Link href={projectId ? `${basePath}/rooms?projectId=${projectId}` : `${basePath}/rooms`}>
                        <DoorOpen />
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
                      isActive={isActive(`${basePath}/events`)}
                    >
                      <Link href={projectId ? `${basePath}/events?projectId=${projectId}` : `${basePath}/events`}>
                        <Calendar />
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
                      isActive={isActive(`${basePath}/invitation-codes`)}
                    >
                      <Link href={projectId ? `${basePath}/invitation-codes?projectId=${projectId}` : `${basePath}/invitation-codes`}>
                        <FileText />
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
                      isActive={isActive(`${basePath}/quota-requests`)}
                    >
                      <Link href={projectId ? `${basePath}/quota-requests?projectId=${projectId}` : `${basePath}/quota-requests`}>
                        <ArrowUpCircle />
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
            <SidebarGroupLabel>System & Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Reports" 
                      isActive={isActive(`${basePath}/reports`)}
                    >
                      <Link href={projectId ? `${basePath}/reports?projectId=${projectId}` : `${basePath}/reports`}>
                        <FileText />
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
                      isActive={isActive(`${basePath}/questionnaires-stats`)}
                    >
                      <Link href={projectId ? `${basePath}/questionnaires-stats?projectId=${projectId}` : `${basePath}/questionnaires-stats`}>
                        <BarChart3 />
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
                      isActive={isActive(`${basePath}/imports`)}
                    >
                      <Link href={projectId ? `${basePath}/imports?projectId=${projectId}` : `${basePath}/imports`}>
                        <FileUp />
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
                      isActive={isActive(`${basePath}/utilities`)}
                    >
                      <Link href={projectId ? `${basePath}/utilities?projectId=${projectId}` : `${basePath}/utilities`}>
                        <Wrench />
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
                      isActive={isActive(`${basePath}/settings`)}
                    >
                      <Link href={projectId ? `${basePath}/settings?projectId=${projectId}` : `${basePath}/settings`}>
                        <Settings />
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

      <SidebarFooter className="p-4 gap-4">
        <div className="flex items-center justify-between px-2">
           <ModeToggle />
           <span className="text-[10px] font-bold text-sidebar-foreground/20 uppercase tracking-widest">v2.1.0</span>
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
