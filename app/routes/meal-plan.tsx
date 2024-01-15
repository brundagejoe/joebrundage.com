import { PlusCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import React, { useState } from "react";

export default function MealPlan() {
  const [numEntries, setNumEntries] = useState(1);

  return (
    <div className="mx-10 flex flex-col items-center gap-y-4">
      <h1 className="text-3xl font-bold">Weekly meal plan</h1>
      <div className="flex flex-col items-center divide-y-2 divide-solid divide-black rounded-lg border-2 border-black">
        <div className="p-2 text-2xl font-bold">Input</div>
        <div className="flex flex-col items-center px-4 pb-1 pt-2">
          <div className="flex flex-col gap-y-2">
            {Array.from({ length: numEntries }).map((_, index) => (
              <div
                key={`input-${index}`}
                className="w-[200px] rounded-lg border-2 border-black px-4 py-1 text-xl font-bold"
              >
                <EditableText value="Pasta" fontSize={20} bold selectOnFocus />
              </div>
            ))}
          </div>

          <PlusCircleIcon
            className="mt-2 h-8 w-8"
            onClick={() => setNumEntries((v) => v + 1)}
          />
        </div>
      </div>
    </div>
  );
}

const EditableText = ({
  value = "",
  placeHolder = "Click to add text",
  onChange,
  fontSize = 16,
  bold,
  selectOnFocus,
}: {
  value?: string;
  placeHolder?: string;
  onChange?: (newValue: string) => void;
  fontSize?: number;
  bold?: boolean;
  selectOnFocus?: boolean;
}) => {
  const [text, setText] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleClickText = () => {
    setIsEditing(true);
  };

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
    onChange && onChange(event.target.value);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setIsEditing(false);
    }
  };

  const textStyle = {
    fontSize: `${fontSize}px`,
    fontWeight: bold ? "bold" : "normal",
  };

  return isEditing ? (
    <input
      style={textStyle}
      autoFocus
      className="w-[168px] -translate-x-2 rounded-lg px-2 outline-2"
      onFocus={(e) => selectOnFocus && e.target.select()}
      onBlur={() => setIsEditing(false)}
      onKeyUp={handleKeyUp}
      value={text}
      onChange={handleChangeText}
    />
  ) : (
    <p
      className={clsx("cursor-pointer", !text && "text-gray-300")}
      onClick={handleClickText}
      style={textStyle}
    >
      {text ? text : placeHolder}
    </p>
  );
};
