"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { usePathname } from "next/navigation"

function ThemeRouteSync({ isToolsRoute }: { isToolsRoute: boolean }) {
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    // If "terminal" was previously persisted, normalize it outside /tools.
    if (!isToolsRoute && theme === "terminal") {
      setTheme("light")
    }
  }, [isToolsRoute, theme, setTheme])

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname()
  const isToolsRoute = pathname === "/tools" || pathname?.startsWith("/tools/")

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark", "terminal", "system"]}
      forcedTheme={isToolsRoute ? "terminal" : undefined}
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeRouteSync isToolsRoute={!!isToolsRoute} />
      {children}
    </NextThemesProvider>
  )
}
