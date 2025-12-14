import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, external, children, href, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn("text-primary hover:underline", className)}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    )
  }
)
Link.displayName = "Link"

export { Link }
