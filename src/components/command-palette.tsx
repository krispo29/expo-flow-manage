"use client"

import * as React from "react"
import {
  Calendar,
  Contact,
  LayoutDashboard,
  Presentation,
  Settings,
  Users,
  FileText,
  Wrench,
  DoorOpen,
  Search,
  Plus,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const navigate = (path: string) => {
    const url = projectId ? `${path}?projectId=${projectId}` : path
    runCommand(() => router.push(url))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate("/admin")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/exhibitors")}>
              <Users className="mr-2 h-4 w-4" />
              <span>Exhibitors</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/participants")}>
              <Contact className="mr-2 h-4 w-4" />
              <span>Participants</span>
            </CommandItem>
             <CommandItem onSelect={() => navigate("/admin/conferences")}>
              <Presentation className="mr-2 h-4 w-4" />
              <span>Conferences</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/events")}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Events</span>
            </CommandItem>
             <CommandItem onSelect={() => navigate("/admin/rooms")}>
              <DoorOpen className="mr-2 h-4 w-4" />
              <span>Rooms</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => navigate("/admin/invitation-codes")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Invitation Codes</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/reports")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/utilities")}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Utility</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => navigate("/admin/exhibitors")}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add New Exhibitor</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/admin/rooms")}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add New Room</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
