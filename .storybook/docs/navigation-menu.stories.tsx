import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { BookOpen, Calculator, Sigma } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/shared/ui/navigation-menu"
import { Stack, ThemeMatrix } from "./helpers"

const meta = {
  title: "Components/Navigation Menu",
  component: NavigationMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof NavigationMenu>

export default meta

type Story = StoryObj<typeof meta>

function DocsNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[24rem] gap-1">
              <NavigationMenuLink href="#">
                <BookOpen />
                <Stack className="gap-1">
                  <span className="font-medium">Bayes Primer</span>
                  <span className="text-muted-foreground text-sm">
                    Learn conditional probability with practical examples.
                  </span>
                </Stack>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <Calculator />
                <Stack className="gap-1">
                  <span className="font-medium">Expected Value</span>
                  <span className="text-muted-foreground text-sm">
                    Compare upside, downside, and probability-weighted outcomes.
                  </span>
                </Stack>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <Sigma />
                <Stack className="gap-1">
                  <span className="font-medium">Sample Size</span>
                  <span className="text-muted-foreground text-sm">
                    Estimate experiment volume before you launch.
                  </span>
                </Stack>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export const Default: Story = {
  render: () => <DocsNavigation />,
}

export const ThemeMatrixStory: Story = {
  name: "Theme Matrix",
  render: () => <ThemeMatrix render={() => <DocsNavigation />} />,
}
