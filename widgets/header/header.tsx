"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { ThemeToggle } from "@/features/theme-toggle"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const currentPathname = pathname ?? ""

  const navItems = [
    { href: "/projects", label: "Projects" },
    { href: "/tools", label: "Tools" },
    { href: "/#contact", label: "Contact" },
  ]

  const isActive = (href: string) => {
    // Contact is an anchor link, never active
    if (href === "/#contact") {
      return false
    }
    // Projects is active for nested project pages.
    if (href === "/projects") {
      return (
        currentPathname === "/projects" || currentPathname.startsWith("/projects/")
      )
    }
    return currentPathname === href
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Name */}
            <Link
              href="/"
              className="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors"
            >
              Joe Brundage
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium text-foreground/70 hover:text-foreground transition-colors",
                    isActive(item.href) && "text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen */}
      <div
        className={cn(
          "fixed inset-0 bg-background z-50 md:hidden",
          "transition-opacity duration-300",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <span className="text-lg font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Menu Navigation */}
          <nav className="flex flex-col gap-6 px-6 pt-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-2xl font-medium text-foreground hover:text-foreground transition-colors text-left",
                  isActive(item.href) && "text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
