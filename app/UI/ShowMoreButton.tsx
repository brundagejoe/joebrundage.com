import clsx from "clsx"

interface ShowMoreButtonProps {
  onClick?: () => void
  isActive: boolean
}

const ShowMoreButton = ({ onClick, isActive }: ShowMoreButtonProps) => {
  return (
    <div
      className="flex h-8 w-8 cursor-pointer flex-col items-center justify-center gap-y-[3px] overflow-hidden rounded-full border-2 border-black"
      onClick={onClick}
    >
      <div
        className={clsx(lineClass, isActive && "translate-y-[5px] rotate-45")}
      />
      <div className={clsx(lineClass, isActive && "scale-0 opacity-0")} />
      <div
        className={clsx(lineClass, isActive && "-translate-y-[5px] -rotate-45")}
      />
    </div>
  )
}

const lineClass =
  "border w-[18px] border-black rounded-xl transition-all duration-500"

export default ShowMoreButton
