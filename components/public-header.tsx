"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
            {/* Logos Placeholder */}
             <div className="flex items-center gap-2">
                <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 bg-brand-yellow rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-orange-300">
                        ILDEX
                    </div>
                    <span className="text-[8px] font-bold text-brand-green">VIETNAM</span>
                </div>
                <div className="h-8 w-8 flex items-center justify-center border border-green-600 rounded p-1">
                     <span className="text-green-600 font-bold text-xs">VNU</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center space-x-1 border rounded-full px-1 py-0.5 bg-muted/50">
             <Button variant="ghost" size="sm" className="rounded-full h-7 px-3 text-xs bg-brand-green text-white hover:bg-brand-green/90 hover:text-white">EN</Button>
             <Button variant="ghost" size="sm" className="rounded-full h-7 px-3 text-xs text-muted-foreground hover:text-foreground">VN</Button>
          </div>
          <Link href="#" className="text-sm font-medium hover:text-brand-green transition-colors hidden md:block">
            Conferences
          </Link>
          <Button variant="outline" className="rounded-full px-6 border-zinc-300 hover:border-brand-green hover:text-brand-green">
            Login
          </Button>
        </div>
      </div>
    </header>
  )
}
