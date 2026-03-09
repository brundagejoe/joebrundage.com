"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"

type FromAnchor = "bottom" | "left" | "right"
type ToAnchor = "top" | "left" | "right"
type AnyAnchor = FromAnchor | ToAnchor

type OrgChartBox = {
  id: string
  names: string[]
  title: string
  manualRow?: number
  manualColumn?: number
}

type OrgChartConnector = {
  id: string
  fromBoxId: string
  toBoxId: string
  fromAnchor?: FromAnchor
  toAnchor?: ToAnchor
}

type ComputedBoxLayout = OrgChartBox & {
  x: number
  y: number
  width: number
  bodyHeight: number
  ribbonX: number
  ribbonY: number
  ribbonWidth: number
  ribbonHeight: number
  depth: number
}

type ValidationIssue = {
  kind: "error" | "warning"
  message: string
}

type ConnectorRender = {
  connectorId: string
  fromBoxId: string
  toBoxId: string
  path: string
  segments: string[]
}

type Point = { x: number; y: number }

const BLUE = "#4a86e8"
const LIGHT_RIBBON = "#eef3fb"

const LAYOUT = {
  paddingX: 20,
  paddingY: 20,
  boxWidth: 170,
  minBoxHeight: 64,
  rowGap: 56,
  columnGap: 26,
  ribbonHeight: 26,
  connectorStub: 14,
  nameFontSize: 14,
  nameLineHeight: 18,
  nameTopPadding: 18,
  nameBottomPadding: 18,
}
const COPY_PNG_SCALE = 2

const DEFAULT_INPUT = `# Mermaid-like ORGC format
# Node: id["name1; name2 | Title"]
# Node with fixed row: id@r2["name1; name2 | Title"]
# Node with fixed row+order: id@r2c3["name1; name2 | Title"]
# Edge: from --> to
# Optional anchors: from:right --> to:left

a@r0c1["Alex Parker | Team Lead"]
b@r1c0["Jamie Chen | Operations"]
c@r1c1["Morgan Lee | Product"]
d@r1c2["Taylor Singh | Enablement"]
e@r2c1["Casey Rivera; Jordan Blake | Program Support"]

a --> b
a --> c
a --> d
c --> e`

