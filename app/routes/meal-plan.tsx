import clsx from "clsx";
import React, { useState } from "react";
import { Draggable, Dropable } from "~/UI/DragAndDrop";

export default function MealPlan() {
  return (
    <div className="ml-4">
      <div>Meal plan</div>
      <EditableText value={"Hello"} />
      <EditableText fontSize={40} bold placeHolder="Title" />
      <div className="flex gap-x-2">
        <Dropable>
          <Draggable>
            <Test />
          </Draggable>
          <Draggable>
            <Test />
          </Draggable>
        </Dropable>
        <Dropable>
          <Draggable>
            <Test />
          </Draggable>
        </Dropable>
      </div>
    </div>
  );
}

const Test = () => {
  return (
    <div className="bg-red-400 w-fit p-10 rounded-lg">
      <EditableText value="Meal A" />
    </div>
  );
};

const EditableText = ({
  value = "",
  placeHolder = "Click to add text",
  onChange,
  fontSize = 16,
  bold,
}: {
  value?: string;
  placeHolder?: string;
  onChange?: (newValue: string) => void;
  fontSize?: number;
  bold?: boolean;
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
      className="outline outline-2 rounded-lg px-2 -translate-x-2"
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
