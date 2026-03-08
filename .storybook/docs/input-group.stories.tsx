import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Eye, Search } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/shared/ui/input-group"
import { Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Input Group",
  component: InputGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>

export default meta

type Story = StoryObj<typeof meta>

export const SearchField: Story = {
  render: () => (
    <StorySurface className="w-[30rem]">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Search />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="Search tools" />
      </InputGroup>
    </StorySurface>
  ),
}

export const ActionField: Story = {
  render: () => (
    <StorySurface className="w-[30rem]">
      <Stack>
        <InputGroup>
          <InputGroupInput type="password" defaultValue="hunter2" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" variant="ghost" aria-label="Reveal password">
              <Eye />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon align="block-start">
            <InputGroupText>Notes</InputGroupText>
          </InputGroupAddon>
          <InputGroupTextarea defaultValue="This input group shows the multiline layout." />
        </InputGroup>
      </Stack>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="joebrundage.com" />
        </InputGroup>
      )}
    />
  ),
}