const fromAnchorDirections: Record<FromAnchor, Point> = {
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const toAnchorDirections: Record<ToAnchor, Point> = {
  top: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function parseLabel(label: string): { names: string[]; title: string } {
  const [namesPartRaw, ...titleParts] = label.split("|")
  const namesPart = (namesPartRaw ?? "").replaceAll("\\n", ";")
  const names = namesPart
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  const title = titleParts.join("|").trim()
  return { names, title }
}

function getBodyHeightForNames(namesCount: number): number {
  const safeCount = Math.max(1, namesCount)
  const textBlockHeight = safeCount * LAYOUT.nameLineHeight
  return Math.max(
    LAYOUT.minBoxHeight,
    LAYOUT.nameTopPadding + textBlockHeight + LAYOUT.nameBottomPadding
  )
}

function parseChartInput(input: string): {
  boxes: OrgChartBox[]
  connectors: OrgChartConnector[]
  issues: ValidationIssue[]
} {
  const issues: ValidationIssue[] = []
  const boxMap = new Map<string, OrgChartBox>()
  const connectors: OrgChartConnector[] = []

  const nodeRegex =
    /^([A-Za-z0-9_-]+)(?:@r(\d+)(?:c(\d+))?)?\s*\[\s*"([\s\S]+)"\s*\]$/
  const edgeRegex =
    /^([A-Za-z0-9_-]+)(?::(bottom|left|right))?\s*-->\s*([A-Za-z0-9_-]+)(?::(top|left|right))?$/

  const lines = input.split("\n")

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    const lineNo = index + 1

    if (!line || line.startsWith("#") || line.startsWith("%%")) {
      return
    }

    const nodeMatch = line.match(nodeRegex)
    if (nodeMatch) {
      const [, id, manualRowRaw, manualColumnRaw, label] = nodeMatch
      const { names, title } = parseLabel(label)
      const manualRow =
        manualRowRaw !== undefined ? Number.parseInt(manualRowRaw, 10) : undefined
      const manualColumn =
        manualColumnRaw !== undefined
          ? Number.parseInt(manualColumnRaw, 10)
          : undefined

      if (boxMap.has(id)) {
        issues.push({
          kind: "error",
          message: `Line ${lineNo}: duplicate box ID "${id}".`,
        })
        return
      }
      if (names.length === 0) {
        issues.push({
          kind: "error",
          message: `Line ${lineNo}: node "${id}" must include at least one name before '|'.`,
        })
      }
      if (!title) {
        issues.push({
          kind: "error",
          message: `Line ${lineNo}: node "${id}" must include a title after '|'.`,
        })
      }

      boxMap.set(id, { id, names, title, manualRow, manualColumn })
      return
    }

    const edgeMatch = line.match(edgeRegex)
    if (edgeMatch) {
      const [, fromBoxId, fromAnchorRaw, toBoxId, toAnchorRaw] = edgeMatch
      connectors.push({
        id: `${fromBoxId}-${toBoxId}-${connectors.length + 1}`,
        fromBoxId,
        toBoxId,
        fromAnchor: fromAnchorRaw as FromAnchor | undefined,
        toAnchor: toAnchorRaw as ToAnchor | undefined,
      })
      return
    }

    issues.push({
      kind: "error",
      message:
        `Line ${lineNo}: unsupported syntax. Use id["names | title"], id@rN[...], id@rNcM[...] or from --> to.`,
    })
  })

  const boxes = Array.from(boxMap.values())
  const boxIdSet = new Set(boxes.map((box) => box.id))

  connectors.forEach((connector) => {
    if (!boxIdSet.has(connector.fromBoxId)) {
      issues.push({
        kind: "error",
        message: `Connector ${connector.fromBoxId} --> ${connector.toBoxId}: source does not exist.`,
      })
    }
    if (!boxIdSet.has(connector.toBoxId)) {
      issues.push({
        kind: "error",
        message: `Connector ${connector.fromBoxId} --> ${connector.toBoxId}: target does not exist.`,
      })
    }
    if (connector.fromBoxId === connector.toBoxId) {
      issues.push({
        kind: "error",
        message: `Connector ${connector.fromBoxId} --> ${connector.toBoxId}: self-links are not allowed.`,
      })
    }
  })

  return { boxes, connectors, issues }
}

function findCycles(boxes: OrgChartBox[], connectors: OrgChartConnector[]): string[][] {
  const adjacency = new Map<string, string[]>()
  boxes.forEach((box) => adjacency.set(box.id, []))
  connectors.forEach((connector) => {
    if (adjacency.has(connector.fromBoxId) && adjacency.has(connector.toBoxId)) {
      adjacency.get(connector.fromBoxId)?.push(connector.toBoxId)
    }
  })

  const state = new Map<string, 0 | 1 | 2>()
  const stack: string[] = []
  const cycles: string[][] = []

  const dfs = (node: string) => {
    state.set(node, 1)
    stack.push(node)

    for (const next of adjacency.get(node) ?? []) {
      const nextState = state.get(next) ?? 0
      if (nextState === 0) {
        dfs(next)
      } else if (nextState === 1) {
        const idx = stack.indexOf(next)
        if (idx >= 0) {
          cycles.push([...stack.slice(idx), next])
        }
      }
    }

    stack.pop()
    state.set(node, 2)
  }

  boxes.forEach((box) => {
    if ((state.get(box.id) ?? 0) === 0) {
      dfs(box.id)
    }
  })

  return cycles
}

function getAnchorPoint(layout: ComputedBoxLayout, anchor: AnyAnchor): Point {
  switch (anchor) {
    case "top":
      return { x: layout.x + layout.width / 2, y: layout.y }
    case "bottom":
      return { x: layout.x + layout.width / 2, y: layout.y + layout.bodyHeight }
    case "left":
      return { x: layout.x, y: layout.y + layout.bodyHeight / 2 }
    case "right":
      return { x: layout.x + layout.width, y: layout.y + layout.bodyHeight / 2 }
  }
}

