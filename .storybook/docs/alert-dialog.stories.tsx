import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { TriangleAlert } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Alert Dialog",
  component: AlertDialog,
  tags: ["autodocs"],
} satisfies Meta<typeof AlertDialog>

export default meta

type Story = StoryObj<typeof meta>

function DeleteDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive">Delete project</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The project and all generated reports will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Default: Story = {
  render: () => <DeleteDialog />,
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <DeleteDialog />} />,
}
