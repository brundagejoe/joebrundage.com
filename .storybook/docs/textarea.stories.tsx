import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Textarea } from "@/shared/ui/textarea"
import { Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Add a short note",
    rows: 4,
    disabled: false,
  },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <StorySurface className="w-[30rem]">
      <Stack>
        <Textarea placeholder="Default textarea" />
        <Textarea
          aria-invalid
          defaultValue="This example shows the invalid state."
        />
        <Textarea disabled defaultValue="Disabled textarea" />
      </Stack>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix render={() => <Textarea defaultValue="Theme-aware notes." />} />
  ),
}