function inferAnchors(from: ComputedBoxLayout, to: ComputedBoxLayout): {
  fromAnchor: FromAnchor
  toAnchor: ToAnchor
} {
  if (to.depth > from.depth) {
    return { fromAnchor: "bottom", toAnchor: "top" }
  }
  if (to.x >= from.x) {
    return { fromAnchor: "right", toAnchor: "left" }
  }
  return { fromAnchor: "left", toAnchor: "right" }
}

function buildOrthogonalPath(
  fromLayout: ComputedBoxLayout,
  toLayout: ComputedBoxLayout,
  fromAnchor: FromAnchor,
  toAnchor: ToAnchor
): { path: string; segments: string[] } {
  const from = getAnchorPoint(fromLayout, fromAnchor)
  const to = getAnchorPoint(toLayout, toAnchor)
  const fromDir = fromAnchorDirections[fromAnchor]
  const toDir = toAnchorDirections[toAnchor]

  const p1 = {
    x: from.x + fromDir.x * LAYOUT.connectorStub,
    y: from.y + fromDir.y * LAYOUT.connectorStub,
  }
  const p2 = {
    x: to.x + toDir.x * LAYOUT.connectorStub,
    y: to.y + toDir.y * LAYOUT.connectorStub,
  }

  if (fromAnchor === "bottom" && toAnchor === "top" && toLayout.depth > fromLayout.depth) {
    const fromExitY = from.y + LAYOUT.connectorStub
    const toEntryY = to.y - LAYOUT.connectorStub
    const preferredSplitY = toLayout.y - LAYOUT.rowGap / 2
    const splitY = Math.min(toEntryY, Math.max(fromExitY, preferredSplitY))

    const specialPoints: Point[] = [
      from,
      { x: from.x, y: fromExitY },
      { x: from.x, y: splitY },
      { x: to.x, y: splitY },
      { x: to.x, y: toEntryY },
      to,
    ]

    const dedupedSpecial: Point[] = []
    for (const point of specialPoints) {
      const prev = dedupedSpecial[dedupedSpecial.length - 1]
      if (!prev || prev.x !== point.x || prev.y !== point.y) {
        dedupedSpecial.push(point)
      }
    }

    const specialPath = dedupedSpecial
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
      )
      .join(" ")

    const specialSegments: string[] = []
    for (let i = 0; i < dedupedSpecial.length - 1; i += 1) {
      const a = dedupedSpecial[i]
      const b = dedupedSpecial[i + 1]
      if (a.x === b.x) {
        const minY = Math.min(a.y, b.y)
        const maxY = Math.max(a.y, b.y)
        specialSegments.push(`V:${a.x.toFixed(2)}:${minY.toFixed(2)}:${maxY.toFixed(2)}`)
      } else {
        const minX = Math.min(a.x, b.x)
        const maxX = Math.max(a.x, b.x)
        specialSegments.push(`H:${a.y.toFixed(2)}:${minX.toFixed(2)}:${maxX.toFixed(2)}`)
      }
    }

    return { path: specialPath, segments: specialSegments }
  }

  const points: Point[] = [from, p1]

  if (p1.x !== p2.x || p1.y !== p2.y) {
    if (p1.x === p2.x || p1.y === p2.y) {
      points.push(p2)
    } else if (fromAnchor === "left" || fromAnchor === "right") {
      points.push({ x: p1.x, y: p2.y }, p2)
    } else {
      points.push({ x: p2.x, y: p1.y }, p2)
    }
  }

  points.push(to)

  const deduped: Point[] = []
  for (const point of points) {
    const prev = deduped[deduped.length - 1]
    if (!prev || prev.x !== point.x || prev.y !== point.y) {
      deduped.push(point)
    }
  }

  const path = deduped
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ")

  const segments: string[] = []
  for (let i = 0; i < deduped.length - 1; i += 1) {
    const a = deduped[i]
    const b = deduped[i + 1]
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y)
      const maxY = Math.max(a.y, b.y)
      segments.push(`V:${a.x.toFixed(2)}:${minY.toFixed(2)}:${maxY.toFixed(2)}`)
    } else {
      const minX = Math.min(a.x, b.x)
      const maxX = Math.max(a.x, b.x)
      segments.push(`H:${a.y.toFixed(2)}:${minX.toFixed(2)}:${maxX.toFixed(2)}`)
    }
  }

  return { path, segments }
}

