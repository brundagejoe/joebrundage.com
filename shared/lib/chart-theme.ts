import type { CSSProperties } from "react"

export const CHART_THEME_KEYS = ["light", "dark", "terminal"] as const

export type ChartThemeKey = (typeof CHART_THEME_KEYS)[number]

export type ChartThemePreset = {
  name: ChartThemeKey
  vars: CSSProperties
}

export type ChartPresentation = {
  axis: {
    axisLine: boolean
    tickLine: boolean
    tickMargin: number
    minTickGap: number
    stroke: string
    fontSize: number
  }
  grid: {
    stroke: string
    strokeDasharray: string
    vertical: boolean
    horizontal: boolean
  }
  tooltip: {
    cursor: {
      stroke: string
      strokeDasharray: string
      strokeWidth: number
    }
  }
  line: {
    type: "monotone"
    strokeWidth: number
    dot: false
    activeDot: {
      r: number
      strokeWidth: number
    }
  }
  area: {
    type: "monotone"
    strokeWidth: number
    fillOpacity: number
  }
}

type ChartCssVariableName =
  | "--chart-surface"
  | "--chart-frame"
  | "--chart-grid"
  | "--chart-axis"
  | "--chart-tooltip-bg"
  | "--chart-tooltip-border"
  | "--chart-tooltip-foreground"
  | "--chart-tooltip-muted"
  | "--chart-cursor"

type ChartCssVariables = Record<ChartCssVariableName, string>

const CHART_THEME_PRESET_VARS: Record<ChartThemeKey, ChartCssVariables> = {
  light: {
    "--chart-surface": "oklch(0.985 0.004 85)",
    "--chart-frame": "oklch(0.82 0.015 250 / 0.4)",
    "--chart-grid": "oklch(0.78 0.02 250 / 0.35)",
    "--chart-axis": "oklch(0.36 0.02 250)",
    "--chart-tooltip-bg": "oklch(1 0 0 / 0.96)",
    "--chart-tooltip-border": "oklch(0.7 0.025 250 / 0.45)",
    "--chart-tooltip-foreground": "oklch(0.18 0.02 250)",
    "--chart-tooltip-muted": "oklch(0.48 0.02 250)",
    "--chart-cursor": "oklch(0.52 0.16 250 / 0.7)",
  },
  dark: {
    "--chart-surface": "oklch(0.16 0.01 250)",
    "--chart-frame": "oklch(0.34 0.025 250 / 0.7)",
    "--chart-grid": "oklch(0.62 0.02 250 / 0.22)",
    "--chart-axis": "oklch(0.82 0.01 250)",
    "--chart-tooltip-bg": "oklch(0.19 0.01 250 / 0.96)",
    "--chart-tooltip-border": "oklch(0.46 0.03 250 / 0.6)",
    "--chart-tooltip-foreground": "oklch(0.95 0.004 250)",
    "--chart-tooltip-muted": "oklch(0.72 0.012 250)",
    "--chart-cursor": "oklch(0.74 0.09 245 / 0.75)",
  },
  terminal: {
    "--chart-surface": "rgb(0 0 0)",
    "--chart-frame": "rgb(85 112 150 / 0.72)",
    "--chart-grid": "rgb(122 154 196 / 0.28)",
    "--chart-axis": "rgb(224 234 248 / 0.9)",
    "--chart-tooltip-bg": "rgb(9 15 25 / 0.96)",
    "--chart-tooltip-border": "rgb(91 130 176 / 0.82)",
    "--chart-tooltip-foreground": "rgb(240 246 255)",
    "--chart-tooltip-muted": "rgb(154 184 220)",
    "--chart-cursor": "rgb(156 194 246 / 0.74)",
  },
}

export const CHART_PRESENTATION: ChartPresentation = {
  axis: {
    axisLine: false,
    tickLine: false,
    tickMargin: 10,
    minTickGap: 24,
    stroke: "var(--chart-axis)",
    fontSize: 11,
  },
  grid: {
    stroke: "var(--chart-grid)",
    strokeDasharray: "2 4",
    vertical: true,
    horizontal: true,
  },
  tooltip: {
    cursor: {
      stroke: "var(--chart-cursor)",
      strokeDasharray: "3 4",
      strokeWidth: 1,
    },
  },
  line: {
    type: "monotone",
    strokeWidth: 2,
    dot: false,
    activeDot: {
      r: 3,
      strokeWidth: 1,
    },
  },
  area: {
    type: "monotone",
    strokeWidth: 2,
    fillOpacity: 0.22,
  },
}

const TERMINAL_CHART_PRESENTATION: ChartPresentation = {
  axis: {
    axisLine: false,
    tickLine: false,
    tickMargin: 8,
    minTickGap: 12,
    stroke: "var(--chart-axis)",
    fontSize: 12,
  },
  grid: {
    stroke: "var(--chart-grid)",
    strokeDasharray: "1 3",
    vertical: true,
    horizontal: true,
  },
  tooltip: {
    cursor: {
      stroke: "var(--chart-cursor)",
      strokeDasharray: "2 2",
      strokeWidth: 1,
    },
  },
  line: {
    type: "monotone",
    strokeWidth: 2.1,
    dot: false,
    activeDot: {
      r: 2,
      strokeWidth: 1,
    },
  },
  area: {
    type: "monotone",
    strokeWidth: 2.1,
    fillOpacity: 0.28,
  },
}

export function getChartThemePreset(theme: ChartThemeKey): ChartThemePreset {
  return {
    name: theme,
    vars: CHART_THEME_PRESET_VARS[theme] as CSSProperties,
  }
}

export function getChartPresentation(theme?: ChartThemeKey): ChartPresentation {
  if (theme === "terminal") {
    return TERMINAL_CHART_PRESENTATION
  }

  return CHART_PRESENTATION
}

export function getChartContainerClassName(theme?: ChartThemeKey): string {
  if (theme === "terminal") {
    return "rounded-none border-[1.5px] p-2"
  }

  return ""
}
