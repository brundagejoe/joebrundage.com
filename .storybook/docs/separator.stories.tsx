import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Separator } from "@/shared/ui/separator"
import { StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Separator",
  component: Separator,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <StorySurface className="w-full max-w-lg">
      {args.orientation === "horizontal" ? (
        <div className="space-y-3">
          <p>Top section</p>
          <Separator {...args} />
          <p>Bottom section</p>
        </div>
      ) : (
        <div className="flex h-16 items-center gap-4">
          <span>Left</span>
          <Separator {...args} className="h-full" />
          <span>Right</span>
        </div>
      )}
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <div className="space-y-3">
          <p>Primary content</p>
          <Separator />
          <p>Secondary content</p>
        </div>
      )}
    />
  ),
}
