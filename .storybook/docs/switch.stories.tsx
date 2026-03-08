import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"

import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Inline, Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: {
    checked: true,
    disabled: false,
    size: "default",
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

function SwitchDemo(args: React.ComponentProps<typeof Switch>) {
  const [checked, setChecked] = React.useState(Boolean(args.checked))

  return <Switch {...args} checked={checked} onCheckedChange={setChecked} />
}

export const Playground: Story = {
  render: (args) => <SwitchDemo {...args} />,
}

export const Labeled: Story = {
  render: () => (
    <StorySurface>
      <Stack className="gap-3">
        <Inline className="justify-between">
          <Label htmlFor="switch-story-default">Email summaries</Label>
          <SwitchDemo id="switch-story-default" checked />
        </Inline>
        <Inline className="justify-between">
          <Label htmlFor="switch-story-small">Compact mode</Label>
          <SwitchDemo id="switch-story-small" size="sm" />
        </Inline>
      </Stack>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <Inline className="justify-between">
          <Label htmlFor="theme-switch">Terminal mode</Label>
          <SwitchDemo id="theme-switch" checked />
        </Inline>
      )}
    />
  ),
}
