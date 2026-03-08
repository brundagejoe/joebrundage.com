import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { Stack, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    orientation: "vertical",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

function SignupField({ orientation = "vertical" as const }) {
  return (
    <FieldSet className="max-w-xl">
      <FieldLegend>Create account</FieldLegend>
      <FieldGroup>
        <Field orientation={orientation}>
          <FieldLabel htmlFor="field-story-email">Email</FieldLabel>
          <FieldContent>
            <Input id="field-story-email" placeholder="name@example.com" />
            <FieldDescription>
              We only use this for login and important account messages.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field data-invalid className="gap-2">
          <FieldLabel htmlFor="field-story-password">Password</FieldLabel>
          <FieldContent>
            <Input
              id="field-story-password"
              type="password"
              defaultValue="short"
              aria-invalid
            />
            <FieldError>Password must be at least 12 characters.</FieldError>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <FieldTitle>Weekly summary</FieldTitle>
          <Switch defaultChecked />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

export const Playground: Story = {
  render: (args) => (
    <StorySurface className="w-full max-w-3xl">
      <SignupField orientation={args.orientation} />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => (
        <Stack>
          <Field>
            <FieldLabel htmlFor="theme-field-email">Email</FieldLabel>
            <FieldContent>
              <Input id="theme-field-email" placeholder="name@example.com" />
              <FieldDescription>Theme-aware field description.</FieldDescription>
            </FieldContent>
          </Field>
        </Stack>
      )}
    />
  ),
}
