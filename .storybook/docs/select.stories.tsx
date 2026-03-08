import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

function PlanSelect() {
  return (
    <Select defaultValue="pro">
      <SelectTrigger className="min-w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Plans</SelectLabel>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Archive</SelectLabel>
          <SelectItem value="legacy" disabled>
            Legacy
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const Default: Story = {
  render: () => (
    <StorySurface className="h-64 w-[24rem] items-start">
      <PlanSelect />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <PlanSelect />} />,
}
