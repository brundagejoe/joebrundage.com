import { Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ShowMoreButtonProps {
  onClick?: () => void;
  isActive: boolean;
}

const ShowMoreButton = ({ onClick, isActive }: ShowMoreButtonProps) => {
  return (
    <div
      className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-black"
      onClick={onClick}
    >
      <Transition
        show={!isActive}
        enter="transition-all duration-500 "
        enterFrom="opacity-0 -translate-x-4 translate-y-2 -rotate-45"
        enterTo="opacity-100"
        leave="transition-all duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0 -translate-x-4 translate-y-2 -rotate-45"
        className="absolute"
      >
        <EllipsisVerticalIcon className="h-6 w-6 text-black" />
      </Transition>
      <Transition
        show={isActive}
        enter="transition-all duration-500"
        enterFrom="opacity-0 translate-x-2 translate-y-2 rotate-45"
        enterTo="opacity-100"
        leave="transition-all duration-75"
        leaveFrom="opacity-100"
        leaveTo="opacity-0 translate-x-2 translate-y-2 rotate-45"
        className="absolute"
      >
        <XMarkIcon className="h-6 w-6 text-black" />
      </Transition>
    </div>
  );
};

export default ShowMoreButton;
