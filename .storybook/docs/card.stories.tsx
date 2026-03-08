import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Inline, Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

function ExampleCard({ size = "default" as const }) {
  return (
    <Card size={size} className="w-full max-w-sm">
      <CardHeader className="border-b border-border">
        <CardTitle>Release summary</CardTitle>
        <CardDescription>Track what changed in this deployment.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More options">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Stack className="gap-3">
          <Inline>
            <Badge>Ready</Badge>
            <Badge variant="outline">3 changes</Badge>
          </Inline>
          <p className="text-sm text-muted-foreground">
            Includes the new docs workflow, component catalog, and theme-aware previews.
          </p>
        </Stack>
      </CardContent>
      <CardFooter className="border-t border-border justify-between">
        <span className="text-sm text-muted-foreground">Updated 5 minutes ago</span>
        <Button size="sm">View details</Button>
      </CardFooter>
    </Card>
  )
}

export const Playground: Story = {
  render: (args) => (
    <StorySurface>
      <ExampleCard size={args.size} />
    </StorySurface>
  ),
}

export const Sizes: Story = {
  render: () => (
    <StorySurface>
      <div className="grid gap-4 md:grid-cols-2">
        <ExampleCard size="default" />
        <ExampleCard size="sm" />
      </div>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <ExampleCard size="sm" />} />,
}
