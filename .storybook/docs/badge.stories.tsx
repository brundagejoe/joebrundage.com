import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CircleAlert, Sparkles } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Inline, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Stable",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <StorySurface>
      <Inline>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge variant="link">Link</Badge>
      </Inline>
    </StorySurface>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <StorySurface>
      <Inline>
        <Badge>
          <Sparkles />
          New
        </Badge>
        <Badge variant="destructive">
          <CircleAlert />
          High risk
        </Badge>
      </Inline>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <Inline>
          <Badge>Stable</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Alert</Badge>
        </Inline>
      )}
    />
  ),
}
