import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
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
