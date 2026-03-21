"use client"

import * as React from "react"
import { Monitor, Moon, Sun, Terminal } from "lucide-react"

import { type AppTheme, useAppTheme } from "@/shared/lib/theme"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

type ThemeToggleProps = {
  includeTerminal?: boolean
  triggerClassName?: string
}

export function ThemeToggle({
  includeTerminal = false,
  triggerClassName,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedAppTheme } = useAppTheme()
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (value: string) => {
    setTheme(value as AppTheme)
    setOpen(false)
  }

  if (!mounted) {
    return (
      <button
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          triggerClassName
        )}
        aria-label="Toggle theme"
        suppressHydrationWarning
      >
        <div className="size-5" />
      </button>
    )
  }

  const iconEl =
    theme === "system" ? (
      <Monitor className="size-5" />
    ) : theme === "terminal" ? (
      <Terminal className="size-5" />
    ) : resolvedAppTheme === "light" ? (
      <Sun className="size-5" />
    ) : (
      <Moon className="size-5" />
    )

  const themeOptions: Array<{
    icon: React.ReactNode
    label: string
    value: AppTheme
  }> = [
    { icon: <Sun className="mr-2 size-4" />, label: "Light", value: "light" },
    { icon: <Moon className="mr-2 size-4" />, label: "Dark", value: "dark" },
    {
      icon: <Monitor className="mr-2 size-4" />,
      label: "System",
      value: "system",
    },
  ]

  if (includeTerminal) {
    themeOptions.push({
      icon: <Terminal className="mr-2 size-4" />,
      label: "Terminal",
      value: "terminal",
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          triggerClassName
        )}
        aria-label="Toggle theme"
      >
        {iconEl}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.icon}
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
