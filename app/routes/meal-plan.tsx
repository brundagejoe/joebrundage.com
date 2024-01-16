import { PlusCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { XIcon } from "lucide-react";
import React, { useState } from "react";

export default function MealPlan() {
  const [entries, setEntries] = useState<{ text: string; id: number }[]>([
    { text: "", id: 0 },
  ]);

  const addEntry = () => {
    setEntries((v) => [
      ...v,
      {
        text: "",
        id: Math.floor(Math.random() * 100_000),
      },
    ]);
  };

  const handleChangeText = (index: number, value: string) => {
    setEntries((v) => {
      const newEntries = [...v];
      newEntries[index] = {
        ...newEntries[index],
        text: value,
      };
      return newEntries;
    });
  };

  const handleClickEnter = (index: number) => {
    if (index === entries.length - 1) {
      addEntry();
    }
  };

  const handleBlurInput = (index: number, value: string) => {
    if (index === entries.length - 1 && value === "") {
      setEntries((v) => v.slice(0, v.length - 1));
    }
  };

  const handleClickDelete = (index: number) => {
    setEntries((v) => v.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-10 flex flex-col items-center gap-y-4">
      <h1 className="text-3xl font-bold">Weekly meal plan</h1>
      <div className="flex flex-row gap-x-2">
        <div className="flex flex-col items-center divide-y-2 divide-solid divide-black rounded-lg border-2 border-black">
          <div className="p-2 text-2xl font-bold">Input</div>

          <div className="flex w-[250px] flex-col items-center gap-y-3 py-2">
            {entries.map((entry, index) => (
              <Card
                value={entry.text}
                key={`input-${entry.id}`}
                onHitEnter={() => handleClickEnter(index)}
                onClose={() => handleClickDelete(index)}
                onChange={(value) => handleChangeText(index, value)}
                onBlurInput={(value) => handleBlurInput(index, value)}
                defaultToEditMode={entries.length - 1 === index && index !== 0}
              />
            ))}

            <PlusCircleIcon
              className="mt-2 h-8 w-8"
              onClick={() => addEntry()}
            />
          </div>
        </div>
        <div className="flex h-fit flex-col items-center divide-y-2 divide-solid divide-black rounded-lg border-2 border-black">
          <div className="p-2 text-2xl font-bold">Monday</div>
          <div className="flex h-[125px] w-[250px] items-center justify-center">
            <Card />
          </div>
          <div className="h-[125px] w-[250px]" />
        </div>
      </div>
    </div>
  );
}

const Card = ({
  value,
  onClose,
  onChange,
  onHitEnter,
  onBlurInput,
  defaultToEditMode,
}: {
  value?: string;
  onClose?: () => void;
  onChange?: (newValue: string) => void;
  onHitEnter?: () => void;
  onBlurInput?: (value: string) => void;
  defaultToEditMode?: boolean;
}) => {
  return (
    <div className="group relative flex h-[100px] w-[200px] items-center justify-center rounded-lg shadow-md outline outline-1 outline-gray-200">
      <XIcon
        className="absolute right-1 top-1 hidden h-4 w-4 rounded-full group-hover:flex"
        onClick={onClose}
      />
      <div className="px-6 text-center">
        <EditableText
          onChange={onChange}
          initialValue={value}
          fontSize={18}
          bold
          selectOnFocus
          onHitEnter={onHitEnter}
          onBlurInput={onBlurInput}
          defaultToEditMode={defaultToEditMode}
        />
      </div>
    </div>
  );
};

const EditableText = ({
  initialValue = "",
  placeHolder = "Click to add text",
  onChange,
  fontSize = 16,
  bold,
  selectOnFocus,
  defaultToEditMode,
  onHitEnter,
  onBlurInput,
}: {
  initialValue?: string;
  placeHolder?: string;
  onChange?: (newValue: string) => void;
  fontSize?: number;
  bold?: boolean;
  selectOnFocus?: boolean;
  defaultToEditMode?: boolean;
  onHitEnter?: (value: string) => void;
  onBlurInput?: (value: string) => void;
}) => {
  const [text, setText] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(defaultToEditMode);

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
      onHitEnter && onHitEnter(text);
    } else if (event.key === "Escape") {
      setIsEditing(false);
      onBlurInput && onBlurInput(text);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlurInput && onBlurInput(text);
  };

  const textStyle = {
    fontSize: `${fontSize}px`,
    fontWeight: bold ? "bold" : "normal",
  };

  const calculateInputSize = () => {
    if (text.length === 0) {
      return 1;
    } else {
      return text.length;
    }
  };
  return (
    <div className="relative">
      {isEditing ? (
        <input
          style={textStyle}
          autoFocus
          size={calculateInputSize()}
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform rounded-lg px-1 text-center outline-2"
          onFocus={(e) => selectOnFocus && e.target.select()}
          onBlur={handleBlur}
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
      )}
    </div>
  );
};
