"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ThemeToggle } from "./theme-toggle"

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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-current/15 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Name */}
            <Link
              href="/"
              className="text-[1.2rem] transition-opacity hover:opacity-70"
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
                    "plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70 transition-opacity hover:opacity-100",
                    isActive(item.href) && "opacity-100"
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
          <div className="flex h-16 items-center justify-between border-b border-current/15 px-6">
            <span className="plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
              Menu
            </span>
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
                  "text-left text-[1.75rem] opacity-70 transition-opacity hover:opacity-100",
                  isActive(item.href) && "opacity-100"
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
