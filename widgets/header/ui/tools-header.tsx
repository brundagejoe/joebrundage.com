"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { useAppTheme } from "@/shared/lib/theme"
import { cn } from "@/shared/lib/utils"
import { TOOLS, type ToolDefinition } from "@/shared/config"
import { buttonVariants } from "@/shared/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/shared/ui/combobox"
import { ThemeToggle } from "./theme-toggle"

export function ToolsHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedAppTheme } = useAppTheme()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const openFromShortcutRef = React.useRef(false)
  const suppressReopenRef = React.useRef(false)
  const [mounted, setMounted] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [value, setValue] = React.useState<ToolDefinition | null>(null)
  const [open, setOpen] = React.useState(false)
  const [pendingTool, setPendingTool] = React.useState<ToolDefinition | null>(
    null
  )
  const isTerminalTheme = mounted && resolvedAppTheme === "terminal"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        openFromShortcutRef.current = true
        setOpen(true)
        inputRef.current?.focus()
        inputRef.current?.select()
        requestAnimationFrame(() => {
          setOpen(true)
          openFromShortcutRef.current = false
        })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    if (pendingTool && pathname === pendingTool.href) {
      setPendingTool(null)
    }
  }, [pathname, pendingTool])

  const filteredTools = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return TOOLS
    }

    return TOOLS.filter((tool) => {
      return (
        tool.code.toLowerCase().includes(normalizedQuery) ||
        tool.title.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query])

  const handleValueChange = (nextValue: ToolDefinition | null) => {
    if (!nextValue) {
      setValue(null)
      return
    }

    const blurActiveElement = () => {
      const active = document.activeElement
      if (active instanceof HTMLElement) {
        active.blur()
      }
    }
    const closeMenu = () => setOpen(false)

    suppressReopenRef.current = true
    setPendingTool(nextValue)
    setValue(nextValue)
    closeMenu()
    blurActiveElement()
    requestAnimationFrame(closeMenu)
    requestAnimationFrame(blurActiveElement)
    setTimeout(closeMenu, 0)
    setTimeout(blurActiveElement, 0)
    setTimeout(() => {
      suppressReopenRef.current = false
    }, 50)
    router.push(nextValue.href)
    setQuery("")
    setValue(null)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-border bg-background",
        !isTerminalTheme && "bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/82"
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center gap-3">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: isTerminalTheme ? "outline" : "ghost",
                size: "sm",
              }),
              isTerminalTheme
                ? "rounded-none font-mono uppercase tracking-wide"
                : "rounded-full px-4"
              )}
          >
            Home
          </Link>
          <div className="min-w-0 flex-1 max-w-3xl">
            <Combobox<ToolDefinition>
              open={open}
              onOpenChange={(nextOpen) => {
                if (openFromShortcutRef.current) {
                  setOpen(true)
                  return
                }
                if (suppressReopenRef.current && nextOpen) {
                  return
                }
                setOpen(nextOpen)
              }}
              value={value}
              onValueChange={handleValueChange}
              inputValue={query}
              onInputValueChange={setQuery}
              filteredItems={filteredTools}
              itemToStringLabel={(item) => `${item.code} ${item.title}`}
              inputRef={inputRef}
              autoHighlight
            >
              <ComboboxInput
                className={cn(
                  "w-full border-input bg-input/30 text-foreground focus-within:border-ring focus-within:ring-0 [&_input]:placeholder:text-muted-foreground [&_input]:text-base md:[&_input]:text-sm",
                  isTerminalTheme
                    ? "rounded-none [&_input]:font-mono [&_input]:tracking-wide"
                    : "rounded-full border bg-background/80 px-2 shadow-sm"
                )}
                placeholder="Search tools by code or title (Cmd+K)"
                showTrigger={false}
                disabled={pendingTool !== null}
                onBlur={() => setOpen(false)}
              />
              <ComboboxContent
                className={cn(
                  "w-[min(88vw,900px)] border border-border bg-popover text-popover-foreground shadow-2xl",
                  isTerminalTheme ? "rounded-none" : "rounded-3xl"
                )}
              >
                <div
                  className={cn(
                    "border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground",
                    isTerminalTheme
                      ? "tracking-[0.08em]"
                      : "tracking-[0.12em] uppercase"
                  )}
                >
                  FUNCTIONS
                </div>
                <ComboboxList>
                  {(item: ToolDefinition) => (
                    <ComboboxItem
                      key={item.code}
                      value={item}
                      className={cn(
                        "py-2.5 pl-4 pr-3 data-highlighted:bg-chart-1 data-highlighted:text-primary-foreground",
                        isTerminalTheme
                          ? "rounded-none"
                          : "w-auto rounded-2xl mx-1 my-0.5"
                      )}
                    >
                      <div
                        className={cn(
                          "grid w-full grid-cols-[88px_1fr] items-center gap-2",
                          isTerminalTheme && "font-mono"
                        )}
                      >
                        <span className="text-sm leading-none font-semibold text-foreground">
                          {item.code}
                        </span>
                        <span className="truncate text-sm text-primary">
                          {item.title}
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty className="justify-start px-4 py-3 text-muted-foreground">
                  No matching tools.
                </ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="ml-auto shrink-0">
            <ThemeToggle includeTerminal />
          </div>
        </div>
        {pendingTool ? (
          <div
            className={cn(
              "flex h-8 items-center justify-between border-t border-border bg-card text-xs text-muted-foreground",
              isTerminalTheme
                ? "px-1 font-mono uppercase tracking-[0.12em]"
                : "px-3"
            )}
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />
              <span>
                Loading {pendingTool.code} {pendingTool.title}
              </span>
            </div>
            <span>Switching tool...</span>
          </div>
        ) : null}
      </div>
    </header>
  )
}
