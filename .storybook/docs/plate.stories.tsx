import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Caption, Row, Section } from "@/shared/ui/plate"
import { StorySurface, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Plate",
  component: Section,
  tags: ["autodocs"],
  args: {
    children: "Figure 1 · The difference itself",
  },
} satisfies Meta<typeof Section>

export default meta

type Story = StoryObj<typeof meta>

function Example() {
  return (
    <div className="plate">
      <Section className="mt-0">Figure 1 &nbsp;&middot;&nbsp; The verdict</Section>
      <Row
        note={
          <>
            Notes belong in the margin. A parenthetical in the main text is a
            smell.
          </>
        }
      >
        <p className="mt-4 max-w-[38rem] text-[1.5rem] leading-[1.45]">
          Ship B. It converts better than A with probability{" "}
          <span className="plate-figures">95.9%</span>.
        </p>
        <Caption>
          Captions are complete sentences that carry content, including live
          numbers, rather than panel titles.
        </Caption>
      </Row>
    </div>
  )
}

export const Playground: Story = {
  render: () => (
    <StorySurface className="w-full max-w-4xl">
      <Example />
    </StorySurface>
  ),
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <Example />} />,
}
