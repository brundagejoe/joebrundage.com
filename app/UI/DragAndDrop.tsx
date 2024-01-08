import type { ReactElement } from "react";
import React, { useRef, useState } from "react";
import clsx from "clsx";

export const Dropable = ({
  children,
}: {
  children?: ReactElement | ReactElement[];
}) => {
  const [outline, setOutline] = useState(false);
  const enterTarget = useRef<HTMLElement | null>(null);
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    enterTarget.current = e.target as HTMLElement;
    e.preventDefault();
    setOutline(true);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (enterTarget.current !== e.target) {
      return;
    }
    e.preventDefault();
    setOutline(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOutline(false);
  };

  return (
    <div
      className={clsx(
        "bg-blue-400 w-[400px] h-[400px] rounded-xl p-4",
        outline && "outline-red-600 outline-2 outline"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

export const Draggable = ({ children }: { children?: ReactElement }) => {
  const [isHidden, setIsHidden] = useState(false);
  const altKeyDown = useRef(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "copy";
    altKeyDown.current = e.altKey;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    !altKeyDown.current && setIsHidden(true);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsHidden(false);
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={clsx("w-fit hover:cursor-grab", isHidden && "opacity-0")}
      >
        {children}
      </div>
    </>
  );
};
