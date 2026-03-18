import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, onChange, ...props }: React.ComponentProps<"input">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type !== "file") {
      e.target.value = e.target.value.replaceAll(/[\u0E00-\u0E7F]/g, "")
    }
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/40 selection:bg-primary/20 selection:text-primary bg-white/5 border-white/10 h-11 w-full min-w-0 rounded-xl border px-4 py-2 text-sm shadow-sm transition-all duration-300 outline-none backdrop-blur-sm file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "focus:bg-white/10 focus:border-primary/30 focus:ring-[4px] focus:ring-primary/10",
        "aria-invalid:ring-destructive/10 aria-invalid:border-destructive/40",
        className
      )}
      onChange={handleChange}
      {...props}
    />
  )
}

export { Input }
