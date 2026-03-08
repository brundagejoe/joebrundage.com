import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Link } from "@/shared/ui/link"
import { Inline, StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Link",
  component: Link,
  tags: ["autodocs"],
  args: {
    children: "Read the docs",
    href: "#",
    external: false,
  },
} satisfies Meta<typeof Link>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const InternalAndExternal: Story = {
  render: () => (
    <StorySurface>
      <Inline>
        <Link href="#components">Internal link</Link>
        <Link href="https://storybook.js.org" external>
          External link
        </Link>
      </Inline>
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => (
    <ThemeMatrix
      render={() => <Link href="https://storybook.js.org" external>Theme-aware link</Link>}
    />
  ),
}
