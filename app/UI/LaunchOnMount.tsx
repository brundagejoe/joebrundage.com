import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"

interface LaunchOnMountProps {
  children: React.ReactNode
  className?: string
  delay?: number
  enterFrom?: string
  enterTo?: string
}

const LaunchOnMount = ({
  className,
  children,
  delay = 0,
  enterFrom = "scale-150 opacity-0",
  enterTo = "scale-100 opacity-100",
}: LaunchOnMountProps) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Transition
      show={mounted}
      appear={true}
      enter="transition-all duration-1000"
      enterFrom={enterFrom}
      className={className}
      enterTo={enterTo}
    >
      {children}
    </Transition>
  )
}

export default LaunchOnMount
