import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 transition-all duration-300 backdrop-blur-md shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20 shadow-primary/5",
        secondary:
          "bg-white/10 text-foreground border-white/20 shadow-white/5",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 shadow-destructive/5",
        outline:
          "border-white/10 bg-transparent text-muted-foreground/60 hover:bg-white/5 hover:text-foreground",
        ghost: "bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
