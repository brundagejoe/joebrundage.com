import fs from "node:fs"
import path from "node:path"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const repoRoot = process.cwd()
const storybookDocsDir = path.join(repoRoot, ".storybook", "docs")

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
