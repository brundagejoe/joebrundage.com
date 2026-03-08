import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Email",
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithFormControl: Story = {
  render: () => (
    <StorySurface className="w-[24rem]">
      <Stack className="gap-2">
        <Label htmlFor="story-label-email">Email</Label>
        <Input id="story-label-email" placeholder="name@example.com" />
      </Stack>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <Stack className="gap-2">
          <Label htmlFor="theme-matrix-label">Project name</Label>
          <Input id="theme-matrix-label" placeholder="Storybook rollout" />
        </Stack>
      )}
    />
  ),
}
