"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { TOOLS, type ToolDefinition } from "@/shared/config"
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
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const openFromShortcutRef = React.useRef(false)
  const suppressReopenRef = React.useRef(false)
  const [query, setQuery] = React.useState("")
  const [value, setValue] = React.useState<ToolDefinition | null>(null)
  const [open, setOpen] = React.useState(false)
  const [pendingTool, setPendingTool] = React.useState<ToolDefinition | null>(
    null
  )

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
    setPendingTool(null)
  }, [pathname])

  React.useEffect(() => {
    if (!pendingTool) {
      return
    }
    /* Never leave the search latched if the navigation does not land. */
    const timer = window.setTimeout(() => setPendingTool(null), 5000)
    return () => window.clearTimeout(timer)
  }, [pendingTool])

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-current/15 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center gap-6">
          <Link
            href="/"
            className="plate-label shrink-0 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70 transition-opacity hover:opacity-100"
          >
            Home
          </Link>
          {/* No onBlur close here: on touch the input blurs the moment a
              finger lands on an option, and closing then unmounts the option
              before its click is dispatched — the tap does nothing. Base UI
              dismisses the popup on outside press by itself. */}
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
                className="w-full [&_input]:text-base [&_input]:placeholder:text-muted-foreground md:[&_input]:text-[0.95rem]"
                placeholder="Search tools by code or title (⌘K)"
                showTrigger={false}
              />
              <ComboboxContent className="w-[min(88vw,900px)] bg-popover text-popover-foreground">
                <div className="plate-label border-b border-current/15 px-4 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
                  Functions
                </div>
                <ComboboxList>
                  {(item: ToolDefinition) => (
                    <ComboboxItem
                      key={item.code}
                      value={item}
                      className="py-2 pl-4 pr-3"
                    >
                      <div className="grid w-full grid-cols-[88px_1fr] items-baseline gap-2">
                        <span className="plate-data text-[0.88rem] font-medium tracking-[0.06em]">
                          {item.code}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty className="justify-start px-4 py-3 opacity-60">
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
            className="plate-label flex h-8 items-center justify-between border-t border-current/15 px-1 text-[0.8rem] uppercase tracking-[0.1em] opacity-70"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <LoaderCircleIcon className="size-3.5 animate-spin" />
              <span>
                Loading {pendingTool.code} {pendingTool.title}
              </span>
            </div>
            <span>Switching tool…</span>
          </div>
        ) : null}
      </div>
    </header>
  )
}
