import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"

import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"
import { StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 60,
  },
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

function SliderDemo(args: React.ComponentProps<typeof Slider>) {
  const initialValue = Array.isArray(args.defaultValue)
    ? args.defaultValue[0]
    : typeof args.defaultValue === "number"
      ? args.defaultValue
      : 50
  const [value, setValue] = React.useState(initialValue)

  return (
    <div className="grid gap-3 md:grid-cols-[180px_1fr_48px] md:items-center">
      <Label>Confidence</Label>
      <Slider
        {...args}
        value={value}
        onValueChange={(next) => setValue(Array.isArray(next) ? next[0] : next)}
      />
      <span className="text-right text-sm text-muted-foreground">{value}%</span>
    </div>
  )
}

function SliderThemePreview() {
  const [value, setValue] = React.useState(40)

  return (
    <div className="w-full min-w-0 max-w-xs space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Confidence</Label>
        <span className="text-sm text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={10}
        value={value}
        onValueChange={(next) => setValue(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

export const Playground: Story = {
  render: (args) => (
    <StorySurface className="w-[34rem]">
      <SliderDemo {...args} />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <SliderThemePreview />} />,
}
