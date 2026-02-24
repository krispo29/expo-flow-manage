import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
    const { projects } = await getProjects()
    sidebarProjects = projects?.map(p => ({
      name: p.project_name,
      id: p.project_uuid,
      url: '/admin/projects',
    })) || []
  }

  return (
    <ProjectGuard projects={sidebarProjects}>
      <SidebarProvider>
        <AppSidebar projects={sidebarProjects} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Expo Flow
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ProjectGuard>
  )
}
