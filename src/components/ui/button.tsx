import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4.5 shrink-0 [&_svg]:shrink-0 outline-none active:scale-[0.97] font-sans",
  {
    variants: {
      variant: {
        default: "btn-aurora text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]",
        destructive:
          "bg-destructive text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 hover:shadow-destructive/30",
        outline:
          "border border-primary/20 bg-white/5 backdrop-blur-md text-primary hover:bg-primary/5 hover:border-primary/40",
        secondary:
          "bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors",
        ghost:
          "hover:bg-primary/5 hover:text-primary text-foreground/70",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        xs: "h-7 gap-1 rounded-lg px-2 text-[10px] tracking-[0.15em] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-2 px-4 text-[11px] font-bold",
        lg: "h-13 rounded-2xl px-8 text-base",
        icon: "size-11 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-13 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
