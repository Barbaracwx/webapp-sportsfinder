// components/RangeSlider.tsx
"use client"; // Mark as a Client Component

import { useState, useEffect, useRef } from "react";

interface RangeSliderProps {
  initialMin: number;
  initialMax: number;
  min: number;
  max: number;
  step: number;
  onChange: (newRange: [number, number]) => void;
}

const RangeSlider = ({ initialMin, initialMax, min, max, step, onChange }: RangeSliderProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);

  const handleMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value);
    if (newMin <= maxValue) {
      setMinValue(newMin);
      onChange([newMin, maxValue]);
    }
  };

  const handleMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value);
    if (newMax >= minValue) {
      setMaxValue(newMax);
      onChange([minValue, newMax]);
    }
  };

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.left = (minValue / max) * 100 + "%";
      progressRef.current.style.right = 100 - (maxValue / max) * 100 + "%";
    }
  }, [minValue, maxValue, max]);

  return (
    <div className="mb-4">
      <div className="slider relative h-1 rounded-md bg-gray-300">
        <div
          className="progress absolute h-1 bg-blue-300 rounded" // Progress bar color
          ref={progressRef}
        ></div>
      </div>

      <div className="range-input relative">
        <input
          onChange={handleMin}
          onInput={handleMin} // Add onInput for real-time updates
          type="range"
          min={min}
          step={step}
          max={max}
          value={minValue}
          className="range-min absolute w-full -top-1 h-1 bg-transparent appearance-none cursor-pointer"
        />

        <input
          onChange={handleMax}
          onInput={handleMax} // Add onInput for real-time updates
          type="range"
          min={min}
          step={step}
          max={max}
          value={maxValue}
          className="range-max absolute w-full -top-1 h-1 bg-transparent appearance-none cursor-pointer"
        />
      </div>

      <div className="mt-2 text-center">
        Age range: {minValue} - {maxValue}
      </div>
    </div>
  );
};

export default RangeSlider;