import type { Preview } from "@storybook/nextjs-vite"

import "@/app/globals.css"

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      expanded: true,
      sort: "requiredFirst",
    },
    backgrounds: {
      disable: true,
    },
    options: {
      storySort: {
        order: [
          "Getting Started",
          "Components",
          [
            "Button",
            "Badge",
            "Card",
            "Chart",
            "Input",
            "Textarea",
            "Label",
            "Link",
            "Separator",
            "Switch",
            "Slider",
            "Field",
            "Input Group",
            "Select",
            "Combobox",
            "Dropdown Menu",
            "Navigation Menu",
            "Alert Dialog",
          ],
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Preview theme",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "terminal", title: "Terminal" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light"

      if (typeof document !== "undefined") {
        const root = document.documentElement

        root.classList.remove("dark", "terminal")

        if (theme === "dark") {
          root.classList.add("dark")
        }

        if (theme === "terminal") {
          root.classList.add("dark", "terminal")
        }
      }

      return (
        <div className="bg-background text-foreground inline-block max-w-full p-6">
          <Story />
        </div>
      )
    },
  ],
}

export default preview
