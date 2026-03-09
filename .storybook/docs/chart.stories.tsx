import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  CHART_PRESENTATION,
  getChartContainerClassName,
  getChartPresentation,
  type ChartThemeKey,
} from "@/shared/lib/chart-theme"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import { StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Chart",
  component: ChartContainer,
  tags: ["autodocs"],
} satisfies Meta<typeof ChartContainer>

export default meta

type Story = StoryObj<typeof meta>

const engagementData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 273, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 314, mobile: 240 },
]

const financialData = [
  { month: "Sep", close: 220.4, average: 226.1 },
  { month: "Oct", close: 216.2, average: 224.8 },
  { month: "Nov", close: 252.8, average: 232.7 },
  { month: "Dec", close: 286.4, average: 244.9 },
  { month: "Jan", close: 248.9, average: 249.8 },
  { month: "Feb", close: 233.7, average: 246.5 },
  { month: "Mar", close: 262.5, average: 250.6 },
  { month: "Apr", close: 255.1, average: 253.4 },
  { month: "May", close: 301.9, average: 265.2 },
  { month: "Jun", close: 292.7, average: 276.1 },
  { month: "Jul", close: 329.5, average: 293.8 },
  { month: "Aug", close: 348.7, average: 308.9 },
]

const engagementChartConfig = {
  desktop: {
    label: "Desktop",
    theme: {
      light: "oklch(0.63 0.2 255)",
      dark: "oklch(0.74 0.14 250)",
      terminal: "rgb(121 172 255)",
    },
  },
  mobile: {
    label: "Mobile",
    theme: {
      light: "oklch(0.72 0.16 195)",
      dark: "oklch(0.78 0.12 195)",
      terminal: "rgb(79 220 177)",
    },
  },
} satisfies ChartConfig

const marketChartConfig = {
  close: {
    label: "Last price",
    theme: {
      light: "oklch(0.56 0.18 251)",
      dark: "oklch(0.74 0.12 251)",
      terminal: "rgb(166 206 255)",
    },
  },
  average: {
    label: "Average",
    theme: {
      light: "oklch(0.64 0.08 250)",
      dark: "oklch(0.69 0.05 250)",
      terminal: "rgb(103 139 183)",
    },
  },
} satisfies ChartConfig

function EngagementChart({ preset }: { preset?: ChartThemeKey }) {
  const chartId = `engagement-${preset ?? "auto"}`
  const presentation = getChartPresentation(preset)

  return (
    <ChartContainer
      config={engagementChartConfig}
      preset={preset}
      className={`min-h-80 w-full ${getChartContainerClassName(preset)}`}
    >
      <AreaChart accessibilityLayer data={engagementData} margin={{ left: 8, right: 8 }}>
        <defs>
          <linearGradient id={`${chartId}-desktop`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-desktop)"
              stopOpacity={preset === "terminal" ? 0.38 : 0.45}
            />
            <stop
              offset="95%"
              stopColor="var(--color-desktop)"
              stopOpacity={preset === "terminal" ? 0.1 : 0.04}
            />
          </linearGradient>
          <linearGradient id={`${chartId}-mobile`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-mobile)"
              stopOpacity={preset === "terminal" ? 0.28 : 0.35}
            />
            <stop
              offset="95%"
              stopColor="var(--color-mobile)"
              stopOpacity={preset === "terminal" ? 0.08 : 0.03}
            />
          </linearGradient>
        </defs>
        <CartesianGrid {...presentation.grid} />
        <XAxis
          {...presentation.axis}
          dataKey="month"
          padding={{ left: 4, right: 4 }}
        />
        <YAxis {...presentation.axis} width={preset === "terminal" ? 44 : 36} />
        <ChartTooltip
          cursor={presentation.tooltip.cursor}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value) =>
                typeof value === "number" && preset === "terminal"
                  ? value.toFixed(0)
                  : typeof value === "number"
                    ? value.toLocaleString()
                    : String(value ?? "")
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          {...presentation.area}
          dataKey="desktop"
          fill={`url(#${chartId}-desktop)`}
          stroke="var(--color-desktop)"
        />
        <Area
          {...presentation.area}
          dataKey="mobile"
          fill={`url(#${chartId}-mobile)`}
          stroke="var(--color-mobile)"
        />
      </AreaChart>
    </ChartContainer>
  )
}

function FinancialTerminalChart({ preset = "terminal" }: { preset?: ChartThemeKey }) {
  const chartId = `terminal-market-${preset}`
  const presentation = getChartPresentation(preset)

  return (
    <ChartContainer
      config={marketChartConfig}
      preset={preset}
      className={`min-h-[28rem] w-full ${getChartContainerClassName(preset)}`}
    >
      <AreaChart accessibilityLayer data={financialData} margin={{ left: 4, right: 10 }}>
        <defs>
          <linearGradient id={`${chartId}-close`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-close)" stopOpacity={0.38} />
            <stop offset="100%" stopColor="var(--color-close)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid {...presentation.grid} />
        <XAxis {...presentation.axis} dataKey="month" padding={{ left: 4, right: 4 }} />
        <YAxis
          {...presentation.axis}
          width={44}
          orientation="right"
          domain={["dataMin - 10", "dataMax + 10"]}
          tickFormatter={(value) => value.toFixed(0)}
        />
        <ChartTooltip
          cursor={presentation.tooltip.cursor}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value) => `2024 ${value}`}
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(2) : String(value ?? "")
              }
            />
          }
        />
        <Line
          {...presentation.line}
          dataKey="average"
          stroke="var(--color-average)"
          strokeOpacity={0.9}
        />
        <Area
          type="monotone"
          dataKey="close"
          fill={`url(#${chartId}-close)`}
          fillOpacity={1}
          stroke="var(--color-close)"
          strokeWidth={2.1}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export const Primitive: Story = {
  render: () => (
    <StorySurface className="w-full max-w-4xl">
      <ChartContainer config={engagementChartConfig} className="min-h-72 w-full">
        <LineChart accessibilityLayer data={engagementData} margin={{ left: 8, right: 8 }}>
          <CartesianGrid {...CHART_PRESENTATION.grid} />
          <XAxis {...CHART_PRESENTATION.axis} dataKey="month" />
          <YAxis {...CHART_PRESENTATION.axis} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line {...CHART_PRESENTATION.line} dataKey="desktop" stroke="var(--color-desktop)" />
          <Line {...CHART_PRESENTATION.line} dataKey="mobile" stroke="var(--color-mobile)" />
        </LineChart>
      </ChartContainer>
    </StorySurface>
  ),
}

export const AreaExample: Story = {
  render: () => (
    <StorySurface className="w-full max-w-4xl">
      <EngagementChart />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      className="items-start"
      render={(theme) => <EngagementChart preset={theme} />}
    />
  ),
}

export const TerminalMarketStyle: Story = {
  render: () => (
    <div className="terminal dark bg-background p-4">
      <FinancialTerminalChart />
    </div>
  ),
}
