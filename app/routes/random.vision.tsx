import { HamburgerMenuIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import { useState } from "react"

const VisionDemo = () => {
  return (
    <div className="bg-blue-100 px-10">
      <h1>Random Vision</h1>

      <HoverableExpander />
    </div>
  )
}

export default VisionDemo

const HoverableExpander = () => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="relative h-12 w-12">
      <div
        className={clsx(
          "absolute left-0 top-0 flex items-center justify-center rounded-3xl bg-gray-900/30 text-white backdrop-blur-sm transition-all duration-500",
          expanded ? "h-[200px] w-[300px]" : "h-12 w-12",
        )}
        style={{
          //Safari
          WebkitBackdropFilter: "blur(4px)",
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {expanded ? (
          <div>Content</div>
        ) : (
          <HamburgerMenuIcon className="h-6 w-6" />
        )}
      </div>
    </div>
  )
}
