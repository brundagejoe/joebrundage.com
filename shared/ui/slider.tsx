"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/shared/lib/utils"

function Slider({
  className,
  ...props
}: SliderPrimitive.Root.Props<number> & { className?: string }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full items-center"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="bg-input relative h-2 w-full overflow-hidden rounded-full"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="bg-primary absolute h-full"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="border-primary bg-background ring-offset-background focus-visible:ring-ring/50 block size-4 rounded-full border shadow-sm transition-colors outline-none focus-visible:ring-[3px] data-disabled:pointer-events-none data-disabled:opacity-50"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
