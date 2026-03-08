import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/shared/ui/combobox"
import { ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>

export default meta

type Story = StoryObj<typeof meta>

const toolOptions = [
  { code: "bayes", title: "Bayes primer" },
  { code: "ev", title: "Expected value primer" },
  { code: "ms", title: "Meeting scheduler" },
  { code: "orgc", title: "Organization chart" },
]

function ToolCombobox() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [value, setValue] = React.useState<(typeof toolOptions)[number] | null>(null)

  const filteredTools = React.useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) {
      return toolOptions
    }

    return toolOptions.filter(
      (item) =>
        item.code.includes(normalizedQuery) ||
        item.title.toLowerCase().includes(normalizedQuery)
    )
  }, [query])

  return (
    <div className="w-[min(30rem,100%)]">
      <Combobox<(typeof toolOptions)[number]>
        open={open}
        onOpenChange={setOpen}
        value={value}
        onValueChange={setValue}
        inputValue={query}
        onInputValueChange={setQuery}
        filteredItems={filteredTools}
        itemToStringLabel={(item) => `${item.code} ${item.title}`}
        autoHighlight
      >
        <ComboboxInput
          className="w-full"
          placeholder="Search tools by code or title"
          onFocus={() => setOpen(true)}
        />
        <ComboboxContent>
          <ComboboxList>
            {(item: (typeof toolOptions)[number]) => (
              <ComboboxItem key={item.code} value={item}>
                <div className="grid w-full grid-cols-[72px_1fr] gap-2 font-mono">
                  <span className="font-semibold">{item.code}</span>
                  <span className="truncate text-primary">{item.title}</span>
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No matching tools.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export const Default: Story = {
  render: () => <ToolCombobox />,
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <ToolCombobox />} />,
}
