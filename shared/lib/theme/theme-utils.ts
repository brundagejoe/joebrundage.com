export const SITE_THEME_STORAGE_KEY = "theme"
export const TOOLS_THEME_STORAGE_KEY = "tools-theme"

export type AppTheme = "light" | "dark" | "system" | "terminal"
export type ResolvedAppTheme = Exclude<AppTheme, "system">

export function isToolsPath(pathname?: string | null): boolean {
  return pathname === "/tools" || pathname?.startsWith("/tools/") === true
}

export function resolveAppTheme(
  theme: string | undefined,
  resolvedTheme: string | undefined
): ResolvedAppTheme {
  if (theme === "terminal") {
    return "terminal"
  }

  return resolvedTheme === "dark" ? "dark" : "light"
}
