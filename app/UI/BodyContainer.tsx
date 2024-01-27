import clsx from "clsx"
interface BodyContainerProps {
  serif?: boolean
  children?: React.ReactNode
}
const BodyContainer = ({ children, serif }: BodyContainerProps) => {
  return (
    <div
      className={clsx(
        "mx-4 flex flex-col items-center lg:mx-10",
        serif && "font-serif",
      )}
    >
      {children}
    </div>
  )
}

export default BodyContainer
