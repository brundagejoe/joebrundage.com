import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRight, Download, Sparkles } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Inline, Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Continue",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Primary action primitive built on Base UI button semantics. The button pilot sets the Storybook docs structure used for the rest of the reusable UI catalog.",
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <StorySurface>
      <Inline>
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link button</Button>
      </Inline>
    </StorySurface>
  ),
}

export const Sizes: Story = {
  render: () => (
    <StorySurface>
      <Inline className="items-end">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Download">
          <Download />
        </Button>
        <Button size="icon-sm" aria-label="Sparkles">
          <Sparkles />
        </Button>
      </Inline>
    </StorySurface>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <StorySurface>
      <Inline>
        <Button>
          <Sparkles data-icon="inline-start" />
          Generate
        </Button>
        <Button variant="outline">
          Export
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button disabled>
          <Download data-icon="inline-start" />
          Disabled
        </Button>
      </Inline>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <Stack>
          <Inline>
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
          </Inline>
          <Inline>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </Inline>
        </Stack>
      )}
    />
  ),
}
