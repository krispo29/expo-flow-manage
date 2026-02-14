import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="print:block">
      <div className="print:hidden">
        <AppSidebar />
      </div>
        <main className="w-full flex flex-col h-screen overflow-hidden bg-muted/20 dark:bg-muted/10 print:h-auto print:overflow-visible print:bg-white print:text-black">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 backdrop-blur-md bg-background/80 supports-[backdrop-filter]:bg-background/60 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <div className="mr-4 hidden md:flex">
                <nav className="flex items-center space-x-4 lg:space-x-6">
                 {/* Breadcrumb or Nav items could go here */}
                </nav>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
            </header>
            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 print:p-0 print:overflow-visible">
                {children}
            </div>
        </main>
    </SidebarProvider>
  )
}
