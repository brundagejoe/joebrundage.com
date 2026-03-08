import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import fsd from "@feature-sliced/steiger-plugin"
import steigerConfig from "../steiger.config.mjs"

const repoRoot = process.cwd()
const fsdRoots = ["app", "shared", "entities", "features", "widgets"]
const ignoredExtensions = new Set([".css", ".ico", ".svg"])

function getRuleSeverity(ruleName) {
  let severity = "off"

  for (const configEntry of steigerConfig) {
    if ("rules" in configEntry && configEntry.rules?.[ruleName]) {
      severity = configEntry.rules[ruleName]
    }
  }

  return severity
}

async function buildTreeNode(absolutePath) {
  const stats = await fs.stat(absolutePath)

  if (stats.isDirectory()) {
    const entries = await fs.readdir(absolutePath)
    const children = []

    for (const entry of entries) {
      if (entry === "AGENTS.md" || entry === ".DS_Store") {
        continue
      }

      const child = await buildTreeNode(path.join(absolutePath, entry))
      if (child) {
        children.push(child)
      }
    }

    return {
      type: "folder",
      path: absolutePath,
      children,
    }
  }

  if (ignoredExtensions.has(path.extname(absolutePath))) {
    return null
  }

  return {
    type: "file",
    path: absolutePath,
  }
}

async function buildFsdTree() {
  const children = []

  for (const rootName of fsdRoots) {
    const absolutePath = path.join(repoRoot, rootName)

    try {
      children.push(await buildTreeNode(absolutePath))
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      ) {
        throw error
      }
    }
  }

  return {
    type: "folder",
    path: repoRoot,
    children,
  }
}

function formatPath(absolutePath) {
  return path.relative(repoRoot, absolutePath) || "."
}

async function main() {
  const tree = await buildFsdTree()
  const diagnostics = []

  for (const rule of fsd.plugin.ruleDefinitions) {
    const severity = getRuleSeverity(rule.name)
    if (severity === "off") {
      continue
    }

    const result = await rule.check(tree)

    for (const diagnostic of result.diagnostics) {
      diagnostics.push({
        ruleName: rule.name,
        severity,
        message: diagnostic.message,
        path: diagnostic.location.path,
      })
    }
  }

  diagnostics.sort((left, right) => {
    return (
      left.ruleName.localeCompare(right.ruleName) ||
      left.path.localeCompare(right.path) ||
      left.message.localeCompare(right.message)
    )
  })

  if (diagnostics.length === 0) {
    console.log("Steiger passed")
    return
  }

  for (const diagnostic of diagnostics) {
    console.error(
      `${diagnostic.ruleName}: ${formatPath(diagnostic.path)}: ${diagnostic.message}`
    )
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error")
  process.exit(hasErrors ? 1 : 0)
}

await main()
