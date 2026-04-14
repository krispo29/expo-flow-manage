"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore"
import React from "react"

const routeMap: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizer",
  reports: "Reports",
  utilities: "Utility",
  events: "Events",
  exhibitors: "Exhibitors",
  conferences: "Conferences",
  rooms: "Rooms",
  staff: "Staff",
  settings: "Settings",
  "quota-requests": "Quota Requests",
  "questionnaires-stats": "Questionnaires Stats",
  participants: "Participants",
  "invitation-codes": "Invitation Codes",
  imports: "Imports",
  "scanner-import": "Scanner Import",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const { labels } = useBreadcrumbStore()
  
  // Filter out internal segments like (dashboard) and non-navigational parts
  const segments = pathname.split("/").filter((s) => s && s !== "(dashboard)")

  // Map segments to titles, prioritizing custom labels and filtering UUIDs
  const breadcrumbTitles = segments.map((s) => {
    // 1. Check for custom labels first
    if (labels[s]) return labels[s]

    // 2. Filter out UUIDs (Standard 8-4-4-4-12 or 24-char MongoDB-like IDs)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ||
                   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:-[0-9a-f]{12})?$/i.test(s) || // keep existing legacy regex for safety
                   /^[0-9a-f]{24}$/i.test(s)
    
    if (isUuid) return null

    // 3. Map to titles from routeMap or auto-format
    return routeMap[s] || s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")
  }).filter((title): title is string => title !== null)

  // If we are at the root level of admin or organizer, show "Dashboard"
  if (breadcrumbTitles.length === 1 && (breadcrumbTitles[0] === "Admin" || breadcrumbTitles[0] === "Organizer")) {
    breadcrumbTitles.push("Dashboard")
  }

  // The user wanted "Expo Flow > [Menu]"
  // We'll treat the first segment (Admin/Organizer) as part of the flow if there's more
  // But for simplicity and matching the request, we'll use "Expo Flow" as the root link

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
            Expo Flow
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        
        {breadcrumbTitles.map((title, index) => {
          const isLast = index === breadcrumbTitles.length - 1
          
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold text-sm text-foreground">{title}</BreadcrumbPage>
                ) : (
                  <span className="text-sm text-muted-foreground transition-colors">{title}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
