import type { ReactElement } from "react";
import React, { useRef, useState } from "react";
import clsx from "clsx";

export const Droppable = ({
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

  const [showTest, setShowTest] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOutline(false);

    setShowTest(true);
  };

  return (
    <div
      className={clsx(
        "h-[400px] w-[400px] rounded-xl bg-blue-400 p-4",
        outline && "outline outline-2 outline-red-600",
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {showTest && <div>Test</div>}
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
    <div
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={clsx("w-fit hover:cursor-grab", isHidden && "opacity-0")}
    >
      {children}
    </div>
  );
};

const Test = ({ text }: { text: string }) => {
  return <div className="w-fit rounded-lg bg-red-400 p-10">{text}</div>;
};

export const DragAndDropBoard = () => {
  return (
    <div className="flex gap-x-2">
      <Droppable>
        <Draggable>
          <Test text={"Alpha"} />
        </Draggable>
        <Draggable>
          <Test text={"Bravo"} />
        </Draggable>
      </Droppable>
      <Droppable>
        <Draggable>
          <Test text={"Charlie"} />
        </Draggable>
      </Droppable>
    </div>
  );
};
