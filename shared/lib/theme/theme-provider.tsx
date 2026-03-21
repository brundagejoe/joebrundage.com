"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import {
  isToolsPath,
  resolveAppTheme,
  SITE_THEME_STORAGE_KEY,
  TOOLS_THEME_STORAGE_KEY,
  type AppTheme,
} from "./theme-utils"

function ThemeRouteSync({ isToolsRoute }: { isToolsRoute: boolean }) {
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    if (!isToolsRoute && theme === "terminal") {
      setTheme("light")
    }
  }, [isToolsRoute, theme, setTheme])

  return null
}

export function useAppTheme() {
  const { resolvedTheme, setTheme, theme } = useTheme()

  return {
    resolvedAppTheme: resolveAppTheme(theme, resolvedTheme),
    setTheme: setTheme as (theme: AppTheme) => void,
    theme: (theme ?? "system") as AppTheme,
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname()
  const isToolsRoute = isToolsPath(pathname)
  const storageKey = isToolsRoute
    ? TOOLS_THEME_STORAGE_KEY
    : SITE_THEME_STORAGE_KEY

  return (
    <NextThemesProvider
      key={storageKey}
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={storageKey}
      themes={["light", "dark", "terminal", "system"]}
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeRouteSync isToolsRoute={!!isToolsRoute} />
      {children}
    </NextThemesProvider>
  )
}