function computeLayout(
  boxes: OrgChartBox[],
  connectors: OrgChartConnector[]
): {
  layouts: ComputedBoxLayout[]
  connectorRenders: ConnectorRender[]
  issues: ValidationIssue[]
  svgWidth: number
  svgHeight: number
} {
  const issues: ValidationIssue[] = []

  const incoming = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  boxes.forEach((box) => {
    incoming.set(box.id, 0)
    adjacency.set(box.id, [])
  })

  connectors.forEach((edge) => {
    if (!adjacency.has(edge.fromBoxId) || !adjacency.has(edge.toBoxId)) {
      return
    }
    adjacency.get(edge.fromBoxId)?.push(edge.toBoxId)
    incoming.set(edge.toBoxId, (incoming.get(edge.toBoxId) ?? 0) + 1)
  })

  const depth = new Map<string, number>()
  boxes.forEach((box) => depth.set(box.id, 0))

  const indegree = new Map(incoming)
  const queue = Array.from(indegree.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }
    const baseDepth = depth.get(current) ?? 0

    for (const next of adjacency.get(current) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, baseDepth + 1))
      indegree.set(next, (indegree.get(next) ?? 0) - 1)
      if ((indegree.get(next) ?? 0) === 0) {
        queue.push(next)
        queue.sort()
      }
    }
  }

  const byDepth = new Map<number, OrgChartBox[]>()
  boxes.forEach((box) => {
    const level = box.manualRow ?? (depth.get(box.id) ?? 0)
    byDepth.set(level, [...(byDepth.get(level) ?? []), box])
  })

  const depthLevels = Array.from(byDepth.keys()).sort((a, b) => a - b)
  depthLevels.forEach((level) => {
    byDepth.get(level)?.sort((a, b) => {
      const colA = a.manualColumn ?? Number.MAX_SAFE_INTEGER
      const colB = b.manualColumn ?? Number.MAX_SAFE_INTEGER
      if (colA !== colB) {
        return colA - colB
      }
      return a.id.localeCompare(b.id)
    })
  })

  const layerWidths = depthLevels.map((level) => {
    const count = byDepth.get(level)?.length ?? 0
    if (count === 0) {
      return 0
    }
    return count * LAYOUT.boxWidth + (count - 1) * LAYOUT.columnGap
  })
  const maxLayerWidth = Math.max(...layerWidths, LAYOUT.boxWidth)

  const rowTopByLevel = new Map<number, number>()
  const rowHeightByLevel = new Map<number, number>()
  let nextRowY = LAYOUT.paddingY
  depthLevels.forEach((level) => {
    const layer = byDepth.get(level) ?? []
    const tallestInRow = Math.max(
      ...layer.map((box) => getBodyHeightForNames(box.names.length)),
      LAYOUT.minBoxHeight
    )
    rowHeightByLevel.set(level, tallestInRow)
    rowTopByLevel.set(level, nextRowY)
    nextRowY += tallestInRow + LAYOUT.rowGap
  })

  const layouts: ComputedBoxLayout[] = []
  depthLevels.forEach((level) => {
    const layer = byDepth.get(level) ?? []
    const layerWidth =
      layer.length * LAYOUT.boxWidth + Math.max(0, layer.length - 1) * LAYOUT.columnGap
    const startX = LAYOUT.paddingX + (maxLayerWidth - layerWidth) / 2
    const y = rowTopByLevel.get(level) ?? LAYOUT.paddingY
    const bodyHeight = rowHeightByLevel.get(level) ?? LAYOUT.minBoxHeight

    layer.forEach((box, idx) => {
      const x = startX + idx * (LAYOUT.boxWidth + LAYOUT.columnGap)
      const ribbonWidth = Math.max(100, Math.min(150, LAYOUT.boxWidth - 12))
      const ribbonX = x + (LAYOUT.boxWidth - ribbonWidth) / 2
      const ribbonY = y + bodyHeight - LAYOUT.ribbonHeight * 0.45

      layouts.push({
        ...box,
        x,
        y,
        width: LAYOUT.boxWidth,
        bodyHeight,
        ribbonX,
        ribbonY,
        ribbonWidth,
        ribbonHeight: LAYOUT.ribbonHeight,
        depth: level,
      })
    })
  })

  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))

  const connectorRenders: ConnectorRender[] = []
  connectors.forEach((connector) => {
    const fromLayout = layoutById.get(connector.fromBoxId)
    const toLayout = layoutById.get(connector.toBoxId)
    if (!fromLayout || !toLayout) {
      return
    }

    const inferred = inferAnchors(fromLayout, toLayout)
    const fromAnchor = connector.fromAnchor ?? inferred.fromAnchor
    const toAnchor = connector.toAnchor ?? inferred.toAnchor

    const { path, segments } = buildOrthogonalPath(
      fromLayout,
      toLayout,
      fromAnchor,
      toAnchor
    )

    connectorRenders.push({
      connectorId: connector.id,
      fromBoxId: connector.fromBoxId,
      toBoxId: connector.toBoxId,
      path,
      segments,
    })
  })

  const segmentToConnectors = new Map<string, ConnectorRender[]>()
  connectorRenders.forEach((render) => {
    render.segments.forEach((segment) => {
      segmentToConnectors.set(segment, [...(segmentToConnectors.get(segment) ?? []), render])
    })
  })

  segmentToConnectors.forEach((renders) => {
    const uniqueConnectorIds = Array.from(new Set(renders.map((render) => render.connectorId)))
    if (uniqueConnectorIds.length <= 1) {
      return
    }

    const uniqueFromIds = new Set(renders.map((render) => render.fromBoxId))
    if (uniqueFromIds.size <= 1) {
      return
    }

    if (uniqueConnectorIds.length > 1) {
      issues.push({
        kind: "warning",
        message: `Connector overlap detected: ${uniqueConnectorIds.join(", ")}.`,
      })
    }
  })

  const cycles = findCycles(boxes, connectors)
  cycles.forEach((cycle) => {
    issues.push({
      kind: "warning",
      message: `Cycle detected: ${cycle.join(" -> ")}.`,
    })
  })

  const degreeMap = new Map<string, number>()
  boxes.forEach((box) => degreeMap.set(box.id, 0))
  connectors.forEach((connector) => {
    if (degreeMap.has(connector.fromBoxId)) {
      degreeMap.set(connector.fromBoxId, (degreeMap.get(connector.fromBoxId) ?? 0) + 1)
    }
    if (degreeMap.has(connector.toBoxId)) {
      degreeMap.set(connector.toBoxId, (degreeMap.get(connector.toBoxId) ?? 0) + 1)
    }
  })

  const isolated = boxes.filter((box) => (degreeMap.get(box.id) ?? 0) === 0)
  if (isolated.length > 0) {
    issues.push({
      kind: "warning",
      message: `Isolated boxes: ${isolated.map((item) => item.id).join(", ")}.`,
    })
  }

  const maxRight = layouts.reduce(
    (maxValue, layout) => Math.max(maxValue, layout.x + layout.width),
    LAYOUT.paddingX + LAYOUT.boxWidth
  )
  const maxBottom = layouts.reduce(
    (maxValue, layout) => Math.max(maxValue, layout.y + layout.bodyHeight + 20),
    LAYOUT.paddingY + LAYOUT.minBoxHeight
  )

  return {
    layouts,
    connectorRenders,
    issues,
    svgWidth: maxRight + LAYOUT.paddingX,
    svgHeight: maxBottom + LAYOUT.paddingY,
  }
}

