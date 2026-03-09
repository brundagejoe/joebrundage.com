import fs from "node:fs"
import path from "node:path"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const repoRoot = process.cwd()
const storybookDocsDir = path.join(repoRoot, ".storybook", "docs")
const tailwindColorPrefixes = [
  "ring-offset",
  "decoration",
  "outline",
  "border",
  "shadow",
  "accent",
  "caret",
  "stroke",
  "fill",
  "ring",
  "text",
  "from",
  "via",
  "bg",
  "to",
]

function getStaticStringValue(node) {
  if (!node) {
    return null
  }

  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value
  }

  if (
    node.type === "TemplateLiteral" &&
    node.expressions.length === 0 &&
    node.quasis.length === 1
  ) {
    return node.quasis[0].value.cooked ?? null
  }

  return null
}

function splitClassTokens(value) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function getTailwindBaseToken(token) {
  let inBracketDepth = 0
  let inParenDepth = 0
  let lastVariantSeparatorIndex = -1

  for (let index = 0; index < token.length; index += 1) {
    const char = token[index]

    if (char === "[") {
      inBracketDepth += 1
    } else if (char === "]") {
      inBracketDepth = Math.max(0, inBracketDepth - 1)
    } else if (char === "(") {
      inParenDepth += 1
    } else if (char === ")") {
      inParenDepth = Math.max(0, inParenDepth - 1)
    } else if (char === ":" && inBracketDepth === 0 && inParenDepth === 0) {
      lastVariantSeparatorIndex = index
    }
  }

  return token.slice(lastVariantSeparatorIndex + 1)
}

function getTailwindColorViolation(token) {
  const baseToken = getTailwindBaseToken(token)
  const prefix = tailwindColorPrefixes.find((candidate) =>
    baseToken.startsWith(`${candidate}-`)
  )

  if (!prefix) {
    return null
  }

  const value = baseToken.slice(prefix.length + 1)
  if (
    value.startsWith("[#") ||
    value.startsWith("[rgb(") ||
    value.startsWith("[rgba(") ||
    value.startsWith("[hsl(") ||
    value.startsWith("[hsla(") ||
    value.startsWith("[hwb(") ||
    value.startsWith("[lab(") ||
    value.startsWith("[lch(") ||
    value.startsWith("[oklab(") ||
    value.startsWith("[oklch(") ||
    value.startsWith("[color(")
  ) {
    return `Tailwind color utility "${token}" uses an arbitrary color value. Use a theme token instead.`
  }

  return null
}

const storyCoveragePlugin = {
  rules: {
    "require-story-for-shared-ui": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Require each public shared/ui component to have a matching centralized Storybook story",
        },
        schema: [],
      },
      create(context) {
        const filename = context.filename
        const componentName = path.basename(filename, path.extname(filename))
        const expectedStoryPath = path.join(
          storybookDocsDir,
          `${componentName}.stories.tsx`
        )

        return {
          Program(node) {
            if (!fs.existsSync(expectedStoryPath)) {
              context.report({
                node,
                message: `Missing Storybook story for shared UI component "${componentName}". Expected ${path.relative(
                  repoRoot,
                  expectedStoryPath
                )}.`,
              })
            }
          },
        }
      },
    },
  },
}

const themeColorPlugin = {
  rules: {
    "no-raw-colors": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Warn when Tailwind classes use arbitrary color values instead of theme tokens.",
        },
        schema: [],
      },
      create(context) {
        function reportTailwindClasses(node, classValue) {
          for (const token of splitClassTokens(classValue)) {
            const violationMessage = getTailwindColorViolation(token)

            if (violationMessage) {
              context.report({
                node,
                message: violationMessage,
              })
            }
          }
        }

        function inspectClassExpression(node) {
          if (!node) {
            return
          }

          const staticValue = getStaticStringValue(node)
          if (staticValue !== null) {
            reportTailwindClasses(node, staticValue)
            return
          }

          if (node.type === "JSXExpressionContainer") {
            inspectClassExpression(node.expression)
            return
          }

          if (node.type === "ConditionalExpression") {
            inspectClassExpression(node.consequent)
            inspectClassExpression(node.alternate)
            return
          }

          if (node.type === "LogicalExpression") {
            inspectClassExpression(node.left)
            inspectClassExpression(node.right)
            return
          }

          if (node.type === "ArrayExpression") {
            for (const element of node.elements) {
              inspectClassExpression(element)
            }
            return
          }

          if (node.type === "ObjectExpression") {
            for (const property of node.properties) {
              if (property.type === "Property") {
                inspectClassExpression(property.key)
              }
            }
            return
          }

          if (node.type === "CallExpression") {
            for (const argument of node.arguments) {
              inspectClassExpression(argument)
            }
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name?.name === "className" || node.name?.name === "class") {
              inspectClassExpression(node.value)
            }
          },
          CallExpression(node) {
            if (
              node.callee.type !== "Identifier" ||
              node.callee.name !== "cva"
            ) {
              return
            }

            for (const argument of node.arguments) {
              inspectClassExpression(argument)
            }
          },
        }
      },
    },
  },
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      semi: ["error", "never"],
    },
  },
  {
    plugins: {
      themeColor: themeColorPlugin,
    },
    rules: {
      "themeColor/no-raw-colors": "warn",
    },
  },
  {
    files: ["shared/ui/*.tsx"],
    plugins: {
      storyCoverage: storyCoveragePlugin,
    },
    rules: {
      "storyCoverage/require-story-for-shared-ui": "error",
    },
  },
])

export default eslintConfig
