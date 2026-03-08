import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "@/shared/ui/input"
import { Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "name@example.com",
    type: "text",
    disabled: false,
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "file"],
    },
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <StorySurface className="w-[28rem]">
      <Stack>
        <Input placeholder="Default input" />
        <Input aria-invalid defaultValue="bad-value" />
        <Input disabled defaultValue="Disabled input" />
      </Stack>
    </StorySurface>
  ),
}

export const FileInput: Story = {
  render: () => (
    <StorySurface className="w-[28rem]">
      <Input type="file" />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix render={() => <Input placeholder="Theme-aware input" />} />
  ),
}
