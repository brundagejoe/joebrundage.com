import { Link } from "@remix-run/react"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export const Title = ({
  children,
  type = "h2",
  href,
  className,
}: {
  children?: React.ReactNode
  type?: "h1" | "h2"
  href?: string
  className?: string
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "font-black -tracking-[0.4px]",
          href &&
            "cursor-pointer underline-offset-4 transition-colors hover:underline",
          type === "h1" ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl",
        ),
        className,
      )}
    >
      {href ? (
        <Link target="_blank" to={href}>
          {children}
        </Link>
      ) : (
        children
      )}
    </div>
  )
}

export const Text = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={twMerge(
        "max-w-md text-base font-normal leading-relaxed text-gray-700",
        className,
      )}
    >
      {children}
    </div>
  )
}
