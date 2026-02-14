"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (value: string) => {
    setTheme(value)
    setOpen(false)
  }

  if (!mounted) {
    // Show a placeholder that matches the button size to prevent layout shift
    // The blocking script prevents theme flash, so we don't need to guess the icon
    return (
      <button
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        aria-label="Toggle theme"
        suppressHydrationWarning
      >
        <div className="size-5" />
      </button>
    )
  }

  const iconEl =
    theme === "system" || !resolvedTheme ? (
      <Monitor className="size-5" />
    ) : resolvedTheme === "light" ? (
      <Sun className="size-5" />
    ) : (
      <Moon className="size-5" />
    )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        aria-label="Toggle theme"
      >
        {iconEl}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 size-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 size-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 size-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
