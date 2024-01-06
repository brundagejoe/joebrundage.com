import clsx from "clsx";

interface ShowMoreButtonProps {
  onClick?: () => void;
  isActive: boolean;
}

const ShowMoreButton = ({ onClick, isActive }: ShowMoreButtonProps) => {
  return (
    <div
      className="flex flex-col gap-y-[3px] h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-black"
      onClick={onClick}
    >
      <div
        className={clsx(lineClass, isActive && "rotate-45 translate-y-[5px]")}
      />
      <div className={clsx(lineClass, isActive && "opacity-0 scale-0")} />
      <div
        className={clsx(lineClass, isActive && "-rotate-45 -translate-y-[5px]")}
      />
    </div>
  );
};

const lineClass =
  "border w-[18px] border-black rounded-xl transition-all duration-500";

export default ShowMoreButton;
