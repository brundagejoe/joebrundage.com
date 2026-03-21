"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { useTheme } from "next-themes"
import {
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type LegendProps,
  type LegendPayload,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipPayloadEntry,
  type TooltipValueType,
} from "recharts"

import {
  CHART_THEME_KEYS,
  getChartContainerClassName,
  getChartThemePreset,
  type ChartThemeKey,
} from "@/shared/lib/chart-theme"
import { resolveAppTheme } from "@/shared/lib/theme"
import { cn } from "@/shared/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
    color?: string
    theme?: Partial<Record<ChartThemeKey, string>>
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("Chart components must be used within a ChartContainer.")
  }

  return context
}

function createChartStyle(id: string, config: ChartConfig): string {
  const baseDeclarations: string[] = []
  const themedDeclarations: Record<ChartThemeKey, string[]> = {
    light: [],
    dark: [],
    terminal: [],
  }

  for (const [key, value] of Object.entries(config)) {
    if (value.color) {
      baseDeclarations.push(`--color-${key}: ${value.color};`)
    }

    for (const theme of CHART_THEME_KEYS) {
      const themeValue = value.theme?.[theme]

      if (themeValue) {
        themedDeclarations[theme].push(`--color-${key}: ${themeValue};`)
      }
    }
  }

  const blocks: string[] = []

  if (baseDeclarations.length > 0 || themedDeclarations.light.length > 0) {
    blocks.push(`
[data-chart="${id}"] {
${[...baseDeclarations, ...themedDeclarations.light].join("\n")}
}
`)
  }

  if (themedDeclarations.dark.length > 0) {
    blocks.push(`
.dark [data-chart="${id}"] {
${themedDeclarations.dark.join("\n")}
}
`)
  }

  if (themedDeclarations.terminal.length > 0) {
    blocks.push(`
.terminal [data-chart="${id}"] {
${themedDeclarations.terminal.join("\n")}
}
`)
  }

  return blocks.join("\n")
}

function getConfigForKey(config: ChartConfig, key: string | number | undefined) {
  if (typeof key !== "string") {
    return undefined
  }

  return config[key]
}

function getPayloadKey(
  item: TooltipPayloadEntry | LegendPayload,
  nameKey?: string
): string | undefined {
  const payloadRecord =
    item && typeof item === "object" && "payload" in item ? item.payload : undefined

  if (
    nameKey &&
    payloadRecord &&
    typeof payloadRecord === "object" &&
    payloadRecord !== null &&
    nameKey in payloadRecord
  ) {
    const value = (payloadRecord as Record<string, unknown>)[nameKey]

    if (typeof value === "string") {
      return value
    }
  }

  if (typeof item.dataKey === "string") {
    return item.dataKey
  }

  if ("name" in item && typeof item.name === "string") {
    return item.name
  }

  return undefined
}

function formatValue(value: TooltipValueType | undefined) {
  if (typeof value === "number") {
    return value.toLocaleString()
  }

  return value
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>["children"]
  preset?: ChartThemeKey | "current"
}

function mergeStyles(
  preset: ChartThemeKey | undefined,
  style: CSSProperties | undefined
) {
  if (!preset) {
    return style
  }

  return {
    ...getChartThemePreset(preset).vars,
    ...style,
  } satisfies CSSProperties
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, preset, style, ...props }, ref) => {
    const { resolvedTheme, theme } = useTheme()
    const reactId = React.useId()
    const chartId = React.useMemo(
      () => `chart-${id ?? reactId.replace(/:/g, "")}`,
      [id, reactId]
    )
    const effectivePreset =
      preset && preset !== "current"
        ? preset
        : resolveAppTheme(theme, resolvedTheme)

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          data-slot="chart"
          className={cn(
            "relative aspect-[16/9] w-full overflow-hidden rounded-3xl border bg-[var(--chart-surface)] p-3 shadow-sm",
            "border-[var(--chart-frame)] text-xs text-[var(--chart-axis)]",
            getChartContainerClassName(effectivePreset),
            className
          )}
          style={mergeStyles(effectivePreset, style)}
          {...props}
        >
          <style dangerouslySetInnerHTML={{ __html: createChartStyle(chartId, config) }} />
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)

ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = RechartsTooltip

type ChartTooltipContentProps = React.ComponentProps<"div"> &
  Pick<TooltipContentProps<TooltipValueType, string>, "active" | "label" | "payload"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "dot" | "line"
    labelFormatter?: (value: React.ReactNode) => React.ReactNode
    formatter?: (
      value: TooltipValueType | undefined,
      name: React.ReactNode,
      item: TooltipPayloadEntry,
      index: number
    ) => React.ReactNode
    nameKey?: string
  }

export function ChartTooltipContent({
  active,
  className,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = "dot",
  label,
  labelFormatter,
  nameKey,
  payload,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const tooltipLabel = hideLabel
    ? null
    : labelFormatter
      ? labelFormatter(label)
      : label

  return (
    <div
      className={cn(
        "grid min-w-44 gap-2 border px-3 py-2 text-xs shadow-2xl",
        "border-[var(--chart-tooltip-border)] bg-[var(--chart-tooltip-bg)] text-[var(--chart-tooltip-foreground)]",
        className
      )}
    >
      {tooltipLabel ? (
        <div className="font-medium tracking-[0.14em] uppercase text-[var(--chart-tooltip-muted)]">
          {tooltipLabel}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = getPayloadKey(item, nameKey)
          const itemConfig = getConfigForKey(config, key)
          const itemLabel = itemConfig?.label ?? item.name ?? key
          const Icon = itemConfig?.icon
          const renderedValue = formatter
            ? formatter(item.value, itemLabel, item, index)
            : formatValue(item.value)

          return (
            <div
              key={`${String(item.dataKey)}-${index}`}
              className="grid grid-cols-[1fr_auto] items-center gap-4"
            >
              <div className="flex items-center gap-2 text-[var(--chart-tooltip-foreground)]">
                {Icon ? <Icon className="size-3.5" /> : null}
                {!Icon && !hideIndicator ? (
                  indicator === "line" ? (
                    <span
                      className="h-0.5 w-3 shrink-0"
                      style={{ backgroundColor: item.color ?? "currentColor" }}
                    />
                  ) : (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color ?? "currentColor" }}
                    />
                  )
                ) : null}
                <span>{itemLabel}</span>
              </div>
              <span className="font-medium tabular-nums text-[var(--chart-tooltip-foreground)]">
                {renderedValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ChartLegend = RechartsLegend

type ChartLegendContentProps = React.ComponentProps<"div"> &
  {
    payload?: ReadonlyArray<LegendPayload>
    hideIcon?: boolean
    nameKey?: string
  }

export function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
}: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-xs text-[var(--chart-axis)]",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = getPayloadKey(item, nameKey)
        const itemConfig = getConfigForKey(config, key)
        const Icon = itemConfig?.icon
        const label = itemConfig?.label ?? item.value ?? key

        return (
          <div key={`${String(item.dataKey)}-${index}`} className="flex items-center gap-2">
            {Icon ? <Icon className="size-3.5" /> : null}
            {!Icon && !hideIcon ? (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? "currentColor" }}
              />
            ) : null}
            <span className="tabular-nums">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export type { LegendProps, TooltipProps }
