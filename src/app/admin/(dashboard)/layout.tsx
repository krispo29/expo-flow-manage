import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ProjectGuard } from "@/components/project-guard"
import { getProjects } from "@/app/actions/project"
import { getUserRole } from "@/app/actions/auth"
import { CommandPalette } from "@/components/command-palette"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userRole = await getUserRole()
  
  // Organizers don't need project selection — the backend knows their project from the token
  let sidebarProjects: { name: string; id: string; url: string }[] = []
  
  if (userRole !== 'ORGANIZER') {
    const result = await getProjects()
    
    // If token is expired/invalid, redirect to login
    if (!result.success && result.error === 'key incorrect') {
      redirect('/login')
    }
    
    sidebarProjects = result.projects?.map(p => ({
      name: p.project_name,
      id: p.project_uuid,
      url: '/admin/projects',
    })) || []
  }

  return (
    <ProjectGuard projects={sidebarProjects}>
      <SidebarProvider>
        <AppSidebar projects={sidebarProjects} />
        <SidebarInset className="bg-muted/30">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/60">
            <div className="flex items-center gap-2 px-4 md:px-6 w-full max-w-7xl mx-auto">
              <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 opacity-50" />
                <DynamicBreadcrumb />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ProjectGuard>
  )
}
