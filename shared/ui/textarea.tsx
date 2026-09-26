import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none border border-current/20 bg-transparent px-3 py-2.5 text-base transition-colors outline-none placeholder:text-foreground/35 focus-visible:border-current/60 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.95rem]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
