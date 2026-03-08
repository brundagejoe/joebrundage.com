import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Copy, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Dropdown Menu",
  component: DropdownMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

function ExampleMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">Open menu</Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil />
            Rename
            <DropdownMenuShortcut>R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Duplicate
            <DropdownMenuShortcut>D</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More actions</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Default: Story = {
  render: () => <ExampleMenu />,
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <ExampleMenu />} />,
}