export default function OrgChartComposerToolPage() {
  const [diagramInput, setDiagramInput] = React.useState(DEFAULT_INPUT)
  const [copyStatus, setCopyStatus] = React.useState<{
    kind: "error" | "success"
    message: string
  } | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  const analysis = React.useMemo(() => {
    const parsed = parseChartInput(diagramInput)
    const hasParseErrors = parsed.issues.some((issue) => issue.kind === "error")

    if (hasParseErrors || parsed.boxes.length === 0) {
      return {
        layouts: [] as ComputedBoxLayout[],
        connectorRenders: [] as ConnectorRender[],
        issues: parsed.issues,
        hasHardErrors: true,
        svgWidth: 260,
        svgHeight: 160,
      }
    }

    const computed = computeLayout(parsed.boxes, parsed.connectors)
    const issues = [...parsed.issues, ...computed.issues]

    return {
      layouts: computed.layouts,
      connectorRenders: computed.connectorRenders,
      issues,
      hasHardErrors: issues.some((issue) => issue.kind === "error"),
      svgWidth: computed.svgWidth,
      svgHeight: computed.svgHeight,
    }
  }, [diagramInput])

  const serializeSvgWithSansFont = (svgNode: SVGSVGElement): string => {
    const clone = svgNode.cloneNode(true) as SVGSVGElement
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    }

    const defs =
      (clone.querySelector("defs") as SVGDefsElement | null) ??
      document.createElementNS("http://www.w3.org/2000/svg", "defs")
    if (!defs.parentNode) {
      clone.insertBefore(defs, clone.firstChild)
    }

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
    style.textContent = "text, tspan { font-family: Arial, Helvetica, sans-serif; }"
    defs.append(style)

    const serializer = new XMLSerializer()
    return serializer.serializeToString(clone)
  }

  const buildPngBlobFromPreview = async (): Promise<Blob> => {
    const svgNode = svgRef.current
    if (!svgNode || analysis.layouts.length === 0 || analysis.hasHardErrors) {
      throw new Error("Resolve hard errors before copying PNG.")
    }

    const svgMarkup = serializeSvgWithSansFont(svgNode)
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)

    try {
      const image = new Image()
      image.decoding = "sync"
      const loaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("Failed to render PNG from SVG."))
      })

      image.src = svgUrl
      await loaded

      const canvas = document.createElement("canvas")
      const logicalWidth = Math.ceil(analysis.svgWidth)
      const logicalHeight = Math.ceil(analysis.svgHeight)
      const pixelScale = Math.max(COPY_PNG_SCALE, Math.ceil(window.devicePixelRatio || 1))
      canvas.width = logicalWidth * pixelScale
      canvas.height = logicalHeight * pixelScale
      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Failed to initialize PNG canvas.")
      }

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = "high"
      context.setTransform(pixelScale, 0, 0, pixelScale, 0, 0)
      context.clearRect(0, 0, logicalWidth, logicalHeight)
      context.drawImage(image, 0, 0, logicalWidth, logicalHeight)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      )
      if (!blob) {
        throw new Error("Failed to build PNG output.")
      }
      return blob
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }

  const handleCopyPng = async () => {
    setCopyStatus(null)
    try {
      if (
        typeof ClipboardItem === "undefined" ||
        !("clipboard" in navigator) ||
        typeof navigator.clipboard.write !== "function"
      ) {
        throw new Error("PNG clipboard copy is not supported in this browser.")
      }

      const pngBlob = await buildPngBlobFromPreview()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])

      setCopyStatus({
        kind: "success",
        message: "PNG copied to clipboard.",
      })
    } catch (error) {
      setCopyStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Unexpected PNG clipboard failure.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Org Chart Composer (ORGC)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Use a mermaid-like text format to define boxes and connectors.</p>
              <pre className="overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
{`id["name1; name2 | Title"]
id@r2["name1; name2 | Title"]
id@r2c3["name1; name2 | Title"]
from --> to
from:right --> to:left`}
              </pre>
              <p>Tip: Use semicolons or \\n for multiple names in one box.</p>
              <p>Use `@rN` to force a row and `@rNcM` to control row + position order.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagram Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                }}
                className="space-y-3"
              >
                <Textarea
                  value={diagramInput}
                  onChange={(event) => setDiagramInput(event.target.value)}
                  rows={18}
                  className="font-mono text-xs"
                  placeholder='a@r0c1["Joe | President"]\na --> b'
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDiagramInput(DEFAULT_INPUT)}
                  >
                    Load Sample
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCopyPng}
                    disabled={analysis.hasHardErrors || analysis.layouts.length === 0}
                  >
                    Copy PNG
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
            <CardTitle>Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analysis.issues.length === 0 ? (
              <p
                className="text-emerald-600"
              >
                No issues found.
              </p>
            ) : (
              <ul className="space-y-1">
                {analysis.issues.map((issue, index) => (
                  <li
                    key={`${issue.kind}-${index}`}
                    className={issue.kind === "error" ? "text-destructive" : "text-amber-700"}
                  >
                    [{issue.kind.toUpperCase()}] {issue.message}
                  </li>
                ))}
              </ul>
            )}
            {copyStatus ? (
              <p
                className={
                  copyStatus.kind === "error"
                    ? "text-destructive"
                    : "text-emerald-600"
                }
              >
                {copyStatus.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-md border border-border p-3">
                <svg
                  ref={svgRef}
                  xmlns="http://www.w3.org/2000/svg"
                  width={analysis.svgWidth}
                  height={analysis.svgHeight}
                  viewBox={`0 0 ${analysis.svgWidth} ${analysis.svgHeight}`}
                  role="img"
                  aria-label="Org chart preview"
                  fontFamily="Arial, Helvetica, sans-serif"
                >
                  <g stroke={BLUE} fill="none" strokeWidth={3} strokeLinecap="square">
                    {analysis.connectorRenders.map((connectorRender) => (
                      <path key={connectorRender.connectorId} d={connectorRender.path} />
                    ))}
                  </g>

                  <g>
                    {analysis.layouts.map((layout) => {
                      const textBlockHeight =
                        (layout.names.length - 1) * LAYOUT.nameLineHeight
                      const firstNameY = layout.y + layout.bodyHeight / 2 - textBlockHeight / 2

                      return (
                        <g key={layout.id}>
                          <rect
                            x={layout.x}
                            y={layout.y}
                            width={layout.width}
                            height={layout.bodyHeight}
                            rx={3}
                            ry={3}
                            fill={BLUE}
                          />

                          <text
                            x={layout.x + layout.width / 2}
                            y={firstNameY}
                            fill="#ffffff"
                            fontSize={LAYOUT.nameFontSize}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {layout.names.map((name, index) => (
                              <tspan
                                key={`${layout.id}-name-${index}`}
                                x={layout.x + layout.width / 2}
                                y={index === 0 ? firstNameY : undefined}
                                dy={index === 0 ? 0 : LAYOUT.nameLineHeight}
                              >
                                {name}
                              </tspan>
                            ))}
                          </text>

                          <rect
                            x={layout.ribbonX}
                            y={layout.ribbonY}
                            width={layout.ribbonWidth}
                            height={layout.ribbonHeight}
                            rx={2}
                            ry={2}
                            fill={LIGHT_RIBBON}
                            stroke={BLUE}
                            strokeWidth={2}
                          />

                          <text
                            x={layout.ribbonX + layout.ribbonWidth / 2}
                            y={layout.ribbonY + layout.ribbonHeight / 2 + 4}
                            fill="#111111"
                            fontSize={13}
                            textAnchor="middle"
                          >
                            {layout.title}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
