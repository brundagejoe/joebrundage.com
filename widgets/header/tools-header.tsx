"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { TOOLS, type ToolDefinition } from "@/shared/config/tools"
import { buttonVariants } from "@/shared/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/shared/ui/combobox"

export function ToolsHeader() {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const openFromShortcutRef = React.useRef(false)
  const suppressReopenRef = React.useRef(false)
  const [query, setQuery] = React.useState("")
  const [value, setValue] = React.useState<ToolDefinition | null>(null)
  const [open, setOpen] = React.useState(false)

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center gap-3">
          <Link
            href="/"
            className={`${buttonVariants({
              variant: "outline",
              size: "sm",
            })} rounded-none font-mono uppercase tracking-wide`}
          >
            Home
          </Link>
          <div className="flex-1 max-w-3xl">
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
                className="w-full rounded-none border-input bg-input/30 text-foreground focus-within:border-ring focus-within:ring-0 [&_input]:font-mono [&_input]:tracking-wide [&_input]:placeholder:text-muted-foreground [&_input]:text-sm"
                placeholder="Search tools by code or title (Cmd+K)"
                showTrigger={false}
                onBlur={() => setOpen(false)}
              />
              <ComboboxContent className="w-[min(88vw,900px)] rounded-none border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="border-b border-border px-4 py-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  FUNCTIONS
                </div>
                <ComboboxList>
                  {(item: ToolDefinition) => (
                    <ComboboxItem
                      key={item.code}
                      value={item}
                      className="rounded-none py-2.5 pl-4 pr-3 data-highlighted:bg-chart-1 data-highlighted:text-primary-foreground"
                    >
                      <div className="grid w-full grid-cols-[88px_1fr] items-center gap-2 font-mono">
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
        </div>
      </div>
    </header>
  )
}
