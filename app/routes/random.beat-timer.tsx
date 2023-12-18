import clsx from "clsx";
import { useEffect, useState } from "react";
import { Slider } from "~/shadcn-ui-components/ui/slider";
import { Switch } from "~/shadcn-ui-components/ui/switch";
import socialImage from "../images/beat-timer-social.png";

export const meta = () => {
  return [
    { title: "Beat calculator" },
    {
      property: "og:image",
      content: `https://joebrundage.com${socialImage}`,
    },
  ];
};

const BeatTimer = () => {
  console.log(socialImage);
  const [metronomeSelected, setMetronomeSelected] = useState(false);
  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="flex items-center gap-x-2 mb-4">
        <div
          className={clsx(
            "cursor-pointer font-semibold",
            metronomeSelected ? "text-gray-400" : "text-black"
          )}
          onClick={() => setMetronomeSelected(false)}
        >
          Calculator
        </div>
        <Switch
          checked={metronomeSelected}
          onClick={() => setMetronomeSelected((v) => !v)}
        />
        <div
          className={clsx(
            "cursor-pointer font-semibold",
            !metronomeSelected ? "text-gray-400" : "text-black"
          )}
          onClick={() => setMetronomeSelected(true)}
        >
          Metronome
        </div>
      </div>
      {metronomeSelected ? <Metronome /> : <Tapper />}
    </div>
  );
};

export default BeatTimer;

/**
 * Will calculate the beats per minute using at most the last 4 button presses.
 * If there are less than 4 button presses, it will use all of them.
 * @param pressedTimes the times of the button presses
 * @returns a number in beats per minute
 */
const calculateBeatsPerMinute = (pressedTimes: number[]) => {
  if (pressedTimes.length === 0) return 0;

  const lastFourPressedTimes = pressedTimes.slice(-5);

  const lastFourIntervals = lastFourPressedTimes
    .slice(1)
    .map((time, index) => time - lastFourPressedTimes[index]);

  if (lastFourIntervals.length === 0) return 0;

  const averageInterval = lastFourIntervals.reduce((a, b) => a + b) / 4;

  const beatsPerMinute = 60000 / averageInterval;

  return beatsPerMinute;
};

const Metronome = () => {
  const [showBeat, setShowBeat] = useState(false);

  const defaultBpm = 100;

  const [bpm, setBpm] = useState(defaultBpm);

  useEffect(() => {
    const interval = setInterval(() => {
      hitBeat();
    }, 60000 / bpm);

    return () => clearInterval(interval);
  }, [bpm]);

  const hitBeat = () => {
    setShowBeat(true);
    const timer = setTimeout(() => {
      setShowBeat(false);
    }, 150);

    return () => clearTimeout(timer);
  };
  return (
    <>
      <div
        className={clsx(
          "rounded-xl cursor-pointer w-4/5 h-[300px] flex flex-col justify-center items-center",
          showBeat ? "bg-gray-700" : "bg-gray-900"
        )}
      >
        <p className="select-none text-4xl font-semibold text-white">
          {bpm} bpm
        </p>
      </div>
      <Slider
        className="w-4/5 md:w-3/5 mt-4"
        defaultValue={[defaultBpm]}
        onValueChange={(value) => setBpm(value[0])}
        max={200}
        step={1}
      />
    </>
  );
};

const Tapper = () => {
  const [disableButton, setDisableButton] = useState(false);
  const [pressedTimes, setPressedTimes] = useState<number[]>([]);

  const handleClick = () => {
    if (disableButton) return;

    setDisableButton(true);

    setPressedTimes([...pressedTimes, performance.now()]);

    const timer = setTimeout(() => {
      setDisableButton(false);
    }, 150);

    return () => clearTimeout(timer);
  };

  const calculatedBpm = calculateBeatsPerMinute(pressedTimes);
  return (
    <div
      className={clsx(
        "rounded-xl cursor-pointer w-4/5 h-[300px] flex flex-col justify-center items-center",
        disableButton ? "bg-gray-700" : "bg-gray-900"
      )}
      onClick={handleClick}
    >
      <p className="select-none text-4xl font-semibold text-white">
        {calculatedBpm > 0 && pressedTimes.length > 4
          ? `${Math.round(calculatedBpm)} bpm`
          : "Tap"}
      </p>
    </div>
  );
};
