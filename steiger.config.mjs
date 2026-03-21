import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      "fsd/no-cross-imports": "error",
      "fsd/no-higher-level-imports": "error",
    },
    ignores: [
      ".git/**",
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      "public/**",
      "**/*.ico",
      "**/*.svg",
      "**/*.css",
      "**/AGENTS.md",
    ],
  },
])
